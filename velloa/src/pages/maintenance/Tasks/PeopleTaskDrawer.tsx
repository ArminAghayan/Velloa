import React, { useEffect, useState } from 'react';
import {
  Drawer,
  Form,
  Input,
  Radio,
  DatePicker,
  Select,
  Switch, // Import Switch
  Upload,
  Button,
  Space,
  Row,
  Col,
  message,
  Divider,
  Typography,
} from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import {
  collection,
  getDocs,
  getDoc,
  doc,
  setDoc,
  Timestamp,
  query,
  where,
  QueryDocumentSnapshot,
  DocumentData,
} from 'firebase/firestore';
import { db } from '../../../firebase-config'; // Ensure this path is correct
import './NewTaskDrawer.css';
import { customAlphabet } from 'nanoid';
import { useParams } from 'react-router-dom'; // Add this import if not already present

const { TextArea } = Input;
const { Dragger } = Upload;
const { Title } = Typography;

interface NewTaskDrawerProps {
  visible: boolean;
  onClose: () => void;
  companyId: string;
  personId: string; // Add this line
}

interface TaskFormValues {
  subject: string;
  description?: string;
  taskFrequency: 'oneTime' | 'recurring';
  recurringFrequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate?: Date;
  endDate?: Date;
  dueDate?: Date;
  status: string;
  priority: string;
  assignees?: string[];
  notifyAssignees: boolean;
  relatedTo: string;
  relatedToName: string; // Add this line
  attachments?: UploadFile[];
}

interface Assignee {
  uid: string;
  name: string;
}

interface Person {
  id: string;
  name: string;
}

// Add this function outside of the component
const generateTaskRefId = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 8);

const NewTaskDrawer: React.FC<NewTaskDrawerProps> = ({
  visible,
  onClose,
  companyId,
  personId,
}) => {
  const [form] = Form.useForm<TaskFormValues>();
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [loadingAssignees, setLoadingAssignees] = useState<boolean>(false);
  const [loadingPeople, setLoadingPeople] = useState<boolean>(false);
  const [currentPerson, setCurrentPerson] = useState<Person | null>(null);

  useEffect(() => {
    if (visible) {
      fetchAssignees();
      fetchPeople();
      if (personId) {
        console.log('Fetching current person with ID:', personId);
        fetchCurrentPerson(personId);
      } else {
        console.log('No personId available');
      }
    } else {
      form.resetFields();
      setAssignees([]);
      setPeople([]);
      setCurrentPerson(null);
    }
  }, [visible, companyId, personId]);

  const fetchAssignees = async () => {
    setLoadingAssignees(true);
    try {
      console.log('Fetching assignees for company:', companyId);

      const usersQuery = query(
        collection(db, 'users'),
        where('companyuid', '==', companyId)
      );

      const usersSnapshot = await getDocs(usersQuery);

      console.log(`Found ${usersSnapshot.size} users for company ${companyId}`);

      if (usersSnapshot.empty) {
        console.warn('No users found for this company');
        message.warning('No users found for this company.');
        setAssignees([]);
        return;
      }

      const assigneeData: Assignee[] = usersSnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
        const userData = doc.data();
        if (!userData.firstName || !userData.lastName) {
          console.warn('User document missing name fields:', doc.id, userData);
        }
        return {
          uid: doc.id,
          name: `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'Unknown User',
        };
      });

      console.log('Processed assignee data:', assigneeData);

      setAssignees(assigneeData);
    } catch (error) {
      console.error('Error fetching assignees:', error);
      if (error instanceof Error) {
        message.error(`Failed to fetch assignees: ${error.message}`);
      } else {
        message.error('Failed to fetch assignees due to an unknown error.');
      }
    } finally {
      setLoadingAssignees(false);
    }
  };

  const fetchPeople = async () => {
    setLoadingPeople(true);
    try {
      console.log('Fetching people for company ID:', companyId);

      const peopleQuery = query(collection(db, 'people'), where('companyId', '==', companyId));
      const querySnapshot = await getDocs(peopleQuery);
      
      console.log(`Found ${querySnapshot.docs.length} people for company ${companyId}`);

      if (querySnapshot.empty) {
        console.warn('No people found for this company');
        message.warning('No people found for this company.');
        setPeople([]);
        return;
      }

      const peopleData: Person[] = querySnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
        const personData = doc.data();
        console.log('Person data:', personData);
        return {
          id: doc.id,
          name: `${personData.firstName || ''} ${personData.lastName || ''}`.trim() || 'Unknown Person',
        };
      });
      
      console.log('All fetched people:', peopleData);
      setPeople(peopleData);

      if (peopleData.length === 0) {
        console.warn('No valid people data found');
        message.warning('No valid people data found.');
      }
    } catch (error) {
      console.error('Error fetching people:', error);
      if (error instanceof Error) {
        message.error(`Failed to fetch people: ${error.message}`);
      } else {
        message.error('Failed to fetch people due to an unknown error.');
      }
    } finally {
      setLoadingPeople(false);
    }
  };

  const fetchCurrentPerson = async (id: string) => {
    try {
      console.log('Fetching person with ID:', id);
      const personDoc = await getDoc(doc(db, 'people', id));
      if (personDoc.exists()) {
        const personData = personDoc.data();
        const personName = `${personData.firstName || ''} ${personData.lastName || ''}`.trim() || 'Unknown Person';
        console.log('Person found:', { id: personDoc.id, name: personName });
        setCurrentPerson({ id: personDoc.id, name: personName });
        form.setFieldsValue({ 
          relatedTo: personDoc.id, 
          relatedToName: personName 
        });
        console.log('Form values set:', { relatedTo: personDoc.id, relatedToName: personName });
      } else {
        console.error('Person not found for ID:', id);
        message.error('Person not found');
      }
    } catch (error) {
      console.error('Error fetching person:', error);
      message.error('Failed to fetch person details');
    }
  };

  const onFinish = async (values: TaskFormValues) => {
    try {
      const startDateTimestamp = values.startDate
        ? Timestamp.fromDate(new Date(values.startDate))
        : null;
      
      const endDateTimestamp = values.endDate
        ? Timestamp.fromDate(new Date(values.endDate))
        : null;

      const dueDateTimestamp = values.dueDate
        ? Timestamp.fromDate(new Date(values.dueDate))
        : null;

      // Fetch person name
      const personDoc = await getDoc(doc(db, 'people', values.relatedTo));
      const personData = personDoc.data();
      const personName = `${personData?.firstName || ''} ${personData?.lastName || ''}`.trim() || 'Unknown Person';

      const attachments = values.attachments
        ? values.attachments.map((file) => ({
            name: file.name,
            url: file.url || '',
          }))
        : [];

      const taskRefId = generateTaskRefId();

      const maintenanceRef = doc(collection(db, 'maintenance'));

      const assigneesData = values.assignees && values.assignees.length > 0
        ? await Promise.all(values.assignees.map(async (assigneeId) => {
            const assigneeDoc = await getDoc(doc(db, 'users', assigneeId));
            const assigneeData = assigneeDoc.data();
            return {
              uid: assigneeId,
            };
          }))
        : [];

      await setDoc(maintenanceRef, {
        ...values,
        companyId,
        createdAt: Timestamp.now(),
        startDate: startDateTimestamp,
        endDate: endDateTimestamp,
        dueDate: dueDateTimestamp,
        attachments,
        notifyAssignees: values.notifyAssignees || false,
        assignees: assigneesData,
        relatedToName: personName,
        taskType: 'Task',
        subTaskType: 'People',
        taskRefId, // Add this line
        description: values.description || '', // This can now be an empty string if not provided
      });
      message.success('Maintenance task created successfully');
      form.resetFields();
      onClose();
    } catch (error) {
      console.error('Error saving maintenance task:', error);
      if (error instanceof Error) {
        message.error(`Failed to create maintenance task: ${error.message}`);
      } else {
        message.error(
          'Failed to create maintenance task due to an unknown error.'
        );
      }
    }
  };

  const uploadProps = {
    name: 'file',
    multiple: true,
    action: 'https://www.mocky.io/v2/5cc8019d300000980a055e76', // Replace with your actual upload endpoint
    onChange(info: any) {
      const { status } = info.file;
      if (status !== 'uploading') {
        console.log(info.file, info.fileList);
      }
      if (status === 'done') {
        message.success(`${info.file.name} file uploaded successfully.`);
      } else if (status === 'error') {
        message.error(`${info.file.name} file upload failed.`);
      }
    },
    onDrop(e: React.DragEvent<HTMLDivElement>) {
      console.log('Dropped files', e.dataTransfer.files);
    },
  };

  return (
    <Drawer
      title={<span style={{ color: '#28A745' }}>New Task</span>}
      placement="right"
      className="new-task-drawer"
      onClose={onClose}
      open={visible}
      width="50%"
      footer={
        <div style={{ textAlign: 'right' }}>
          <Space>
            <Button onClick={onClose}>Cancel</Button>
            <Button onClick={() => form.submit()} type="primary">
              Save
            </Button>
          </Space>
        </div>
      }
    >
      <Form<TaskFormValues>
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{ notifyAssignees: false, taskFrequency: 'oneTime' }}
      >
        <Form.Item
          name="subject"
          label="Subject"
          rules={[{ required: true, message: 'Please enter a subject' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="description"
          label="Description"
          rules={[{ required: false }]} // Changed to false
        >
          <Input.TextArea rows={4} placeholder="Enter task description" />
        </Form.Item>

        <Divider />

        <Form.Item
          name="taskFrequency"
          label="Task Frequency"
          rules={[{ required: true, message: 'Please select task frequency' }]}
        >
          <Radio.Group>
            <Radio value="oneTime">One Time Task</Radio>
            <Radio value="recurring">Recurring Task</Radio>
          </Radio.Group>
        </Form.Item>

        <Form.Item
          noStyle
          shouldUpdate={(prevValues, currentValues) => prevValues.taskFrequency !== currentValues.taskFrequency}
        >
          {({ getFieldValue }) =>
            getFieldValue('taskFrequency') === 'recurring' ? (
              <>
                <Form.Item
                  name="recurringFrequency"
                  label="Recurring Frequency"
                  rules={[{ required: true, message: 'Please select recurring frequency' }]}
                >
                  <Radio.Group>
                    <Radio.Button value="daily">Daily</Radio.Button>
                    <Radio.Button value="weekly">Weekly</Radio.Button>
                    <Radio.Button value="monthly">Monthly</Radio.Button>
                    <Radio.Button value="yearly">Yearly</Radio.Button>
                  </Radio.Group>
                </Form.Item>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="startDate"
                      label="Start Date"
                      rules={[{ required: true, message: 'Please select a start date' }]}
                    >
                      <DatePicker style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="endDate"
                      label="End Date"
                      rules={[{ required: true, message: 'Please select an end date' }]}
                    >
                      <DatePicker style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                </Row>
              </>
            ) : (
              <Form.Item
                name="dueDate"
                label="Due Date"
                rules={[{ required: true, message: 'Please select a due date' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            )
          }
        </Form.Item>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="status"
              label="Status"
              rules={[{ required: true, message: 'Please select a status' }]}
            >
              <Select placeholder="Select status">
                <Select.Option value="Not Started">Not Started</Select.Option>
                <Select.Option value="In Progress">In Progress</Select.Option>
                <Select.Option value="Completed">Completed</Select.Option>
              </Select>
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item
              name="priority"
              label="Priority"
              rules={[{ required: true, message: 'Please select a priority' }]}
            >
              <Select placeholder="Select priority">
                <Select.Option value="Low">Low</Select.Option>
                <Select.Option value="Medium">Medium</Select.Option>
                <Select.Option value="High">High</Select.Option>
              </Select>
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item
              name="assignees"
              label="Assignees"
              rules={[{ required: false }]} // Changed to false
            >
              <Select
                mode="multiple"
                placeholder="Select assignees"
                loading={loadingAssignees}
                allowClear
              >
                {assignees.map((assignee) => (
                  <Select.Option key={assignee.uid} value={assignee.uid}>
                    {assignee.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="notifyAssignees"
          label="Notify Assignee(s)" // Added label
          valuePropName="checked"
        >
          <Switch /> {/* Replaced Checkbox with Switch */}
        </Form.Item>

        <Divider />

        <Title level={4}>Related to</Title>
        <Form.Item
          name="relatedToName"
          label="Related to"
          rules={[{ required: true, message: 'Related person is required' }]}
        >
          <Input disabled />
        </Form.Item>

        <Form.Item name="relatedTo" hidden>
          <Input />
        </Form.Item>

        <Form.Item name="attachments" label="Attachments">
          <Dragger {...uploadProps} style={{ width: '115%' }}>
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">
              Click or drag file to this area to upload
            </p>
            <p className="ant-upload-hint">
              Support for a single or bulk upload. Strictly prohibit from uploading company data or other
              sensitive files.
            </p>
          </Dragger>
        </Form.Item>
      </Form>
    </Drawer>
  );
};

export default NewTaskDrawer;
