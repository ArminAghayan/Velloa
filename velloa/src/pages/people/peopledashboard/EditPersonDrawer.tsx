import React, { useState, useEffect } from 'react';
import { Drawer, Form, Input, Button, Select, DatePicker, message, Space } from 'antd';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebase-config';
import moment from 'moment';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';

const { Option } = Select;

interface EditPersonDrawerProps {
  visible: boolean;
  onClose: () => void;
  personDetails: any; // Replace 'any' with a more specific type if available
  companyId: string;
  personId: string;
  onUpdate: (updatedDetails: any) => void; // Replace 'any' with a more specific type
}

const EditPersonDrawer: React.FC<EditPersonDrawerProps> = ({
  visible,
  onClose,
  personDetails,
  companyId,
  personId,
  onUpdate,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && personDetails) {
      form.setFieldsValue({
        ...personDetails,
        moveInDate: personDetails.moveInDate ? moment(personDetails.moveInDate) : null,
        emails: personDetails.emails || [],
        phones: personDetails.phones || [],
      });
    }
  }, [visible, personDetails, form]);

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const personRef = doc(db, 'people', personId);
      await updateDoc(personRef, {
        ...values,
        moveInDate: values.moveInDate ? values.moveInDate.toDate() : null,
        updatedAt: new Date(),
      });
      message.success('Person details updated successfully');
      onUpdate({ ...personDetails, ...values });
      onClose();
    } catch (error) {
      console.error('Error updating person:', error);
      message.error('Failed to update person details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer
      title="Edit Person"
      placement="right"
      onClose={onClose}
      visible={visible}
      width={'50%'}
      footer={
        <div style={{ textAlign: 'right' }}>
          <Space>
            <Button onClick={onClose}>Cancel</Button>
            <Button type="primary" loading={loading} onClick={() => form.submit()}>
              Update
            </Button>
          </Space>
        </div>
      }
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <Form.Item name="firstName" label="First Name" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="lastName" label="Last Name" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="peopleType" label="People Type" rules={[{ required: true }]}>
          <Select>
            <Option value="prospect">Prospect</Option>
            <Option value="tenant">Tenant</Option>
            <Option value="owner">Owner</Option>
          </Select>
        </Form.Item>
        
        <Form.List name="emails">
          {(fields, { add, remove }) => (
            <>
              {fields.map((field, index) => (
                <Form.Item
                  required={false}
                  key={field.key}
                  label={index === 0 ? 'Emails' : ''}
                >
                  <Form.Item
                    {...field}
                    validateTrigger={['onChange', 'onBlur']}
                    rules={[
                      {
                        required: true,
                        whitespace: true,
                        message: "Please input email or delete this field.",
                      },
                      {
                        type: 'email',
                        message: "Please enter a valid email address.",
                      },
                    ]}
                    noStyle
                  >
                    <Input style={{ width: '90%' }} placeholder="Email" />
                  </Form.Item>
                  {fields.length > 1 && (
                    <MinusCircleOutlined
                      className="dynamic-delete-button"
                      onClick={() => remove(field.name)}
                    />
                  )}
                </Form.Item>
              ))}
              <Form.Item>
                <Button
                  type="dashed"
                  onClick={() => add()}
                  icon={<PlusOutlined />}
                >
                  Add Email
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>

        <Form.List name="phones">
          {(fields, { add, remove }) => (
            <>
              {fields.map((field, index) => (
                <Form.Item
                  required={false}
                  key={field.key}
                  label={index === 0 ? 'Phone Numbers' : ''}
                >
                  <Form.Item
                    {...field}
                    validateTrigger={['onChange', 'onBlur']}
                    rules={[
                      {
                        required: true,
                        whitespace: true,
                        message: "Please input phone number or delete this field.",
                      },
                    ]}
                    noStyle
                  >
                    <Input style={{ width: '90%' }} placeholder="Phone Number" />
                  </Form.Item>
                  {fields.length > 1 && (
                    <MinusCircleOutlined
                      className="dynamic-delete-button"
                      onClick={() => remove(field.name)}
                    />
                  )}
                </Form.Item>
              ))}
              <Form.Item>
                <Button
                  type="dashed"
                  onClick={() => add()}
                  icon={<PlusOutlined />}
                >
                  Add Phone Number
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>

        <Form.Item name="moveInDate" label="Move-in Date">
          <DatePicker />
        </Form.Item>
        <Form.Item name="monthlyIncome" label="Monthly Income">
          <Input prefix="$" type="number" />
        </Form.Item>
      </Form>
    </Drawer>
  );
};

export default EditPersonDrawer;
