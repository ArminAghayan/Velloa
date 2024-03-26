import React, { useState, useEffect } from 'react';
import { Typography, Table, Space, Input } from 'antd';
import { RightOutlined, SearchOutlined, CloseCircleFilled } from '@ant-design/icons';
import { SortOrder } from 'antd/lib/table/interface';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../components/store';
import { fetchUnits } from '../../components/propertySlice';
import { AppDispatch } from '../../components/store';
import { setSelectedUnit } from '../../components/unitActions';
import { useNavigate } from 'react-router-dom';


const { Title } = Typography;

interface UnitData {
  key: string;
  unitNumber: number;
  floor: number;
  unitPrice: number;
  propertyId: string;
}

const fetchUnitsAndDispatch = (propertyId: string) => {
  return async (dispatch: AppDispatch) => {
    await dispatch(fetchUnits(propertyId));
  };
};

const UnitsPage: React.FC = () => {
  const dispatch = useDispatch();
  const { propertyId, units } = useSelector((state: RootState) => state.property);
  const [searchText, setSearchText] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      dispatch(fetchUnitsAndDispatch(propertyId) as any); // Dispatch the function as an action
    };
    fetchData();
  }, [dispatch, propertyId]);

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

  // Event handlers for action buttons
  const onUnitClick = (record: UnitData) => {
    console.log('Unit clicked:', record);
    dispatch(setSelectedUnit(record));
    navigate('/unit-info');
  };

  const onRequestClick = (record: UnitData) => {
    // Logic to handle request action
    console.log('Request', record);
  };

  // Filter unit data based on search text and current property ID
  const filteredUnitData = units.filter(
    (unit) =>
      unit.unitNumber.toString().toLowerCase().includes(searchText.toLowerCase()) ||
      unit.floor.toString().toLowerCase().includes(searchText.toLowerCase()) ||
      unit.unitPrice.toString().toLowerCase().includes(searchText.toLowerCase())
  );


  console.log('Filtered unit data:', filteredUnitData);

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

function dispatch(arg0: any) {
  throw new Error('Function not implemented.');
}
