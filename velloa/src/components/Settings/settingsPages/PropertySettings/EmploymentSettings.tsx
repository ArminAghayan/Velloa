import React, { useState, useEffect } from 'react';
import { Form, Switch, Button, Checkbox, Typography, message } from 'antd';
import TextArea from 'antd/es/input/TextArea';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db, auth } from '../../../../firebase-config';
import './ApplicantInfoSettings.css';

const { Title } = Typography;

const EmploymentSettings: React.FC = () => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [fields, setFields] = useState([
    { name: 'Job Type', required: true, enabled: true, locked: true },
    { name: 'Annual Income', required: true, enabled: true, locked: true },
    { name: 'Title Position', required: false, enabled: false, darkBlue: true },
    { name: 'Company Name', required: true, enabled: true, locked: true },
    { name: 'I currently work here', required: false, enabled: false, darkBlue: true },
    { name: 'Start date', required: false, enabled: false, darkBlue: true },
    { name: 'End date', required: false, enabled: false, darkBlue: true },
    { name: 'Supervisor Name', required: false, enabled: false, darkBlue: true },
    { name: 'Supervisor Email', required: false, enabled: false, darkBlue: true },
    { name: 'Supervisor Phone', required: false, enabled: false, darkBlue: true },
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

      const employmentInfo = [
        // Add instructions as first item in array
        {
          instructions: form.getFieldValue('instructions') || '',
          lastUpdated: Timestamp.now()
        },
        // Add all field settings
        ...fields.map(field => ({
          [field.name.replace(/[^a-zA-Z0-9]/g, '')]: field.enabled,
          required: field.required,
          lastUpdated: Timestamp.now()
        }))
      ];

      const settingsRef = doc(db, `companies/${companyId}/settings/rentalApplication`);
      await setDoc(settingsRef, { employmentInfo }, { merge: true });

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
        if (data.employmentInfo && data.employmentInfo.length > 0) {
          // Set instructions from the first item
          const instructions = data.employmentInfo[0]?.instructions || '';
          form.setFieldsValue({ instructions });

          // Create a new fields array starting with the default values
          const updatedFields = fields.map(field => ({
            ...field,
            enabled: false,
            required: false
          }));

          // Update fields with saved values
          data.employmentInfo.slice(1).forEach((savedField: any) => {
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

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ maxWidth: 800, flex: 1, overflowY: 'auto', padding: '24px 12px 24px 24px' }}>
        <Title level={2} style={{ marginTop: 0 }}>Employment</Title>

        <Form 
          form={form} 
          layout="vertical"
          onValuesChange={() => setHasUnsavedChanges(true)}
        >
          <Form.Item
            label="Do you want to specify any additional instructions about their employment?"
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

export default EmploymentSettings;
