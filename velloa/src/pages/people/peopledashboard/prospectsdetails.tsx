import React, { useState, useEffect, useCallback } from 'react';
import { Typography, Button, Tabs, Card, Row, Col, Space, Dropdown, Menu, message, Tooltip, Modal } from 'antd';
import { LeftOutlined, MoreOutlined, CheckCircleOutlined, SearchOutlined, UserOutlined, DollarOutlined, CalendarOutlined, FlagOutlined, CreditCardOutlined, MailTwoTone, PhoneTwoTone, EnvironmentTwoTone, HomeTwoTone, FileTextOutlined, PlusOutlined, ProfileOutlined, SendOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../../../firebase-config';
import { collection, getDocs, query, where, Timestamp, doc, getDoc, deleteDoc } from 'firebase/firestore'; // Added doc and getDoc
import './peopledetails.css';
import NewTaskDrawer from '../../maintenance/Tasks/PeopleTaskDrawer';
import TasksTab from './ProspectsDetailsTasks';
import ProspectsDetailsNotes from './ProspectsDetailsNotes';
import ProspectsFilesPage from './ProspectsFilesPage';
import EditPersonDrawer from './EditPersonDrawer'; // You'll need to create this component
const { Title, Text } = Typography;
const { TabPane } = Tabs;

interface PropertyUnit {
  property: string;
  unit: string;
}

interface PropertyUnitDetails {
  propertyName: string;
  unitName: string;
}

interface Address {
  postalCode: string;
  country: string;
  state: string;
  street: string;
  city: string;
}

interface PersonDetails {
  key: string;
  name: string | null;
  firstName: string | null;
  middleName: string | null;
  peopleType: string | null;
  lastName: string | null;
  properties: PropertyUnit[];
  phones: { id: string; number: string; }[];
  postalCode: string | null;
  state: string | null;   
  street: string | null;
  updatedAt: string | null;
  vehicles: { id: string; make: string; model: string; year: string; }[];
  notes: { id: string; note: string; }[];
  emails: { id: string; address: string; }[];
  addresses: Address[];
  leadSource: string | null;
  leadStatus: string | null;
  creditScore: string | null;
  moveInDate: string;
  monthlyIncome: string | null;
  applicationStatus: string | null;
  maxRent?: number;
  minBathrooms?: number;
  minBedrooms?: number;
  assignees?: { uid: string }[];
}

interface AssigneeWithName {
  uid: string;
  name: string;
}

const ProspectsDetailsPage: React.FC = () => {
  const { peopleId } = useParams<{ peopleId?: string }>();
  const navigate = useNavigate();
  const [personDetails, setPersonDetails] = useState<PersonDetails | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [newTaskDrawerVisible, setNewTaskDrawerVisible] = useState(false);
  const [loading, setLoading] = useState<boolean>(false); // Added loading state
  const [assigneesWithNames, setAssigneesWithNames] = useState<AssigneeWithName[]>([]);
  const [propertyUnitDetails, setPropertyUnitDetails] = useState<{ [key: string]: PropertyUnitDetails }>({});
  const [editDrawerVisible, setEditDrawerVisible] = useState(false);

  const getFullName = (person: PersonDetails) => {
    const firstName = person.firstName || '';
    const middleName = person.middleName || '';
    const lastName = person.lastName || '';
    return `${firstName} ${middleName} ${lastName}`.trim();
  };

  const formatDate = (date: string | Timestamp | { seconds: number; nanoseconds: number } | undefined) => {
    if (!date) return 'N/A';
    let dateObj: Date;
    if (typeof date === 'string') {
      dateObj = new Date(date);
    } else if (date instanceof Timestamp) {
      dateObj = date.toDate();
    } else if (typeof date === 'object' && 'seconds' in date && 'nanoseconds' in date) {
      dateObj = new Date(date.seconds * 1000 + date.nanoseconds / 1000000);
    } else {
      return 'Invalid Date';
    }
    return isNaN(dateObj.getTime()) ? 'Invalid Date' : dateObj.toLocaleDateString();
  };

  const truncateString = (str: string | undefined, num: number) => {
    if (!str) return '';
    if (str.length <= num) {
      return str;
    }
    return str.slice(0, num) + '...';
  };
  const handleDelete = async () => {
    Modal.confirm({
      title: 'Are you sure you want to delete this person?',
      content: 'This action cannot be undone. All associated data will be deleted.',
      onOk: async () => {
        try {
          if (!peopleId || !companyId) {
            throw new Error("Missing person ID or company ID");
          }

          // Delete the person document
          await deleteDoc(doc(db, 'people', peopleId));

          message.success('Person deleted successfully');
          navigate('/people'); // Navigate back to the people list
        } catch (error) {
          console.error('Error deleting person:', error);
          message.error('Failed to delete person');
        }
      },
    });
  };

  const handleEdit = () => {
    setEditDrawerVisible(true);
  };

  const menu = (
    <Menu>
      <Menu.Item key="1" onClick={handleEdit} icon={<EditOutlined />}>
        Edit
      </Menu.Item>
      <Menu.Item key="2" onClick={handleDelete} icon={<DeleteOutlined />} danger>
        Delete
      </Menu.Item>
    </Menu>
  );

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
    const fetchData = async () => {
      if (peopleId) {
        setLoading(true);
        try {
          const personDocRef = doc(db, 'people', peopleId);
          const personDoc = await getDoc(personDocRef);
          if (personDoc.exists()) {
            const data = personDoc.data() as PersonDetails;
            setPersonDetails(data);
          } else {
            message.error('Person not found.');
            navigate('/people');
          }
        } catch (error) {
          console.error('Error fetching person details:', error);
          message.error('Failed to fetch person details.');
        } finally {
          setLoading(false);
        }
      } else {
        message.error("No person selected.");
        navigate('/people');
      }
    };

    fetchData();
  }, [peopleId, companyId, navigate]);

  useEffect(() => {
    console.log('personId from useParams:', peopleId);
  }, [peopleId]);

  useEffect(() => {
    const fetchAssigneeNames = async () => {
      if (personDetails?.assignees) {
        console.log('Fetching assignee names for:', personDetails.assignees);
        const assigneePromises = personDetails.assignees.map(async (assignee) => {
          try {
            const userDoc = await getDoc(doc(db, 'users', assignee.uid));
            console.log('User doc for', assignee.uid, ':', userDoc.data());
            if (userDoc.exists()) {
              const userData = userDoc.data();
              const fullName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim();
              return { uid: assignee.uid, name: fullName || 'No Name' };
            }
            return { uid: assignee.uid, name: 'User Not Found' };
          } catch (error) {
            console.error('Error fetching user:', assignee.uid, error);
            return { uid: assignee.uid, name: 'Error Fetching User' };
          }
        });
        const resolvedAssignees = await Promise.all(assigneePromises);
        console.log('Resolved assignees:', resolvedAssignees);
        setAssigneesWithNames(resolvedAssignees);
      }
    };

    fetchAssigneeNames();
  }, [personDetails]);

  useEffect(() => {
    const fetchPropertyAndUnitDetails = async () => {
      if (personDetails?.properties && personDetails.properties.length > 0) {
        const detailsMap: { [key: string]: PropertyUnitDetails } = {};

        for (const prop of personDetails.properties) {
          try {
            // Fetch property name
            const propertySettingsQuery = query(collection(db, 'properties', prop.property, 'propertySettings'));
            const propertySettingsSnapshot = await getDocs(propertySettingsQuery);
            let propertyName = 'Unnamed Property';
            if (!propertySettingsSnapshot.empty) {
              propertyName = propertySettingsSnapshot.docs[0].data().propertyName || 'Unnamed Property';
            }

            // Fetch unit name
            const unitDoc = await getDoc(doc(db, 'properties', prop.property, 'units', prop.unit));
            const unitName = unitDoc.exists() ? unitDoc.data().unitName : 'Unknown Unit';

            detailsMap[`${prop.property}-${prop.unit}`] = { propertyName, unitName };
          } catch (error) {
            console.error('Error fetching property or unit details:', error);
          }
        }

        setPropertyUnitDetails(detailsMap);
      }
    };

    fetchPropertyAndUnitDetails();
  }, [personDetails]);

  console.log('Rendering with personDetails:', JSON.stringify(personDetails, null, 2));

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!personDetails) {
    return <div>Person not found</div>;
  }

  const fullName = getFullName(personDetails);

  const iconStyle = {
    fontSize: '32px',
  };

  const handleEmailClick = (email: string) => {
    window.location.href = `mailto:${email}`;
  };

  const handleNewTaskClick = () => {
    setNewTaskDrawerVisible(true);
  };

  const formatAddress = (address: Address) => {
    return `${address.street}, ${address.city}, ${address.state} ${address.postalCode}, ${address.country.toUpperCase()}`;
  };

  // Add this helper function to format phone numbers
  const formatPhoneNumber = (phoneNumber: string) => {
    const cleaned = ('' + phoneNumber).replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return '(' + match[1] + ')-' + match[2] + '-' + match[3];
    }
    return phoneNumber;
  };

  const getStatusIcon = (status: string | null) => {
    if (!status) return <CheckCircleOutlined />;
    const lowerStatus = status.toLowerCase();
    if (lowerStatus === 'sent') return <SendOutlined style={{ color: '#438BFF' }} />;
    if (lowerStatus === 'review') return <CheckCircleOutlined style={{ color: '#188034' }} />;
    return <CheckCircleOutlined />;
  };

  return (
    <div className="prospects-details-page" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div className="prospects-details-top-container" style={{ flexShrink: 0 }}>
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
                <Text type="secondary" style={{ fontSize: '16px', marginBottom: '5px', marginLeft: '3px', color: '#188034' }}>
                  {personDetails.peopleType
                    ? personDetails.peopleType.charAt(0).toUpperCase() + personDetails.peopleType.slice(1)
                    : 'No type specified'}
                </Text>
              </Space>
            </Col>
            <Col>
              <Space>
              </Space>
            </Col>
          </Row>
        </div>
      </div>
    
      <div className="prospects-details-menu" style={{ flexShrink: 0 }}>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="Overview" key="overview" />
          <TabPane tab="Rental Application" key="rental-application" />
          <TabPane tab="Tasks" key="tasks" />
          <TabPane tab="Notes" key="notes" />
          <TabPane tab="Files" key="files" />
        </Tabs>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
        {activeTab === 'overview' && (
          <>
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
                    onClick={handleNewTaskClick}
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

            <Row gutter={16}>
              <Col span={8}>
                <Card bodyStyle={{ height: '140px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <Space direction="vertical" align="center" size="small">
                    <div style={{ ...iconStyle, color: '#52c41a' }}>
                      {getStatusIcon(personDetails.applicationStatus)}
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
                      {personDetails.maxRent || personDetails.minBedrooms || personDetails.minBathrooms ? (
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '4px' }}>
                          {personDetails.maxRent && (
                            <span>${personDetails.maxRent.toLocaleString()} Max Rent,</span>
                          )}
                          {personDetails.minBedrooms && (
                            <span>{personDetails.minBedrooms} bd</span>
                          )}
                          {personDetails.minBathrooms && (
                            <span>{personDetails.minBathrooms} ba</span>
                          )}
                        </div>
                      ) : (
                        <div>No preferences specified</div>
                      )}
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
                        {assigneesWithNames.length > 0 ? (
                          <>
                            <Text>{assigneesWithNames[0].name}</Text>
                            {assigneesWithNames.length > 1 && (
                              <Tooltip title={assigneesWithNames.slice(1).map(a => a.name).join(', ')}>
                                <Text style={{ marginLeft: '4px', color: '#1890ff' }}>
                                  +{assigneesWithNames.length - 1}
                                </Text>
                              </Tooltip>
                            )}
                          </>
                        ) : (
                          <Text>Not Assigned</Text>
                        )}
                      </div>
                    </div>
                  </Space>
                </Card>
              </Col>
              <Col span={6}>
                <Card bodyStyle={{ height: '140px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <Space direction="vertical" align="center" size="small">
                    <div style={iconStyle}>
                      <DollarOutlined />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <strong>Monthly Income</strong>
                      <div>{personDetails.monthlyIncome ? personDetails.monthlyIncome : 'No Income Set'}</div>
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
                      <div>{formatDate(personDetails.moveInDate)}</div>
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
                          ? personDetails.leadSource.charAt(0).toUpperCase() + personDetails.leadSource.slice(1)
                          : 'Not Source'}
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
                      <div>{personDetails.creditScore ? personDetails.creditScore.charAt(0).toUpperCase() + personDetails.creditScore.slice(1) : 'No Credit Score'}</div>
                    </div>
                  </Space>
                </Card>
              </Col>
            </Row>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Card size="small" title="Contact Info" style={{ height: '100%' }}>
                  <Space direction="vertical">
                    <Space>
                      <MailTwoTone/>
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
                      <PhoneTwoTone/>
                      {personDetails.phones && personDetails.phones.length > 0 ? (
                        <>
                          <Text>{formatPhoneNumber(personDetails.phones[0].number)}</Text>
                          {personDetails.phones.length > 1 && (
                            <Tooltip title={personDetails.phones.slice(1).map(p => formatPhoneNumber(p.number)).join(', ')}>
                              <Text style={{ color: '#1890ff' }}>+{personDetails.phones.length - 1}</Text>
                            </Tooltip>
                          )}
                        </>
                      ) : (
                        <Text type="secondary"  style={{ color: '#bfbfbf' }}>No phone number</Text>
                      )}
                    </Space>
                  </Space>
                </Card>
              </Col>
              <Col span={12}>
                <Card 
                  title="Address" 
                  size="small"
                  style={{ height: '100%' }}
                  extra={<Button style={{ color: '#188034' }} icon={<PlusOutlined />} type="link">Add New</Button>}
                >
                  {personDetails.addresses && personDetails.addresses.length > 0 ? (
                    personDetails.addresses.map((address, index) => (
                      <Row key={index} style={{ marginBottom: index < personDetails.addresses.length - 1 ? '16px' : '0' }}>
                        <Col span={24}>
                          <Space>
                            <EnvironmentTwoTone twoToneColor="#F70001"/>
                              <Text ellipsis style={{ maxWidth: '300px' }}>{formatAddress(address)}</Text>
                            <Text type="secondary">
                              {index === 0 ? '(Primary)' : '(Secondary)'}
                            </Text>
                          </Space>
                        </Col>
                      </Row>
                    ))
                  ) : (
                    <Text>No Address</Text>
                  )}
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" title="Interests" style={{ height: '100%' }}>
                  <Space direction="vertical">
                    {personDetails.properties && personDetails.properties.length > 0 ? (
                      personDetails.properties.map((property) => {
                        const details = propertyUnitDetails[`${property.property}-${property.unit}`];
                        return (
                          <Space key={`${property.property}-${property.unit}`}>
                            <HomeTwoTone twoToneColor="#28A744" />
                            <Text>
                              {details ? (
                                <>
                                  {details.propertyName}
                                  {details.unitName && details.unitName !== 'Unknown Unit' && 
                                    `, Unit ${details.unitName}`
                                  }
                                </>
                              ) : (
                                'Loading...'
                              )}
                            </Text>
                          </Space>
                        );
                      })
                    ) : (
                      <Space>
                        <HomeTwoTone twoToneColor="#28A744" />
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
          </>
        )}
        {activeTab === 'rental-application' && (
          <div>Rental Application Content</div>
        )}
        {activeTab === 'tasks' && peopleId && companyId && (
          <TasksTab personId={peopleId} companyId={companyId} />
        )}
        {activeTab === 'notes' && peopleId && companyId && (
          <ProspectsDetailsNotes personId={peopleId} />
        )}
        {activeTab === 'files' && companyId && (
          <ProspectsFilesPage personId={peopleId} />
        )}
      </div>
      {peopleId && companyId && (
        <>
          <NewTaskDrawer
            visible={newTaskDrawerVisible}
            onClose={() => setNewTaskDrawerVisible(false)}
            companyId={companyId || ''}
            personId={peopleId || ''} 
          />
          <EditPersonDrawer
            visible={editDrawerVisible}
            onClose={() => setEditDrawerVisible(false)}
            personDetails={personDetails}
            companyId={companyId}
            personId={peopleId}
            onUpdate={(updatedDetails) => setPersonDetails(updatedDetails)}
          />
        </>
      )}
    </div>
  );
};

export default ProspectsDetailsPage;
