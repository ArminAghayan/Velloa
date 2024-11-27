import React, { forwardRef, useImperativeHandle, useState, useEffect, useRef, useCallback } from 'react';
import { 
  Typography, Space, Card, Select, Form, InputNumber, 
  Button, Row, Col, Divider, Switch, Radio, Skeleton, Tooltip
} from 'antd';
import { InfoCircleOutlined, PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { doc, setDoc, getDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { db } from '../../../../../firebase-config';
import { notification } from 'antd';
import './propertyManagementFees.css';
const { Text } = Typography;
const { Option } = Select;

export interface ManagementFeesRef {
  handleSave: () => Promise<boolean>;
  loadSettings: () => Promise<void>;
  resetState: () => Promise<void>;
}

interface ManagementFeesProps {
  propertyId: string;
}

interface FeeConfig {
  feeType: string;
  amount: number | null;
  baseCategory: string;
  expenseCategory: string;
}

const ManagementFees = forwardRef<ManagementFeesRef, ManagementFeesProps>(({ propertyId }, ref) => {
  const [paymentRecipient, setPaymentRecipient] = useState<string[]>([]);
  const [fees, setFees] = useState<any[]>([]);
  const [showAddFeeForm, setShowAddFeeForm] = useState(false);
  const [editingFeeIndex, setEditingFeeIndex] = useState<number | null>(null);
  const [editingFee, setEditingFee] = useState<FeeConfig | null>(null);
  const [minimumFee, setMinimumFee] = useState({
    enabled: false,
    amount: 0,
    category: 'Management Fees'
  });
  const [payoutCategories, setPayoutCategories] = useState<string[]>([]);
  const [selectedPayoutCategory, setSelectedPayoutCategory] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [propertyOwners, setPropertyOwners] = useState<{ label: string; value: string; }[]>([]);
  const [otherOwners, setOtherOwners] = useState<{ label: string; value: string; }[]>([]);
  // Simulation state
  const [simulationInputs, setSimulationInputs] = useState<{ [key: string]: number }>({});
  const [isEditingSimulation, setIsEditingSimulation] = useState(false);
  const [newFee, setNewFee] = useState<FeeConfig>({
    feeType: '',
    amount: null,
    baseCategory: '',
    expenseCategory: ''
  });

  // Add state for fee structure type
  const [feeStructureType, setFeeStructureType] = useState<'default' | 'custom'>('default');

  // Add state for showing the input
  const [showPayoutInput, setShowPayoutInput] = useState(false);
  const payoutSelectRef = useRef<any>(null);

  // Add state for tracking both groups of owners
  const [companies, setCompanies] = useState<{ label: string; value: string; }[]>([]);

  // Add Skeleton to imports at the top
  const [loadingRecipients, setLoadingRecipients] = useState(true);

  // Fetch payment recipients dynamically if needed
  const fetchPaymentRecipients = useCallback(async () => {
    setLoadingRecipients(true);
    try {
      const tempPropertyOwners: { label: string; value: string }[] = [];
      const tempOtherOwners: { label: string; value: string }[] = [];
      const tempCompanies: { label: string; value: string }[] = [];

      // First, get property owners from propertySettings/owners
      const ownersRef = doc(db, 'properties', propertyId, 'propertySettings', 'owners');
      const ownersDoc = await getDoc(ownersRef);
      
      if (ownersDoc.exists()) {
        const ownersData = ownersDoc.data();
        for (const [, ownerData] of Object.entries(ownersData.owners || {})) {
          const peopleId = (ownerData as any).peopleId;
          if (peopleId) {
            const personRef = doc(db, 'people', peopleId);
            const personDoc = await getDoc(personRef);
            
            if (personDoc.exists()) {
              const personData = personDoc.data();
              const displayName = [
                personData.firstName,
                personData.middleName,
                personData.lastName,
                personData.company ? `| ${personData.company}` : ''
              ].filter(Boolean).join(' ').trim();

              tempPropertyOwners.push({
                label: displayName || 'Unnamed Owner',
                value: peopleId
              });
            }
          }
        }
      }

      // Then, get all other owners from people collection with peopleType "owner"
      const companyId = (await getDoc(doc(db, 'properties', propertyId))).data()?.companyuid;
      if (companyId) {
        const peopleSnapshot = await getDocs(
          query(
            collection(db, 'people'), 
            where('companyId', '==', companyId),
            where('peopleType', '==', 'owner')
          )
        );

        peopleSnapshot.forEach(doc => {
          const personData = doc.data();
          // Only add if not already in propertyOwners
          if (!tempPropertyOwners.some(owner => owner.value === doc.id)) {
            const displayName = [
              personData.firstName,
              personData.middleName,
              personData.lastName,
              personData.company ? `| ${personData.company}` : ''
            ].filter(Boolean).join(' ').trim();

            tempOtherOwners.push({
              label: displayName || 'Unnamed Owner',
              value: doc.id
            });
          }
        });

        // Fetch properties managed by this company
        const propertiesSnapshot = await getDocs(
          query(
            collection(db, 'properties'),
            where('companyuid', '==', companyId)
          )
        );

        // Get unique company IDs from properties
        const uniqueCompanyIds = new Set<string>();
        propertiesSnapshot.forEach(doc => {
          const data = doc.data();
          if (data.companyuid) uniqueCompanyIds.add(data.companyuid);
        });

        // Convert Set to Array before iteration
        for (const cid of Array.from(uniqueCompanyIds)) {
          const companyDoc = await getDoc(doc(db, 'companies', cid));
          if (companyDoc.exists()) {
            const companyData = companyDoc.data();
            tempCompanies.push({
              label: companyData.companyName || 'Unnamed Company',
              value: cid
            });
          }
        }
      }

      console.log('Property Owners:', tempPropertyOwners);
      console.log('Other Owners:', tempOtherOwners);
      console.log('Companies:', tempCompanies);
      
      setPropertyOwners(tempPropertyOwners);
      setOtherOwners(tempOtherOwners);
      setCompanies(tempCompanies);
    } catch (error) {
      console.error('Error fetching recipients:', error);
      setPropertyOwners([]);
      setOtherOwners([]);
      setCompanies([]);
    } finally {
      setLoadingRecipients(false);
    }
  }, [propertyId]);

  useEffect(() => {
    fetchPaymentRecipients();
  }, [propertyId, fetchPaymentRecipients]);

  const loadSettings = async () => {
    try {
      console.log('Starting to load management fee settings...');
      setIsLoading(true);
      const feesRef = doc(db, 'properties', propertyId, 'propertySettings', 'ManagementFees');
      const feesDoc = await getDoc(feesRef);
      
      if (feesDoc.exists()) {
        const data = feesDoc.data();
        console.log('Successfully loaded management fee data:', data);
        
        setFeeStructureType(data.feeStructureType || 'default');
        setPaymentRecipient(data.paymentRecipient || []);
        setPayoutCategories(data.payoutCategories || []);
        
        if (data.feeStructureType === 'custom') {
          setFees(data.fees || []);
          setMinimumFee(data.minimumFee || {
            enabled: false,
            amount: 0,
            category: 'Management Fees'
          });
        }
      } else {
        console.log('No management fee settings found for this property');
      }
    } catch (error) {
      console.error('Error loading management fees settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const feesRef = doc(db, 'properties', propertyId, 'propertySettings', 'ManagementFees');
      
      // Create the config object
      const configData = {
        feeStructureType,
        paymentRecipient: paymentRecipient || [],
        fees: fees || [],
        minimumFee: {
          enabled: minimumFee.enabled,
          amount: minimumFee.amount,
          category: minimumFee.category
        },
        payoutCategories: payoutCategories
      };

      console.log('Saving management fees config:', configData);
      console.log('Current payout categories:', payoutCategories);

      // Save to Firebase
      await setDoc(feesRef, configData);
      
      // Verify the save by immediately reading back
      const savedDoc = await getDoc(feesRef);
      console.log('Saved data:', savedDoc.data());

      notification.success({
        message: 'Settings Saved',
        description: 'Management fee settings have been successfully updated.',
        placement: 'topRight'
      });
      
      return true;
    } catch (error) {
      console.error('Error saving management fees settings:', error);
      notification.error({
        message: 'Save Failed',
        description: 'There was an error saving your management fee settings.',
        placement: 'topRight'
      });
      return false;
    }
  };

  const resetState = async () => {
    // Reset all states simultaneously
    setShowPayoutInput(false);
    setSelectedPayoutCategory('');
    setFeeStructureType('default');
    setPaymentRecipient([]);
    setFees([]);
    setMinimumFee({
      enabled: false,
      amount: 0,
      category: 'Management Fees'
    });
    setPayoutCategories([]);
    setShowAddFeeForm(false);
    setEditingFeeIndex(null);
    setEditingFee(null);
    setSimulationInputs({});
    setIsEditingSimulation(false);
    
    return Promise.resolve();
  };

  useImperativeHandle(ref, () => ({
    handleSave,
    loadSettings,
    resetState
  }));

  const calculateFees = (amounts: { [key: string]: number }) => {
    let totalFees = 0;
    
    fees.forEach((fee, index) => {
      const baseAmount = amounts[`amount${index}`] || 0;
      
      if (fee.feeType === 'Flat') {
        totalFees += fee.amount || 0;
      } else {
        // For percentage-based fees (Cash or Accrual)
        totalFees += baseAmount * ((fee.amount || 0) / 100);
      }
    });

    if (minimumFee.enabled && totalFees < minimumFee.amount) {
      return minimumFee.amount;
    }

    return totalFees;
  };



  const handleRemovePayoutCategory = (category: string) => {
    setPayoutCategories(payoutCategories.filter(c => c !== category));
  };


  const handleEditFee = (index: number) => {
    setEditingFeeIndex(index);
    setEditingFee({ ...fees[index] });
    setShowAddFeeForm(true);
  };

  const handleSaveFee = () => {
    if (!newFee.feeType || !newFee.amount || !newFee.baseCategory || !newFee.expenseCategory) {
      notification.error({
        message: 'Incomplete Form',
        description: 'Please fill in all fields.',
        placement: 'topRight'
      });
      return;
    }

    if (editingFeeIndex !== null && editingFee) {
      // Update existing fee
      const updatedFees = [...fees];
      updatedFees[editingFeeIndex] = editingFee;
      setFees(updatedFees);
      setEditingFeeIndex(null);
      setEditingFee(null);
    } else {
      // Add new fee
      setFees([...fees, newFee]);
    }
    setShowAddFeeForm(false);
    setNewFee({
      feeType: '',
      amount: null,
      baseCategory: '',
      expenseCategory: ''
    });
  };

  const handleDeleteFee = (index: number) => {
    const updatedFees = fees.filter((_, i) => i !== index);
    setFees(updatedFees);
  };

  // Add useEffect to monitor payoutCategories changes
  useEffect(() => {
    console.log('Payout categories updated:', payoutCategories);
  }, [payoutCategories]);

  const handleSelectPayoutCategory = (category: string) => {
    if (category && !payoutCategories.includes(category)) {
      const newCategories = [...payoutCategories, category];
      console.log('Adding new category:', category);
      console.log('Updated categories list:', newCategories);
      setPayoutCategories(newCategories);
      setSelectedPayoutCategory('');
      setShowPayoutInput(false);
      
    } else if (payoutCategories.includes(category)) {
      notification.warning({
        message: 'Duplicate Category',
        description: `${category} is already in your payout categories.`,
        placement: 'topRight'
      });
    }
  };

  // Add a function to initialize simulation inputs based on fees
  const initializeSimulationInputs = useCallback(() => {
    const newInputs: { [key: string]: number } = {};
    fees.forEach((fee, index) => {
      newInputs[`amount${index}`] = 1000; // Default value
    });
    setSimulationInputs(newInputs);
  }, [fees]);

  // Add useEffect to initialize simulation inputs when fees change
  useEffect(() => {
    initializeSimulationInputs();
  }, [fees, initializeSimulationInputs]);

  // Add this useEffect to load settings when component mounts
  useEffect(() => {
    loadSettings();
  }, [propertyId]); // Add propertyId as dependency

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className='management-fees-box' style={{ height: '70vh' }}>
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
            Learn about management fees
          </Typography.Link>
        </Col>
      </Row>

      <div style={{ marginBottom: '24px' }}>
        <Text>
          You can set different management fees for each property as needed, or use your default settings.
        </Text>
        <Radio.Group 
          value={feeStructureType} 
          onChange={(e) => setFeeStructureType(e.target.value)}
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '16px',
            marginTop: '16px' 
          }}
        >
          <Radio value="default" style={{ 
            display: 'flex', 
            alignItems: 'flex-start',
            padding: '8px 12px',
            backgroundColor: feeStructureType === 'default' ? '#f0f0f0' : 'transparent',
            borderRadius: '6px'
          }}>
            <Text>Use company default management fees</Text>
          </Radio>
          
          <Radio value="custom" style={{ 
            display: 'flex', 
            alignItems: 'flex-start',
            padding: '8px 12px',
            backgroundColor: feeStructureType === 'custom' ? '#f0f0f0' : 'transparent',
            borderRadius: '6px'
          }}>
            <Text>Specify management fees for this property</Text>
          </Radio>
        </Radio.Group>
      </div>

      {feeStructureType === 'custom' && (
        <div style={{ display: 'flex', gap: '24px' }}>
          <div style={{ 
            flex: '1', 
            overflowY: 'auto',
            maxHeight: '490px',
            paddingRight: '16px',
            paddingBottom: '10px'
          }}>
      
            
            <Card title="Payment Recipient" className="property-management-fees">
            <Text type="secondary" style={{ display: 'block', marginBottom: '16px' }}>
                Choose the person or entity that will receive the management fee payments (usually your own property management company).
              </Text>
              <Form layout="vertical" style={{ width: '100%' }}>
                <Form.Item
                  label="Select Payment Recipient"
                  required
                  help="Choose who will receive the payments"
                  style={{ width: '100%' }}
                >
                  {loadingRecipients ? (
                    <Skeleton.Input active block style={{ width: '100%' }} />
                  ) : (
                    <Select
                      mode="multiple"
                      value={paymentRecipient}
                      onChange={(values) => setPaymentRecipient(values)}
                      placeholder="Select a payment recipient"
                      style={{ width: '100%' }}
                      allowClear
                      listHeight={256}
                    >
                      {companies.length > 0 && (
                        <Select.OptGroup label="Property Management Company">
                          {companies.map((company) => (
                            <Option key={company.value} value={company.value}>
                              {company.label}
                            </Option>
                          ))}
                        </Select.OptGroup>
                      )}
                      {propertyOwners.length > 0 && (
                        <Select.OptGroup label="Property Owners">
                          {propertyOwners.map((owner) => (
                            <Option key={owner.value} value={owner.value}>
                              {owner.label}
                            </Option>
                          ))}
                        </Select.OptGroup>
                      )}

                      {otherOwners.length > 0 && (
                        <Select.OptGroup label="Other Owners">
                          {otherOwners.map((owner) => (
                            <Option key={owner.value} value={owner.value}>
                              {owner.label}
                            </Option>
                          ))}
                        </Select.OptGroup>
                      )}
                    </Select>
                  )}
                </Form.Item>
              </Form>
            </Card>

            <Card title="Management Fee Configuration" style={{ marginTop: '16px' }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div style={{ position: 'relative', marginBottom: '24px' }}>
                  <Button 
                    type="text" 
                    icon={<PlusOutlined />} 
                    onClick={() => setShowAddFeeForm(true)}
                    style={{ 
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      display: 'flex',
                      color: '#28A745',
                      fontWeight: '650',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    Add Management Fee
                  </Button>
                  
                  <Typography.Title level={5} style={{ marginBottom: '8px' }}>
                    Configure Management Fees
                  </Typography.Title>
                  <Text type="secondary">
                    Customize your management fees to fit your needs. We will automatically calculate them and create the bills.
                  </Text>
                </div>

                {showAddFeeForm && (
                  <Card 
                    size="small"
                    title={editingFeeIndex !== null ? "Edit Management Fee" : "Add New Management Fee"}
                    extra={<Button type="text" onClick={() => {
                      setShowAddFeeForm(false);
                      setEditingFeeIndex(null);
                      setEditingFee(null);
                    }}>✕</Button>}
                  >
                    <Form layout="vertical">
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item 
                            label="Fee Type" 
                            required
                            help="Select how this fee should be calculated"
                          >
                            <Select
                              value={editingFee ? editingFee.feeType : newFee.feeType}
                              onChange={(value) => {
                                if (editingFee) {
                                  setEditingFee({ ...editingFee, feeType: value, amount: null });
                                } else {
                                  setNewFee({ ...newFee, feeType: value, amount: null });
                                }
                              }}
                              placeholder="Select fee type"
                            >
                              <Option value="Cash Basis">Percentage of payments received (Cash Basis)</Option>
                              <Option value="Accrual Basis">Percentage of charges posted (Accrual Basis)</Option>
                              <Option value="Flat">Flat Fee</Option>
                            </Select>
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item 
                            label="Fee Amount" 
                            required
                            help={editingFee?.feeType === 'Flat' || newFee.feeType === 'Flat' ? 
                              "Enter the fee amount in dollars" : 
                              "Enter the percentage to charge"
                            }
                          >
                            <InputNumber
                              value={editingFee ? editingFee.amount : newFee.amount}
                              onChange={(value) => {
                                if (editingFee) {
                                  setEditingFee({ ...editingFee, amount: value });
                                } else {
                                  setNewFee({ ...newFee, amount: value });
                                }
                              }}
                              min={0}
                              prefix={editingFee?.feeType === 'Flat' || newFee.feeType === 'Flat' ? '$' : undefined}
                              suffix={editingFee?.feeType === 'Flat' || newFee.feeType === 'Flat' ? undefined : '%'}
                              style={{ width: '100%' }}
                              placeholder={editingFee?.feeType === 'Flat' || newFee.feeType === 'Flat' ? 
                                "Enter amount" : 
                                "Enter percentage"
                              }
                            />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item 
                            label="Base Category" 
                            required
                            help="Select what this fee is based on"
                          >
                            <Select
                              value={editingFee ? editingFee.baseCategory : newFee.baseCategory}
                              onChange={(value) => {
                                if (editingFee) {
                                  setEditingFee({ ...editingFee, baseCategory: value });
                                } else {
                                  setNewFee({ ...newFee, baseCategory: value });
                                }
                              }}
                              placeholder="Select base category"
                            >
                              <Option value="Rent">Rent</Option>
                              <Option value="Late Fees">Late Fees</Option>
                              <Option value="All Income">All Income</Option>
                              {/* Add more options as needed */}
                            </Select>
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item 
                            label="Expense Category" 
                            required
                            help="Select where to record this fee"
                          >
                            <Select
                              value={editingFee ? editingFee.expenseCategory : newFee.expenseCategory}
                              onChange={(value) => {
                                if (editingFee) {
                                  setEditingFee({ ...editingFee, expenseCategory: value });
                                } else {
                                  setNewFee({ ...newFee, expenseCategory: value });
                                }
                              }}
                              placeholder="Select expense category"
                            >
                              <Option value="Management Fees">Management Fees</Option>
                              <Option value="Administrative">Administrative</Option>
                              <Option value="Professional Fees">Professional Fees</Option>
                              {/* Add more options as needed */}
                            </Select>
                          </Form.Item>
                        </Col>
                      </Row>

                      <Form.Item>
                        <Space>
                          <Button type="primary" onClick={handleSaveFee}>
                            {editingFeeIndex !== null ? 'Save Changes' : 'Add Fee'}
                          </Button>
                          <Button onClick={() => {
                            setShowAddFeeForm(false);
                            setEditingFeeIndex(null);
                            setEditingFee(null);
                          }}>
                            Cancel
                          </Button>
                        </Space>
                      </Form.Item>
                    </Form>
                  </Card>
                )}

                {fees.map((fee, index) => (
                  <div 
                    key={index} 
                    style={{ 
                      marginTop: '16px',
                      padding: '16px',
                      background: '#f5f5f5',
                      borderRadius: '8px'
                    }}
                  >
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Row justify="space-between" align="middle">
                        <Col span={20}>
                          <Row>
                            <Col span={8}>
                              <Text type="secondary">Fee Type</Text>
                              <br />
                              <Tooltip title={fee.feeType}>
                                <Text strong style={{ 
                                  maxWidth: '150px', 
                                  overflow: 'hidden', 
                                  textOverflow: 'ellipsis', 
                                  whiteSpace: 'nowrap', 
                                  display: 'block' 
                                }}>
                                  {fee.feeType}
                                </Text>
                              </Tooltip>
                            </Col>
                            <Col span={8}>
                              <Text type="secondary">Amount</Text>
                              <br />
                              <Text strong>
                                {fee.feeType === 'Flat' ? 
                                  `$${fee.amount?.toFixed(2)}` : 
                                  `${fee.amount}%`
                                }
                              </Text>
                            </Col>
                            <Col span={8}>
                              <Text type="secondary">Categories</Text>
                              <br />
                              <Tooltip title={`${fee.baseCategory} → ${fee.expenseCategory}`}>
                                <Text strong style={{ 
                                  maxWidth: '200px', 
                                  overflow: 'hidden', 
                                  textOverflow: 'ellipsis', 
                                  whiteSpace: 'nowrap', 
                                  display: 'block' 
                                }}>
                                  {fee.baseCategory} → {fee.expenseCategory}
                                </Text>
                              </Tooltip>
                            </Col>
                          </Row>
                        </Col>
                        <Col span={4} style={{ textAlign: 'right' }}>
                          <Space>
                            <Button 
                              type="text" 
                              icon={<EditOutlined />} 
                              onClick={() => handleEditFee(index)}
                            />
                            <Button 
                              type="text" 
                              danger 
                              icon={<DeleteOutlined />} 
                              onClick={() => handleDeleteFee(index)}
                            />
                          </Space>
                        </Col>
                      </Row>
                    </Space>
                  </div>
                ))}

                <Divider />

                <div>
                  <Typography.Title level={5}>Minimum Fee</Typography.Title>
                  <Text type="secondary" style={{ display: 'block', marginBottom: '16px' }}>
                    Set a minimum fee to ensure a minimum payment is received, regardless of the amount of fees calculated.
                  </Text>
                  
                  <Row align="middle" justify="space-between" style={{ marginBottom: '16px' }}>
                    <Col>
                      <Text>Ensure a minimum payment is received</Text>
                    </Col>
                    <Col>
                      <Switch
                        checked={minimumFee.enabled}
                        onChange={(checked) => setMinimumFee(prev => ({ ...prev, enabled: checked }))}
                      />
                    </Col>
                  </Row>

                  {minimumFee.enabled && (
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item label="Minimum Amount">
                          <InputNumber
                            prefix="$"
                            value={minimumFee.amount}
                            onChange={(value) => setMinimumFee(prev => ({ ...prev, amount: value || 0 }))}
                            style={{ width: '100%' }}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item label="Expense Category">
                          <Select
                            value={minimumFee.category}
                            onChange={(value) => setMinimumFee(prev => ({ ...prev, category: value }))}
                          >
                            <Option value="Management Fees">Management Fees</Option>
                          </Select>
                        </Form.Item>
                      </Col>
                    </Row>
                  )}
                </div>

                <Divider />

                <div>
                  <Typography.Title level={5}>Payout Categories</Typography.Title>
                  <Text type="secondary" style={{ display: 'block', marginBottom: '16px' }}>
                    Payout Categories designate which payouts are retained entirely by your business. 
                    Once paid, these amounts are excluded from the period's Profit & Loss and Cash Flow Statement.
                  </Text>

                  <Button
                    type="text"
                    icon={<PlusOutlined />}
                    onClick={() => setShowPayoutInput(true)}
                    style={{ marginBottom: '16px', color: '#28A745', fontWeight: '650' }}
                  >
                    Add Account
                  </Button>

                  {showPayoutInput && (
                    <>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                        <Select
                          ref={payoutSelectRef}
                          style={{ flex: 1 }}
                          onChange={handleSelectPayoutCategory}
                          placeholder="Select an income account to retain"
                        >
                          <Option value="Application Fees">Application Fees</Option>
                          <Option value="Late Fees">Late Fees</Option>
                          <Option value="Management Fees">Management Fees</Option>
                          {/* Add more options as needed */}
                        </Select>
                        <Button 
                          type="text" 
                          icon={<DeleteOutlined />} 
                          onClick={() => {
                            setShowPayoutInput(false);
                            setSelectedPayoutCategory(''); // Reset the selected value
                          }}
                          danger
                        />
                      </div>
                    </>
                  )}

                  {payoutCategories.map((category, index) => (
                    <div 
                      key={index} 
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        padding: '8px',
                        background: '#f5f5f5',
                        borderRadius: '6px',
                        marginTop: '8px'
                      }}
                    >
                      <Text>{category}</Text>
                      <Button 
                        type="text" 
                        icon={<DeleteOutlined />} 
                        onClick={() => handleRemovePayoutCategory(category)}
                        danger
                      />
                    </div>
                  ))}
                </div>
              </Space>
            </Card>
          </div>

          <div style={{ width: '300px' }}>
            <Card 
              title="Simulation" 
              extra={
                <Button onClick={() => setIsEditingSimulation(!isEditingSimulation)}>
                  {isEditingSimulation ? 'Done' : 'Edit Inputs'}
                </Button>
              }
            >
              <Text>Preview your fee structure according to your setup.</Text>
              
              <div style={{ marginTop: '16px' }}>
                {fees.map((fee, index) => (
                  <div key={index} className="simulation-row" style={{ marginBottom: '12px' }}>
                    {fee.feeType === 'Flat' ? (
                      <Text>Flat Fee (${fee.amount?.toFixed(2)})</Text>
                    ) : (
                      <>
                        <Text>{fee.baseCategory} ({fee.amount}%)</Text>
                        {isEditingSimulation ? (
                          <InputNumber
                            value={simulationInputs[`amount${index}`]}
                            onChange={(value) => setSimulationInputs(prev => ({
                              ...prev,
                              [`amount${index}`]: value || 0
                            }))}
                            prefix="$"
                            style={{ width: '120px' }}
                          />
                        ) : (
                          <Text>${simulationInputs[`amount${index}`]?.toFixed(2) || '0.00'}</Text>
                        )}
                      </>
                    )}
                  </div>
                ))}

                {fees.length > 0 && <Divider style={{ margin: '12px 0' }} />}
                
                <div className="simulation-row">
                  <Text strong>Total Management Fees</Text>
                  <Text strong>${calculateFees(simulationInputs).toFixed(2)}</Text>
                </div>

                {minimumFee.enabled && (
                  <div style={{ marginTop: '8px', fontSize: '12px', color: 'rgba(0, 0, 0, 0.45)' }}>
                    <InfoCircleOutlined style={{ marginRight: '4px' }} />
                    Minimum fee of ${minimumFee.amount} will apply if calculated fees are lower
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
});

export default ManagementFees; 