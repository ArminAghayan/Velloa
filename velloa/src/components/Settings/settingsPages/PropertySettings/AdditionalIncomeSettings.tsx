import React, { useState, useEffect } from 'react';
import { Form, Switch, Button, Checkbox, Typography, message } from 'antd';
import TextArea from 'antd/es/input/TextArea';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db, auth } from '../../../../firebase-config';
import './ApplicantInfoSettings.css';

const { Title } = Typography;

interface Field {
  name: string;
  required: boolean;
  enabled: boolean;
  darkBlue?: boolean;
  locked?: boolean;
}

const AdditionalIncomeSettings: React.FC = () => {
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

  const handleSave = async () => {
    try {
      setSaving(true);
      const currentUser = auth.currentUser;
      
      if (!currentUser?.uid) {
        message.error('No user found');
        return;
      }

      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      const companyId = userDoc.data()?.companyuid;

      if (!companyId) {
        message.error('No company found');
        return;
      }

      const additionalIncomeInfo = [
        {
          instructions: form.getFieldValue('instructions') || '',
          showAdditionalIncome,
          lastUpdated: Timestamp.now()
        },
        // If showAdditionalIncome is false, set all fields to disabled and not required
        ...fields.map(field => ({
          [field.name.replace(/[^a-zA-Z0-9]/g, '')]: showAdditionalIncome ? field.enabled : false,
          required: showAdditionalIncome ? field.required : false,
          lastUpdated: Timestamp.now()
        }))
      ];

      const settingsRef = doc(db, `companies/${companyId}/settings/rentalApplication`);
      await setDoc(settingsRef, { additionalIncomeInfo }, { merge: true });

      setHasUnsavedChanges(false);
      message.success('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      message.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser?.uid) return;

      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      const companyId = userDoc.data()?.companyuid;
      
      if (!companyId) return;

      const settingsRef = doc(db, `companies/${companyId}/settings/rentalApplication`);
      const settingsDoc = await getDoc(settingsRef);

      if (settingsDoc.exists()) {
        const data = settingsDoc.data();
        if (data.additionalIncomeInfo && data.additionalIncomeInfo.length > 0) {
          const firstItem = data.additionalIncomeInfo[0];
          form.setFieldsValue({ instructions: firstItem.instructions });
          setShowAdditionalIncome(firstItem.showAdditionalIncome ?? true);

          const updatedFields = fields.map(field => ({
            ...field,
            enabled: false,
            required: false
          }));

          data.additionalIncomeInfo.slice(1).forEach((savedField: any) => {
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

      <div style={{ 
        borderTop: '1px solid #f0f0f0',
        padding: '16px 24px',
        backgroundColor: '#fff',
        display: 'flex',
        justifyContent: 'flex-end',
        gap: 12
      }}>
        <Button 
          onClick={() => {
            form.resetFields();
            fetchSettings();
          }} 
          disabled={!hasUnsavedChanges}
        >
          Cancel
        </Button>
        <Button 
          type="primary" 
          onClick={handleSave} 
          loading={saving}
          disabled={!hasUnsavedChanges}
        >
          Save
        </Button>
      </div>
    </div>
  );
};

export default AdditionalIncomeSettings;
