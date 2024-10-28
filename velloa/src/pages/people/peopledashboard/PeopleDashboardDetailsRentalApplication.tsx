import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebase-config';
import { Typography, Button, Spin, Result, message } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import { getFunctions, httpsCallable } from 'firebase/functions';

const { Title, Paragraph } = Typography;

interface ProspectsDetailsRentalApplicationProps {
  personId: string;
  companyId: string;
}

function ProspectsDetailsRentalApplication({ personId, companyId }: ProspectsDetailsRentalApplicationProps) {
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [personData, setPersonData] = useState<any>(null);

  useEffect(() => {
    async function fetchApplicationStatus() {
      try {
        const personDocRef = doc(db, 'people', personId);
        const personDoc = await getDoc(personDocRef);
        
        if (personDoc.exists()) {
          const data = personDoc.data();
          setPersonData(data);
          setApplicationStatus(data.applicationStatus || 'Not Started');
        } else {
          setApplicationStatus('Not Found');
        }
      } catch (err) {
        console.error('Error fetching application status:', err);
        setError('Unable to fetch application status. Please try again later.');
        setApplicationStatus('Error');
      }
    }

    fetchApplicationStatus();
  }, [personId]);

  const handleSendApplication = async () => {
    setLoading(true);
    try {
      const functions = getFunctions();
      const sendApplicationEmail = httpsCallable(functions, 'sendApplicationEmail');

      // Prepare the data to send to the Cloud Function
      const emailData = {
        personId,
        companyId
      };

      // Call the Cloud Function
      const result = await sendApplicationEmail(emailData);
      console.log('Cloud Function result:', result.data);

      // Update application status in Firestore
      const personDocRef = doc(db, 'people', personId);
      await updateDoc(personDocRef, {
        applicationStatus: 'Sent',
        applicationSentDate: new Date()
      });

      // Update local state
      setApplicationStatus('Sent');
      message.success('Application sent successfully!');
    } catch (err) {
      console.error('Error sending application:', err);
      message.error('Failed to send application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return <Result status="error" title="Error" subTitle={error} />;
  }

  if (applicationStatus === null) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Spin size="large" />
      </div>
    );
  }

  const getStatusInfo = () => {
    switch (applicationStatus) {
      case 'Sent':
        return {
          title: 'Application Sent',
          subTitle: "The prospect has received a rental application, we're waiting for the application to be filled out.",
          buttonText: 'Resend Application'
        };
      case 'Not Started':
        return {
          title: 'Application Not Started',
          subTitle: "The application hasn't been started yet.",
          buttonText: 'Send Application'
        };
      default:
        return {
          title: 'Application Status',
          subTitle: `Current status: ${applicationStatus}`,
          buttonText: 'Send Application'
        };
    }
  };

  const { title, subTitle, buttonText } = getStatusInfo();

  return (
    <Result
      icon={<img src="/assets/Sent Message-cuate.png" alt="Application Status" style={{ width: 300, height: 300 }} />}
      title={<Title level={2}>{title}</Title>}
      subTitle={<Paragraph>{subTitle}</Paragraph>}
      extra={
        <Button 
          type="primary" 
          icon={<SendOutlined />} 
          onClick={handleSendApplication}
          loading={loading}
        >
          {buttonText}
        </Button>
      }
    />
  );
}

export default ProspectsDetailsRentalApplication;
