import React, { useState, useEffect } from 'react';
import { Typography, Input, Button, Table, Tabs, Tag, Space, Drawer, Form, message, Modal } from 'antd';
import { IconAdjustmentsHorizontal, IconPlus, IconArrowLeft, IconDots, IconBuildingBank, IconLink } from '@tabler/icons-react';
import './OverviewPage.css';
import { useNavigate, useLocation } from 'react-router-dom';
import { getFirestore, collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import NewAccount from '../ChartsOfAccounts/NewAccount/NewAccount';
import axios from 'axios';
import { usePlaidLink } from 'react-plaid-link';
import TransactionPage from './TransactionPage';
import ReconciliationPage from './ReconciliationPage';
import { LoadingOutlined } from '@ant-design/icons';


axios.defaults.baseURL = "http://localhost:8000";


function PlaidAuth({ publicToken, onSuccess, companyId, selectedAccount }: { publicToken: string, onSuccess: () => void, companyId: string, selectedAccount: Transaction }) {
  useEffect(() => {
    async function fetchData() {
      try {
        // Get access token
        const tokenResponse = await axios.post("/exchange_public_token", {
          public_token: publicToken
        });
        const access_token = tokenResponse.data.accessToken;
        
        // Get auth data
        const authResponse = await axios.post("/auth", {
          access_token: access_token
        });
        
        const { accounts, item } = authResponse.data;
        const plaidAccount = accounts[0];

        // Save to Firebase
        const db = getFirestore();
        const accountData = {
          plaidAccessToken: access_token,
          institutionName: item.institution_name,
          mask: plaidAccount.mask,
          plaidAccountId: plaidAccount.account_id,
          status: 'connected'
        };

        console.log('Saving to Firebase:', accountData);
        
        await updateDoc(
          doc(db, 'accounting', companyId, 'accounts', selectedAccount.id),
          accountData
        );

        console.log('Successfully saved to Firebase');
        onSuccess();
      } catch (error) {
        console.error("Error connecting bank:", error);
        message.error("Failed to connect bank account");
      }
    }
    fetchData();
  }, [publicToken, companyId, selectedAccount, onSuccess]);

  return null;
}

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
  institutionName?: string;
  mask?: string;
}

interface FirestoreAccount {
  accountName: string;
  doorLoopBalance?: number;
  undeposited?: number;
  bankAccountName?: string;
  bankBalance?: number;
  status?: 'connected' | 'not_connected';
  accountNumber?: string;
  institutionName?: string;
  mask?: string;
  plaidAccessToken?: string;
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
  
  for (const doc of querySnapshot.docs) {
    const data = doc.data() as FirestoreAccount;
    
    let bankBalance = 0;
    if (data.status === 'connected' && data.plaidAccessToken) {
      try {
        console.log('Fetching balance for account:', doc.id);
        
        const balanceResponse = await axios.post("/get_balance", {
          access_token: data.plaidAccessToken
        });
        
        // Get the matching account from Plaid response
        const plaidAccount = balanceResponse.data.accounts.find(
          (acc: any) => acc.mask === data.mask
        );
        
        if (plaidAccount) {
          bankBalance = plaidAccount.balances.current;
          console.log('Current bank balance:', bankBalance);
        }
      } catch (error) {
        console.error("Error fetching balance for account:", doc.id, error);
      }
    }

    accounts.push({
      id: doc.id,
      accountName: data.accountName || '',
      doorLoopBalance: data.doorLoopBalance || 0,
      undeposited: data.undeposited || 0,
      bankAccountName: data.bankAccountName || '',
      
      bankBalance,
      status: data.status || 'not_connected',
      accountNumber: data.accountNumber,
      institutionName: data.institutionName,
      mask: data.mask
    });
  }

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

  const [showFilters, setShowFilters] = useState(false);
  const [accounts, setAccounts] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [isNewAccountDrawerOpen, setIsNewAccountDrawerOpen] = useState(false);
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [isBalanced, setIsBalanced] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Transaction | null>(null);
  const [connectBankModal, setConnectBankModal] = useState(false);
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [publicToken, setPublicToken] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  





  useEffect(() => {
    async function fetch() {
      try {
        const response = await axios.post("/create_link_token");
        setLinkToken(response.data.link_token);
      } catch (error) {
        console.error('Error creating link token:', error);
        message.error('Failed to initialize bank connection');
      }
    }
    fetch();
  }, []);



  const { open, ready } = usePlaidLink({
    token: linkToken!,
    onSuccess: (public_token, metadata) => {
      setPublicToken(public_token);
      // The actual bank connection will be handled by PlaidAuth component
    },
    onExit: (err, metadata) => {
      console.log('Link exit:', err, metadata);
      setConnectBankModal(false);
      if (err) message.error('Error connecting bank account');
    },
  });

  useEffect(() => {
    const loadAccounts = async () => {
      if (!companyId) return;
      
      setIsRefreshing(true);
      try {
        const fetchedAccounts = await fetchBankAccounts(companyId);
        setAccounts(fetchedAccounts);
      } catch (error) {
        console.error('Error loading accounts:', error);
        message.error('Failed to load accounts');
      } finally {
        setIsRefreshing(false);
      }
    };

    loadAccounts();
    
    // Set up an interval to refresh every 5 minutes
    const intervalId = setInterval(loadAccounts, 5 * 60 * 1000);

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
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
      setActiveTab('transactions');
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
              <Text>{record.institutionName}</Text>
              {record.mask && (
                <Text type="secondary" style={{ marginLeft: '8px' }}>({record.mask})</Text>
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
      render: (amount: number, record: Transaction) => (
        <div>
          {record.status === 'connected' ? (
            <Text>${amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
          ) : (
            <Text type="secondary">--</Text>
          )}
        </div>
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

  const handleBankConnected = async () => {
    setConnectBankModal(false);
    setPublicToken(null); // Reset the public token
    setSelectedAccount(null); // Reset the selected account
    
    // Refresh the accounts list
    try {
      const fetchedAccounts = await fetchBankAccounts(companyId);
      setAccounts(fetchedAccounts);
    } catch (error) {
      console.error('Error refreshing accounts:', error);
      message.error('Failed to refresh accounts');
    }
  };

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
          <TabPane tab="Overview" key="overview" />
          <TabPane tab="Transactions" key="transactions" />
          <TabPane tab="Reconciliation" key="reconciliation" />
        </Tabs>

        {activeTab === 'overview' && (
          <>
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
              loading={{
                spinning: isRefreshing,
                indicator: <LoadingOutlined style={{ fontSize: 24 }} spin />
              }}
            />
          </>
        )}

        {activeTab === 'transactions' && (
          <TransactionPage companyId={companyId} />
        )}
        
        {activeTab === 'reconciliation' && (
          <ReconciliationPage companyId={companyId} />
        )}
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

      {publicToken && selectedAccount && (
        <PlaidAuth 
          publicToken={publicToken} 
          onSuccess={handleBankConnected}
          companyId={companyId}
          selectedAccount={selectedAccount}
        />
      )}

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
          <IconBuildingBank size={100} style={{ color: '#168033', marginBottom: 24 }} />
          <Title level={4}>Connect your accounts</Title>
          <Text type="secondary" style={{ textAlign: 'center', marginBottom: 24 }}>
            Connecting your bank allows Velloa to securely pull transactions from
            your bank or credit card accounts to help you with reconciliation.
          </Text>
          <Button 
            type="primary" 
            icon={<IconLink size={20} />}
            onClick={() => open()} 
            disabled={!ready}
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