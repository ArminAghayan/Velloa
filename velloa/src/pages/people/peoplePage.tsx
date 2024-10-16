import React, { useState, useEffect, useCallback } from 'react';
import { Typography, Table, Input, Skeleton, Button, message, Dropdown, Menu, Col, Row, Tooltip, Steps } from 'antd';
import { RightOutlined, UserOutlined, FileTextOutlined, DownOutlined, ReloadOutlined, ClockCircleOutlined, MailOutlined, PhoneOutlined, MoreOutlined } from '@ant-design/icons';
import { SortOrder } from 'antd/lib/table/interface';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../../firebase-config';
import { collection, getDocs, query, where, Timestamp, doc, getDoc } from 'firebase/firestore';
import NewProspectPage from './applications/NewProspectPage';
import './peoplePage.css';
const { Title, Text } = Typography;

interface PeopleData {
  key: string;
  type: string;
  name: string;
  emails: string[];
  phones: string[];
  properties: { id: string; name: string }[];
  leadStatus: string;
  status: string;
  avatar: string;
  avatarUrl: string;
  moveInDate: string;
  assignee: string | string[];
  applicationStatus: string;
}

// Add a new interface for the intermediate data structure
interface IntermediatePeopleData extends Omit<PeopleData, 'properties'> {
  propertyIds: string[];
}



const PeoplePage: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [peopleTypeFilter, setPeopleTypeFilter] = useState('All');
  const [peopleData, setPeopleData] = useState<PeopleData[]>([]);
  const [filteredPeopleData, setFilteredPeopleData] = useState<PeopleData[]>([]);
  const [assignees, setAssignees] = useState<{ [key: string]: string }>({});

  // Add this new function to format phone numbers
  const formatPhoneNumber = (phoneNumber: string) => {
    const cleaned = ('' + phoneNumber).replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return '(' + match[1] + ')-' + match[2] + '-' + match[3];
    }
    return phoneNumber;
  };

  // Fetch the company ID based on the authenticated user
  const fetchCompanyId = useCallback(async () => {
    if (!auth.currentUser) {
      console.error("No authenticated user");
      message.error("No authenticated user");
      return null;
    }
    try {
      const companiesQuery = query(
        collection(db, 'companies'),
        where(`members.${auth.currentUser.uid}`, '!=', null)
      );
      const companiesSnapshot = await getDocs(companiesQuery);
      if (companiesSnapshot.empty) {
        console.error("User is not a member of any company");
        message.error("User is not a member of any company");
        return null;
      }
      // Assuming a user is only a member of one company
      const fetchedCompanyId = companiesSnapshot.docs[0].id;
      console.log(`Fetched company ID: ${fetchedCompanyId}`);
      return fetchedCompanyId;
    } catch (error) {
      console.error("Error fetching company ID:", error);
      message.error("Error fetching company ID. Please try again.");
      return null;
    }
  }, []);

  // Fetch people data based on the company ID and enrich with property names
  const fetchPeopleData = useCallback(async () => {
    if (!companyId) {
      console.log("No companyId available");
      return;
    }

    try {
      setLoading(true);
      console.log("Fetching people data for companyId:", companyId);
      const peopleQuery = query(collection(db, 'people'), where('companyId', '==', companyId));
      const querySnapshot = await getDocs(peopleQuery);

      console.log("Query snapshot size:", querySnapshot.size);

      // Extract people data with property IDs
      const peopleList: IntermediatePeopleData[] = querySnapshot.docs.map(doc => {
        const data = doc.data();
        console.log("Document data:", data);
        return {
          key: doc.id,
          type: data.peopleType ? data.peopleType.charAt(0).toUpperCase() + data.peopleType.slice(1) : '',
          name: `${data.firstName || ''} ${data.middleName || ''} ${data.lastName || ''}`.trim(),
          emails: data.emails ? data.emails.map((email: any) => email.address) : [],
          phones: data.phones ? data.phones.map((phone: any) => phone.number) : [],
          propertyIds: data.properties ? data.properties.map((prop: any) => prop.property) : [],
          leadStatus: data.leadStatus || '',
          status: data.status || '',
          avatar: data.avatar || '',
          avatarUrl: data.avatarUrl || '',
          moveInDate: data.moveInDate instanceof Timestamp 
            ? data.moveInDate.toDate().toLocaleDateString() 
            : data.moveInDate || '',
          assignee: data.assignee || '',
          applicationStatus: data.applicationStatus ? data.applicationStatus.toLowerCase() : 'start', // Normalize to lowercase
        };
      });

      // Extract unique property IDs
      const propertyIds = Array.from(new Set(peopleList.flatMap(person => person.propertyIds)));

      if (propertyIds.length === 0) {
        // If no property IDs, set properties as empty array
        const enrichedPeopleData: PeopleData[] = peopleList.map(person => ({
          ...person,
          properties: [],
        }));
        setPeopleData(enrichedPeopleData);
        return;
      }

      // Function to fetch propertyName from propertySettings subcollection
      const fetchPropertyName = async (propertyId: string): Promise<string> => {
        try {
          const propertySettingsDoc = await getDocs(
            collection(db, 'properties', propertyId, 'propertySettings')
          );

          if (!propertySettingsDoc.empty) {
            // Assuming there's only one document in propertySettings
            const propData = propertySettingsDoc.docs[0].data();
            return propData.propertyName || 'Unnamed Property';
          } else {
            console.warn(`No propertySettings found for propertyId: ${propertyId}`);
            return 'Unknown Property';
          }
        } catch (error) {
          console.error(`Error fetching propertySettings for propertyId ${propertyId}:`, error);
          return 'Unknown Property';
        }
      };

      // Create a cache to store fetched property names
      const propertyNameCache: { [key: string]: string } = {};

      // Prepare promises for fetching property names
      const propertyNamePromises = propertyIds.map(async (propertyId) => {
        if (!propertyNameCache[propertyId]) {
          const propertyName = await fetchPropertyName(propertyId);
          propertyNameCache[propertyId] = propertyName;
        }
        return propertyNameCache[propertyId];
      });

      // Fetch all property names concurrently
      await Promise.all(propertyNamePromises);

      // Map property names to people data
      const enrichedPeopleData: PeopleData[] = peopleList.map(person => ({
        ...person,
        properties: person.propertyIds.map(id => ({
          id,
          name: propertyNameCache[id] || 'Unknown Property',
        })),
      }));

      console.log("Processed people data with property names:", enrichedPeopleData);
      setPeopleData(enrichedPeopleData);

      // Fetch assignees after setting people data
      await fetchAssignees();
    } catch (error) {
      console.error("Error fetching people data: ", error);
      message.error("Failed to fetch people data. Please try again.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [companyId]);

  // Add this new function to fetch assignees
  const fetchAssignees = useCallback(async () => {
    if (!companyId) return;
    
    try {
      const usersQuery = query(
        collection(db, 'users'),
        where('companyuid', '==', companyId)
      );
      const usersSnapshot = await getDocs(usersQuery);

      if (usersSnapshot.empty) {
        console.warn('No users found for this company.');
        return;
      }

      const assigneeData: { [key: string]: string } = {};
      usersSnapshot.docs.forEach((doc) => {
        const userData = doc.data();
        const name = `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'Unknown User';
        assigneeData[doc.id] = name;
      });

      setAssignees(assigneeData);
    } catch (error) {
      console.error('Error fetching assignees:', error);
      message.error('Failed to fetch assignees. Please try again.');
    }
  }, [companyId]);

  // Initialize by fetching the company ID
  useEffect(() => {
    const init = async () => {
      const fetchedCompanyId = await fetchCompanyId();
      if (fetchedCompanyId) {
        setCompanyId(fetchedCompanyId);
      } else {
        message.error("Failed to fetch company ID. Please try again.");
      }
    };
    init();
  }, [fetchCompanyId]);

  // Fetch people data when company ID is set
  useEffect(() => {
    if (companyId) {
      fetchPeopleData();
    }
  }, [fetchPeopleData, companyId]);

  // Handle refresh button click
  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchPeopleData();
  };

  // Handle people type filter
  const handlePeopleTypeFilter = (type: string) => {
    setPeopleTypeFilter(type);
    if (type === 'All') {
      setFilteredPeopleData(peopleData);
    } else if (type === 'Prospects') {
      const filtered = peopleData.filter(person => 
        person.type.toLowerCase() === 'prospect'
      );
      setFilteredPeopleData(filtered);
    } else if (type === 'Tenants') {
      const filtered = peopleData.filter(person => 
        person.type.toLowerCase() === 'tenant'
      );
      setFilteredPeopleData(filtered);
    } else if (type === 'Vendors') {
      const filtered = peopleData.filter(person => 
        person.type.toLowerCase() === 'vendor'
      );
      setFilteredPeopleData(filtered);
    } else if (type === 'Owners') {
      const filtered = peopleData.filter(person => 
        person.type.toLowerCase() === 'owner'
      );
      setFilteredPeopleData(filtered);
    } else {
      // For other types, keep the current behavior
      const filtered = peopleData.filter(person => 
        person.type.toLowerCase() === type.toLowerCase()
      );
      setFilteredPeopleData(filtered);
    }
  };

  // Handle drawer visibility
  const handleAddTaskClick = () => {
    setDrawerVisible(true);
  };

  const handleNewOwnerRequest = () => {
    navigate('/newownerrequest');
  };

  const handleNewTenantRequest = () => {
    navigate('/newtenantrequest');
  };

  const handleNewProspectClick = () => {
    setDrawerVisible(true);
  };

  const handleDrawerClose = () => {
    setDrawerVisible(false);
  };

  // Create skeleton data for loading state
  const createSkeletonData = (count: number): PeopleData[] => {
    return Array.from({ length: count }, (_, index) => ({
      key: `skeleton-${index}`,
      type: '',
      name: '',
      emails: [],
      phones: [],
      properties: [],
      leadStatus: '',
      status: '',
      avatar: '',
      avatarUrl: '',
      moveInDate: '',
      assignee: '',
      applicationStatus: '',
    }));
  };

  /**
   * **fetchPersonDetails Function**
   * Fetches detailed information about a specific person.
   */
  const fetchPersonDetails = useCallback(async (personId: string) => {
    if (!companyId) {
      console.error("No company ID available");
      return null;
    }

    try {
      const personDocRef = doc(db, 'people', personId);
      const personDoc = await getDoc(personDocRef);

      if (personDoc.exists()) {
        const personData = personDoc.data();
        // Fetch properties only if they exist
        let fetchedProperties: Array<{ id: string; name: string; unit?: string } | null> = [];
        if (Array.isArray(personData.properties) && personData.properties.length > 0) {
          const propertyPromises = personData.properties.map(async (prop: { property: string; unit?: string }) => {
            if (!prop || !prop.property) return null;
            try {
              const propertySettingsDoc = await getDocs(
                collection(db, 'properties', prop.property, 'propertySettings')
              );
              if (!propertySettingsDoc.empty) {
                const propData = propertySettingsDoc.docs[0].data();
                return { 
                  id: prop.property, 
                  name: propData.propertyName || 'Unnamed Property',
                  unit: prop.unit || undefined
                };
              }
            } catch (error) {
              console.error("Error fetching property details:", error);
            }
            return null;
          });

          fetchedProperties = (await Promise.all(propertyPromises)).filter(Boolean);
        }

        // Handle assignees
        const assigneeList = Array.isArray(personData.assignee) ? personData.assignee : 
                             (personData.assignee ? [personData.assignee] : []);

        const assigneePromises = assigneeList.map(async (assigneeId: string) => {
          if (!assigneeId) return null;
          try {
            const userDoc = await getDoc(doc(db, 'users', assigneeId));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              return {
                id: assigneeId,
                name: `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'Unknown User'
              };
            }
          } catch (error) {
            console.error("Error fetching assignee details:", error);
          }
          return null;
        });

        const assignees = (await Promise.all(assigneePromises)).filter(Boolean);
       
        return { 
          ...personData, 
          key: personDoc.id, 
          properties: fetchedProperties, 
          assignees,
          emails: personData.emails || [],
          phones: personData.phones || [],
          moveInDate: personData.moveInDate || '',
        };
      } else {
        console.warn("No such person document!");
        return null;
      }
    } catch (error) {
      console.error('Error fetching person details:', error);
      message.error("Failed to fetch person details. Please try again.");
      return null;
    }
  }, [companyId]);

  /**
   * **handleRowClick Function**
   * Handles the logic when a table row is clicked.
   */
  const handleRowClick = async (record: PeopleData) => {
    const personDetails = await fetchPersonDetails(record.key);
    if (personDetails) {
      navigate(`/people/${record.key}`, { state: { personDetails } });
    } else {
      message.error("Failed to fetch person details. Please try again.");
    }
  };

  // Define table columns
  const allColumns = [

    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      defaultSortOrder: 'ascend' as SortOrder,
      sorter: (a: PeopleData, b: PeopleData) => a.name.localeCompare(b.name),
      render: (text: string) => (loading ? <Skeleton.Input style={{ width: '100px' }} active size="small" /> : 
           <span style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{
             width: '40px',
             height: '40px',
             display: 'flex',
             alignItems: 'center',
             justifyContent: 'center',
             backgroundColor: '#d8e6d9',
             borderRadius: '4px',
             marginRight: '12px'
          }}>
            <UserOutlined style={{ fontSize: '24px', color: '#168033' }} />
          </span>
          <span style={{ display: 'flex', flexDirection: 'column' }}>
          <Text strong style={{ color: 'Black', fontSize: '14px' }}>{text}</Text>
           </span>
        </span>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      sorter: (a: PeopleData, b: PeopleData) => a.type.localeCompare(b.type),
      render: (text: string) => (loading ? <Skeleton.Input style={{ width: '100px' }} active size="small" /> : text),
    },
    {
      title: 'Contact Info',
      key: 'contactInfo',
      render: (text: string, record: PeopleData) => (
        <span>
          {record.emails.length > 0 && (
            <div>
              <MailOutlined style={{ marginRight: '8px', color: '#188034' }} />
              <Text>{record.emails[0]}</Text>
              {record.emails.length > 1 && (
                <Tooltip title={
                  <div>
                    {record.emails.map((email, index) => (
                      <div key={index}>{email}</div>
                    ))}
                  </div>
                }>
                  <span style={{ marginLeft: '8px', color: '#1F2121' }}>
                    +{record.emails.length - 1}
                  </span>
                </Tooltip>
              )}
            </div>
          )}
          {record.phones.length > 0 && (
            <div>
              <PhoneOutlined style={{ marginRight: '8px', color: '#5890E2' }} />
              <Text>{formatPhoneNumber(record.phones[0])}</Text>
              {record.phones.length > 1 && (
                <Tooltip title={
                  <div>
                    {record.phones.map((phone, index) => (
                      <div key={index}>{formatPhoneNumber(phone)}</div>
                    ))}
                  </div>
                }>
                  <span style={{ marginLeft: '8px', color: '#1F2121' }}>
                    +{record.phones.length - 1}
                  </span>
                </Tooltip>
              )}
            </div>
          )}
        </span>
      ),
    },
    {
      title: 'Property',
      key: 'property',
      render: (text: string, record: PeopleData) => {
        if (record.properties.length === 0) {
          return '--';
        }
        const firstProperty = record.properties[0].name;
        return (
          <span>
            {firstProperty}
            {record.properties.length > 1 && (
              <Tooltip title={
                <div>
                  {record.properties.map((prop, index) => (
                    <div key={index}>{prop.name}</div>
                  ))}
                </div>
              }>
                <span style={{ marginLeft: '8px', color: '#188034' }}>
                  +{record.properties.length - 1}
                </span>
              </Tooltip>
            )}
          </span>
        );
      },
      sorter: (a: PeopleData, b: PeopleData) => {
        const aName = a.properties[0]?.name || '';
        const bName = b.properties[0]?.name || '';
        return aName.localeCompare(bName);
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      sorter: (a: PeopleData, b: PeopleData) => a.status.localeCompare(b.status),
      render: (text: string) => (loading ? <Skeleton.Input style={{ width: '100px' }} active size="small" /> : text),
    },
    {
      title: '',
      align: 'center' as 'center',
      key: 'arrow',
      render: () => (loading ? <Skeleton.Button style={{ width: '24px' }} active size="small" shape="circle" /> : <RightOutlined />),
    },
  ];

  // Other columns definitions (Tenants, Prospects, Vendors, Owners) remain unchanged

  const tenantsColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: any, b: any) => a.name.localeCompare(b.name),
    },
    {
      title: 'Unit',
      dataIndex: 'unit',
      key: 'unit',
    },
    {
      title: 'Lease Start',
      dataIndex: 'leaseStart',
      key: 'leaseStart',
      sorter: (a: any, b: any) => new Date(a.leaseStart).getTime() - new Date(b.leaseStart).getTime(),
    },
    {
      title: 'Lease End',
      dataIndex: 'leaseEnd',
      key: 'leaseEnd',
      sorter: (a: any, b: any) => new Date(a.leaseEnd).getTime() - new Date(b.leaseEnd).getTime(),
    },
    {
      title: 'Contact',
      dataIndex: 'contact',
      key: 'contact',
    },
    {
      title: '',
      key: 'arrow',
      render: () => <RightOutlined />,
    },
  ];

  const prospectsColumns = [
    {
      title: 'Prospect',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: any, b: any) => a.name.localeCompare(b.name),
      render: (text: string, record: any) => (
        <span style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{
             width: '40px',
             height: '40px',
             display: 'flex',
             alignItems: 'center',
             justifyContent: 'center',
             backgroundColor: '#d8e6d9',
             borderRadius: '4px',
             marginRight: '12px'
          }}>
            <UserOutlined style={{ fontSize: '24px', color: '#168033' }} />
          </span>
          <span style={{ display: 'flex', flexDirection: 'column' }}>
          <Text strong style={{ color: 'Black', fontSize: '14px' }}>{text}</Text>

          <span style={{ display: 'flex', alignItems: 'center', marginLeft: '8px', color: '#FFA500' }}>
            <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '14px',
                height: '14px',
                backgroundColor: '#FFA500',
                borderRadius: '50%',
                marginRight: '4px'
               }}>
                <ClockCircleOutlined style={{ fontSize: '10px', color: 'white' }} />
              </span>
              <Text style={{ fontSize: '12px', color: '#FFA500' }}>New</Text>
            </span>         
           </span>
        </span>
      ),
    },
    {
      title: 'Move-In Date',
      dataIndex: 'moveInDate',
      key: 'moveInDate',
      render: (moveInDate: string) => (
        <div style={{ textAlign: 'center' }}>
          {moveInDate || '--'}
        </div>
      ),
    },
    {
      title: 'Contact Info',
      key: 'contactInfo',
      render: (text: string, record: PeopleData) => (
        <span>
          {record.emails.length > 0 && (
            <div>
              <MailOutlined style={{ marginRight: '8px', color: '#188034' }} />
              <Text>{record.emails[0]}</Text>
              {record.emails.length > 1 && (
                <Tooltip title={
                  <div>
                    {record.emails.map((email, index) => (
                      <div key={index}>{email}</div>
                    ))}
                  </div>
                }>
                  <span style={{ marginLeft: '8px', color: '#1F2121' }}>
                    +{record.emails.length - 1}
                  </span>
                </Tooltip>
              )}
            </div>
          )}
          {record.phones.length > 0 && (
            <div>
              <PhoneOutlined style={{ marginRight: '8px', color: '#5890E2' }} />
              <Text>{formatPhoneNumber(record.phones[0])}</Text>
              {record.phones.length > 1 && (
                <Tooltip title={
                  <div>
                    {record.phones.map((phone, index) => (
                      <div key={index}>{formatPhoneNumber(phone)}</div>
                    ))}
                  </div>
                }>
                  <span style={{ marginLeft: '8px', color: '#1F2121' }}>
                    +{record.phones.length - 1}
                  </span>
                </Tooltip>
              )}
            </div>
          )}
        </span>
      ),
    },
    {
      title: 'Assigned To',
      dataIndex: 'assignee',
      key: 'assignee',
      render: (assigneeIds: string | string[]) => {
        if (loading) {
          return <Skeleton.Input style={{ width: '100px' }} active size="small" />;
        }

        const assigneeList = Array.isArray(assigneeIds) ? assigneeIds : [assigneeIds];
        const primaryAssignee = assigneeList[0];
        const additionalAssignees = assigneeList.slice(1);

        const assigneeName = primaryAssignee ? (assignees[primaryAssignee] || 'Unknown') : 'Unassigned';
        const iconColor = primaryAssignee ? '#188034' : '#bfbfbf';
        const textColor = primaryAssignee ? 'inherit' : 'secondary';
        
        const content = (
          <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100px' }}>
            <span style={{
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#f0f0f0',
              borderRadius: '50%',
              marginBottom: '4px'
            }}>
              <UserOutlined style={{ fontSize: '18px', color: iconColor }} />
            </span>
            <Text type={textColor as any} strong style={{ textAlign: 'center' }}>{assigneeName}</Text>
            {additionalAssignees.length > 0 && (
              <Text type="secondary" style={{ fontSize: '12px' }}>
                +{additionalAssignees.length}
              </Text>
            )}
          </span>
        );

        if (additionalAssignees.length > 0) {
          const tooltipContent = (
            <div>
              {assigneeList.map((id) => (
                <div key={id}>{assignees[id] || 'Unknown'}</div>
              ))}
            </div>
          );

          return <Tooltip title={tooltipContent}>{content}</Tooltip>;
        }

        return content;
      },
    },
    {
      title: 'Rental Application',
      dataIndex: 'applicationStatus',
      key: 'applicationStatus',
      render: (status: string) => {
        // Normalize the status to lowercase to ensure case-insensitive matching
        const normalizedStatus = status.toLowerCase();
        let currentStep = 0;
        
        switch (normalizedStatus) {
          case 'start':
            currentStep = 0;
            break;
          case 'sent':
            currentStep = 1;
            break;
          case 'review':
            currentStep = 2;
            break;
          default:
            currentStep = 0; // Default to 'start' if status is unrecognized
        }

        return (
          <Steps 
            current={currentStep}
            size="small"
            type="inline"
            items={[
              { title: 'Start' },
              { title: 'Sent' },
              { title: 'Review' },
            ]}
          />
        );
      },
    },
    {
      title: '',
      key: 'actions',
      render: () => (
        <Dropdown overlay={actionMenu} trigger={['click']}>
        <Button type="link" icon={<MoreOutlined style={{ fontSize: '24px', fontWeight: 'bold' }} />} />
        </Dropdown>
      ),
    },
    {
      title: '',
      key: 'arrow',
      render: () => <RightOutlined />,
    },
  ];

  const vendorsColumns = [
    {
      title: 'Company Name',
      dataIndex: 'companyName',
      key: 'companyName',
      sorter: (a: any, b: any) => a.companyName.localeCompare(b.companyName),
    },
    {
      title: 'Service Type',
      dataIndex: 'serviceType',
      key: 'serviceType',
    },
    {
      title: 'Contact Person',
      dataIndex: 'contactPerson',
      key: 'contactPerson',
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '',
      key: 'arrow',
      render: () => <RightOutlined />,
    },
  ];

  const ownersColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: any, b: any) => a.name.localeCompare(b.name),
    },
    {
      title: 'Properties Owned',
      dataIndex: 'propertiesOwned',
      key: 'propertiesOwned',
    },
    {
      title: 'Total Units',
      dataIndex: 'totalUnits',
      key: 'totalUnits',
      sorter: (a: any, b: any) => a.totalUnits - b.totalUnits,
    },
    {
      title: 'Contact',
      dataIndex: 'contact',
      key: 'contact',
    },
    {
      title: 'Last Communication',
      dataIndex: 'lastCommunication',
      key: 'lastCommunication',
      sorter: (a: any, b: any) => new Date(a.lastCommunication).getTime() - new Date(b.lastCommunication).getTime(),
    },
    {
      title: '',
      key: 'arrow',
      render: () => <RightOutlined />,
    },
  ];

  // Function to get columns based on filter
  const getColumnsForFilter = () => {
    switch (peopleTypeFilter) {
      case 'Tenants':
        return tenantsColumns;
      case 'Prospects':
        return prospectsColumns;
      case 'Vendors':
        return vendorsColumns;
      case 'Owners':
        return ownersColumns;
      default:
        return allColumns;
    }
  };

  // Style for buttons
  const buttonStyle = {
    width: '140px',  // Fixed width for all buttons
    marginRight: '8px',
    marginBottom: '8px'  // Added for better spacing on smaller screens
  };
  
  // Menu for adding new people
  const addTaskMenu = (
    <Menu>
      <Menu.Item
        key="newTask"
        icon={<FileTextOutlined />}
        onClick={handleAddTaskClick}
      >
        New Tenants
      </Menu.Item>
      <Menu.Item
        key="newProspect"
        icon={<UserOutlined />}
        onClick={handleNewProspectClick}
      >
        New Prospect
      </Menu.Item>
      <Menu.Item
        key="newOwnerRequest"
        icon={<UserOutlined />}
        onClick={handleNewOwnerRequest}
      >
        New Owners
      </Menu.Item>
      <Menu.Item
        key="newTenantRequest"
        icon={<UserOutlined />}
        onClick={handleNewTenantRequest}
      >
        New Vendors
      </Menu.Item>
    </Menu>
  );

  // Add this new constant for the action menu
  const actionMenu = (
    <Menu>
      <Menu.Item key="moreInfo">View</Menu.Item>
      <Menu.Item key="edit">Edit</Menu.Item>
      <Menu.Item key="delete">Delete</Menu.Item>
    </Menu>
  );

  // Update the useEffect that depends on peopleData
   // Update the useEffect that depends on peopleData
   useEffect(() => {
    if (peopleTypeFilter === 'All') {
      setFilteredPeopleData(peopleData);
    } else if (peopleTypeFilter === 'Prospects') {
      const filtered = peopleData.filter(person => 
        person.type.toLowerCase() === 'prospect'
      );
      setFilteredPeopleData(filtered);
    } else if (peopleTypeFilter === 'Tenants') {
      const filtered = peopleData.filter(person => 
        person.type.toLowerCase() === 'tenant'
      );
      setFilteredPeopleData(filtered);
    } else if (peopleTypeFilter === 'Vendors') {
      const filtered = peopleData.filter(person => 
        person.type.toLowerCase() === 'vendor'
      );
      setFilteredPeopleData(filtered);
    } else if (peopleTypeFilter === 'Owners') {
      const filtered = peopleData.filter(person => 
        person.type.toLowerCase() === 'owner'
      );
      setFilteredPeopleData(filtered);
    } else {
      // For other types, keep the current behavior
      const filtered = peopleData.filter(person => 
        person.type.toLowerCase() === peopleTypeFilter.toLowerCase()
      );
      setFilteredPeopleData(filtered);
    }
  }, [peopleData, peopleTypeFilter]);

  const tableClassName = peopleTypeFilter === 'Prospects' ? 'prospects-table compact-rows' : '';
  const handleSubmitSuccess = () => {
    fetchPeopleData(); // Refresh the people data
  };

  return (
    <div style={{ padding: '64px 36px' }}>
      <Title level={1} style={{ textAlign: 'left', marginTop: '0px', marginBottom: '20px' }}>
        People
      </Title>
      <div className="property-page-container">
        <Row gutter={16} justify="space-between" align="middle" style={{ marginBottom: '16px' }}>
          <Col span={16}>
            <Row gutter={16}>
              <Col>
                <Input
                  placeholder="Search people"
                  className='people-search-input'
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </Col>
            </Row>
          </Col>
          <Col span={8} style={{ textAlign: 'right' }}>
            <Dropdown overlay={addTaskMenu} trigger={['click']}>
              <Button className="add-property-button" style={{ marginRight: '8px' }}>
                New People <DownOutlined />
              </Button>
            </Dropdown>
            <Button
              icon={<ReloadOutlined spin={isRefreshing} />}
              onClick={handleRefresh}
              disabled={isRefreshing}
            />
          </Col>
        </Row>

        <div style={{ marginTop: '16px', marginBottom: '16px' }}>
          <Button 
            type={peopleTypeFilter === 'All' ? 'primary' : 'default'}
            onClick={() => handlePeopleTypeFilter('All')}
            style={buttonStyle}
          >
            All
          </Button>
          <Button 
            type={peopleTypeFilter === 'Tenants' ? 'primary' : 'default'}
            onClick={() => handlePeopleTypeFilter('Tenants')}
            style={buttonStyle}
          >
            Tenants
          </Button>
          <Button 
            type={peopleTypeFilter === 'Prospects' ? 'primary' : 'default'}
            onClick={() => handlePeopleTypeFilter('Prospects')}
            style={buttonStyle}
          >
            Prospects
          </Button>
          <Button 
            type={peopleTypeFilter === 'Vendors' ? 'primary' : 'default'}
            onClick={() => handlePeopleTypeFilter('Vendors')}
            style={buttonStyle}
          >
            Vendors
          </Button>
          <Button 
            type={peopleTypeFilter === 'Owners' ? 'primary' : 'default'}
            onClick={() => handlePeopleTypeFilter('Owners')}
            style={{...buttonStyle, marginRight: 0}}
          >
            Owners
          </Button>
        </div>
      

        <Table
          columns={getColumnsForFilter()}
          dataSource={(loading) ? createSkeletonData(10) : filteredPeopleData}
          pagination={{ pageSize: 10 }}
          className={tableClassName}
          onRow={(record) => ({
            onClick: () => handleRowClick(record),
            style: { cursor: 'pointer' },
          })}
        />
      </div>

      <NewProspectPage 
        visible={drawerVisible} 
        onClose={handleDrawerClose}
        companyId={companyId || ''}
        onSubmitSuccess={handleSubmitSuccess}

      />
    </div>
  );
};

export default PeoplePage;