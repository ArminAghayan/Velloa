import React, { useEffect, useState, useCallback } from 'react';
import { Table, message, Button, Row, Col, Drawer, Form, Input,Divider , Tag, Carousel, DatePicker, Steps, Typography, Select, Dropdown, Menu, InputNumber, Card, Modal, App as AntdApp } from 'antd';
import { db } from '../../../../firebase-config';
import { doc, getDoc, onSnapshot, collection, addDoc, updateDoc, query, getDocs, where } from 'firebase/firestore';
import { PlusOutlined, EllipsisOutlined, LinkOutlined,ReloadOutlined,CheckCircleOutlined  } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';
import moment from 'moment';
import './propertyinfo_rental_applications.css';

const { Step } = Steps;
const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

interface RentalApplication {
  id: string;
  applicationId: string;
  property: string;
  unitId: string;
  anticipatedMoveInDate: string;
  createdDate: string;
  decision: string;
  unitName: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  ssn: string;
  dob: string;
  email: string;
  phoneNumber: string;
  gender: string;
  maritalStatus: string;
  driverLicenseState: string;
  driverLicenseNumber: string;
  residentialHistory: {
    address: string;
    moveInDate: string;
    monthlyPayment: number;
  };
  employment: {
    jobType: string;
    annualIncome: number;
    title: string;
    companyName: string;
  };
}

interface Unit {
  unitNumber: string;
  unitId: string;
  unitName: string;
  beds: number;
  baths: number;
  size: number;
  marketRent: number;
  images: { id: string; url: string }[];
  occupancy: string;
  propertyImageUrl?: string;
  propertyName: string;
}

interface RentalApplicationsProps {
  propertyId: string;
}

const RentalApplications: React.FC<RentalApplicationsProps> = ({ propertyId }) => {
  const [applications, setApplications] = useState<RentalApplication[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<RentalApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [visibleSteps, setVisibleSteps] = useState([0, 1]);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [units, setUnits] = useState<Unit[]>([]);
  const [formData, setFormData] = useState({});
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<RentalApplication | null>(null);
  const [unitImages, setUnitImages] = useState<{ [key: string]: string[] }>({});
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [spinning, setSpinning] = useState(false);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    const applicationsRef = collection(db, 'properties', propertyId, 'applications');
    const q = query(applicationsRef);
    
    try {
      const querySnapshot = await getDocs(q);
      const applicationsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as RentalApplication[];
      setApplications(applicationsData);
      setFilteredApplications(applicationsData);
    } catch (error) {
      console.error("Error fetching applications: ", error);
      message.error("Failed to fetch applications");
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    fetchApplications();

    const unsubscribe = onSnapshot(collection(db, 'properties', propertyId, 'applications'), (snapshot) => {
      const updatedApplications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as RentalApplication[];
      setApplications(updatedApplications);
      setFilteredApplications(updatedApplications);
    });

    return () => unsubscribe();
  }, [propertyId, fetchApplications]);

  useEffect(() => {
    handleFilter();
  }, [searchText, filterStatus, applications]);

  useEffect(() => {
    const fetchUnitImages = async () => {
      const propertyRef = doc(db, 'properties', propertyId);
      const propertyDoc = await getDoc(propertyRef);
      if (propertyDoc.exists()) {
        const data = propertyDoc.data();
        if (data.units) {
          const images: { [key: string]: string[] } = {};
          data.units.forEach((unit: any) => {
            if (unit.images && Array.isArray(unit.images)) {
              images[unit.unitId] = unit.images.map((img: any) => img.url);
            }
          });
          setUnitImages(images);
        }
      }
    };

    fetchUnitImages();
  }, [propertyId]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };

  const handleFilterChange = (value: string) => {
    setFilterStatus(value);
  };

  const handleFilter = useCallback(() => {
    console.log('Filtering applications. Search text:', searchText, 'Filter status:', filterStatus);
    let filtered = applications;
    if (searchText) {
      filtered = filtered.filter(application =>
        (`${application.firstName} ${application.lastName}`).toLowerCase().includes(searchText.toLowerCase())
      );
    }
    if (filterStatus) {
      filtered = filtered.filter(application => application.decision === filterStatus);
    }
    console.log('Filtered applications:', filtered);
    setFilteredApplications(filtered);
  }, [applications, searchText, filterStatus]);

  const fetchUnits = async () => {
    try {
      const propertyRef = doc(db, 'properties', propertyId);
      const propertyDoc = await getDoc(propertyRef);
      if (propertyDoc.exists()) {
        const propertyData = propertyDoc.data();
        const propertyImageUrl = propertyData.imageUrl;
        const propertyName = propertyData.propertyName;
  
        const unitsCollectionRef = collection(db, 'properties', propertyId, 'units');
        const unitsSnapshot = await getDocs(unitsCollectionRef);
  
        const availableUnits: Unit[] = unitsSnapshot.docs.map(doc => {
          const unitData = doc.data();
          return {
            unitNumber: unitData.unitNumber || '',
            unitId: doc.id,
            unitName: unitData.unitName || '',
            beds: unitData.beds || 0,
            baths: unitData.baths || 0,
            size: unitData.size || 0,
            marketRent: unitData.marketRent || 0,
            images: unitData.images || [],
            occupancy: unitData.occupancy || 'vacant',
            propertyImageUrl,
            propertyName
          };
        });
  
        console.log('Available units:', availableUnits);
        setUnits(availableUnits);
      } else {
        setUnits([]);
      }
    } catch (error) {
      console.error("Error fetching units: ", error);
      message.error("Failed to fetch units. Please check your permissions.");
      setUnits([]);
    }
  };
  

  const handleApprove = useCallback(async () => {
    if (selectedApplication) {
      try {
        const applicationRef = doc(db, 'properties', propertyId, 'applications', selectedApplication.id);
        await updateDoc(applicationRef, { decision: 'Approved' });
        setSelectedApplication({ ...selectedApplication, decision: 'Approved' });
        message.success('Application approved successfully');
        setIsModalVisible(false);
        fetchApplications();
      } catch (error) {
        console.error("Error approving application: ", error);
        message.error('Failed to approve application');
      }
    }
  }, [selectedApplication, propertyId, fetchApplications]);

  const handleDeny = useCallback(async () => {
    if (selectedApplication) {
      try {
        const applicationRef = doc(db, 'properties', propertyId, 'applications', selectedApplication.id);
        await updateDoc(applicationRef, { decision: 'Denied' });
        setSelectedApplication({ ...selectedApplication, decision: 'Denied' });
        message.success('Application denied successfully');
        setIsModalVisible(false);
        fetchApplications();
      } catch (error) {
        console.error("Error denying application: ", error);
        message.error('Failed to deny application');
      }
    }
  }, [selectedApplication, propertyId, fetchApplications]);

  const columns = [
    {
      title: 'Lessee Name',
      key: 'lesseeName',
      render: (text: any, record: RentalApplication) => `${record.firstName} ${record.lastName}`.trim(),
    },
    {
      title: 'Property',
      dataIndex: 'property',
      key: 'property',
    },
    {
      title: 'Unit #',
      dataIndex: 'unitName',
      key: 'unitName'
    },
    {
      title: 'Anticipated Move In Date',
      dataIndex: 'anticipatedMoveInDate',
      key: 'anticipatedMoveInDate',
      render: (text: string) => moment(text).format('DD MMMM YYYY')
    },
    {
      title: 'Created Date',
      dataIndex: 'createdDate',
      key: 'createdDate',
      render: (text: string) => moment(text).format('DD MMMM YYYY')
    },
    {
      title: 'Decision',
      dataIndex: 'decision',
      key: 'decision',
      render: (decision: string) => {
        let color = decision === 'Approved' ? 'green' : decision === 'Pending' ? 'blue' : 'red';
        return <Tag color={color}>{decision}</Tag>;
      }
    },
    {
      title: '',
      key: 'actions',
      align: 'right' as 'right',
      render: (text: any, record: RentalApplication) => (
        <Dropdown
          overlay={
            <Menu>
              <Menu.Item key="1" onClick={() => showModal(record)}>View</Menu.Item>
              <Menu.Item key="2">Edit</Menu.Item>
              <Menu.Item key="3">Delete</Menu.Item>
            </Menu>
          }
          trigger={['click']}
        >
          <a className="ant-dropdown-link" onClick={e => e.preventDefault()} style={{ paddingRight: '30px' }}>
            <EllipsisOutlined style={{ fontSize: '20px', color: 'black', transform: 'rotate(90deg)' }} />  
          </a>
        </Dropdown>
      ),
    }
  ];

  const handleNewApplicationClick = () => {
    fetchUnits();
    setDrawerVisible(true);
  };

  const handleDrawerClose = () => {
    setDrawerVisible(false);
    setCurrentStep(0);
    setVisibleSteps([0, 1]);
    form.resetFields();
    setFormData({});
  };

  const handleNext = async () => {
    if (currentStep === 0) {
      const values = form.getFieldsValue(['unitId']);
      if (!values.unitId) {
        message.error('Please select a unit before proceeding.');
        return;
      }
    }
    try {
      const values = await form.validateFields();
      setFormData(prevData => ({
        ...prevData,
        ...values
      }));
      const newCurrentStep = currentStep + 1;
      setCurrentStep(newCurrentStep);
      setVisibleSteps([newCurrentStep, newCurrentStep + 1]);
    } catch (error) {
      console.error('Validation Failed:', error);
    }
  };
  
  
  const handlePrev = () => {
    const newCurrentStep = currentStep - 1;
    setCurrentStep(newCurrentStep);
    setVisibleSteps([newCurrentStep - 1, newCurrentStep]);
  };

  const handleFormSubmit = async () => {
    try {
      const values = await form.validateFields();
      console.log('Final step values:', values);

      const allFormData = {
        ...formData,
        ...values
      };

      // Function to remove undefined values
      const removeUndefined = (obj: any): any => {
        Object.keys(obj).forEach(key => {
          if (obj[key] && typeof obj[key] === 'object') {
            removeUndefined(obj[key]);
          } else if (obj[key] === undefined) {
            delete obj[key];
          }
        });
        return obj;
      };

      const newApplication = removeUndefined({
        applicationId: uuidv4(),
        property: allFormData.property,
        unitId: allFormData.unitId,
        anticipatedMoveInDate: allFormData.anticipatedMoveInDate ? allFormData.anticipatedMoveInDate.format('YYYY-MM-DD') : null,
        createdDate: new Date().toISOString(),
        decision: 'Pending',
        firstName: allFormData.firstName,
        middleName: allFormData.middleName || null,
        lastName: allFormData.lastName,
        ssn: allFormData.ssn,
        dob: allFormData.dob ? allFormData.dob.format('YYYY-MM-DD') : null,
        email: allFormData.email,
        phoneNumber: allFormData.phoneNumber,
        gender: allFormData.gender,
        maritalStatus: allFormData.maritalStatus,
        driverLicenseState: allFormData.driverLicenseState,
        driverLicenseNumber: allFormData.driverLicenseNumber,
        unitName: allFormData.unitName,
        residentialHistory: {
          address: allFormData.residentialHistory.address,
          moveInDate: allFormData.residentialHistory.moveInDate ? allFormData.residentialHistory.moveInDate.format('YYYY-MM-DD') : null,
          monthlyPayment: allFormData.residentialHistory.monthlyPayment
        },
        employment: {
          jobType: allFormData.employment.jobType,
          annualIncome: allFormData.employment.annualIncome,
          title: allFormData.employment.title,
          companyName: allFormData.employment.companyName
        }
      });

      console.log('New application object:', newApplication);

      const applicationsRef = collection(db, 'properties', propertyId, 'applications');

      const docRef = await addDoc(applicationsRef, newApplication);
      console.log('New application added with ID:', docRef.id, newApplication);

      message.success('Application added successfully');
      form.resetFields();
      setFormData({});
      setDrawerVisible(false);
      setCurrentStep(0);
      setVisibleSteps([0, 1]);
    } catch (error) {
      console.error("Error adding application: ", error);
      const errorMessage = (error as Error).message;
      message.error(`Failed to add application: ${errorMessage || 'Unknown error'}`);
    }
  };
  const handleFetchUnits = async () => {
    setSpinning(true);
    await fetchUnits();
    setSpinning(false);
  };
  
  const showModal = (application: RentalApplication) => {
    setSelectedApplication(application);
    setIsModalVisible(true);
  };

  const handleSendLinkClick = () => {
    message.success('Link sent successfully');
  };

  console.log('Rendering component. Current step:', currentStep, 'Visible steps:', visibleSteps);

  return (
    <AntdApp>
      <div className="applications-container">
        <div className="applications-box">
          <Row gutter={16} justify="space-between" align="middle" style={{ marginBottom: '16px' }}>
            <Col span={16}>
              <Row gutter={16}>
                <Col>
                  <Input
                    className="application-search-input"
                    placeholder="Search applications"
                    value={searchText}
                    onChange={handleSearchChange}
                  />
                </Col>
                <Col>
                  <Select
                    className="application-dropdown-input"
                    placeholder="Filter by status"
                    onChange={handleFilterChange}
                    allowClear
                  >
                    <Option value="Approved">Approved</Option>
                    <Option value="Pending">Pending</Option>
                    <Option value="Rejected">Rejected</Option>
                  </Select>
                </Col>
              </Row>
            </Col>
            <Col span={8} style={{ textAlign: 'right' }}>
              <Button type="default" className="new-application-button" onClick={handleNewApplicationClick} style={{ marginRight: '8px' }}>
                <PlusOutlined /> New Application
              </Button>
              <Button type="primary" className="send-link-button" onClick={handleSendLinkClick}>
                <LinkOutlined /> Send Link
              </Button>
            </Col>
          </Row>

          <Table
            key={Date.now()}
            columns={columns}
            dataSource={filteredApplications}
            rowKey="applicationId"
            onRow={(record) => ({
              onClick: () => showModal(record),
            })}
          />
          
        <Modal
          title="Application Details"
          visible={isModalVisible}
          onOk={() => setIsModalVisible(false)}
          onCancel={() => setIsModalVisible(false)}
          width={1250}
          bodyStyle={{ background: '#F3F5F8', padding: '24px' }}
          className="application-modal"
          footer={[
            <Button key="approve" type="primary" style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }} onClick={handleApprove} className="modal-footer-button-rental">
              Approve
            </Button>,
            <Button key="deny" type="primary" danger onClick={handleDeny} className="modal-footer-button-rental">
              Deny
            </Button>,
            <Button key="close" onClick={() => setIsModalVisible(false)} className="modal-footer-button-rental">
              Close
            </Button>
          ]}
        >
          {selectedApplication ? (
            <div>
              <div style={{ borderRadius: '6px', overflow: 'hidden' }}>
                <Carousel autoplay>
                  {unitImages[selectedApplication.unitId]?.map((imageUrl, index) => (
                    <div key={index}>
                      <img
                        src={imageUrl}
                        alt={`Unit ${selectedApplication.unitName} - Image ${index + 1}`}
                        style={{ width: '100%', height: '300px', objectFit: 'cover' }}
                      />
                    </div>
                  ))}
                </Carousel>
              </div>
              <div style={{ marginTop: '24px', marginBottom: '24px' }}>
                <Title level={2}>{selectedApplication.property}</Title>
                <Title level={4} type="secondary" style={{ margin: 0 }}>Unit: {selectedApplication.unitName}</Title>
              </div>
              <Row gutter={[24, 24]}>
                <Col span={24}>
                  <Card size='small' title="Application Details" className="application-card">
                    <Row gutter={16}>
                      <Col span={6}>
                        <Text strong style={{ fontSize: '13px' }}>Application Status: </Text>
                        <Tag color={selectedApplication.decision === 'Approved' ? 'green' : selectedApplication.decision === 'Pending' ? 'blue' : 'red'}>{selectedApplication.decision}</Tag>
                      </Col>
                      <Col span={6}>
                        <Text strong style={{ fontSize: '13px' }}>Anticipated Move In Date: </Text>
                        <Text>{moment(selectedApplication.anticipatedMoveInDate).format('MMM D, YYYY')}</Text>
                      </Col>
                      <Col span={6}>
                        <Text strong style={{ fontSize: '13px' }}>Application Date: </Text>
                        <Text>{moment(selectedApplication.createdDate).format('MMM D, YYYY')}</Text>
                      </Col>
                    </Row>
                  </Card>
                </Col>
              </Row>
              <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
                <Col span={24}>
                  <Card size='small' title="Personal Information" className="application-card">
                    <Row gutter={[16, 16]}>
                      <Col span={8}>
                        <Paragraph><Text strong>First Name:</Text> {selectedApplication.firstName}</Paragraph>
                        <Paragraph><Text strong>Middle Name:</Text> {selectedApplication.middleName || 'N/A'}</Paragraph>
                        <Paragraph><Text strong>Last Name:</Text> {selectedApplication.lastName}</Paragraph>
                      </Col>
                      <Col span={8}>
                        <Paragraph><Text strong>Date of Birth:</Text> {moment(selectedApplication.dob).format('MMMM D, YYYY')}</Paragraph>
                        <Paragraph><Text strong>Gender:</Text> {selectedApplication.gender}</Paragraph>
                        <Paragraph><Text strong>Marital Status:</Text> {selectedApplication.maritalStatus}</Paragraph>
                      </Col>
                      <Col span={8}>
                        <Paragraph><Text strong>Email:</Text> {selectedApplication.email}</Paragraph>
                        <Paragraph><Text strong>Phone Number:</Text> {selectedApplication.phoneNumber}</Paragraph>
                        <Paragraph><Text strong>SSN:</Text> {selectedApplication.ssn}</Paragraph>
                      </Col>
                    </Row>
                  </Card>
                </Col>
              </Row>
              <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
                <Col span={12}>
                  <Card size='small' title="Identification" className="application-card" bodyStyle={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
                    <Paragraph style={{ marginBottom: '8px' }}><Text strong>Driver License State:</Text> {selectedApplication.driverLicenseState}</Paragraph>
                    <Paragraph style={{ marginBottom: '0' }}><Text strong>Driver License Number:</Text> {selectedApplication.driverLicenseNumber}</Paragraph>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card size='small' title="Employment" className="application-card">
                    <Paragraph><Text strong>Job Type:</Text> {selectedApplication.employment.jobType}</Paragraph>
                    <Paragraph><Text strong>Annual Income:</Text> ${selectedApplication.employment.annualIncome}</Paragraph>
                    <Paragraph><Text strong>Title/Position:</Text> {selectedApplication.employment.title}</Paragraph>
                    <Paragraph><Text strong>Company Name:</Text> {selectedApplication.employment.companyName}</Paragraph>
                  </Card>
                </Col>
              </Row>
              <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
                <Col span={12}>
                  <Card size='small' title="Residential History" className="application-card">
                    <Paragraph><Text strong>Address:</Text> {selectedApplication.residentialHistory.address}</Paragraph>
                    <Paragraph><Text strong>Move In Date:</Text> {moment(selectedApplication.residentialHistory.moveInDate).format('MMMM D, YYYY')}</Paragraph>
                    <Paragraph><Text strong>Monthly Payment:</Text> ${selectedApplication.residentialHistory.monthlyPayment}</Paragraph>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card size='small' title="Additional Information" className="application-card">
                    {/* Add additional information fields here */}
                    <Paragraph><Text strong>Field 1:</Text> Value 1</Paragraph>
                    <Paragraph><Text strong>Field 2:</Text> Value 2</Paragraph>
                    <Paragraph><Text strong>Field 3:</Text> Value 3</Paragraph>
                  </Card>
                </Col>
              </Row>
              <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
                <Col span={24}>
                  <Card size='small' title="Questions" className="application-card">
                    {/* Add questions and answers here */}
                    <Paragraph><Text strong>Question 1:</Text> Answer 1</Paragraph>
                    <Paragraph><Text strong>Question 2:</Text> Answer 2</Paragraph>
                    <Paragraph><Text strong>Question 3:</Text> Answer 3</Paragraph>
                  </Card>
                </Col>
              </Row>
            </div>
          ) : (
            <p>No data available.</p>
          )}
        </Modal>





        </div>

        <Drawer
  title="New Application"
  width="50%"
  onClose={handleDrawerClose}
  visible={drawerVisible}
  bodyStyle={{ paddingBottom: 80 }}
  footer={
    <div style={{ textAlign: 'right' }}>
      {currentStep > 0 && (
        <Button style={{ marginRight: 8 }} onClick={handlePrev}>
          Previous
        </Button>
      )}
      {currentStep < 4 && (
        <Button type="primary" onClick={handleNext}>
          Next
        </Button>
      )}
      {currentStep === 4 && (
        <Button type="primary" onClick={handleFormSubmit}>
          Submit
        </Button>
      )}
    </div>
  }
>
  <Steps current={currentStep} progressDot>
    <Step title="Available Units" />
    <Step title="Application Info" />
    <Step title="Residential History" />
    <Step title="Employment" />
    <Step title="Review" />
  </Steps>
  <Form layout="vertical" form={form} onFinish={handleFormSubmit}>
    {visibleSteps.includes(0) && currentStep === 0 && (
      <div>
        <Row justify="center" style={{ marginBottom: '16px' }}>
          <Col>
            <Title level={4}>Select a Unit</Title>
          </Col>
        </Row>
        <Row gutter={16} style={{ marginBottom: '16px' }} justify="space-between" align="middle">
          <Col span={8}>
            <Input
              placeholder="Search units"
              className='new-app-unit-search-input'
              onChange={(e) => {
                const searchValue = e.target.value.toLowerCase();
                setUnits(prevUnits => prevUnits.filter(unit => unit.unitName.toLowerCase().includes(searchValue)));
              }}
            />
          </Col>
          <Col span={8} style={{ textAlign: 'center' }}>
            <Title level={4}></Title>
          </Col>
          <Col span={8} style={{ textAlign: 'right' }}>
            <Button className='new-unit-app-refresh'
              icon={<ReloadOutlined style={{ transform: spinning ? 'rotate(360deg)' : 'rotate(0deg)', transition: 'transform 0.5s' }} />}
              onClick={handleFetchUnits}
            >
              Refresh
            </Button>
          </Col>
        </Row>
        <Divider />
        <Row gutter={16}>
          {units.map(unit => (
            <Col span={8} key={unit.unitNumber}>
              <Card
                hoverable
                cover={<img alt="unit" src={unit.propertyImageUrl || unit.images[0]?.url} style={{ height: '150px', objectFit: 'cover' }} />}
                onClick={() => {
                  form.setFieldsValue({
                    property: unit.propertyName,
                    unitNumber: unit.unitNumber,
                    unitName: unit.unitName,
                    unitId: unit.unitId // Set unitId here
                  });
                  setSelectedUnitId(unit.unitId); // Set selected unit ID
                }}
              >
                 <Card.Meta
                title={
                  <div>
                    <div>
                      <span style={{ fontSize: '16px', fontWeight: 'bold' }}>{unit.propertyName}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', marginTop: '4px' }}>
                      <span style={{ fontSize: '14px', color: '#888' }}>Unit {unit.unitName}</span>
                      {selectedUnitId === unit.unitId && (
                        <Tag color="green" icon={<CheckCircleOutlined />} style={{ marginLeft: '8px' }}>
                          Selected
                        </Tag>
                      )}
                    </div>
                  </div>
                }
                description={`${unit.beds} bed • ${unit.baths} bath • ${unit.size} sqft • $${unit.marketRent}`}
              />
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    )}
    {visibleSteps.includes(1) && currentStep === 1 && (
      <div style={{ marginTop: '24px' }}>
        <Form.Item
          name="firstName"
          label="First Name"
          rules={[{ required: true, message: 'Please enter the first name' }]}
          className="applicationdrawerinput"
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="middleName"
          label="Middle Name"
          className="applicationdrawerinput"
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="lastName"
          label="Last Name"
          rules={[{ required: true, message: 'Please enter the last name' }]}
          className="applicationdrawerinput"
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="ssn"
          label="SSN"
          rules={[{ required: true, message: 'Please enter the SSN' }]}
          className="applicationdrawerinput"
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="dob"
          label="Date of Birth"
          rules={[{ required: true, message: 'Please select the date of birth' }]}
          className="applicationdrawerinput"
        >
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item
          name="email"
          label="Email"
          rules={[{ required: true, message: 'Please enter the email' }]}
          className="applicationdrawerinput"
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="phoneNumber"
          label="Phone Number"
          rules={[{ required: true, message: 'Please enter the phone number' }]}
          className="applicationdrawerinput"
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="gender"
          label="Gender"
          rules={[{ required: true, message: 'Please select the gender' }]}
          className="applicationdrawerinput"
        >
          <Select>
            <Option value="Male">Male</Option>
            <Option value="Female">Female</Option>
            <Option value="Other">Other</Option>
          </Select>
        </Form.Item>
        <Form.Item
          name="maritalStatus"
          label="Marital Status"
          rules={[{ required: true, message: 'Please select the marital status' }]}
          className="applicationdrawerinput"
        >
          <Select>
            <Option value="Single">Single</Option>
            <Option value="Married">Married</Option>
            <Option value="Divorced">Divorced</Option>
            <Option value="Widowed">Widowed</Option>
          </Select>
        </Form.Item>
        <Form.Item
          name="driverLicenseState"
          label="Driver License Province/State"
          rules={[{ required: true, message: 'Please enter the driver license state' }]}
          className="applicationdrawerinput"
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="driverLicenseNumber"
          label="Driver License Number"
          rules={[{ required: true, message: 'Please enter the driver license number' }]}
          className="applicationdrawerinput"
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="anticipatedMoveInDate"
          label="Anticipated Move In Date"
          rules={[{ required: true, message: 'Please select the anticipated move-in date' }]}
          className="applicationdrawerinput"
        >
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item
          name="property"
          label="Property"
          className="applicationdrawerinput"
        >
          <Input disabled />
        </Form.Item>
        <Form.Item
          name="unitName"
          label="Unit Number"
          className="applicationdrawerinput"
        >
          <Input disabled />
        </Form.Item>
        <Form.Item
          name="unitId"  // Add hidden field for unitId
          style={{ display: 'none' }}
        >
          <Input type="hidden" />
        </Form.Item>
      </div>
    )}
    {visibleSteps.includes(2) && currentStep === 2 && (
      <div style={{ marginTop: '24px' }}>
        <Form.Item
          name={['residentialHistory', 'address']}
          label="Last Lived Address"
          rules={[{ required: true, message: 'Please enter the last lived address' }]}
          className="applicationdrawerinput"
        >
          <Input />
        </Form.Item>
        <Form.Item
          name={['residentialHistory', 'moveInDate']}
          label="Move In Date"
          rules={[{ required: true, message: 'Please select the move-in date' }]}
          className="applicationdrawerinput"
        >
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item
          name={['residentialHistory', 'monthlyPayment']}
          label="Monthly Payment"
          rules={[{ required: true, message: 'Please enter the monthly payment' }]}
          className="applicationdrawerinput"
        >
          <InputNumber style={{ width: '100%' }} />
        </Form.Item>
      </div>
    )}
    {visibleSteps.includes(3) && currentStep === 3 && (
      <div style={{ marginTop: '24px' }}>
        <Form.Item
          name={['employment', 'jobType']}
          label="Job Type"
          rules={[{ required: true, message: 'Please enter the job type' }]}
          className="applicationdrawerinput"
        >
          <Input />
        </Form.Item>
        <Form.Item
          name={['employment', 'annualIncome']}
          label="Annual Income"
          rules={[{ required: true, message: 'Please enter the annual income' }]}
          className="applicationdrawerinput"
        >
          <InputNumber style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item
          name={['employment', 'title']}
          label="Title/Position"
          rules={[{ required: true, message: 'Please enter the title/position' }]}
          className="applicationdrawerinput"
        >
          <Input />
        </Form.Item>
        <Form.Item
          name={['employment', 'companyName']}
          label="Company Name"
          rules={[{ required: true, message: 'Please enter the company name' }]}
          className="applicationdrawerinput"
        >
          <Input />
        </Form.Item>
      </div>
    )}
    {visibleSteps.includes(4) && currentStep === 4 && (
      <div style={{ marginTop: '24px' }}>
        <Title level={4}>Review Information</Title>
        <div className="review-item">
          <Text strong>First Name:</Text> <Text>{form.getFieldValue('firstName')}</Text>
        </div>
        <div className="review-item">
          <Text strong>Middle Name:</Text> <Text>{form.getFieldValue('middleName')}</Text>
        </div>
        <div className="review-item">
          <Text strong>Last Name:</Text> <Text>{form.getFieldValue('lastName')}</Text>
        </div>
        <div className="review-item">
          <Text strong>SSN:</Text> <Text>{form.getFieldValue('ssn')}</Text>
        </div>
        <div className="review-item">
          <Text strong>Date of Birth:</Text> <Text>{form.getFieldValue('dob')?.format('YYYY-MM-DD')}</Text>
        </div>
        <div className="review-item">
          <Text strong>Email:</Text> <Text>{form.getFieldValue('email')}</Text>
        </div>
        <div className="review-item">
          <Text strong>Phone Number:</Text> <Text>{form.getFieldValue('phoneNumber')}</Text>
        </div>
        <div className="review-item">
          <Text strong>Gender:</Text> <Text>{form.getFieldValue('gender')}</Text>
        </div>
        <div className="review-item">
          <Text strong>Marital Status:</Text> <Text>{form.getFieldValue('maritalStatus')}</Text>
        </div>
        <div className="review-item">
          <Text strong>Driver License State:</Text> <Text>{form.getFieldValue('driverLicenseState')}</Text>
        </div>
        <div className="review-item">
          <Text strong>Driver License Number:</Text> <Text>{form.getFieldValue('driverLicenseNumber')}</Text>
        </div>
        <div className="review-item">
          <Text strong>Residential History - Address:</Text> <Text>{form.getFieldValue(['residentialHistory', 'address'])}</Text>
        </div>
        <div className="review-item">
          <Text strong>Residential History - Move In Date:</Text> <Text>{form.getFieldValue(['residentialHistory', 'moveInDate'])?.format('YYYY-MM-DD')}</Text>
        </div>
        <div className="review-item">
          <Text strong>Residential History - Monthly Payment:</Text> <Text>{form.getFieldValue(['residentialHistory', 'monthlyPayment'])}</Text>
        </div>
        <div className="review-item">
          <Text strong>Employment - Job Type:</Text> <Text>{form.getFieldValue(['employment', 'jobType'])}</Text>
        </div>
        <div className="review-item">
          <Text strong>Employment - Annual Income:</Text> <Text>{form.getFieldValue(['employment', 'annualIncome'])}</Text>
        </div>
        <div className="review-item">
          <Text strong>Employment - Title/Position:</Text> <Text>{form.getFieldValue(['employment', 'title'])}</Text>
        </div>
        <div className="review-item">
          <Text strong>Employment - Company Name:</Text> <Text>{form.getFieldValue(['employment', 'companyName'])}</Text>
        </div>
        <div className="review-item">
          <Text strong>Anticipated Move In Date:</Text> <Text>{form.getFieldValue('anticipatedMoveInDate')?.format('YYYY-MM-DD')}</Text>
        </div>
      </div>
    )}
  </Form>
</Drawer>




      </div>
    </AntdApp>
  );
};

export default RentalApplications;
