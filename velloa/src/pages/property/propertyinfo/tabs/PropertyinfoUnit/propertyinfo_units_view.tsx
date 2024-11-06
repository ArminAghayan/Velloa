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
  Divider,
  Tag,
  Empty,
} from 'antd';
import { 
  LeftOutlined, 
  MoreOutlined, 
  EditOutlined,
  DeleteOutlined,
  HomeOutlined,
  ExpandOutlined,
  DollarOutlined,
  UserOutlined,
  ToolOutlined,
  ProfileOutlined,
  FileTextOutlined,
  MailTwoTone,
  PhoneTwoTone,
  PlusOutlined,
  CalendarOutlined,
  SafetyOutlined,
  GlobalOutlined,
  MailOutlined,
  CameraOutlined,
  PictureOutlined,
} from '@ant-design/icons';
import { getFirestore, doc, getDoc, collection, getDocs, Timestamp } from 'firebase/firestore';
import './propertyinfo_units_view.css';
import PropertyinfoUnitMaintenance from './propertyinfo_units_Maintenance';
import NewTaskDrawer from '../../../../maintenance/Tasks/NewTaskDrawer';
import PropertyUnitFiles from './propertyinfo_units_files';
import PropertyinfoUnitImages from './propertyinfo_units_images';
import PropertyUnitNotes from './propertyinfo_units_notes';

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
  tenantId?: string;
}

interface Tenant {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  email?: string;
  phone?: string;
  depositAmount?: string;
  depositDueDate?: Timestamp;
  lateFeeAmount?: string;
  lateFeeStartDay?: string;
  leaseStartDate?: Timestamp;
  leaseEndDate?: Timestamp;
  moveInDate?: Timestamp;
  paymentDate?: string;
  rentAmount?: string;
  rentDueDate?: string;
  rentersInsurance?: boolean;
  inviteToPortal?: boolean;
  unitId?: string;
}

interface UnitImage {
  id: string;
  url: string;
  fileUrl: string;
  fileName: string;
  createdAt: Timestamp;
  isVideo: boolean;
}

const formatDate = (timestamp: Timestamp | undefined) => {
  if (!timestamp) return 'Not Set';
  return timestamp.toDate().toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric'
  });
};

const PropertyInfoUnitView: React.FC = () => {
  const navigate = useNavigate();
  const { propertyId, unitId } = useParams<{ propertyId: string; unitId: string }>();
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [property, setProperty] = useState<Property | null>(null);
  const [unit, setUnit] = useState<Unit | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editedUnit, setEditedUnit] = useState<Unit | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [unitImages, setUnitImages] = useState<UnitImage[]>([]);

  // Menu items for the dropdown
  const menuItems: MenuProps['items'] = [
    {
      key: 'delete',
      label: 'Delete Unit',
      danger: true,
    },
  ];

  const handleEdit = (type: string) => {
    console.log('Edit', type);
    // Implement edit functionality
  };

  const handleNewNote = () => {
    setActiveTab('notes');
  };

  const handleAddImage = () => {
    console.log('Add Image');
    // Implement image addition
  };

  const handleNewWorkOrder = () => {
    console.log('New Work Order');
    // Implement work order creation
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!propertyId || !unitId) return;

      const db = getFirestore();
      try {
        setIsLoading(true);
        
        // First get the propertySettings collection
        const propertySettingsCollection = collection(db, 'properties', propertyId, 'propertySettings');
        const propertySettingsSnapshot = await getDocs(propertySettingsCollection);
        
        // Get the first (and should be only) document from propertySettings
        const propertySettingsDoc = propertySettingsSnapshot.docs[0];
        const unitDoc = await getDoc(doc(db, 'properties', propertyId, 'units', unitId));

        if (propertySettingsDoc && unitDoc.exists()) {
          const unitData = { unitId: unitDoc.id, ...unitDoc.data() } as Unit;
          setUnit(unitData);
          setProperty({ 
            id: propertyId, 
            ...propertySettingsDoc.data() 
          } as Property);

          // If unit has a tenantId, fetch tenant details
          if (unitData.tenantId) {
            const tenantDoc = await getDoc(doc(db, 'people', unitData.tenantId));
            if (tenantDoc.exists()) {
              const tenantData = {
                id: tenantDoc.id,
                ...tenantDoc.data(),
                // Convert any Timestamp fields
                depositDueDate: tenantDoc.data().depositDueDate,
                leaseStartDate: tenantDoc.data().leaseStartDate,
                leaseEndDate: tenantDoc.data().leaseEndDate,
                moveInDate: tenantDoc.data().moveInDate,
              } as Tenant;
              setTenant(tenantData);
            }
          }
        } else {
          message.error('Property or unit not found');
        }

        // Fetch unit images
        const imagesCollection = collection(db, 'properties', propertyId, 'units', unitId, 'images');
        const imagesSnapshot = await getDocs(imagesCollection);
        const imagesData = imagesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as UnitImage[];
        setUnitImages(imagesData);
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

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <>
            {/* Quick Actions Card */}
            <Card title="Quick Actions" size="small" className="property-info-unit-quick-actions-card" style={{ marginBottom: '24px' }}>
              <Text>What would you like to do next?</Text>
              <Row gutter={16} style={{ marginTop: '16px' }}>
                <Col span={8}>
                  <Button 
                    type="primary"
                    icon={<ToolOutlined />}
                    block
                    className="property-info-unit-tall-button"
                    onClick={handleNewWorkOrder}
                  >
                    New Work Order
                  </Button>
                </Col>
                <Col span={8}>
                  <Button 
                    type="primary"
                    icon={<ProfileOutlined />}
                    block
                    className="property-info-unit-tall-button"
                    onClick={handleNewNote}
                  >
                    New Note
                  </Button>
                </Col>
                <Col span={8}>
                  <Button 
                    type="primary"
                    icon={<FileTextOutlined />}
                    block
                    className="property-info-unit-tall-button"
                    onClick={handleAddImage}
                  >
                    Add Image
                  </Button>
                </Col>
              </Row>
            </Card>

            {/* Unit Stats Cards */}
            <Row gutter={[16, 16]}>
              <Col span={6}>
                <Card bodyStyle={{ height: '140px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <Space direction="vertical" align="center" size="small">
                    <div style={{ fontSize: '32px' }}>
                      <HomeOutlined />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <strong>Beds</strong>
                      <div>{unit?.beds || 'Not Set'}</div>
                    </div>
                  </Space>
                </Card>
              </Col>

              <Col span={6}>
                <Card bodyStyle={{ height: '140px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <Space direction="vertical" align="center" size="small">
                    <div style={{ fontSize: '32px' }}>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <strong>Baths</strong>
                      <div>{unit?.baths || 'Not Set'}</div>
                    </div>
                  </Space>
                </Card>
              </Col>

              <Col span={6}>
                <Card  bodyStyle={{ height: '140px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <Space direction="vertical" align="center" size="small">
                    <div style={{ fontSize: '32px' }}>
                      <ExpandOutlined />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <strong>Size</strong>
                      <div>{unit?.size ? `${unit.size} sqft` : 'Not Set'}</div>
                    </div>
                  </Space>
                </Card>
              </Col>

              <Col span={6}>
                <Card bodyStyle={{ height: '140px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <Space direction="vertical" align="center" size="small">
                    <div style={{ fontSize: '32px' }}>
                      <DollarOutlined />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <strong>Market Rent</strong>
                      <div>{unit?.marketRent ? `$${unit.marketRent}` : 'Not Set'}</div>
                    </div>
                  </Space>
                </Card>
              </Col>
            </Row>

            {/* Maintenance History and Tenant Information */}
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Card 
                  title="Images" 
                  style={{ height: '100%', cursor: 'pointer' }}
                  onClick={() => setActiveTab('images')}
                  hoverable
                  bodyStyle={{ padding: '8px', height: '320px' }}
                >
                  {/* Image Grid Container */}
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr 1fr', 
                    gap: '8px', 
                    height: '100%',
                    maxHeight: '304px'
                  }}>
                    {/* Main Large Image */}
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
                      {unitImages.length > 0 ? (
                        <div style={{ 
                          width: '100%', 
                          height: '100%', 
                          position: 'relative' 
                        }}>
                          <img 
                            src={unitImages[0].fileUrl} 
                            alt="Main unit"
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
                          description="No images available"
                        />
                      )}
                    </div>
                    
                    {/* Second Image */}
                    <div style={{ 
                      background: '#f5f5f5',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      height: '160px',
                      position: 'relative'
                    }}>
                      {unitImages.length > 1 && (
                        <img 
                          src={unitImages[1].fileUrl} 
                          alt="Unit view 2"
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

                    {/* Grid of Remaining Images */}
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
                        {unitImages.slice(2, 6).map((image, index) => (
                          <div key={image.id} style={{ 
                            width: '100%', 
                            height: '100%', 
                            overflow: 'hidden',
                            position: 'relative'
                          }}>
                            <img 
                              src={image.fileUrl} 
                              alt={`Unit view ${index + 3}`}
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

                      {/* Overlay Text */}
                      {unitImages.length > 0 && (
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
                          background: 'rgba(0, 0, 0, 0.6)', // Darker tint
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
                            See all photos ({unitImages.length})
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </Col>

              <Col span={12}>
                <Card 
                  title="Tenant Information" 
                  style={{ height: '100%', cursor: 'pointer' }}
                  hoverable
                  onClick={() => handleEdit('tenant')}
                >
                  {tenant ? (
                    <Row gutter={[24, 16]}>
                      {/* Left Column */}
                      <Col span={12}>
                        <Space direction="vertical" size="middle" style={{ width: '100%'}}>
                          <Space direction="vertical" style={{ width: '100%' }}>
                            <Space>
                              <UserOutlined style={{ color: '#1890ff' }}/>
                              <Text strong>{`${tenant.firstName} ${tenant.lastName}`}</Text>
                            </Space>
                            <Space>
                              <MailTwoTone />
                              <Text>{tenant.email || 'No Email'}</Text>
                            </Space>
                            <Space>
                              <PhoneTwoTone />
                              <Text type="secondary">{tenant.phone || 'No Phone Number'}</Text>
                            </Space>
                          </Space>

                          <Divider style={{ margin: '8px 0' }} />

                          {/* Rental Insurance and Portal Access */}
                          <Space direction="vertical" style={{ width: '100%' }}>
                            <Space direction="vertical" style={{ width: '100%' }}>
                              <Space>
                                <SafetyOutlined style={{ color: '#1890ff' }}/>
                                <Text strong>Rental Insurance:</Text>
                              </Space>
                              <Space style={{ marginLeft: '24px' }}>
                                {tenant.rentersInsurance ? (
                                  <Tag color="success">Activated</Tag>
                                ) : (
                                  <Tag color="warning">Not Active</Tag>
                                )}
                              </Space>
                            </Space>

                            <Divider style={{ margin: '8px 0' }} />

                            <Space direction="vertical" style={{ width: '100%' }}>
                              <Space>
                                <GlobalOutlined style={{ color: '#1890ff' }}/>
                                <Text strong>Portal Access:</Text>
                              </Space>
                              <Space style={{ marginLeft: '24px' }}>
                                {tenant.inviteToPortal ? (
                                  <Tag color="success">Activated</Tag>
                                ) : (
                                  <Space>
                                    <Tag color="warning">Not Invited</Tag>
                                    <Button type="link" size="small" icon={<MailOutlined />}>
                                      Send Invite
                                    </Button>
                                  </Space>
                                )}
                              </Space>
                            </Space>
                          </Space>
                        </Space>
                      </Col>

                      {/* Right Column */}
                      <Col span={12}>
                        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                          <Space direction="vertical" style={{ width: '100%' }}>
                            <Space>
                              <CalendarOutlined style={{ color: '#52c41a' }}/>
                              <Text strong>Lease Period:</Text>
                            </Space>
                            <Space direction="vertical" style={{ marginLeft: '24px' }}>
                              <Text>Start Date: {formatDate(tenant.leaseStartDate)}</Text>
                              <Text>End Date: {formatDate(tenant.leaseEndDate)}</Text>
                              <Text>Move-in Date: {formatDate(tenant.moveInDate)}</Text>
                            </Space>
                          </Space>

                          <Divider style={{ margin: '8px 0' }} />

                          {/* Financial Information */}
                          <Space direction="vertical" style={{ width: '100%' }}>
                            <Space>
                              <DollarOutlined style={{ color: '#52c41a' }}/>
                              <Text strong>Financial Details:</Text>
                            </Space>
                            <Space direction="vertical" style={{ marginLeft: '24px' }}>
                              <Text>Monthly Rent: ${tenant.rentAmount || 'Not Set'}</Text>
                              <Text>Security Deposit: ${tenant.depositAmount || 'Not Set'}</Text>
                              <Text>Late Fee: ${tenant.lateFeeAmount || 'Not Set'}</Text>
                            </Space>
                          </Space>
                        </Space>
                      </Col>
                    </Row>
                  ) : (
                    <div style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      padding: '20px 0',
                      color: '#8c8c8c',
                      height: '100%'
                    }}>
                      <UserOutlined style={{ fontSize: '24px', marginBottom: '8px' }} />
                      <Text type="secondary">No Tenant Assigned</Text>
                      <Button 
                        type="link" 
                        icon={<PlusOutlined />}
                        style={{ marginTop: '8px' }}
                      >
                        Assign Tenant
                      </Button>
                    </div>
                  )}
                </Card>
              </Col>
            </Row>
          </>
        );
      case 'maintenance':
        return (
          <PropertyinfoUnitMaintenance 
            personId={propertyId || ''} 
            companyId={propertyId || ''} 
            unitId={unitId || ''}
          />
        );
      case 'listings':
        return <div>Listings Content</div>;
      case 'notes':
        return <PropertyUnitNotes propertyId={propertyId || ''} unitId={unitId || ''} />;
      case 'images':
        return <PropertyinfoUnitImages propertyId={propertyId || ''} unitId={unitId || ''} />;
      case 'files':
        return <PropertyUnitFiles propertyId={propertyId || ''} unitId={unitId || ''} />;
      default:
        return null;
    }
  };

  return (
    <div className="property-info-unit-details-page" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header Section */}
      <div className="property-info-unit-details-top-container" style={{ flexShrink: 0 }}>
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

      {/* Tabs Menu */}
      <div className="property-info-unit-details-menu" style={{ flexShrink: 0 }}>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="Overview" key="overview" />
          <TabPane tab="Maintenance" key="maintenance" />
          <TabPane tab="Listings" key="listings" />
          <TabPane tab="Notes" key="notes" />
          <TabPane tab="Images" key="images" />
          <TabPane tab="Files" key="files" />
        </Tabs>
      </div>

      {/* Content Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
        {renderContent()}
      </div>

      {/* Drawers */}
      {propertyId && (
        <>
         
        </>
      )}
    </div>
  );
};

export default PropertyInfoUnitView;
