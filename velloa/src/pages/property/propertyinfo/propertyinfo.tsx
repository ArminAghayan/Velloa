// PropertyInfo.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Typography, Button, Tabs, message, Form, Skeleton,Row, Col, Space } from 'antd';
import { LeftOutlined } from '@ant-design/icons';
import { db } from '../../../firebase-config';
import { doc, getDoc } from 'firebase/firestore';
import PropertyOverview from './tabs/propertyinfo_overview';
import PropertyReports from './tabs/propertyinfo_reports';
import PropertyUnits from './tabs/propertyinfo_units';
import PropertyLeases from './tabs/propertyinfo_leases';
import PropertyTenants from './tabs/propertyinfo_tenants';
import PropertyInfoSettings from './tabs/propertyinfo_settings';
import PropertyRentalApplications from './tabs/propertyinfo_rental_applications';
import PropertyinfoNotes from './tabs/propertyinfo_notes';
import PropertyFiles from './tabs/propertyinfo_files';
import './propertyInfo.css';
import PropertyInfoTasks from './tabs/propertyinfo_tasks';

const { Title } = Typography;
const { TabPane } = Tabs;

interface Property {
  key: string;
  propertyName: string;
  imageUrl: string;
  propertyType: string;
  numberOfUnits: number;
  status: string;
  photos: string[];
}

const PropertyInfo: React.FC = () => {
  const navigate = useNavigate();
  const { uid } = useParams<{ uid: string }>(); // Extract uid from URL
  const [property, setProperty] = useState<Property | null>(null); // Initialize property state
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState(
    (useLocation().state as { activeTab?: string })?.activeTab || 'overview'
  );

  const handleBackClick = () => {
    navigate('/property');
  };

  const fetchPropertyInfo = useCallback(async () => {
    if (!uid) {
      message.error("No property ID provided.");
      navigate('/property');
      return;
    }

    try {
      setLoading(true);
      const propertyRef = doc(db, 'properties', uid);
      const propertyDoc = await getDoc(propertyRef);
      if (propertyDoc.exists()) {
        const data = propertyDoc.data();
        const fetchedProperty: Property = {
          key: propertyDoc.id,
          propertyName: data.propertyName || '',
          imageUrl: data.imageUrl || '',
          propertyType: data.propertyType || '',
          numberOfUnits: data.numberOfUnits || 0,
          status: data.status || '',
          photos: data.photos || [],
        };
        setProperty(fetchedProperty);
        setOwners(data.ownership || []);
        form.setFieldsValue({
          propertyName: data.propertyName || '',
          street1: data.address?.street1 || '',
          street2: data.address?.street2 || '',
          city: data.address?.city || '',
          state: data.address?.state || '',
          zip: data.address?.zip || '',
          country: data.address?.country || '',
          propertyDescription: data.description || '',
        });
      } else {
        message.error("Property not found.");
        navigate('/property');
      }
    } catch (error) {
      console.error("Error fetching property info: ", error);
      message.error("Failed to fetch property information.");
    } finally {
      setLoading(false);
    }
  }, [uid, navigate, form]);

  useEffect(() => {
    fetchPropertyInfo();
  }, [fetchPropertyInfo]);


  const updatePropertyName = (newName: string) => {
    form.setFieldsValue({ propertyName: newName });
  };

  return (
    <div className="property-info-page">
    <div className="property-info-top-container">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '40px',
        }}
      >
        <Button icon={<LeftOutlined />} onClick={handleBackClick} className="back-button">
          Back
        </Button>
      </div>

      <div className="property-info-header">
        <Row justify="space-between" align="middle">
          <Col>
            <Space direction="vertical" size="small">
              <Title level={2} style={{ marginBottom: '5px',marginLeft: '40px' }}>
              {property?.propertyName || 'Loading...'}  
              </Title>
            </Space>
          </Col>
          <Col>
        
          </Col>
        </Row>
      </div>
    </div>

      <div className="property-info-menu">
        <Tabs 
          activeKey={activeTab}
          onChange={key => setActiveTab(key as string)}
        >
          <TabPane tab="Overview" key="overview" />
          <TabPane tab="Reports" key="reports" />
          <TabPane tab="Units" key="units" />
          <TabPane tab="Leases" key="leases" />
          <TabPane tab="Tenants" key="tenants" />
          <TabPane tab="Rental Applications" key="rental_applications" />
          <TabPane tab="Tasks" key="tasks" />
          <TabPane tab="Files" key="files" />
          <TabPane tab="Notes" key="notes" />
          <TabPane tab="Settings" key="settings" />
        </Tabs>
      </div>


      <div className="property-info-content">
        {property ? (
          <>
            {activeTab === 'overview' && (
              <PropertyOverview property={property} />
            )}
            {activeTab === 'reports' && (
              <PropertyReports />
            )}
            {activeTab === 'units' && (
              <PropertyUnits propertyId={property.key || ''} />
            )}
            {activeTab === 'leases' && (
              <PropertyLeases />
            )}
            {activeTab === 'tenants' && (
              <PropertyTenants propertyId={property.key || ''} />
            )}
            {activeTab === 'rental_applications' && (
              <PropertyRentalApplications propertyId={property.key || ''} />
            )}
            {activeTab === 'tasks' && (
              <PropertyInfoTasks propertyId={property.key || ''} />
            )}
            {activeTab === 'files' && (
              <PropertyFiles propertyId={property.key || ''} />
            )}
            {activeTab === 'notes' && (
              <PropertyinfoNotes propertyId={property.key || ''} />
            )}
            {activeTab === 'settings' && (
              <PropertyInfoSettings 
                property={property} 
                updatePropertyName={updatePropertyName} 
              />
            )}
          </>
        ) : (
          <Skeleton active />
        )}
      </div>

      {/* Modals */}
     
    </div>
  );
};

export default PropertyInfo;