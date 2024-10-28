import React from 'react';
import { Form, Switch, Button, Checkbox, Typography } from 'antd';
import TextArea from 'antd/es/input/TextArea';
import './ApplicantInfoSettings.css'; // Reusing the same CSS
const { Title } = Typography;

const EmploymentSettings: React.FC = () => {
  const [form] = Form.useForm();

  const fields = [
    { name: 'Job Type', required: true, enabled: true, locked: true },
    { name: 'Annual Income', required: true, enabled: true, locked: true },
    { name: 'Title/Position', required: false, enabled: true, darkBlue: true },
    { name: 'Company Name', required: true, enabled: true, locked: true },
    { name: 'I currently work here', required: false, enabled: true, darkBlue: true },
    { name: 'Start date', required: false, enabled: true, darkBlue: true },
    { name: 'End date', required: false, enabled: true, darkBlue: true },
    { name: 'Supervisor Name', required: false, enabled: true, darkBlue: true },
    { name: 'Supervisor Email', required: false, enabled: true, darkBlue: true },
    { name: 'Supervisor Phone', required: false, enabled: true, darkBlue: true },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ maxWidth: 800, flex: 1, overflowY: 'auto', padding: '24px 12px 24px 24px' }}>
        <Title level={2} style={{ marginTop: 0 }}>EMPLOYMENT</Title>

        <Form form={form} layout="vertical">
          <Form.Item
            label="Do you want to specify any additional instructions about their employment?"
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

export default EmploymentSettings;

