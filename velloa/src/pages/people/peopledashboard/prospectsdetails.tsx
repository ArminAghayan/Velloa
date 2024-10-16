import React, { useState, useEffect, useCallback } from 'react';
import { Typography, Button, Tabs, Card, Row, Col, Space, Dropdown, Menu, message, Skeleton, Tooltip } from 'antd';
import { LeftOutlined, MoreOutlined, CheckCircleOutlined, SearchOutlined, UserOutlined, DollarOutlined, CalendarOutlined, FlagOutlined, CreditCardOutlined, MailOutlined, PhoneOutlined, EnvironmentOutlined, HomeOutlined, FileTextOutlined, PlusOutlined, ProfileOutlined } from '@ant-design/icons';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { db, auth } from '../../../firebase-config';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import './peopledetails.css';
const { Title, Text } = Typography;
const { TabPane } = Tabs;

interface PropertyUnit {
  id: string;
  name: string;
  unit: string;
}

interface PropertyUnitWithDetails extends PropertyUnit {
  unitName?: string;
}

export interface PersonDetails {
    key: string;
    name: string | null;
    firstName: string | null;
    middleName: string | null;
    lastName: string | null;
    type: string | null;
    properties: PropertyUnitWithDetails[];
    assignees: { id: string; name: string}[]; // Added 'name'
    phones: { id: string; phone: string; }[];
    postalCode: string | null;
    state: string | null;   
    street: string | null;
    updatedAt: string | null;
    vehicles: { id: string; make: string; model: string; year: string; }[] ;
    notes: { id: string; note: string; }[];
    emails: { id: string; address: string; }[];
    addresses: { id: string; address: string; }[];
    leadSource: string | null;
    leadStatus: string | null;
    creditScore: string | null;
    moveInDate: string | null;
    monthlyIncome: string | null;
    lookingFor: string | null;
    applicationStatus: string | null;
    maxRent?: number;
    minBathrooms?: number;
    minBedrooms?: number;
  }
  
  const ProspectsDetailsPage: React.FC = () => {
    const { personId } = useParams<{ personId: string }>();
    const navigate = useNavigate();
    const [personDetails, setPersonDetails] = useState<PersonDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [editDrawerVisible, setEditDrawerVisible] = useState(false);
    const [companyId, setCompanyId] = useState<string | null>(null);
    const [showCompletionScreen, setShowCompletionScreen] = useState(false);
    const location = useLocation();

    const getFullName = (person: PersonDetails) => {
      const firstName = person.firstName || '';
      const middleName = person.middleName || '';
      const lastName = person.lastName || '';
      return `${firstName} ${middleName} ${lastName}`.trim();
    };
  
    const truncateString = (str: string | undefined, num: number) => {
      if (!str) return '';
      if (str.length <= num) {
        return str;
      }
      return str.slice(0, num) + '...';
    };
  
    const fetchCompanyId = useCallback(async () => {
      if (!auth.currentUser) {
        console.error('No authenticated user');
        return null;
      }
      try {
        const companiesQuery = query(
          collection(db, 'companies'),
          where(`members.${auth.currentUser.uid}`, '!=', null)
        );
        const companiesSnapshot = await getDocs(companiesQuery);
        if (companiesSnapshot.empty) {
          console.error('User is not a member of any company');
          return null;
        }
        return companiesSnapshot.docs[0].id;
      } catch (error) {
        console.error('Error fetching company ID:', error);
        return null;
      }
    }, []);
  
    const fetchPersonDetails = useCallback(async () => {
      if (!personId || !companyId) {
        console.log('Missing personId or companyId:', { personId, companyId });
        return;
      }
  
      try {
        setLoading(true);
        console.log('Fetching person details for personId:', personId);
  
        const personDocRef = doc(db, 'people', personId);
        const personDocSnap = await getDoc(personDocRef);
  
        if (!personDocSnap.exists()) {
          throw new Error('Person document does not exist');
        }
  
        const personData = personDocSnap.data() as PersonDetails;
  
        const propertyPromises = personData.properties.map(async (prop) => {
          console.log('Fetching property:', prop.id);
          
          let unitName = 'Unknown Unit';
          if (prop.unit) {
            console.log('Fetching unit:', prop.unit);
            const unitDocRef = doc(db, 'properties', prop.id, 'units', prop.unit);
            const unitDocSnap = await getDoc(unitDocRef);
            if (unitDocSnap.exists()) {
              const unitData = unitDocSnap.data();
              console.log('Unit data:', unitData);
              unitName = unitData.unitName || 'Unnamed Unit';
            } else {
              console.log('Unit document does not exist');
            }
          }
          console.log('Unit name:', unitName);

          return {
            ...prop,
            unitName
          };
        });

        const propertiesWithDetails = await Promise.all(propertyPromises);
        console.log('Properties with details:', propertiesWithDetails);

        const fullPersonData = {
          ...personData,
          key: personDocSnap.id,
          properties: propertiesWithDetails,
          // ... other fields ...
        };

        console.log('Fetched person details:', JSON.stringify(fullPersonData, null, 2));
        setPersonDetails(fullPersonData);

      } catch (error) {
        console.error('Error fetching person details:', error);
        if (error instanceof Error) {
          message.error(`Failed to fetch person details: ${error.message}`);
        } else {
          message.error('Failed to fetch person details due to an unknown error.');
        }
      } finally {
        setLoading(false);
      }
    }, [personId, companyId]);
  
    useEffect(() => {
      const init = async () => {
        const fetchedCompanyId = await fetchCompanyId();
        if (fetchedCompanyId) {
          setCompanyId(fetchedCompanyId);
        } else {
          message.error('Failed to fetch company information.');
        }
      };
      init();
    }, [fetchCompanyId]);
  
    useEffect(() => {
      if (companyId) {
        fetchPersonDetails();
      }
    }, [fetchPersonDetails, companyId]);
  

    useEffect(() => {
        const fetchData = async () => {
          // Attempt to get personDetails from state
          const state = location.state as { personDetails?: PersonDetails };
          if (state?.personDetails) {
            setPersonDetails(state.personDetails);
            setLoading(false);
          } else if (personId && companyId) {
            // If accessed directly via URL, fetch the data
            await fetchPersonDetails();
          } else if (!personId) {
            message.error("No person selected.");
            navigate('/people');
          }
        };

        fetchData();
    }, [location.state, personId, companyId, fetchPersonDetails, navigate]);
    
   if (loading) {
     return <Skeleton active />;
   }
 
   console.log('Rendering with personDetails:', JSON.stringify(personDetails, null, 2)); // Log before rendering
 
   if (!personDetails) {
     return <div>Person not found</div>;
   }
 
  const fullName = getFullName(personDetails);

  const menu = (
    <Menu>
      <Menu.Item key="1">Edit</Menu.Item>
      <Menu.Item key="2">Delete</Menu.Item>
    </Menu>
  );

  const iconStyle = {
    fontSize: '32px',
  };

  const handleEmailClick = (email: string) => {
    window.location.href = `mailto:${email}`;
  };

  return (
        <div className="prospects-details-page">
          <div className="prospects-details-top-container">
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
    
            <div className="prospects-details-header">
              <Row justify="space-between" align="middle">
                <Col>
                  <Space direction="vertical" size="small">
                    <Title level={2} style={{ marginBottom: '5px' }}>
                      {fullName ? truncateString(fullName, 40) : 'No Name'}
                      {!fullName && (
                        <span style={{ fontSize: '14px', color: 'red' }}> (Name is missing)</span>
                      )}
                    </Title>
                  </Space>
                </Col>
                <Col>
                  <Space>
                  </Space>
                </Col>
              </Row>
            </div>
          </div>
    
          <div className="prospects-details-menu">
            <Tabs>
              <TabPane tab="Overview" key="overview" />
              <TabPane tab="Rental Application" key="rental-application" />
              <TabPane tab="Notes" key="notes" />
              <TabPane tab="Files" key="files" />
            </Tabs>
          </div>


      {/* Rest of the content with original background */}
      <div style={{ padding: '24px' }}>
        {/* Quick Actions */}
        <Card 
        title="Quick Actions" 
        size="small"
        className="prospects-details-quick-actions-card"
        style={{ marginBottom: '24px' }}>
          <Text className="prospects-details-quick-actions-text">What would you like to do next?</Text>
          <Row gutter={16} style={{ marginTop: '16px' }}>
            <Col span={8}>
              <Button 
              type="primary"
              icon={<FileTextOutlined />}
              block
              className="prospects-details-tall-button"
              >
              View Rental Application
              </Button>
            </Col>
            <Col span={8}>
              <Button 
              type="primary"
              icon={<CheckCircleOutlined />}
              block
              className="prospects-details-tall-button"
              >
              New Task
              </Button>
            </Col>
            <Col span={8}>
              <Button 
              type="primary"
              icon={<ProfileOutlined />}
              block
              className="prospects-details-tall-button"
              >
              New Lease
              </Button>
            </Col>
          </Row>
        </Card>

        {/* Status Cards */}
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col span={8}>
            <Card bodyStyle={{ height: '140px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Space direction="vertical" align="center" size="small">
                <div style={{ ...iconStyle, color: '#52c41a' }}>
                  <CheckCircleOutlined />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <strong>Status</strong>
                  <div>{personDetails.applicationStatus ? personDetails.applicationStatus : 'No Status'}</div>
                </div>
              </Space>
            </Card>
          </Col>
          <Col span={8}>
            <Card bodyStyle={{ height: '140px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Space direction="vertical" align="center" size="small">
                <div style={iconStyle}>
                  <SearchOutlined />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <strong>Looking For</strong>
                  <div>{personDetails.lookingFor ? personDetails.lookingFor : 'No Looking For'}</div>
                </div>
              </Space>
            </Card>
          </Col>
          <Col span={8}>
            <Card bodyStyle={{ height: '140px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Space direction="vertical" align="center" size="small">
                <div style={iconStyle}>
                  <UserOutlined />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <strong>Assigned To</strong>
                  <div>
                    {personDetails.assignees && personDetails.assignees.length > 0 ? (
                      <>
                        {personDetails.assignees[0].name}
                        {personDetails.assignees.length > 1 && (
                          <Tooltip title={personDetails.assignees.map(assignee => assignee.name).join(', ')}>
                            <Text style={{ marginLeft: '5px', color: '#1890ff' }}>
                              +{personDetails.assignees.length - 1}
                            </Text>
                          </Tooltip>
                        )}
                      </>
                    ) : (
                      'No Assignees'
                    )}
                  </div>
                </div>
              </Space>
            </Card>
          </Col>
        </Row>

        {/* Additional Info Cards */}
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col span={6}>
            <Card bodyStyle={{ height: '140px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Space direction="vertical" align="center" size="small">
                <div style={iconStyle}>
                  <DollarOutlined />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <strong>Monthly Income</strong>
                  <div>{personDetails.monthlyIncome ? personDetails.monthlyIncome : 'Not set'}</div>
                </div>
              </Space>
            </Card>
          </Col>
          <Col span={6}>
            <Card bodyStyle={{ height: '140px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Space direction="vertical" align="center" size="small">
                <div style={iconStyle}>
                  <CalendarOutlined />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <strong>Move-in date</strong>
                  <div>12/20/2023</div>
                </div>
              </Space>
            </Card>
          </Col>
          <Col span={6}>
            <Card bodyStyle={{ height: '140px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Space direction="vertical" align="center" size="small">
                <div style={iconStyle}>
                  <FlagOutlined />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <strong>Lead Source</strong>
                  <div>
                    {personDetails.leadSource 
                      ? personDetails.leadSource.toUpperCase()
                      : 'NOT SET'}
                  </div>
                </div>
              </Space>
            </Card>
          </Col>
          <Col span={6}>
            <Card bodyStyle={{ height: '140px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Space direction="vertical" align="center" size="small">
                <div style={iconStyle}>
                  <CreditCardOutlined />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <strong>Credit Score</strong>
                  <div>{personDetails.creditScore ? personDetails.creditScore : 'Not set'}</div>
                </div>
              </Space>
            </Card>
          </Col>
        </Row>

        {/* Contact Info, Address, and Interests */}
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Card title="Contact Info" style={{ height: '100%' }}>
              <Space direction="vertical">
                <Space>
                  <MailOutlined />
                  {personDetails.emails && personDetails.emails.length > 0 ? (
                    <>
                      <Text 
                        onClick={() => handleEmailClick(personDetails.emails[0].address)} 
                        style={{ cursor: 'pointer' }}
                      >
                        {personDetails.emails[0].address}
                      </Text>
                      {personDetails.emails.length > 1 && (
                        <Tooltip title={personDetails.emails.slice(1).map(e => e.address).join(', ')}>
                          <Text style={{ color: '#1890ff' }}>+{personDetails.emails.length - 1}</Text>
                        </Tooltip>
                      )}
                    </>
                  ) : (
                    <Text>No Emails</Text>
                  )}
                </Space>
                <Space>
                  <PhoneOutlined />
                  {personDetails.phones && personDetails.phones.length > 0 ? (
                    <>
                      <Text>{personDetails.phones[0].phone}</Text>
                      {personDetails.phones.length > 1 && (
                        <Tooltip title={personDetails.phones.slice(1).map(p => p.phone).join(', ')}>
                          <Text style={{ color: '#1890ff' }}>+{personDetails.phones.length - 1}</Text>
                        </Tooltip>
                      )}
                    </>
                  ) : (
                    <Text>No phone number</Text>
                  )}
                </Space>
              </Space>
            </Card>
          </Col>
          <Col span={12}>
            <Card 
              title="Address" 
              style={{ height: '100%' }}
              extra={<Button style={{ color: '#188034' }} icon={<PlusOutlined />} type="link">Add New</Button>}
            >
              <Space>
                <EnvironmentOutlined />
                <Text>{personDetails.addresses ? personDetails.addresses.map(address => address.address).join(', ') : 'No Address'}</Text>
              </Space>
            </Card>
          </Col>
          <Col span={12}>
            <Card title="Interests" style={{ height: '100%' }}>
              <Space direction="vertical">
                {personDetails.properties && personDetails.properties.length > 0 ? (
                  personDetails.properties.map((property) => (
                    <Space key={property.id}>
                      <HomeOutlined />
                      <Text>
                        {property.name}
                        {property.unitName && property.unitName !== 'Unknown Unit' && 
                          ` - Unit: ${property.unitName}`
                        }
                      </Text>
                    </Space>
                  ))
                ) : (
                  <Space>
                    <HomeOutlined />
                    <Text>No Properties or Units</Text>
                  </Space>
                )}
              </Space>
            </Card>
          </Col>
          <Col span={12}>
            {/* Placeholder for future content or empty space */}
            <div style={{ height: '100%' }}></div>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default ProspectsDetailsPage;
