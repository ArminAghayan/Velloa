import React, { useState, useEffect } from 'react';
import { Switch, Button, Input, Typography, message } from 'antd';
import TextArea from 'antd/es/input/TextArea';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db, auth } from '../../../../firebase-config';
import './ApplicantInfoSettings.css';

const { Title, Text } = Typography;

interface DocumentRequest {
  id: number;
  name: string;
  instructions: string;
  mandatory: boolean;
}

const RequestDocumentsSettings: React.FC = () => {
  const [enableDocuments, setEnableDocuments] = useState(true);
  const [documents, setDocuments] = useState<DocumentRequest[]>([{
    id: 1,
    name: '',
    instructions: '',
    mandatory: false
  }]);
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

      const documentFields = {
        settings: {
          enableDocuments,
          lastUpdated: Timestamp.now()
        },
        documents: documents.map(doc => ({
          name: doc.name,
          instructions: doc.instructions,
          mandatory: enableDocuments ? doc.mandatory : false,
          lastUpdated: Timestamp.now()
        }))
      };

      const settingsRef = doc(db, `companies/${companyId}/settings/rentalApplication`);
      await setDoc(settingsRef, { documentRequests: documentFields }, { merge: true });

      setHasUnsavedChanges(false);
      message.success('Document settings saved successfully!');
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
        if (data.documentRequests) {
          const { settings, documents: savedDocs } = data.documentRequests;
          setEnableDocuments(settings.enableDocuments ?? true);
          
          if (savedDocs && Array.isArray(savedDocs)) {
            const loadedDocs = savedDocs.map((doc, index) => ({
              id: index + 1,
              name: doc.name,
              instructions: doc.instructions,
              mandatory: doc.mandatory
            }));
            
            setDocuments(loadedDocs);
          }
          setHasUnsavedChanges(false);
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const addDocument = () => {
    const newId = documents.length + 1;
    setDocuments([...documents, {
      id: newId,
      name: '',
      instructions: '',
      mandatory: false
    }]);
    setHasUnsavedChanges(true);
  };

  const removeDocument = (id: number) => {
    if (documents.length > 1) {
      setDocuments(documents.filter(doc => doc.id !== id));
      setHasUnsavedChanges(true);
    }
  };

  const updateDocument = (id: number, field: keyof DocumentRequest, value: string | boolean) => {
    setDocuments(documents.map(doc => 
      doc.id === id ? { ...doc, [field]: value } : doc
    ));
    setHasUnsavedChanges(true);
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
          <Title level={2} style={{ margin: 0 }}>Request Documents</Title>
          <Switch 
            checked={enableDocuments}
            onChange={setEnableDocuments}
            className="switch-dark"
            checkedChildren="On"
            unCheckedChildren="Off"
          />
        </div>
        
        <Text style={{ fontSize: '16px', marginBottom: '32px', display: 'block', color: '#666' }}>
          You can ask applicants to upload files such as a photo of their driver license, bank statements and more.
        </Text>

        {enableDocuments && (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <Title level={4} style={{ marginBottom: '8px' }}>Additional Attachments</Title>
              <Text type="secondary">Limited to one file per attachment</Text>
            </div>

            {documents.map((doc) => (
              <div key={doc.id} style={{ 
                padding: '24px',
                borderRadius: '8px',
                marginBottom: '16px',
                border: '1px solid #f5f5f5'
              }}>
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start'
                  }}>
                    <div style={{ flex: 1 }}>
                      <Text strong style={{ display: 'block', marginBottom: '8px' }}>
                        Attachment Name *
                      </Text>
                      <Input 
                        value={doc.name}
                        onChange={(e) => updateDocument(doc.id, 'name', e.target.value)}
                        maxLength={50}
                        showCount
                      />
                    </div>
                    {documents.length > 1 && (
                      <Button 
                        type="text"
                        icon={<DeleteOutlined style={{ color: '#e53e3e' }} />}
                        onClick={() => removeDocument(doc.id)}
                        style={{ marginLeft: '16px' }}
                      />
                    )}
                  </div>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <Text strong style={{ display: 'block', marginBottom: '8px' }}>
                    Instructions
                  </Text>
                  <TextArea
                    value={doc.instructions}
                    onChange={(e) => updateDocument(doc.id, 'instructions', e.target.value)}
                    maxLength={500}
                    showCount
                    style={{ height: 120 }}
                  />
                </div>

                <div>
                  <Switch 
                    checked={doc.mandatory}
                    onChange={(checked) => updateDocument(doc.id, 'mandatory', checked)}
                    className="switch-dark"
                    checkedChildren=""
                    unCheckedChildren=""
                  />
                  <span style={{ marginLeft: '12px' }}>Mark As Mandatory</span>
                </div>
              </div>
            ))}

            <Button 
              type="link" 
              icon={<PlusOutlined />}
              onClick={addDocument}
              style={{ padding: 0, color: '#1a365d' }}
            >
              Add Another File
            </Button>
          </div>
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

export default RequestDocumentsSettings;
