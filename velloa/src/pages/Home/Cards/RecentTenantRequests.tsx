import React from 'react';
import { Card, Button, Typography, List, Tag, Dropdown } from 'antd';
import { MoreOutlined, FileOutlined } from '@ant-design/icons';
import { CardProps, getCardMenuItems } from './CardProps';
import { 
  IconClockPause, 
  IconPlayerPlay, 
  IconAlertCircle, 
  IconCircleCheck 
} from '@tabler/icons-react';

interface TenantRequest {
  title: string;
  location: string;
  status: string;
  daysAgo: number;
}

const RecentTenantRequests: React.FC<CardProps> = ({ onCustomize, onDelete }) => {
  const recentTenantRequests: TenantRequest[] = [
    { 
      title: 'AC #2', 
      location: '705 Uribia Lane - 27', 
      status: 'Overdue', 
      daysAgo: 2 
    },
    { 
      title: 'AC Repair', 
      location: '705 Uribia Lane - 27', 
      status: 'Overdue', 
      daysAgo: 2 
    },
    { 
      title: 'test', 
      location: 'Sderot Bat Galim - 10', 
      status: 'Not Started', 
      daysAgo: 8 
    },
    { 
      title: 'test', 
      location: 'Sderot Bat Galim - 10', 
      status: 'Not Started', 
      daysAgo: 8 
    },
    { 
      title: 'test', 
      location: 'Sderot Bat Galim - 10', 
      status: 'Not Started', 
      daysAgo: 8 
    },
  ];

  const menuItems = getCardMenuItems(onCustomize, onDelete);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Not Started':
        return <IconClockPause size={16} style={{ marginRight: 4 }} />;
      case 'In Progress':
        return <IconPlayerPlay size={16} style={{ marginRight: 4 }} />;
      case 'Overdue':
        return <IconAlertCircle size={16} style={{ marginRight: 4 }} />;
      case 'Finished':
        return <IconCircleCheck size={16} style={{ marginRight: 4 }} />;
      default:
        return null;
    }
  };

  return (
    <Card 
      title="Recent Tenant Requests" 
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
        dataSource={recentTenantRequests}
        renderItem={item => (
          <List.Item 
            style={{ 
              padding: '16px 0',
              borderBottom: '1px solid #f0f0f0'
            }}
          >
            <List.Item.Meta
              avatar={
                <div style={{ 
                  background: '#D8E6D9', 
                  padding: '8px', 
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '48px',
                  height: '48px'
                }}>
                  <FileOutlined style={{ fontSize: '24px', color: '#168033' }} />
                </div>
              }
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography.Text strong>{item.title}</Typography.Text>
                  <Tag 
                    style={{ 
                      margin: 0,
                      display: 'flex',
                      alignItems: 'center',
                      ...(item.status === 'Overdue' && {
                        background: '#fff1f0',
                        color: '#ff4d4f'
                      }),
                      ...(item.status === 'Not Started' && {
                        background: '#f5f5f5',
                        color: '#8c8c8c'
                      }),
                      ...(item.status === 'In Progress' && {
                        background: '#feffe6',
                        color: '#faad14'
                      }),
                      ...(item.status === 'Finished' && {
                        background: '#f6ffed',
                        color: '#52c41a'
                      })
                    }}
                  >
                    {getStatusIcon(item.status)}
                    {item.status}
                  </Tag>
                </div>
              }
              description={
                <Typography.Text type="secondary" style={{ fontSize: '14px' }}>
                  {item.daysAgo} days ago | {item.location}
                </Typography.Text>
              }
            />
          </List.Item>
        )}
      />
    </Card>
  );
};

export default RecentTenantRequests; 