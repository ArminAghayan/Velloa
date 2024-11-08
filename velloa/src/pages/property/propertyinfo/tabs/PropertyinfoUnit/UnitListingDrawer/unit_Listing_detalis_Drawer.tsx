import React, { useState, useEffect } from 'react';
import { CloseOutlined, SaveOutlined } from '@ant-design/icons';
import { IconSparkles } from '@tabler/icons-react';
import { Drawer, Input, Form, Button, message } from 'antd';
import { doc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../../../../firebase-config';

interface UnitListingDetailsDrawerProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: { Title: string; description: string }) => void;
  initialValues?: {
    Title: string;
    description: string;
  };
  unitId: string;
  propertyId: string;
  companyId: string;
}

const UnitListingDetailsDrawer: React.FC<UnitListingDetailsDrawerProps> = ({
  open,
  onClose,
  onSubmit,
  initialValues,
  unitId,
  propertyId,
  companyId
}) => {
  const [form] = Form.useForm();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchUnitDetails = async () => {
      if (!open) return;
      
      setIsLoading(true);
      try {
        const unitRef = doc(db, 'properties', propertyId, 'units', unitId);
        const unitSnap = await getDoc(unitRef);
        
        if (unitSnap.exists()) {
          const unitData = unitSnap.data();
          form.setFieldsValue({
            Title: unitData.ListingTitle || '',
            description: unitData.ListingDescription || ''
          });
        }
      } catch (error) {
        console.error('Error fetching unit details:', error);
        message.error('Failed to load unit details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUnitDetails();
  }, [open, propertyId, unitId, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setIsSaving(true);

      // First verify the property exists and get its companyuid
      const propertyRef = doc(db, 'properties', propertyId);
      const propertySnap = await getDoc(propertyRef);
      
      if (!propertySnap.exists()) {
        throw new Error('Property not found');
      }


      // Update the unit document with exact matching fields from security rules
      const unitRef = doc(db, 'properties', propertyId, 'units', unitId);
      await updateDoc(unitRef, {
        ListingTitle: values.Title.trim(),
        ListingDescription: values.description.trim(),
        updatedAt: serverTimestamp()
      });

      onSubmit(values);
      message.success('Listing details saved successfully');
      onClose();
    } catch (error) {
      console.error('Error saving listing details:', error);
      if (error instanceof Error) {
        message.error(error.message);
      } else {
        message.error('Failed to save listing details');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Drawer
      title="Listing Details"
      placement="right"
      onClose={onClose}
      open={open}
      width={600}
      footer={
        <div style={{ textAlign: 'right' }}>
          <Button 
            onClick={onClose} 
            style={{ marginRight: 8, height: '40px', width: '100px' }} 
            icon={<CloseOutlined />}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            type="primary"
            style={{ height: '40px', width: '100px' }}
            icon={<SaveOutlined />}
            loading={isSaving}
          >
            Save
          </Button>
        </div>
      }
    >
      <Form 
        form={form} 
        layout="vertical" 
        initialValues={initialValues}
      >
        <Form.Item
          name="Title"
          label="Listing Title"
          rules={[{ required: true, message: 'Please enter listing title' }]}
        >
          <Input placeholder="Enter listing title" disabled={isLoading} />
        </Form.Item>

        <Form.Item
          name="description"
          label="Description"
          rules={[{ required: true, message: 'Please enter description' }]}
        >
          <Input.TextArea
            placeholder="Enter listing description"
            rows={6}
            style={{ resize: 'none' }}
            disabled={isLoading}
          />
        </Form.Item>

        <Button
          type="default"
          style={{
            marginBottom: 16,
            height: '40px',
            fontWeight: '600'
          }}
          icon={<IconSparkles />}
          disabled={isSaving}
        >
          Generate description
        </Button>
      </Form>
    </Drawer>
  );
};

export default UnitListingDetailsDrawer;