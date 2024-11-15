import React, { forwardRef, useImperativeHandle, useState, useEffect } from 'react';
import { Form, Input, Typography, Radio, Space, notification } from 'antd';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db, auth } from '../../../../../../firebase-config';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface InstructionsSettingsProps {
  propertyId: string;
  useCompanySettings: boolean;
  setUseCompanySettings: (value: boolean) => void;
}

const InstructionsSettings = forwardRef<{ handleSave: () => Promise<boolean> }, InstructionsSettingsProps>(
  ({ propertyId, useCompanySettings, setUseCompanySettings }, ref) => {
    const [form] = Form.useForm();
    const [saving, setSaving] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    const handleSubmit = async (values: { instructions: string }) => {
      try {
        setSaving(true);
        const currentUser = auth.currentUser;
        
        if (!currentUser?.uid) {
          notification.error({
            message: 'Error',
            description: 'No user found',
            placement: 'topRight'
          });
          return false;
        }

        const propertySettingsRef = doc(db, `properties/${propertyId}/propertySettings/rentalApplication`);
        await setDoc(propertySettingsRef, {
          settings: {
            instructions: values.instructions,
            lastUpdated: Timestamp.now()
          }
        }, { merge: true });

        setHasUnsavedChanges(false);
        notification.success({
          message: 'Success',
          description: 'Instructions saved successfully!',
          placement: 'topRight'
        });
        return true;
      } catch (error) {
        console.error('Error saving instructions:', error);
        notification.error({
          message: 'Error',
          description: 'Failed to save instructions',
          placement: 'topRight'
        });
        return false;
      } finally {
        setSaving(false);
      }
    };

    // Expose handleSave via ref
    useImperativeHandle(ref, () => ({
      handleSave: async () => {
        return await handleSubmit(form.getFieldsValue());
      }
    }));

    // Fetch existing instructions
    useEffect(() => {
      const fetchInstructions = async () => {
        try {
          const propertySettingsRef = doc(db, `properties/${propertyId}/propertySettings/rentalApplication`);
          const propertySettingsDoc = await getDoc(propertySettingsRef);

          if (propertySettingsDoc.exists()) {
            const data = propertySettingsDoc.data();
            const instructions = data.settings?.instructions || '';
            form.setFieldsValue({ instructions });
          }
        } catch (error) {
          console.error('Error fetching instructions:', error);
        }
      };

      fetchInstructions();
    }, [form, propertyId]);

    if (useCompanySettings) {
      return (
        <div style={{ padding: '24px' }}>
          <Title level={2} style={{ marginTop: 0 }}>Instructions</Title>
          
          <Radio.Group 
            value={!useCompanySettings}
            onChange={(e) => setUseCompanySettings(!e.target.value)}
            style={{ width: '100%', marginTop: 16 }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <Radio 
                value={false} 
                style={{ 
                  padding: '16px', 
                  width: '100%', 
                  background: '#f5f5f5', 
                  borderRadius: '8px' 
                }}
              >
                Use company default settings for this property
              </Radio>
              <Radio 
                value={true} 
                style={{ 
                  padding: '16px', 
                  width: '100%', 
                  background: '#f5f5f5', 
                  borderRadius: '8px' 
                }}
              >
                Specify settings for this property
              </Radio>
            </Space>
          </Radio.Group>
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ maxWidth: 800, flex: 1, overflowY: 'auto', padding: '24px 12px 24px 24px' }}>
          <Title level={2} style={{ marginTop: 0 }}>Instructions</Title>
          
          <Text style={{ color: '#666', display: 'block', marginBottom: 16 }}>
            Any specific instructions for the application? These will be shown on the first page of the application.
          </Text>
          
          <Form 
            form={form} 
            layout="vertical"
            onValuesChange={() => setHasUnsavedChanges(true)}
          >
            <Form.Item
              label="Instructions"
              name="instructions"
            >
              <TextArea 
                rows={6}
                showCount
                maxLength={5000}
                placeholder="Enter instructions for applicants"
              />
            </Form.Item>

            <Text style={{ color: '#666', display: 'block' }}>
              i.e. Please fill out all the information, if you have any questions,<br />
              contact us at 555-123-4556
            </Text>
          </Form>
        </div>
      </div>
    );
  }
);

InstructionsSettings.displayName = 'InstructionsSettings';

export default InstructionsSettings;
