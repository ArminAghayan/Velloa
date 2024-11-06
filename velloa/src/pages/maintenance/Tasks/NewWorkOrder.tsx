import React, { useEffect, useState } from 'react';
import {
  Drawer,
  Form,
  Input,
  Radio,
  DatePicker,
  Select,
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
import { customAlphabet } from 'nanoid';

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
  description: string; // Changed from optional to required
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
  attachments?: UploadFile[];
  lineItems: LineItem[];
  [key: string]: any; // Add this line
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

interface Vendor {
  uid: string;
  displayName: string;
}

interface Unit {
  id: string;
  name: string;
}

const generateTaskRefId = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 8);

const NewWorkOrder: React.FC<NewWorkOrderProps> = ({ visible, onClose, companyId }) => {
  const [form] = Form.useForm<WorkOrderFormValues>();
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loadingAssignees, setLoadingAssignees] = useState<boolean>(false);
  const [loadingProperties, setLoadingProperties] = useState<boolean>(false);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [showPartsAndLabor, setShowPartsAndLabor] = useState<boolean>(false);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loadingVendors, setLoadingVendors] = useState<boolean>(false);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loadingUnits, setLoadingUnits] = useState<boolean>(false);

  useEffect(() => {
    if (visible) {
      fetchAssignees();
      fetchProperties();
      fetchVendors();
    } else {
      form.resetFields();
      setAssignees([]);
      setProperties([]);
      setLineItems([]);
      setShowPartsAndLabor(false);
      setVendors([]);
      setUnits([]);
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

  const fetchVendors = async () => {
    setLoadingVendors(true);
    try {
      console.log('Fetching vendors for company:', companyId);
      
      const vendorsQuery = query(
        collection(db, 'people'),
        where('companyId', '==', companyId),
        where('peopleType', '==', 'vendor')
      );

      const vendorsSnapshot = await getDocs(vendorsQuery);
      console.log('Vendors snapshot:', vendorsSnapshot.docs.map(doc => doc.data()));

      if (vendorsSnapshot.empty) {
        console.log('No vendors found - snapshot is empty');
        message.warning('No vendors found for this company.');
        setVendors([]);
        return;
      }

      const vendorData: Vendor[] = vendorsSnapshot.docs.map((doc) => {
        const data = doc.data();
        console.log('Processing vendor doc:', data);
        
        // Create the name parts
        const fullName = `${data.firstName || ''} ${data.lastName || ''}`.trim();
        const companyName = data.company?.trim();
        
        // Combine the parts based on what's available
        let displayName = 'Unknown Vendor';
        if (fullName && companyName) {
          displayName = `${fullName} | ${companyName}`;
        } else if (fullName) {
          displayName = fullName;
        } else if (companyName) {
          displayName = companyName;
        }
        
        return {
          uid: doc.id,
          displayName: displayName,
        };
      });

      console.log('Final vendor data:', vendorData);
      setVendors(vendorData);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      message.error('Failed to fetch vendors. Please try again.');
    } finally {
      setLoadingVendors(false);
    }
  };

  const fetchUnits = async (propertyId: string) => {
    setLoadingUnits(true);
    try {
      const unitsQuery = query(collection(db, 'properties', propertyId, 'units'));
      const unitsSnapshot = await getDocs(unitsQuery);
      
      const unitsData: Unit[] = unitsSnapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().unitName || 'Unnamed Unit',
      }));
      
      setUnits(unitsData);
    } catch (error) {
      console.error('Error fetching units:', error);
      message.error('Failed to fetch units. Please try again.');
    } finally {
      setLoadingUnits(false);
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

      // Fetch property name
      let propertyName = 'Unknown Property';
      if (cleanedValues.relatedProperty) {
        const propertyDoc = await getDoc(doc(db, 'properties', cleanedValues.relatedProperty));
        const propertyData = propertyDoc.data();
        propertyName = propertyData?.propertyName || 'Unknown Property';
      }

      const taskRefId = generateTaskRefId();

      // Transform assignees array to array of objects with uid property
      const formattedAssignees = values.assignees?.map(assigneeId => ({
        uid: assigneeId
      })) || [];

      // Use addDoc to add a new document to the 'maintenance' collection
      const maintenanceRef = collection(db, 'maintenance');
      const newWorkOrderRef = await addDoc(maintenanceRef, {
        ...cleanedValues,
        companyId,
        createdAt: Timestamp.now(),
        dueDate: dueDateTimestamp,
        startDate: startDateTimestamp,
        endDate: endDateTimestamp,
        assignees: formattedAssignees, // Use the formatted assignees array
        relatedToName: propertyName,
        priority: cleanedValues.priority,
        relatedTo: cleanedValues.relatedProperty,
        taskType: 'Work Order',
        taskRefId,
        permitEntering: cleanedValues.permitEntering || false,
        approvedByOwner: cleanedValues.approvedByOwner || false,
      });

      // If parts and labor are included, save them in a subcollection
      if (showPartsAndLabor && lineItems.length > 0) {
        const partsAndLaborRef = collection(newWorkOrderRef, 'partsandlabor');
        for (const item of lineItems) {
          await addDoc(partsAndLaborRef, item);
        }
      }

      console.log('Successfully wrote to Firestore');
      message.success('Work order created successfully');
      form.resetFields();
      setLineItems([]);
      setShowPartsAndLabor(false);
      onClose();
    } catch (error) {
      console.error('Error saving work order:', error);
      message.error('Failed to create work order. Please try again.');
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
        initialValues={{
          notifyAssignees: false,
          workOrderType: 'oneTime',
          repeatForever: false,
          partsAndLabor: false,
          priority: 'Low', // Set default priority to 'Low'
        }}
      >
        <Title level={4}>General</Title>

        <Form.Item name="vendor" label="Select Vendor">
          <Select 
            placeholder="Select Vendor"
            loading={loadingVendors}
            allowClear
          >
            {vendors.map((vendor) => (
              <Select.Option key={vendor.uid} value={vendor.uid}>
                {vendor.displayName}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

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
          rules={[{ required: true, message: 'Please enter a description' }]} // Made required
        >
          <TextArea rows={4} maxLength={10000} showCount />
        </Form.Item>
        <Divider />
        <Title level={4}>Work Order Type</Title>

        <Form.Item name="workOrderType">
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
              <Form.Item
                name="dueDate"
                label="Due Date"
                rules={[{ required: true, message: 'Please select a due date' }]} // Optional: make Due Date required when not recurring
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            )
        }
        </Form.Item>

        <Form.Item
          name="status"
          label="Status"
          rules={[{ required: true, message: 'Please select a status' }]} // Made required
        >
          <Select defaultValue="Not Started">
            <Select.Option value="Not Started">Not Started</Select.Option>
            <Select.Option value="In Progress">In Progress</Select.Option>
            <Select.Option value="Completed">Completed</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="priority"
          label="Priority"
          rules={[{ required: true, message: 'Please select a priority' }]} // Optional: ensuring priority is selected
        >
          <Select placeholder="Select priority">
            <Select.Option value="Low">Low</Select.Option>
            <Select.Option value="Medium">Medium</Select.Option>
            <Select.Option value="High">High</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="assignees"
          label="Assignees"
          rules={[{ required: true, message: 'Please select at least one assignee' }]} // Optional: enforce at least one assignee
        >
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
          <Space>
            <Switch />
            <span>Notify Assignee(s)</span>
          </Space>
        </Form.Item>
        <Divider />


        <Title level={4}>Property</Title>
        <Form.Item
          name="permitEntering"
          valuePropName="checked"
        >
          <Space>
            <Switch />
            <span>Access to property</span>
          </Space>
        </Form.Item>

        <Form.Item
          name="approvedByOwner"
          valuePropName="checked"
        >
          <Space>
            <Switch />
            <span>Approved By Owner</span>
          </Space>
        </Form.Item>

        <Form.Item
          name="partsAndLabor"
          valuePropName="checked"
        >
          <Space>
            <Switch onChange={handlePartsAndLaborChange} />
            <span>Parts and Labor</span>
          </Space>
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
        <Form.Item
          name="relatedProperty"
          label="Property"
          rules={[{ required: true, message: 'Please select a property' }]}
        >
          <Select
            placeholder="Select a property"
            loading={loadingProperties}
            allowClear
            onChange={(value) => {
              form.setFieldValue('relatedUnit', undefined);
              if (value) {
                fetchUnits(value);
              } else {
                setUnits([]);
              }
            }}
          >
            {properties.map((property) => (
              <Select.Option key={property.id} value={property.id}>
                {property.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="relatedUnit"
          label="Unit"
          rules={[{ required: false }]}
        >
          <Select
            placeholder="Select a unit"
            loading={loadingUnits}
            allowClear
            disabled={!form.getFieldValue('relatedProperty')}
          >
            {units.map((unit) => (
              <Select.Option key={unit.id} value={unit.id}>
                {unit.name}
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
