import React, { useState, useEffect } from 'react';
import { CloseOutlined, SaveOutlined } from '@ant-design/icons';
import { Drawer, Form, InputNumber, Button, notification, Row, Col, DatePicker } from 'antd';
import { doc, updateDoc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../../../../../firebase-config';
import dayjs from 'dayjs';

interface UnitListingPropertyDrawerProps {
  open: boolean;
  onClose: () => void;
  propertyId: string;
  unitId: string;
  onSubmit: () => Promise<void>;
}

const UnitListingPropertyDrawer: React.FC<UnitListingPropertyDrawerProps> = ({
  open,
  onClose,
  propertyId,
  unitId,
  onSubmit,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // Fetch current unit data when drawer opens
  useEffect(() => {
    if (open) {
      const fetchUnitData = async () => {
        try {
          const unitDoc = await getDoc(doc(db, 'properties', propertyId, 'units', unitId));
          if (unitDoc.exists()) {
            const data = unitDoc.data();
            form.setFieldsValue({
              beds: data.beds,
              baths: data.baths,
              size: data.size,
              marketRent: data.marketRent,
              availableDate: data.availableDate ? dayjs(data.availableDate.toDate()) : null,
            });
          }
        } catch (error) {
          console.error('Error fetching unit data:', error);
          notification.error({
            message: 'Error',
            description: 'Failed to load unit details',
          });
        }
      };
      fetchUnitData();
    }
  }, [open, propertyId, unitId, form]);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      
      await updateDoc(doc(db, 'properties', propertyId, 'units', unitId), {
        beds: values.beds,
        baths: values.baths,
        size: values.size,
        marketRent: values.marketRent,
        availableDate: values.availableDate ? Timestamp.fromDate(values.availableDate.toDate()) : null,
      });

      notification.success({
        message: 'Success',
        description: 'Unit details updated successfully',
      });

      await onSubmit();
      onClose();
    } catch (error) {
      console.error('Error updating unit:', error);
      notification.error({
        message: 'Error',
        description: 'Failed to update unit details',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer
      title="Edit Property Details"
      width={400}
      open={open}
      onClose={onClose}
      footer={
        <div style={{ 
          display: 'flex', 
          justifyContent: 'flex-end',
          gap: '8px'  // Adds space between buttons
        }}>
          <Button 
          onClick={onClose}
          icon={<CloseOutlined />}
          style={{ width: '100px', height: '40px' }}
          >Cancel
          </Button>
          <Button 
          type="primary" 
          loading={loading} 
          onClick={handleSubmit}
          style={{ width: '100px', height: '40px' }}
          icon={<SaveOutlined />}
          >
            Save
          </Button>
        </div>
      }
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          beds: 0,
          baths: 0,
          size: 0,
          marketRent: 0,
        }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="beds"
              label="Bedrooms"
              rules={[{ required: true, message: 'Please enter number of bedrooms' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="baths"
              label="Bathrooms"
              rules={[{ required: true, message: 'Please enter number of bathrooms' }]}
            >
              <InputNumber min={0} step={0.5} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="size"
          label="Size (sq ft)"
          rules={[{ required: true, message: 'Please enter the size' }]}
        >
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="marketRent"
          label="Market Rent ($)"
          rules={[{ required: true, message: 'Please enter the market rent' }]}
        >
          <InputNumber
            min={0}
            formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={(value: string | undefined) => {
              const parsedValue = value?.replace(/\$\s?|(,*)/g, '');
              return parsedValue ? Number(parsedValue) : 0;
            }}
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Form.Item
          name="availableDate"
          label="Available Date"
        >
          <DatePicker />
        </Form.Item>
      </Form>
    </Drawer>
  );
};

export default UnitListingPropertyDrawer;
