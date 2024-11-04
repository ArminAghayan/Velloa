import React, { useState, useEffect } from 'react';
import { Form, Switch, Button, Typography, message } from 'antd';
import TextArea from 'antd/es/input/TextArea';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db, auth } from '../../../../firebase-config';
import './ApplicantInfoSettings.css';

const { Title, Text } = Typography;

const TermsAndConditionsSettings: React.FC = () => {
  const [form] = Form.useForm();
  const [enableTerms, setEnableTerms] = useState(true);
  const [terms, setTerms] = useState('');
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

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

      const termsFields = {
        settings: {
          enableTerms,
          terms: terms.trim(),
          lastUpdated: Timestamp.now()
        }
      };

      const settingsRef = doc(db, `companies/${companyId}/settings/rentalApplication`);
      await setDoc(settingsRef, { termsAndConditions: termsFields }, { merge: true });

      setHasUnsavedChanges(false);
      message.success('Terms and conditions saved successfully!');
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
        if (data.termsAndConditions?.settings) {
          const { enableTerms: savedEnable, terms: savedTerms } = data.termsAndConditions.settings;
          setEnableTerms(savedEnable ?? true);
          setTerms(savedTerms || '');
          setHasUnsavedChanges(false);
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ maxWidth: 800, flex: 1, overflowY: 'auto', padding: '24px 12px 24px 24px' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <Title level={2} style={{ margin: 0 }}>Terms & Conditions</Title>
          <Switch 
            checked={enableTerms}
            onChange={(checked) => {
              setEnableTerms(checked);
              setHasUnsavedChanges(true);
            }}
            className="switch-dark"
            checkedChildren="On"
            unCheckedChildren="Off"
          />
        </div>
        
        <Text style={{ 
          fontSize: '16px', 
          marginBottom: '32px', 
          display: 'block', 
          color: '#666',
          lineHeight: '1.5'
        }}>
          You can add additional terms and conditions for submitting a rental application. Each applicant will be required to accept these terms and conditions before submitting their application.
        </Text>

        {enableTerms && (
          <Form form={form} layout="vertical">
            <div style={{ marginBottom: '24px' }}>
              <Text strong style={{ display: 'block', marginBottom: '8px' }}>
                Terms & Conditions *
              </Text>
              <TextArea
                value={terms}
                onChange={(e) => {
                  setTerms(e.target.value);
                  setHasUnsavedChanges(true);
                }}
                maxLength={10000}
                showCount
                style={{ height: 300 }}
                placeholder="Enter your terms and conditions here"
              />
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
          onClick={fetchSettings}
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
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </div>
  );
};

export default TermsAndConditionsSettings;
