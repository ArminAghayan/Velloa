import React, { useEffect, useState } from 'react';
import {
  Drawer,
  Form,
  Input,
  Select,
  Upload,
  Button,
  Space,
  Row,
  Col,
  message,
  Divider,
  InputNumber,
  Switch,
  Radio,
  Table,
  Typography,
  DatePicker,
} from 'antd';
import { InboxOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
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
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../../../../firebase-config';
import { customAlphabet } from 'nanoid';
import dayjs, { Dayjs } from 'dayjs';
import './TaskUpdateDrawer.css';
import { FirebaseError } from 'firebase/app';

const { TextArea } = Input;
const { Dragger } = Upload;
const { Title } = Typography;

interface SubWorkOrder {
  id: string;
  subject: string;
  description?: string;
  dueDate?: Timestamp | string;
  status: string;
  priority: string;
  assignees?: Array<{ uid: string; name: string }>;
  estimatedHours?: number;
  estimatedCost?: number;
  workOrderType: 'oneTime';
  vendor?: string;
  permitEntering: boolean;
  approvedByOwner: boolean;
  partsAndLabor: boolean;
  relatedProperty?: string;
  attachments?: string[];
}

interface TaskSubWorkOrderDrawerProps {
  visible: boolean;
  onClose: () => void;
  companyId: string;
  parentTaskId: string;
  onSubWorkOrderAdded?: () => void;
  editingSubWorkOrder: SubWorkOrder | null;
}

interface WorkOrderFormValues {
  subject: string;
  description?: string;
  dueDate?: Dayjs | null;
  status: string;
  priority: string;
  assignees?: string[];
  notifyAssignees: boolean;
  attachments?: UploadFile[];
  estimatedHours?: number;
  estimatedCost?: number;
  workOrderType: 'oneTime';
  vendor?: string;
  permitEntering: boolean;
  approvedByOwner: boolean;
  partsAndLabor: boolean;
  relatedProperty?: string;
  [key: string]: any; // Added index signature
}

interface Assignee {
  uid: string;
  name: string;
}

interface Property {
  id: string;
  name: string;
}

interface LineItem {
  key: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

const generateTaskRefId = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 8);

const TaskSubWorkOrderDrawer: React.FC<TaskSubWorkOrderDrawerProps> = ({
  visible,
  onClose,
  companyId,
  parentTaskId,
  onSubWorkOrderAdded,
  editingSubWorkOrder,
}) => {
  const [form] = Form.useForm<WorkOrderFormValues>();
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loadingAssignees, setLoadingAssignees] = useState<boolean>(false);
  const [loadingProperties, setLoadingProperties] = useState<boolean>(false);
  const [showPartsAndLabor, setShowPartsAndLabor] = useState<boolean>(false);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [relatedProperty, setRelatedProperty] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (visible) {
      fetchAssignees();
      fetchProperties();
      fetchRelatedProperty();
      if (editingSubWorkOrder) {
        populateForm(editingSubWorkOrder);
      } else {
        form.resetFields();
      }
    } else {
      form.resetFields();
      setShowPartsAndLabor(false);
      setLineItems([]);
    }
  }, [visible, companyId, editingSubWorkOrder, form, parentTaskId]);

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

  const fetchRelatedProperty = async () => {
    try {
      const parentTaskDoc = await getDoc(doc(db, 'maintenance', parentTaskId));
      if (parentTaskDoc.exists()) {
        const parentTaskData = parentTaskDoc.data();
        setRelatedProperty(parentTaskData.relatedProperty);
        form.setFieldsValue({ relatedProperty: parentTaskData.relatedProperty });
      }
    } catch (error) {
      console.error('Error fetching related property:', error);
      message.error('Failed to fetch related property. Please try again.');
    }
  };

  const populateForm = (data: SubWorkOrder) => {
    const formValues: WorkOrderFormValues = {
      subject: data.subject,
      description: data.description,
      status: data.status,
      priority: data.priority,
      assignees: data.assignees?.map((assignee) => assignee.uid),
      dueDate: data.dueDate ? dayjs(data.dueDate instanceof Timestamp ? data.dueDate.toDate() : data.dueDate) : undefined,
      notifyAssignees: false,
      workOrderType: data.workOrderType,
      vendor: data.vendor,
      permitEntering: data.permitEntering,
      approvedByOwner: data.approvedByOwner,
      partsAndLabor: data.partsAndLabor,
      relatedProperty: relatedProperty,
    };

    form.setFieldsValue(formValues);
    setShowPartsAndLabor(data.partsAndLabor);
    
    // Fetch and set line items if available
    if (data.partsAndLabor) {
      fetchLineItems(data.id);
    }
  };

  const fetchLineItems = async (subWorkOrderId: string) => {
    try {
      const partsAndLaborCol = collection(db, 'maintenance', parentTaskId, 'partsandlabor');
      const partsQuery = query(partsAndLaborCol, where('subtaskId', '==', subWorkOrderId));
      const partsSnapshot = await getDocs(partsQuery);

      const lineItemsData: LineItem[] = partsSnapshot.docs.map(doc => ({
        key: doc.id,
        description: doc.data().description,
        quantity: doc.data().quantity,
        unitPrice: doc.data().unitPrice,
        total: doc.data().total,
      }));

      setLineItems(lineItemsData);
    } catch (error) {
      console.error('Error fetching line items:', error);
      message.error('Failed to fetch line items.');
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
  
      // Convert due date to Firestore Timestamp
      const dueDateTimestamp = cleanedValues.dueDate
        ? Timestamp.fromDate(cleanedValues.dueDate.toDate())
        : null;
  
      console.log('Fetching assignee details...');
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
      console.log('Assignee details fetched:', assigneeDetails);
  
      console.log('Fetching property name...');
      // Fetch property name
      let propertyName = 'Unknown Property';
      if (cleanedValues.relatedProperty) {
        const propertyDoc = await getDoc(doc(db, 'properties', cleanedValues.relatedProperty));
        const propertyData = propertyDoc.data();
        propertyName = propertyData?.propertyName || 'Unknown Property';
      }
      console.log('Property name fetched:', propertyName);
  
      const taskRefId = generateTaskRefId();
  
      // Reference to the maintenance/{taskId} document
      const taskDocRef = doc(db, 'maintenance', parentTaskId);
  
      // Reference to the 'subtasks' subcollection under maintenance/{taskId}
      let subtaskDocRef;
      if (editingSubWorkOrder) {
        // Updating existing sub work order
        console.log('Updating existing sub work order...');
        subtaskDocRef = doc(taskDocRef, 'subtasks', editingSubWorkOrder.id);
        await updateDoc(subtaskDocRef, {
          ...cleanedValues,
          companyId,
          updatedAt: Timestamp.now(),
          dueDate: dueDateTimestamp,
          assignees: assigneeDetails,
          relatedToName: propertyName,
          taskType: 'Work Order',
          taskRefId,
        });
        console.log('Existing sub work order updated successfully');
      } else {
        // Creating a new sub work order
        console.log('Creating new sub work order...');
        const subtasksCollection = collection(taskDocRef, 'subtasks');
        subtaskDocRef = await addDoc(subtasksCollection, {
          ...cleanedValues,
          companyId,
          createdAt: Timestamp.now(),
          dueDate: dueDateTimestamp,
          assignees: assigneeDetails,
          relatedToName: propertyName,
          taskType: 'Work Order',
          taskRefId,
        });
        console.log('New sub work order created successfully');
      }
  
      // Saving Parts and Labor
      if (showPartsAndLabor && lineItems.length > 0) {
        console.log('Attempting to save parts and labor...');
        // Reference to the partsandlabor subcollection under maintenance/{taskId}
        const partsAndLaborCollectionRef = collection(taskDocRef, 'partsandlabor');
  
        // Delete existing parts and labor entries associated with this subtask
        console.log('Deleting existing parts and labor entries...');
        const partsAndLaborQuery = query(
          partsAndLaborCollectionRef,
          where('subtaskId', '==', subtaskDocRef.id)
        );
        const existingPartsAndLabor = await getDocs(partsAndLaborQuery);
        for (const docSnap of existingPartsAndLabor.docs) {
          console.log(`Deleting document with ID: ${docSnap.id}`);
          await deleteDoc(docSnap.ref);
        }
        console.log('Existing parts and labor entries deleted successfully');
  
        // Add new line items with only the specified fields
        console.log('Adding new line items...');
        for (const item of lineItems) {
          console.log(`Adding line item: ${JSON.stringify(item)}`);
          await addDoc(partsAndLaborCollectionRef, {
            description: item.description,
            key: item.key,
            quantity: item.quantity,
            total: item.total,
            unitPrice: item.unitPrice,
            subtaskId: subtaskDocRef.id,
          });
        }
        console.log('New line items added successfully');
      }
  
      console.log('Successfully wrote to Firestore');
      message.success(`Maintenance sub work order ${editingSubWorkOrder ? 'updated' : 'created'} successfully`);
  
      // Reset form and state
      form.resetFields();
      setShowPartsAndLabor(false);
      setLineItems([]);
      onClose();
  
      // Callback after sub work order is added
      if (onSubWorkOrderAdded) {
        onSubWorkOrderAdded();
      }
    } catch (error) {
      console.error('Error in onFinish:', error);
      if (error instanceof Error) {
        message.error(`Failed to save maintenance sub work order: ${error.message}`);
        console.error('Full error object:', error);
        if (error instanceof FirebaseError) {
          console.error('Firebase error code:', error.code);
          console.error('Firebase error details:', error.message);
        }
      } else {
        message.error('Failed to save maintenance sub work order due to an unknown error.');
        console.error('Unknown error:', error);
      }
    }
  };

  const addLineItem = () => {
    const newItem: LineItem = {
      key: Date.now().toString(),
      description: '',
      quantity: 0,
      unitPrice: 0,
      total: 0,
    };
    setLineItems([...lineItems, newItem]);
  };

  const updateLineItem = (key: string, field: keyof LineItem, value: any) => {
    const updatedItems = lineItems.map(item => {
      if (item.key === key) {
        const updatedItem = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unitPrice') {
          updatedItem.total = updatedItem.quantity * updatedItem.unitPrice;
        }
        return updatedItem;
      }
      return item;
    });
    setLineItems(updatedItems);
  };

  const removeLineItem = (key: string) => {
    setLineItems(lineItems.filter(item => item.key !== key));
  };

  const lineItemColumns = [
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (text: string, record: LineItem) => (
        <Input
          value={text}
          onChange={(e) => updateLineItem(record.key, 'description', e.target.value)}
        />
      ),
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (value: number, record: LineItem) => (
        <InputNumber
          value={value}
          onChange={(value) => updateLineItem(record.key, 'quantity', value)}
          min={0}
        />
      ),
    },
    {
      title: 'Unit Price',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      render: (value: number, record: LineItem) => (
        <InputNumber
          value={value}
          onChange={(value) => updateLineItem(record.key, 'unitPrice', value)}
          min={0}
          formatter={(value) => `$ ${value}`}
          parser={(value) => {
            const parsed = value!.replace(/\$\s?|(,*)/g, '');
            return isNaN(Number(parsed)) ? 0 : Number(parsed);
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
      render: (_: any, record: LineItem) => (
        <Button
          type="link"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeLineItem(record.key)}
        >
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
      title={
        <span style={{ color: '#28A745' }}>
          {editingSubWorkOrder 
            ? `Edit Sub Work Order - ${editingSubWorkOrder.subject}`
            : "New Sub Work Order"
          }
        </span>
      }
      placement="right"
      className="new-task-drawer"
      onClose={() => {
        onClose();
        form.resetFields();
        setShowPartsAndLabor(false);
        setLineItems([]);
      }}
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
      <Form<WorkOrderFormValues>
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          notifyAssignees: false,
          workOrderType: 'oneTime',
          permitEntering: false,
          approvedByOwner: false,
          partsAndLabor: false,
          status: 'Not Started',
          priority: 'Medium',
        }}
      >
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

        <Form.Item name="description" label="Work Description">
          <TextArea rows={4} maxLength={10000} showCount />
        </Form.Item>

        <Form.Item
          name="dueDate"
          label="Due Date and Time"
          rules={[{ required: true, message: 'Please select a due date and time' }]}
        >
          <DatePicker 
            showTime={{ format: 'HH:mm' }} 
            format="YYYY-MM-DD HH:mm"
            style={{ width: '100%' }} 
          />
        </Form.Item>

        <Divider />

        <Form.Item name="workOrderType" label="Work Order Type">
          <Radio.Group>
            <Radio value="oneTime">One Time Work Order</Radio>
          </Radio.Group>
        </Form.Item>

        <Form.Item name="assignees" label="Assignees">
          <Select
            mode="multiple"
            placeholder="Select assignees"
            options={assignees.map((assignee) => ({
              label: assignee.name,
              value: assignee.uid,
            }))}
          />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="status"
              label="Status"
              rules={[{ required: true, message: 'Please select a status' }]}
            >
              <Select>
                <Select.Option value="Not Started">Not Started</Select.Option>
                <Select.Option value="In Progress">In Progress</Select.Option>
                <Select.Option value="Complete">Complete</Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="priority"
              label="Priority"
              rules={[{ required: true, message: 'Please select a priority' }]}
            >
              <Select>
                <Select.Option value="Low">Low</Select.Option>
                <Select.Option value="Medium">Medium</Select.Option>
                <Select.Option value="High">High</Select.Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="notifyAssignees" label="Notify Assignees" valuePropName="checked">
              <Switch />
            </Form.Item>

            <Form.Item name="permitEntering" label="Permit Entering" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="approvedByOwner" label="Approved By Owner" valuePropName="checked">
              <Switch />
            </Form.Item>

            <Form.Item name="partsAndLabor" label="Parts and Labor" valuePropName="checked">
              <Switch onChange={(checked) => handlePartsAndLaborChange(checked)} />
            </Form.Item>
          </Col>
        </Row>

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
            <Form.Item name="partsAndLabor" hidden>
              <Input />
            </Form.Item>
          </>
        )}

        <Form.Item name="attachments" label="Attachments">
          <Dragger {...uploadProps} style={{ width: '100%' }}>
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">Click or drag file to this area to upload</p>
            <p className="ant-upload-hint">
              Support for a single or bulk upload. Strictly prohibit from uploading company data or other
              sensitive files
            </p>
          </Dragger>
        </Form.Item>
      </Form>
    </Drawer>
  );
};

export default TaskSubWorkOrderDrawer;
