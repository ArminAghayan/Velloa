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

const { TextArea } = Input;
const { Dragger } = Upload;
const { Title } = Typography;

interface NewTaskDrawerProps {
  visible: boolean;
  onClose: () => void;
  companyId: string;
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
  attachments?: UploadFile[];
}

interface Assignee {
  uid: string;
  name: string;
}

interface Property {
  id: string;
  name: string;
}

// Add this function outside of the component
const generateTaskRefId = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 8);

const NewTaskDrawer: React.FC<NewTaskDrawerProps> = ({
  visible,
  onClose,
  companyId,
}) => {
  const [form] = Form.useForm<TaskFormValues>();
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loadingAssignees, setLoadingAssignees] = useState<boolean>(false);
  const [loadingProperties, setLoadingProperties] = useState<boolean>(false);

  useEffect(() => {
    if (visible) {
      fetchAssignees();
      fetchProperties();
    } else {
      form.resetFields();
      setAssignees([]);
      setProperties([]);
    }
  }, [visible, companyId]);

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

  const fetchProperties = async () => {
    setLoadingProperties(true);
    try {
      console.log('Fetching properties for company ID:', companyId);

      const companyDoc = await getDoc(doc(db, 'companies', companyId));
      if (!companyDoc.exists()) {
        console.error('Company document not found for ID:', companyId);
        message.error('Company not found. Please check your company ID.');
        return;
      }
      
      const companyData = companyDoc.data();
      console.log('Found company:', companyData);

      const propertiesQuery = query(collection(db, 'properties'), where('companyuid', '==', companyId));
      const querySnapshot = await getDocs(propertiesQuery);
      
      console.log(`Found ${querySnapshot.docs.length} properties for company ${companyId}`);

      const propertiesData: Property[] = await Promise.all(querySnapshot.docs.map(async (doc: QueryDocumentSnapshot<DocumentData>) => {
        console.log(`Fetching settings for property ${doc.id}`);
        const propertySettingsSnapshot = await getDocs(collection(db, 'properties', doc.id, 'propertySettings'));
        const settingsDoc = propertySettingsSnapshot.docs[0];
        const settingsData = settingsDoc?.data() || {};
        
        return {
          id: doc.id,
          name: settingsData.propertyName || 'Unnamed Property',
        };
      }));
      
      console.log('All fetched properties:', propertiesData);
      setProperties(propertiesData);
    } catch (error) {
      console.error('Error fetching properties:', error);
      if (error instanceof Error) {
        message.error(`Failed to fetch properties: ${error.message}`);
      } else {
        message.error('Failed to fetch properties due to an unknown error.');
      }
    } finally {
      setLoadingProperties(false);
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

      // Fetch property name
      const propertyDoc = await getDoc(doc(db, 'properties', values.relatedTo));
      const propertyData = propertyDoc.data();
      const propertyName = propertyData?.propertyName || 'Unknown Property';

      const attachments = values.attachments
        ? values.attachments.map((file) => ({
            name: file.name,
            url: file.url || '',
          }))
        : [];

      const taskRefId = generateTaskRefId();

      const maintenanceRef = doc(collection(db, 'maintenance'));
      await setDoc(maintenanceRef, {
        ...values,
        companyId,
        createdAt: Timestamp.now(),
        startDate: startDateTimestamp,
        endDate: endDateTimestamp,
        dueDate: dueDateTimestamp,
        attachments,
        notifyAssignees: values.notifyAssignees || false,
        assignees: values.assignees,
        relatedToName: propertyName,
        description: values.description || '', // This can now be an empty string if not provided
        taskType: 'Task',
        taskRefId, // Add this line
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

        <Form.Item name="description" label="Description">
          <TextArea rows={4} />
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
              rules={[
                {
                  required: true,
                  message: 'Please select at least one assignee',
                },
              ]}
            >
              <Select
                mode="multiple"
                className="assignees-select"
                placeholder="Select assignees"
                loading={loadingAssignees}
                allowClear
                style={{ width: '100%' }}
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
          name="relatedTo"
          label="Property"
          rules={[{ required: true, message: 'Please select a property' }]}
        >
          <Select
            placeholder="Select a property"
            loading={loadingProperties}
            allowClear
          >
            {properties.map((property) => (
              <Select.Option key={property.id} value={property.id}>
                {property.name}
              </Select.Option>
            ))}
          </Select>
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