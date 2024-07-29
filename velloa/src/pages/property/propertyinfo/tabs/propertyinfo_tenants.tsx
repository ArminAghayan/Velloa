import React, { useEffect, useState } from 'react';
import { Table, message, Button, Row, Col, Drawer, Form, Input, DatePicker, Tag, Steps, Typography, Select, Switch, Modal, Card, InputNumber, Divider } from 'antd';
import { db } from '../../../../firebase-config';
import { doc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { PlusOutlined, DeleteOutlined, CheckCircleOutlined, ClockCircleFilled, CalendarOutlined } from '@ant-design/icons';
import { IconPigMoney, IconPigOff, IconCashBanknote, IconCashBanknoteOff } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setSelectedTenant, Tenant as ReduxTenant } from '../../../../components/redux/tenantslice';
import { v4 as uuidv4 } from 'uuid';
import './propertyinfo_tenants.css';
import moment from 'moment';
import { getFunctions, httpsCallable } from 'firebase/functions';

const { Step } = Steps;
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

const TenantSummary: React.FC<TenantSummaryProps> = ({ tenant }) => {
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Not set';
    const date = moment(dateString);
    return date.isValid() ? date.format('MMM D, YYYY') : 'Not set';
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
      {tenant.leaseType === 'fixedTerm' && tenant.leaseEndDate && (
        <><Text>Lease End Date: {formatDate(tenant.leaseEndDate)}</Text><br /></>
      )}
      
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
  const [selectedUnitRent, setSelectedUnitRent] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [isApplicationModalVisible, setIsApplicationModalVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUnits, setFilteredUnits] = useState(units);
  const [leaseType, setLeaseType] = useState<string | null>(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [depositRequired, setDepositRequired] = useState<boolean | null>(null);
  const [lateFeesRequired, setLateFeesRequired] = useState<boolean | null>(null);

  useEffect(() => {
    fetchTenants();
    fetchApplications();
    fetchUnits();
  }, [propertyId]);

  useEffect(() => {
    handleFilter();
  }, [searchText, filterStatus, tenants]);

  const fetchTenants = async () => {
    try {
      const propertyRef = doc(db, 'properties', propertyId);
      const propertyDoc = await getDoc(propertyRef);
      if (propertyDoc.exists()) {
        const data = propertyDoc.data();
        const approvedTenants = (data.tenants || []).filter((tenant: Tenant) => tenant.decision === 'Approved');
        setTenants(approvedTenants);
        setFilteredTenants(approvedTenants);
      } else {
        console.log("No such document!");
      }
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
      if (propertyDoc.exists()) {
        const data = propertyDoc.data();
        const propertyImageUrl = data.imageUrl;
        const propertyName = data.propertyName;

        if (!data.units) {
          console.log("No units field found in the property data");
          setUnits([]);
          return;
        }

        if (Array.isArray(data.units)) {
          const availableUnits = data.units.map((unit: any) => ({
            ...unit,
            propertyImageUrl,
            propertyName,
            unitName: unit.unitName || unit.unitNumber,
            unitId: unit.unitId,
            images: unit.images || [],
            marketRent: unit.marketRent,
            size: unit.size
          }));
          console.log('Available units:', availableUnits);
          setUnits(availableUnits);
        } else {
          setUnits([]);
        }
      } else {
        console.log("No such document!");
        setUnits([]);
      }
    } catch (error) {
      console.error("Error fetching units: ", error);
      message.error("Failed to fetch units. Please check your permissions.");
      setUnits([]);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };

  const handleFilterChange = (value: string) => {
    setFilterStatus(value);
  };

  const handleFilter = () => {
    let filtered = tenants;
    if (searchText) {
      filtered = filtered.filter(tenant =>
        tenant.tenantName.toLowerCase().includes(searchText.toLowerCase())
      );
    }
    if (filterStatus) {
      // Implement status filtering logic here if needed
    }
    setFilteredTenants(filtered);
  };

  const handleApplicationSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase();
    const filtered = applications.filter(application =>
      `${application.firstName} ${application.lastName}`.toLowerCase().includes(value) ||
      application.phoneNumber.toLowerCase().includes(value) ||
      application.email.toLowerCase().includes(value)
    );
    setFilteredApplications(filtered);
  };

  const handleUnitSelect = (unitId: string) => {
    const unit = units.find(u => u.unitId === unitId);
    if (unit) {
      setSelectedUnit(unitId);
      setSelectedUnitRent(unit.marketRent);
      form.setFieldsValue({
        rentAmount: unit.marketRent,
        unitId: unit.unitId,
      });
    }
  };

  const columns = [
    {
      title: 'Tenant Name',
      dataIndex: 'tenantName',
      key: 'tenantName',
    },
    {
      title: 'Unit',
      dataIndex: 'unit',
      key: 'unit',
    },
    {
      title: 'Payment Date',
      dataIndex: 'paymentDate',
      key: 'paymentDate',
    },
    {
      title: 'Rent Amount',
      dataIndex: 'rentAmount',
      key: 'rentAmount',
      render: (amount: number) => `$${amount.toFixed(2)}`,
    },
  ];

  const applicationColumns = [
    {
      title: 'Full Name',
      dataIndex: 'firstName',
      key: 'firstName',
      render: (text: string, record: RentalApplication) => `${record.firstName} ${record.lastName}`
    },
    {
      title: 'Phone Number',
      dataIndex: 'phoneNumber',
      key: 'phoneNumber',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Decision',
      dataIndex: 'decision',
      key: 'decision',
      render: (decision: string) => (
        <Tag color={decision === 'Approved' ? 'green' : 'red'}>
          {decision}
        </Tag>
      ),
    },
  ];

  const handleLateFeeSelection = (required: boolean) => {
    setLateFeesRequired(required);
    if (!required) {
      form.setFieldsValue({
        lateFeeAmount: '',
        lateFeeStartDay: 0,
      });
    }
  };

  const handleRowClick = (tenant: Tenant) => {
    dispatch(setSelectedTenant(tenant as ReduxTenant));
    navigate(`/propertyinfo/${propertyId}/tenant/${tenant.tenantName}`);
  };

  const handleNewTenantClick = () => {
    setDrawerVisible(true);
    setCurrentStep(0);
    form.resetFields();
    setSelectedApplication(null);
    setSelectedUnit(null);
    setSelectedUnitRent(null);
  };

  const handleDrawerClose = () => {
    setDrawerVisible(false);
    setCurrentStep(0);
    form.resetFields();
    setSelectedApplication(null);
    setSelectedUnit(null);
    setSelectedUnitRent(null);
  };

  const nextStep = () => {
    if (currentStep === 0 && !selectedApplication) {
      message.error("Please add a tenant to proceed.");
      return;
    }
    if (currentStep === 1 && !selectedUnit) {
      message.error("Please select a unit to proceed.");
      return;
    }
    if (currentStep === 2 && !leaseType) {
      message.error("Please select a lease type to proceed.");
      return;
    }
    if (currentStep === 3 && depositRequired === null) {
      message.error("Please select a deposit option to proceed.");
      return;
    }
    form.validateFields().then(() => {
      setCurrentStep(currentStep + 1);
    }).catch((error) => {
      console.error('Validation Failed:', error);
    });
  };

  const handleDepositSelection = (required: boolean) => {
    setDepositRequired(required);
    if (!required) {
      form.setFieldsValue({
        depositAmount: '',
        depositDueDate: '',
      });
    }
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleFormSubmit = async () => {
    try {
      const values = await form.validateFields();
      console.log('Form Values:', values);
  
      const newTenant: Partial<Tenant> = {
        tenantId: uuidv4(),
        tenantName: `${values.firstName || ''} ${values.lastName || ''}`.trim() || 'Unnamed Tenant',
        email: values.email || '',
        firstName: values.firstName || '',
        lastName: values.lastName || '',
        unit: values.unit || null,
        paymentDate: values.paymentDate || '',
        rentAmount: Number(values.rentAmount) || 0,
        decision: 'Pending',
        moveInDate: values.moveInDate ? values.moveInDate.format('YYYY-MM-DD') : '',
        inviteToPortal: Boolean(values.inviteToPortal),
        rentersInsurance: Boolean(values.rentersInsurance),
        rentDueDate: values.rentDueDate || '',
        leaseType: values.leaseType || '',
        leaseStartDate: values.leaseStartDate ? values.leaseStartDate.format('YYYY-MM-DD') : (values.monthToMonthStartDate ? values.monthToMonthStartDate.format('YYYY-MM-DD') : ''),
        leaseEndDate: values.leaseEndDate ? values.leaseEndDate.format('YYYY-MM-DD') : null,
        depositAmount: Number(values.depositAmount) || 0,
        depositDueDate: values.depositDueDate ? values.depositDueDate.format('YYYY-MM-DD') : '',
        lateFeeAmount: Number(values.lateFeeAmount) || 0,
        lateFeeStartDay: Number(values.lateFeeStartDay) || 0,
      };
  
      // Function to remove any undefined, null, or empty string values
      const removeInvalidValues = (obj: Record<string, any>) => {
        return Object.entries(obj).reduce((acc, [key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            acc[key] = value;
          }
          return acc;
        }, {} as Record<string, any>);
      };
  
      const cleanedTenant = removeInvalidValues(newTenant);
      console.log('Cleaned Tenant:', cleanedTenant);
  
      const propertyRef = doc(db, 'properties', propertyId);
      const propertyDoc = await getDoc(propertyRef);
      if (propertyDoc.exists()) {
        const data = propertyDoc.data();
        const currentTenants = data.tenants || [];
  
        const cleanedCurrentTenants = currentTenants.map((tenant: any) => removeInvalidValues(tenant));
        const updatedTenants = [...cleanedCurrentTenants, cleanedTenant];
        
        console.log('Updated Tenants:', JSON.stringify(updatedTenants, null, 2));
  
        // Check for any remaining undefined values
        const checkForUndefined = (obj: any, path = '') => {
          Object.entries(obj).forEach(([key, value]) => {
            const newPath = path ? `${path}.${key}` : key;
            if (value === undefined) {
              console.error(`Undefined value found at path: ${newPath}`);
            } else if (typeof value === 'object' && value !== null) {
              checkForUndefined(value, newPath);
            }
          });
        };
  
        checkForUndefined({ tenants: updatedTenants });
  
        // Update Firestore document
        try {
          await updateDoc(propertyRef, { tenants: updatedTenants });
        } catch (updateError: any) {
          console.error("Error updating document:", updateError);
          if (updateError.message.includes("Unsupported field value: undefined")) {
            const match = updateError.message.match(/\(found in field (.*?)\)/);
            if (match) {
              const fieldPath = match[1];
              console.error(`Undefined value found in field: ${fieldPath}`);
            }
          }
          throw updateError;
        }
  
        message.success('Tenant added successfully');
        handleDrawerClose();
  
        if (cleanedTenant.email) {
          const functions = getFunctions();
          const sendWelcomeEmail = httpsCallable(functions, 'sendWelcomeEmail');
          try {
            const result = await sendWelcomeEmail({
              email: cleanedTenant.email,
              tenantName: cleanedTenant.tenantName,
            });
            console.log('Welcome email result:', result);
          } catch (error) {
            console.error('Error sending welcome email:', error);
          }
        }
  
        const approvedTenants = updatedTenants.filter((tenant: Tenant) => tenant.decision === 'Approved');
        setTenants(approvedTenants);
        setFilteredTenants(approvedTenants);
      } else {
        console.log("No such document!");
        message.error("Property document not found");
      }
    } catch (error: any) {
      console.error("Error adding tenant: ", error);
      if (error.message.includes("Unsupported field value: undefined")) {
        const match = error.message.match(/\(found in field (.*?)\)/);
        if (match) {
          const fieldPath = match[1];
          message.error(`Failed to add tenant. Undefined value found in field: ${fieldPath}`);
        } else {
          message.error("Failed to add tenant. Undefined value found in an unknown field.");
        }
      } else {
        message.error("Failed to add tenant. Please check your form inputs and try again.");
      }
    }
  };

  


  const showApplicationModal = () => {
    setIsApplicationModalVisible(true);
  };

  const handleApplicationModalOk = () => {
    setIsApplicationModalVisible(false);
  };

  const handleApplicationModalCancel = () => {
    setIsApplicationModalVisible(false);
  };

  useEffect(() => {
    const filtered = units.filter(unit => 
      unit.unitName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      unit.unitNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUnits(filtered);
  }, [searchTerm, units]);

  const handleLeaseTypeChange = (type: 'fixedTerm' | 'monthToMonth') => {
    setLeaseType(type);
    form.setFieldsValue({ leaseType: type });
  };

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

  const steps = [
    { title: 'Tenant', content: 'Tenant Content' },
    { title: 'Unit', content: 'Unit Content' },
    { title: 'Rent', content: 'Rent Content' },
    { title: 'Deposit', content: 'Deposit Content' },
    { title: 'Late Fees', content: 'Late Fees Content' },
    { title: 'Summary', content: 'Summary Content' },
  ];

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <div className="tenant-form-content centered-content">
            <Divider orientation="center">
              <Title level={4}>Who are the tenants?</Title>
            </Divider>
            <div className="tenant-content-wrapper">
              <div className="tenant-selection">
                {selectedApplication ? (
                  <Card
                    style={{ width: 200, marginBottom: 16, backgroundColor: '#f0f0f0', textAlign: 'center' }}
                    cover={
                      <img
                        alt={selectedApplication.firstName}
                        src={`https://api.dicebear.com/6.x/initials/svg?seed=${selectedApplication.firstName} ${selectedApplication.lastName}`}
                        style={{ height: 100, width: 100, objectFit: 'cover', borderRadius: '50%', margin: '24px auto 0 auto' }}
                      />
                    }
                    actions={[
                      <DeleteOutlined key="delete" onClick={() => setSelectedApplication(null)} />,
                    ]}
                  >
                    <Card.Meta
                      title={<div style={{ textAlign: 'center' }}>{`${selectedApplication.firstName} ${selectedApplication.lastName}`}</div>}
                    />
                  </Card>
                ) : (
                  <Button
                    type="dashed"
                    icon={<PlusOutlined />}
                    style={{ width: 200, height: 200, marginBottom: 16, backgroundColor: '#FAFAFA', margin: '0 auto' }}
                    onClick={showApplicationModal}
                  >
                    Add Tenant
                  </Button>
                )}
              </div>
            </div>
            
            <Divider style={{ width: '50%', margin: '24px auto' }} />
            
            <Form layout="vertical" form={form} onFinish={handleFormSubmit}>
              <Row gutter={16} className="move-in-date">
                <Col span={12}>
                  <Form.Item
                    name="moveInDate"
                    label="Move-in Date"
                    rules={[{ required: true, message: 'Please select the move-in date' }]}
                  >
                    <DatePicker style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16} className="tenant-options">
                <Col span={12}>
                  <Card>
                    <Title level={5}>Tenant Portal</Title>
                    <Text>If turned on, tenants will receive an invitation by email to access their online portal.</Text>
                    <Form.Item
                      name="inviteToPortal"
                      valuePropName="checked"
                      initialValue={false}
                    >
                      <Switch />
                    </Form.Item>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card>
                    <Title level={5}>Renters Insurance</Title>
                    <Text>If turned on, we will require the tenant to purchase renters insurance to protect your property and provide proof of coverage.</Text>
                    <Form.Item
                      name="rentersInsurance"
                      valuePropName="checked"
                      initialValue={false}
                    >
                      <Switch />
                    </Form.Item>
                  </Card>
                </Col>
              </Row>
            </Form>
          </div>
        );
      case 1:
        return (
          <div className="tenant-unit">
            <Divider orientation="center">
              <Title level={4}>Select Unit</Title>
            </Divider>
            <Input
              placeholder="Search by unit number"
              style={{ marginBottom: 16 }}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="tenant-unit-search"
            />
            <div className="unit-selection-container">
              {filteredUnits.map(unit => (
                <Card
                  key={unit.unitId}
                  hoverable
                  cover={
                    <img 
                      alt={unit.unitName}
                      src={unit.propertyImageUrl || unit.images?.[0]?.url || '/placeholder-image.jpg'}
                      style={{ height: '200px', objectFit: 'cover' }}
                    />
                  }
                  onClick={() => handleUnitSelect(unit.unitId)}
                  className={`unit-card ${unit.unitId === selectedUnit ? 'selected-unit' : ''}`}
                >
                  <Card.Meta
                    title={
                      <div>
                        <Text strong style={{ fontSize: '18px' }}>{unit.propertyName}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: '14px' }}>Unit {unit.unitName}</Text>
                      </div>
                    }
                    description={
                      <>
                        <Text>{`${unit.beds} bed • ${unit.baths} bath • ${unit.size} sqft`}</Text>
                        <br />
                        <Text strong>{`$${unit.marketRent}/month`}</Text>
                      </>
                    }
                  />
                  {unit.unitId === selectedUnit && (
                    <Tag color="green" style={{ marginTop: 8, width: '100%', textAlign: 'center' }}>
                      <CheckCircleOutlined /> Selected
                    </Tag>
                  )}
                </Card>
              ))}
            </div>
          </div>
        );
      case 2:
        return (
          <div className="tenant-form-content">
            <Divider orientation="center">
              <Title level={4}>Rent Details</Title>
            </Divider>
            <Row gutter={16} style={{ width: '100%', maxWidth: 600 }}>
              <Col span={12}>
                <Form.Item
                  name="rentAmount"
                  label="Rent Amount"
                  rules={[{ required: true, message: 'Please enter the rent amount' }]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={value => {
                      const parsedValue = parseFloat(value!.replace(/\$\s?|(,*)/g, ''));
                      return isNaN(parsedValue) ? 0 : parsedValue;
                    }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="rentDueDate"
                  label="Rent Due Date"
                  rules={[{ required: true, message: 'Please select the rent due date' }]}
                >
                  <Select>
                    {[...Array(28)].map((_, i) => (
                      <Option key={i + 1} value={i + 1}>{`${i + 1}${['st', 'nd', 'rd'][i] || 'th'} of the month`}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Divider />

            <Title level={4}>Lease Terms</Title>
            <Form.Item label="What is the term of this lease?" required>
              <Row gutter={16}>
                <Col span={12}>
                  <Button
                    type={leaseType === 'fixedTerm' ? 'primary' : 'default'}
                    onClick={() => handleLeaseTypeChange('fixedTerm')}
                    style={{ width: '100%', height: 150, fontSize: 18, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}
                  >
                    <ClockCircleFilled style={{ fontSize: 32, marginBottom: 8 }} />
                    Fixed Term
                  </Button>
                </Col>
                <Col span={12}>
                  <Button
                    type={leaseType === 'monthToMonth' ? 'primary' : 'default'}
                    onClick={() => handleLeaseTypeChange('monthToMonth')}
                    style={{ width: '100%', height: 150, fontSize: 18, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}
                  >
                    <CalendarOutlined style={{ fontSize: 32, marginBottom: 8 }} />
                    Month-to-Month
                  </Button>
                </Col>
              </Row>
            </Form.Item>

            {leaseType === 'fixedTerm' && (
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <Form.Item
                    name="leaseStartDate"
                    label="Start Date"
                    rules={[{ required: true, message: 'Please select the lease start date' }]}
                  >
                    <DatePicker style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    name="leaseEndDate"
                    label="End Date"
                    rules={[{ required: true, message: 'Please select the lease end date' }]}
                  >
                    <DatePicker style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>
            )}

            {leaseType === 'monthToMonth' && (
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <Form.Item
                    name="monthToMonthStartDate"
                    label="Start Date"
                    rules={[{ required: true, message: 'Please select the start date for the month-to-month lease' }]}
                  >
                    <DatePicker style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>
            )}

            {leaseType === 'fixedTerm' && (
              <Form.Item
                name="rollover"
                valuePropName="checked"
                style={{ display: 'flex', alignItems: 'center', paddingTop: 16 }}
              >
                <Switch style={{ marginRight: 8 }} />
                Rollover to 'Month to Month' at the end of the term
              </Form.Item>
            )}
          </div>
        );
      case 3:
        return (
          <div className="tenant-form-content">
            <Divider orientation="center">
              <Title level={4}>Deposit Information</Title>
            </Divider>
            <Text style={{ textAlign: 'center', marginBottom: 24 }}>Is a deposit required?</Text>
            <Form.Item required>
              <Row gutter={16}>
                <Col span={12}>
                  <Button
                    type={depositRequired === true ? 'primary' : 'default'}
                    onClick={() => handleDepositSelection(true)}
                    style={{ width: '100%', minWidth: '150px', height: 150, fontSize: 18, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}
                  >
                    <IconPigMoney size={50} />
                    Deposit
                  </Button>
                </Col>
                <Col span={12}>
                  <Button
                    type={depositRequired === false ? 'primary' : 'default'}
                    onClick={() => handleDepositSelection(false)}
                    style={{ width: '100%', minWidth: '150px', height: 150, fontSize: 18, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}
                  >
                    <IconPigOff size={50} />
                    No Deposit
                  </Button>
                </Col>
              </Row>
            </Form.Item>

            {depositRequired && (
              <>
                <Row gutter={16} style={{ width: '100%', maxWidth: 600, marginTop: 24 }}>
                  <Col span={12}>
                    <Form.Item
                      name="depositAmount"
                      label="Deposit Amount"
                      rules={[{ required: depositRequired, message: 'Please enter the deposit amount' }]}
                    >
                      <InputNumber
                        style={{ width: '100%' }}
                        formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={value => value!.replace(/\$\s?|(,*)/g, '')}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="depositDueDate"
                      label="Deposit Due Date"
                      rules={[{ required: depositRequired, message: 'Please select the deposit due date' }]}
                    >
                      <DatePicker style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                </Row>
              </>
            )}
          </div>
        );
      case 4:
        return (
          <div className="tenant-form-content">
            <Divider orientation="center">
              <Title level={4}>Late Fee Policy</Title>
            </Divider>

            <Text style={{ textAlign: 'center', marginBottom: 24 }}>Are late fees applicable?</Text>
            <Form.Item required>
              <Row gutter={16}>
                <Col span={12}>
                  <Button
                    type={lateFeesRequired === true ? 'primary' : 'default'}
                    onClick={() => handleLateFeeSelection(true)}
                    style={{
                      width: '100%',
                      minWidth: '150px',
                      height: 150,
                      fontSize: 18,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}
                  >
                    <IconCashBanknote size={50} />
                    Late Fees
                  </Button>
                </Col>
                <Col span={12}>
                  <Button
                    type={lateFeesRequired === false ? 'primary' : 'default'}
                    onClick={() => handleLateFeeSelection(false)}
                    style={{
                      width: '100%',
                      minWidth: '150px',
                      height: 150,
                      fontSize: 18,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}
                  >
                    <IconCashBanknoteOff size={50} />
                    No Late Fees
                  </Button>
                </Col>
              </Row>
            </Form.Item>

            {lateFeesRequired && (
              <>
                <Row gutter={16} style={{ width: '100%', maxWidth: 600, marginTop: 24 }}>
                  <Col span={12}>
                    <Form.Item
                      name="lateFeeAmount"
                      label="Late Fee Amount"
                      rules={[{ required: lateFeesRequired, message: 'Please enter the late fee amount' }]}
                    >
                      <InputNumber
                        style={{ width: '100%' }}
                        formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={value => value!.replace(/\$\s?|(,*)/g, '')}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="lateFeeStartDay"
                      label="Late Fee Start Day"
                      rules={[{ required: lateFeesRequired, message: 'Please select when late fees start' }]}
                    >
                      <Select>
                        {[...Array(60)].map((_, i) => (
                          <Option key={i + 1} value={i + 1}>{`${i + 1} day${i === 0 ? '' : 's'} after due date`}</Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>
              </>
            )}
          </div>
        );
      case 5:
        const formValues = form.getFieldsValue(true);
        const selectedUnitDetails = units.find(unit => unit.unitId === selectedUnit);

        const tenantData = {
          tenantName: `${selectedApplication?.firstName || ''} ${selectedApplication?.lastName || ''}`.trim() || 'Not set',
          moveInDate: formValues.moveInDate?.format('YYYY-MM-DD') || '',
          inviteToPortal: formValues.inviteToPortal || false,
          rentersInsurance: formValues.rentersInsurance || false,
          unit: selectedUnitDetails ? selectedUnitDetails.unitName : 'Not assigned',
          rentAmount: formValues.rentAmount || '',
          rentDueDate: formValues.rentDueDate || '',
          leaseType: formValues.leaseType || '',
          leaseStartDate: formValues.leaseStartDate?.format('YYYY-MM-DD') || formValues.monthToMonthStartDate?.format('YYYY-MM-DD'),
          leaseEndDate: formValues.leaseEndDate?.format('YYYY-MM-DD'),
          depositAmount: formValues.depositAmount !== '' ? formValues.depositAmount : 'No deposit set',
          depositDueDate: formValues.depositDueDate ? formValues.depositDueDate?.format('YYYY-MM-DD') : '',
          lateFeeAmount: formValues.lateFeeAmount !== '' ? formValues.lateFeeAmount : 'No late fees set',
          lateFeeStartDay: formValues.lateFeeStartDay !== 0 ? formValues.lateFeeStartDay : 0,
        };

        return <TenantSummary tenant={tenantData} />;
    }
  };

  return (
    <div className="tenants-container">
      <Row gutter={16} justify="space-between" align="middle" style={{ marginBottom: '16px' }}>
        <Col span={16}>
          <Row gutter={16}>
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
              >
                <Option value="Current">Current</Option>
                <Option value="Past">Past</Option>
              </Select>
            </Col>
          </Row>
        </Col>
        <Col span={8} style={{ textAlign: 'right' }}>
          <Button type="default" className="new-tenant-button" onClick={handleNewTenantClick}>
            <PlusOutlined /> New Tenant
          </Button>
        </Col>
      </Row>

      <Table
        columns={columns}
        dataSource={filteredTenants}
        loading={loading}
        onRow={(record) => ({
          onClick: () => handleRowClick(record),
        })}
      />
      <Drawer
        title="New Tenant"
        width="50%"
        onClose={handleDrawerClose}
        visible={drawerVisible}
        bodyStyle={{ paddingBottom: 80 }}
        footer={
          <div style={{ textAlign: 'right' }}>
            {currentStep > 0 && (
              <Button style={{ marginRight: 8 }} onClick={prevStep}>
                Previous
              </Button>
            )}
            {currentStep < steps.length - 1 && (
              <Button type="primary" onClick={nextStep}>
                Next
              </Button>
            )}
            {currentStep === steps.length - 1 && (
              <Button type="primary" onClick={handleFormSubmit}>
                Submit
              </Button>
            )}
          </div>
        }
      >
        <Steps current={currentStep}>
          {steps.map(item => (
            <Step key={item.title} title={item.title} />
          ))}
        </Steps>
        <Form layout="vertical" form={form} initialValues={{ rentAmount: selectedUnitRent, leaseType, unitId: selectedUnit }} onFinish={handleFormSubmit}>
          <div className="steps-content">
            {renderStepContent(currentStep)}
          </div>
        </Form>
      </Drawer>

      <Modal
        title="Select Application"
        visible={isApplicationModalVisible}
        onOk={handleApplicationModalOk}
        onCancel={handleApplicationModalCancel}
        width={800}
      >
        <Input
          placeholder="Search applications"
          onChange={handleApplicationSearchChange}
          style={{ marginBottom: '16px' }}
        />
        <Table
          columns={applicationColumns}
          dataSource={filteredApplications}
          rowClassName={(record) => (record.applicationId === selectedApplication?.applicationId ? 'selected-row' : '')}
          onRow={(record) => ({
            onClick: () => {
              setSelectedApplication(record);
              setSelectedUnit(record.unitId || null);
              setIsApplicationModalVisible(false);
            },
          })}
          rowKey="applicationId"
        />
      </Modal>
    </div>
  );
};

export default PropertyInfoTenants;
