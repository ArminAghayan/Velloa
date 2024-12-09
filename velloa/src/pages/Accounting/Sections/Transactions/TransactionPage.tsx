import React, { useEffect, useState } from 'react';
import { Table, Input, Button, Space, Card, Typography, Dropdown, Divider, Skeleton, DatePicker, Select, Modal, Form, message } from 'antd';
import { IconAdjustmentsHorizontal, IconDots, IconRefresh, IconPlugConnected, IconBan } from '@tabler/icons-react';
import { getFirestore, collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import axios from 'axios';
import TransactionReviewPage from './TransactionReviewPage';
import { LoadingOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface TransactionsListProps {
  companyId: string;
  selectedAccountId?: string | null;
}

interface BankAccount {
  id: string;
  accountName: string;
  institutionName: string;
  mask: string;
  plaidAccessToken: string;
  plaidAccountId: string;
  doorLoopBalance: number;
  bankBalance: number;
  lastUpdated?: string;
  unreconciled?: number;
  openingBalanceDate?: string;
  isLoadingBalances?: boolean;
}

interface Transaction {
  date: string;
  description: string;
  amount: number;
  status: string;
  transaction_type: 'credit' | 'debit';
}

interface TransactionStream {
  last_date: string;
  description: string;
  average_amount: {
    amount: number;
  };
  status: string;
  transaction_type?: 'credit' | 'debit';
}

const TransactionPage: React.FC<TransactionsListProps> = ({ companyId, selectedAccountId }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [connectedAccounts, setConnectedAccounts] = useState<BankAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [isReviewModalVisible, setIsReviewModalVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [form] = Form.useForm();
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);

  useEffect(() => {
    const fetchConnectedAccounts = async () => {
      setIsLoading(true);
      const db = getFirestore();
      const accountsRef = collection(db, 'accounting', companyId, 'accounts');
      const q = query(
        accountsRef,
        where('status', '==', 'connected')
      );

      const querySnapshot = await getDocs(q);
      const accounts = [];
      
      // Fetch all accounts data including balances
      for (const docSnapshot of querySnapshot.docs) {
        const data = docSnapshot.data();
        let bankBalance = data.lastBankBalance || 0;
        const now = Date.now();
        const threeDaysMs = 72 * 60 * 60 * 1000;

        try {
          // Only fetch new balance if more than 72 hours have passed
          if (!data.lastBalanceUpdate || (now - data.lastBalanceUpdate) > threeDaysMs) {
            console.log('Fetching fresh balance for account:', docSnapshot.id);
            
            const balanceResponse = await axios.post("/get_balance", {
              access_token: data.plaidAccessToken
            });
            
            const plaidAccount = balanceResponse.data.accounts.find(
              (acc: any) => acc.mask === data.mask
            );
            
            if (plaidAccount) {
              bankBalance = plaidAccount.balances.current;
              
              // Update Firebase with new balance and timestamp
              await updateDoc(doc(db, 'accounting', companyId, 'accounts', docSnapshot.id), {
                lastBankBalance: bankBalance,
                lastBalanceUpdate: now
              });
              
              console.log('Updated bank balance:', bankBalance);
            }
          } else {
            console.log('Using cached balance for account:', docSnapshot.id);
          }

          accounts.push({
            id: docSnapshot.id,
            accountName: data.accountName,
            institutionName: data.institutionName,
            mask: data.mask,
            plaidAccessToken: data.plaidAccessToken,
            plaidAccountId: data.plaidAccountId,
            doorLoopBalance: data.doorLoopBalance || 0,
            bankBalance,
            lastUpdated: data.lastBalanceUpdate ? new Date(data.lastBalanceUpdate).toLocaleDateString() : undefined,
            unreconciled: data.unreconciled || 0,
            openingBalanceDate: data.openingBalanceDate ? new Date(data.openingBalanceDate.seconds * 1000).toLocaleDateString() : undefined,
          });
        } catch (error) {
          console.error("Error fetching balance:", error);
        }
      }
      
      setConnectedAccounts(accounts);
      setIsLoading(false);

      // If we have a selectedAccountId, find and fetch that account's transactions
      if (selectedAccountId) {
        const selectedAccount = accounts.find(acc => acc.id === selectedAccountId);
        if (selectedAccount) {
          fetchTransactions(selectedAccount);
        }
      }
      // Otherwise, fetch the first account's transactions
      else if (accounts.length > 0) {
        fetchTransactions(accounts[0]);
      }
    };

    fetchConnectedAccounts();
  }, [companyId, selectedAccountId]);

  const fetchTransactions = async (account: BankAccount) => {
    setIsLoadingTransactions(true);
    try {
      // Convert opening balance date to required format if it exists
      const startDate = account.openingBalanceDate 
        ? new Date(account.openingBalanceDate).toISOString().split('T')[0]
        : undefined;

      const response = await axios.post("/get_recurring_transactions", {
        access_token: account.plaidAccessToken,
        account_ids: [account.plaidAccountId],
        options: {
          start_date: startDate, // Use opening balance date as start date
          end_date: new Date().toISOString().split('T')[0], // Today's date
          count: 500
        }
      });

      const allTransactions = [
        ...(response.data.inflowStreams?.map((stream: TransactionStream) => ({
          ...stream,
          transaction_type: stream.transaction_type || 'credit'
        })) || []),
        ...(response.data.outflowStreams?.map((stream: TransactionStream) => ({
          ...stream,
          transaction_type: stream.transaction_type || 'debit'
        })) || [])
      ]
      .map((stream: TransactionStream & { transaction_type: 'credit' | 'debit' }) => ({
        date: new Date(stream.last_date).toLocaleDateString(),
        description: stream.description,
        amount: stream.average_amount.amount,
        status: stream.status,
        transaction_type: stream.transaction_type
      }))
      // Filter out transactions before opening balance date
      .filter(transaction => {
        if (!account.openingBalanceDate) return true;
        return new Date(transaction.date) >= new Date(account.openingBalanceDate);
      });

      setTransactions(allTransactions);
      setSelectedAccount(account);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 110,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number, record: Transaction) => {
        console.log('Transaction type from Plaid:', record.transaction_type);
        const displayAmount = Math.abs(amount).toLocaleString(undefined, { 
          minimumFractionDigits: 2,
          maximumFractionDigits: 2 
        });
        
        return (
          <Text style={{ color: record.transaction_type === 'credit' ? '#52c41a' : '#ff4d4f' }}>
            {record.transaction_type === 'credit' ? '+' : '-'}${displayAmount}
          </Text>
        );
      }
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Text>
          {status === 'FOUND_IN_FIREBASE' ? 'Auto-Matched' : 'Needs Review'}
        </Text>
      )
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: Transaction) => (
        <Button 
          type="primary" 
          size="small"
          onClick={() => handleTransactionAction(record)}
        >
          {record.status === 'FOUND_IN_FIREBASE' ? 'Confirm' : 'Review'}
        </Button>
      )
    }
  ];

  const handleRepairConnection = (account: BankAccount) => {
    // Add your repair connection logic here
    console.log('Repairing connection for account:', account.id);
  };

  const handleRefresh = async (account: BankAccount) => {
    try {
      // Set loading state for this specific account
      const updatedAccounts = connectedAccounts.map(acc => 
        acc.id === account.id ? { ...acc, isLoadingBalances: true } : acc
      );
      setConnectedAccounts(updatedAccounts);

      // Fetch fresh balance from Plaid
      const balanceResponse = await axios.post("/get_balance", {
        access_token: account.plaidAccessToken
      });
      
      const plaidAccount = balanceResponse.data.accounts.find(
        (acc: any) => acc.mask === account.mask
      );
      
      if (plaidAccount) {
        const bankBalance = plaidAccount.balances.current;
        const now = Date.now();
        
        // Update Firebase with new balance and timestamp
        const db = getFirestore();
        await updateDoc(
          doc(db, 'accounting', companyId, 'accounts', account.id),
          {
            lastBankBalance: bankBalance,
            lastBalanceUpdate: now
          }
        );

        // Update local state
        const refreshedAccounts = connectedAccounts.map(acc => 
          acc.id === account.id ? {
            ...acc,
            bankBalance,
            lastUpdated: new Date(now).toLocaleDateString(),
            isLoadingBalances: false
          } : acc
        );
        setConnectedAccounts(refreshedAccounts);

        // Refresh transactions for this account
        await fetchTransactions(account);

        message.success('Account refreshed successfully');
      }
    } catch (error) {
      console.error("Error refreshing account:", error);
      message.error('Failed to refresh account');
      
      // Reset loading state on error
      const resetAccounts = connectedAccounts.map(acc => 
        acc.id === account.id ? { ...acc, isLoadingBalances: false } : acc
      );
      setConnectedAccounts(resetAccounts);
    }
  };

  const getMenuItems = (account: BankAccount) => [
    {
      key: 'repair',
      icon: <IconPlugConnected size={16} />,
      label: 'Repair Connection',
      onClick: (e: any) => {
        e.stopPropagation(); // Prevent card selection
        handleRepairConnection(account);
      }
    },
    {
      key: 'refresh',
      icon: <IconRefresh size={16} />,
      label: 'Refresh',
      onClick: (e: any) => {
        e.stopPropagation(); // Prevent card selection
        handleRefresh(account);
      }
    }
  ];

  const handleTransactionAction = (transaction: Transaction) => {
    if (transaction.status === 'FOUND_IN_FIREBASE') {
      // Handle confirmation
      console.log('Confirming transaction:', transaction);
    } else {
      // Reset everything first
      setIsReviewModalVisible(false);
      setSelectedTransaction(null);
      form.resetFields();
      
      // Then set new values after a brief delay
      setTimeout(() => {
        setSelectedTransaction(transaction);
        setIsReviewModalVisible(true);
      }, 100);
    }
  };

  useEffect(() => {
    if (isReviewModalVisible && selectedTransaction) {
      form.setFieldsValue({
        description: selectedTransaction.description,
        amount: selectedTransaction.amount
      });
    }
  }, [isReviewModalVisible, selectedTransaction]);

  return (
    <div>
      <div 
        style={{ 
          display: 'flex', 
          flexDirection: 'row', 
          gap: '20px', 
          overflowX: 'auto', 
          padding: '4px',
          scrollBehavior: 'smooth', // Add smooth scrolling
          msOverflowStyle: 'none',  // Hide scrollbar in IE/Edge
          scrollbarWidth: 'none',   // Hide scrollbar in Firefox
          WebkitOverflowScrolling: 'touch', // Smooth scrolling on iOS
        }}
        className="hide-scrollbar" // We'll add CSS for this
      >
        {isLoading ? (
          // Loading skeleton cards
          [...Array(5)].map((_, index) => (
            <Card 
              key={`skeleton-${index}`}
              style={{ 
                minWidth: '350px',
                maxWidth: '400px',
                borderRadius: '8px',
                flex: '0 0 auto'
              }}
              bodyStyle={{ padding: '12px' }}
            >
              <Skeleton active paragraph={{ rows: 6 }} />
            </Card>
          ))
        ) : (
          // Actual account cards
          connectedAccounts.map((account) => (
            <Card 
              key={account.id}
              onClick={() => fetchTransactions(account)}
              style={{ 
                minWidth: '350px',
                maxWidth: '400px',
                borderRadius: '8px',
                border: selectedAccount?.id === account.id ? '1px solid #4CAF50' : '1px solid #e8e8e8',
                cursor: 'pointer',
                flex: '0 0 auto'
              }}
              bodyStyle={{ padding: '12px' }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Text strong style={{ fontSize: '15px' }}>{account.accountName}</Text>
                  <Dropdown 
                    menu={{ items: getMenuItems(account) }} 
                    trigger={['click']} 
                    placement="bottomRight"
                  >
                    <Button 
                      type="text" 
                      icon={<IconDots size={20} style={{ transform: 'rotate(90deg)' }} />}
                      style={{ marginTop: '-4px', marginRight: '-8px' }}
                      onClick={(e) => e.stopPropagation()} // Prevent card selection when clicking the button
                    />
                  </Dropdown>
                </div>
                <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                  {`${account.institutionName} **** ${account.mask}`}
                </Text>
                <Text type="secondary" style={{ fontSize: '11px' }}>
                  {account.isLoadingBalances ? <Skeleton.Input style={{ width: 120 }} size="small" active /> : `Last Updated: ${account.lastUpdated}`}
                </Text>
              </div>

              <div style={{ marginTop: '12px' }}>
                <Divider style={{ margin: '12px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text>Unreconciled Transactions</Text>
                  {account.isLoadingBalances 
                    ? <Skeleton.Input style={{ width: 60 }} size="small" active />
                    : <Text strong>{account.unreconciled}</Text>
                  }
                </div>
                <Divider style={{ margin: '12px 0' }} />
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <Text>Opening Balance</Text>
                  <Text>{account.openingBalanceDate || 'Not set'}</Text>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <Text>Velloa Balance</Text>
                  {account.isLoadingBalances 
                    ? <Skeleton.Input style={{ width: 80 }} size="small" active />
                    : <Text>${account.doorLoopBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
                  }
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text>Bank Balance</Text>
                  {account.isLoadingBalances 
                    ? <Skeleton.Input style={{ width: 80 }} size="small" active />
                    : <Text>${account.bankBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
                  }
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <div className="search-section" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Space size={0}>
          <Input
            placeholder="Search Transactions"
            className="search-input"
          />
          <Button
            icon={<IconAdjustmentsHorizontal size={20} />}
            style={{ height: 40, width: 40, marginLeft: -8 }}
            onClick={() => setShowFilters(!showFilters)}
          />
        </Space>
        
        {showFilters && (
          <Space size={8}>
            <Select
              placeholder="Status"
              style={{ width: 200, height: 40 }}
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: 'pending', label: 'Pending' },
                { value: 'completed', label: 'Completed' },
                { value: 'excluded', label: 'Excluded' },
              ]}
            />
            <DatePicker.RangePicker 
              style={{ width: 240, height: 40 }}
              placeholder={['Start Date', 'End Date']}
            />
          </Space>
        )}
      </div>

      <Table 
        size="small"
        columns={columns}
        dataSource={transactions.filter(transaction => {
          if (statusFilter === 'pending') {
            return transaction.status !== 'FOUND_IN_FIREBASE';
          } else if (statusFilter === 'completed') {
            return transaction.status === 'FOUND_IN_FIREBASE';
          } else if (statusFilter === 'excluded') {
            return transaction.status === 'EXCLUDED';
          }
          return true;
        })}
        rowKey={(record) => `${record.description}-${record.date}`}
        loading={{
          spinning: isLoadingTransactions,
          indicator: <LoadingOutlined style={{ fontSize: 24 }} spin />
        }}
      />

      <Modal
        visible={isReviewModalVisible}
        onCancel={() => {
          setIsReviewModalVisible(false);
          setSelectedTransaction(null);
        }}
        width={1200}
        closable={false}
        bodyStyle={{ padding: 0, maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <Button
              icon={<IconBan size={18} />}
              style={{ height: 40, width: 150}}
            >
              Exclude
            </Button>
            <Button 
              style={{ height: 40, width: 150}}
              onClick={() => {
                setIsReviewModalVisible(false);
                setSelectedTransaction(null);
              }}>
              Close
            </Button>
            <Button 
              type="primary" 
              style={{ height: 40, width: 150}}
              onClick={() => {
                form.validateFields().then(() => {
                  form.submit();
                  setIsReviewModalVisible(false);
                  setSelectedTransaction(null);
                });
              }}
            >
              Save
            </Button>
          </div>
        }
      >
        <TransactionReviewPage 
          transaction={selectedTransaction}
          onClose={() => {
            setIsReviewModalVisible(false);
            setSelectedTransaction(null);
          }}
          form={form}
          isModalVisible={isReviewModalVisible}
        />
      </Modal>
    </div>
  );
};

export default TransactionPage;