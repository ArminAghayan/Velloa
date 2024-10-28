import React, { useState, useEffect } from 'react';
import { Form, Switch, Button, Input, Typography, Select } from 'antd';
import TextArea from 'antd/es/input/TextArea';
import { PlusOutlined, CloseOutlined } from '@ant-design/icons';
import './ApplicantInfoSettings.css';
import { doc, getDoc, setDoc, Timestamp, arrayRemove, arrayUnion } from 'firebase/firestore';
import { auth, db } from '../../../../firebase-config';
import { message } from 'antd';
const { Title, Text } = Typography;

const CustomQuestionsSettings: React.FC = () => {
  const [form] = Form.useForm();
  const [askAdditionalQuestions, setAskAdditionalQuestions] = useState(true);
  const [questions, setQuestions] = useState([{ id: 1, question: '', type: 'Yes/No' }]);
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

      const customQuestionFields = {
        settings: {
          showCustomQuestions: askAdditionalQuestions,
          instructions: form.getFieldValue('instructions') || '',
          lastUpdated: Timestamp.now()
        },
        questions: questions.map(q => ({
          question: q.question,
          type: q.type,
          required: true,
          enabled: true,
          lastUpdated: Timestamp.now()
        }))
      };

      const settingsRef = doc(db, `companies/${companyId}/settings/rentalApplication`);
      await setDoc(settingsRef, { customQuestions: customQuestionFields }, { merge: true });

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
        if (data.customQuestions) {
          const { settings, questions: savedQuestions } = data.customQuestions;
          setAskAdditionalQuestions(settings.showCustomQuestions ?? true);
          form.setFieldsValue({ instructions: settings.instructions || '' });
          
          if (savedQuestions && Array.isArray(savedQuestions)) {
            const loadedQuestions = savedQuestions.map((q, index) => ({
              id: index + 1,
              question: q.question,
              type: q.type
            }));
            
            setQuestions(loadedQuestions);
          }
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

      <div style={{ 
        borderTop: '1px solid #f0f0f0',
        padding: '16px 24px',
        backgroundColor: '#fff',
        display: 'flex',
        justifyContent: 'flex-end',
        gap: 12
      }}>
        <Button onClick={fetchSettings} disabled={!hasUnsavedChanges}>
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

export default CustomQuestionsSettings;
