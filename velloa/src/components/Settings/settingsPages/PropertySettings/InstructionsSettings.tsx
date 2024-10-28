import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Typography, message } from 'antd';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db, auth } from '../../../../firebase-config';

const { Title, Text } = Typography;
const { TextArea } = Input;

const InstructionsSettings: React.FC = () => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const handleSubmit = async (values: { instructions: string }) => {
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

      const instructions = [{
        data: values.instructions,
        lastUpdated: Timestamp.now()
      }];

      const settingsRef = doc(db, `companies/${companyId}/settings/rentalApplication`);
      await setDoc(settingsRef, { instructions }, { merge: true });

      setHasUnsavedChanges(false);
      message.success('Instructions saved successfully!');
    } catch (error) {
      console.error('Error saving instructions:', error);
      message.error('Failed to save instructions');
    } finally {
      setSaving(false);
    }
  };

  // Fetch existing instructions
  useEffect(() => {
    const fetchInstructions = async () => {
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
          const instructions = data.instructions?.[0]?.data || '';
          form.setFieldsValue({ instructions });
        }
      } catch (error) {
        console.error('Error fetching instructions:', error);
      }
    };

    fetchInstructions();
  }, [form]);

  // Track changes
  const handleValuesChange = () => {
    setHasUnsavedChanges(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ maxWidth: 800, flex: 1, overflowY: 'auto', padding: '24px 12px 24px 24px' }}>
        <Title level={2} style={{ marginTop: 0 }}>Instructions</Title>
        
        <Text style={{ color: '#666', display: 'block', marginBottom: 16 }}>
          Any specific instructions for the application? These will be shown on the first page of the application.
        </Text>
        
        <Form 
          form={form} 
          onFinish={handleSubmit} 
          layout="vertical"
          onValuesChange={handleValuesChange}
        >
          <Form.Item
            label="Instructions"
            name="instructions"
          >
            <TextArea 
              rows={6}
              showCount
              maxLength={5000}
              placeholder="Enter instructions for applicants"
            />
          </Form.Item>

          <Text style={{ color: '#666', display: 'block' }}>
            i.e. Please fill out all the information, if you have any questions,<br />
            contact us at 555-123-4556
          </Text>
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
        <Button onClick={() => form.resetFields()} disabled={!hasUnsavedChanges}>
          Cancel
        </Button>
        <Button 
          type="primary" 
          onClick={() => form.submit()} 
          loading={saving}
          disabled={!hasUnsavedChanges}
        >
          Save
        </Button>
      </div>
    </div>
  );
};

export default InstructionsSettings;
