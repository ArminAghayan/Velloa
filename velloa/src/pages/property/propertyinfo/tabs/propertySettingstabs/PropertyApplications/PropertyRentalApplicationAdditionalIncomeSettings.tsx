import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Form, Switch, Checkbox, Typography, notification } from 'antd';
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

interface AdditionalIncomeSettingsProps {
  propertyId: string;
  useCompanySettings: boolean;
  setUseCompanySettings: (value: boolean) => void;
}

export interface AdditionalIncomeSettingsRef {
  handleSave: () => Promise<boolean>;
}

const AdditionalIncomeSettings = forwardRef<AdditionalIncomeSettingsRef, AdditionalIncomeSettingsProps>(({
  propertyId,
  useCompanySettings,
  setUseCompanySettings
}, ref) => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showAdditionalIncome, setShowAdditionalIncome] = useState(true);
  const [fields, setFields] = useState<Field[]>([
    { name: 'Income Type', required: false, enabled: true, darkBlue: true },
    { name: 'Monthly Amount', required: false, enabled: true, darkBlue: true },
    { name: 'Source/Provider', required: false, enabled: true, darkBlue: true },
    { name: 'Contact Person', required: false, enabled: true, darkBlue: true },
    { name: 'Phone Number', required: false, enabled: true, darkBlue: true },
    { name: 'Email', required: false, enabled: true, darkBlue: true },
    { name: 'Verification Document', required: false, enabled: true, darkBlue: true },
    { name: 'Bank Account Balance', required: false, enabled: true, darkBlue: true },
    { name: 'Investment Accounts', required: false, enabled: true, darkBlue: true },
    { name: 'Real Estate Assets', required: false, enabled: true, darkBlue: true },
    { name: 'Other Assets', required: false, enabled: true, darkBlue: true },
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

      const propertySettingsRef = doc(db, `properties/${propertyId}/propertySettings/rentalApplication`);
      await setDoc(propertySettingsRef, {
        settings: {
          additionalIncomeInfo: {
            enabled: showAdditionalIncome,
            instructions: form.getFieldValue('instructions') || '',
            fields: fields.map(field => ({
              name: field.name,
              enabled: field.enabled,
              required: field.required
            })),
            lastUpdated: Timestamp.now()
          }
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
        if (data.settings?.additionalIncomeInfo) {
          const incomeInfo = data.settings.additionalIncomeInfo;
          
          // Set instructions and main toggle
          form.setFieldsValue({ 
            instructions: incomeInfo.instructions || '' 
          });
          setShowAdditionalIncome(incomeInfo.enabled ?? true);

          // Update fields if they exist
          if (incomeInfo.fields) {
            const updatedFields = fields.map(defaultField => {
              const savedField = incomeInfo.fields.find((f: any) => f.name === defaultField.name);
              return {
                ...defaultField,
                enabled: savedField ? savedField.enabled : defaultField.enabled,
                required: savedField ? savedField.required : defaultField.required,
              };
            });
            setFields(updatedFields);
          }
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

  const handleShowAdditionalIncomeChange = (checked: boolean) => {
    setShowAdditionalIncome(checked);
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

  useEffect(() => {
    setHasUnsavedChanges(true);
  }, [showAdditionalIncome]);

  if (useCompanySettings) {
    return (
      <div style={{ padding: '24px' }}>
        <Title level={2} style={{ marginTop: 0 }}>Additional Income & Assets</Title>
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
          <Title level={2} style={{ margin: 0 }}>Additional Income & Assets</Title>
          <Switch 
            checked={showAdditionalIncome}
            onChange={handleShowAdditionalIncomeChange}
            className="switch-dark"
            checkedChildren="On"
            unCheckedChildren="Off"
          />
        </div>

        {showAdditionalIncome && (
          <Form 
            form={form} 
            layout="vertical"
            onValuesChange={() => setHasUnsavedChanges(true)}
          >
            <Form.Item
              label="Do you want to specify any additional instructions about their additional income and assets?"
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

AdditionalIncomeSettings.displayName = 'AdditionalIncomeSettings';

export default AdditionalIncomeSettings;
