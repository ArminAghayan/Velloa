import React, { useState, useEffect } from 'react';
import { Table,Tag, Typography, DatePicker, Input } from 'antd';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../../firebase-config';
import dayjs from 'dayjs';

const { Text } = Typography;
const { RangePicker } = DatePicker;

interface PeopleTransactionsProps {
  personId: string;
  companyId: string;
}

interface Transaction {
  key: string;
  date: string;
  type: 'contribution' | 'distribution';
  amount: number;
  property: string;
  status: string;
  description: string;
}

const PeopleTransactions: React.FC<PeopleTransactionsProps> = ({ personId, companyId }) => {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [searchText, setSearchText] = useState(''); // Add this line

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        // Add your Firebase query here to fetch transactions for this owner
        // This is a placeholder structure
        const transactionsRef = collection(db, 'transactions');
        const q = query(
          transactionsRef, 
          where('ownerId', '==', personId),
          orderBy('date', 'desc')
        );
        const querySnapshot = await getDocs(q);
        
        const transactionsData: Transaction[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          transactionsData.push({
            key: doc.id,
            date: data.date,
            type: data.type,
            amount: data.amount,
            property: data.property,
            status: data.status,
            description: data.description,
          });
        });

        setTransactions(transactionsData);
      } catch (error) {
        console.error('Error fetching transactions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [personId, companyId, dateRange]);

  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => dayjs(date).format('MM/DD/YYYY'),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={type === 'contribution' ? 'blue' : 'green'}>
          {type.charAt(0).toUpperCase() + type.slice(1)}
        </Tag>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => (
        <Text strong>
          ${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </Text>
      ),
    },
    {
      title: 'Property',
      dataIndex: 'property',
      key: 'property',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'Completed' ? 'green' : 'orange'}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
  ];

  return (
    <div className="property-page-container">
      <div className="search-and-add">
        <Input
          placeholder="Search transaction"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="search-input"
        />
        <RangePicker style={{ height: '40px' }} 
          onChange={(dates) => {
            setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs]);
          }}
        />
      </div>
      <Table 
        columns={columns} 
        dataSource={transactions} 
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
};

export default PeopleTransactions;