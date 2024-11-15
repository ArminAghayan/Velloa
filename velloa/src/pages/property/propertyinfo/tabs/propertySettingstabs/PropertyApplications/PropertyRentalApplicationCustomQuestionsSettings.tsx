import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Form, Switch, Button, Input, Typography, Select, notification } from 'antd';
import TextArea from 'antd/es/input/TextArea';
import { PlusOutlined, CloseOutlined } from '@ant-design/icons';
import { doc, getDoc, setDoc, Timestamp, arrayRemove, arrayUnion } from 'firebase/firestore';
import { auth, db } from '../../../../../../firebase-config';
import './PropertyRentalApplicationApplicantInfoSettings.css';
const { Title, Text } = Typography;

interface Question {
  id: number;
  question: string;
  type: string;
}

interface CustomQuestionsSettingsProps {
  propertyId: string;
  useCompanySettings: boolean;
  setUseCompanySettings: (value: boolean) => void;
}

interface QuestionInfo {
  id: number;
  question: string;
  type: string;
  required: boolean;
  enabled: boolean;
  lastUpdated: Timestamp;
}

export interface CustomQuestionsSettingsRef {
  handleSave: () => Promise<boolean>;
}

const CustomQuestionsSettings = forwardRef<CustomQuestionsSettingsRef, CustomQuestionsSettingsProps>(({
  propertyId,
  useCompanySettings,
  setUseCompanySettings
}, ref) => {
  const [form] = Form.useForm();
  const [askAdditionalQuestions, setAskAdditionalQuestions] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([{ id: 1, question: '', type: 'Yes/No' }]);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const addQuestion = () => {
    const newId = questions.length + 1;
    setQuestions([...questions, { id: newId, question: '', type: 'Yes/No' }]);
    setHasUnsavedChanges(true);
  };

  const removeQuestion = (id: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter(q => q.id !== id));
      setHasUnsavedChanges(true);
    }
  };

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
          customQuestionsInfo: {
            enabled: askAdditionalQuestions,
            instructions: form.getFieldValue('instructions') || '',
            questions: questions.map(q => ({
              id: q.id,
              question: q.question,
              type: q.type,
              required: true,
              enabled: true,
              lastUpdated: Timestamp.now()
            })),
            lastUpdated: Timestamp.now()
          }
        }
      }, { merge: true });

      setHasUnsavedChanges(false);
      notification.success({
        message: 'Success',
        description: 'Settings saved successfully!',
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
        if (data.settings?.customQuestionsInfo) {
          const questionsInfo = data.settings.customQuestionsInfo;
          
          setAskAdditionalQuestions(questionsInfo.enabled ?? true);
          form.setFieldsValue({ 
            instructions: questionsInfo.instructions || '' 
          });
          
          if (questionsInfo.questions && Array.isArray(questionsInfo.questions)) {
            const loadedQuestions = questionsInfo.questions.map((q: QuestionInfo) => ({
              id: q.id,
              question: q.question,
              type: q.type
            }));
            setQuestions(loadedQuestions);
          }
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
          marginBottom: '24px'
        }}>
          <Title level={2} style={{ margin: 0 }}>Custom Questions</Title>
          <Switch 
            checked={askAdditionalQuestions}
            onChange={setAskAdditionalQuestions}
            className="switch-dark"
            checkedChildren="On"
            unCheckedChildren="Off"
          />
        </div>

        <Text style={{ fontSize: '16px', marginBottom: '16px', display: 'block' }}>
          Do you want to ask them more questions?
        </Text>

        {askAdditionalQuestions && (
          <Form form={form} layout="vertical">
            <Form.Item
              label="Instructions"
              name="instructions"  // Add this to bind to form
            >
              <TextArea
                placeholder="Instructions for applicants"
                maxLength={5000}
                showCount
                style={{ height: 200 }}
                onChange={(e) => {
                  setHasUnsavedChanges(true);
                }}
              />
            </Form.Item>

            <div style={{ 
              padding: '24px',
              borderRadius: '8px',
              marginTop: '24px'
            }}>
              <Title level={4} style={{ marginTop: 0 }}>Additional Questions</Title>

              {questions.map((q) => (
                <div key={q.id} style={{ 
                  display: 'flex', 
                  gap: '16px', 
                  marginBottom: '16px',
                  alignItems: 'flex-start'
                }}>
                  <div 
                    style={{ 
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: '#188034',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      cursor: questions.length > 1 ? 'pointer' : 'default',
                      transition: 'all 0.3s'
                    }}
                    className="question-number"
                    onClick={() => removeQuestion(q.id)}
                  >
                    <span className="number">{q.id}</span>
                    {questions.length > 1 && <CloseOutlined className="delete-icon" />}
                  </div>
                  <Form.Item 
                    style={{ flex: 1, marginBottom: 0 }}
                    required
                  >
                    <Input 
                      placeholder="Question" 
                      value={q.question}
                      onChange={(e) => {
                        const newQuestions = questions.map(question => 
                          question.id === q.id 
                            ? { ...question, question: e.target.value }
                            : question
                        );
                        setQuestions(newQuestions);
                        setHasUnsavedChanges(true);
                      }}
                    />
                  </Form.Item>
                  <Form.Item style={{ width: '200px', marginBottom: 0 }}>
                    <Select
                      value={q.type}
                      onChange={(value) => {
                        const newQuestions = questions.map(question =>
                          question.id === q.id 
                            ? { ...question, type: value }
                            : question
                        );
                        setQuestions(newQuestions);
                        setHasUnsavedChanges(true);
                      }}
                      style={{ width: '100%', height: '40px' }}
                      options={[
                        { value: 'Yes/No', label: 'Yes/No' },
                        { value: 'Text', label: 'Text' },
                        { value: 'Number', label: 'Number' },
                      ]}
                    />
                  </Form.Item>
                </div>
              ))}

              <Button 
                type="link" 
                icon={<PlusOutlined />}
                onClick={addQuestion}
                style={{ padding: 0, color: '#188034' }}
              >
                Add Another
              </Button>
            </div>
          </Form>
        )}
      </div>
    </div>
  );
});

CustomQuestionsSettings.displayName = 'CustomQuestionsSettings';

export default CustomQuestionsSettings;
