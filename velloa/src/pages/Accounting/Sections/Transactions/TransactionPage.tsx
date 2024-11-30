import React, { useEffect, useState } from 'react';
import { Table, Input, Button, Space, Card, Typography, Dropdown, Divider, Skeleton, DatePicker, Select } from 'antd';
import { IconAdjustmentsHorizontal, IconDots, IconRefresh, IconPlugConnected } from '@tabler/icons-react';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import axios from 'axios';

const { Text } = Typography;

interface TransactionsListProps {
  companyId: string;
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

const TransactionPage: React.FC<TransactionsListProps> = ({ companyId }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [connectedAccounts, setConnectedAccounts] = useState<BankAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showFilters, setShowFilters] = useState(false);

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
      for (const doc of querySnapshot.docs) {
        const data = doc.data();
        let bankBalance = 0;

        try {
          const balanceResponse = await axios.post("/get_balance", {
            access_token: data.plaidAccessToken
          });
          
          const plaidAccount = balanceResponse.data.accounts.find(
            (acc: any) => acc.mask === data.mask
          );
          
          if (plaidAccount) {
            bankBalance = plaidAccount.balances.current;
          }

          accounts.push({
            id: doc.id,
            accountName: data.accountName,
            institutionName: data.institutionName,
            mask: data.mask,
            plaidAccessToken: data.plaidAccessToken,
            plaidAccountId: data.plaidAccountId,
            doorLoopBalance: data.doorLoopBalance || 0,
            bankBalance,
            lastUpdated: new Date().toLocaleDateString(),
            unreconciled: data.unreconciled || 0,
            openingBalanceDate: data.openingBalanceDate ? new Date(data.openingBalanceDate.seconds * 1000).toLocaleDateString() : undefined,
          });
        } catch (error) {
          console.error("Error fetching balance:", error);
        }
      }
      
      setConnectedAccounts(accounts);
      setIsLoading(false);
    };

    fetchConnectedAccounts();
  }, [companyId]);

  const fetchTransactions = async (account: BankAccount) => {
    try {
      const response = await axios.post("/get_recurring_transactions", {
        access_token: account.plaidAccessToken,
        account_ids: [account.plaidAccountId]
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
      ].map((stream: TransactionStream & { transaction_type: 'credit' | 'debit' }) => ({
        date: new Date(stream.last_date).toLocaleDateString(),
        description: stream.description,
        amount: stream.average_amount.amount,
        status: stream.status,
        transaction_type: stream.transaction_type
      }));

      setTransactions(allTransactions);
      setSelectedAccount(account);
    } catch (error) {
      console.error("Error fetching transactions:", error);
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
    }
  ];

  const getMenuItems = (account: BankAccount) => [
    {
      key: 'repair',
      icon: <IconPlugConnected size={16} />,
      label: 'Repair Connection',
      onClick: () => handleRepairConnection(account)
    },
    {
      key: 'refresh',
      icon: <IconRefresh size={16} />,
      label: 'Refresh',
      onClick: () => handleRefresh(account)
    }
  ];

  const handleRepairConnection = (account: BankAccount) => {
    // Add your repair connection logic here
    console.log('Repairing connection for account:', account.id);
  };

  const handleRefresh = (account: BankAccount) => {
    // Add your refresh logic here
    console.log('Refreshing account:', account.id);
  };

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'row', gap: '20px', overflowX: 'auto', padding: '4px' }}>
        {isLoading ? (
          // Loading skeleton cards
          [...Array(3)].map((_, index) => (
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
                  <Text strong style={{ fontSize: '15px' }}>{account.institutionName}</Text>
                  <Dropdown menu={{ items: getMenuItems(account) }} trigger={['click']} placement="bottomRight">
                    <Button 
                      type="text" 
                      icon={<IconDots size={20} style={{ transform: 'rotate(90deg)' }} />}
                      style={{ marginTop: '-4px', marginRight: '-8px' }}
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
              options={[
                { value: 'all', label: 'All' },
                { value: 'pending', label: 'Pending' },
                { value: 'completed', label: 'Completed' },
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
        dataSource={transactions}
        rowKey={(record) => `${record.description}-${record.date}`}
      />
    </div>
  );
};

export default TransactionPage;