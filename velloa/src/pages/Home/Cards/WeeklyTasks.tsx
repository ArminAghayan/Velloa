import React from 'react';
import { Card, Button, Dropdown, Space, Typography } from 'antd';
import { 
  MoreOutlined, 
} from '@ant-design/icons';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import { CardProps, getCardMenuItems } from './CardProps';

interface WeeklyTask {
  day: string;
  'Not Started': number;
  'In Progress': number;
  'Completed': number;
}

const WeeklyTasks: React.FC<CardProps> = ({ onCustomize, onDelete }) => {
  const weeklyTasksData: WeeklyTask[] = [
    { day: 'Overdue', 'Not Started': 1, 'In Progress': 5, 'Completed': 0 },
    { day: 'Today', 'Not Started': 0, 'In Progress': 0, 'Completed': 0 },
    { day: 'Thu', 'Not Started': 0, 'In Progress': 0, 'Completed': 0 },
    { day: 'Fri', 'Not Started': 0, 'In Progress': 0, 'Completed': 0 },
    { day: 'Sat', 'Not Started': 0, 'In Progress': 0, 'Completed': 0 },
    { day: 'Sun', 'Not Started': 0, 'In Progress': 0, 'Completed': 0 },
    { day: 'Mon', 'Not Started': 0, 'In Progress': 0, 'Completed': 0 },
    { day: 'Tue', 'Not Started': 0, 'In Progress': 0, 'Completed': 0 },
  ];

  const menuItems = getCardMenuItems(onCustomize, onDelete);

  const CustomLegend = () => (
    <div style={{ marginBottom: 16 }}>
      <Space size={24} style={{ display: 'flex', justifyContent: 'center' }}>
        <Space>
          <span style={{ 
            display: 'inline-block', 
            width: 12, 
            height: 12, 
            backgroundColor: '#8c8c8c',
            borderRadius: '50%',
            marginRight: 4
          }} />
          <Typography.Text>Not Started</Typography.Text>
          <Typography.Text strong style={{ marginLeft: 4 }}>6</Typography.Text>
        </Space>
        <Space>
          <span style={{ 
            display: 'inline-block', 
            width: 12, 
            height: 12, 
            backgroundColor: '#faad14',
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
            backgroundColor: '#52c41a',
            borderRadius: '50%',
            marginRight: 4
          }} />
          <Typography.Text>Completed</Typography.Text>
          <Typography.Text strong style={{ marginLeft: 4 }}>0</Typography.Text>
        </Space>
      </Space>
    </div>
  );

  return (
    <Card 
      title="Tasks for this week" 
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
      bodyStyle={{ padding: '24px 24px 0' }}
    >
      <CustomLegend />
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={weeklyTasksData}
          barSize={30}
        >
          <XAxis 
            dataKey="day" 
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
            fill="#8c8c8c"
            radius={[0, 0, 4, 4]}
          />
          <Bar 
            dataKey="In Progress" 
            stackId="a" 
            fill="#faad14"
          />
          <Bar 
            dataKey="Completed" 
            stackId="a" 
            fill="#52c41a"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default WeeklyTasks; 