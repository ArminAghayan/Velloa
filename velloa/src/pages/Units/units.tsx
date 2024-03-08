import React from 'react';
import { Typography, Table, Button, Space,Input  } from 'antd';
import {RightOutlined   } from '@ant-design/icons';

const { Title } = Typography;

interface Unit {
  key: string;
  unitNumber: string;
  fullName: string;
  startDate: string;
}

interface ActionRenderArgs {
  record: Unit;
  index: number;
  column: string;
}

const data: Unit[] = [
  {
    key: '1',
    unitNumber: '101',
    fullName: 'John Doe',
    startDate: '2022-01-01',
  },
  // ... more data
];

const columns = [
  {
    title: 'Unit #',
    dataIndex: 'unitNumber',
    key: 'unitNumber',
  },
  {
    title: 'Full Name',
    dataIndex: 'fullName',
    key: 'fullName',
  },
  {
    title: 'Start of Residence',
    dataIndex: 'startDate',
    key: 'startDate',
  },
  {
    title: 'Action',
    key: 'action',
    render: (text: any, record: Unit) => (
      <Space size="middle">
        <a onClick={() => onMessageClick(record)}>Message</a>
        <a onClick={() => onRequestClick(record)}>Request</a>
      </Space>
    ),
  },
  {
    title: '',
    key: 'arrow',
    render: () => <RightOutlined />, // Just the arrow icon, not a button
  },
];

// Event handlers for action buttons
const onMessageClick = (record: Unit) => {
  // Logic to handle message action
  console.log('Message', record);
};

const onRequestClick = (record: Unit) => {
  // Logic to handle request action
  console.log('Request', record);
};


const UnitsPage: React.FC = () => {
  return (
    <div style={{ margin: '20px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: '10px' }}>
    <Title level={1} style={{ textAlign: 'left',marginTop: '0px', marginBottom: '20px' }}>Units</Title>
      <div style={{ flexGrow: 1, display: 'flex', justifyContent: 'flex-end' }}>
        <Input.Search placeholder="Search units/names" onSearch={(value: string) => console.log(value)} style={{ width: 200 }} />
      </div>
    </div>
    <Table columns={columns} dataSource={data} />
  </div>
  );
};

export default UnitsPage;
