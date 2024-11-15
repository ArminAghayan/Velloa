import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Form, Switch, Checkbox, Typography, notification, Radio, Space } from 'antd';
import TextArea from 'antd/es/input/TextArea';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db, auth } from '../../../../../../firebase-config';
import './PropertyRentalApplicationApplicantInfoSettings.css'; // We'll add custom styles
const { Title } = Typography;

interface ApplicantInfoSettingsProps {
  propertyId: string;
  useCompanySettings: boolean;
  setUseCompanySettings: (value: boolean) => void;
}

export interface ApplicantInfoSettingsRef {
  handleSave: () => Promise<boolean>;
}

const ApplicantInfoSettings = forwardRef<ApplicantInfoSettingsRef, ApplicantInfoSettingsProps>(({
  propertyId,
  useCompanySettings,
  setUseCompanySettings
}, ref) => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [fields, setFields] = useState([
    { name: 'First Name', required: true, enabled: true, locked: true },
    { name: 'Middle Name', required: false, enabled: true, darkBlue: true },
    { name: 'Last Name', required: true, enabled: true, locked: true },
    { name: 'SSN', required: true, enabled: true, locked: true },
    { name: 'Date Of Birth', required: true, enabled: true, locked: true },
    { name: 'Email', required: true, enabled: true, locked: true },
    { name: 'Phone Number', required: true, enabled: true, locked: true },
    { name: 'Gender', required: false, enabled: true, darkBlue: true },
    { name: 'Marital Status', required: false, enabled: true, darkBlue: true },
    { name: 'Driver License State', required: false, enabled: true, darkBlue: true },
    { name: 'Drivers License Number', required: false, enabled: true, darkBlue: true },
    { name: "Tell us who you are!", required: false, enabled: true, darkBlue: true },
  ]);

  const handleSave = async (): Promise<boolean> => {
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

      const applicantInfo = [
        {
          instructions: form.getFieldValue('instructions') || '',
          lastUpdated: Timestamp.now()
        },
        ...fields.map(field => ({
          [field.name.replace(/[^a-zA-Z0-9]/g, '')]: field.enabled,
          required: field.required,
          lastUpdated: Timestamp.now()
        }))
      ];

      const propertySettingsRef = doc(db, `properties/${propertyId}/propertySettings/rentalApplication`);
      await setDoc(propertySettingsRef, {
        settings: {
          applicantInfo,
          lastUpdated: Timestamp.now()
        }
      }, { merge: true });

      setHasUnsavedChanges(false);
      notification.success({
        message: 'Success',
        description: 'Settings saved successfully!',
        placement: 'topRight'
      });
      return true;
    } catch (error) {
      console.error('Error saving settings:', error);
      notification.error({
        message: 'Error',
        description: 'Failed to save settings',
        placement: 'topRight'
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  useImperativeHandle(ref, () => ({
    handleSave: async () => {
      try {
        return await handleSave();
      } catch (error) {
        return false;
      }
    }
  }));

  const fetchSettings = async () => {
    try {
      const propertySettingsRef = doc(db, `properties/${propertyId}/propertySettings/rentalApplication`);
      const settingsDoc = await getDoc(propertySettingsRef);

      if (settingsDoc.exists()) {
        const data = settingsDoc.data();
        if (data.settings?.applicantInfo && data.settings.applicantInfo.length > 0) {
          // Set instructions from the first item
          const instructions = data.settings.applicantInfo[0]?.instructions || '';
          form.setFieldsValue({ instructions });

          // Create a new fields array starting with the default values
          const updatedFields = fields.map(field => ({
            ...field,
            enabled: false,
            required: false
          }));

          // Update fields with saved values
          data.settings.applicantInfo.slice(1).forEach((savedField: any) => {
            const fieldKey = Object.keys(savedField).find(key => 
              key !== 'required' && key !== 'lastUpdated'
            );

            if (fieldKey) {
              const fieldIndex = updatedFields.findIndex(
                f => f.name.replace(/\s+/g, '') === fieldKey
              );

              if (fieldIndex !== -1) {
                updatedFields[fieldIndex].enabled = Boolean(savedField[fieldKey]);
                updatedFields[fieldIndex].required = Boolean(savedField.required);

                // Restore locked fields to always enabled if they're locked
                if (updatedFields[fieldIndex].locked) {
                  updatedFields[fieldIndex].enabled = true;
                  updatedFields[fieldIndex].required = true;
                }
              }
            }
          });

          setFields(updatedFields);
          setHasUnsavedChanges(false);
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  // Make sure to call fetchSettings when component mounts
  useEffect(() => {
    fetchSettings();
  }, []);

  const handleFieldChange = (index: number, key: 'enabled' | 'required', value: boolean) => {
    const newFields = [...fields];
    
    if (key === 'enabled' && !value) {
      // If turning the switch off, also set required to false
      newFields[index] = { 
        ...newFields[index], 
        enabled: false,
        required: false 
      };
    } else {
      // Normal field update
      newFields[index] = { 
        ...newFields[index], 
        [key]: value 
      };
    }
    
    setFields(newFields);
    setHasUnsavedChanges(true);
  };

  // Add company settings view
  if (useCompanySettings) {
    return (
      <div style={{ padding: '24px' }}>
        <Title level={2} style={{ marginTop: 0 }}>Applicant Info</Title>
        
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
        <Title level={2} style={{ marginTop: 0 }}>Applicant Info</Title>

        <Form form={form} layout="vertical" onValuesChange={() => setHasUnsavedChanges(true)}>
          <Form.Item
            label="Any specific instructions for the application? These will be shown on the first page of the application."
            name="instructions"
          >
            <TextArea
              placeholder="Instructions for applicants"
              maxLength={5000}
              showCount
              style={{ height: 200 }}
            />
          </Form.Item>

          <div className="fields-header">
            <span>Field</span>
            <span>Required</span>
          </div>

          <div className="fields-container">
            {fields.map((field, index) => (
              <div key={field.name} className="field-row">
                <div className="field-left">
                  <Switch 
                    checked={field.enabled}
                    disabled={field.locked}
                    className={field.darkBlue ? 'switch-dark' : 'switch-light'}
                    onChange={(checked) => handleFieldChange(index, 'enabled', checked)}
                  />
                  <span>{field.name}</span>
                </div>
                <Checkbox 
                  checked={field.required} 
                  disabled={field.locked || !field.enabled} // Disable checkbox if switch is off
                  onChange={(e) => handleFieldChange(index, 'required', e.target.checked)}
                />
              </div>
            ))}
          </div>
        </Form>
      </div>
    </div>
  );
});

ApplicantInfoSettings.displayName = 'ApplicantInfoSettings';

export default ApplicantInfoSettings;
