import React, { useEffect, useState } from 'react';
import {
  Drawer,
  Form,
  Input,
  Radio,
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
  InputNumber,
  Table,
  Divider,
} from 'antd';
import { InboxOutlined, PlusOutlined } from '@ant-design/icons';
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
} from 'firebase/firestore';
import { db } from '../../../firebase-config'; // Ensure this path is correct
import './NewWorkOrder.css';

const { TextArea } = Input;
const { Dragger } = Upload;
const { Title } = Typography;

interface NewWorkOrderProps {
  visible: boolean;
  onClose: () => void;
  companyId: string;
}

interface WorkOrderFormValues {
  vendor: string;
  subject: string;
  workDescription?: string;
  workOrderType: 'oneTime' | 'recurring';
  recurringFrequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate?: Date;
  endDate?: Date;
  repeatForever: boolean;
  dueDate?: Date;
  status: string;
  priority: string;
  assignees?: string[];
  notifyAssignees: boolean;
  permitEntering: boolean;
  approvedByOwner: boolean;
  relatedTo: string;
  partsAndLabor: boolean;
  relatedProperty?: string;
  attachments?: UploadFile[];
  lineItems: LineItem[];
  [key: string]: any;  // Add this line

}

interface LineItem {
  key: number;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Assignee {
  uid: string;
  name: string;
}

interface Property {
  id: string;
  name: string;
}

const NewWorkOrder: React.FC<NewWorkOrderProps> = ({ visible, onClose, companyId }) => {
  const [form] = Form.useForm<WorkOrderFormValues>();
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loadingAssignees, setLoadingAssignees] = useState<boolean>(false);
  const [loadingProperties, setLoadingProperties] = useState<boolean>(false);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [showPartsAndLabor, setShowPartsAndLabor] = useState<boolean>(false);

  useEffect(() => {
    if (visible) {
      fetchAssignees();
      fetchProperties();
    } else {
      form.resetFields();
      setAssignees([]);
      setProperties([]);
      setLineItems([]);
      setShowPartsAndLabor(false);
    }
  }, [visible, companyId]);

  const fetchAssignees = async () => {
    setLoadingAssignees(true);
    try {
      const usersQuery = query(
        collection(db, 'users'),
        where('companyuid', '==', companyId)
      );

      const usersSnapshot = await getDocs(usersQuery);

      if (usersSnapshot.empty) {
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
      message.error('Failed to fetch assignees. Please try again.');
    } finally {
      setLoadingAssignees(false);
    }
  };

  const fetchProperties = async () => {
    setLoadingProperties(true);
    try {
      const propertiesQuery = query(collection(db, 'properties'), where('companyuid', '==', companyId));
      const querySnapshot = await getDocs(propertiesQuery);
      
      const propertiesData: Property[] = await Promise.all(querySnapshot.docs.map(async (doc: QueryDocumentSnapshot<DocumentData>) => {
        const propertySettingsSnapshot = await getDocs(collection(db, 'properties', doc.id, 'propertySettings'));
        const settingsDoc = propertySettingsSnapshot.docs[0];
        const settingsData = settingsDoc?.data() || {};
        
        return {
          id: doc.id,
          name: settingsData.propertyName || 'Unnamed Property',
        };
      }));
      
      setProperties(propertiesData);
    } catch (error) {
      console.error('Error fetching properties:', error);
      message.error('Failed to fetch properties. Please try again.');
    } finally {
      setLoadingProperties(false);
    }
  };

  const onFinish = async (values: WorkOrderFormValues) => {
    try {
      console.log('Starting onFinish with values:', values);

      // Create a new object with only defined values
      const cleanedValues = Object.entries(values).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== '') {
          acc[key] = value;
        }
        return acc;
      }, {} as Partial<WorkOrderFormValues>);

      console.log('Cleaned values:', cleanedValues);

      const dueDateTimestamp = cleanedValues.dueDate
        ? Timestamp.fromDate(new Date(cleanedValues.dueDate))
        : null;

      const startDateTimestamp = cleanedValues.startDate
        ? Timestamp.fromDate(new Date(cleanedValues.startDate))
        : null;

      const endDateTimestamp = cleanedValues.endDate && !cleanedValues.repeatForever
        ? Timestamp.fromDate(new Date(cleanedValues.endDate))
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

      // Fetch property name
      let propertyName = 'Unknown Property';
      if (cleanedValues.relatedProperty) {
        const propertyDoc = await getDoc(doc(db, 'properties', cleanedValues.relatedProperty));
        const propertyData = propertyDoc.data();
        propertyName = propertyData?.propertyName || 'Unknown Property';
      }

      const attachments = cleanedValues.attachments
        ? cleanedValues.attachments.map((file) => ({
            name: file.name,
            url: file.url || '',
          }))
        : [];

      console.log('About to write to Firestore...');

      // Use addDoc to add a new document to the 'maintenance' collection
      const maintenanceRef = collection(db, 'maintenance');
      await addDoc(maintenanceRef, {
        ...cleanedValues,
        companyId,
        createdAt: Timestamp.now(),
        dueDate: dueDateTimestamp,
        startDate: startDateTimestamp,
        endDate: endDateTimestamp,
        attachments,
        assignees: assigneeDetails,
        relatedToName: propertyName,
        lineItems: showPartsAndLabor ? lineItems : [],
        taskType: 'Work Order',

      });

      console.log('Successfully wrote to Firestore');
      message.success('Work order created successfully');
      form.resetFields();
      setLineItems([]);
      setShowPartsAndLabor(false);
      onClose();
    } catch (error) {
      console.error('Error saving work order:', error);
    }
  };


  const addLineItem = () => {
    const newItem: LineItem = {
      key: lineItems.length,
      description: '',
      quantity: 0,
      unitPrice: 0,
      total: 0,
    };
    setLineItems([...lineItems, newItem]);
  };

  const updateLineItem = (index: number, field: keyof LineItem, value: any) => {
    const updatedItems = [...lineItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    if (field === 'quantity' || field === 'unitPrice') {
      updatedItems[index].total = updatedItems[index].quantity * updatedItems[index].unitPrice;
    }
    
    setLineItems(updatedItems);
  };

  const removeLineItem = (key: number) => {
    setLineItems(lineItems.filter(item => item.key !== key));
  };

  const lineItemColumns = [
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (text: string, record: LineItem, index: number) => (
        <Input
          value={text}
          onChange={(e) => updateLineItem(index, 'description', e.target.value)}
        />
      ),
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (value: number, record: LineItem, index: number) => (
        <InputNumber
          value={value}
          onChange={(value) => updateLineItem(index, 'quantity', value)}
          min={0}
        />
      ),
    },
    {
      title: 'Unit Price',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      render: (value: number, record: LineItem, index: number) => (
        <InputNumber
          value={value}
          onChange={(value) => updateLineItem(index, 'unitPrice', value)}
          min={0}
          formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          parser={(value) => {
            const processedValue = value!.replace(/\$\s?|(,*)/g, '');
            return parseFloat(processedValue) || 0;
          }}
        />
      ),
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      render: (value: number) => `$ ${value.toFixed(2)}`,
    },
    {
      title: 'Action',
      key: 'action',
      render: (text: string, record: LineItem) => (
        <Button onClick={() => removeLineItem(record.key)} type="link" danger>
          Remove
        </Button>
      ),
    },
  ];

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

  const handlePartsAndLaborChange = (checked: boolean) => {
    setShowPartsAndLabor(checked);
    form.setFieldsValue({ partsAndLabor: checked });
  };

  return (
    <Drawer
      title={<span style={{ color: '#28A745' }}>New Work Order</span>}
      placement="right"
      onClose={onClose}
      open={visible}
      width="50%"
      className='new-work-order-drawer'
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
        initialValues={{ notifyAssignees: false, workOrderType: 'oneTime', repeatForever: false, partsAndLabor: false }}
      >
        <Title level={4}>General</Title>

        <Form.Item name="vendor" label="Select Vendor">
          <Select placeholder="Select Vendor">
            {/* Add vendor options here */}
          </Select>
        </Form.Item>

        <Form.Item
          name="subject"
          label="Subject"
          rules={[{ required: true, message: 'Please enter a subject' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item name="workDescription" label="Work Description">
          <TextArea rows={4} maxLength={10000} showCount />
        </Form.Item>
        <Divider />
        <Title level={4}>Work Order Type</Title>

        <Form.Item name="workOrderType" >
          <Radio.Group>
            <Radio value="oneTime">One Time Work Order</Radio>
            <Radio value="recurring">Recurring Work Order</Radio>
          </Radio.Group>
        </Form.Item>

        <Form.Item
          noStyle
          shouldUpdate={(prevValues, currentValues) => 
            prevValues.workOrderType !== currentValues.workOrderType ||
            prevValues.repeatForever !== currentValues.repeatForever
          }
        >
          {({ getFieldValue }) =>
            getFieldValue('workOrderType') === 'recurring' ? (
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
                      name="repeatForever"
                      valuePropName="checked"
                      label="Repeat Forever"
                    >
                      <Switch />
                    </Form.Item>
                  </Col>
                </Row>
                {!getFieldValue('repeatForever') && (
                  <Form.Item
                    name="endDate"
                    label="End Date"
                    rules={[{ required: true, message: 'Please select an end date' }]}
                  >
                    <DatePicker style={{ width: '100%' }} />
                  </Form.Item>
                )}
              </>
            ) : (
              <Form.Item name="dueDate" label="Due Date">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            )
        }
        </Form.Item>

        <Form.Item name="status" label="Status">
          <Select defaultValue="Not Started">
            <Select.Option value="Not Started">Not Started</Select.Option>
            <Select.Option value="In Progress">In Progress</Select.Option>
            <Select.Option value="Completed">Completed</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item name="priority" label="Priority">
          <Select placeholder="Select priority">
            <Select.Option value="Low">Low</Select.Option>
            <Select.Option value="Medium">Medium</Select.Option>
            <Select.Option value="High">High</Select.Option>
          </Select>
        </Form.Item>

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

        <Form.Item name="notifyAssignees" valuePropName="checked">
          <Checkbox>Notify Assignee(s)</Checkbox>
        </Form.Item>
        <Divider />


        <Title level={4}>Property</Title>
        <Form.Item name="permitEntering" valuePropName="checked">
          <Switch />
          <span style={{ marginLeft: '8px' }}>
          Access to property          </span>
        </Form.Item>

        <Form.Item name="approvedByOwner" valuePropName="checked">
          <Switch />
          <span style={{ marginLeft: '8px' }}>Approved By Owner</span>
        </Form.Item>

        <Form.Item name="partsAndLabor" valuePropName="checked">
          <Switch onChange={handlePartsAndLaborChange} />
          <span style={{ marginLeft: '8px' }}>Parts and Labor</span>
        </Form.Item>
        <Space />

        {showPartsAndLabor && (
          <>
            <Row justify="space-between" align="middle">
              <Col>
                <Title level={5} style={{ margin: 0 }}>Line Items</Title>
              </Col>
              <Col>
                <Button
                  type="primary"
                  onClick={addLineItem}
                  icon={<PlusOutlined />}
                >
                  Add Line Item
                </Button>
              </Col>
            </Row>
            <Table
              dataSource={lineItems}
              columns={lineItemColumns}
              pagination={false}
              style={{ marginTop: 16 }}
            />
          </>
        )}
        <Divider />

        <Title level={4}>Related To</Title>
        <Form.Item name="relatedProperty" label="Property">
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
          <Dragger {...uploadProps} style={{ width: '100%' }}>
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

export default NewWorkOrder;