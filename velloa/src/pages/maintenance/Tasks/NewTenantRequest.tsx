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
  Switch,
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
import { db,auth } from '../../../firebase-config'; // Ensure this path is correct
import './NewTenantRequest.css'
import { customAlphabet } from 'nanoid';

const { TextArea } = Input;
const { Dragger } = Upload;
const { Title } = Typography;

interface NewTenantRequestProps {
  visible: boolean;
  onClose: () => void;
  companyId: string;
}


interface TenantRequestFormValues {
    tenant: string;
    requestType: string;
    Type?: string;
    subject: string;
    description?: string;
    dueDate?: Date;
    status: string;
    priority: string;
    assignees?: string[];
    notifyAssignees: boolean;
    relatedTo: string;
    notifyTenant: boolean;
    permitEntering: boolean;
    attachments?: UploadFile[];
    [key: string]: any;  // Add this line
  }
  
  interface Tenant {
    id: string;
    name: string;
    firstName: string;
    lastName: string;
    propertyId: string;
    propertyName: string;
    unit: string;
  }
  
  interface Assignee {
    uid: string;
    name: string;
  }
  
  interface Property {
    id: string;
    name: string;
  }
  
  const generateTaskRefId = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 8);

  const NewTenantRequest: React.FC<NewTenantRequestProps> = ({ visible, onClose, companyId }) => {
    const [form] = Form.useForm<TenantRequestFormValues>();
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [assignees, setAssignees] = useState<Assignee[]>([]);
    const [properties, setProperties] = useState<Property[]>([]);
    const [loadingTenants, setLoadingTenants] = useState<boolean>(false);
    const [loadingAssignees, setLoadingAssignees] = useState<boolean>(false);
    const [loadingProperties, setLoadingProperties] = useState<boolean>(false);
    const [requestType, setRequestType] = useState<string>('');

    useEffect(() => {
      if (visible) {
        fetchProperties();
        fetchAssignees();
      } else {
        form.resetFields();
      }
    }, [visible, companyId]);
  
    const fetchProperties = async () => {
        setLoadingProperties(true);
        setLoadingTenants(true);
        try {
          const propertiesQuery = query(collection(db, 'properties'), where('companyuid', '==', companyId));
          const querySnapshot = await getDocs(propertiesQuery);
          
          const propertiesData: Property[] = [];
          let allTenants: Tenant[] = [];
    
          for (const propertyDoc of querySnapshot.docs) {
            const propertyId = propertyDoc.id;
            const propertySettingsSnapshot = await getDocs(collection(db, 'properties', propertyId, 'propertySettings'));
            const settingsDoc = propertySettingsSnapshot.docs[0];
            const settingsData = settingsDoc?.data() || {};
            
            const propertyName = settingsData.propertyName || 'Unnamed Property';
            propertiesData.push({
              id: propertyId,
              name: propertyName,
            });
    
            // Fetch tenants for this property
            const tenantsSnapshot = await getDocs(collection(db, 'properties', propertyId, 'tenants'));
            const propertyTenants = tenantsSnapshot.docs.map(tenantDoc => {
              const tenantData = tenantDoc.data();
              return {
                id: tenantDoc.id,
                name: `${tenantData.firstName || ''} ${tenantData.lastName || ''}`.trim() || 'Unnamed Tenant',
                firstName: tenantData.firstName || '',
                lastName: tenantData.lastName || '',
                propertyId,
                propertyName,
                unit: tenantData.unit || 'Unknown Unit',
              };
            });
            
            allTenants = [...allTenants, ...propertyTenants];
          }
          
          setProperties(propertiesData);
          setTenants(allTenants);
        } catch (error) {
          console.error('Error fetching properties and tenants:', error);
          message.error('Failed to fetch properties and tenants. Please try again.');
        } finally {
          setLoadingProperties(false);
          setLoadingTenants(false);
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
  
    const onFinish = async (values: TenantRequestFormValues) => {
        try {
          const selectedTenant = tenants.find(t => t.id === values.tenant);
          if (!selectedTenant) {
            throw new Error('Selected tenant not found');
          }
  
          const cleanedValues = Object.entries(values).reduce((acc, [key, value]) => {
            if (value !== undefined && value !== '') {
              acc[key] = value;
            }
            return acc;
          }, {} as Partial<TenantRequestFormValues>);
    
          const dueDateTimestamp = cleanedValues.dueDate
            ? Timestamp.fromDate(new Date(cleanedValues.dueDate))
            : null;
    
          // Fetch full names of assignees
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
    
          const taskRefId = generateTaskRefId();

          const tenantRequestRef = collection(db, 'maintenance');
          await addDoc(tenantRequestRef, {
            ...cleanedValues,
            companyId,
            createdAt: Timestamp.now(),
            dueDate: dueDateTimestamp,
            assignees: assigneeDetails,
            attachments,
            taskType: 'Tenant Request',
            relatedTo: selectedTenant.propertyId,
            relatedToName: selectedTenant.propertyName,
            tenantFirstName: selectedTenant.firstName,
            tenantLastName: selectedTenant.lastName,
            tenantUnit: selectedTenant.unit,
            status: cleanedValues.status || 'Not Started',
            taskRefId,
            permitEntering: cleanedValues.permitEntering || false,
            approvedByOwner: false, // Set initial value to false
          });
    
          message.success('Tenant request created successfully');
          form.resetFields();
          onClose();
        } catch (error) {
          console.error('Error saving tenant request:', error);
          message.error('Failed to create tenant request. Please try again.');
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
    const handleRequestTypeChange = (value: string) => {
        setRequestType(value);
        form.setFieldsValue({ maintenanceType: undefined });
      };
      const filterTenantOption = (input: string, option: any) => {
        const tenant = tenants.find(t => t.id === option.value);
        if (!tenant) return false;
        return tenant.name.toLowerCase().indexOf(input.toLowerCase()) >= 0 ||
               tenant.propertyName.toLowerCase().indexOf(input.toLowerCase()) >= 0 ||
               tenant.unit.toLowerCase().indexOf(input.toLowerCase()) >= 0;
      };

  return (
    <Drawer
      title={<Title level={4} style={{ color: '#28A745' }}>New Tenant Request</Title>}
      placement="right"
      onClose={onClose}
      className='new-Tenant-Request-drawer'
      open={visible}
      width={720}
      footer={
        <div style={{ textAlign: 'right' }}>
          <Space>
            <Button onClick={onClose}>Cancel</Button>
            <Button onClick={() => form.submit()} type="primary" >
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
        initialValues={{ notifyAssignees: false, notifyTenant: false }}
      >
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="tenant"
              label="Select Tenant"
              rules={[{ required: true, message: 'Please select a tenant' }]}
            >
              <Select 
                showSearch
                placeholder="Select tenant"
                loading={loadingTenants}
                filterOption={filterTenantOption}
                notFoundContent={loadingTenants ? 'Loading...' : (tenants.length === 0 ? 'No tenants found' : 'No match found')}
                >
                {tenants.map(tenant => (
                    <Select.Option key={tenant.id} value={tenant.id}>
                    {tenant.name} - {tenant.unit} ({tenant.propertyName})
                    </Select.Option>
                ))}
                </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="requestType"
              label="Request Type"
              rules={[{ required: true, message: 'Please select request type' }]}
            >
              <Select 
                placeholder="Select request type"
                onChange={handleRequestTypeChange}
              >
                <Select.Option value="General">General</Select.Option>
                <Select.Option value="Maintenance">Maintenance</Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="Type"
              label="Type"
              rules={[{ required: requestType !== '', message: 'Please select type' }]}
            >
              <Select 
                placeholder="Select type"
                disabled={requestType === ''}
              >
                {requestType === 'General' ? (
                  <>
                    <Select.Option value="Appliance Maintenance">Appliance Maintenance</Select.Option>
                    <Select.Option value="General Repairs">General Repairs</Select.Option>
                    <Select.Option value="Pest Control">Pest Control</Select.Option>
                    <Select.Option value="Exterior">Exterior</Select.Option>
                    <Select.Option value="Cosmetic">Cosmetic</Select.Option>
                    <Select.Option value="Other">Other</Select.Option>
                  </>
                ) : requestType === 'Maintenance' ? (
                  <>
                    <Select.Option value="Plumbing">Plumbing</Select.Option>
                    <Select.Option value="Electrical">Electrical</Select.Option>
                    <Select.Option value="HVAC">HVAC</Select.Option>
                    <Select.Option value="Other">Other</Select.Option>
                  </>
                ) : null}
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
        <Divider/>
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
            <Form.Item name="notifyTenant" valuePropName="checked">
              <Checkbox>Notify Tenant</Checkbox>
            </Form.Item>
          </Col>
        </Row>
        <Divider/>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item name="permitEntering" valuePropName="checked">
              <Switch />
              <span style={{ marginLeft: '8px' }}>
                Permit entering the property
              </span>
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

export default NewTenantRequest;