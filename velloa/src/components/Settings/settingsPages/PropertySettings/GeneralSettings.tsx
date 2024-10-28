import React, { useState } from 'react';
import { Typography, Radio, Space, Button, Checkbox, Switch, Input } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const GeneralSettings: React.FC = () => {
  const [selectedPlan, setSelectedPlan] = useState('all-in-one');
  const [chargeApplicationFee, setChargeApplicationFee] = useState(false);
  const [applicationFee, setApplicationFee] = useState('75.00');
  const [requestReports, setRequestReports] = useState(false);

  // Calculate fees
  const processingFee = chargeApplicationFee ? (Number(applicationFee) * 0.029) + 0.30 : 0;
  const reportsCost = requestReports ? 20.00 : 0;
  const totalProfit = chargeApplicationFee ? 
    Number(applicationFee) - processingFee - reportsCost : 0;

  const renderCustomFeeSection = () => {
    if (selectedPlan !== 'custom') return null;
    
    return (
      <div style={{ marginTop: 16, padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ marginBottom: 8 }}>
            <Text strong>Application Fee</Text>
          </div>
          <Switch 
            checked={chargeApplicationFee}
            onChange={setChargeApplicationFee}
            style={{ marginRight: 8 }}
          />
          <Text>Charge applicants an application fee</Text>
          
          {chargeApplicationFee && (
            <div style={{ marginTop: 16 }}>
              <Text style={{ display: 'block', marginBottom: 8 }}>
                How much would you like to charge for an application fee?
              </Text>
              <Input 
                prefix="$"
                value={applicationFee}
                onChange={(e) => setApplicationFee(e.target.value)}
                style={{ width: 200 }}
              />
              <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                Online Payment Credit Card Fee: ${processingFee.toFixed(2)}
              </Text>
            </div>
          )}
        </div>

        <div>
          <div style={{ marginBottom: 8 }}>
            <Text strong>Transunion Report</Text>
          </div>
          <Switch 
            checked={requestReports}
            onChange={setRequestReports}
            style={{ marginRight: 8 }}
          />
          <Text>Request Credit, Criminal and Eviction History reports from Transunion</Text>
          {requestReports && (
            <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
              Transunion Reports Cost: $20.00
            </Text>
          )}
        </div>
      </div>
    );
  };

  // Update the Summary section
  const renderSummary = () => {
    if (selectedPlan !== 'custom') return (
      <>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <Text>Total cost for applicant</Text>
          <Text>$49.90</Text>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
          <Text>Your Revenue</Text>
          <Text style={{ color: '#52c41a' }}>$0.00</Text>
        </div>
      </>
    );

    const total = Number(applicationFee) + processingFee + reportsCost;
    
    return (
      <>
        {chargeApplicationFee && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <Text>Application Fee</Text>
            <Text>${applicationFee}</Text>
          </div>
        )}
        {chargeApplicationFee && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <Text>Online Credit Card Processing Cost (2.9% + C$0.30)</Text>
            <Text>${processingFee.toFixed(2)}</Text>
          </div>
        )}
        {requestReports && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <Text>Transunion Reports Cost</Text>
            <Text>$20.00</Text>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
          <Text>Your Profit</Text>
          <Text style={{ color: totalProfit > 0 ? '#52c41a' : '#f5222d' }}>
            ${totalProfit.toFixed(2)}
          </Text>
        </div>
      </>
    );
  };

  return (
    <div style={{ maxWidth: 800, height: '100%', overflowY: 'auto', padding: '24px 12px 24px 24px' }}>
      <Title level={2} style={{ marginTop: 0 }}>General Settings</Title>
      
      <Text style={{ color: '#666', display: 'block', marginBottom: 16 }}>
        Choose your ideal settings and fee plan with flexible solutions for you and your applicants.
      </Text>

      {/* Warning Banner */}
      <div style={{ 
        padding: '8px 12px', 
        background: '#fff7e6', 
        borderRadius: 4, 
        marginBottom: 16, 
        display: 'flex', 
        alignItems: 'center', 
        gap: 8 
      }}>
        <span style={{ color: '#fa8c16' }}>⚠</span>
        <Text>Check local rental application fee regulations to stay compliant.</Text>
      </div>

      {/* Radio Group */}
      <Radio.Group 
        value={selectedPlan}
        onChange={(e) => setSelectedPlan(e.target.value)}
        style={{ width: '100%', marginBottom: 32 }}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* All-In-One Solution */}
          <div style={{ border: '1px solid #e8e8e8', borderRadius: 8, padding: 16, background: 'white' }}>
            <Radio value="all-in-one">
              <div>
                <Text strong>All-In-One Solution</Text>
                <span style={{ 
                  marginLeft: 8, 
                  background: '#e6f7ff', 
                  color: '#1890ff', 
                  padding: '2px 8px', 
                  borderRadius: 4, 
                  fontSize: 12 
                }}>
                  Recommended
                </span>
              </div>
              <div style={{ marginLeft: 24, color: '#666', marginTop: 8 }}>
                • No additional setup or merchant account required<br/>
                • Applicants pay $49.90 for their background check<br/>
                • Access comprehensive criminal, eviction, and credit reports from TransUnion
              </div>
            </Radio>
          </div>

          {/* Custom Fee Plan */}
          <div style={{ border: '1px solid #e8e8e8', borderRadius: 8, padding: 16, background: '#fafafa' }}>
            <Radio value="custom">
              <div>
                <Text strong>Custom Fee Plan</Text>
                <InfoCircleOutlined style={{ marginLeft: 8, color: '#999' }} />
              </div>
              <div style={{ marginLeft: 24, color: '#666', marginTop: 8 }}>
                • Merchant account required<br/>
                • Set custom fees to generate revenue and choose to cover or offset screening costs<br/>
                • Choose when to request TransUnion screening reports for an applicant
              </div>
            </Radio>
          </div>

          {/* Application-Only Plan */}
          <div style={{ border: '1px solid #e8e8e8', borderRadius: 8, padding: 16, background: 'white' }}>
            <Radio value="application-only">
              <Text strong>Application-Only Plan</Text>
              <div style={{ marginLeft: 24, color: '#666', marginTop: 8 }}>
                • Free and unlimited application form submissions<br/>
                • Screening not included; reports available for a fee upon request
              </div>
            </Radio>
          </div>
        </Space>
      </Radio.Group>

      {renderCustomFeeSection()}

      {/* Summary Section */}
      <div style={{ borderTop: '1px solid #e8e8e8', paddingTop: 24 }}>
        <Title level={4}>Summary</Title>
        {renderSummary()}
        
        <Checkbox>
          I accept the <a>Velloa</a> and <a>TransUnion</a> Terms and Conditions.
        </Checkbox>

      </div>
    </div>
  );
};

export default GeneralSettings;
