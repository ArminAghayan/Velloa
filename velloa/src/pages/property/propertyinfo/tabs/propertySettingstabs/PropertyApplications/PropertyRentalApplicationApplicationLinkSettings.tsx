import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Button, Typography, Input, notification } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { db, auth } from '../../../../../../firebase-config';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Timestamp } from 'firebase/firestore';
import './PropertyRentalApplicationApplicantInfoSettings.css';
const { Title, Text } = Typography;

interface ApplicationLinkSettingsProps {
  propertyId: string;
  useCompanySettings: boolean;
  setUseCompanySettings: (value: boolean) => void;
}

const ApplicationLinkSettings = forwardRef<{ handleSave: () => Promise<boolean> }, ApplicationLinkSettingsProps>(
  ({ propertyId, useCompanySettings, setUseCompanySettings }, ref) => {
    const [companyuid, setCompanyuid] = useState<string>('');
    const [companyName, setCompanyName] = useState<string>('');
    const [loading, setLoading] = useState(true);

    const saveSettings = async () => {
      try {
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
          type: 'custom',
          settings: {
            applicationLink: {
              enabled: true,
              companyId: companyuid,
              companyName: companyName,
              lastUpdated: Timestamp.now()
            }
          }
        }, { merge: true });

        notification.success({
          message: 'Success',
          description: 'Application link settings saved successfully!',
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
      }
    };

    const fetchSettings = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser?.uid) return;

        // First get the company ID from user document
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          const companyId = userData.companyuid;
          setCompanyuid(companyId);

          // Then fetch company details using the company ID
          const companyDocRef = doc(db, 'companies', companyId);
          const companyDoc = await getDoc(companyDocRef);

          if (companyDoc.exists()) {
            const companyData = companyDoc.data();
            setCompanyName(companyData.companyName);
          }

          // Finally, fetch property-specific settings
          const propertySettingsRef = doc(db, `properties/${propertyId}/propertySettings/rentalApplication`);
          const settingsDoc = await getDoc(propertySettingsRef);

          if (settingsDoc.exists()) {
            const data = settingsDoc.data();
            if (data.settings?.applicationLink) {
              const linkSettings = data.settings.applicationLink;
              setCompanyuid(linkSettings.companyId || companyId);
              setCompanyName(linkSettings.companyName || companyId.companyName);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      fetchSettings();
    }, [propertyId]);

    const applicationLink = `https://${companyName.toLowerCase().replace(/\s+/g, '')}.localhost:3000/tenant-portal/rental-applications/listing?propertyId=${propertyId}&companyId=${companyuid}&source=PropertyLink`;

    const copyToClipboard = () => {
      navigator.clipboard.writeText(applicationLink)
        .then(() => {
          notification.success({
            message: 'Success',
            description: 'Link copied to clipboard',
            placement: 'topRight'
          });
        })
        .catch((err) => {
          console.error('Failed to copy link:', err);
          notification.error({
            message: 'Error',
            description: 'Failed to copy link',
            placement: 'topRight'
          });
        });
    };

    useImperativeHandle(ref, () => ({
      handleSave: saveSettings
    }));

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ maxWidth: 800, flex: 1, overflowY: 'auto', padding: '24px 12px 24px 24px' }}>
          <Title level={2} style={{ marginBottom: '8px' }}>Application Link</Title>
          <Text style={{ 
            fontSize: '16px', 
            marginBottom: '32px', 
            display: 'block', 
            color: '#666',
            lineHeight: '1.5'
          }}>
            Share your company application link with your prospects to help them get started with the application process for the available units.
          </Text>

          <div style={{ 
            position: 'relative',
            marginBottom: '24px'
          }}>
            <Input
              value={applicationLink}
              readOnly
              style={{ 
                padding: '16px',
                paddingRight: '48px',
                background: '#f5f5f5',
                borderRadius: '8px'
              }}
            />
            <Button
              type="text"
              icon={<CopyOutlined />}
              onClick={copyToClipboard}
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                border: 'none',
                background: 'none'
              }}
            />
          </div>
        </div>
      </div>
    );
  }
);

ApplicationLinkSettings.displayName = 'ApplicationLinkSettings';

export default ApplicationLinkSettings;
