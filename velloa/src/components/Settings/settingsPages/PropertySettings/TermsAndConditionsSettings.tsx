import React, { useState } from 'react';
import { Form, Switch, Button, Typography } from 'antd';
import TextArea from 'antd/es/input/TextArea';
import './ApplicantInfoSettings.css';
const { Title, Text } = Typography;

const TermsAndConditionsSettings: React.FC = () => {
  const [form] = Form.useForm();
  const [enableTerms, setEnableTerms] = useState(true);
  const [terms, setTerms] = useState('');  // Removed default value

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ maxWidth: 800, flex: 1, overflowY: 'auto', padding: '24px 12px 24px 24px' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <Title level={2} style={{ margin: 0 }}>Terms & Conditions</Title>
          <Switch 
            checked={enableTerms}
            onChange={setEnableTerms}
            className="switch-dark"
            checkedChildren="On"
            unCheckedChildren="Off"
          />
        </div>
        
        <Text style={{ 
          fontSize: '16px', 
          marginBottom: '32px', 
          display: 'block', 
          color: '#666',
          lineHeight: '1.5'
        }}>
          You can add additional terms and conditions for submitting a rental application. Each applicant will be required to accept these terms and conditions before submitting their application.
        </Text>

        {enableTerms && (
          <Form form={form} layout="vertical">
            <div style={{ marginBottom: '24px' }}>
              <Text strong style={{ display: 'block', marginBottom: '8px' }}>
                Terms & Conditions *
              </Text>
              <TextArea
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                maxLength={10000}
                showCount
                style={{ height: 300 }}
                placeholder="Enter your terms and conditions here"
              />
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

export default TermsAndConditionsSettings;
