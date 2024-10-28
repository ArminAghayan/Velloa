import React from 'react';
import { Form, Input, Button, Typography } from 'antd';
import { CloseOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { TextArea } = Input;  // Move TextArea destructuring here from Typography

const InstructionsSettings: React.FC = () => {
  const [form] = Form.useForm();

  const handleSubmit = (values: any) => {
    console.log('Form values:', values);
    // Handle form submission
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ maxWidth: 800, flex: 1, overflowY: 'auto', padding: '24px 12px 24px 24px' }}>
        <Title level={2} style={{ marginTop: 0 }}>Instructions</Title>
        
        <Text style={{ color: '#666', display: 'block', marginBottom: 16 }}>
          Any specific instructions for the application? These will be shown on the first page of the application.
        </Text>
        
        <Form form={form} onFinish={handleSubmit} layout="vertical">
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
        <Button>Cancel</Button>
        <Button type="primary">Save</Button>
      </div>
    </div>
  );
};

export default InstructionsSettings;
