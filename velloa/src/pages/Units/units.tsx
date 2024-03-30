import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Typography, Table, Space, Input, message, Skeleton } from 'antd';
import { RightOutlined } from '@ant-design/icons';
import { SortOrder } from 'antd/lib/table/interface';
import { RootState } from '../../components/redux/store';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase-config';
import { collection, getDocs } from 'firebase/firestore';

const { Title } = Typography;

interface UnitData {
  key: string;
  unitNumber: number | '';
  floor: number | '';
  unitPrice: number | '';
}

const UnitsPage: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [units, setUnits] = useState<UnitData[]>([]);
  const selectedProperty = useSelector((state: RootState) => state.property.selectedProperty);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUnits = async () => {
      setLoading(true);
      if (selectedProperty && selectedProperty.id) {
        try {
          const unitsRef = collection(db, 'properties', selectedProperty.id, 'units');
          const unitsSnapshot = await getDocs(unitsRef);
          const unitsData = unitsSnapshot.docs.map((doc) => ({
            key: doc.id,
            unitNumber: doc.data().unitNumber,
            floor: doc.data().floor,
            unitPrice: doc.data().unitPrice,
          }));
          setUnits(unitsData);
        } catch (error) {
          console.error('Error fetching units:', error);
          message.error('Failed to fetch units. Please try again.');
        }
      }
      setLoading(false);
    };
    fetchUnits();
  }, [selectedProperty]);

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
      key: 'arrow',
      render: () => (loading ? <Skeleton.Button style={{ width: '24px' }} active size="small" shape="circle" /> : <RightOutlined />),
    },
  ];

  const filteredUnits = units.filter((unit) => unit.unitNumber.toString().includes(searchText));

  const handleUnitClick = (unit: UnitData) => {
    navigate(`/unitinfo`, { state: { unit } });
  };

  return (
    <div>
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
          />
        </div>
      </div>
     <Table
        columns={columns}
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