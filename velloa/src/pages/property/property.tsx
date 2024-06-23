import React, { useState, useEffect } from 'react';
import { Typography, Table, Space, Input, Skeleton, Button, message } from 'antd';
import { RightOutlined, PlusOutlined } from '@ant-design/icons';
import { SortOrder } from 'antd/lib/table/interface';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../../firebase-config';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import './property.css'; // Import the CSS file

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

  const handleAddPropertyClick = () => {
    navigate('/addnewproperty');
  };

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
    const fetchProperties = async () => {
      if (!user || companyIds.length === 0) return;

      try {
        const propertiesQuery = query(collection(db, 'properties'), where('companyuid', 'in', companyIds));
        const querySnapshot = await getDocs(propertiesQuery);
        const propertiesData: PropertyData[] = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            key: doc.id,
            propertyName: data.propertyName || '',
            propertyType: data.propertyType || '',
            propertyDescription: data.propertyDescription || '',
            address: `${data.address.street1 || ''}, ${data.address.city || ''}, ${data.address.state || ''}, ${data.address.zip || ''}`,
            numberOfUnits: data.units ? data.units.length : 0,
          };
        }) as PropertyData[];
        setProperties(propertiesData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching properties: ", error);
        setLoading(false);
      }
    };

    fetchProperties();
  }, [user, companyIds]);

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
      render: (text: PropertyData['propertyName']) => (loading ? <Skeleton.Input style={{ width: '100px' }} active size="small" /> : text),
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
    navigate('/propertyinfo/', { state: { property } });
  };

  return (
    <div style={{ padding: '24px 36px' }}>
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
          <Button type="default" onClick={handleAddPropertyClick} icon={<PlusOutlined />} className="add-property-button">
            Add Property
          </Button>
        </div>
        <Table
          columns={columns}
          size="middle"
          dataSource={loading ? createSkeletonData(10) : filteredProperties}
          pagination={{ pageSize: 10 }}
          onRow={(record: PropertyData) => ({
            onClick: () => handlePropertyClick(record),
            style: { cursor: 'pointer' },
          })}
          className="custom-table"
        />
      </div>
    </div>
  );
};

export default PropertyPage;
