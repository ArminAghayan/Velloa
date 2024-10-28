import React, { useState, useEffect } from 'react';
import { Table, Space, Tag, Typography, Input } from 'antd';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase-config';

const { Text } = Typography;

interface PeoplePropertiesProps {
  personId: string;
  companyId: string;
}

interface Property {
  key: string;
  propertyName: string;
  units: string[];
  ownership: number;
  status: string;
}

const PeopleProperties: React.FC<PeoplePropertiesProps> = ({ personId, companyId }) => {
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<Property[]>([]);
  const [searchText, setSearchText] = useState(''); // Add this line

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);
        // Add your Firebase query here to fetch properties associated with this owner
        // This is a placeholder structure
        const propertiesRef = collection(db, 'properties');
        const q = query(propertiesRef, where('owners', 'array-contains', personId));
        const querySnapshot = await getDocs(q);
        
        const propertiesData: Property[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          propertiesData.push({
            key: doc.id,
            propertyName: data.propertyName || 'Unnamed Property',
            units: data.units || [],
            ownership: data.ownership || 0,
            status: data.status || 'Active',
          });
        });

        setProperties(propertiesData);
      } catch (error) {
        console.error('Error fetching properties:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [personId, companyId]);

  const columns = [
    {
      title: 'Property Name',
      dataIndex: 'propertyName',
      key: 'propertyName',
    },
    {
      title: 'Units',
      dataIndex: 'units',
      key: 'units',
      render: (units: string[]) => (
        <Space>
          {units.map((unit, index) => (
            <Tag key={index}>{unit}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: 'Ownership %',
      dataIndex: 'ownership',
      key: 'ownership',
      render: (ownership: number) => `${ownership}%`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'Active' ? 'green' : 'red'}>
          {status}
        </Tag>
      ),
    },
  ];

  return (
    <div className="property-page-container">
      <div className="search-and-add">
        <Input
          placeholder="Search property"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="search-input"
        />
      </div>
      <Table 
        columns={columns} 
        dataSource={properties} 
        loading={loading}
        pagination={false}
      />
    </div>
  );
};

export default PeopleProperties;
