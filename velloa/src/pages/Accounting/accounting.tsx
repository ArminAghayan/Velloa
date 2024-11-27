import React, { useEffect, useState } from 'react';
import { Typography, Row, Col, Card, Flex, Button, Dropdown, Menu } from 'antd';
import {
  IconFileText,
  IconCurrencyDollar,
  IconUser,
  IconClock,
  IconBook,
  IconPrinter,
  IconArrowsExchange,
  IconMoneybag,
  IconReceipt,
  IconCreditCard,
  IconArrowsLeftRight,
  IconClipboardList,
  IconPlus,
} from '@tabler/icons-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import './accounting.css';  // Don't forget to create this CSS file
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase-config';

const { Text, Title } = Typography;

const menuItems = [
  {
    key: 'incomingPayments',
    title: 'Incoming Payments',
    description: 'Manage incoming payments.',
    icon: <IconArrowsExchange />,
  },
  {
    key: 'outgoingPayments',
    title: 'Outgoing Payments',
    description: 'Manage outgoing payments.',
    icon: <IconArrowsExchange />,
  },
  {
    key: 'transactions',
    title: 'Transactions',
    description: 'View and manage transactions.',
    icon: <IconArrowsExchange />,
    path: '/accounting/transactions'
  },
  {
    key: 'chartOfAccounts',
    title: 'Chart of Accounts',
    description: 'View and manage account charts.',
    icon: <IconBook />,
    path: `/accounting/chartofaccounts`
  },
  
  {
    key: 'reconciliation',
    title: 'Reconciliation',
    description: 'Reconcile your accounts.',
    icon: <IconArrowsExchange />,
  },
  {
    key: 'reports',
    title: 'Reports',
    description: 'View and generate reports.',
    icon: <IconFileText />,
  },
  {
    key: 'budgeting',
    title: 'Budgeting',
    description: 'Manage your budgets.',
    icon: <IconBook />,
  },
  {
    key: 'recurringTransactions',
    title: 'Recurring Transactions',
    description: 'Manage recurring transaction payments.',
    icon: <IconClock />,
  },
  {
    key: 'printChecks',
    title: 'Print Checks',
    description: 'Print and manage checks.',
    icon: <IconPrinter />,
  },
  {
    key: 'billsExpenses',
    title: 'Bills & Expenses',
    description: 'Manage bills and expenses.',
    icon: <IconUser />,
  },
  {
    key: 'openBills',
    title: 'Open Bills',
    description: 'View and manage open bills.',
    icon: <IconUser />,
  },
  {
    key: 'unpaidRent',
    title: 'Unpaid Rent',
    description: 'Manage unpaid rent payments.',
    icon: <IconCurrencyDollar />,
  },
  {
    key: 'chargePayments',
    title: 'Charge Payments',
    description: 'Manage charge payments.',
    icon: <IconCurrencyDollar />,
  },
];

const newMenu = (
  <Menu>
    <Menu.ItemGroup title="Tenant Transactions">
      <Menu.Item key="postCharge" icon={<IconMoneybag />}>
        Post Charge
      </Menu.Item>
      <Menu.Item key="receivePayment" icon={<IconCurrencyDollar />}>
        Receive Payment
      </Menu.Item>
      <Menu.Item key="issueCredit" icon={<IconCreditCard />}>
        Issue Credit
      </Menu.Item>
      <Menu.Item key="giveRefund" icon={<IconArrowsExchange />}>
        Give Refund
      </Menu.Item>
      <Menu.Item key="withholdDeposit" icon={<IconReceipt />}>
        Withhold Deposit
      </Menu.Item>
    </Menu.ItemGroup>

    <Menu.Divider />

    <Menu.ItemGroup title="Vendor Transactions">
      <Menu.Item key="createBill" icon={<IconClipboardList />}>
        Create Bill
      </Menu.Item>
      <Menu.Item key="payBills" icon={<IconCurrencyDollar />}>
        Pay Bills
      </Menu.Item>
      <Menu.Item key="addCredit" icon={<IconCreditCard />}>
        Add Credit
      </Menu.Item>
      <Menu.Item key="managementFees" icon={<IconReceipt />}>
        Management Fees
      </Menu.Item>
    </Menu.ItemGroup>

    <Menu.Divider />

    <Menu.ItemGroup title="Owner Transactions">
      <Menu.Item key="ownerContribution" icon={<IconMoneybag />}>
        Owner Contribution
      </Menu.Item>
      <Menu.Item key="ownerDistribution" icon={<IconArrowsExchange />}>
        Owner Distribution
      </Menu.Item>
    </Menu.ItemGroup>

    <Menu.Divider />

    <Menu.ItemGroup title="Other Transactions">
      <Menu.Item key="journalEntry" icon={<IconClipboardList />}>
        Journal Entry
      </Menu.Item>
      <Menu.Item key="bankTransfer" icon={<IconArrowsLeftRight />}>
        Bank Transfer
      </Menu.Item>
      <Menu.Item key="bankDeposit" icon={<IconMoneybag />}>
        Bank Deposit
      </Menu.Item>
      <Menu.Item key="expense" icon={<IconReceipt />}>
        Expense
      </Menu.Item>
      <Menu.Item key="check" icon={<IconCreditCard />}>
        Check
      </Menu.Item>
    </Menu.ItemGroup>
  </Menu>
);

const AccountingPage: React.FC = () => {
  const navigate = useNavigate();
  const [companyId, setCompanyId] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompanyId = async () => {
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setCompanyId(userDoc.data().companyuid);
        }
      }
    };

    fetchCompanyId();
  }, []);

  const revenueData = [
    { name: 'Jan', value: 5000 },
    { name: 'Feb', value: 6200 },
    { name: 'Mar', value: 5800 },
    { name: 'Apr', value: 7000 },
    { name: 'May', value: 6500 },
    { name: 'Jun', value: 7500 },
  ];

  const costsData = [
    { name: 'Jan', value: 3000 },
    { name: 'Feb', value: 3500 },
    { name: 'Mar', value: 3200 },
    { name: 'Apr', value: 4000 },
    { name: 'May', value: 3800 },
    { name: 'Jun', value: 4200 },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="label">{`${label}`}</p>
          <p className="value">{`$${payload[0].value.toLocaleString()}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="accounting-container" style={{ padding: '24px' }}>
      <div className="accounting-content">
        {/* Header Row */}
        <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
          <Col>
            <Title level={1} style={{ margin: 0 }}>Accounting</Title>
          </Col>
          <Col>
            <Dropdown overlay={newMenu} trigger={['click']}>
              <Button 
                type="primary" 
                icon={<IconPlus size={20} />} 
                style={{ width: '40px', fontSize: '16px', height: '40px' }}
              >   
              </Button>
            </Dropdown>
          </Col>
        </Row>

        {/* Charts Row */}
        <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
          <Col span={12}>
            <div className="chart-container">
              <Typography.Text strong className="chart-title">Revenue</Typography.Text>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={revenueData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      tickFormatter={(value) => `$${value.toLocaleString()}`}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar 
                      dataKey="value" 
                      fill="#28A745"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Col>
          <Col span={12}>
            <div className="chart-container">
              <Typography.Text strong className="chart-title">Costs</Typography.Text>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={costsData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      tickFormatter={(value) => `$${value.toLocaleString()}`}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar 
                      dataKey="value" 
                      fill="#DC3545"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Col>
        </Row>

        {/* Action Items Grid */}
        <Row gutter={[24,0]} className="settings-row">
          {menuItems.map((item) => (
            <Col 
              xs={24}
              sm={12}
              md={8}
              lg={6}
              xl={6}
              key={item.key}
            >
              <Card
                hoverable
                className="settings-card"
                onClick={() => {
                  if (item.path && companyId) {
                    navigate(item.path, { 
                      state: { companyId },
                      replace: true
                    });
                  } else if (item.key === 'transactions' && companyId) {
                    navigate('/accounting/transactions', {
                      state: { companyId },
                      replace: true
                    });
                  } else if (!companyId) {
                    console.error('No company ID available');
                  }
                }}
                bodyStyle={{ padding: '24px' }}
              >
                <Flex className="settings-card-content">
                  <div className="settings-card-left">
                    <div className="settings-card-icon">
                      {item.icon}
                    </div>
                  </div>
                  <Flex vertical gap={8} className="settings-card-right">
                    <Text strong className="settings-card-title">{item.title}</Text>
                    <Text type="secondary" className="settings-card-description">
                      {item.description}
                    </Text>
                  </Flex>
                </Flex>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  );
};

export default AccountingPage;
