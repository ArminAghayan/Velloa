import React, { useState, useEffect } from 'react';
import { Form, Switch, Button, Checkbox, Typography, message } from 'antd';
import TextArea from 'antd/es/input/TextArea';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db, auth } from '../../../../firebase-config';
import './ApplicantInfoSettings.css'; // We'll add custom styles
const { Title } = Typography;

const ApplicantInfoSettings: React.FC = () => {
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

      // Transform fields into the desired format
      const applicantInfo = [
        // Add instructions as first item in array
        {
          instructions: form.getFieldValue('instructions') || '',
          lastUpdated: Timestamp.now()
        },
        // Add all field settings
        ...fields.map(field => ({
          [field.name.replace(/\s+/g, '')]: field.enabled,
          required: field.required,
          lastUpdated: Timestamp.now()
        }))
      ];

      const settingsRef = doc(db, `companies/${companyId}/settings/rentalApplication`);
      await setDoc(settingsRef, { applicantInfo }, { merge: true });

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
        if (data.applicantInfo && data.applicantInfo.length > 0) {
          // Set instructions from the first item
          const instructions = data.applicantInfo[0]?.instructions || '';
          form.setFieldsValue({ instructions });

          // Create a new fields array starting with the default values
          const updatedFields = fields.map(field => ({
            ...field,
            enabled: false, // Set default to false
            required: false // Set default to false
          }));

          // Update fields with saved values
          data.applicantInfo.slice(1).forEach((savedField: any) => {
            const fieldKey = Object.keys(savedField).find(key => 
              key !== 'required' && key !== 'lastUpdated'
            );

            if (fieldKey) {
              const fieldIndex = updatedFields.findIndex(
                f => f.name.replace(/\s+/g, '') === fieldKey
              );

              if (fieldIndex !== -1) {
                // Explicitly set the enabled and required values from saved data
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

          console.log('Updated Fields:', updatedFields); // Debug log
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

      <div style={{ 
        borderTop: '1px solid #f0f0f0',
        padding: '16px 24px',
        backgroundColor: '#fff',
        display: 'flex',
        justifyContent: 'flex-end',
        gap: 12
      }}>
        <Button onClick={() => {
          form.resetFields();
          fetchSettings();
        }} disabled={!hasUnsavedChanges}>
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

export default ApplicantInfoSettings;
