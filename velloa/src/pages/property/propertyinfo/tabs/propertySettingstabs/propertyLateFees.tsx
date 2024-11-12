import React, { useState } from 'react';
import { 
  Switch, Button, Typography, Space, Card, Select, Form, InputNumber, Input, Divider, Row, Col, Dropdown, Radio
} from 'antd';
import { PlusOutlined, InfoCircleOutlined } from '@ant-design/icons';
import './propertyLateFees.css';

const { Title, Text } = Typography;
const { Option } = Select;

// Define a type for the keys that can have amount values
type LimitationKeyWithAmount = 'maximumDailyFees' | 'maximumMonthlyFees' | 'minimumBalance';
type LimitationKeyWithoutAmount = 'onlyMostRecent' | 'specificCharges';
type LimitationKey = LimitationKeyWithAmount | LimitationKeyWithoutAmount;

// Add these interfaces to your existing types
interface FeeLimitations {
  maximumDailyFees: {
    enabled: boolean;
    amount: number;
  };
  maximumMonthlyFees: {
    enabled: boolean;
    amount: number;
  };
  minimumBalance: {
    enabled: boolean;
    amount: number;
  };
  onlyMostRecent: boolean;
  specificCharges: {
    enabled: boolean;
    selectedCharges: string[];
  };
}

const LateFees: React.FC = () => {
  const [automaticLateFees, setAutomaticLateFees] = useState(true);
  const [showAddFeeForm, setShowAddFeeForm] = useState(false);
  const [lateFees, setLateFees] = useState<any[]>([]);

  // New State Variables for Fee Limitations & Restrictions
  const [feeLimitations, setFeeLimitations] = useState<FeeLimitations>({
    maximumDailyFees: { enabled: false, amount: 0 },
    maximumMonthlyFees: { enabled: false, amount: 0 },
    minimumBalance: { enabled: false, amount: 0 },
    onlyMostRecent: false,
    specificCharges: { enabled: false, selectedCharges: [] }
  });

  // Add new state for simulation
  const [simulationInputs, setSimulationInputs] = useState({
    amount: 1000,
    daysLate: 10,
  });
  const [isEditingSimulation, setIsEditingSimulation] = useState(false);

  // Add new state for editing
  const [editingFeeIndex, setEditingFeeIndex] = useState<number | null>(null);

  // Add this state to track the selected fee type
  const [selectedFeeType, setSelectedFeeType] = useState<string>('Flat fee ($)');

  // Add new state for fee structure type
  const [feeStructureType, setFeeStructureType] = useState<'company' | 'property'>('company');

  // Calculate late fees based on configuration
  const calculateLateFees = (amount: number, daysLate: number) => {
    // Check minimum balance - only proceed if amount due EXCEEDS the minimum
    if (feeLimitations.minimumBalance.enabled && amount <= feeLimitations.minimumBalance.amount) {
      return 0;
    }

    let totalFeesBeforeLimits = 0;
    
    lateFees.forEach(fee => {
      if (feeLimitations.specificCharges.enabled && 
          feeLimitations.specificCharges.selectedCharges.length > 0 && 
          !feeLimitations.specificCharges.selectedCharges.includes('rent')) {
        return;
      }

      if (daysLate >= (fee.gracePeriod || 0)) {
        const baseAmount = fee.feeType === 'Flat fee ($)' ? fee.fee : (amount * fee.fee / 100);

        switch (fee.frequency) {
          case 'Once':
            totalFeesBeforeLimits += baseAmount;
            break;
          case 'Daily':
            totalFeesBeforeLimits += baseAmount * daysLate;
            break;
          case 'Weekly':
            totalFeesBeforeLimits += baseAmount * Math.floor(daysLate / 7);
            break;
          case 'Monthly':
            totalFeesBeforeLimits += baseAmount * Math.floor(daysLate / 30);
            break;
        }
      }
    });

    let finalFees = totalFeesBeforeLimits;

    // Apply daily maximum to all fees
    if (feeLimitations.maximumDailyFees.enabled) {
      const maxDailyFee = feeLimitations.maximumDailyFees.amount;
      const feesPerDay = totalFeesBeforeLimits / daysLate;
      if (feesPerDay > maxDailyFee) {
        finalFees = maxDailyFee * daysLate;
      }
    }

    // Apply monthly maximum
    if (feeLimitations.maximumMonthlyFees.enabled) {
      const numberOfMonths = Math.ceil(daysLate / 30);
      const feesPerMonth = finalFees / numberOfMonths;
      if (feesPerMonth > feeLimitations.maximumMonthlyFees.amount) {
        finalFees = feeLimitations.maximumMonthlyFees.amount * numberOfMonths;
      }
    }

    // If only most recent charge is enabled, divide the total by the number of fees
    if (feeLimitations.onlyMostRecent && lateFees.length > 0) {
      finalFees = finalFees / lateFees.length;
    }

    return Math.max(0, finalFees);
  };


  const handleAddLateFee = () => {
    setShowAddFeeForm(true);
  };

  const handleEditFee = (index: number) => {
    setEditingFeeIndex(index);
    setShowAddFeeForm(true);
  };

  const handleDeleteFee = (index: number) => {
    const newLateFees = lateFees.filter((_, i) => i !== index);
    setLateFees(newLateFees);
  };

  const handleLateFeeSubmit = (values: any) => {
    if (editingFeeIndex !== null) {
      const newLateFees = [...lateFees];
      newLateFees[editingFeeIndex] = values;
      setLateFees(newLateFees);
      setEditingFeeIndex(null);
    } else {
      setLateFees([...lateFees, values]);
    }
    setShowAddFeeForm(false);
  };

  const handleCancelAddFee = () => {
    setShowAddFeeForm(false);
  };

  // Add handlers
  const handleLimitationToggle = (key: LimitationKey, value: boolean) => {
    setFeeLimitations(prev => {
      if (key === 'onlyMostRecent') {
        return { ...prev, [key]: value };
      }
      return {
        ...prev,
        [key]: {
          ...(prev[key] as any),
          enabled: value
        }
      };
    });
  };

  const handleLimitationAmountChange = (key: LimitationKeyWithAmount, amount: number) => {
    setFeeLimitations(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        amount
      }
    }));
  };

  // First, let's create a function to calculate individual fees
  const calculateIndividualFees = (amount: number, daysLate: number) => {
    const feeBreakdown: { description: string; amount: number }[] = [];
    
    if (feeLimitations.minimumBalance.enabled && amount <= feeLimitations.minimumBalance.amount) {
      return feeBreakdown;
    }

    lateFees.forEach(fee => {
      if (feeLimitations.specificCharges.enabled && 
          feeLimitations.specificCharges.selectedCharges.length > 0 && 
          !feeLimitations.specificCharges.selectedCharges.includes('rent')) {
        return;
      }

      if (daysLate >= (fee.gracePeriod || 0)) {
        const baseAmount = fee.feeType === 'Flat fee ($)' ? fee.fee : (amount * fee.fee / 100);
        let feeAmount = 0;
        let description = '';

        switch (fee.frequency) {
          case 'Once':
            feeAmount = baseAmount;
            description = `One-time ${fee.feeType === 'Flat fee ($)' ? `$${fee.fee}` : `${fee.fee}%`}`;
            break;
          case 'Daily':
            feeAmount = baseAmount * daysLate;
            description = `${fee.feeType === 'Flat fee ($)' ? `$${fee.fee}` : `${fee.fee}%`} per day × ${daysLate} days`;
            break;
          case 'Weekly':
            const weeks = Math.floor(daysLate / 7);
            feeAmount = baseAmount * weeks;
            description = `${fee.feeType === 'Flat fee ($)' ? `$${fee.fee}` : `${fee.fee}%`} per week × ${weeks} weeks`;
            break;
          case 'Monthly':
            const months = Math.floor(daysLate / 30);
            feeAmount = baseAmount * months;
            description = `${fee.feeType === 'Flat fee ($)' ? `$${fee.fee}` : `${fee.fee}%`} per month × ${months} months`;
            break;
        }

        feeBreakdown.push({ description, amount: feeAmount });
      }
    });

    return feeBreakdown;
  };

  return (
    <div className='late-fees-box' style={{ height: '750px' }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
        <Col>
          <Typography.Link 
            href="https://velloaapp.com" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ 
              display: 'inline-flex',
              alignItems: 'center', 
              gap: '8px',
              color: 'rgba(0, 0, 0, 0.45)',
              textDecoration: 'underline'
            }}
          >
            <InfoCircleOutlined />
            Learn about different types of properties
          </Typography.Link>
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

      {/* Only show Radio Group when Automatic Late Fees is enabled */}
      {automaticLateFees && (
        <Radio.Group 
          value={feeStructureType} 
          onChange={(e) => setFeeStructureType(e.target.value)}
          style={{ marginBottom: '24px' }}
        >
          <Space direction="vertical">
            <Radio value="company">Use company default management fee structure</Radio>
            <Radio value="property">Enable management fee for this property</Radio>
          </Space>
        </Radio.Group>
      )}

      {/* Only show the fee structure setup if property-specific is selected */}
      {automaticLateFees && feeStructureType === 'property' && (
        <div className="fee-structure-setup">
          <Row justify="space-between" align="middle" style={{ marginBottom: '8px' }}>
            <Col>
              <Title level={4} style={{ margin: 0 }}>Set Up Your Late Fee Structure</Title>
            </Col>
          </Row>

          {/* Only show the content when automaticLateFees is true */}
          {automaticLateFees && (
            <>
              <Text>
                Set up late fee schedules to automate charges for tenants who pay late.
              </Text>
              
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                onClick={handleAddLateFee}
                className="fixed-width-button"
                style={{ marginTop: '16px', marginBottom: '16px' }}
              >
                Add Late Fee
              </Button>

              <div style={{ display: 'flex', gap: '24px', marginTop: '16px' }}>
                {/* Scrollable left column */}
                <div style={{ 
                  flex: '1', 
                  overflowY: 'auto',
                  maxHeight: '450px', // Adjust based on header height
                  paddingRight: '16px'
                }}>
                  <Divider />
                  <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    {/* Add Fee Form */}
                    {showAddFeeForm && (
                      <Card 
                        title="Add New Late Fee" 
                        extra={<Button type="text" onClick={handleCancelAddFee}>✕</Button>}
                      >
                        <Form layout="vertical" onFinish={handleLateFeeSubmit}>
                          <Row gutter={16}>
                            <Col span={6}>
                              <Form.Item 
                                name="feeType" 
                                label="Fee Type" 
                                rules={[{ required: true, message: 'Please select a fee type' }]}
                              >
                                <Select 
                                  placeholder="Select Fee Type"
                                  onChange={(value) => setSelectedFeeType(value)}
                                >
                                  <Option value="Flat fee ($)">Flat fee ($)</Option>
                                  <Option value="Percentage (%)">Percentage (%)</Option>
                                </Select>
                              </Form.Item>
                            </Col>
                            <Col span={6}>
                              <Form.Item 
                                name="fee" 
                                label={`Fee ${selectedFeeType === 'Flat fee ($)' ? '($)' : '(%)'}`}
                                rules={[{ required: true, message: 'Please enter a fee amount' }]}
                              >
                                <InputNumber 
                                  style={{ width: '100%' }} 
                                  min={0} 
                                  placeholder={`Enter amount`}
                                  prefix={selectedFeeType === 'Flat fee ($)' ? '$' : undefined}
                                  suffix={selectedFeeType === 'Percentage (%)' ? '%' : undefined}
                                />
                              </Form.Item>
                            </Col>
                            <Col span={6}>
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
                            </Col>
                            <Col span={6}>
                              <Form.Item name="gracePeriod" label="Grace Period (days)">
                                <InputNumber style={{ width: '100%' }} min={0} placeholder="Enter days" />
                              </Form.Item>
                            </Col>
                          </Row>

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
                        extra={
                          <Dropdown
                            menu={{
                              items: [
                                {
                                  key: '1',
                                  label: 'Edit',
                                  onClick: () => handleEditFee(index)
                                },
                                {
                                  key: '2',
                                  label: 'Delete',
                                  danger: true,
                                  onClick: () => handleDeleteFee(index)
                                }
                              ]
                            }}
                            trigger={['click']}
                          >
                            <Button type="text">︙</Button>
                          </Dropdown>
                        }
                        className="fee-card"
                      >
                        <Space direction="vertical" style={{ width: '100%' }}>
                          <Row>
                            <Col span={12}>
                              <Text type="secondary">Amount</Text>
                              <br />
                              <Text strong>{fee.feeType === 'Flat fee ($)' ? `$${fee.fee}` : `${fee.fee}%`}</Text>
                            </Col>
                            <Col span={12}>
                              <Text type="secondary">Frequency</Text>
                              <br />
                              <Text strong>{fee.frequency}</Text>
                            </Col>
                          </Row>
                          <Row>
                            <Col span={12}>
                              <Text type="secondary">Grace Period</Text>
                              <br />
                              <Text strong>{fee.gracePeriod || 'N/A'} days</Text>
                            </Col>
                            <Col span={12}>
                              <Text type="secondary">Revenue Account</Text>
                              <br />
                              <Text strong>{fee.revenueAccount}</Text>
                            </Col>
                          </Row>
                          {fee.description && (
                            <div style={{ marginTop: '8px' }}>
                              <Text type="secondary">Description</Text>
                              <br />
                              <Text>{fee.description}</Text>
                            </div>
                          )}
                        </Space>
                      </Card>
                    ))}

                    {/* Fee Limitations & Restrictions */}
                    <div className="fee-limitations">
                      <Typography.Title level={4}>Fee Limitations & Restrictions</Typography.Title>
                      <Typography.Text type="secondary">
                        Set restrictions on how late fees are applied to avoid over or undercharging tenants.{' '}
                        <Typography.Link href="#">Learn more</Typography.Link>.
                      </Typography.Text>

                      <div className="limitation-item">
                        <div className="limitation-header">
                          <div>
                            <Typography.Text strong>Maximum Daily Fees</Typography.Text>
                            <Typography.Text type="secondary" style={{ display: 'block' }}>
                              Late fees charged will never exceed the entered amount per day.
                            </Typography.Text>
                          </div>
                          <Switch
                            checked={feeLimitations.maximumDailyFees.enabled}
                            onChange={(checked) => handleLimitationToggle('maximumDailyFees', checked)}
                          />
                        </div>
                        {feeLimitations.maximumDailyFees.enabled && (
                          <InputNumber
                            prefix="$"
                            min={0}
                            value={feeLimitations.maximumDailyFees.amount}
                            onChange={(value) => handleLimitationAmountChange('maximumDailyFees', value || 0)}
                            style={{ width: '200px', marginTop: '8px' }}
                          />
                        )}
                      </div>

                      <div className="limitation-item">
                        <div className="limitation-header">
                          <div>
                            <Typography.Text strong>Maximum Monthly Fees</Typography.Text>
                            <Typography.Text type="secondary" style={{ display: 'block' }}>
                              Late fees charged will never exceed the entered amount per month.
                            </Typography.Text>
                          </div>
                          <Switch
                            checked={feeLimitations.maximumMonthlyFees.enabled}
                            onChange={(checked) => handleLimitationToggle('maximumMonthlyFees', checked)}
                          />
                        </div>
                        {feeLimitations.maximumMonthlyFees.enabled && (
                          <InputNumber
                            prefix="$"
                            min={0}
                            value={feeLimitations.maximumMonthlyFees.amount}
                            onChange={(value) => handleLimitationAmountChange('maximumMonthlyFees', value || 0)}
                            style={{ width: '200px', marginTop: '8px' }}
                          />
                        )}
                      </div>

                      <div className="limitation-item">
                        <div className="limitation-header">
                          <div>
                            <Typography.Text strong>Minimum Balance to Apply Fees</Typography.Text>
                            <Typography.Text type="secondary" style={{ display: 'block' }}>
                              Late fees will only be charged if the tenant's balance exceeds the entered amount.
                            </Typography.Text>
                          </div>
                          <Switch
                            checked={feeLimitations.minimumBalance.enabled}
                            onChange={(checked) => handleLimitationToggle('minimumBalance', checked)}
                          />
                        </div>
                        {feeLimitations.minimumBalance.enabled && (
                          <InputNumber
                            prefix="$"
                            min={0}
                            value={feeLimitations.minimumBalance.amount}
                            onChange={(value) => handleLimitationAmountChange('minimumBalance', value || 0)}
                            style={{ width: '200px', marginTop: '8px' }}
                          />
                        )}
                      </div>

                      <div className="limitation-item">
                        <div className="limitation-header">
                          <div>
                            <Typography.Text strong>Only Apply to Most Recent Charge</Typography.Text>
                            <Typography.Text type="secondary" style={{ display: 'block' }}>
                              Late fees will only be applied to the most recent overdue charge.
                            </Typography.Text>
                          </div>
                          <Switch
                            checked={feeLimitations.onlyMostRecent}
                            onChange={(checked) => handleLimitationToggle('onlyMostRecent', checked)}
                          />
                        </div>
                      </div>

                      <div className="limitation-item">
                        <div className="limitation-header">
                          <div>
                            <Typography.Text strong>Apply Only on Specific Outstanding Charges</Typography.Text>
                            <Typography.Text type="secondary" style={{ display: 'block' }}>
                              Specify which accounts to consider when charging late fees.
                            </Typography.Text>
                          </div>
                          <Switch
                            checked={feeLimitations.specificCharges.enabled}
                            onChange={(checked) => handleLimitationToggle('specificCharges', checked)}
                          />
                        </div>
                        {feeLimitations.specificCharges.enabled && (
                          <Select
                            mode="multiple"
                            style={{ width: '100%', marginTop: '8px' }}
                            placeholder="Select charge types"
                            value={feeLimitations.specificCharges.selectedCharges}
                            onChange={(values) => setFeeLimitations(prev => ({
                              ...prev,
                              specificCharges: { ...prev.specificCharges, selectedCharges: values }
                            }))}
                            options={[
                              { label: 'Rent', value: 'rent' },
                              { label: 'Parking Fees', value: 'parking' },
                              { label: 'Pet Fees', value: 'pet' },
                              { label: 'Utilities', value: 'utilities' },
                            ]}
                          />
                        )}
                      </div>
                    </div>
                  </Space>
                </div>
                
                {/* Fixed right column */}
                <div style={{ width: '300px' }}>
                  <Card 
                    title="Simulation" 
                    extra={
                      <Button onClick={() => setIsEditingSimulation(!isEditingSimulation)}>
                        {isEditingSimulation ? 'Done' : 'Edit Inputs'}
                      </Button>
                    }
                  >
                    <Text>Use this tool to test your fee structure with sample data.</Text>
                    <div style={{ marginTop: '16px' }}>
                      <div className="simulation-row">
                        <Text>Amount Due</Text>
                        {isEditingSimulation ? (
                          <InputNumber
                            value={simulationInputs.amount}
                            onChange={(value) => setSimulationInputs(prev => ({ ...prev, amount: value || 0 }))}
                            prefix="$"
                            style={{ width: '120px' }}
                          />
                        ) : (
                          <Text>${simulationInputs.amount.toFixed(2)}</Text>
                        )}
                      </div>
                      <div className="simulation-row">
                        <Text>Days Late</Text>
                        {isEditingSimulation ? (
                          <InputNumber
                            value={simulationInputs.daysLate}
                            onChange={(value) => setSimulationInputs(prev => ({ ...prev, daysLate: value || 0 }))}
                            min={0}
                            style={{ width: '120px' }}
                          />
                        ) : (
                          <Text>{simulationInputs.daysLate}</Text>
                        )}
                      </div>
                      <Divider style={{ margin: '12px 0' }} />
                      
                      {/* Fee Breakdown */}
                      {calculateIndividualFees(simulationInputs.amount, simulationInputs.daysLate).map((fee, index) => (
                        <div className="simulation-row" key={index}>
                          <Text type="secondary">{fee.description}</Text>
                          <Text>${fee.amount.toFixed(2)}</Text>
                        </div>
                      ))}

                      {feeLimitations.maximumDailyFees.enabled && (
                        <div className="simulation-row">
                          <Text type="secondary">Maximum Daily Fee Limit: ${feeLimitations.maximumDailyFees.amount}/day</Text>
                        </div>
                      )}

                      {feeLimitations.maximumMonthlyFees.enabled && (
                        <div className="simulation-row">
                          <Text type="secondary">Maximum Monthly Fee Limit: ${feeLimitations.maximumMonthlyFees.amount}/month</Text>
                        </div>
                      )}

                      <Divider style={{ margin: '12px 0' }} />
                      <div className="simulation-row">
                        <Text strong>Total Late Fees</Text>
                        <Text strong>${calculateLateFees(simulationInputs.amount, simulationInputs.daysLate).toFixed(2)}</Text>
                      </div>
                      <div className="simulation-row">
                        <Text strong>Total Due</Text>
                        <Text strong>
                          ${(simulationInputs.amount + calculateLateFees(simulationInputs.amount, simulationInputs.daysLate)).toFixed(2)}
                        </Text>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default LateFees;
