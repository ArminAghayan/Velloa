import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Form, Switch, Typography, notification } from 'antd';
import TextArea from 'antd/es/input/TextArea';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db, auth } from '../../../../../../firebase-config';
import './PropertyRentalApplicationApplicantInfoSettings.css';

const { Title, Text } = Typography;

interface TermsAndConditionsSettingsProps {
  propertyId: string;
  useCompanySettings: boolean;
  setUseCompanySettings: (value: boolean) => void;
}

export interface TermsAndConditionsSettingsRef {
  handleSave: () => Promise<boolean>;
}

const TermsAndConditionsSettings = forwardRef<TermsAndConditionsSettingsRef, TermsAndConditionsSettingsProps>(({
  propertyId,
  useCompanySettings,
  setUseCompanySettings
}, ref) => {
  const [form] = Form.useForm();
  const [enableTerms, setEnableTerms] = useState(true);
  const [terms, setTerms] = useState('');
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

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
          termsAndConditions: {
            enabled: enableTerms,
            terms: terms.trim(),
            lastUpdated: Timestamp.now()
          }
        }
      }, { merge: true });

      setHasUnsavedChanges(false);
      notification.success({
        message: 'Success',
        description: 'Terms and conditions saved successfully!',
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
        if (data.settings?.termsAndConditions) {
          const termsInfo = data.settings.termsAndConditions;
          setEnableTerms(termsInfo.enabled ?? true);
          setTerms(termsInfo.terms || '');
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

  if (useCompanySettings) {
    return (
      <div style={{ padding: '24px' }}>
        <Title level={2} style={{ marginTop: 0 }}>Terms & Conditions</Title>
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
    </div>
  );
});

TermsAndConditionsSettings.displayName = 'TermsAndConditionsSettings';

export default TermsAndConditionsSettings;
