import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Typography, Card, Row, Col, Skeleton, message, Button, Space, Empty, Avatar, Tabs } from 'antd';
import { LeftOutlined } from '@ant-design/icons';
import { db } from '../../../../firebase-config';
import { doc, getDoc, collection, getDocs, Timestamp, query, where } from 'firebase/firestore';
import { IconUserCircle, IconBuildingEstate, IconKey, IconCircleDashedCheck, IconClipboardList } from '@tabler/icons-react';
import { CameraOutlined, PictureOutlined } from '@ant-design/icons';
import './propertyinfo_overview.css';
import PropertyReports from './propertyinfo_reports';
import PropertyUnits from './propertyinfo_units';
import PropertyLeases from './propertyinfo_leases';
import PropertyTenants from './propertyinfo_tenants';
import PropertyInfoSettings from './propertyinfo_settings';
import PropertyRentalApplications from './propertyinfo_rental_applications';
import PropertyinfoNotes from './propertyinfo_notes';
import PropertyinfoFiles from './propertyinfo_files';
import PropertyInfoTasks from './propertyinfo_tasks';
import PropertyListings from './propertyinfo_listings';
import PropertySignatures from './propertyinfo_signatures';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

interface Property {
  key: string;
  propertyName: string;
  imageUrl: string;
  propertyType: string;
  numberOfUnits: number;
  status: string;
}

interface Owner {
  ownerId: string;
  name: string;
  percentage: number;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  company?: string;
}

interface PropertyPhoto {
  id: string;
  fileUrl: string;
  fileName: string;
  uploadDate: Timestamp;
  isVideo: boolean;
}

const PropertyOverview: React.FC = () => {
  const navigate = useNavigate();
  const { uid } = useParams<{ uid: string }>();
  const [property, setProperty] = useState<Property | null>(null);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [pendingApplicationsCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(
    (useLocation().state as { activeTab?: string })?.activeTab || 'overview'
  );
  const [propertyPhotos, setPropertyPhotos] = useState<PropertyPhoto[]>([]);

  const handleBackClick = () => {
    navigate('/property');
  };

  const fetchOwnerDetails = useCallback(async (owners: Owner[]) => {
    try {
      const ownersWithDetails = await Promise.all(
        owners.map(async (owner) => {
          if (!owner.ownerId) return owner;
          
          const personDoc = await getDoc(doc(db, 'people', owner.ownerId));
          if (personDoc.exists()) {
            const personData = personDoc.data();
            return {
              ...owner,
              firstName: personData.firstName || '',
              middleName: personData.middleName || '',
              lastName: personData.lastName || '',
              company: personData.company || ''
            };
          }
          return owner;
        })
      );
      setOwners(ownersWithDetails);
    } catch (error) {
      console.error("Error fetching owner details: ", error);
      message.error("Failed to fetch owner details");
    }
  }, []);

  const fetchPropertyInfo = useCallback(async () => {
    if (!uid) {
      message.error("No property ID provided.");
      navigate('/property');
      return;
    }

    setLoading(true);
    try {
      const propertyRef = doc(db, 'properties', uid);
      const generalSettingsRef = doc(db, 'properties', uid, 'propertySettings', 'general');
      const generalSettingsDoc = await getDoc(generalSettingsRef);
      const generalSettings = generalSettingsDoc.exists() ? generalSettingsDoc.data() : {};

      const ownersDocRef = doc(db, 'properties', uid, 'propertySettings', 'owners');
      const ownersDoc = await getDoc(ownersDocRef);
      const ownersData = ownersDoc.exists() ? ownersDoc.data().owners : [];
      
      console.log('Owners Data:', ownersData);

      const [propertyDoc] = await Promise.all([
        getDoc(propertyRef),
      ]);

      if (propertyDoc.exists()) {
        const data = propertyDoc.data();
        
        const fetchedProperty: Property = {
          key: propertyDoc.id,
          propertyName: generalSettings.propertyName || 'Unnamed Property',
          imageUrl: generalSettings.imageUrl || '',
          propertyType: generalSettings.propertyType || '',
          numberOfUnits: data.numberOfUnits || 0,
          status: data.status || '',
        };
        setProperty(fetchedProperty);
        
        const ownersList = ownersData.map((owner: any) => ({
          ownerId: owner.peopleId,
          percentage: owner.ownershipPercentage || 0,
          name: ''
        }));
        
        setOwners(ownersList);
        if (ownersList.length > 0) {
          await fetchOwnerDetails(ownersList);
        }
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
  }, [uid, navigate, fetchOwnerDetails]);

  const fetchPropertyPhotos = useCallback(async () => {
    if (!uid) return;

    try {
      const photosRef = collection(db, 'properties', uid, 'photos');
      const photosSnapshot = await getDocs(photosRef);
      
      const photos = photosSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        uploadDate: doc.data().uploadDate || Timestamp.now()
      })) as PropertyPhoto[];

      const sortedPhotos = photos.sort((a, b) => 
        b.uploadDate.seconds - a.uploadDate.seconds
      );

      setPropertyPhotos(sortedPhotos);
    } catch (error) {
      console.error("Error fetching property photos:", error);
      message.error("Failed to fetch property photos");
    }
  }, [uid]);

  useEffect(() => {
    fetchPropertyInfo();
    fetchPropertyPhotos();
  }, [fetchPropertyInfo, fetchPropertyPhotos]);


  const updatePropertyName = (newName: string) => {
    if (property) {
      setProperty({
        ...property,
        propertyName: newName
      });
    }
  };

  const handlePhotoCardClick = () => {
    setActiveTab('settings');
    setTimeout(() => {
      const event = new CustomEvent('showPhotosSection');
      window.dispatchEvent(event);
    }, 100);
  };

  const handleOwnerClick = (ownerId: string) => {
    navigate(`/people/${ownerId}`, { 
      state: { 
        returnPath: `/property/${uid}`,
        returnState: { activeTab: 'overview' }
      } 
    });
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div style={{ overflowY: 'hidden', overflowX: 'hidden' }}>
            <Card title="Quick Actions" size="small" className="property-info-unit-quick-actions-card" style={{ marginBottom: '24px' }}>
              {loading ? (
                <Skeleton active paragraph={{ rows: 0 }} />
              ) : (
                <Text>What would you like to do next?</Text>
              )}
              <Row gutter={16} style={{ marginTop: '16px' }}>
                <Col span={8}>
                  <Button 
                    type="primary"
                    icon={<IconClipboardList />}
                    onClick={() => setActiveTab('tasks')}
                    block
                    className="property-info-unit-tall-button"
                  >
                    New Task
                  </Button>
                </Col>
                <Col span={8}>
                  <Button 
                    type="primary"
                    icon={<IconUserCircle />}
                    onClick={() => {
                        setActiveTab('rental_applications');
                      setTimeout(() => {
                        const event = new CustomEvent('openNewRentalApplicationModal');
                        window.dispatchEvent(event);
                      }, 100);
                    }}
                    block
                    className="property-info-unit-tall-button"
                  >
                    View Rental Application
                  </Button>
                </Col>
                <Col span={8}>
                  <Button 
                    type="primary"
                    icon={<IconClipboardList />}
                    onClick={() => {
                      setActiveTab('notes');
                      setTimeout(() => {
                        const event = new CustomEvent('openNewNoteModal');
                        window.dispatchEvent(event);
                      }, 100);
                    }}
                    block
                    className="property-info-unit-tall-button"
                  >
                    Add Note
                  </Button>
                </Col>
              </Row>
            </Card>

            <Row gutter={[16, 16]}>
              {loading ? (
                <>
                  <Col span={6}><Card><Skeleton active paragraph={{ rows: 1 }} /></Card></Col>
                  <Col span={6}><Card><Skeleton active paragraph={{ rows: 1 }} /></Card></Col>
                  <Col span={6}><Card><Skeleton active paragraph={{ rows: 1 }} /></Card></Col>
                  <Col span={6}><Card><Skeleton active paragraph={{ rows: 1 }} /></Card></Col>
                </>
              ) : (
                <>
                  <Col span={6}>
                    <Card bodyStyle={{ height: '140px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <Space direction="vertical" align="center" size="small">
                        <IconBuildingEstate size={32} className="icon-building-estate-property-info" />
                        <div style={{ textAlign: 'center' }}>
                          <strong>Property Type</strong>
                          <div>{property?.propertyType}</div>
                        </div>
                      </Space>
                    </Card>
                  </Col>

                  <Col span={6}>
                    <Card bodyStyle={{ height: '140px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <Space direction="vertical" align="center" size="small">
                        <IconKey size={32} className="icon-circle-key-property-info" />
                        <div style={{ textAlign: 'center' }}>
                          <strong>Active Units</strong>
                          <div>{property?.numberOfUnits}</div>
                        </div>
                      </Space>
                    </Card>
                  </Col>

                  <Col span={6}>
                    <Card bodyStyle={{ height: '140px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <Space direction="vertical" align="center" size="small">
                        <IconUserCircle size={32} className="icon-circle-dashed-check-property-info" />
                        <div style={{ textAlign: 'center' }}>
                          <strong>Pending Applications</strong>
                          <div>{pendingApplicationsCount || 0}</div>
                        </div>
                      </Space>
                    </Card>
                  </Col>

                  <Col span={6}>
                    <Card bodyStyle={{ height: '140px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <Space direction="vertical" align="center" size="small">
                        <IconCircleDashedCheck size={32} className="icon-circle-dashed-check-property-info" />
                        <div style={{ textAlign: 'center' }}>
                          <strong>Status</strong>
                          <div style={{ color: 'green' }}>{property?.status || 'N/A'}</div>
                        </div>
                      </Space>
                    </Card>
                  </Col>
                </>
              )}
            </Row>

            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Card 
                  title="Photos" 
                  style={{ height: '100%', cursor: 'pointer' }}
                  hoverable
                  bodyStyle={{ padding: '8px', height: '320px' }}
                  onClick={handlePhotoCardClick}
                >
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr 1fr', 
                    gap: '8px', 
                    height: '100%',
                    maxHeight: '304px'
                  }}>
                    <div style={{ 
                      gridColumn: '1 / 2',
                      gridRow: '1 / 3',
                      background: '#f5f5f5',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      height: '330px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {propertyPhotos.length > 0 ? (
                        <div style={{ 
                          width: '100%', 
                          height: '100%', 
                          position: 'relative' 
                        }}>
                          <img 
                            src={propertyPhotos[0].fileUrl} 
                            alt="Main property"
                            style={{ 
                              width: '100%', 
                              height: '100%', 
                              objectFit: 'cover',
                              position: 'absolute',
                              top: 0,
                              left: 0
                            }}
                          />
                        </div>
                      ) : (
                        <Empty
                          image={<CameraOutlined style={{ fontSize: '32px', color: '#bfbfbf' }} />}
                          imageStyle={{ height: 'auto', marginBottom: '8px' }}
                          description="No photos available"
                        />
                      )}
                    </div>
                    
                    <div style={{ 
                      background: '#f5f5f5',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      height: '160px',
                      position: 'relative'
                    }}>
                      {propertyPhotos.length > 1 && (
                        <img 
                          src={propertyPhotos[1].fileUrl} 
                          alt="Property view 2"
                          style={{ 
                            width: '100%', 
                            height: '100%', 
                            objectFit: 'cover',
                            position: 'absolute',
                            top: 0,
                            left: 0
                          }}
                        />
                      )}
                    </div>

                    <div style={{ 
                      background: '#f5f5f5',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      height: '160px',
                      position: 'relative'
                    }}>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gridTemplateRows: '1fr 1fr',
                        gap: '2px',
                        height: '100%',
                        width: '100%'
                      }}>
                        {propertyPhotos.slice(2, 6).map((photo, index) => (
                          <div key={photo.id} style={{ 
                            width: '100%', 
                            height: '100%', 
                            overflow: 'hidden',
                            position: 'relative'
                          }}>
                            <img 
                              src={photo.fileUrl} 
                              alt={`Property view ${index + 3}`}
                              style={{ 
                                width: '100%', 
                                height: '100%', 
                                objectFit: 'cover',
                                position: 'absolute',
                                top: 0,
                                left: 0
                              }}
                            />
                          </div>
                        ))}
                      </div>

                      {propertyPhotos.length > 0 && (
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                          fontSize: '14px',
                          background: 'rgba(0, 0, 0, 0.6)',
                          cursor: 'pointer'
                        }}
                        onClick={() => setActiveTab('images')}
                        >
                          <div style={{
                            padding: '4px 12px',
                            background: 'rgba(255, 255, 255, 0.7)',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <PictureOutlined />
                            See all photos ({propertyPhotos.length})
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </Col>

              <Col span={12}>
                <Card 
                  title="Owners" 
                  style={{ height: '100%' }}
                  bodyStyle={{ height: '320px', overflowY: 'auto' }}
                >
                  {loading ? (
                    <Skeleton active paragraph={{ rows: 4 }} />
                  ) : (
                    owners.length > 0 ? (
                      <Row gutter={[16, 16]}>
                        {owners.map((owner, index) => (
                          <Col span={8} key={index}>
                            <Card 
                              hoverable 
                              onClick={() => handleOwnerClick(owner.ownerId)}
                              className="property-info-overview-owner-card"
                            >
                              <div className="owner-card-content" style={{ 
                                display: 'flex', 
                                flexDirection: 'column',
                                alignItems: 'center',
                                textAlign: 'center',
                                gap: '8px'
                              }}>
                                <div className="owner-icon">
                                  <Avatar
                                    size={48}
                                    style={{
                                      backgroundColor: '#f0f0f0',
                                      color: '#595959',
                                      fontSize: '20px'
                                    }}
                                  >
                                    {`${owner.firstName?.[0] || ''}${owner.lastName?.[0] || ''}`}
                                  </Avatar>
                                </div>                      
                                <div className="owner-details">
                                  <Title level={5} className="owner-name" style={{ margin: 0 }}>
                                    {[owner.firstName, owner.middleName, owner.lastName]
                                      .filter(Boolean)
                                      .join(' ')}
                                  </Title>
                                  {owner.company && (
                                    <Text className="owner-company" style={{ display: 'block' }}>
                                      {owner.company}
                                    </Text>
                                  )}
                                  <Text className="owner-percentage">
                                    {owner.percentage}% Ownership
                                  </Text>
                                </div>
                              </div>
                            </Card>
                          </Col>
                        ))}
                      </Row>
                    ) : (
                      <Empty description="No owners found" />
                    )
                  )}
                </Card>
              </Col>
            </Row>
          </div>
        );
      case 'reports':
        return <PropertyReports />;
      case 'units':
        return property ? <PropertyUnits propertyId={property.key} /> : null;
      case 'leases':
        return <PropertyLeases />;
      case 'tenants':
        return property && <PropertyTenants propertyId={property.key} />;
      case 'rental_applications':
        return property && <PropertyRentalApplications propertyId={property.key} />;
      case 'listings':
        return property && <PropertyListings />;
      case 'signatures':
        return property && <PropertySignatures />;
      case 'tasks':
        return property && <PropertyInfoTasks propertyId={property.key} />;
      case 'files':
        return property && <PropertyinfoFiles propertyId={property.key} />;
      case 'notes':
        return property && <PropertyinfoNotes propertyId={property.key} />;
      case 'settings':
        return property && (
          <PropertyInfoSettings 
            property={property} 
            updatePropertyName={updatePropertyName}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="property-info-overview-page" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div className="property-info-overview-top-container" style={{ flexShrink: 0 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '40px',
          }}
        >
          <Button icon={<LeftOutlined />} onClick={handleBackClick}>
            Back
          </Button>
          
        </div>

        <div className="property-info-unit-details-header">
          <Row justify="space-between" align="middle">
            <Col>
              <Space direction="vertical" size="small">
                <Title level={2} style={{ marginBottom: '0' }}>
                  {property?.propertyName || 'Loading...'}
                </Title>
              </Space>
            </Col>
          </Row>
        </div>
      </div>

      <div className="property-info-overview-menu" style={{ flexShrink: 0 }}>
        <Tabs activeKey={activeTab} onChange={key => setActiveTab(key)}>
          <TabPane tab="Overview" key="overview" />
          <TabPane tab="Reports" key="reports" />
          <TabPane tab="Units" key="units" />
          <TabPane tab="Leases" key="leases" />
          <TabPane tab="Tenants" key="tenants" />
          <TabPane tab="Rental Applications" key="rental_applications" />
          <TabPane tab="Listings" key="listings" />
          <TabPane tab="Signatures Requests" key="signatures" />
          <TabPane tab="Tasks" key="tasks" />
          <TabPane tab="Files" key="files" />
          <TabPane tab="Notes" key="notes" />
          <TabPane tab="Settings" key="settings" />
        </Tabs>
      </div>

      <div className="property-info-content" style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
        {renderContent()}
      </div>
    </div>
  );
};

export default PropertyOverview;
