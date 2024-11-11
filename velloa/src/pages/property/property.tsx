import React, { useState, useEffect, useCallback } from 'react';
import { Typography, Table, Space, Input, Skeleton, Button, message } from 'antd';
import { RightOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { SortOrder } from 'antd/lib/table/interface';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../../firebase-config';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import './property.css';
import { IconHome, IconBuilding } from '@tabler/icons-react';

const { Title } = Typography;

interface PropertyData {
  key: string;
  propertyName: string;
  propertyType: string;
  propertyDescription: string;
  address: string;
  numberOfUnits: number;
}

const PropertyPage: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<PropertyData[]>([]);
  const [user, setUser] = useState<any>(null);
  const [companyIds, setCompanyIds] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleAddPropertyClick = () => {
    navigate('/addnewproperty');
  };

  const fetchProperties = useCallback(async () => {
    if (!user || companyIds.length === 0) return;

    try {
      setLoading(true);
      const propertiesQuery = query(collection(db, 'properties'), where('companyuid', 'in', companyIds));
      const querySnapshot = await getDocs(propertiesQuery);
      
      const propertiesData: PropertyData[] = await Promise.all(querySnapshot.docs.map(async (doc) => {
        const data = doc.data();
        const unitsSnapshot = await getDocs(collection(db, 'properties', doc.id, 'units'));
        
        const propertySettingsSnapshot = await getDocs(collection(db, 'properties', doc.id, 'propertySettings'));
        const propertySettings = propertySettingsSnapshot.docs[0]?.data();
        const propertyName = propertySettings?.propertyName || data.propertyName || '';

        return {
          key: doc.id,
          propertyName: propertyName,
          propertyType: data.propertyType || '',
          propertyDescription: data.propertyDescription || '',
          address: `${data.address.street1 || ''}, ${data.address.city || ''}, ${data.address.state || ''}, ${data.address.zip || ''}`,
          numberOfUnits: unitsSnapshot.size,
        };
      }));
      
      setProperties(propertiesData);
    } catch (error) {
      console.error("Error fetching properties: ", error);
      message.error("Failed to fetch properties. Please try again.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [user, companyIds]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        const companiesSnapshot = await getDocs(query(collection(db, 'companies'), where(`members.${user.uid}`, '!=', null)));
        const companyIds = companiesSnapshot.docs.map(doc => doc.id);
        setCompanyIds(companyIds);
      } else {
        setUser(null);
        message.error('User is not authenticated');
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchProperties();
  };

  const createSkeletonData = (count: number): PropertyData[] => {
    return Array.from({ length: count }, (_, index) => ({
      key: `skeleton-${index}`,
      propertyName: '',
      propertyType: '',
      propertyDescription: '',
      address: '',
      numberOfUnits: 0,
    }));
  };

  const columns = [
    {
      title: 'Property Name',
      dataIndex: 'propertyName',
      key: 'propertyName',
      defaultSortOrder: 'ascend' as SortOrder,
      sorter: (a: PropertyData, b: PropertyData) => a.propertyName.localeCompare(b.propertyName),
      render: (text: PropertyData['propertyName'], record: PropertyData) => (
        loading ? (
          <Skeleton.Input style={{ width: '100px' }} active size="small" />
        ) : (
          <Space>
            <div style={{
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#D8E6D9',
              borderRadius: '4px',
              marginRight: '12px'
            }}>
              {record.propertyType.toLowerCase() === 'residential' ? (
                <IconHome size={24} style={{ color: '#168033' }} />
              ) : (
                <IconBuilding size={24} style={{ color: '#168033' }} />
              )}
            </div>
            {text}
          </Space>
        )
      ),
    },
    {
      title: 'Property Type',
      dataIndex: 'propertyType',
      key: 'propertyType',
      sorter: (a: PropertyData, b: PropertyData) => a.propertyType.localeCompare(b.propertyType),
      render: (text: PropertyData['propertyType']) => (loading ? <Skeleton.Input style={{ width: '100px' }} active size="small" /> : text),
    },
    {
      title: 'Description',
      dataIndex: 'propertyDescription',
      key: 'propertyDescription',
      render: (text: PropertyData['propertyDescription']) => (loading ? <Skeleton.Input style={{ width: '100px' }} active size="small" /> : text),
    },
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
      render: (text: PropertyData['address']) => (loading ? <Skeleton.Input style={{ width: '200px' }} active size="small" /> : text),
    },
    {
      title: 'Number of Units',
      dataIndex: 'numberOfUnits',
      key: 'numberOfUnits',
      sorter: (a: PropertyData, b: PropertyData) => a.numberOfUnits - b.numberOfUnits,
      render: (text: PropertyData['numberOfUnits']) => (loading ? <Skeleton.Input style={{ width: '50px' }} active size="small" /> : text),
    },
    {
      title: '',
      align: 'center' as 'center',
      key: 'arrow',
      render: () => (loading ? <Skeleton.Button style={{ width: '24px' }} active size="small" shape="circle" /> : <RightOutlined />),
    },
  ];

  const filteredProperties = properties.filter((property) =>
    property.propertyName.toLowerCase().includes(searchText.toLowerCase()) ||
    property.address.toLowerCase().includes(searchText.toLowerCase())
  );

  const handlePropertyClick = (property: PropertyData) => {
    navigate(`/property/${property.key}`); // Updated navigation
  };

  return (
    <div style={{ padding: '64px 24px' }}>
      <Title level={1} style={{ textAlign: 'left', marginTop: '0px', marginBottom: '20px' }}>
        Property
      </Title>
      <div className="property-page-container">
        <div className="search-and-add">
          <Input
            placeholder="Search property/names or address"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="search-input"
          />
          <Space>
            
            <Button style={{ height: '40px' }} type="default" onClick={handleAddPropertyClick} icon={<PlusOutlined />} className="add-property-button">
              Add Property
            </Button>
            <Button
              icon={<ReloadOutlined spin={isRefreshing} />}
              onClick={handleRefresh}
              disabled={isRefreshing}
              style={{ height: '40px', width: '40px' }}
            />
          </Space>
        </div>
        <Table
          columns={columns}
          size="middle"
          dataSource={loading ? createSkeletonData(10) : filteredProperties}
          pagination={{ pageSize: 10 }}
          onRow={(record: PropertyData) => ({
            onClick: () => handlePropertyClick(record), // Updated click handler
            style: { cursor: 'pointer' },
          })}
          className="custom-table"
        />
      </div>
    </div>
  );
};

export default PropertyPage;
