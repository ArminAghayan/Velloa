import React, { useState, useEffect } from 'react';
import { Input, Button, Select, Table, Space, Typography, Drawer, Form, message } from 'antd';
import { 
  IconAdjustmentsHorizontal, 
  IconDots, 
  IconArrowLeft,
  IconPlus
} from '@tabler/icons-react';
import { useNavigate, useLocation } from 'react-router-dom';
import './chartsOfAccounts.css';
import NewAccount from './NewAccount/NewAccount';
import { addDoc, collection, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { db } from '../../../../firebase-config';

const { Title, Text, Link } = Typography;

// Add interface for location state
interface LocationState {
  companyId: string;
}

// Add this interface
interface CheckPrinting {
  includeRoutingInfo: boolean;
  transitNumber: string | null;
  institutionNumber: string | null;
  bankAccountNumber: string | null;
  nextCheckNumber: string | null;
  accountOwnerName: string | null;
  bankAccountContactInfo: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface Account {
  id: string;
  accountName: string;
  type: string;
  description: string;
  isActive: boolean;
  isSubAccount: boolean;
  parentAccount: string | null;
  
  // Asset specific fields
  openingBalance?: number;
  startDate?: Date;
  
  // Lease specific fields
  useForLeaseCharges?: boolean;
  useForLeaseDeposits?: boolean;
  defaultLeaseStatementMemo?: boolean;
  
  // Check Printing array
  checkPrinting?: CheckPrinting[];
  
  // Metadata
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
  accountClass: string;
  accountType: string;
}

// Add interface for filters
interface Filters {
  search: string;
  class: string | undefined;
  type: string | undefined;
  defaultAccountFor: string | undefined;
  active: string | undefined;
}

// Update the NestedAccount interface
interface NestedAccount extends Omit<Account, 'id'> {
  id: string;
  key: string;
  children?: NestedAccount[];
}

const ChartsOfAccounts: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // Add type safety to location.state
  const companyId = (location.state as LocationState)?.companyId;
  
  useEffect(() => {
    // Add more specific error handling
    if (!companyId) {
      console.error('No company ID provided');
      navigate('/accounting', { replace: true });
      return;
    }
  }, [companyId, navigate]);

  const [showFilters, setShowFilters] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm();
  const [accounts, setAccounts] = useState<NestedAccount[]>([]);

  // Update filters state with proper typing
  const [filters, setFilters] = useState<Filters>({
    search: '',
    class: undefined,
    type: undefined,
    defaultAccountFor: undefined,
    active: undefined,
  });

  // Add filtered accounts state
  const [filteredAccounts, setFilteredAccounts] = useState<NestedAccount[]>([]);

  const capitalizeFirstLetter = (text: string) => {
    if (!text) return '';
    return text
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Add this function to transform flat data into nested structure
  const transformToNestedAccounts = (accounts: NestedAccount[]): NestedAccount[] => {
    const accountMap = new Map<string, NestedAccount>();
    const nestedAccounts: NestedAccount[] = [];

    // First pass: Create all account objects with keys
    accounts.forEach(account => {
      accountMap.set(account.id, {
        ...account,
        key: account.id,
        // Only initialize children array for parent accounts
        children: account.isSubAccount ? undefined : []
      });
    });

    // Second pass: Build the hierarchy
    accounts.forEach(account => {
      const nestedAccount = accountMap.get(account.id)!;
      
      if (account.isSubAccount && account.parentAccount) {
        // This is a sub-account, add it to its parent's children array
        const parent = accountMap.get(account.parentAccount);
        if (parent && parent.children) {
          parent.children.push(nestedAccount);
        }
      } else if (!account.isSubAccount) {
        // This is a top-level account
        nestedAccounts.push(nestedAccount);
      }
    });

    // Remove empty children arrays
    nestedAccounts.forEach(account => {
      if (account.children?.length === 0) {
        delete account.children;
      }
    });

    return nestedAccounts;
  };

  // Update the columns configuration
  const columns = [
    {
      title: 'Accounts',
      dataIndex: 'accountName',
      key: 'accountName',
      render: (text: string, record: NestedAccount) => (
        <span style={{ 
          paddingLeft: record.isSubAccount ? '20px' : '0',
          color: record.isSubAccount ? 'rgba(0, 0, 0, 0.45)' : 'inherit'
        }}>
          {capitalizeFirstLetter(text)}
        </span>
      ),
    },
    {
      title: 'Type',
      key: 'type',
      render: (record: NestedAccount) => {
        if (!record.accountType || record.accountType === record.accountClass) {
          return record.accountClass;
        }
        return `${record.accountClass} (${record.accountType})`;
      },
    },
    {
        title: 'Default Account For',
        dataIndex: 'defaultAccountFor',
        key: 'defaultAccountFor',
        render: (text: string) => capitalizeFirstLetter(text || ''),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (text: string) => capitalizeFirstLetter(text || ''),
    },
    {
      key: 'action',
      width: 50,
      align: 'right' as const,
      render: () => (
        <Button 
          type="text" 
          icon={<IconDots size={20} style={{ transform: 'rotate(90deg)' }} />} 
        />
      ),
    },
  ];

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBalanced, setIsBalanced] = useState(true);

  const handleSubmit = async () => {
    if (isSubmitting) return; // Prevent multiple submissions
    
    try {
      setIsSubmitting(true);
      const formValues = form.getFieldsValue(true);
      console.log('Raw form values:', formValues);

      if (!formValues.accountName || formValues.accountName.trim() === '') {
        message.error('Account Name is required');
        return;
      }

      if (!formValues.type) {
        message.error('Account Type is required');
        return;
      }

      // Map class types to proper names
      const classMap: { [key: string]: string } = {
        'asset': 'Asset',
        'liability': 'Liability',
        'equity': 'Equity',
        'revenue': 'Revenue',
        'expense': 'Expense'
      };

      // Map subtypes to proper names
      const typeMap: { [key: string]: string } = {
        'receivable': 'Accounts Receivable',
        'other_current': 'Other Current Assets',
        'bank': 'Bank',
        'fixed': 'Fixed Assets',
        'other': 'Other Assets',
        'payable': 'Accounts Payable',
        'credit_card': 'Credit Card',
        'current': 'Other Current Liabilities',
        'long_term': 'Long Term Liabilities',
        'income': 'Income',
        'other_income': 'Other Income',
        'cogs': 'Cost of Goods Sold',
        'expense': 'Expense',
        'equity': 'Equity'
      };

      let accountClass: string;
      let accountType: string;

      if (formValues.type.includes('_')) {
        // Handle combined format (e.g., "asset_bank")
        const [classType, subType] = formValues.type.split('_');
        accountClass = classMap[classType] || capitalizeFirstLetter(classType);
        accountType = typeMap[subType] || capitalizeFirstLetter(subType);
      } else {
        // Handle simple format (e.g., "expense")
        accountClass = classMap[formValues.type] || capitalizeFirstLetter(formValues.type);
        // Use accountClass as the accountType if not specified
        accountType = formValues.accountType || accountClass;
      }

      const checkPrintingDetails = formValues.includeRoutingInfo ? {
        checkPrinting: [{
          includeRoutingInfo: formValues.includeRoutingInfo ?? false,
          transitNumber: formValues.transitNumber || null,
          institutionNumber: formValues.institutionNumber || null,
          bankAccountNumber: formValues.bankAccountNumber || null,
          nextCheckNumber: formValues.nextCheckNumber || null,
          accountOwnerName: formValues.accountOwnerName || null,
          bankAccountContactInfo: formValues.bankAccountContactInfo || null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }]
      } : {};

      const accountData = {
        // Step 1 - Basic Info
        accountName: formValues.accountName.trim(),
        accountClass,                    // Mapped class value
        accountType,                     // Mapped type value
        description: formValues.description || '',
        isActive: formValues.activeAccount ?? true,
        isSubAccount: formValues.isSubAccount ?? false,
        parentAccount: formValues.parentAccount || null,

        // Step 2 - Asset/Lease Options
        ...(formValues.type?.startsWith('asset') ? {
          // Asset specific fields
          openingBalance: formValues.openingBalance ? Number(formValues.openingBalance) : 0,
          startDate: formValues.startDate ? formValues.startDate.toDate() : null,
        } : {
          // Lease specific fields
          useForLeaseCharges: formValues.useForLeaseCharges ?? false,
          useForLeaseDeposits: formValues.useForLeaseDeposits ?? false,
          defaultLeaseStatementMemo: formValues.defaultLeaseStatementMemo ?? false,
        }),

        // Step 3 - Check Printing (as array)
        ...checkPrintingDetails,

        // Metadata
        companyId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      console.log('Account data to save:', accountData);

      // Create or update accounting document
      const accountingRef = doc(db, 'accounting', companyId);
      await setDoc(accountingRef, { companyId }, { merge: true });

      if (formValues.isSubAccount && formValues.parentAccount) {
        // For sub-accounts, save in the accounts collection with parentAccount reference
        const accountsRef = collection(accountingRef, 'accounts');
        await addDoc(accountsRef, {
          ...accountData,
          isSubAccount: true,
          parentAccount: formValues.parentAccount
        });
        message.success('Sub-account created successfully');
      } else {
        // For regular accounts, save directly to accounts collection
        const accountsRef = collection(accountingRef, 'accounts');
        await addDoc(accountsRef, accountData);
        message.success('Account created successfully');
      }

      handleClose();
      form.resetFields();
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      message.error('Failed to create account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setDrawerOpen(false);
    setCurrentStep(0);
    form.resetFields(); // Reset form when closing drawer
  };

  const getTotalSteps = () => {
    const accountType = form.getFieldValue('type');
    
    if (accountType?.startsWith('asset') || accountType?.startsWith('liability') || accountType === 'equity') {
      return 4; // Account Info -> Opening Balance -> Lease Options -> Check Printing
    } else if (accountType?.startsWith('expense') || accountType?.startsWith('revenue')) {
      return 3; // Account Info -> Lease Options -> Check Printing
    } else {
      return 2; // Account Info -> Lease Options (default)
    }
  };

  const handleNextStep = async () => {
    if (isSubmitting) return;

    try {
      await form.validateFields();
      
      if (currentStep === 0) {
        const values = form.getFieldsValue();
        if (!values.accountName?.trim()) {
          message.error('Account Name is required');
          return;
        }
        if (!values.type) {
          message.error('Account Type is required');
          return;
        }
      }

      if (currentStep === 1) {
        const values = form.getFieldsValue();
        
        // Only validate opening balance for asset, liability, and equity accounts
        if (values.type?.startsWith('asset') || values.type?.startsWith('liability') || values.type === 'equity') {
          if (!values.startDate) {
            message.error('Accounting Start Date is required');
            return;
          }
          
          if (!values.openingBalance) {
            message.error('Total Account Balance is required');
            return;
          }
          
          // Only check property balances for asset accounts
          if (values.type?.startsWith('asset') && !isBalanced) {
            message.error('Property balances must equal the total account balance');
            return;
          }
        }
      }
      
      const totalSteps = getTotalSteps();
      
      if (currentStep < totalSteps - 1) {
        setCurrentStep(prev => prev + 1);
      } else {
        await handleSubmit();
      }
    } catch (error) {
      console.error('Step validation failed:', error);
    }
  };

  useEffect(() => {
    if (!companyId) return;

    const accountsRef = collection(db, 'accounting', companyId, 'accounts');
    const unsubscribe = onSnapshot(accountsRef, (snapshot) => {
      // Transform the raw data into NestedAccount type immediately
      const accountsData: NestedAccount[] = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        key: doc.id, // Add the required key property
      })) as NestedAccount[];
      
      // Transform into nested structure
      const nestedAccounts = transformToNestedAccounts(accountsData);
      
      setAccounts(nestedAccounts);
      setFilteredAccounts(nestedAccounts);
    });

    return () => unsubscribe();
  }, [companyId]);

  // Add filter handling function
  const handleFilterChange = (value: any, filterType: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  // Add useEffect to filter accounts
  useEffect(() => {
    let result = [...accounts];

    // Filter by search term
    if (filters.search) {
      result = result.filter(account => 
        account.accountName.toLowerCase().includes(filters.search.toLowerCase()) ||
        (account.description?.toLowerCase() || '').includes(filters.search.toLowerCase())
      );
    }

    // Filter by class
    if (filters.class) {
      const classFilter = filters.class.toLowerCase();
      result = result.filter(account => 
        account.accountClass.toLowerCase() === classFilter
      );
    }

    // Filter by type - Fixed type safety issue
    if (filters.type) {
      const typeFilter = filters.type.toLowerCase();
      result = result.filter(account => 
        account.accountType.toLowerCase() === typeFilter
      );
    }

    // Filter by active status
    if (filters.active) {
      result = result.filter(account => 
        filters.active === 'active' ? account.isActive : !account.isActive
      );
    }

    setFilteredAccounts(result);
  }, [accounts, filters]);

  return (
    <div className="charts-of-accounts">
      <div className="header">
        <Space direction="vertical" size={4} style={{ alignItems: 'flex-start' }}>
          <Space>
            <Button 
              type="text" 
              icon={<IconArrowLeft size={25} />} 
              onClick={() => navigate('/accounting')}
            />
            <Title level={3} style={{ margin: 0 }}>Chart of Accounts</Title>
          </Space>
          <Text type="secondary" style={{ paddingLeft: '41px' }}>
            Organize your finances with a structured chart of accounts. Categorize transactions and track your business performance with ease{' '}
            <Link>Learn More</Link>
          </Text>
        </Space>
        <Button 
          type="primary" 
          className="new-account-btn"
          onClick={() => {
            setDrawerOpen(true);
            setCurrentStep(0);
          }}
          icon={<IconPlus size={20} />}
        >
          New Account
        </Button>
      </div>

      <div className="charts-of-accounts-page-container">
        <div className="search-section">
          <Space size={0}>
            <Input
              placeholder="Search Accounts"
              className="search-input"
              onChange={(e) => handleFilterChange(e.target.value, 'search')}
              value={filters.search}
            />
            <Button
              icon={<IconAdjustmentsHorizontal size={20} />}
              onClick={() => setShowFilters(!showFilters)}
              type={showFilters ? "primary" : "default"}
              style={{ height: 40, width: 40, marginLeft: -8 }}
            />
            
            {showFilters && (
              <>
                <Select
                  placeholder="Class"
                  style={{ width: 250, height: 40, marginLeft: 8 }}
                  options={[
                    { value: 'asset', label: 'Asset' },
                    { value: 'liability', label: 'Liability' },
                    { value: 'equity', label: 'Equity' },
                    { value: 'revenue', label: 'Revenue' },
                    { value: 'expense', label: 'Expense' },
                  ]}
                  onChange={(value) => handleFilterChange(value, 'class')}
                  value={filters.class}
                  allowClear
                />

                <Select
                  placeholder="Type"
                  style={{ width: 250, height: 40, marginLeft: 8 }}
                  onChange={(value) => handleFilterChange(value, 'type')}
                  value={filters.type}
                  allowClear
                  options={[
                    { value: 'bank', label: 'Bank' },
                    { value: 'accounts receivable', label: 'Accounts Receivable' },
                    { value: 'other current assets', label: 'Other Current Assets' },
                    { value: 'fixed assets', label: 'Fixed Assets' },
                    { value: 'other assets', label: 'Other Assets' },
                    { value: 'accounts payable', label: 'Accounts Payable' },
                    { value: 'credit card', label: 'Credit Card' },
                    { value: 'other current liabilities', label: 'Other Current Liabilities' },
                    { value: 'long term liabilities', label: 'Long Term Liabilities' },
                    { value: 'income', label: 'Income' },
                    { value: 'other income', label: 'Other Income' },
                    { value: 'cost of goods sold', label: 'Cost of Goods Sold' },
                    { value: 'equity', label: 'Equity' },
                    { value: 'expense', label: 'Expense' },

                    
                  ]}
                />

                <Select
                  placeholder="Default Account For"
                  style={{ width: 250, height: 40, marginLeft: 8 }}
                  onChange={(value) => handleFilterChange(value, 'defaultAccountFor')}
                  value={filters.defaultAccountFor}
                  allowClear
                />

                <Select
                  placeholder="Active"
                  style={{ width: 250, height: 40, marginLeft: 8 }}
                  options={[
                    { value: 'active', label: 'Active' },
                    { value: 'inactive', label: 'Inactive' },
                  ]}
                  onChange={(value) => handleFilterChange(value, 'active')}
                  value={filters.active}
                  allowClear
                />
              </>
            )}
          </Space>
        </div>

        <Table 
          size="small" 
          columns={columns} 
          dataSource={filteredAccounts}
          rowKey="key"
          expandable={{
            defaultExpandAllRows: true,
            expandRowByClick: false,
            rowExpandable: (record) => Boolean(record.children?.length)
          }}
        />
      </div>

      <Drawer
        title="New Account"
        width={720}
        open={drawerOpen}
        onClose={handleClose}
        destroyOnClose
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button
              style={{ height: 40, width: 100 }}
              onClick={() => {
                if (currentStep === 0) {
                  handleClose();
                } else {
                  setCurrentStep(currentStep - 1);
                }
              }}
              disabled={isSubmitting}
            >
              {currentStep === 0 ? 'Cancel' : 'Previous'}
            </Button>
            <Button 
              type="primary"
              onClick={handleNextStep}
              style={{ height: 40, width: 150 }}
              loading={isSubmitting}
              disabled={isSubmitting || (currentStep === 1 && !isBalanced)}
            >
              {currentStep < getTotalSteps() - 1 ? 'Next' : 'Save Account'}
            </Button>
          </div>
        }
      >
        <NewAccount 
          form={form}
          onClose={handleClose} 
          currentStep={currentStep}
          onStepChange={setCurrentStep}
          companyId={companyId}
          setIsBalanced={setIsBalanced}
        />
      </Drawer>
    </div>
  );
};

export default ChartsOfAccounts;
