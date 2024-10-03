// TaskSubTaskDrawer.tsx
import React, { useEffect, useState } from 'react';
import {
  Drawer,
  Form,
  Input,
  Checkbox,
  DatePicker,
  Select,
  Upload,
  Button,
  Space,
  Row,
  Col,
  message,
  Divider,
} from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import {
  collection,
  getDocs,
  getDoc,
  doc,
  addDoc,
  Timestamp,
  query,
  where,
  QueryDocumentSnapshot,
  DocumentData,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../../../../firebase-config';
import { customAlphabet } from 'nanoid';
import dayjs, { Dayjs } from 'dayjs';
import './TaskUpdateDrawer.css';

const { TextArea } = Input;
const { Dragger } = Upload;

interface Subtask {
  id: string;
  subject: string;
  description?: string;
  dueDate?: Timestamp | string;
  status: string;
  priority: string;
  assignees?: Array<{ uid: string; name: string }>;
  // Add any other fields that are part of your Subtask structure
}

interface TaskSubTaskDrawerProps {
  visible: boolean;
  onClose: () => void;
  companyId: string;
  parentTaskId: string;
  onSubtaskAdded?: () => void;
  editingSubtask: Subtask | null;
}

interface TaskFormValues {
  subject: string;
  description?: string;
  dueDate?: Dayjs | null;
  status: string;
  priority: string;
  assignees?: string[];
  notifyAssignees: boolean;
  attachments?: UploadFile[];
}

interface Assignee {
  uid: string;
  name: string;
}

const generateTaskRefId = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 8);

const TaskSubTaskDrawer: React.FC<TaskSubTaskDrawerProps> = ({
  visible,
  onClose,
  companyId,
  parentTaskId,
  onSubtaskAdded,
  editingSubtask,
}) => {
  const [form] = Form.useForm<TaskFormValues>();
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [loadingAssignees, setLoadingAssignees] = useState<boolean>(false);

  useEffect(() => {
    if (visible) {
      fetchAssignees();
      if (editingSubtask) {
        populateForm(editingSubtask);
      } else {
        form.resetFields();
      }
    }
  }, [visible, companyId, editingSubtask, form]);

  const fetchAssignees = async () => {
    setLoadingAssignees(true);
    try {
      const usersQuery = query(
        collection(db, 'users'),
        where('companyuid', '==', companyId)
      );

      const usersSnapshot = await getDocs(usersQuery);

      if (usersSnapshot.empty) {
        console.warn('No users found for this company');
        message.warning('No users found for this company.');
        setAssignees([]);
        return;
      }

      const assigneeData: Assignee[] = usersSnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
        const userData = doc.data();
        return {
          uid: doc.id,
          name: `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'Unknown User',
        };
      });

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

  const populateForm = (data: Subtask) => {
    let dueDateDayjs: Dayjs | null = null;

    if (data.dueDate) {
      if (data.dueDate instanceof Timestamp) {
        dueDateDayjs = dayjs(data.dueDate.toDate());
      } else if (typeof data.dueDate === 'string') {
        dueDateDayjs = dayjs(data.dueDate);
        if (!dueDateDayjs.isValid()) {
          dueDateDayjs = null;
        }
      }
    }

    const formValues: TaskFormValues = {
      subject: data.subject,
      description: data.description,
      status: data.status,
      priority: data.priority,
      assignees: data.assignees?.map((assignee) => assignee.uid),
      dueDate: dueDateDayjs,
      notifyAssignees: false, // Set default value or fetch from data if available
    };

    form.setFieldsValue(formValues);
  };

  const onFinish = async (values: TaskFormValues) => {
    try {
      if (!parentTaskId) {
        throw new Error('Parent task ID is missing');
      }

      const dueDateTimestamp = values.dueDate
        ? Timestamp.fromDate(values.dueDate.toDate())
        : null;

      // Fetch full names of assignees
      const assigneeDetails = await Promise.all(
        values.assignees?.map(async (uid) => {
          const userDoc = await getDoc(doc(db, 'users', uid));
          const userData = userDoc.data();
          return {
            uid,
            name: `${userData?.firstName || ''} ${userData?.lastName || ''}`.trim(),
          };
        }) || []
      );

      const attachments = values.attachments
        ? values.attachments.map((file) => ({
            name: file.name,
            url: file.url || '',
          }))
        : [];

      const taskRefId = generateTaskRefId();

      const parentTaskRef = doc(db, 'maintenance', parentTaskId);
      const subtasksCollectionRef = collection(parentTaskRef, 'subtasks');

      if (editingSubtask) {
        // Update existing subtask
        const subtaskRef = doc(db, 'maintenance', parentTaskId, 'subtasks', editingSubtask.id);
        await updateDoc(subtaskRef, {
          subject: values.subject,
          description: values.description,
          dueDate: dueDateTimestamp,
          status: values.status,
          priority: values.priority,
          assignees: assigneeDetails,
          notifyAssignees: values.notifyAssignees,
          attachments,
        });
        message.success('Maintenance sub-task updated successfully');
      } else {
        // Create new subtask
        await addDoc(subtasksCollectionRef, {
          subject: values.subject,
          description: values.description,
          createdAt: Timestamp.now(),
          dueDate: dueDateTimestamp,
          status: values.status,
          priority: values.priority,
          assignees: assigneeDetails,
          notifyAssignees: values.notifyAssignees,
          attachments,
          taskType: 'Task',
          taskRefId,
          parentTaskId,
        });
        message.success('Maintenance sub-task created successfully');
      }

      form.resetFields();
      onClose();

      if (onSubtaskAdded) {
        onSubtaskAdded();
      }
    } catch (error) {
      console.error('Error saving maintenance sub-task:', error);
      if (error instanceof Error) {
        message.error(`Failed to save maintenance sub-task: ${error.message}`);
      } else {
        message.error('Failed to save maintenance sub-task due to an unknown error.');
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
      title={
        <span style={{ color: '#28A745' }}>
          {editingSubtask 
            ? `Edit Sub-Task - ${editingSubtask.subject}`
            : "New Sub-Task"
          }
        </span>
      }
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
        initialValues={{ notifyAssignees: false }}
      >
        <Form.Item
          name="subject"
          label="Title"
          rules={[{ required: true, message: 'Please enter a title' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item name="description" label="Description">
          <TextArea rows={4} />
        </Form.Item>

        <Divider />

        <Form.Item
          name="dueDate"
          label="Due Date"
          rules={[{ required: true, message: 'Please select a due date' }]}
        >
          <DatePicker
            style={{ width: '100%' }}
            format="MMMM D, YYYY [at] h:mm A"
            showTime
          />
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

        <Form.Item name="notifyAssignees" valuePropName="checked">
          <Checkbox>Notify Assignee(s)</Checkbox>
        </Form.Item>

        <Divider />

        <Form.Item name="attachments" label="Attachments">
          <Dragger {...uploadProps}>
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

export default TaskSubTaskDrawer;