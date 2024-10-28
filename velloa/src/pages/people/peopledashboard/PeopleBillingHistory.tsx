import React, { useState, useEffect } from 'react';
import { Table, message, Row, Col, Input, Button } from 'antd';
import { SearchOutlined, PlusOutlined } from '@ant-design/icons';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../../firebase-config';
import './PeopleBillingHistory.css';

interface BillingHistoryItem {
  id: string;
  date: string;
  amount: number;
  description: string;
  status: string;
}

interface PeopleBillingHistoryProps {
  personId: string;
  companyId: string;
}

const PeopleBillingHistory: React.FC<PeopleBillingHistoryProps> = ({ personId, companyId }) => {
  const [billingHistory, setBillingHistory] = useState<BillingHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');


  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  const handleAddBilling = () => {
    // Implement the logic to add a new billing entry
    console.log('Add new billing entry');
  };

  const filteredBillingHistory = billingHistory.filter(item =>
    item.description.toLowerCase().includes(searchText.toLowerCase())
  );

  useEffect(() => {
    const fetchBillingHistory = async () => {
      try {
        const billingQuery = query(
          collection(db, 'billing'),
          where('vendorId', '==', personId),
          where('companyId', '==', companyId),
          orderBy('date', 'desc')
        );

        const billingSnapshot = await getDocs(billingQuery);
        const billingData = billingSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as BillingHistoryItem));

        setBillingHistory(billingData);
      } catch (error) {
        console.error('Error fetching billing history:', error);
        message.error('Failed to fetch billing history');
      } finally {
        setLoading(false);
      }
    };

    fetchBillingHistory();
  }, [personId, companyId]);

  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => new Date(date).toLocaleDateString(),
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
      render: (amount: number) => `$${amount.toFixed(2)}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
    },
  ];

  return (
    <div className="billing-history-table">
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={12}>
          <Input
            placeholder="Search by description"
            onChange={e => handleSearch(e.target.value)}
            className="search-input"
          />
        </Col>
        <Col span={12} style={{ textAlign: 'right' }}>
          <Button type="default" icon={<PlusOutlined />} onClick={handleAddBilling} className="new-billing-button">
            New Billing
          </Button>
        </Col>
      </Row>
      <Table
        dataSource={billingHistory}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
};

export default PeopleBillingHistory;
