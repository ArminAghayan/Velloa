import { Button, DatePicker, Drawer, Form, Input, InputNumber, Space } from 'antd';
import { doc, updateDoc, getDoc } from '@firebase/firestore';
import { db } from '../../../firebase-config';  // Updated import path
import { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { message } from 'antd';
import { Timestamp } from 'firebase/firestore';  // Add this import at the top

interface EditInsuranceDrawerProps {
  open: boolean;  // Changed from visible to open
  onClose: () => void;
  personId: string;
  currentInsurance?: Insurance;
  onUpdate: (insurance: Insurance) => void;  // Added onUpdate prop
}

interface Insurance {
  coverage: number;
  effectiveDate: Timestamp;  // Changed from string to Timestamp
  expirationDate: Timestamp;  // Changed from string to Timestamp
  insuranceProvider: string;
  policyNumber: string;
}

// Add this helper function
const convertToDate = (date: string | Timestamp | { seconds: number; nanoseconds: number } | undefined) => {
  if (!date) return undefined;
  
  if (date instanceof Timestamp) {
    return dayjs(date.toDate());
  } else if (typeof date === 'string') {
    return dayjs(date);
  } else if (typeof date === 'object' && 'seconds' in date && 'nanoseconds' in date) {
    return dayjs(new Date(date.seconds * 1000 + date.nanoseconds / 1000000));
  }
  return undefined;
};

export default function EditInsuranceDrawer({
  open,
  onClose,
  personId,
  currentInsurance,
  onUpdate,
}: EditInsuranceDrawerProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const fetchInsuranceData = async () => {
    if (!personId) return;

    try {
      const personDoc = await getDoc(doc(db, 'people', personId));
      if (personDoc.exists()) {
        const personData = personDoc.data();
        if (personData.insurance?.[0]) {
          const insurance = personData.insurance[0];
          
          // Handle both string dates and Firestore timestamps
          const effectiveDate = typeof insurance.effectiveDate === 'string' 
            ? dayjs(insurance.effectiveDate)
            : insurance.effectiveDate?.toDate 
              ? dayjs(insurance.effectiveDate.toDate()) 
              : undefined;

          const expirationDate = typeof insurance.expirationDate === 'string'
            ? dayjs(insurance.expirationDate)
            : insurance.expirationDate?.toDate 
              ? dayjs(insurance.expirationDate.toDate())
              : undefined;

          form.setFieldsValue({
            ...insurance,
            effectiveDate,
            expirationDate,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching insurance data:', error);
      message.error('Failed to fetch insurance data. Please try again.');
    }
  };

  const cleanFormData = (data: any) => {
    // Helper function to remove undefined values
    const clean = (obj: any): any => {
      Object.keys(obj).forEach(key => {
        if (obj[key] && typeof obj[key] === 'object') {
          clean(obj[key]);
        } else if (obj[key] === undefined) {
          delete obj[key];
        }
      });
      return obj;
    };

    let cleanedData = clean(data);

    // Convert dayjs objects to Date objects
    if (cleanedData.effectiveDate && dayjs(cleanedData.effectiveDate).isValid()) {
      cleanedData.effectiveDate = dayjs(cleanedData.effectiveDate).startOf('day').format('YYYY-MM-DD');
    } else {
      delete cleanedData.effectiveDate;
    }

    if (cleanedData.expirationDate && dayjs(cleanedData.expirationDate).isValid()) {
      cleanedData.expirationDate = dayjs(cleanedData.expirationDate).startOf('day').format('YYYY-MM-DD');
    } else {
      delete cleanedData.expirationDate;
    }

    return cleanedData;
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const insurance: Insurance = {
        insuranceProvider: values.insuranceProvider,
        policyNumber: values.policyNumber,
        coverage: values.coverage,
        effectiveDate: Timestamp.fromDate(values.effectiveDate.startOf('day').toDate()),
        expirationDate: Timestamp.fromDate(values.expirationDate.startOf('day').toDate()),
      };

      const personRef = doc(db, 'people', personId);
      await updateDoc(personRef, {
        insurance: [insurance],
      });

      onUpdate(insurance); // Call onUpdate with the new insurance data
      message.success('Insurance updated successfully');
      setLoading(false);
      onClose();
    } catch (error) {
      console.error('Error updating insurance:', error);
      message.error('Failed to update insurance');
      setLoading(false);
    }
  };

  const handleClose = () => {
    form.resetFields(); // Reset form when closing
    onClose();
  };

  useEffect(() => {
    if (open) {
      fetchInsuranceData();
    }
  }, [open, personId]);

  // Convert Timestamp to dayjs for form initialization
  const initialValues = currentInsurance ? {
    ...currentInsurance,
    effectiveDate: currentInsurance.effectiveDate ? dayjs(currentInsurance.effectiveDate.toDate()) : undefined,
    expirationDate: currentInsurance.expirationDate ? dayjs(currentInsurance.expirationDate.toDate()) : undefined,
  } : undefined;

  return (
    <Drawer
      title="Edit Insurance"
      placement="right"
      onClose={handleClose}
      open={open}
      width={400}
      extra={
        <Space>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="primary" onClick={handleSubmit} loading={loading}>
            Save
          </Button>
        </Space>
      }
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={initialValues}
      >
        <Form.Item
          name="insuranceProvider"
          label="Insurance Provider"
          rules={[{ required: true, message: 'Please enter the insurance provider' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="policyNumber"
          label="Policy Number"
          rules={[{ required: true, message: 'Please enter the policy number' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="coverage"
          label="Coverage Amount"
          rules={[{ required: true, message: 'Please enter the coverage amount' }]}
        >
          <InputNumber
            formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Form.Item
          name="effectiveDate"
          label="Effective Date"
          rules={[{ required: true, message: 'Please select the effective date' }]}
        >
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="expirationDate"
          label="Expiration Date"
          rules={[{ required: true, message: 'Please select the expiration date' }]}
        >
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
