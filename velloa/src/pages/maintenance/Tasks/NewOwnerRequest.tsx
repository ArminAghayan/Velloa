import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Form,
  Input,
  DatePicker,
  Select,
  Checkbox,
  Upload,
  Button,
  Space,
  Typography,
  Radio,
  message,
  Row,
  Col,
  Divider,
} from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import {
  collection,
  getDocs,
  addDoc,
  Timestamp,
  query,
  where,
  getDoc,
  doc,
  QueryDocumentSnapshot,
  DocumentData,
} from 'firebase/firestore';
import { db, auth } from '../../../firebase-config'; // Ensure this path is correct
import './NewOwnerRequest.css'

const { TextArea } = Input;
const { Dragger } = Upload;
const { Title } = Typography;

interface NewOwnerRequestProps {
  visible: boolean;
  onClose: () => void;
  companyId: string;
}

interface OwnerRequestFormValues {
  owner: string;
  subject: string;
  description?: string;
  taskType: 'One Time Task' | 'Recurring Task';
  dueDate?: Date;
  status: string;
  priority: string;
  assignees?: string[];
  notifyAssignees: boolean;
  notifyOwner: boolean;
  relatedTo: string;
  attachments?: UploadFile[];
  [key: string]: any;
}

interface Owner {
  id: string;
  name: string;
}

interface Assignee {
  uid: string;
  name: string;
}

interface Property {
  id: string;
  name: string;
}

const NewOwnerRequest: React.FC<NewOwnerRequestProps> = ({ visible, onClose, companyId }) => {
  const [form] = Form.useForm<OwnerRequestFormValues>();
  const [owners, setOwners] = useState<Owner[]>([]);
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loadingOwners, setLoadingOwners] = useState<boolean>(false);
  const [loadingAssignees, setLoadingAssignees] = useState<boolean>(false);
  const [loadingProperties, setLoadingProperties] = useState<boolean>(false);

  useEffect(() => {
    if (visible) {
      fetchOwners();
      fetchProperties();
      fetchAssignees();
    } else {
      form.resetFields();
    }
  }, [visible, companyId]);

  const fetchOwners = async () => {
    setLoadingOwners(true);
    try {
      const ownersQuery = query(collection(db, 'owners'), where('companyuid', '==', companyId));
      const querySnapshot = await getDocs(ownersQuery);
      const ownersData: Owner[] = querySnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
        id: doc.id,
        name: `${doc.data().firstName || ''} ${doc.data().lastName || ''}`.trim() || 'Unnamed Owner',
      }));
      setOwners(ownersData);
    } catch (error) {
      console.error('Error fetching owners:', error);
      message.error('Failed to fetch owners. Please try again.');
    } finally {
      setLoadingOwners(false);
    }
  };

  const fetchProperties = async () => {
    setLoadingProperties(true);
    try {
      const propertiesQuery = query(collection(db, 'properties'), where('companyuid', '==', companyId));
      const querySnapshot = await getDocs(propertiesQuery);
      const propertiesData: Property[] = querySnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
        id: doc.id,
        name: doc.data().propertyName || 'Unnamed Property',
      }));
      setProperties(propertiesData);
    } catch (error) {
      console.error('Error fetching properties:', error);
      message.error('Failed to fetch properties. Please try again.');
    } finally {
      setLoadingProperties(false);
    }
  };

  const fetchAssignees = async () => {
    setLoadingAssignees(true);
    try {
      const usersQuery = query(
        collection(db, 'users'),
        where('companyuid', '==', companyId)
      );
      const usersSnapshot = await getDocs(usersQuery);
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
      message.error('Failed to fetch assignees. Please try again.');
    } finally {
      setLoadingAssignees(false);
    }
  };

  const onFinish = async (values: OwnerRequestFormValues) => {
    try {
      const selectedOwner = owners.find(o => o.id === values.owner);
      if (!selectedOwner) {
        throw new Error('Selected owner not found');
      }

      const cleanedValues = Object.entries(values).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== '') {
          acc[key] = value;
        }
        return acc;
      }, {} as Partial<OwnerRequestFormValues>);

      const dueDateTimestamp = cleanedValues.dueDate
        ? Timestamp.fromDate(new Date(cleanedValues.dueDate))
        : null;

      const assigneeDetails = await Promise.all(
        cleanedValues.assignees?.map(async (uid) => {
          const userDoc = await getDoc(doc(db, 'users', uid));
          const userData = userDoc.data();
          return {
            uid,
            name: `${userData?.firstName || ''} ${userData?.lastName || ''}`.trim(),
          };
        }) || []
      );

      const attachments = cleanedValues.attachments
        ? cleanedValues.attachments.map((file) => ({
            name: file.name,
            url: file.url || '',
          }))
        : [];

      const ownerRequestRef = collection(db, 'ownerRequests');
      await addDoc(ownerRequestRef, {
        ...cleanedValues,
        companyId,
        createdAt: Timestamp.now(),
        dueDate: dueDateTimestamp,
        assignees: assigneeDetails,
        attachments,
        status: cleanedValues.status || 'Not Started',
      });

      message.success('Owner request created successfully');
      form.resetFields();
      onClose();
    } catch (error) {
      console.error('Error saving owner request:', error);
      message.error('Failed to create owner request. Please try again.');
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
      title={<Title level={4} style={{ color: '#28A745' }}>New Owner Request</Title>}
      placement="right"
      onClose={onClose}
      open={visible}
      className='New-Owner-Request-Drawer'
      width={720}
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
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{ notifyAssignees: false, notifyOwner: false, taskType: 'One Time Task' }}
      >
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="owner"
              label="Select Owner"
              rules={[{ required: true, message: 'Please select an owner' }]}
            >
              <Select
                showSearch
                placeholder="Select owner"
                loading={loadingOwners}
                filterOption={(input, option) =>
                  (option?.children as unknown as string).toLowerCase().indexOf(input.toLowerCase()) >= 0
                }
              >
                {owners.map(owner => (
                  <Select.Option key={owner.id} value={owner.id}>
                    {owner.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="subject"
              label="Subject"
              rules={[{ required: true, message: 'Please enter a subject' }]}
            >
              <Input />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="description" label="Description">
          <TextArea rows={4} maxLength={10000} showCount />
        </Form.Item>

        <Divider />

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="dueDate" label="Due Date">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="status" label="Status" initialValue="Not Started">
              <Select>
                <Select.Option value="Not Started">Not Started</Select.Option>
                <Select.Option value="In Progress">In Progress</Select.Option>
                <Select.Option value="Completed">Completed</Select.Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="priority" label="Priority">
              <Select placeholder="Select priority">
                <Select.Option value="Low">Low</Select.Option>
                <Select.Option value="Medium">Medium</Select.Option>
                <Select.Option value="High">High</Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="assignees" label="Assignees">
              <Select
                placeholder="Select assignees"
                mode="multiple"
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

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="notifyAssignees" valuePropName="checked">
              <Checkbox>Notify Assignee(s)</Checkbox>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="notifyOwner" valuePropName="checked">
              <Checkbox>Notify Owner</Checkbox>
            </Form.Item>
          </Col>
        </Row>

        <Divider />

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item name="relatedTo" label="Related To">
              <Select placeholder="Select property">
                {properties.map((property) => (
                  <Select.Option key={property.id} value={property.id}>
                    {property.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="attachments" label="Attachments">
          <Dragger {...uploadProps}>
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">
              Drag files or Click here to upload
            </p>
            <p className="ant-upload-hint">
              Support for a single or bulk upload. Files that are supported are jpg, png, mp4, doc, docx, pdf, xlsx, xls,
              no larger than 50 MB.
            </p>
          </Dragger>
        </Form.Item>
      </Form>
    </Drawer>
  );
};

export default NewOwnerRequest;