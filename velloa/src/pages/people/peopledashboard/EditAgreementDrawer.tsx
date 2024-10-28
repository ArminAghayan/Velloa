import React, { useState } from 'react';
import { Drawer, Form, DatePicker, Button, message } from 'antd';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebase-config';
import dayjs from 'dayjs';

interface EditAgreementDrawerProps {
  visible: boolean;
  onClose: () => void;
  personId: string;
  currentAgreement?: {
    startDate: string;
    endDate: string;
  };
  onUpdate: (agreement: { startDate: string; endDate: string }) => void;
}

const EditAgreementDrawer: React.FC<EditAgreementDrawerProps> = ({
  visible,
  onClose,
  personId,
  currentAgreement,
  onUpdate,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const agreement = {
        startDate: values.startDate.format('YYYY-MM-DD'),
        endDate: values.endDate.format('YYYY-MM-DD'),
      };

      const personRef = doc(db, 'people', personId);
      await updateDoc(personRef, { agreement });

      onUpdate(agreement);
      message.success('Agreement updated successfully');
      onClose();
    } catch (error) {
      console.error('Error updating agreement:', error);
      message.error('Failed to update agreement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer
      title="Edit Agreement"
      placement="right"
      onClose={onClose}
      open={visible}
      width={400}
      footer={
        <div style={{ textAlign: 'right' }}>
          <Button type="primary" onClick={handleSubmit} loading={loading}>
            Save
          </Button>
        </div>
      }
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          startDate: currentAgreement?.startDate ? dayjs(currentAgreement.startDate) : undefined,
          endDate: currentAgreement?.endDate ? dayjs(currentAgreement.endDate) : undefined,
        }}
      >
        <Form.Item
          name="startDate"
          label="Start Date"
          rules={[{ required: true, message: 'Please select a start date' }]}
        >
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item
          name="endDate"
          label="End Date"
          rules={[{ required: true, message: 'Please select an end date' }]}
        >
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
      </Form>
    </Drawer>
  );
};

export default EditAgreementDrawer;
