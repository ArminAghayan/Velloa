import React, { useState } from 'react';
import { Form, Switch, Button, Checkbox, Typography } from 'antd';
import TextArea from 'antd/es/input/TextArea';
import './ApplicantInfoSettings.css';
const { Title } = Typography;

interface Field {
  name: string;
  required: boolean;
  enabled: boolean;
  darkBlue?: boolean;
  locked?: boolean;
}

const PetsSettings: React.FC = () => {
  const [form] = Form.useForm();
  const [showPets, setShowPets] = useState(true);

  const fields: Field[] = [
    { name: 'Pet Type', required: false, enabled: true, darkBlue: true },
    { name: 'Breed', required: false, enabled: true, darkBlue: true },
    { name: 'Weight', required: false, enabled: true, darkBlue: true },
    { name: 'Age', required: false, enabled: true, darkBlue: true },
    { name: 'Name', required: false, enabled: true, darkBlue: true },
    { name: 'Color', required: false, enabled: true, darkBlue: true },
    { name: 'Vaccinated', required: false, enabled: true, darkBlue: true },
    { name: 'Spayed/Neutered', required: false, enabled: true, darkBlue: true },
    { name: 'License Number', required: false, enabled: true, darkBlue: true },
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
          <Title level={2} style={{ margin: 0 }}>Pets</Title>
          <Switch 
            checked={showPets}
            onChange={setShowPets}
            className="switch-dark"
            checkedChildren="On"
            unCheckedChildren="Off"
          />
        </div>

        {showPets && (
          <Form form={form} layout="vertical">
            <Form.Item
              label="Do you want to specify any additional instructions about their pets?"
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

export default PetsSettings;

