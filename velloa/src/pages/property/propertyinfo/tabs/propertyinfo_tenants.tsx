import React, { useEffect, useState } from 'react';
import { Table, message, Button, Row, Col, Form, Input, Tag, Typography, Select, Divider, Tooltip } from 'antd';
import { db } from '../../../../firebase-config';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { PlusOutlined, UserOutlined, MailTwoTone, PhoneTwoTone, ClockCircleOutlined, RightOutlined } from '@ant-design/icons';
import { Tenant as ReduxTenant } from '../../../../components/redux/tenantslice';
import './propertyinfo_tenants.css';
const { Title, Text } = Typography;
const { Option } = Select;

export interface Tenant extends Omit<ReduxTenant, 'unit'> {
  tenantId: string;
  tenantName: string;
  firstName: string;
  lastName: string;
  email: string;
  unit: string | null;
  paymentDate: string;
  rentAmount: number;
  decision: string;
  moveInDate: string;
  inviteToPortal: boolean;
  rentersInsurance: boolean;
  rentDueDate: string;
  leaseType: string;
  leaseStartDate: string;
  leaseEndDate?: string | null;
  depositAmount: number;
  depositDueDate: string;
  lateFeeAmount: number;
  lateFeeStartDay: number;
}

interface RentalApplication {
  applicationId: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  decision: string;
  unitId?: string;
}

interface Unit {
  unitId: string;
  unitName: string;
  unitNumber: string;
  beds: number;
  baths: number;
  sqft: number;
  rent: number;
  propertyImageUrl?: string;
  images?: { id: string; url: string }[];
  propertyName: string;
  marketRent: number;
  size: number;
}

interface TenantsProps {
  propertyId: string;
}

interface TenantSummaryProps {
  tenant: {
    tenantName: string;
    moveInDate: string;
    inviteToPortal: boolean;
    rentersInsurance: boolean;
    unit: string;
    rentAmount: number | string;
    rentDueDate: number;
    leaseType: string;
    leaseStartDate: string;
    leaseEndDate?: string;
    depositAmount: number | string;
    depositDueDate: string;
    lateFeeAmount: number | string;
    lateFeeStartDay: number;
  };
}

interface People {
  id: string;
  firstName?: string;
  lastName?: string;
  phones?: Array<{ number: string; type: string }>;
  emails?: Array<{ address: string; type: string }>;
  unit?: {
    name?: string;
  };
  leaseStatus?: string;
  property?: {
    name?: string;
  };
  peopleType?: string;
  companyId?: string;
}

const TenantSummary: React.FC<TenantSummaryProps> = ({ tenant }) => {
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime())
      ? date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      : 'Not set';
  };

  const formatCurrency = (amount: number | string | undefined) => {
    if (amount === undefined || amount === null || amount === '') return 'Not set';
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return isNaN(numAmount) ? 'Not set' : `$${numAmount.toFixed(2)}`;
  };

  const formatRentDueDate = (day: number | undefined) => {
    if (day === undefined || day === null) return 'Not set';
    const suffixes = ['th', 'st', 'nd', 'rd'];
    const suffix = day % 10 <= 3 && day % 10 > 0 && day !== 11 && day !== 12 && day !== 13 ? suffixes[day % 10] : suffixes[0];
    return `${day}${suffix} of the month`;
  };

  return (
    <div className="tenant-summary" style={{ paddingLeft: '24px', paddingRight: '24px', textAlign: 'center' }}>
      <Title level={3} style={{ marginBottom: '24px' }}>Tenant Summary</Title>
      <Divider />

      <Title level={4}>Tenant</Title>
      <Text>Name: {tenant.tenantName || 'Not set'}</Text><br />
      <Text>Move-in Date: {formatDate(tenant.moveInDate)}</Text><br />
      <Text>Invite to Portal: {tenant.inviteToPortal ? 'Yes' : 'No'}</Text><br />
      <Text>Renters Insurance: {tenant.rentersInsurance ? 'Yes' : 'No'}</Text><br />

      <Divider />

      <Title level={4}>Unit</Title>
      <Text>Unit: {tenant.unit || 'Not assigned'}</Text><br />

      <Divider />

      <Title level={4}>Rent Details</Title>
      <Text>Rent Amount: {formatCurrency(tenant.rentAmount)}</Text><br />
      <Text>Rent Due Date: {formatRentDueDate(tenant.rentDueDate)}</Text><br />
      <Text>Lease Type: {tenant.leaseType || 'Not set'}</Text><br />
      <Text>Lease Start Date: {formatDate(tenant.leaseStartDate)}</Text><br />
      <Text>Lease End Date: {formatDate(tenant.leaseEndDate)}</Text><br />

      <Divider />

      <Title level={4}>Deposit Information</Title>
      <Text>Deposit Amount: {tenant.depositAmount !== '' ? formatCurrency(tenant.depositAmount) : 'No deposit set'}</Text><br />
      <Text>Deposit Due Date: {tenant.depositDueDate ? formatDate(tenant.depositDueDate) : ''}</Text><br />

      <Divider />

      <Title level={4}>Late Fee Policy</Title>
      <Text>Late Fee Amount: {tenant.lateFeeAmount !== '' ? formatCurrency(tenant.lateFeeAmount) : 'No late fees'}</Text><br />
      <Text>Late Fee Start Day: {tenant.lateFeeStartDay !== 0 ? `${tenant.lateFeeStartDay} day(s) after due date` : ''}</Text><br />
    </div>
  );
};

const PropertyInfoTenants: React.FC<TenantsProps> = ({ propertyId }) => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [filteredTenants, setFilteredTenants] = useState<Tenant[]>([]);
  const [applications, setApplications] = useState<RentalApplication[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<RentalApplication[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<RentalApplication | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUnits, setFilteredUnits] = useState(units);

  const [people, setPeople] = useState<People[]>([]);
  const [originalPeople, setOriginalPeople] = useState<People[]>([]);

  useEffect(() => {
    fetchTenantsData();
    fetchApplications();
    fetchUnits();
    fetchPeople();
  }, [propertyId]);

  useEffect(() => {
    handleFilter();
  }, [searchText, filterStatus, tenants]);

  useEffect(() => {
    if (!searchText && !filterStatus) {
      setPeople(originalPeople);  // Reset to original data when no filters
    } else {
      handleFilter();
    }
  }, [searchText, filterStatus, originalPeople]);

  const fetchTenantsData = async () => {
    try {
      setLoading(true);
      const tenantsCollectionRef = collection(db, 'properties', propertyId, 'tenants');
      const tenantsSnapshot = await getDocs(query(tenantsCollectionRef, where("decision", "==", "Approved")));
      const approvedTenants = tenantsSnapshot.docs.map(doc => {
        const data = doc.data() as Omit<Tenant, 'id'>;
        return {
          ...data,
          id: doc.id,
        };
      });
      setTenants(approvedTenants);
      setFilteredTenants(approvedTenants);
    } catch (error) {
      console.error("Error fetching tenants: ", error);
      message.error("Failed to fetch tenants. Please check your permissions.");
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    try {
      const applicationsRef = collection(db, 'properties', propertyId, 'applications');
      const applicationsSnapshot = await getDocs(applicationsRef);
      const approvedApplications = applicationsSnapshot.docs
        .map(doc => ({
          applicationId: doc.id,
          ...doc.data()
        }))
        .filter((application: any) => application.decision === 'Approved') as RentalApplication[];
      setApplications(approvedApplications);
      setFilteredApplications(approvedApplications);
    } catch (error) {
      console.error("Error fetching applications: ", error);
      message.error("Failed to fetch applications. Please check your permissions.");
    }
  };

  const fetchUnits = async () => {
    try {
      const propertyRef = doc(db, 'properties', propertyId);
      const propertyDoc = await getDoc(propertyRef);

      if (!propertyDoc.exists()) {
        console.log("No such property document!");
        setUnits([]);
        return;
      }

      const propertyData = propertyDoc.data();
      const propertyImageUrl = propertyData.imageUrl;
      const propertyName = propertyData.propertyName;

      const unitsCollectionRef = collection(propertyRef, 'units');
      const unitsSnapshot = await getDocs(unitsCollectionRef);

      if (unitsSnapshot.empty) {
        console.log("No units found in the subcollection");
        setUnits([]);
        return;
      }

      const availableUnits: Unit[] = unitsSnapshot.docs.map(doc => {
        const unitData = doc.data();
        return {
          unitId: doc.id,
          unitName: unitData.unitName || unitData.unitNumber,
          unitNumber: unitData.unitNumber,
          beds: unitData.beds,
          baths: unitData.baths,
          sqft: unitData.sqft,
          rent: unitData.rent,
          propertyImageUrl,
          images: unitData.images || [],
          propertyName,
          marketRent: unitData.marketRent,
          size: unitData.size
        };
      });

      console.log('Available units:', availableUnits);
      setUnits(availableUnits);
    } catch (error) {
      console.error("Error fetching units: ", error);
      message.error("Failed to fetch units. Please check your permissions.");
      setUnits([]);
    }
  };

  const fetchPeople = async () => {
    try {
      const propertyDoc = await getDoc(doc(db, 'properties', propertyId));
      if (!propertyDoc.exists()) {
        throw new Error('Property not found');
      }
      
      const propertyData = propertyDoc.data();
      const companyId = propertyData?.companyuid;
      
      console.log('Company ID:', companyId);

      if (!companyId) {
        console.error("Property data:", propertyData);
        throw new Error('Company ID not found for property');
      }

      const peopleCollectionRef = collection(db, 'people');
      const peopleQuery = query(
        peopleCollectionRef,
        where('companyId', '==', companyId),
        where('peopleType', '==', 'tenant')
      );
      
      const peopleSnapshot = await getDocs(peopleQuery);
      console.log('People snapshot size:', peopleSnapshot.size);
      
      const peopleData = peopleSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as People[];
      
      console.log('People data:', peopleData);
      setPeople(peopleData);
      setOriginalPeople(peopleData);
    } catch (error) {
      console.error("Error fetching people: ", error);
      message.error("Failed to fetch people data");
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };

  const handleFilterChange = (value: string) => {
    setFilterStatus(value);
  };


  const handleFilter = () => {
    let filtered = [...people];
    if (searchText) {
      filtered = filtered.filter(person =>
        `${person.firstName} ${person.lastName}`.toLowerCase().includes(searchText.toLowerCase())
      );
    }
    if (filterStatus) {
      filtered = filtered.filter(person => {
        const status = (person.leaseStatus || '').toLowerCase();
        switch (filterStatus.toLowerCase()) {
          case 'active':
            return status === 'active';
          case 'inactive':
            return status === 'expired';
          case 'pending':
            return status === 'pending';
          default:
            return true;
        }
      });
    }
    setPeople(filtered);
  };


  const handlePersonSelect = (person: People) => {
    setSelectedApplication({
      applicationId: person.id,
      firstName: person.firstName || '',
      lastName: person.lastName || '',
      phoneNumber: person.phones?.[0]?.number || '',
      email: person.emails?.[0]?.address || '',
      decision: 'Approved'
    });
  };

  useEffect(() => {
    const filtered = units.filter(unit =>
      unit.unitName.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUnits(filtered);
  }, [searchTerm, units]);

  const getSummaryContent = () => {
    const values = form.getFieldsValue();
    const applicationName = selectedApplication ? `${selectedApplication.firstName} ${selectedApplication.lastName}` : 'Not set';
    const unit = units.find(unit => unit.unitId === selectedUnit);

    return (
      <TenantSummary
        tenant={{
          tenantName: applicationName,
          moveInDate: values.moveInDate?.format('YYYY-MM-DD'),
          inviteToPortal: values.inviteToPortal,
          rentersInsurance: values.rentersInsurance,
          unit: unit ? unit.unitName : 'Not assigned',
          rentAmount: values.rentAmount,
          rentDueDate: values.rentDueDate,
          leaseType: values.leaseType,
          leaseStartDate: values.leaseStartDate?.format('YYYY-MM-DD') || values.monthToMonthStartDate?.format('YYYY-MM-DD'),
          leaseEndDate: values.leaseEndDate?.format('YYYY-MM-DD'),
          depositAmount: values.depositAmount !== '' ? values.depositAmount : 'No deposit set',
          depositDueDate: values.depositDueDate ? values.depositDueDate?.format('YYYY-MM-DD') : '',
          lateFeeAmount: values.lateFeeAmount !== '' ? values.lateFeeAmount : 'No late fees set',
          lateFeeStartDay: values.lateFeeStartDay !== 0 ? values.lateFeeStartDay : 0,
        }}
      />
    );
  };



  return (
    <div className="tenants-container">
      <div className="tenants-box">
        <Row gutter={16} justify="space-between" align="middle" style={{ marginBottom: '16px' }}>
          <Col xs={24} sm={24} md={12} lg={12}>
            <Row gutter={16} wrap={false}>
              <Col>
                <Input
                  className="tenant-search-input"
                  placeholder="Search tenants"
                  value={searchText}
                  onChange={handleSearchChange}
                />
              </Col>
              <Col>
                <Select
                  className="tenant-dropdown-input"
                  placeholder="Filter by status"
                  onChange={handleFilterChange}
                  allowClear
                  style={{ width: 150 }}
                >
                  <Option value="Active">Active</Option>
                  <Option value="Inactive">Expired</Option>
                  <Option value="Pending">Pending</Option>
                </Select>
              </Col>
            </Row>
          </Col>
          <Col 
            xs={24} 
            sm={24} 
            md={12} 
            lg={12} 
            style={{ 
              textAlign: 'right',
              marginTop: 16
            }}
            className="new-tenant-button-container"
          >
            <Button 
              className="new-tenant-button"
              type="default" 
              icon={<PlusOutlined />}
            >
              Add Tenant
            </Button>
          </Col>
        </Row>

        <Table
          dataSource={people}
          columns={[
            {
              title: 'Tenant',
              key: 'name',
              render: (_, record: People) => (
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
                    <Text strong style={{ color: 'Black', fontSize: '14px' }}>
                      {`${record.firstName || ''} ${record.lastName || ''}`.trim() || 'N/A'}
                    </Text>
                    {record.leaseStatus && (
                      <span style={{ display: 'flex', alignItems: 'center', marginLeft: '8px', color: '#FFA500' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '14px',
                          height: '14px',
                          backgroundColor: record.leaseStatus === 'Active' ? '#52c41a' : '#FFA500',
                          borderRadius: '50%',
                          marginRight: '4px'
                        }}>
                          <ClockCircleOutlined style={{ fontSize: '10px', color: 'white' }} />
                        </span>
                        <Text style={{ fontSize: '12px', color: record.leaseStatus === 'Active' ? '#52c41a' : '#FFA500' }}>
                          {record.leaseStatus}
                        </Text>
                      </span>
                    )}
                  </span>
                </span>
              ),
            },
            {
              title: 'Property',
              key: 'property',
              render: (_, record: People) => (
                <div style={{ textAlign: 'center' }}>
                  {record.property?.name || '--'}
                </div>
              ),
            },
            {
              title: 'Contact Info',
              key: 'contactInfo',
              render: (_, record: People) => (
                <span>
                  <div>
                    <MailTwoTone style={{ marginRight: '8px', color: '#188034' }} />
                    {record.emails && record.emails.length > 1 ? (
                      <Tooltip title={record.emails.map(email => email.address).join('\n')}>
                        <Text>{record.emails[0].address} +{record.emails.length - 1}</Text>
                      </Tooltip>
                    ) : (
                      <Text>{record.emails?.[0]?.address || 'No email'}</Text>
                    )}
                  </div>
                  <div>
                    <PhoneTwoTone style={{ marginRight: '8px', color: record.phones?.[0]?.number ? '#5890E2' : '#bfbfbf' }} />
                    {record.phones && record.phones.length > 1 ? (
                      <Tooltip title={record.phones.map(phone => phone.number).join('\n')}>
                        <Text>{record.phones[0].number} +{record.phones.length - 1}</Text>
                      </Tooltip>
                    ) : (
                      <Text type={record.phones?.[0]?.number ? undefined : "secondary"}>
                        {record.phones?.[0]?.number || 'No phone number'}
                      </Text>
                    )}
                  </div>
                </span>
              ),
            },
            {
              title: 'Unit',
              key: 'unit',
              render: (_, record: People) => (
                <div style={{ textAlign: 'center' }}>
                  {record.unit?.name || '--'}
                </div>
              ),
            },
            {
              title: 'Lease Status',
              key: 'leaseStatus',
              render: (_, record: People) => {
                const status = record.leaseStatus || 'No Status';
                let color = 'default';
                
                switch (status.toLowerCase()) {
                  case 'active':
                    color = 'success';
                    break;
                  case 'pending':
                    color = 'warning';
                    break;
                  case 'expired':
                    color = 'error';
                    break;
                  default:
                    color = 'default';
                }
                
                return (
                  <div style={{ textAlign: 'center' }}>
                    <Tag color={color}>
                      {status}
                    </Tag>
                  </div>
                );
              },
            },
            {
              title: '',
              key: 'actions',
              render: (_, record: People) => (
                <Button 
                  type="link" 
                  onClick={() => handlePersonSelect(record)}
                  disabled={!record.firstName || !record.lastName}
                  icon={<RightOutlined />}
                />
              ),
            },
          ]}
          rowKey="id"
          pagination={{ pageSize: 5 }}
          locale={{ emptyText: 'No people found' }}
        />
      </div>
    </div>
  );
};

export default PropertyInfoTenants;
