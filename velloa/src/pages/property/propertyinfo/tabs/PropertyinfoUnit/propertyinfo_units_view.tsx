import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Card, 
  Col, 
  message, 
  Row, 
  Button, 
  Space, 
  Typography, 
  Tabs, 
  Dropdown, 
  Menu,
  MenuProps,
} from 'antd';
import { 
  LeftOutlined, 
  MoreOutlined, 
  EditOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  BellOutlined,
  DeleteOutlined

} from '@ant-design/icons';
import { getFirestore, doc, getDoc, collection, getDocs } from 'firebase/firestore';
import './propertyinfo_units_view.css';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

// Add interfaces
interface Property {
  id: string;
  propertyName?: string;
}

interface Unit {
  unitId: string;
  unitName: string;
  beds?: number;
  baths?: number;
  size?: number;
  marketRent?: number;
  description?: string;
  status?: string;
  tenant?: {
    id: string;
    name: string;
    // Add other tenant fields as needed
  };
  // Add other unit fields as needed
}

const PropertyInfoUnitView: React.FC = () => {
  const navigate = useNavigate();
  const { propertyId, unitId } = useParams<{ propertyId: string; unitId: string }>();
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [property, setProperty] = useState<Property | null>(null);
  const [unit, setUnit] = useState<Unit | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editedUnit, setEditedUnit] = useState<Unit | null>(null);

  // Menu items for the dropdown
  const menuItems: MenuProps['items'] = [
    {
      key: 'delete',
      label: 'Delete Unit',
      danger: true,
    },
    // Add more menu items as needed
  ];

  const handleEdit = (type: string) => {
    // Implement edit functionality
    console.log('Edit', type);
  };

  const handleNewNote = () => {
    console.log('New Note');
  };

  const handleAddImage = () => {
    console.log('Add Image');
  };

  const handleNewWorkOrder = () => {
    console.log('New Work Order');
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!propertyId || !unitId) return;

      const db = getFirestore();
      try {
        // First get the propertySettings collection
        const propertySettingsCollection = collection(db, 'properties', propertyId, 'propertySettings');
        const propertySettingsSnapshot = await getDocs(propertySettingsCollection);
        
        // Get the first (and should be only) document from propertySettings
        const propertySettingsDoc = propertySettingsSnapshot.docs[0];
        const unitDoc = await getDoc(doc(db, 'properties', propertyId, 'units', unitId));

        if (propertySettingsDoc && unitDoc.exists()) {
          setProperty({ 
            id: propertyId, 
            ...propertySettingsDoc.data() 
          } as Property);
          setUnit({ unitId: unitDoc.id, ...unitDoc.data() } as Unit);
        } else {
          message.error('Property or unit not found');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        message.error('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [propertyId, unitId]);

  const menu = (
    <Menu>
      <Menu.Item icon={<EditOutlined />} key="edit" >
        Edit
      </Menu.Item>
      <Menu.Item key="5" icon={<DeleteOutlined />} >
        Delete
      </Menu.Item>
    </Menu>
  );


  const tabItems = [
    {
      key: 'overview',
      label: 'Overview',
      children: <div>Overview Content</div>
    },
    {
      key: 'notes',
      label: 'Notes',
      children: <div>Notes Content</div>
    },
    {
      key: 'images',
      label: 'Images',
      children: <div>Images Content</div>
    },
    {
      key: 'maintenance',
      label: 'Maintenance',
      children: <div>Maintenance Content</div>
    }
  ];

  return (
    <div className="property-info-unit-details-page">
       <div className="property-info-unit-details-top-container">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '40px',
          }}
        >
          <Button icon={<LeftOutlined />} onClick={() => navigate(-1)}>
            Back
          </Button>
          <Dropdown overlay={menu} trigger={['click']}>
            <Button icon={<MoreOutlined />} />
          </Dropdown>
        </div>

        <div className="property-info-unit-details-header">
          <Row justify="space-between" align="middle">
            <Col>
              <Space direction="vertical" size="small">
                <Title level={2} style={{ marginBottom: '0' }}>
                  Unit {unit?.unitName || 'Loading...'}
                </Title>
                <Text type="secondary" style={{ fontSize: '16px', color: '#188034w' }}>
                  {property?.propertyName || 'Loading...'}
                </Text>
              </Space>
            </Col>
          </Row>
        </div>
      </div>

      <div className="property-info-unit-details-menu">
        <Tabs activeKey={activeTab} onChange={key => setActiveTab(key)}>
          <TabPane tab="Overview" key="overview" />
          <TabPane tab="Maintenance" key="maintenance" />
          <TabPane tab="Listings" key="listings" />
          <TabPane tab="Images" key="images" />
          <TabPane tab="Notes" key="notes" />
          <TabPane tab="Files" key="files" />


        </Tabs>
      </div>

      <div className="property-info-unit-details-content">

       
      </div>


    </div>
  );
};

export default PropertyInfoUnitView;
