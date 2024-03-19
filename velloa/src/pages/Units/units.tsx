import React from 'react';
import { Typography, Table, Button, Space, Input } from 'antd';
import { RightOutlined } from '@ant-design/icons';
import { useLocation } from 'react-router-dom';

const { Title } = Typography;

interface Unit {
  key: number;
  unitNumber?: number;
  floor: number;
  unitPrice: number;
  fullName?: string;
  startDate?: string;
}

interface ActionRenderArgs {
  record: Unit;
  index: number;
  column: string;
}

const columns = [
  {
    title: 'Unit #',
    dataIndex: 'unitNumber',
    key: 'unitNumber',
    render: (unitNumber: number) => unitNumber || 'N/A',
  },
  {
    title: 'Full Name',
    dataIndex: 'fullName',
    key: 'fullName',
    render: (fullName: string) => fullName || 'N/A',
  },
  {
    title: 'Start of Residence',
    dataIndex: 'startDate',
    key: 'startDate',
    render: (startDate: string) => startDate || 'N/A',
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
  const location = useLocation();
  const unitData = location.state?.unitData || [];

  return (
    <div style={{ margin: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: '10px' }}>
        <Title level={1} style={{ textAlign: 'left', marginTop: '0px', marginBottom: '20px' }}>Units</Title>
        <div style={{ flexGrow: 1, display: 'flex', justifyContent: 'flex-end' }}>
          <Input.Search placeholder="Search units/names" onSearch={(value: string) => console.log(value)} style={{ width: 200 }} />
        </div>
      </div>
      <Table columns={columns} dataSource={unitData} />
    </div>
  );
};

export default UnitsPage;