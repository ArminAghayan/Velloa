import React from 'react';
import { Card, Button, Space, Typography, Dropdown } from 'antd';
import { MoreOutlined } from '@ant-design/icons';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { CardProps, getCardMenuItems } from './CardProps';

interface TaskChartData {
  name: string;
  'Not Started': number;
  'In Progress': number;
  'Overdue': number;
}

const TasksOpenByStatus: React.FC<CardProps> = ({ onCustomize, onDelete }) => {
  const menuItems = getCardMenuItems(onCustomize, onDelete);

  // Task chart data
  const taskChartData: TaskChartData[] = [
    { 
      name: 'Tenant Requests',
      'Not Started': 50,
      'In Progress': 10,
      'Overdue': 24
    },
    { 
      name: 'Owner Requests',
      'Not Started': 5,
      'In Progress': 2,
      'Overdue': 15
    },
    { 
      name: 'Work Requests',
      'Not Started': 8,
      'In Progress': 3,
      'Overdue': 20
    },
    { 
      name: 'Internal Task',
      'Not Started': 30,
      'In Progress': 5,
      'Overdue': 10
    }
  ];

  // Custom legend component
  const CustomLegend = () => (
    <div style={{ marginBottom: 16 }}>
      <Space size={24} style={{ display: 'flex', justifyContent: 'center' }}>
        <Space>
          <span style={{ 
            display: 'inline-block', 
            width: 12, 
            height: 12, 
            backgroundColor: '#1677ff',
            borderRadius: '50%',
            marginRight: 4
          }} />
          <Typography.Text>Not Started</Typography.Text>
          <Typography.Text strong style={{ marginLeft: 4 }}>50</Typography.Text>
        </Space>
        <Space>
          <span style={{ 
            display: 'inline-block', 
            width: 12, 
            height: 12, 
            backgroundColor: '#9159CD',
            borderRadius: '50%',
            marginRight: 4
          }} />
          <Typography.Text>In Progress</Typography.Text>
          <Typography.Text strong style={{ marginLeft: 4 }}>10</Typography.Text>
        </Space>
        <Space>
          <span style={{ 
            display: 'inline-block', 
            width: 12, 
            height: 12, 
            backgroundColor: '#188034',
            borderRadius: '50%',
            marginRight: 4
          }} />
          <Typography.Text>Overdue</Typography.Text>
          <Typography.Text strong style={{ marginLeft: 4 }}>234</Typography.Text>
        </Space>
      </Space>
    </div>
  );

  return (
    <Card 
      title="Tasks - Open by Status" 
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
    >
      <CustomLegend />
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={taskChartData}
          barSize={30}
        >
          <XAxis 
            dataKey="name" 
            axisLine={false}
            tickLine={false}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            hide
          />
          <Bar 
            dataKey="Not Started" 
            stackId="a" 
            fill="#1677ff"
            radius={[0, 0, 4, 4]}
          />
          <Bar 
            dataKey="In Progress" 
            stackId="a" 
            fill="#9159CD"
          />
          <Bar 
            dataKey="Overdue" 
            stackId="a" 
            fill="#188034"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default TasksOpenByStatus;
