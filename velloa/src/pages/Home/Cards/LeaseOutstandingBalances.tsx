import React from 'react';
import { Card, Button, Typography, List, Dropdown } from 'antd';
import { MoreOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { CardProps, getCardMenuItems } from './CardProps';

const { Text } = Typography;

interface LeaseBalance {
  tenant: string;
  address: string;
  amount: number;
}

const LeaseOutstandingBalances: React.FC<CardProps> = ({ onCustomize, onDelete }) => {
  const balances: LeaseBalance[] = [
    {
      tenant: 'Bruce Rocks',
      address: 'Muteesa 1 Road - Room 1',
      amount: 4505000.00
    },
    {
      tenant: 'Joanna Rocks',
      address: '705 Uribia Lane - Unit 2',
      amount: 322260.00
    }
  ];

  const menuItems = getCardMenuItems(onCustomize, onDelete);

  return (
    <Card 
      title="Leases With Outstanding Balances" 
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
      bodyStyle={{ 
        padding: '0 24px',
        height: 'calc(424px - 57px)',
        overflowY: 'auto'
      }}
    >
      <List
        dataSource={balances}
        renderItem={item => (
          <List.Item
            style={{ 
              padding: '16px 0',
              borderBottom: '1px solid #f0f0f0'
            }}
            extra={
              <Text style={{ 
                color: '#ff4d4f',
                fontSize: '14px',
                fontWeight: 500
              }}>
                ${item.amount.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </Text>
            }
          >
            <List.Item.Meta
              avatar={
                <ExclamationCircleOutlined style={{ 
                  fontSize: '24px',
                  color: '#8c8c8c',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '50%',
                  padding: '8px'
                }} />
              }
              title={item.tenant}
              description={
                <Text type="secondary" style={{ fontSize: '14px' }}>
                  {item.address}
                </Text>
              }
            />
          </List.Item>
        )}
      />
    </Card>
  );
};

export default LeaseOutstandingBalances; 