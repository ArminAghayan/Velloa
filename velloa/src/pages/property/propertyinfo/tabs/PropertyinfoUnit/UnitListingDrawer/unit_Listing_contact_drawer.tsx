import React, { useState, useEffect } from 'react';
import { Drawer, Form, Input, Button, notification, Tabs, Select, Row, Col } from 'antd';
import { doc, collection, getDocs, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../../../../../../firebase-config';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  phoneNumber: string;
  companyuid: string;
}

interface UnitListingContactDrawerProps {
  open: boolean;
  onClose: () => void;
  propertyId: string;
  unitId: string;
  onSubmit: () => Promise<void>;
  companyId: string;
}

const formatPhoneNumber = (value: string): string => {
  if (!value) return '';
  
  // Remove all non-digit characters
  const phoneNumber = value.replace(/\D/g, '');
  
  // Format the number
  if (phoneNumber.length >= 10) {
    return `(${phoneNumber.slice(0, 3)})-${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
  }
  return phoneNumber;
};

const UnitListingContactDrawer: React.FC<UnitListingContactDrawerProps> = ({
  open,
  onClose,
  propertyId,
  unitId,
  onSubmit,
  companyId,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState('user');

  // Fetch users when drawer opens
  useEffect(() => {
    if (open && companyId) {
      const fetchUsers = async () => {
        try {
          const usersRef = collection(db, 'users');
          const q = query(usersRef, where('companyuid', '==', companyId));
          const usersSnapshot = await getDocs(q);
          
          const usersData = usersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as User));
          
          setUsers(usersData);
        } catch (error) {
          console.error('Error fetching users:', error);
          notification.error({
            message: 'Error',
            description: 'Failed to load users',
          });
        }
      };
      fetchUsers();
    }
  }, [open, companyId]);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      
      let contactInfo: Record<string, any>;

      if (activeTab === 'user') {
        // If it's a user selection, only save the userId and type
        contactInfo = {
          type: 'user',
          userId: values.userId
        };
      } else {
        // If it's a custom contact, save all the provided fields
        contactInfo = {
          type: 'custom',
          firstName: values.firstName,
          lastName: values.lastName,
        };

        // Only add optional fields if they have values
        if (values.middleName) contactInfo.middleName = values.middleName;
        if (values.email) contactInfo.email = values.email;
        if (values.phoneNumber) contactInfo.phoneNumber = values.phoneNumber;
      }

      // Update the unit document
      await updateDoc(doc(db, 'properties', propertyId, 'units', unitId), {
        contactInfo
      });

      notification.success({
        message: 'Success',
        description: 'Contact information updated successfully',
      });

      await onSubmit();
      onClose();
      form.resetFields();
    } catch (error) {
      console.error('Error updating contact:', error);
      notification.error({
        message: 'Error',
        description: 'Failed to update contact information',
      });
    } finally {
      setLoading(false);
    }
  };

  const items = [
    {
      key: 'user',
      label: 'Pick a User',
      children: (
        <>
          <Form.Item
            name="userId"
            label="Select User"
            rules={[{ required: true, message: 'Please select a user' }]}
          >
            <Select
              showSearch
              placeholder="Select a user"
              optionFilterProp="children"
              onChange={(value) => {
                const selectedUser = users.find(user => user.id === value);
                if (selectedUser) {
                  form.setFieldsValue({
                    firstName: selectedUser.firstName,
                    middleName: selectedUser.middleName,
                    lastName: selectedUser.lastName,
                    email: selectedUser.email,
                    phoneNumber: formatPhoneNumber(selectedUser.phoneNumber),
                  });
                }
              }}
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={users.map(user => ({
                value: user.id,
                label: `${user.firstName} ${user.lastName}`,
              }))}
            />
          </Form.Item>

          {/* First name and middle name in same row */}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="firstName"
                label="First Name"
              >
                <Input disabled />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="middleName"
                label="Middle Name"
              >
                <Input disabled />
              </Form.Item>
            </Col>
          </Row>

          {/* Last name below */}
          <Form.Item
            name="lastName"
            label="Last Name"
          >
            <Input disabled />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
          >
            <Input disabled />
          </Form.Item>

          <Form.Item
            name="phoneNumber"
            label="Phone Number"
          >
            <Input 
              disabled 
              value={formatPhoneNumber(form.getFieldValue('phoneNumber'))}
            />
          </Form.Item>
        </>
      ),
    },
    {
      key: 'custom',
      label: 'Custom Contact',
      children: (
        <>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="firstName"
                label="First Name"
                rules={[{ required: true, message: 'Please enter first name' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="middleName"
                label="Middle Name"
              >
                <Input placeholder="Optional" />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            name="lastName"
            label="Last Name"
            rules={[{ required: true, message: 'Please enter last name' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { type: 'email', message: 'Please enter a valid email' }
            ]}
          >
            <Input placeholder="Optional" />
          </Form.Item>

          <Form.Item
            name="phoneNumber"
            label="Phone Number"
          >
            <Input
              placeholder="Optional"
              onChange={(e) => {
                const formatted = formatPhoneNumber(e.target.value);
                form.setFieldsValue({ phoneNumber: formatted });
              }}
              maxLength={14}
            />
          </Form.Item>
        </>
      ),
    },
  ];

  return (
    <Drawer
      title="Edit Contact Information"
      width={600}
      open={open}
      onClose={() => {
        onClose();
        form.resetFields();
      }}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button onClick={() => {
            onClose();
            form.resetFields();
          }}>
            Cancel
          </Button>
          <Button type="primary" loading={loading} onClick={handleSubmit}>
            Save
          </Button>
        </div>
      }
    >
      <Form
        form={form}
        layout="vertical"
      >
        <Tabs
          activeKey={activeTab}
          onChange={(key) => {
            setActiveTab(key);
            form.resetFields();
          }}
          items={items}
        />
      </Form>
    </Drawer>
  );
};

export default UnitListingContactDrawer;
