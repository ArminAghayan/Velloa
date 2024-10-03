// TaskUpdateDrawer.tsx

import React, { useEffect, useState } from 'react';
import {
  Drawer,
  Form,
  Input,
  DatePicker,
  Select,
  Checkbox,
  Upload,
  Button,
  message,
  Divider,
  Row,
  Col,
  Typography,
} from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { db, storage } from '../../../../firebase-config';
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  Timestamp,
  DocumentData,
  QueryDocumentSnapshot,
  doc,
  updateDoc,
  getDoc,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { UploadFile, UploadChangeParam, RcFile } from 'antd/es/upload/interface';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import './TaskUpdateDrawer.css';

const { Dragger } = Upload;
const { TextArea } = Input;
const { Option } = Select;
const { Title, Text } = Typography;

// Interfaces
interface TaskUpdateDrawerProps {
  visible: boolean;
  onClose: () => void;
  taskId: string | undefined;
  taskData: MaintenanceData | null;
  companyId: string;
  onUpdateSuccess: () => void;
  onTaskCompleted: () => void; // New prop to handle task completion
}

interface Assignee {
  uid: string;
  name: string;
}

interface MaintenanceData {
  status: string;
  assignees?: { uid: string }[];
  priority: string;
  dueDate?: Timestamp | string;
  notifyAssignees?: boolean;
  // Add other fields as necessary
}

interface FormValues {
  note: string;
  dueDate?: Dayjs | null;
  status?: string;
  priority?: string;
  assignees?: string[];
  notifyAssignees?: boolean;
  // Add other fields as necessary
}

interface NewContent {
  content: string;
  createdAt: Timestamp;
  createdByUID: string;
  createdBy: string;
  attachments?: Attachment[];
}

interface Attachment {
  name: string;
  url: string;
}

const TaskUpdateDrawer: React.FC<TaskUpdateDrawerProps> = ({
  visible,
  onClose,
  taskId,
  taskData,
  companyId,
  onUpdateSuccess,
  onTaskCompleted, // Include the new prop
}) => {
  const [form] = Form.useForm<FormValues>();
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [loadingAssignees, setLoadingAssignees] = useState<boolean>(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState<boolean>(false);

  // Fetch assignees based on companyId
  const fetchAssignees = async () => {
    setLoadingAssignees(true);
    try {
      const usersQuery = query(collection(db, 'users'), where('companyuid', '==', companyId));
      const usersSnapshot = await getDocs(usersQuery);

      if (usersSnapshot.empty) {
        message.warning('No users found for this company.');
        setAssignees([]);
        return;
      }

      const assigneeData: Assignee[] = usersSnapshot.docs.map(
        (doc: QueryDocumentSnapshot<DocumentData>) => {
          const userData = doc.data();
          const name = `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'Unknown User';
          return {
            uid: doc.id,
            name,
          };
        }
      );

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

  // Initialize drawer
  useEffect(() => {
    if (visible) {
      const initializeDrawer = async () => {
        await fetchAssignees();
        if (taskData) {
          populateForm(taskData);
        } else {
          form.resetFields();
          setFileList([]);
        }
      };
      initializeDrawer();
    }
  }, [visible, companyId, taskData]);

  // Populate form with task data
  const populateForm = (data: MaintenanceData) => {
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

    const formValues: FormValues = {
      note: '',
      status: data.status || '',
      assignees: data.assignees?.map((assignee) => assignee.uid) || [],
      priority: data.priority || '',
      dueDate: dueDateDayjs,
      notifyAssignees: data.notifyAssignees || false,
    };

    form.setFieldsValue(formValues);
  };

  // Handle file uploads
  const handleUploadChange = ({ file, fileList: newFileList }: UploadChangeParam<UploadFile>) => {
    setFileList(newFileList);
    if (file.status === 'done') {
      message.success(`${file.name} uploaded successfully.`);
    } else if (file.status === 'error') {
      message.error(`${file.name} upload failed.`);
    }
  };

  // Custom upload handler to integrate with Firebase Storage
  const customUpload = async ({ file, onSuccess, onError }: any) => {
    if (!taskId) {
      message.error('Task ID is missing.');
      onError(new Error('Task ID is missing.'));
      return;
    }

    const storageRef = ref(storage, `attachments/${taskId}/${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file.originFileObj as RcFile);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        // Optionally, implement progress tracking
      },
      (error) => {
        console.error('Upload failed:', error);
        message.error(`${file.name} upload failed.`);
        onError(error);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          // Optionally, associate the downloadURL with the file in the fileList
          onSuccess(downloadURL, file);
          message.success(`${file.name} uploaded successfully.`);
        } catch (error) {
          console.error('Error getting download URL:', error);
          message.error(`Failed to retrieve download URL for ${file.name}.`);
          onError(error);
        }
      }
    );
  };

  // Handle form submission
  const handleSubmit = async (values: FormValues) => {
    if (!taskId) {
      message.error('Task ID is missing.');
      return;
    }

    setUploading(true);

    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        message.error('User is not authenticated.');
        return;
      }

      // Fetch user's first and last name from Firestore
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      let createdBy = 'Unknown User';
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const firstName = userData.firstName || '';
        const lastName = userData.lastName || '';
        createdBy = `${firstName} ${lastName}`.trim() || 'Unknown User';
      }

      // Process file attachments
      const attachments: Attachment[] = fileList
        .filter((file) => file.status === 'done' && file.url)
        .map((file) => ({
          name: file.name || 'Unnamed File',
          url: file.url as string,
        }));

      // Update the main maintenance document
      const maintenanceDocRef = doc(db, 'maintenance', taskId);
      const maintenanceUpdate = {
        status: values.status,
        priority: values.priority,
        dueDate: values.dueDate ? Timestamp.fromDate(values.dueDate.toDate()) : null,
        assignees: values.assignees?.map((uid) => ({ uid })),
        notifyAssignees: values.notifyAssignees,
      };
      await updateDoc(maintenanceDocRef, maintenanceUpdate);

      // Create a new content entry
      const newContent: NewContent = {
        content: values.note,
        createdAt: Timestamp.now(),
        createdByUID: currentUser.uid,
        createdBy: createdBy,
      };

      // Only add attachments field if there are any
      if (attachments.length > 0) {
        newContent.attachments = attachments;
      }

      const notesCollectionRef = collection(db, 'maintenance', taskId, 'notes');
      await addDoc(notesCollectionRef, newContent);

      // Optionally remove the success message if desired
      // message.success('Maintenance task updated and content added successfully.');

      form.resetFields();
      setFileList([]);
      onClose();
      onUpdateSuccess();

      // Check if the task status is 'Completed' and call onTaskCompleted
      if (values.status === 'Completed') {
        onTaskCompleted();
      }
    } catch (error) {
      console.error('Error updating maintenance task:', error);
      if (error instanceof Error) {
        message.error(`Failed to update maintenance task: ${error.message}`);
      } else {
        message.error('Failed to update maintenance task due to an unknown error.');
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <Drawer
      title="Post A Note"
      placement="right"
      onClose={onClose}
      open={visible}
      width="50%"
      className="post-an-update-drawer"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            type="primary"
            onClick={() => form.submit()}
            loading={uploading}
            aria-label="Save Note"
          >
            Save
          </Button>
        </div>
      }
      afterVisibleChange={(visible) => {
        if (!visible) {
          form.resetFields();
          setFileList([]);
        }
      }}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        aria-label="Post a Note Form"
      >
        {/* Note Field */}
        <Form.Item
          name="note"
          label="Note"
          rules={[{ required: true, message: 'Please enter a note.' }]}
        >
          <TextArea rows={4} placeholder="Enter your note here" />
        </Form.Item>

        {/* Due Date Picker */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="dueDate"
              label="Due Date"
              rules={[
                {
                  required: true,
                  message: 'Please select a due date.',
                },
                {
                  validator: (_, value: Dayjs | null) =>
                    value && value.isBefore(dayjs().startOf('day'))
                      ? Promise.reject(new Error('Due date cannot be in the past.'))
                      : Promise.resolve(),
                },
              ]}
            >
              <DatePicker
                showTime
                style={{ width: '100%' }}
                format="MMMM D, YYYY [at] h:mm A"
                aria-label="Due Date Picker"
              />
            </Form.Item>
          </Col>
        </Row>

        <Divider />

        {/* Status and Priority Selectors */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="status"
              label="Status"
              rules={[{ required: true, message: 'Please select a status.' }]}
            >
              <Select placeholder="Select status" aria-label="Status Selector">
                <Option value="Received">Received</Option>
                <Option value="In Progress">In Progress</Option>
                <Option value="Completed">Completed</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="priority"
              label="Priority"
              rules={[{ required: true, message: 'Please select a priority.' }]}
            >
              <Select placeholder="Select priority" aria-label="Priority Selector">
                <Option value="High">High</Option>
                <Option value="Medium">Medium</Option>
                <Option value="Low">Low</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        {/* Assignees Selector */}
        <Form.Item
          name="assignees"
          label="Assignees"
          rules={[{ required: true, message: 'Please select at least one assignee.' }]}
        >
          <Select
            mode="multiple"
            placeholder="Select assignees"
            loading={loadingAssignees}
            style={{ width: '100%' }}
            aria-label="Assignees Selector"
          >
            {assignees.length > 0 ? (
              assignees.map((assignee) => (
                <Option key={assignee.uid} value={assignee.uid}>
                  {assignee.name}
                </Option>
              ))
            ) : (
              <Option disabled>No assignees available.</Option>
            )}
          </Select>
        </Form.Item>

        {/* Notify Assignee Checkbox */}
        <Form.Item name="notifyAssignee" valuePropName="checked">
          <Checkbox aria-label="Notify Assignee(s)">Notify Assignee(s)</Checkbox>
        </Form.Item>

        <Divider />

        {/* File Attachments */}
        <div className="attachments-section">
          <Title level={5}>Attachments</Title>
          <Dragger
            name="file"
            multiple
            customRequest={customUpload}
            onChange={handleUploadChange}
            fileList={fileList}
            className="attachments-dragger"
            aria-label="File Upload Dragger"
          >
            <p className="ant-upload-drag-icon" style={{ marginBottom: '8px' }}>
              <InboxOutlined />
            </p>
            <Text strong>Click or drag file to this area to upload</Text>
            <br />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Support for single or bulk upload.
            </Text>
          </Dragger>
        </div>
      </Form>
    </Drawer>
  );
};

export default TaskUpdateDrawer;
