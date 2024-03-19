import React, { useState, useEffect } from 'react';
import { Typography, Table, Button, Space, Input } from 'antd';
import { RightOutlined, SearchOutlined, CloseCircleFilled } from '@ant-design/icons';
import { db } from '../../firebase-config';
import { collection, getDocs } from 'firebase/firestore';
import { SortOrder } from 'antd/lib/table/interface';

const { Title } = Typography;

interface UnitData {
  key: string;
  unitNumber: number;
  floor: number;
  unitPrice: number;
}

const UnitsPage: React.FC = () => {
  const [unitData, setUnitData] = useState<UnitData[]>([]);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    const fetchUnitData = async () => {
      const unitsRef = collection(db, 'units');
      const snapshot = await getDocs(unitsRef);
      const unitDataList: UnitData[] = snapshot.docs.map((doc) => ({
        key: doc.id,
        unitNumber: doc.data().unitNumber ?? 0,
        floor: doc.data().floor ?? 0,
        unitPrice: doc.data().unitPrice ?? 0,
      }));
      setUnitData(unitDataList);
    };
    fetchUnitData();
  }, []);

  const columns = [
    {
      title: 'Unit #',
      dataIndex: 'unitNumber',
      key: 'unitNumber',
      defaultSortOrder: 'ascend' as SortOrder,
      sorter: (a: UnitData, b: UnitData) => a.unitNumber - b.unitNumber,
    },
    {
      title: 'Floor',
      dataIndex: 'floor',
      key: 'floor',
      sorter: (a: UnitData, b: UnitData) => a.floor - b.floor,
    },
    {
      title: 'Unit Price',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      sorter: (a: UnitData, b: UnitData) => a.unitPrice - b.unitPrice,
    },
    {
      title: 'Action',
      key: 'action',
      render: (text: any, record: UnitData) => (
        <Space size="middle">
          <a onClick={() => onMessageClick(record)}>Message</a>
          <a onClick={() => onRequestClick(record)}>Request</a>
        </Space>
      ),
    },
    {
      title: '',
      key: 'arrow',
      render: () => <RightOutlined />,
    },
  ];

  // Event handlers for action buttons
  const onMessageClick = (record: UnitData) => {
    // Logic to handle message action
    console.log('Message', record);
  };

  const onRequestClick = (record: UnitData) => {
    // Logic to handle request action
    console.log('Request', record);
  };

  // Filter unit data based on search text
  const filteredUnitData = unitData.filter(
    (unit) =>
      unit.unitNumber.toString().toLowerCase().includes(searchText.toLowerCase()) ||
      unit.floor.toString().toLowerCase().includes(searchText.toLowerCase()) ||
      unit.unitPrice.toString().toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div style={{ margin: '20px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'end',
          marginBottom: '10px',
        }}
      >
        <Title level={1} style={{ textAlign: 'left', marginTop: '0px', marginBottom: '20px' }}>
          Units
        </Title>
        <div style={{ flexGrow: 1, display: 'flex', justifyContent: 'flex-end' }}>
          <Input.Search
            placeholder="Search units/names"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 200 }}
            suffix={
              searchText ? (
                <CloseCircleFilled onClick={() => setSearchText('')} />
              ) : (
                <SearchOutlined />
              )
            }
          />
        </div>
      </div>
      <Table columns={columns} dataSource={filteredUnitData} />
    </div>
  );
};

export default UnitsPage;