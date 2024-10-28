import React, { useState } from 'react';
import { Form, Switch, Button, Input, Typography, Select } from 'antd';
import TextArea from 'antd/es/input/TextArea';
import { PlusOutlined, CloseOutlined } from '@ant-design/icons';
import './ApplicantInfoSettings.css';
const { Title, Text } = Typography;

const CustomQuestionsSettings: React.FC = () => {
  const [form] = Form.useForm();
  const [askAdditionalQuestions, setAskAdditionalQuestions] = useState(true);
  const [questions, setQuestions] = useState([{ id: 1, question: '', type: 'Yes/No' }]);

  const addQuestion = () => {
    const newId = questions.length + 1;
    setQuestions([...questions, { id: newId, question: '', type: 'Yes/No' }]);
  };

  const removeQuestion = (id: number) => {
    if (questions.length > 1) { // Prevent removing the last question
      setQuestions(questions.filter(q => q.id !== id));
    }
  };

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
            >
              <TextArea
                placeholder="Instructions for applicants"
                maxLength={5000}
                showCount
                style={{ height: 200 }}
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
                    <Input placeholder="Question" />
                  </Form.Item>
                  <Form.Item style={{ width: '200px', marginBottom: 0 }}>
                    <Select
                      defaultValue="Yes/No"
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
        <Button>Cancel</Button>
        <Button type="primary">Save</Button>
      </div>
    </div>
  );
};

export default CustomQuestionsSettings;
