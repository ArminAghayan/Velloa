import React from 'react';
import { Card, Button, Typography, List, Space, Tooltip, Dropdown } from 'antd';
import { MoreOutlined } from '@ant-design/icons';
import { CardProps, getCardMenuItems } from './CardProps';

const { Text, Title } = Typography;

interface LeaseRenewalStage {
  name: string;
  count: number;
  percentage: string;
  color: string;
}

const LeaseRenewalsFunnel: React.FC<CardProps> = ({ onCustomize, onDelete }) => {
    const stages: LeaseRenewalStage[] = [
    { name: 'Not Started', count: 9, percentage: '64%', color: '#ff4d7c' },
    { name: 'Renewal Offer', count: 2, percentage: '14%', color: '#188034' },
    { name: 'Draft Lease', count: 2, percentage: '14%', color: '#9254de' },
    { name: 'Not Renewing', count: 1, percentage: '8%', color: '#1677ff' }
  ];

  // Calculate total from stages
  const totalCount = stages.reduce((sum, stage) => sum + stage.count, 0);

  // Calculate percentages based on total
  stages.forEach(stage => {
    stage.percentage = `${Math.round((stage.count / totalCount) * 100)}%`;
  });

  const activeStages = stages.filter(stage => stage.count > 0);
  const totalActiveHeight = activeStages.reduce((sum, stage) => sum + stage.count, 0);
  const getHeight = (count: number) => `${(count / totalActiveHeight) * 200}px`;

  const getTooltipContent = (stage: LeaseRenewalStage) => (
    <div style={{ padding: '4px 8px' }}>
      <div>{stage.name}</div>
      <div>
        <Text strong>{stage.count}</Text> ({stage.percentage})
      </div>
    </div>
  );

  const menuItems = getCardMenuItems(onCustomize, onDelete);


  return (
    <Card 
      title="Lease Renewals Funnel" 
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
      bodyStyle={{ padding: '24px' }}
    >
      <div>
        <Title level={4} style={{ margin: '0 0 4px 0' }}>
          Total: {totalCount}
        </Title>
        <Text type="secondary" style={{ display: 'block', marginBottom: '24px' }}>
          Next 120 days
        </Text>

        <div style={{ display: 'flex', gap: '24px' }}>
          {/* Bar with tooltips */}
          <div style={{ 
            width: '30px',
            height: 'fit-content',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            {activeStages.map((stage, index) => (
              <Tooltip 
                key={index}
                title={getTooltipContent(stage)}
                placement="right"
              >
                <div
                  style={{
                    width: '100%',
                    height: getHeight(stage.count),
                    backgroundColor: stage.color,
                    cursor: 'pointer'
                  }}
                />
              </Tooltip>
            ))}
          </div>

          {/* List */}
          <List
            style={{ flex: 1 }}
            dataSource={stages}
            renderItem={item => (
              <List.Item
                style={{ 
                  padding: '12px 0', 
                  border: 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <Space>
                  <span style={{ 
                    display: 'inline-block',
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: item.color
                  }} />
                  <Text>{item.name}</Text>
                </Space>
                <Space size={24}>
                  <Text strong>{item.count}</Text>
                  <Text style={{ minWidth: '48px' }}>{item.percentage}</Text>
                </Space>
              </List.Item>
            )}
          />
        </div>
      </div>
    </Card>
  );
};

export default LeaseRenewalsFunnel;