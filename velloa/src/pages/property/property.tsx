import React, { useState, useEffect } from 'react';
import { Typography, Table, Space, Input, Skeleton,Button  } from 'antd';
import { RightOutlined,PlusOutlined } from '@ant-design/icons';
import { SortOrder } from 'antd/lib/table/interface';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase-config';
import { collection, getDocs } from 'firebase/firestore';

const { Title } = Typography;

interface UnitData {
  key: string;
  unitNumber: string | number;
  floor: string | number;
  unitPrice: string | number;
}

const UnitsPage: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [units, setUnits] = useState<UnitData[]>([]);

  const handleAddPropertyClick = () => {
    navigate('/addnewproperty');
  };
  

  const createSkeletonData = (count: number): UnitData[] => {
    return Array.from({ length: count }, (_, index) => ({
      key: `skeleton-${index}`,
      unitNumber: '',
      floor: '',
      unitPrice: '',
    }));
  };

  const columns = [
    {
      title: 'Unit #',
      dataIndex: 'unitNumber',
      key: 'unitNumber',
      defaultSortOrder: 'ascend' as SortOrder,
      sorter: (a: UnitData, b: UnitData) => (typeof a.unitNumber === 'number' && typeof b.unitNumber === 'number' ? a.unitNumber - b.unitNumber : 0),
      render: (text: UnitData['unitNumber']) => (loading ? <Skeleton.Input style={{ width: '100px' }} active size="small" /> : text),
    },
    {
      title: 'Floor',
      dataIndex: 'floor',
      key: 'floor',
      sorter: (a: UnitData, b: UnitData) => (typeof a.floor === 'number' && typeof b.floor === 'number' ? a.floor - b.floor : 0),
      render: (text: UnitData['floor']) => (loading ? <Skeleton.Input style={{ width: '100px' }} active size="small" /> : text),
    },
    {
      title: 'Unit Price',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      sorter: (a: UnitData, b: UnitData) => (typeof a.unitPrice === 'number' && typeof b.unitPrice === 'number' ? a.unitPrice - b.unitPrice : 0),
      render: (text: UnitData['unitPrice']) => (loading ? <Skeleton.Input style={{ width: '100px' }} active size="small" /> : text),
    },
    {
      title: 'Action',
      key: 'action',
      render: () => (loading ? <Skeleton.Button style={{ width: '100px' }} active size="small" /> : (
        <Space size="middle">
          <a>Request</a>
          <a>Message</a>
        </Space>
      )),
    },
    {
      title: '',
      align: 'center' as 'center',
      key: 'arrow',
      render: () => (loading ? <Skeleton.Button style={{ width: '24px' }} active size="small" shape="circle" /> : <RightOutlined />),
    },
  ];

  const filteredUnits = units.filter((unit) => unit.unitNumber.toString().includes(searchText));

  const handleUnitClick = (unit: UnitData) => {
    navigate(`/propertyinfo`, { state: { unit } });
  };

  return (
    <div>
      <Title level={1} style={{ textAlign: 'left', marginTop: '0px', marginBottom: '20px' }}>
        Property
      </Title>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}
      >
        <Input
          placeholder="Search property/names"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 250, height: 38 }}
        />
     <Button type="primary" onClick={handleAddPropertyClick} icon={<PlusOutlined />} style={{ height: 38 }}>
      Add Property
    </Button>
      </div>
      <Table
        columns={columns}
        size='middle'
        bordered={true}
        dataSource={loading ? createSkeletonData(10) : filteredUnits}
        pagination={{ pageSize: 10 }}
        onRow={(record: UnitData) => ({
          onClick: () => handleUnitClick(record),
          style: { cursor: 'pointer' },
        })}
      />
    </div>
  );
};

export default UnitsPage;