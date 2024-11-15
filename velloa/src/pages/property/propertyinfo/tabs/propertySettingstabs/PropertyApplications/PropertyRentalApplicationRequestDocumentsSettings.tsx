import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Switch, Input, Typography, notification, Button } from 'antd';
import TextArea from 'antd/es/input/TextArea';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db, auth } from '../../../../../../firebase-config';
import './PropertyRentalApplicationApplicantInfoSettings.css';

const { Title, Text } = Typography;

interface RequestDocumentsSettingsProps {
  propertyId: string;
  useCompanySettings: boolean;
  setUseCompanySettings: (value: boolean) => void;
}

export interface RequestDocumentsSettingsRef {
  handleSave: () => Promise<boolean>;
}

interface DocumentRequest {
  id: number;
  name: string;
  instructions: string;
  mandatory: boolean;
}

const RequestDocumentsSettings = forwardRef<RequestDocumentsSettingsRef, RequestDocumentsSettingsProps>(({
  propertyId,
  useCompanySettings,
  setUseCompanySettings
}, ref) => {
  const [enableDocuments, setEnableDocuments] = useState(true);
  const [documents, setDocuments] = useState<DocumentRequest[]>([{
    id: 1,
    name: '',
    instructions: '',
    mandatory: false
  }]);
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
          documentRequests: {
            enabled: enableDocuments,
            documents: documents.map(doc => ({
              id: doc.id,
              name: doc.name,
              instructions: doc.instructions,
              mandatory: enableDocuments ? doc.mandatory : false,
              lastUpdated: Timestamp.now()
            })),
            lastUpdated: Timestamp.now()
          }
        }
      }, { merge: true });

      setHasUnsavedChanges(false);
      notification.success({
        message: 'Success',
        description: 'Document settings saved successfully!',
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
        if (data.settings?.documentRequests) {
          const docRequests = data.settings.documentRequests;
          setEnableDocuments(docRequests.enabled ?? true);
          
          if (docRequests.documents && Array.isArray(docRequests.documents)) {
            const loadedDocs = docRequests.documents.map((doc: DocumentRequest) => ({
              id: doc.id,
              name: doc.name,
              instructions: doc.instructions,
              mandatory: doc.mandatory
            }));
            setDocuments(loadedDocs);
          }
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
    </div>
  );
});

export default RequestDocumentsSettings;
