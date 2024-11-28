import React, { useState, useEffect } from 'react';
import { Typography, Input, Button, Table, Tabs, Tag, Space, Drawer, Form, message, Empty, Modal } from 'antd';
import { IconAdjustmentsHorizontal, IconPlus, IconArrowLeft, IconDots, IconBuildingBank, IconLink } from '@tabler/icons-react';
import './TransactionsPage.css';
import { useNavigate, useLocation } from 'react-router-dom';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import NewAccount from '../ChartsOfAccounts/NewAccount/NewAccount';

const { Title, Text, Link } = Typography;
const { TabPane } = Tabs;

interface Transaction {
  id: string;
  accountName: string;
  doorLoopBalance: number;
  undeposited: number;
  bankAccountName: string;
  bankBalance: number;
  status: 'connected' | 'not_connected';
  accountNumber?: string;
}

interface FirestoreAccount {
  accountName: string;
  doorLoopBalance?: number;
  undeposited?: number;
  bankAccountName?: string;
  bankBalance?: number;
  status?: 'connected' | 'not_connected';
  accountNumber?: string;
}

interface LocationState {
  companyId: string;
}

const fetchBankAccounts = async (companyId: string): Promise<Transaction[]> => {
  const db = getFirestore();
  const accountsRef = collection(db, 'accounting', companyId, 'accounts');
  const q = query(
    accountsRef,
    where('accountClass', '==', 'Asset'),
    where('accountType', '==', 'Bank')
  );

  const querySnapshot = await getDocs(q);
  const accounts: Transaction[] = [];
  
  querySnapshot.forEach((doc) => {
    const data = doc.data() as FirestoreAccount;
    accounts.push({
      id: doc.id,
      accountName: data.accountName || '',
      doorLoopBalance: data.doorLoopBalance || 0,
      undeposited: data.undeposited || 0,
      bankAccountName: data.bankAccountName || '',
      bankBalance: data.bankBalance || 0,
      status: data.status || 'not_connected',
      accountNumber: data.accountNumber
    });
  });

  return accounts;
};

const TransactionsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const companyId = (location.state as LocationState)?.companyId;

  useEffect(() => {
    if (!companyId) {
      console.error('No company ID provided');
      navigate('/accounting', { replace: true });
      return;
    }
  }, [companyId, navigate]);

  const [searchText, setSearchText] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [accounts, setAccounts] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [isNewAccountDrawerOpen, setIsNewAccountDrawerOpen] = useState(false);
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [isBalanced, setIsBalanced] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Transaction | null>(null);
  const [connectBankModal, setConnectBankModal] = useState(false);

  useEffect(() => {
    const loadAccounts = async () => {
      const fetchedAccounts = await fetchBankAccounts(companyId);
      setAccounts(fetchedAccounts);
    };

    loadAccounts();
  }, [companyId]);

  useEffect(() => {
    if (isNewAccountDrawerOpen) {
      form.setFieldsValue({
        type: 'asset_bank',
        accountClass: 'Asset',
        accountType: 'Bank'
      });
    }
  }, [isNewAccountDrawerOpen, form]);

  const handleTransactionClick = (account: Transaction) => {
    if (account.status === 'connected') {
      navigate(`/accounting/transactions/${account.id}`);
    } else {
      setSelectedAccount(account);
      setConnectBankModal(true);
    }
  };

  const handleNewAccount = () => {
    setIsNewAccountDrawerOpen(true);
    form.setFieldsValue({
      type: 'asset_bank',
      accountClass: 'Asset',
      accountType: 'Bank'
    });
  };

  const handleNewAccountSuccess = () => {
    setIsNewAccountDrawerOpen(false);
    form.resetFields();
    fetchBankAccounts(companyId);
  };

  const getTotalSteps = () => {
    const accountType = form.getFieldValue('type');
    
    // For asset accounts, return 4 steps
    if (accountType?.startsWith('asset')) {
      return 4; // Account Info -> Opening Balance -> Lease Options -> Check Printing
    }
    
    // For liability and equity accounts, return 3 steps
    if (accountType?.startsWith('liability') || accountType === 'equity') {
      return 3; // Account Info -> Opening Balance -> Check Printing
    }
    
    // For revenue/expense accounts, return 2 steps
    return 2; // Account Info -> Check Printing
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      const formValues = form.getFieldsValue(true);
      console.log('Raw form values:', formValues);

      // ... rest of submit logic ...
      
      handleNewAccountSuccess();
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      message.error('Failed to create account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsNewAccountDrawerOpen(false);
    setCurrentStep(0);
    form.resetFields();
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
        
        // Check start date and balance for both asset and equity accounts
        if (values.type?.startsWith('asset') || values.type === 'equity') {
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

  const renderConnectBankState = () => (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      padding: '40px 20px' 
    }}>
      <IconBuildingBank size={48} style={{ color: '#168033', marginBottom: 24 }} />
      <Title level={4}>Connect your accounts</Title>
      <Text type="secondary" style={{ textAlign: 'center', marginBottom: 24 }}>
        Connecting your bank allows Velloa to securely pull transactions from
        your bank or credit card accounts to help you with reconciliation.
      </Text>
      <Button 
        type="primary" 
        icon={<IconLink size={20} />}
        onClick={() => {/* Add your bank connection logic here */}}
      >
        Connect account
      </Button>
    </div>
  );

  const columns = [
    {
      title: 'Account Name',
      dataIndex: 'accountName',
      key: 'accountName',
      render: (text: string) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ 
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#D8E6D9',
            borderRadius: '4px',
            marginRight: '12px'
          }}>
            <IconBuildingBank size={24} style={{ color: '#168033' }} />
          </div>
          <Text strong>{text}</Text>
        </div>
      )
    },
    {
      title: 'Velloa Balance',
      dataIndex: 'doorLoopBalance',
      key: 'doorLoopBalance',
      render: (amount: number) => (
        <Text>${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
      )
    },
    {
      title: 'Undeposited Funds',
      dataIndex: 'undeposited',
      key: 'undeposited',
      render: (amount: number) => (
        <Text>${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
      )
    },
    {
      title: 'Bank Account Name',
      dataIndex: 'bankAccountName',
      key: 'bankAccountName',
      render: (text: string, record: Transaction) => (
        <div>
          {record.status === 'connected' ? (
            <>
              <Text>{text}</Text>
              {record.accountNumber && (
                <Text type="secondary" style={{ marginLeft: '8px' }}>({record.accountNumber})</Text>
              )}
              <Tag color="success" style={{ marginLeft: '8px' }}>Connected</Tag>
            </>
          ) : (
            <Text type="secondary">Bank not Connected</Text>
          )}
        </div>
      )
    },
    {
      title: 'Bank Balance',
      dataIndex: 'bankBalance',
      key: 'bankBalance',
      render: (amount: number) => (
        <Text>${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
      )
    },
    {
      title: 'Transactions',
      key: 'actions',
      render: (_: any, record: Transaction) => (
        <Button 
          type="link" 
          style={{ padding: 0 }}
          onClick={() => handleTransactionClick(record)}
        >
          {record.status === 'connected' ? 'View Transactions' : 'Import Transactions'}
        </Button>
      )
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
            <Title level={3} style={{ margin: 0 }}>Transactions</Title>
          </Space>
          <Text type="secondary" style={{ paddingLeft: '41px' }}>
            Match your Velloa records with your bank statements by linking accounts and reconciling transactions with ease{' '}
            <Link>Learn More</Link>
          </Text>
        </Space>
        <Button 
          type="primary" 
          className="new-account-btn"
          icon={<IconPlus size={20} />}
          onClick={handleNewAccount}
        >
          New Account
        </Button>
      </div>

      <div className="charts-of-accounts-page-container">
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          style={{ marginBottom: '16px' }}
        >
          <TabPane tab="Transactions" key="transactions" />
          <TabPane tab="Bank Accounts" key="bankAccounts" />
          <TabPane tab="Reconciliation" key="reconciliation" />
        </Tabs>

        <div className="search-section">
          <Space size={0}>
            <Input
              placeholder="Search Accounts"
              className="search-input"
       
            />
            <Button
              icon={<IconAdjustmentsHorizontal size={20} />}
              onClick={() => setShowFilters(!showFilters)}
              type={showFilters ? "primary" : "default"}
              style={{ height: 40, width: 40, marginLeft: -8 }}
            />

          </Space>
        </div>

        <Table 
          size="small" 
          columns={columns} 
          rowKey="id"
          dataSource={accounts}
        />
      </div>

      <Drawer
        title="New Account"
        placement="right"
        onClose={handleClose}
        open={isNewAccountDrawerOpen}
        width={720}
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
          onClose={handleClose}
          currentStep={currentStep}
          onStepChange={setCurrentStep}
          form={form}
          companyId={companyId}
          setIsBalanced={setIsBalanced}
          onSaveSuccess={handleNewAccountSuccess}
          defaultType="asset_bank"
        />
      </Drawer>

      <Modal
        open={connectBankModal}
        onCancel={() => setConnectBankModal(false)}
        footer={null}
        width={520}
        centered
      >
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          padding: '40px 20px' 
        }}>
          <IconBuildingBank size={48} style={{ color: '#168033', marginBottom: 24 }} />
          <Title level={4}>Connect your accounts</Title>
          <Text type="secondary" style={{ textAlign: 'center', marginBottom: 24 }}>
            Connecting your bank allows Velloa to securely pull transactions from
            your bank or credit card accounts to help you with reconciliation.
          </Text>
          <Button 
            type="primary" 
            icon={<IconLink size={20} />}
            onClick={() => {/* Add your bank connection logic here */}}
            style={{ height: 40 }}
          >
            Connect account
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default TransactionsPage; 