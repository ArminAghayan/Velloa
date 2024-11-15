import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Form, Switch, Button, Checkbox, Typography, message } from 'antd';
import TextArea from 'antd/es/input/TextArea';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db, auth } from '../../../../../../firebase-config';
import './PropertyRentalApplicationApplicantInfoSettings.css';

const { Title } = Typography;

interface VehicleSettingsProps {
  propertyId: string;
  useCompanySettings: boolean;
  setUseCompanySettings: (value: boolean) => void;
}

export interface VehicleSettingsRef {
  handleSave: () => Promise<boolean>;
}

const VehicleSettings = forwardRef<VehicleSettingsRef, VehicleSettingsProps>(({
  propertyId,
  useCompanySettings,
  setUseCompanySettings
}, ref) => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showVehicle, setShowVehicle] = useState(true);
  const [fields, setFields] = useState([
    { name: 'Make', required: false, enabled: true, darkBlue: true },
    { name: 'Model', required: false, enabled: true, darkBlue: true },
    { name: 'Year', required: false, enabled: true, darkBlue: true },
    { name: 'Color', required: false, enabled: true, darkBlue: true },
    { name: 'License Plate', required: false, enabled: true, darkBlue: true },
    { name: 'State Registered', required: false, enabled: true, darkBlue: true },
  ]);

  const handleSave = async (): Promise<boolean> => {
    try {
      setSaving(true);
      const currentUser = auth.currentUser;
      
      if (!currentUser?.uid) {
        message.error('No user found');
        return false;
      }

      const vehicleInfo = [
        {
          instructions: form.getFieldValue('instructions') || '',
          enabled: showVehicle,
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
          vehicleInfo,
          lastUpdated: Timestamp.now()
        }
      }, { merge: true });

      setHasUnsavedChanges(false);
      message.success('Settings saved successfully!');
      return true;
    } catch (error) {
      console.error('Error saving settings:', error);
      message.error('Failed to save settings');
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
        if (data.settings?.vehicleInfo && data.settings.vehicleInfo.length > 0) {
          // Set instructions and enabled state from the first item
          const instructions = data.settings.vehicleInfo[0]?.instructions || '';
          const enabled = data.settings.vehicleInfo[0]?.enabled ?? true;
          form.setFieldsValue({ instructions });
          setShowVehicle(enabled);

          // Create a new fields array starting with the default values
          const updatedFields = fields.map(field => ({
            ...field,
            enabled: false,
            required: false
          }));

          // Update fields with saved values
          data.settings.vehicleInfo.slice(1).forEach((savedField: any) => {
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

  const handleShowVehicleChange = (checked: boolean) => {
    setShowVehicle(checked);
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

  useEffect(() => {
    fetchSettings();
  }, []);

  // Track changes to showVehicle
  useEffect(() => {
    setHasUnsavedChanges(true);
  }, [showVehicle]);

  if (useCompanySettings) {
    return (
      <div style={{ padding: '24px' }}>
        <Title level={2} style={{ marginTop: 0 }}>Vehicle Information</Title>
        
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
          <Title level={2} style={{ margin: 0 }}>Vehicle</Title>
          <Switch 
            checked={showVehicle}
            onChange={handleShowVehicleChange}
            className="switch-dark"
            checkedChildren="On"
            unCheckedChildren="Off"
          />
        </div>

        {showVehicle && (
          <Form 
            form={form} 
            layout="vertical"
            onValuesChange={() => setHasUnsavedChanges(true)}
          >
            <Form.Item
              label="Do you want to specify any additional instructions about their vehicle information?"
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
                      className={field.darkBlue ? 'switch-dark' : 'switch-light'}
                      onChange={(checked) => handleFieldChange(index, 'enabled', checked)}
                    />
                    <span>{field.name}</span>
                  </div>
                  <Checkbox 
                    checked={field.required} 
                    disabled={!field.enabled}
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

VehicleSettings.displayName = 'VehicleSettings';

export default VehicleSettings;
