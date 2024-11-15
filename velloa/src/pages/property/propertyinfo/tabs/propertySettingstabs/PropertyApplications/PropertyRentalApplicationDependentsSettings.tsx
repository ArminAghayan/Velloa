import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Form, Switch, Button, Checkbox, Typography, notification } from 'antd';
import TextArea from 'antd/es/input/TextArea';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db, auth } from '../../../../../../firebase-config';
import './PropertyRentalApplicationApplicantInfoSettings.css';
const { Title } = Typography;

interface Field {
  name: string;
  required: boolean;
  enabled: boolean;
  darkBlue?: boolean;
  locked?: boolean;
}

export interface DependentsSettingsRef {
  handleSave: () => Promise<boolean>;
}

interface DependentsSettingsProps {
  propertyId: string;
  useCompanySettings: boolean;
  setUseCompanySettings: (value: boolean) => void;
}

const DependentsSettings = forwardRef<DependentsSettingsRef, DependentsSettingsProps>(({
  propertyId,
  useCompanySettings,
  setUseCompanySettings
}, ref) => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showDependents, setShowDependents] = useState(true);
  const [fields, setFields] = useState<Field[]>([
    { name: 'First Name', required: false, enabled: true, darkBlue: true },
    { name: 'Last Name', required: false, enabled: true, darkBlue: true },
    { name: 'Date of Birth', required: false, enabled: true, darkBlue: true },
    { name: 'Relationship', required: false, enabled: true, darkBlue: true },
    { name: 'Occupation', required: false, enabled: true, darkBlue: true },
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

      const dependentsInfo = [
        {
          instructions: form.getFieldValue('instructions') || '',
          enabled: showDependents,
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
          dependentsInfo,
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
        if (data.settings?.dependentsInfo && data.settings.dependentsInfo.length > 0) {
          // Set instructions and toggle state from the first item
          const instructions = data.settings.dependentsInfo[0]?.instructions || '';
          const enabled = data.settings.dependentsInfo[0]?.enabled ?? true; // Default to true if not set
          form.setFieldsValue({ instructions });
          setShowDependents(enabled);

          // Create a new fields array starting with the default values
          const updatedFields = fields.map(field => ({
            ...field,
            enabled: false,
            required: false
          }));

          // Update fields with saved values
          data.settings.dependentsInfo.slice(1).forEach((savedField: any) => {
            const fieldKey = Object.keys(savedField).find(key => 
              key !== 'required' && key !== 'lastUpdated'
            );

            if (fieldKey) {
              const fieldIndex = updatedFields.findIndex(
                f => f.name.replace(/[^a-zA-Z0-9]/g, '') === fieldKey
              );

              if (fieldIndex !== -1) {
                updatedFields[fieldIndex].enabled = Boolean(savedField[fieldKey]);
                updatedFields[fieldIndex].required = Boolean(savedField.required);
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

  const handleFieldChange = (index: number, key: 'enabled' | 'required', value: boolean) => {
    const newFields = [...fields];
    
    if (key === 'enabled' && !value) {
      newFields[index] = { 
        ...newFields[index], 
        enabled: false,
        required: false 
      };
    } else {
      newFields[index] = { 
        ...newFields[index], 
        [key]: value 
      };
    }
    
    setFields(newFields);
    setHasUnsavedChanges(true);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    setHasUnsavedChanges(true);
  }, [showDependents]);

  // Add this function to handle the main switch toggle
  const handleShowDependentsChange = (checked: boolean) => {
    setShowDependents(checked);
    if (!checked) {
      // If turning off, disable all fields and remove required
      const updatedFields = fields.map(field => ({
        ...field,
        enabled: false,
        required: false
      }));
      setFields(updatedFields);
    }
  };

  if (useCompanySettings) {
    return (
      <div style={{ padding: '24px' }}>
        <Title level={2} style={{ marginTop: 0 }}>Dependents Information</Title>

      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ maxWidth: 800, flex: 1, overflowY: 'auto', padding: '24px 12px 24px 24px' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <Title level={2} style={{ margin: 0 }}>Dependents</Title>
          <Switch 
            checked={showDependents}
            onChange={handleShowDependentsChange}
            className="switch-dark"
            checkedChildren="On"
            unCheckedChildren="Off"
          />
        </div>

        {showDependents && (
          <Form 
            form={form} 
            layout="vertical"
            onValuesChange={() => setHasUnsavedChanges(true)}
          >
            <Form.Item
              label="Do you want to specify any additional instructions about their dependents?"
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
                    disabled={field.locked || !field.enabled}
                    onChange={(e) => handleFieldChange(index, 'required', e.target.checked)}
                  />
                </div>
              ))}
            </div>
          </Form>
        )}
      </div>
    </div>
  );
});

DependentsSettings.displayName = 'DependentsSettings';

export default DependentsSettings;
