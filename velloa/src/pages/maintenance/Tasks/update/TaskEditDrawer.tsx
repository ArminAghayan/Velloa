// TaskEditDrawer.tsx

import React, { useEffect, useState } from 'react';
import {
  Drawer,
  Form,
  Input,
  Select,
  Button,
  message,
  Divider,
  Switch,
} from 'antd';
import { db } from '../../../../firebase-config';
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  getDoc,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const { TextArea } = Input;
const { Option } = Select;

// Interfaces
interface TaskEditDrawerProps {
  visible: boolean;
  onClose: () => void;
  taskId: string | undefined;
  taskData: TaskData | null;
  companyId: string;
  onUpdateSuccess: () => void;
}

interface Vendor {
  id: string;
  name: string;
}

interface Owner {
  id: string;
  name: string;
}

interface TaskData {
  subject: string;
  description: string;
  decision: string;
  approvedByOwner: string;
  permitEntering: boolean;
  // Add other fields as necessary
}

interface FormValues {
  subject: string;
  description: string;
  decision: string;
  approvedByOwner: string;
  permitEntering: boolean;
}

const TaskEditDrawer: React.FC<TaskEditDrawerProps> = ({
  visible,
  onClose,
  taskId,
  taskData,
  companyId,
  onUpdateSuccess,
}) => {
  const [form] = Form.useForm<FormValues>();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loadingVendors, setLoadingVendors] = useState<boolean>(false);
  const [loadingOwners, setLoadingOwners] = useState<boolean>(false);
  const [updating, setUpdating] = useState<boolean>(false);

  // Fetch Vendors based on companyId
  const fetchVendors = async () => {
    setLoadingVendors(true);
    try {
      const vendorsQuery = query(
        collection(db, 'vendors'),
        where('companyId', '==', companyId)
      );
      const vendorsSnapshot = await getDocs(vendorsQuery);

      if (vendorsSnapshot.empty) {
        message.warning('No vendors found for this company.');
        setVendors([]);
        return;
      }

      const vendorData: Vendor[] = vendorsSnapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name || 'Unnamed Vendor',
      }));

      setVendors(vendorData);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      if (error instanceof Error) {
        message.error(`Failed to fetch vendors: ${error.message}`);
      } else {
        message.error('Failed to fetch vendors due to an unknown error.');
      }
    } finally {
      setLoadingVendors(false);
    }
  };


  // Initialize drawer
  useEffect(() => {
    if (visible) {
      const initializeDrawer = async () => {
        await Promise.all([fetchVendors()]);
        if (taskData) {
          populateForm(taskData);
        } else {
          form.resetFields();
        }
      };
      initializeDrawer();
    }
  }, [visible, companyId, taskData]);

  // Populate form with task data
  const populateForm = (data: TaskData) => {
    const formValues: FormValues = {
      subject: data.subject || '',
      description: data.description || '',
      decision: data.decision || '',
      approvedByOwner: data.approvedByOwner || '',
      permitEntering: data.permitEntering || false,
    };

    form.setFieldsValue(formValues);
  };

  // Handle form submission
  const handleSubmit = async (values: FormValues) => {
    if (!taskId) {
      message.error('Task ID is missing.');
      return;
    }

    setUpdating(true);

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
      let updatedBy = 'Unknown User';
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const firstName = userData.firstName || '';
        const lastName = userData.lastName || '';
        updatedBy = `${firstName} ${lastName}`.trim() || 'Unknown User';
      }

      // Update the main task document
      const taskDocRef = doc(db, 'tasks', taskId);
      const taskUpdate = {
        subject: values.subject,
        description: values.description,
        decision: values.decision,
        approvedByOwner: values.approvedByOwner,
        permitEntering: values.permitEntering,
        updatedAt: new Date(),
        updatedBy: updatedBy,
      };
      await updateDoc(taskDocRef, taskUpdate);

      message.success('Task updated successfully.');

      form.resetFields();
      onClose();
      onUpdateSuccess();
    } catch (error) {
      console.error('Error updating task:', error);
      if (error instanceof Error) {
        message.error(`Failed to update task: ${error.message}`);
      } else {
        message.error('Failed to update task due to an unknown error.');
      }
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Drawer
      title="Edit Task"
      placement="right"
      onClose={onClose}
      open={visible}
      width="50%"
      className="task-edit-drawer"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            type="primary"
            onClick={() => form.submit()}
            loading={updating}
            aria-label="Save Task"
          >
            Save
          </Button>
        </div>
      }
      afterVisibleChange={(visible) => {
        if (!visible) {
          form.resetFields();
        }
      }}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        aria-label="Edit Task Form"
      >
        {/* Subject Field */}
        <Form.Item
          name="subject"
          label="Subject"
          rules={[{ required: true, message: 'Please enter the subject.' }]}
        >
          <Input placeholder="Enter subject" aria-label="Subject Input" />
        </Form.Item>

        {/* Description Field */}
        <Form.Item
          name="description"
          label="Description"
          rules={[{ required: true, message: 'Please enter the description.' }]}
        >
          <TextArea rows={4} placeholder="Enter description" aria-label="Description TextArea" />
        </Form.Item>

        {/* Subject Vendor Selector */}
        <Form.Item
          name="Vendor"
          label="Vendor"
        >
          <Select
            placeholder="Select a vendor"
            loading={loadingVendors}
            style={{ width: '100%' }}
            aria-label="Subject Vendor Selector"
          >
            {vendors.length > 0 ? (
              vendors.map((vendor) => (
                <Option key={vendor.id} value={vendor.id}>
                  {vendor.name}
                </Option>
              ))
            ) : (
              <Option disabled>No vendors available.</Option>
            )}
          </Select>
        </Form.Item>

        {/* Approved by Owner Selector */}
        <Form.Item
          name="approvedByOwner"
          label="Approved by Owner"
          valuePropName="checked"
        >
          <Switch aria-label="Approved by Owner Switch" />
        </Form.Item>

        {/* Permission to Enter Checkbox */}
        <Form.Item
          name="permitEntering"
          label="Permission to Enter"
          valuePropName="checked"
        >
          <Switch aria-label="Permission to Enter Switch" />
        </Form.Item>

        <Divider />
      </Form>
    </Drawer>
  );
};

export default TaskEditDrawer;