import React, { useState } from 'react';
import { 
  Switch, Button, Typography, Space, Card, Select, Form, InputNumber, Input, Divider, Row, Col
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import './propertyLateFees.css';

const { Title, Text, Link } = Typography;
const { Option } = Select;

const LateFees: React.FC = () => {
  const [automaticLateFees, setAutomaticLateFees] = useState(true);
  const [showAddFeeForm, setShowAddFeeForm] = useState(false);
  const [lateFees, setLateFees] = useState<any[]>([]);

  // New State Variables for Fee Limitations & Restrictions
  const [maxDailyFees, setMaxDailyFees] = useState(false);
  const [maxMonthlyFees, setMaxMonthlyFees] = useState(false);
  const [minBalance, setMinBalance] = useState(false);
  const [applyMostRecent, setApplyMostRecent] = useState(false);
  const [specificCharges, setSpecificCharges] = useState<string[]>([]);

  // Handler for Specific Outstanding Charges
  const handleSpecificChargesChange = (value: string[]) => {
    setSpecificCharges(value);
  };

  const handleAddLateFee = () => {
    setShowAddFeeForm(true);
  };

  const handleLateFeeSubmit = (values: any) => {
    setLateFees([...lateFees, values]);
    setShowAddFeeForm(false);
  };

  const handleCancelAddFee = () => {
    setShowAddFeeForm(false);
  };

  return (
    <div className='late-fees-box'>
      {/* Header Section */}
      <div className="header-section">
        <Row justify="space-between" align="middle" style={{ width: '100%' }}>
          <Col>
            <Title level={2} style={{ color: '#4CAF50', margin: 0 }}>Late Fees</Title>
          </Col>
          <Col>
            <Space align="center">
              <Text strong>Automatic Late Fees</Text>
              <Switch 
                checked={automaticLateFees}
                onChange={setAutomaticLateFees}
              />
            </Space>
          </Col>
        </Row>
        <Divider />
      </div>

      {/* Main Content Section */}
      {automaticLateFees && (
        <div className="main-content">
          {/* Left Column: Scrollable Late Fee Structure */}
          <div className='left-column'>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              {/* Late Fee Structure Setup */}
              <div className="fee-structure-setup">
                <Title level={4}>Set Up Your Late Fee Structure</Title>
                <Text>
                  Set up late fee schedules to automate charges for tenants who pay late.
                </Text>
                {/* Add Late Fee Button Positioned Below the Descriptive Text */}
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />} 
                  className="fixed-width-button" /* Apply custom class */
                  style={{ 
                    marginTop: '16px' /* Keep margin-top for spacing */
                  }}
                  onClick={handleAddLateFee}
                >
                  Add Late Fee
                </Button>
              </div>

              {/* Add Fee Form */}
              {showAddFeeForm && (
                <Card 
                  title="Add New Late Fee" 
                  extra={<Button type="text" onClick={handleCancelAddFee}>✕</Button>}
                >
                  <Form layout="vertical" onFinish={handleLateFeeSubmit}>
                    <Form.Item 
                      name="feeType" 
                      label="Fee Type" 
                      rules={[{ required: true, message: 'Please select a fee type' }]}
                    >
                      <Select placeholder="Select Fee Type">
                        <Option value="Flat fee ($)">Flat fee ($)</Option>
                        <Option value="Percentage (%)">Percentage (%)</Option>
                      </Select>
                    </Form.Item>
                    <Form.Item 
                      name="fee" 
                      label="Fee ($)" 
                      rules={[{ required: true, message: 'Please enter a fee amount' }]}
                    >
                      <InputNumber style={{ width: '100%' }} min={0} placeholder="Enter fee amount" />
                    </Form.Item>
                    <Form.Item 
                      name="frequency" 
                      label="Frequency" 
                      rules={[{ required: true, message: 'Please select frequency' }]}
                    >
                      <Select placeholder="Select Frequency">
                        <Option value="Once">Once</Option>
                        <Option value="Daily">Daily</Option>
                        <Option value="Weekly">Weekly</Option>
                        <Option value="Monthly">Monthly</Option>
                      </Select>
                    </Form.Item>
                    <Form.Item name="gracePeriod" label="Grace Period (days)">
                      <InputNumber style={{ width: '100%' }} min={0} placeholder="Enter grace period" />
                    </Form.Item>
                    <Form.Item 
                      name="revenueAccount" 
                      label="Revenue Account" 
                      rules={[{ required: true, message: 'Please select a revenue account' }]}
                    >
                      <Select placeholder="Select Revenue Account">
                        <Option value="Late Fees">Late Fees</Option>
                        {/* Add more options as needed */}
                      </Select>
                    </Form.Item>
                    <Form.Item name="description" label="Description">
                      <Input.TextArea rows={3} maxLength={80} showCount placeholder="Enter a description (optional)" />
                    </Form.Item>
                    <Form.Item>
                      <Space>
                        <Button type="primary" htmlType="submit">Save</Button>
                        <Button onClick={handleCancelAddFee}>Cancel</Button>
                      </Space>
                    </Form.Item>
                  </Form>
                </Card>
              )}

              {/* Display Late Fees */}
              {lateFees.map((fee, index) => (
                <Card 
                  key={index} 
                  title={`${fee.feeType} - ${fee.fee}${fee.feeType === 'Flat fee ($)' ? '' : '%'}`} 
                  extra={<Button type="text">︙</Button>}
                >
                  {/* Display fee details here */}
                  <Text>Type: {fee.feeType}</Text><br />
                  <Text>Amount: {fee.feeType === 'Flat fee ($)' ? `$${fee.fee}` : `${fee.fee}%`}</Text><br />
                  <Text>Frequency: {fee.frequency}</Text><br />
                  <Text>Grace Period: {fee.gracePeriod || 'N/A'} days</Text><br />
                  <Text>Revenue Account: {fee.revenueAccount}</Text><br />
                  {fee.description && <Text>Description: {fee.description}</Text>}
                </Card>
              ))}

              {/* Fee Limitations & Restrictions */}
              <div className="fee-limitations">
                <Title level={4}>Fee Limitations & Restrictions</Title>
                <Text>
                  Set restrictions on how late fees are applied to avoid over or undercharging tenants. 
                  <Link href="#" style={{ marginLeft: '8px' }}>Learn more</Link>.
                </Text>
                
                <Space direction="vertical" style={{ width: '100%', marginTop: '16px' }}>
                  {/* Maximum Daily Fees */}
                  <div className="switch-row">
                    <div>
                      <Text strong>Maximum Daily Fees</Text>
                      <br />
                      <Text type="secondary">Late fees charged will never exceed the entered amount per day.</Text>
                    </div>
                    <Switch 
                      checked={maxDailyFees}
                      onChange={setMaxDailyFees}
                    />
                  </div>

                  {/* Maximum Monthly Fees */}
                  <div className="switch-row">
                    <div>
                      <Text strong>Maximum Monthly Fees</Text>
                      <br />
                      <Text type="secondary">Late fees charged will never exceed the entered amount per month.</Text>
                    </div>
                    <Switch 
                      checked={maxMonthlyFees}
                      onChange={setMaxMonthlyFees}
                    />
                  </div>

                  {/* Minimum Balance to Apply Fees */}
                  <div className="switch-row">
                    <div>
                      <Text strong>Minimum Balance to Apply Fees</Text>
                      <br />
                      <Text type="secondary">Late fees will only be charged if the tenant's balance exceeds the entered amount.</Text>
                    </div>
                    <Switch 
                      checked={minBalance}
                      onChange={setMinBalance}
                    />
                  </div>

                  {/* Only Apply to Most Recent Charge */}
                  <div className="switch-row">
                    <div>
                      <Text strong>Only Apply to Most Recent Charge</Text>
                      <br />
                      <Text type="secondary">Late fees will only be applied to the most recent overdue charge (given the above conditions).</Text>
                    </div>
                    <Switch 
                      checked={applyMostRecent}
                      onChange={setApplyMostRecent}
                    />
                  </div>

                  {/* Apply Only on Specific Outstanding Charges */}
                  <div className="switch-row">
                    <div>
                      <Text strong>Apply Only on Specific Outstanding Charges</Text>
                      <br />
                      <Text type="secondary">Specify which accounts to consider when charging late fees.</Text>
                    </div>
                    <Switch 
                      checked={specificCharges.length > 0}
                      onChange={(checked) => {
                        if (!checked) {
                          setSpecificCharges([]);
                        }
                      }}
                    />
                  </div>

                  {/* Multi-select for Specific Outstanding Charges */}
                  {specificCharges.length > 0 && (
                    <div style={{ marginTop: '8px' }}>
                      <Select
                        mode="multiple"
                        allowClear
                        placeholder="Select Specific Outstanding Charges"
                        value={specificCharges}
                        onChange={handleSpecificChargesChange}
                        style={{ width: '100%' }}
                      >
                        <Option value="Rent">Rent</Option>
                        <Option value="Parking Fees">Parking Fees</Option>
                        <Option value="Pet Fees">Pet Fees</Option>
                        <Option value="Utilities">Utilities</Option>
                        <Option value="Maintenance Fees">Maintenance Fees</Option>
                        {/* Add more options as needed */}
                      </Select>
                    </div>
                  )}
                </Space>
              </div>
            </Space>
          </div>
          
          {/* Right Column: Fixed Simulation Section */}
          <div className='right-column'>
            <Card title="Simulation" extra={<Button>Edit Inputs</Button>}>
              <Text>Use this tool to test your fee structure with sample data. Click "Edit Inputs" to change the values.</Text>
              <div style={{ marginTop: '16px' }}>
                <div className="simulation-row">
                  <Text>Rent</Text>
                  <Text>$1,000</Text>
                </div>
                <div className="simulation-row">
                  <Text>Delinquency</Text>
                  <Text>10</Text>
                </div>
                <div className="simulation-row subtotal">
                  <Text strong>Subtotal</Text>
                  <Text strong>$0.00</Text>
                </div>
                <div className="simulation-row">
                  <Text strong>Total</Text>
                  <Text strong>$0.00</Text>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default LateFees;
