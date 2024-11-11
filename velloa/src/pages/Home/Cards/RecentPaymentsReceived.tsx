import React from 'react';
import { Card, Button, List, Avatar, Typography, Space, Dropdown } from 'antd';
import { MoreOutlined, UserOutlined } from '@ant-design/icons';
import { CardProps, getCardMenuItems } from './CardProps';

const { Text } = Typography;

interface Payment {
  id: string;
  title: string;
  address: string;
  amount: number;
  daysAgo: number;
}

const RecentPaymentsReceived: React.FC<CardProps> = ({ onCustomize, onDelete }) => {
  const payments: Payment[] = [
    {
      id: '1',
      title: '(Contra Account) Leslie Knope',
      address: '1900 North Bayshore Drive (Contra Account) - 1900',
      amount: 2000.00,
      daysAgo: 3
    },
    {
      id: '2',
      title: '(Late Fee) Scrooge McDuck',
      address: '3336 Virginia Street (Late Fee) - 3336',
      amount: 2435.00,
      daysAgo: 5
    },
    {
      id: '3',
      title: '(Multiple Tenants) Bart Simpson, Homer Simpson, Lisa Simpson & Marge Simpson',
      address: '742 Evergreen Terrace (Multiple tenants on one lease) - House',
      amount: 2110.00,
      daysAgo: 5
    }
  ];

  const menuItems = getCardMenuItems(onCustomize, onDelete);

  return (
    <Card 
      title="Recent Payments Received" 
      extra={
        <Dropdown 
          menu={{ items: menuItems }} 
          trigger={['click']} 
          placement="bottomRight"
        >
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      }
      style={{ height: '424px' }}
      bodyStyle={{ padding: '0 24px', height: 'calc(424px - 57px)', overflowY: 'auto' }}
    >
      <List
        itemLayout="horizontal"
        dataSource={payments}
        renderItem={item => (
          <List.Item
            style={{ padding: '16px 0' }}
            extra={
              <Text style={{ color: '#52c41a', fontSize: '16px', fontWeight: 500 }}>
                ${item.amount.toFixed(2)}
              </Text>
            }
          >
            <List.Item.Meta
              avatar={
                <Avatar 
                  icon={<UserOutlined />} 
                  style={{ 
                    backgroundColor: '#f5f5f5',
                    color: '#666'
                  }} 
                />
              }
              title={item.title}
              description={
                <Space direction="vertical" size={0}>
                  <Text type="secondary">{item.daysAgo} days ago</Text>
                  <Text type="secondary" style={{ fontSize: '12px' }}>{item.address}</Text>
                </Space>
              }
            />
          </List.Item>
        )}
      />
    </Card>
  );
};

export default RecentPaymentsReceived; 