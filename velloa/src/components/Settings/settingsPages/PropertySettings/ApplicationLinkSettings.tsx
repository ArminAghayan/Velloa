import React, { useState, useEffect } from 'react';
import { Button, Typography, Input } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { db, auth } from '../../../../firebase-config';
import { doc, getDoc } from 'firebase/firestore';
import './ApplicantInfoSettings.css';
const { Title, Text } = Typography;

const ApplicationLinkSettings: React.FC = () => {
  const [companyuid, setCompanyuid] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompanyDetails = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser?.uid) {
          console.error('No user UID found');
          return;
        }

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
          } else {
            console.error('Company document not found');
          }
        } else {
          console.error('User document not found');
        }
      } catch (error) {
        console.error('Error fetching company details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyDetails();
  }, []);

  const applicationLink = `https://${companyName.toLowerCase().replace(/\s+/g, '')}.app.doorloop.com/tenant-portal/rental-applications/listing?companyId=${companyuid}&source=CompanyLink`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(applicationLink)
      .then(() => {
        // You might want to add a notification here to show the copy was successful
        console.log('Link copied to clipboard');
      })
      .catch((err) => {
        console.error('Failed to copy link:', err);
      });
  };

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

      <div style={{ 
        borderTop: '1px solid #f0f0f0',
        padding: '16px 24px',
        backgroundColor: '#fff',
        display: 'flex',
        justifyContent: 'flex-end',
        gap: 12
      }}>
        <Button>Cancel</Button>
        <Button type="primary">Save</Button>
      </div>
    </div>
  );
};

export default ApplicationLinkSettings;
