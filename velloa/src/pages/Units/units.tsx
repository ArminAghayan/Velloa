import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../components/redux/store';
import { Typography, Table, Space, Input, message } from 'antd';
import { RightOutlined, SearchOutlined, CloseCircleFilled } from '@ant-design/icons';
import { SortOrder } from 'antd/lib/table/interface';
import { useLocation, useNavigate } from 'react-router-dom';
import { db } from '../../firebase-config';
import { collection, getDocs, query, where, doc } from 'firebase/firestore';

const { Title } = Typography;

interface UnitData {
  key: string;
  unitNumber: number;
  floor: number;
  unitPrice: number;
}

const UnitsPage: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [units, setUnits] = useState<UnitData[]>([]);
  const selectedProperty = useSelector((state: RootState) => state.property.selectedProperty);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUnits = async () => {
      if (selectedProperty && selectedProperty.id) {
        try {
          const unitsRef = collection(db, 'properties', selectedProperty.id, 'units');
          const unitsSnapshot = await getDocs(unitsRef);
          const unitsData: UnitData[] = unitsSnapshot.docs.map((doc) => ({
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
    };
    fetchUnits();
  }, [selectedProperty]);

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
          <RightOutlined onClick={() => onUnitClick(record)} />
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

  const onUnitClick = (record: UnitData) => {
    console.log('Unit clicked:', record);
    // Navigate to a different page or show more details about the unit
  };

  const onRequestClick = (record: UnitData) => {
    // Logic to handle request action
    console.log('Request', record);
  };

  const filteredUnits = units.filter((unit) =>
    unit.unitNumber.toString().includes(searchText)
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
      <Table columns={columns} dataSource={filteredUnits} />
    </div>
  );
};

export default UnitsPage;