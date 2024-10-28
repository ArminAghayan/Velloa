import React, { useState } from 'react';
import { Form, Switch, Button, Space, Checkbox, Typography } from 'antd';
import TextArea from 'antd/es/input/TextArea';
import { CloseOutlined } from '@ant-design/icons';
import './ApplicantInfoSettings.css';
const { Title, Text } = Typography;

interface Field {
  name: string;
  required: boolean;
  enabled: boolean;
  darkBlue?: boolean;
  locked?: boolean;
}

const VehicleSettings: React.FC = () => {
  const [form] = Form.useForm();
  const [showVehicle, setShowVehicle] = useState(true);

  const fields: Field[] = [
    { name: 'Make', required: false, enabled: true, darkBlue: true },
    { name: 'Model', required: false, enabled: true, darkBlue: true },
    { name: 'Year', required: false, enabled: true, darkBlue: true },
    { name: 'Color', required: false, enabled: true, darkBlue: true },
    { name: 'License Plate', required: false, enabled: true, darkBlue: true },
    { name: 'State Registered', required: false, enabled: true, darkBlue: true },
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
          <Title level={2} style={{ margin: 0 }}>Vehicle</Title>
          <Switch 
            checked={showVehicle}
            onChange={setShowVehicle}
            className="switch-dark"
            checkedChildren="On"
            unCheckedChildren="Off"
          />
        </div>

        {showVehicle && (
          <Form form={form} layout="vertical">
            <Form.Item
              label="Do you want to specify any additional instructions about their vehicle information?"
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

export default VehicleSettings;
