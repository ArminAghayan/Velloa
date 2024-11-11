import React from 'react';
import { Card, Typography, Space, Button, Dropdown } from 'antd';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { MoreOutlined } from '@ant-design/icons';
import { CardProps, getCardMenuItems } from './CardProps';

const { Text } = Typography;

interface AdoptionData {
  name: string;
  value: number;
  color: string;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ 
        backgroundColor: 'white', 
        padding: '8px 12px',
        border: '1px solid #f0f0f0',
        borderRadius: '4px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
      }}>
        <Text strong>{`${payload[0].name}: ${payload[0].value}%`}</Text>
      </div>
    );
  }
  return null;
};

const TenantPortalAdoption: React.FC<CardProps> = ({ onCustomize, onDelete }) => {
  const adoptionData: AdoptionData[] = [
    { name: 'Adopted', value: 65, color: '#1677ff' },
    { name: 'Not Adopted', value: 35, color: '#f0f0f0' }
  ];

  const menuItems = getCardMenuItems(onCustomize, onDelete);

  return (
    <Card 
      title="Tenant Portal Adoption" 
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
        padding: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: 'calc(424px - 57px)'
      }}
    >
      <div style={{ 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        maxWidth: '800px'
      }}>
        {/* Left side - Chart */}
        <div style={{ width: '300px', height: '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={adoptionData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                startAngle={90}
                endAngle={-270}
                dataKey="value"
                nameKey="name"
              >
                {adoptionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                content={<CustomTooltip />}
                cursor={false}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Right side - Percentage and Legend */}
        <div style={{ 
          marginLeft: '48px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          <Text style={{ 
            fontSize: '36px', 
            fontWeight: 600,
            display: 'block',
            marginBottom: '4px'
          }}>
            65%
          </Text>
          <Text type="secondary" style={{ 
            display: 'block', 
            marginBottom: '24px'
          }}>
            Current Adoption Rate
          </Text>

          {/* Legend */}
          <Space direction="vertical" size={12}>
            {adoptionData.map((item, index) => (
              <Space key={index} align="center">
                <span style={{ 
                  display: 'inline-block',
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: item.color
                }} />
                <Text>{item.name}</Text>
                <Text strong>{item.value}%</Text>
              </Space>
            ))}
          </Space>
        </div>
      </div>
    </Card>
  );
};

export default TenantPortalAdoption; 