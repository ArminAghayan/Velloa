import React, { useState, useEffect } from 'react';
import { Form, Input, Select, Switch, Steps, DatePicker, Card, Tooltip, Typography, Divider, Button, Space } from 'antd';
import type { FormInstance } from 'antd/es/form';
import './NewAccount.css';
import { 
  IconFileDescription, 
  IconCash, 
  IconHome, 
  IconPrinter, 
  IconSignature, 
  IconInfoCircle, 
  IconPlus, 
  IconMinus,
} from '@tabler/icons-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../../../../firebase-config';
import { NumericFormat } from 'react-number-format';
import dayjs from 'dayjs';

interface NewAccountProps {
  onClose: () => void;
  currentStep: number;
  onStepChange: (step: number) => void;
  form: FormInstance;
  companyId: string;
  setIsBalanced: (balanced: boolean) => void;
  onSaveSuccess?: () => void;
  defaultType?: string;
}

const CheckPreview: React.FC<{
  transitNumber?: string;
  institutionNumber?: string;
  accountNumber?: string;
  checkNumber?: string;
}> = ({ 
  transitNumber = '12345', 
  institutionNumber = '000',
  accountNumber = '1234567', 
  checkNumber = '001' 
}) => (
  <Card className="check-preview-card">
    <div className="check-preview-content">
      <div className="labels-container">
        <div className="check-labels">
          <span className="check-number-label">Check #</span>
          <span className="transit-label">Transit #</span>
          <span className="institution-label">Institution #</span>
          <span className="account-label">Account #</span>
          <div className="signature-icon">
            <IconSignature size={45} stroke={1.25} color="rgba(0, 0, 0, 0.45)" />
          </div>
        </div>
        <div className="label-underline"></div>
      </div>
      <div className="check-numbers">
        <div className="micr-font">
          <span className="symbol">⑈</span>
          <span>{checkNumber || '001'}</span>
          <span className="symbol">⑈</span>
          <span className="symbol">⑆</span>
          <span>{transitNumber || '12345'}</span>
          <span className="symbol">⑉</span>
          <span>{institutionNumber || '000'}</span>
          <span className="symbol">⑆</span>
          <span>{accountNumber || '1234567'}</span>
          <span className="symbol">⑈</span>
        </div>
      </div>
    </div>
  </Card>
);

const getAccountClassAndType = (fullType: string) => {
  const classMap: { [key: string]: string } = {
    'asset': 'Asset',
    'liability': 'Liability',
    'equity': 'Equity',
    'revenue': 'Revenue',
    'expense': 'Expense'
  };

  const typeMap: { [key: string]: string } = {
    'receivable': 'Accounts Receivable',
    'other_current': 'Other Current Assets',
    'bank': 'Bank',
    'fixed': 'Fixed Assets',
    'other_assets': 'Other Assets',
    'payable': 'Accounts Payable',
    'credit_card': 'Credit Card',
    'current': 'Other Current Liabilities',
    'long_term': 'Long Term Liabilities',
    'income': 'Income',
    'other_income': 'Other Income',
    'cogs': 'Cost of Goods Sold'
  };

  // Split the fullType (e.g., "asset_bank" becomes ["asset", "bank"])
  const [accountClass, accountType] = fullType.split('_');

  return {
    class: classMap[accountClass] || accountClass,
    type: typeMap[accountType] || accountType
  };
};

const NewAccount: React.FC<NewAccountProps> = ({ 
  onClose, 
  currentStep, 
  onStepChange, 
  form, 
  companyId, 
  setIsBalanced, 
  onSaveSuccess,
  defaultType 
}) => {
  const [selectedType, setSelectedType] = useState<string>(defaultType || '');
  const [steps, setSteps] = useState<any[]>([]); // Define appropriate type
  const [showRoutingInfo, setShowRoutingInfo] = useState(false);
  const [transitNumber, setTransitNumber] = useState('12345');
  const [institutionNumber, setInstitutionNumber] = useState('000');
  const [accountNumber, setAccountNumber] = useState('1234567');
  const [checkNumber, setCheckNumber] = useState('001');
  const [isSubAccount, setIsSubAccount] = useState(false);
  const [parentAccounts, setParentAccounts] = useState<Array<{ value: string; label: string }>>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [selectedDate, setSelectedDate] = useState<any>(null);
  const [properties, setProperties] = useState<Array<{ value: string; label: string }>>([]);
  const [loadingProperties, setLoadingProperties] = useState(false);
  const [totalBalance, setTotalBalance] = useState<number>(0);
  const [propertyBalancesSum, setPropertyBalancesSum] = useState<number>(0);

  const { Text, Link } = Typography;

  useEffect(() => {
    // First, define all possible steps
    const allSteps = [
      { title: 'Account Info', icon: <IconFileDescription size={20} stroke={1.5} /> },
      { title: 'Opening Balance', icon: <IconCash size={20} stroke={1.5} /> },
      { title: 'Lease Options', icon: <IconHome size={20} stroke={1.5} /> },
      { title: 'Check Printing', icon: <IconPrinter size={20} stroke={1.5} /> }
    ];

    // Determine which steps should be included based on account type
    let availableSteps = [];
    if (selectedType?.startsWith('asset') || selectedType?.startsWith('liability') || selectedType === 'equity') {
      availableSteps = allSteps; // All steps for asset, liability, and equity
    } else if (selectedType?.startsWith('expense')) {
      availableSteps = [allSteps[0], allSteps[2], allSteps[3]]; // Account Info, Lease Options, Check Printing
    } else if (selectedType?.startsWith('revenue')) {
      availableSteps = [allSteps[0], allSteps[2], allSteps[3]]; // Account Info, Lease Options, Check Printing
    } else {
      availableSteps = [allSteps[0], allSteps[2]]; // Default to Account Info and Lease Options
    }

    // Calculate which 3 steps should be visible
    let visibleSteps;
    if (availableSteps.length <= 3) {
      visibleSteps = availableSteps;
    } else {
      if (currentStep === 0) {
        visibleSteps = availableSteps.slice(0, 3);
      } else if (currentStep === availableSteps.length - 1) {
        visibleSteps = availableSteps.slice(-3);
      } else {
        visibleSteps = availableSteps.slice(
          Math.max(0, currentStep - 1),
          Math.min(currentStep + 2, availableSteps.length)
        );
      }
    }

    setSteps(visibleSteps);
  }, [selectedType, currentStep]);

  const fetchParentAccounts = async () => {
    try {
      setLoadingAccounts(true);
      const accountsRef = collection(db, 'accounting', companyId, 'accounts');
      
      // Query all accounts that aren't sub-accounts
      const q = query(
        accountsRef, 
        where('isSubAccount', '==', false)
      );
      
      const querySnapshot = await getDocs(q);
      const accounts = querySnapshot.docs.map(doc => ({
        value: doc.id,
        label: doc.data().accountName || ''
      }));
      
      console.log('Found parent accounts:', accounts);
      setParentAccounts(accounts);
    } catch (error) {
      console.error('Error fetching parent accounts:', error);
    } finally {
      setLoadingAccounts(false);
    }
  };

  const handleTypeChange = (value: string) => {
    const { class: accountClass, type: accountType } = getAccountClassAndType(value);
    
    setSelectedType(value);
    form.setFieldsValue({ 
      type: value,
      accountClass,
      accountType
    });
  };

  const handleSubAccountChange = (checked: boolean) => {
    setIsSubAccount(checked);
    form.setFieldsValue({ isSubAccount: checked });
    if (checked) {
      fetchParentAccounts();
    }
  };

  const fetchProperties = async () => {
    try {
      setLoadingProperties(true);
      const propertiesRef = collection(db, 'properties');
      
      const q = query(
        propertiesRef, 
        where('companyuid', '==', companyId)
      );
      
      const querySnapshot = await getDocs(q);
      
      const propertiesData = await Promise.all(
        querySnapshot.docs.map(async (doc) => {
          try {
            // Get the propertySettings collection
            const propertySettingsRef = collection(doc.ref, 'propertySettings');
            const propertySettingsSnapshot = await getDocs(propertySettingsRef);
            
            if (!propertySettingsSnapshot.empty) {
              // Find the general document in propertySettings
              const generalDoc = propertySettingsSnapshot.docs.find(
                doc => doc.id === 'general'
              );
              
              if (generalDoc) {
                const generalData = generalDoc.data();
                return {
                  value: doc.id,
                  label: generalData.propertyName || doc.id
                };
              }
            }
            
            return {
              value: doc.id,
              label: doc.id // Fallback to ID if no name found
            };
          } catch (error) {
            console.error(`Error fetching property ${doc.id} details:`, error);
            return {
              value: doc.id,
              label: doc.id
            };
          }
        })
      );
      
      console.log('Properties with names:', propertiesData);
      setProperties(propertiesData);
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoadingProperties(false);
    }
  };

  useEffect(() => {
    if (currentStep === 1 && (selectedType?.startsWith('asset') || selectedType === 'equity')) {
      fetchProperties();
    }
  }, [currentStep, selectedType, companyId]);

  const calculatePropertyBalancesSum = (balances: any[]) => {
    return balances.reduce((sum, item) => {
      const balanceValue = item?.balance 
        ? parseFloat(item.balance.replace(/[^0-9.-]+/g, ""))
        : 0;
      return sum + (isNaN(balanceValue) ? 0 : balanceValue);
    }, 0);
  };

  useEffect(() => {
    // Update the parent component whenever the balance changes
    setIsBalanced(Math.abs(totalBalance - propertyBalancesSum) <= 0.01);
  }, [totalBalance, propertyBalancesSum, setIsBalanced]);

  // Add an effect to handle the defaultType
  useEffect(() => {
    if (defaultType) {
      handleTypeChange(defaultType);
    }
  }, [defaultType]);



  return (
    <div className="new-account-drawer">
      <div className="content">
        <Steps 
          current={currentStep} 
          items={steps.map(step => ({
            title: step.title,
            icon: step.icon
          }))} 
          className="steps-container" 
        />
        <div className="account-form-container">
          <Form form={form} layout="vertical" className="account-form">
            <div className="step-content">
              {/* Step 0: Account Info */}
              {currentStep === 0 && (
                <>
                  <Form.Item name="accountClass" hidden>
                    <Input />
                  </Form.Item>
                  <Form.Item name="accountType" hidden>
                    <Input />
                  </Form.Item>

                  <Form.Item
                    name="type"
                    label="Type"
                    className="type-field"
                    required
                    rules={[
                      { required: true, message: 'Please select account type' }
                    ]}
                  >
                    <Select 
                      placeholder="Select account type"
                      showSearch
                      style={{ height: '40px' }}
                      onChange={handleTypeChange}
                      filterOption={(input, option) =>
                        (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
                      }
                      options={[
                        { value: "asset_receivable", label: "Asset (Accounts Receivable)" },
                        { value: "asset_other_current", label: "Asset (Other Current Assets)" },
                        { value: "asset_bank", label: "Asset (Bank)" },
                        { value: "asset_fixed", label: "Asset (Fixed Assets)" },
                        { value: "asset_other", label: "Asset (Other Assets)" },
                        { value: "liability_payable", label: "Liability (Accounts Payable)" },
                        { value: "liability_credit_card", label: "Liability (Credit Card)" },
                        { value: "liability_current", label: "Liability (Other Current Liabilities)" },
                        { value: "liability_long_term", label: "Liability (Long Term Liabilities)" },
                        { value: "equity", label: "Equity" },
                        { value: "revenue_income", label: "Revenue (Income)" },
                        { value: "revenue_other", label: "Revenue (Other Income)" },
                        { value: "expense", label: "Expense" },
                        { value: "expense_other", label: "Expense (Other Expense)" },
                        { value: "expense_cogs", label: "Expense (Cost of Goods Sold)" }
                      ]}
                    />
                  </Form.Item>

                  <Form.Item
                    name="accountName"
                    label="Account Name"
                    required
                    rules={[
                      { required: true, message: 'Please enter account name' },
                      { whitespace: true, message: 'Account name cannot be empty' }
                    ]}
                  >
                    <Input placeholder="Account Name" />
                  </Form.Item>

                  <Form.Item
                    name="description"
                    label="Description"
                    rules={[
                      { whitespace: true, message: 'Description cannot be empty' }
                    ]}
                  >
                    <Input.TextArea placeholder="Description" rows={4} />
                  </Form.Item>

                  <Form.Item
                    name="activeAccount"
                    valuePropName="checked"
                    initialValue={true}
                  >
                    <div className="switch-container">
                      <Switch defaultChecked /> 
                      <span className="switch-label">Active Account</span>
                    </div>
                  </Form.Item>

                  <Form.Item
                    name="isSubAccount"
                    valuePropName="checked"
                    initialValue={false}
                  >
                    <div className="switch-container">
                      <Switch onChange={handleSubAccountChange} /> 
                      <span className="switch-label">This is a sub-account</span>
                    </div>
                  </Form.Item>

                  {isSubAccount && (
                    <Form.Item
                      name="parentAccount"
                      label="Parent Account"
                      required
                      rules={[{ required: true, message: 'Please select a parent account' }]}
                    >
                      <Select
                        showSearch
                        placeholder="Search for parent account"
                        loading={loadingAccounts}
                        filterOption={(input, option) =>
                          (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                        options={parentAccounts}
                        notFoundContent={loadingAccounts ? 'Loading...' : 'No accounts found'}
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                  )}
                </>
              )}
              
              {/* Step 1: Opening Balance */}
              {currentStep === 1 && (selectedType?.startsWith('asset') || selectedType?.startsWith('liability') || selectedType === 'equity') && (
                <>
                  <div className="date-header">
                    <h3>When do you want to start tracking your finances for this account?</h3>
                    <p>
                      Your accounting start date is important, because this will be the date that you begin tracking transactions for this account in Velloa. Everything before this date will is summarized in the opening balance that you enter for this account.{' '}
                      <Link href="https://www.velloa.com/docs/accounting-start-date">Learn more</Link>
                    </p>
                  </div>

                  <Form.Item
                    name="startDate"
                    label="Accounting Start Date"
                    required={selectedType?.startsWith('asset') || selectedType?.startsWith('liability') || selectedType === 'equity'}
                    rules={[
                      { 
                        required: selectedType?.startsWith('asset') || selectedType?.startsWith('liability') || selectedType === 'equity', 
                        message: 'Please select an accounting start date' 
                      }
                    ]}
                  >
                    <DatePicker 
                      style={{ width: '100%', height: '40px' }}
                      placeholder="Select date"
                      onChange={(date) => setSelectedDate(date)}
                    />
                  </Form.Item>
                  <Divider/>
                  <Form.Item
                    name="openingBalance"
                    label={
                      <span>
                        What was your total account balance on{' '}
                        <strong>
                          {selectedDate 
                            ? dayjs(selectedDate).subtract(1, 'day').format('MMM D, YYYY') 
                            : '?'}
                        </strong>
                      </span>
                    }
                    required={selectedType?.startsWith('asset') || selectedType?.startsWith('liability') || selectedType === 'equity'}
                    rules={[
                      { 
                        required: selectedType?.startsWith('asset') || selectedType?.startsWith('liability') || selectedType === 'equity', 
                        message: 'Please enter the opening balance' 
                      }
                    ]}
                  >
                    <NumericFormat
                      style={{ height: '40px' }} 
                      placeholder="$ Account Balance"
                      className="balance-input"
                      thousandSeparator=","
                      decimalSeparator="."
                      prefix="$ "
                      decimalScale={2}
                      fixedDecimalScale={true}
                      allowNegative={true}  // Allow negative values for liabilities
                      onValueChange={(values: { formattedValue: string; value: string }) => {
                        const { formattedValue, value } = values;
                        form.setFieldsValue({ openingBalance: formattedValue });
                        setTotalBalance(parseFloat(value) || 0);
                      }}
                      customInput={Input}
                    />
                  </Form.Item>

                  <Divider />
                  
                  {selectedType?.startsWith('asset') && (
                    <div className="property-balance-section">
                      <h3>Now we need to know the balance by property</h3>
                      <p>
                        Please add the balance per property below. The total per property must be equal to the total 
                        Account Balance. This should include the total amount for each property, including deposits 
                        and reserves.{' '}
                        <Link href="https://www.velloa.com/docs/property-balance">Learn more</Link>
                      </p>

                      <Form.List name="propertyBalances" initialValue={[{ property: undefined, balance: undefined }]}>
                        {(fields, { add, remove }) => (
                          <>
                            {fields.map(({ key, name, ...restField }) => (
                              <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                                <Form.Item
                                  {...restField}
                                  name={[name, 'property']}
                                  rules={[{ required: true, message: 'Please select a property' }]}
                                >
                                  <Select
                                    style={{ width: 250, height: '40px' }}
                                    placeholder="Property"
                                    loading={loadingProperties}
                                    options={properties}
                                    showSearch
                                    filterOption={(input, option) =>
                                      (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
                                    }
                                    notFoundContent={loadingProperties ? 'Loading...' : 'No properties found'}
                                  />
                                </Form.Item>
                                <Form.Item
                                  {...restField}
                                  name={[name, 'balance']}
                                  rules={[{ required: true, message: 'Please enter a balance' }]}
                                >
                                  <NumericFormat
                                    style={{ width: 250, height: '40px' }}
                                    placeholder={`$ Balance on ${selectedDate ? dayjs(selectedDate).subtract(1, 'day').format('MM/DD/YYYY') : ''}`}
                                    thousandSeparator=","
                                    decimalSeparator="."
                                    prefix="$ "
                                    decimalScale={2}
                                    fixedDecimalScale={true}
                                    allowNegative={false}
                                    onValueChange={(values: { formattedValue: string; value: string }) => {
                                      const { formattedValue, value } = values;
                                      form.setFieldsValue({ 
                                        propertyBalances: fields.map((field, i) => {
                                          if (i === name) {
                                            return { ...field, balance: formattedValue };
                                          }
                                          return form.getFieldValue(['propertyBalances', i]);
                                        })
                                      });
                                      
                                      // Calculate sum of all property balances
                                      const allBalances = form.getFieldValue('propertyBalances');
                                      const newSum = calculatePropertyBalancesSum(allBalances);
                                      setPropertyBalancesSum(newSum);
                                    }}
                                    customInput={Input}
                                  />
                                </Form.Item>
                                {fields.length > 1 && (
                                  <Button 
                                    type="link" 
                                    icon={<IconMinus size={16} stroke={1.5} />}
                                    onClick={() => remove(name)}
                                  >
                                    Remove
                                  </Button>
                                )}
                              </Space>
                            ))}
                            <Form.Item>
                              <Button 
                                type="text" 
                                onClick={() => add()} 
                                icon={<IconPlus size={16} stroke={1.5} color="#52c41a" />}
                                style={{ color: '#52c41a' }}
                              >
                                Add Another Property
                              </Button>
                            </Form.Item>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
                              <div 
                                style={{
                                  padding: '16px',
                                  backgroundColor: '#f5f5f5',
                                  borderRadius: '8px',
                                  width: '350px'  // Fixed width instead of 100%
                                }}
                              >
                                <div style={{ marginBottom: '8px' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                    <span>Total Account Balance:</span>
                                    <span>${totalBalance.toFixed(2)}</span>
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                    <span>Sum of Property Balances:</span>
                                    <span>${propertyBalancesSum.toFixed(2)}</span>
                                  </div>
                                </div>
                                <Divider style={{ margin: '8px 0' }} />
                                <div style={{ 
                                  display: 'flex', 
                                  justifyContent: 'space-between',
                                  color: Math.abs(totalBalance - propertyBalancesSum) > 0.01 ? '#ff4d4f' : '#52c41a'
                                }}>
                                  <span>Difference:</span>
                                  <span>${(totalBalance - propertyBalancesSum).toFixed(2)}</span>
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                      </Form.List>
                    </div>
                  )}
                </>
              )}

              {/* Step 2: Lease Options (for all accounts) */}
              {(
                (
                  (selectedType?.startsWith('asset') || 
                  selectedType?.startsWith('liability') || 
                  selectedType === 'equity') && 
                  currentStep === 2
                ) || 
                (
                  (selectedType?.startsWith('expense') || 
                  selectedType?.startsWith('revenue')) && 
                  currentStep === 1
                )
              ) && (
                <>
                  <Form.Item 
                    name="useForLeaseCharges" 
                    valuePropName="checked"
                    initialValue={false}
                  >
                    <div className="switch-container">
                      <Switch 
                        onChange={(checked) => {
                          form.setFieldsValue({ useForLeaseCharges: checked });
                        }}
                      />
                      <div className="switch-text">
                        <span className="switch-label">Use this account for Lease Charges</span>
                        <span className="switch-description">This will allow you to select this account when creating a new lease charge, credit, or refund.</span>
                      </div>
                    </div>
                  </Form.Item>

                  <Form.Item 
                    name="useForLeaseDeposits" 
                    valuePropName="checked"
                    initialValue={false}
                  >
                    <div className="switch-container">
                      <Switch 
                        onChange={(checked) => {
                          form.setFieldsValue({ useForLeaseDeposits: checked });
                        }}
                      />
                      <div className="switch-text">
                        <span className="switch-label">Use this account for Lease Deposits</span>
                        <span className="switch-description">This will allow you to select this account when creating a new lease deposit charge.</span>
                      </div>
                    </div>
                  </Form.Item>

                  <Form.Item 
                    name="defaultLeaseStatementMemo" 
                    valuePropName="checked"
                    initialValue={false}
                  >
                    <div className="switch-container">
                      <Switch 
                        onChange={(checked) => {
                          form.setFieldsValue({ defaultLeaseStatementMemo: checked });
                        }}
                      />
                      <div className="switch-text">
                        <span className="switch-label">Set a default lease statement memo</span>
                        <span className="switch-description">This will allow you to select this account when creating a new lease deposit charge.</span>
                      </div>
                    </div>
                  </Form.Item>
                </>
              )}

              {/* Step 3/2: Check Printing */}
              {(
                (
                  (selectedType?.startsWith('asset') || 
                  selectedType?.startsWith('liability') || 
                  selectedType === 'equity') && 
                  currentStep === 3
                ) || 
                (
                  (selectedType?.startsWith('expense') || 
                  selectedType?.startsWith('revenue')) && 
                  currentStep === 2
                )
              ) && (
                <div className="check-printing-section">
                  <div style={{ marginBottom: '24px', marginTop: '48px' }}>
                    <Text style={{ fontSize: '14px' }}>You can print checks with Velloa for transactions such as expenses, owner distributions and bill payments. </Text>
                    <Link href="https://www.velloa.com/">Learn more</Link>
                  </div>

                  <Form.Item
                    name="includeRoutingInfo"
                    valuePropName="checked"
                    initialValue={false}
                  >
                    <div className="switch-container">
                      <Switch onChange={(checked) => setShowRoutingInfo(checked)} />
                      <div className="switch-text">
                        <span className="switch-label">Include Transit, Institution and Account numbers when printing on the check</span>
                        <span className="switch-description" style={{ fontSize: '12px', color: '#8C8C8C' }}>This will be used with your Transit, Institution and Account numbers already printed on the checks. If not, toggle this off.</span>
                      </div>
                    </div>
                  </Form.Item>

                  {showRoutingInfo && (
                    <div className="bank-details">
                      <div style={{ display: 'flex', gap: '16px' }}>
                        <Form.Item 
                          name="transitNumber" 
                          label={
                            <span>
                              Transit Number{' '}
                              <Tooltip title="A 5-digit code that identifies your specific bank branch. Found at the bottom of your check. Example: 12345">
                                <IconInfoCircle size={16} stroke={1.5} style={{ color: '#8C8C8C' }} />
                              </Tooltip>
                            </span>
                          }
                          style={{ flex: 1 }}
                          rules={[
                            { pattern: /^\d{5}$/, message: 'Transit number must be exactly 5 digits', warningOnly: true }
                          ]}
                          dependencies={['institutionNumber', 'bankAccountNumber', 'nextCheckNumber', 'accountOwnerName']}
                        >
                          <Input 
                            placeholder="Transit Number" 
                            maxLength={5}
                            onChange={(e) => {
                              const value = e.target.value;
                              form.setFieldsValue({ transitNumber: value });
                              setTransitNumber(value || '12345');
                            }}
                          />
                        </Form.Item>

                        <Form.Item 
                          name="institutionNumber" 
                          label={
                            <span>
                              Institution Number{' '}
                              <Tooltip title="A 3-digit code that identifies your bank. For example: RBC (003), TD (004), CIBC (010), ScotiaBank (002) etc.">
                                <IconInfoCircle size={16} stroke={1.5} style={{ color: '#8C8C8C' }} />
                              </Tooltip>
                            </span>
                          }
                          style={{ flex: 1 }}
                          rules={[
                            { pattern: /^\d{3}$/, message: 'Institution number must be exactly 3 digits', warningOnly: true }
                          ]}
                          dependencies={['transitNumber', 'bankAccountNumber', 'nextCheckNumber', 'accountOwnerName']}
                        >
                          <Input 
                            placeholder="Institution Number" 
                            maxLength={3}
                            onChange={(e) => {
                              const value = e.target.value;
                              form.setFieldsValue({ institutionNumber: value });
                              setInstitutionNumber(value || '000');
                            }}
                          />
                        </Form.Item>
                      </div>

                      <div style={{ display: 'flex', gap: '16px' }}>
                        <Form.Item 
                          name="bankAccountNumber" 
                          label={
                            <span>
                              Account Number{' '}
                              <Tooltip title="Your bank account number, typically 7-12 digits. Found at the bottom of your check after the institution number. Example: 1234567">
                                <IconInfoCircle size={16} stroke={1.5} style={{ color: '#8C8C8C' }} />
                              </Tooltip>
                            </span>
                          }
                          style={{ flex: 1 }}
                          rules={[
                            { pattern: /^\d+$/, message: 'Account number must contain only digits', warningOnly: true },
                            { min: 7, message: 'Account number must be at least 7 digits', warningOnly: true },
                            { max: 12, message: 'Account number cannot exceed 12 digits', warningOnly: true }
                          ]}
                          dependencies={['transitNumber', 'institutionNumber', 'nextCheckNumber', 'accountOwnerName']}
                        >
                          <Input 
                            placeholder="Account Number" 
                            maxLength={12}
                            onChange={(e) => {
                              const value = e.target.value;
                              form.setFieldsValue({ bankAccountNumber: value });
                              setAccountNumber(value || '1234567');
                            }}
                          />
                        </Form.Item>

                        <Form.Item 
                          name="nextCheckNumber" 
                          label={
                            <span>
                              Next Check Number{' '}
                              <Tooltip title="The number of the next check in your checkbook. Must be 3 digits. Example: 001">
                                <IconInfoCircle size={16} stroke={1.5} style={{ color: '#8C8C8C' }} />
                              </Tooltip>
                            </span>
                          }
                          style={{ flex: 1 }}
                          rules={[
                            { pattern: /^\d{3}$/, message: 'Check number must be exactly 3 digits', warningOnly: true }
                          ]}
                          dependencies={['transitNumber', 'institutionNumber', 'bankAccountNumber', 'accountOwnerName']}
                        >
                          <Input 
                            placeholder="Next Check Number" 
                            maxLength={3}
                            onChange={(e) => {
                              const value = e.target.value;
                              form.setFieldsValue({ nextCheckNumber: value });
                              setCheckNumber(value || '001');
                            }}
                          />
                        </Form.Item>
                      </div>

                      <Form.Item 
                        name="accountOwnerName" 
                        label={
                          <span>
                            Account Owner Name{' '}
                            <Tooltip title="The name of the individual or business that owns this bank account. This will appear on printed checks.">
                              <IconInfoCircle size={16} stroke={1.5} style={{ color: '#8C8C8C' }} />
                            </Tooltip>
                          </span>
                        }
                        rules={[
                          { whitespace: true, message: 'Account owner name cannot be empty', warningOnly: true }
                        ]}
                      >
                        <Input placeholder="Account Owner Name" />
                      </Form.Item>

                      <Form.Item name="bankAccountContactInfo" label="Bank Account Contact Info">
                        <Input.TextArea rows={2} placeholder="Bank Account Contact Info" />
                      </Form.Item>

                      <div className="check-preview-container">
                        <CheckPreview 
                          transitNumber={showRoutingInfo ? transitNumber : undefined}
                          institutionNumber={showRoutingInfo ? institutionNumber : undefined}
                          accountNumber={showRoutingInfo ? accountNumber : undefined}
                          checkNumber={showRoutingInfo ? checkNumber : undefined}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
};
export default NewAccount; 