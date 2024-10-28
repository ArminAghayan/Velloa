import React, { useState, useEffect, useCallback } from 'react';
import { Typography, Button, Tabs, Card, Row, Col, Space, Dropdown, Menu, message, Tooltip, Modal, Spin } from 'antd';
import { LeftOutlined, MoreOutlined, CheckCircleOutlined, SearchOutlined, UserOutlined, DollarOutlined, CalendarOutlined, FlagOutlined, CreditCardOutlined, MailTwoTone, PhoneTwoTone, EnvironmentTwoTone, HomeTwoTone, FileTextOutlined, ProfileOutlined, EditOutlined, DeleteOutlined, QuestionCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, ToolOutlined, TagsOutlined,SplitCellsOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../../../firebase-config';
import { collection, getDocs, query, where, Timestamp, doc, getDoc, deleteDoc } from 'firebase/firestore'; // Added doc and getDoc
import NewTaskDrawer from '../../maintenance/Tasks/PeopleTaskDrawer';
import TasksTab from './PeopleDashBoardDetailsTasks';
import ProspectsDetailsNotes from './PeopleDashboardDetailsNotes';
import ProspectsFilesPage from './PeopleDashBoardFilesPage';
import ProspectsDetailsRentalApplication from './PeopleDashboardDetailsRentalApplication';
import EditPersonDrawer from './EditPersonDrawer'; // You'll need to create this component
import PeopleBillingHistory from './PeopleBillingHistory';
import PeopleWorkOrder from '../../maintenance/Tasks/PeopleWorkOrder'; // Add this import
import './peopledetails.css';
import PeopleProperties from './PeopleDashboardDetailsProperties';
import PeopleTransactions from './PeopleDashboardDetailsTransactions';
import dayjs from 'dayjs';
import PeopleOwnerRequest from '../../maintenance/Tasks/PeopleOwnerRequest'; // Import the component
import EditAgreementDrawer from './EditAgreementDrawer';
import EditInsuranceDrawer from './EditInsuranceDrawer';
const { Title, Text } = Typography;
const { TabPane } = Tabs;

// Add these new imports at the top


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

interface Insurance {
  coverage: number;
  effectiveDate: Timestamp;
  expirationDate: Timestamp;
  insuranceProvider: string;
  policyNumber: string;
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
  insurance: Insurance[];
  propertyAccess: string | null;
  selectedClassifications?: string[];
  agreementStatus?: string;
  agreement?: {
    startDate: string;
    endDate: string;
  };
  portalStatus?: 'active' | 'inactive';
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
  const [workOrderDrawerVisible, setWorkOrderDrawerVisible] = useState(false);
  const [ownerRequestDrawerVisible, setOwnerRequestDrawerVisible] = useState(false); // Add state for drawer visibility
  const [agreementDrawerVisible, setAgreementDrawerVisible] = useState(false);
  const [insuranceDrawerVisible, setInsuranceDrawerVisible] = useState(false);
  const [taskCount, setTaskCount] = useState<number>(0);

  const getFullName = (person: PersonDetails) => {
    const firstName = person.firstName || '';
    const middleName = person.middleName || '';
    const lastName = person.lastName || '';
    return `${firstName} ${middleName} ${lastName}`.trim();
  };

  const formatDate = (date: string | Timestamp | { seconds: number; nanoseconds: number } | undefined) => {
    if (!date) return 'N/A';
    
    let dateObj: Date;
    if (date instanceof Timestamp) {
      dateObj = date.toDate();
    } else if (typeof date === 'string') {
      dateObj = new Date(date);
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

  // Update the fetchTaskCount function in the useEffect
  useEffect(() => {
    const fetchTaskCount = async () => {
      if (!peopleId || !companyId) return;

      try {
        const tasksQuery = query(
          collection(db, 'maintenance'),
          where('companyId', '==', companyId),
          where(
            personDetails?.peopleType?.toLowerCase() === 'vendor' 
              ? 'vendor' 
              : 'owner',
            '==', 
            peopleId
          )
        );
        
        const tasksSnapshot = await getDocs(tasksQuery);
        setTaskCount(tasksSnapshot.size);
      } catch (error) {
        console.error('Error fetching task count:', error);
      }
    };

    fetchTaskCount();
  }, [peopleId, companyId, personDetails?.peopleType]); // Added peopleType to dependencies

  console.log('Rendering with personDetails:', JSON.stringify(personDetails, null, 2));

  if (loading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <Spin size="large" tip="Loading..." />
      </div>
    );
  }

  if (!personDetails) {
    return <div>Person not found</div>;
  }

  const fullName = getFullName(personDetails);

  const handleEdit = () => {
    setEditDrawerVisible(true);
  };

  const handleDelete = async () => {
    if (!peopleId || !companyId) {
      message.error("Unable to delete: Missing person or company information.");
      return;
    }

    Modal.confirm({
      title: 'Are you sure you want to delete this person?',
      content: 'This action cannot be undone and will also delete all associated maintenance tasks.',
      onOk: async () => {
        try {
          if (!auth.currentUser) {
            throw new Error("No authenticated user");
          }

          // Check if the current user is a member of the company
          const companyDoc = await getDoc(doc(db, 'companies', companyId));
          if (!companyDoc.exists()) {
            throw new Error('Company document not found');
          }
          const companyData = companyDoc.data();
          if (!companyData.members || !(auth.currentUser.uid in companyData.members)) {
            throw new Error('User is not a member of the company');
          }

          // Delete the person document
          await deleteDoc(doc(db, 'people', peopleId));

          // Delete associated maintenance tasks
          const maintenanceQuery = query(
            collection(db, 'maintenance'),
            where('companyId', '==', companyId)
          );
          const maintenanceSnapshot = await getDocs(maintenanceQuery);
          
          const deletePromises = maintenanceSnapshot.docs.map(async (doc) => {
            const maintenanceData = doc.data();
            if (maintenanceData.relatedTo && maintenanceData.relatedTo.includes(peopleId)) {
              return deleteDoc(doc.ref);
            }
            return Promise.resolve(); // Do nothing if not related
          });

          await Promise.all(deletePromises);

          message.success('Person and associated maintenance tasks deleted successfully');
          navigate('/people'); // Navigate back to the people list
        } catch (error) {
          console.error('Error deleting person and maintenance tasks:', error);
          if (error instanceof Error) {
            message.error(`Failed to delete person and maintenance tasks: ${error.message}`);
          } else {
            message.error('Failed to delete person and maintenance tasks');
          }
        }
      },
    });
  };

  const menu = (
    <Menu style={{ width: '150px' }}>
      <Menu.Item  key="1" onClick={handleEdit} icon={<EditOutlined />}>
        Edit
      </Menu.Item>
      <Menu.Item  key="2" onClick={handleDelete} icon={<DeleteOutlined />} danger>
        Delete
      </Menu.Item>
    </Menu>
  );

  const iconStyle = {
    fontSize: '32px',
  };

  const handleEmailClick = (email: string) => {
    window.location.href = `mailto:${email}`;
  };

  const handleNewTaskClick = () => {
    setNewTaskDrawerVisible(true);
  };

  const handleNewNoteClick = () => {
    setActiveTab('notes');
  };
  const handleNewWorkOrder = () => {
    setWorkOrderDrawerVisible(true);
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

  const handleViewRentalApplication = () => {
    setActiveTab('rental-application');
  };

  const isVendor = () => {
    return personDetails?.peopleType?.toLowerCase() === 'vendor';
  };

  const getInsuranceStatus = () => {
    console.log('Insurance data:', personDetails?.insurance);
    
    if (!isVendor() || !personDetails || !personDetails.insurance || personDetails.insurance.length === 0) {
      console.log('No insurance info or not a vendor');
      return 'No Insurance Info';
    }

    const currentDate = dayjs();
    const latestInsurance = personDetails.insurance[0];

    console.log('Current date:', currentDate.format());
    console.log('Effective date:', latestInsurance.effectiveDate);
    console.log('Expiration date:', latestInsurance.expirationDate);

    // Helper function to convert various date formats to dayjs
    const convertToDate = (date: string | Timestamp | { seconds: number; nanoseconds: number }) => {
      if (typeof date === 'string') {
        return dayjs(date);
      } else if (date instanceof Timestamp) {
        return dayjs(date.toDate());
      } else if (typeof date === 'object' && 'seconds' in date && 'nanoseconds' in date) {
        return dayjs(new Date(date.seconds * 1000 + date.nanoseconds / 1000000));
      }
      return null;
    };

    const effectiveDate = convertToDate(latestInsurance.effectiveDate);
    const expirationDate = convertToDate(latestInsurance.expirationDate);

    console.log('Effective date (parsed):', effectiveDate?.format());
    console.log('Expiration date (parsed):', expirationDate?.format());

    if (!effectiveDate || !expirationDate || !effectiveDate.isValid() || !expirationDate.isValid()) {
      console.log('Invalid dates detected');
      return 'Invalid Dates';
    }

    console.log('Is before effective date:', currentDate.isBefore(effectiveDate));
    console.log('Is after expiration date:', currentDate.isAfter(expirationDate));

    if (currentDate.isBefore(effectiveDate)) {
      return 'Inactive';
    }
    if (currentDate.isAfter(expirationDate)) {
      return 'Expired';
    }
    return 'Active';
  };

  // Add this helper function to check agreement status
  const getAgreementStatus = () => {
    if (!personDetails?.agreement?.startDate || !personDetails?.agreement?.endDate) {
      return 'Inactive';
    }

    const currentDate = dayjs();
    const startDate = dayjs(personDetails.agreement.startDate);
    const endDate = dayjs(personDetails.agreement.endDate);

    return currentDate.isAfter(startDate) && currentDate.isBefore(endDate) ? 'Active' : 'Inactive';
  };

  const getStatusIcon = (status: string | null | undefined) => {
    if (isVendor()) {
      const insuranceStatus = getInsuranceStatus();
      switch (insuranceStatus) {
        case 'Active':
          return <CheckCircleOutlined style={{ color: '#52c41a' }} />; // Green
        case 'Inactive':
          return <ClockCircleOutlined style={{ color: '#faad14' }} />; // Yellow
        case 'Expired':
          return <CloseCircleOutlined style={{ color: '#f5222d' }} />; // Red
        default:
          return <QuestionCircleOutlined style={{ color: '#bfbfbf' }} />; // Grey
      }
    } else if (isOwner()) {
      const agreementStatus = getAgreementStatus();
      return agreementStatus === 'Active' 
        ? <CheckCircleOutlined style={{ color: '#52c41a' }} />
        : <CloseCircleOutlined style={{ color: '#f5222d' }} />;
    }
    switch (status?.toLowerCase()) {
      case 'sent':
        return <MailTwoTone twoToneColor="#FFA907" />; // Orange color
      case 'review':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />; // Green color
      case null:
      case undefined:
        return <QuestionCircleOutlined style={{ color: '#bfbfbf' }} />; // Grey color for null or undefined
      default:
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />; // Default to green checkmark
    }
  };

  const formatInsuranceDate = (dateString: string) => {
    return dayjs(dateString).isValid() ? dayjs(dateString).format('MMM D, YYYY') : 'Invalid Date';
  };

  const getPortalStatus = () => {
    return personDetails?.portalStatus?.toLowerCase() === 'active' ? 'Active' : 'Inactive';
  };

  const renderClassificationsOrLookingFor = () => {
    if (isVendor()) {
      return (
        <Card bodyStyle={{ height: '140px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Space direction="vertical" align="center" size="small">
            <div style={iconStyle}>
              <TagsOutlined />
            </div>
            <div style={{ textAlign: 'center' }}>
              <strong>Classifications</strong>
              {personDetails.selectedClassifications && personDetails.selectedClassifications.length > 0 ? (
                <div>{personDetails.selectedClassifications.join(', ')}</div>
              ) : (
                <div>No classifications specified</div>
              )}
            </div>
          </Space>
        </Card>
      );
    } else if (isOwner()) {
      return (
        <Card bodyStyle={{ height: '140px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Space direction="vertical" align="center" size="small">
            <div style={iconStyle}>
              <UserOutlined />
            </div>
            <div style={{ textAlign: 'center' }}>
              <strong>Owner Portal</strong>
              <div>{getPortalStatus()}</div>
            </div>
          </Space>
        </Card>
      );
    } else {
      return (
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
                    <span>{personDetails.minBedrooms}bd</span>
                  )}
                  {personDetails.minBathrooms && (
                    <span>{personDetails.minBathrooms}ba</span>
                  )}
                </div>
              ) : (
                <div>No preferences specified</div>
              )}
            </div>
          </Space>
        </Card>
      );
    }
  };

  // Add this handler near your other handlers
  const handleNewLease = () => {
    // Add your lease creation logic here
    // This might involve navigation or opening a drawer/modal
  };

  const handleNewContribution = () => {
    // Add your contribution creation logic here
    console.log('New contribution clicked');
  };

  const handleNewDistribution = () => {
    // Add your distribution creation logic here
    console.log('New distribution clicked');
  };

  const handleNewOwnerRequest = () => {
    setOwnerRequestDrawerVisible(true); // Open the drawer
  };

  // Add this helper function to check if the person is an owner
  const isOwner = () => {
    return personDetails?.peopleType?.toLowerCase() === 'owner';
  };

  // Update the getStatusText function
  const getStatusText = () => {
    if (isVendor()) {
      return getInsuranceStatus();
    } else if (isOwner()) {
      return getAgreementStatus(); // Just return 'Active' or 'Inactive' without the 'Agreement' prefix
    }
    return personDetails.applicationStatus || 'No Status';
  };

  const handleAgreementUpdate = (agreement: { startDate: string; endDate: string }) => {
    setPersonDetails(prev => prev ? {
      ...prev,
      agreement
    } : null);
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
          <Button icon={<LeftOutlined />} onClick={() => navigate(-1)} className="prospects-details-back-button">
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
          {isVendor() && <TabPane tab="Billing" key="billing" />}
          {!isVendor() && !isOwner() && <TabPane tab="Rental Application" key="rental-application" />}
          {isOwner() && (
            <>
              <TabPane tab="Properties" key="properties" />
              <TabPane tab="Transactions" key="transactions" />
            </>
          )}
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
                {isVendor() ? (
                  // Vendor quick actions
                  <>
                    <Col span={8}>
                      <Button 
                        type="primary"
                        icon={<ToolOutlined />}
                        block
                        className="prospects-details-tall-button"
                        onClick={handleNewWorkOrder}
                      >
                        New Work Order
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
                        icon={<FileTextOutlined />}
                        block
                        className="prospects-details-tall-button"
                        onClick={handleNewNoteClick}
                      >
                        New Note
                      </Button>
                    </Col>
                  </>
                ) : personDetails.peopleType?.toLowerCase() === 'owner' ? (
                  // Owner quick actions
                  <>
                    <Col span={8}>
                      <Button 
                        type="primary"
                        icon={<DollarOutlined />}
                        block
                        className="prospects-details-tall-button"
                        onClick={handleNewContribution}
                      >
                        New Contribution
                      </Button>
                    </Col>
                    <Col span={8}>
                      <Button 
                        type="primary"
                        icon={<SplitCellsOutlined />}
                        block
                        className="prospects-details-tall-button"
                        onClick={handleNewDistribution}
                      >
                        New Distribution
                      </Button>
                    </Col>
                    <Col span={8}>
                      <Button 
                        type="primary"
                        icon={<FileTextOutlined />}
                        block
                        className="prospects-details-tall-button"
                        onClick={handleNewOwnerRequest}
                      >
                        New Owner Request
                      </Button>
                    </Col>
                  </>
                ) : (
                  // Existing prospect quick actions
                  <>
                    <Col span={8}>
                      <Button 
                        type="primary"
                        icon={<ProfileOutlined />}
                        block
                        className="prospects-details-tall-button"
                        onClick={handleViewRentalApplication}
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
                        icon={<FileTextOutlined />}
                        block
                        className="prospects-details-tall-button"
                        onClick={handleNewLease}  // You'll need to add this handler
                      >
                        New Lease
                      </Button>
                    </Col>
                  </>
                )}
              </Row>
            </Card>

            <Row gutter={16}>
              <Col span={8}>
                <Card bodyStyle={{ height: '140px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <Space direction="vertical" align="center" size="small">
                    <div style={{ ...iconStyle }}>
                      {getStatusIcon(personDetails.applicationStatus)}
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <strong>{isVendor() ? 'Insurance Status' : (isOwner() ? 'Agreement Status' : 'Status')}</strong>
                      <div>{getStatusText()}</div>
                    </div>
                  </Space>
                </Card>
              </Col>
              <Col span={8}>
                {renderClassificationsOrLookingFor()}
              </Col>
              <Col span={8}>
                <Card bodyStyle={{ height: '140px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <Space direction="vertical" align="center" size="small">
                    <div style={iconStyle}>
                      {isVendor() || isOwner() ? <ToolOutlined /> : <UserOutlined />}
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <strong>{isVendor() || isOwner() ? 'Active Tasks' : 'Assigned To'}</strong>
                      <div>
                        {isVendor() || isOwner() ? (
                          <Text>{taskCount}</Text>  // This will now show the actual task count
                        ) : assigneesWithNames.length > 0 ? (
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
              {!isVendor() && !isOwner() && (
                <><Col span={6}>
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
                </Col><Col span={6}>
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
                  </Col><Col span={6}>
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
                  </Col><Col span={6}>
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
                  </Col></>
              )}
            </Row>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Card title="Contact Info" style={{ height: '100%' }}>
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
                  style={{ height: '100%' }}
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
                <Card 
                  title={isVendor() ? "Property Access" : (isOwner() ? "Agreement" : "Interests")} 
                  style={{ height: '100%' }}
                  extra={
                    isOwner() && (
                      <Button 
                        type="link" 
                        icon={<EditOutlined />} 
                        onClick={() => setAgreementDrawerVisible(true)}
                      >
                        Update
                      </Button>
                    )
                  }
                >
                  <Space direction="vertical">
                    {isVendor() ? (
                      // Vendor property access code...
                      personDetails.propertyAccess ? (
                        <Space>
                          <HomeTwoTone twoToneColor="#28A744" />
                          <Text>
                            {personDetails.propertyAccess === 'all' ? 'All Properties' : personDetails.propertyAccess}
                          </Text>
                        </Space>
                      ) : (
                        <Space>
                          <HomeTwoTone twoToneColor="#28A744" />
                          <Text>No Property Access</Text>
                        </Space>
                      )
                    ) : isOwner() ? (
                      // Owner agreement dates
                      <Space direction="vertical">
                        <Space>
                          <CalendarOutlined />
                          <Text type="secondary">Start Date:</Text>
                          <Text>{personDetails.agreement?.startDate ? dayjs(personDetails.agreement.startDate).format('MMM D, YYYY') : 'Not set'}</Text>
                        </Space>
                        <Space>
                          <CalendarOutlined />
                          <Text type="secondary">End Date:</Text>
                          <Text>{personDetails.agreement?.endDate ? dayjs(personDetails.agreement.endDate).format('MMM D, YYYY') : 'Not set'}</Text>
                        </Space>
                      </Space>
                    ) : (
                      // Existing interests code for other types
                      personDetails.properties && personDetails.properties.length > 0 ? (
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
                      )
                    )}
                  </Space>
                </Card>
              </Col>
              {isVendor() && (
                <Col span={12}>
                  <Card 
                    title={
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Insurance</span>
                        
                      </div>
                    }
                    style={{ height: '100%' }}
                    extra={
                      <Button 
                        type="link" 
                        icon={<EditOutlined />} 
                        onClick={() => setInsuranceDrawerVisible(true)}
                      >
                        Update
                      </Button>
                    }
                  >
                    {personDetails.insurance && personDetails.insurance.length > 0 ? (
                      <Space direction="vertical" style={{ width: '100%' }}>
                        {personDetails.insurance.map((insurance, index) => (
                          <Space key={index} direction="vertical" style={{ width: '100%', borderBottom: index < personDetails.insurance.length - 1 ? '1px solid #f0f0f0' : 'none', paddingBottom: '8px', marginBottom: '8px' }}>
                            <Space>
                              <Text type="secondary">Insurance Provider:</Text>
                              <Text strong>{insurance.insuranceProvider}</Text>
                            </Space>
                            <Space>
                              <Text type="secondary">Policy:</Text>
                              <Text>{insurance.policyNumber}</Text> 
                            </Space>
                            <Space>
                              <Text type="secondary">Dates:</Text>
                              <Text>{formatDate(insurance.effectiveDate)} - {formatDate(insurance.expirationDate)}</Text>
                            </Space>
                            <Space>
                              <Text type="secondary">Coverage:</Text>
                              <Text>${insurance.coverage.toLocaleString()}</Text>
                            </Space>
                          </Space>
                        ))}
                      </Space>
                    ) : (
                      <Text type="secondary">No insurance information available</Text>
                    )}
                  </Card>
                </Col>
              )}
            </Row>
          </>
        )}
        {activeTab === 'rental-application' && peopleId && companyId && !isVendor() && !isOwner() && (
          <ProspectsDetailsRentalApplication personId={peopleId || ''} companyId={companyId || ''} />
        )}
        {activeTab === 'tasks' && peopleId && companyId && (
          <TasksTab 
            personId={peopleId} 
            companyId={companyId} 
            isVendor={personDetails?.peopleType?.toLowerCase() === 'vendor'}
            peopleType={personDetails?.peopleType}
          />
        )}
        {activeTab === 'notes' && peopleId && companyId && (
          <ProspectsDetailsNotes personId={peopleId} />
        )}
        {activeTab === 'files' && companyId && (
          <ProspectsFilesPage personId={peopleId} />
        )}
        {activeTab === 'billing' && isVendor() && peopleId && companyId && (
          <PeopleBillingHistory personId={peopleId} companyId={companyId} />
        )}
        {activeTab === 'properties' && isOwner() && peopleId && companyId && (
          <PeopleProperties 
            personId={peopleId} 
            companyId={companyId} 
          />
        )}
        {activeTab === 'transactions' && isOwner() && peopleId && companyId && (
          <PeopleTransactions 
            personId={peopleId} 
            companyId={companyId}
          />
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
            companyId={companyId}
            personId={peopleId}
            onUpdate={(updatedDetails: PersonDetails) => setPersonDetails(updatedDetails)}
            onSubmitSuccess={() => {
              setEditDrawerVisible(false);
              message.success('Person updated successfully');
            }}
          />
          <PeopleWorkOrder
            visible={workOrderDrawerVisible}
            onClose={() => setWorkOrderDrawerVisible(false)}
            companyId={companyId}
            personId={peopleId}
          />
          <PeopleOwnerRequest
            visible={ownerRequestDrawerVisible}
            onClose={() => setOwnerRequestDrawerVisible(false)} // Close the drawer
            companyId={companyId}
            personId={peopleId}
          />
        </>
      )}
      {isOwner() && (
        <EditAgreementDrawer
          visible={agreementDrawerVisible}
          onClose={() => setAgreementDrawerVisible(false)}
          personId={peopleId || ''}
          currentAgreement={personDetails?.agreement}
          onUpdate={handleAgreementUpdate}
        />
      )}
      {isVendor() && (
        <EditInsuranceDrawer
        open={insuranceDrawerVisible}  // Changed from visible to open
        onClose={() => setInsuranceDrawerVisible(false)}
        personId={peopleId || ''}
        currentInsurance={personDetails?.insurance?.[0]}
        onUpdate={(updatedInsurance) => {
          setPersonDetails(prev => prev ? {
            ...prev,
            insurance: [updatedInsurance, ...(prev.insurance?.slice(1) || [])]
          } : prev);
        }}
      />
      )}
    </div>
  );
};

export default ProspectsDetailsPage;
