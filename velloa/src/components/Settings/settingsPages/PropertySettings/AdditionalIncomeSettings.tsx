import React, { useState } from 'react';
import { Form, Switch, Button, Checkbox, Typography } from 'antd';
import TextArea from 'antd/es/input/TextArea';

const { Title } = Typography;

interface Field {
  name: string;
  required: boolean;
  enabled: boolean;
  darkBlue?: boolean;
  locked?: boolean;
}

const AdditionalIncomeSettings: React.FC = () => {
  const [form] = Form.useForm();
  const [showAdditionalIncome, setShowAdditionalIncome] = useState(true);

  const fields: Field[] = [
    { name: 'Income Type', required: false, enabled: true, darkBlue: true },
    { name: 'Monthly Amount', required: false, enabled: true, darkBlue: true },
    { name: 'Source/Provider', required: false, enabled: true, darkBlue: true },
    { name: 'Contact Person', required: false, enabled: true, darkBlue: true },
    { name: 'Phone Number', required: false, enabled: true, darkBlue: true },
    { name: 'Email', required: false, enabled: true, darkBlue: true },
    { name: 'Verification Document', required: false, enabled: true, darkBlue: true },
    { name: 'Bank Account Balance', required: false, enabled: true, darkBlue: true },
    { name: 'Investment Accounts', required: false, enabled: true, darkBlue: true },
    { name: 'Real Estate Assets', required: false, enabled: true, darkBlue: true },
    { name: 'Other Assets', required: false, enabled: true, darkBlue: true },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ maxWidth: 800, flex: 1, overflowY: 'auto', padding: '24px 12px 24px 24px' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <Title level={2} style={{ margin: 0 }}>Additional Income & Assets</Title>
          <Switch 
            checked={showAdditionalIncome}
            onChange={setShowAdditionalIncome}
            className="switch-dark"
            checkedChildren="On"
            unCheckedChildren="Off"
          />
        </div>

        {showAdditionalIncome && (
          <Form form={form} layout="vertical">
            <Form.Item
              label="Do you want to specify any additional instructions about their additional income and assets?"
            >
              <TextArea
                placeholder="Instructions for applicants"
                maxLength={5000}
                showCount
                style={{ height: 200 }}
              />
            </Form.Item>

            <div className="fields-header">
              <span>Field</span>
              <span>Required</span>
            </div>

            <div className="fields-container">
              {fields.map((field) => (
                <div key={field.name} className="field-row">
                  <div className="field-left">
                    <Switch 
                      defaultChecked={field.enabled}
                      disabled={field.locked}
                      className={field.darkBlue ? 'switch-dark' : 'switch-light'}
                    />
                    <span>{field.name}</span>
                  </div>
                  <Checkbox checked={field.required} disabled={field.locked} />
                </div>
              ))}
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

export default AdditionalIncomeSettings;


