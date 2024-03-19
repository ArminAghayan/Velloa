import React, { useState, useEffect } from 'react';
import { Button, Modal, Steps, Form, Input, InputNumber, Space, message, Layout, Menu, Dropdown, Avatar, Typography, theme, Card, Col, Row, Select } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined, SettingOutlined, LogoutOutlined, UserOutlined, BlockOutlined, UploadOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { db, auth } from '../../firebase-config';
import { collection, addDoc, query, where, getDocs, doc, writeBatch,setDoc,getDoc } from 'firebase/firestore';
import moment from 'moment';
import './dashboard.css';

interface PropertyDetails {
  propertyName: string;
  address: {
    addressline: string;
    city: string;
    postal: string;
    province: string;
    country: string;
  };
  imageUrl?: string;
  id?: string;
}

interface UnitInfo {
  numFloors: number;
  unitsPerFloor: number;
}

interface Property {
  id: string;
  propertyName: string;
  imageUrl?: string;
  numUnits: number;
}

const { Header } = Layout;
const { Title } = Typography;
const { Step } = Steps;
const { Option } = Select;

const DashboardPage = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<{ propertyDetails: PropertyDetails; unitInfo: UnitInfo }>({
    propertyDetails: {
      propertyName: '',
      address: {
        addressline: '',
        city: '',
        postal: '',
        province: '',
        country: '',
      },
    },
    unitInfo: {
      numFloors: 0,
      unitsPerFloor: 0,
    },
  });
  const [companyDocId, setCompanyDocId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("Loading company...");
  const [properties, setProperties] = useState<Property[]>([]);
  const navigate = useNavigate();

  const handleCardClick = (property: Property) => {
    navigate('/home', { state: { property } });
  };

  useEffect(() => {
    const fetchUserCompany = async () => {
      if (auth.currentUser) {
        const userUid = auth.currentUser.uid;
        console.log("Fetching company for user ID:", userUid);
        const companiesRef = collection(db, "companies");
        const q = query(companiesRef, where("uid", "==", userUid));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const companyData = querySnapshot.docs[0].data();
          console.log("Company data found:", companyData);
          setCompanyDocId(querySnapshot.docs[0].id);
          setCompanyName(companyData.companyName);
        } else {
          console.log("No company found for the user.");
          setCompanyName("No company found.");
        }
      }
    };

    fetchUserCompany();
  }, []);

  useEffect(() => {
    const fetchProperties = async () => {
      if (auth.currentUser && companyDocId) {
        const propertiesRef = collection(db, `companies/${companyDocId}/properties`);
        const snapshot = await getDocs(propertiesRef);

        if (!snapshot.empty) {
          const propertiesList: Property[] = [];

          for (const docSnapshot of snapshot.docs) {
            const propertyId = docSnapshot.id;

            const propertyInfoRef = doc(db, "companies", companyDocId, "properties", propertyId, "propertyinfo", "details");
            const propertyInfoSnapshot = await getDoc(propertyInfoRef);

            const propertyUnitsRef = doc(db, "companies", companyDocId, "properties", propertyId, "propertyunits", "details");
            const propertyUnitsSnapshot = await getDoc(propertyUnitsRef);

            if (propertyInfoSnapshot.exists() && propertyUnitsSnapshot.exists()) {
              const propertyData = propertyInfoSnapshot.data() as PropertyDetails;
              const unitsData = propertyUnitsSnapshot.data() as UnitInfo;
              const totalUnits = unitsData.numFloors * unitsData.unitsPerFloor;

              propertiesList.push({
                id: propertyId,
                propertyName: propertyData.propertyName,
                imageUrl: propertyData.imageUrl,
                numUnits: totalUnits,
              });
            }
          }

          console.log("Properties found:", propertiesList);
          setProperties(propertiesList);
        } else {
          console.log("No properties found for this company.");
        }
      }
    };

    fetchProperties();
  }, [companyDocId]); // Ensure that companyDocId is properly defined in your state.


  const onFinishPropertyDetails = async (values: PropertyDetails) => {
    if (!auth.currentUser || !companyDocId) {
      message.error("You must be logged in and have a company selected to perform this action.");
      return;
    }
  
    try {
      const propertyRef = collection(db, `companies/${companyDocId}/properties`);
      const docRef = await addDoc(propertyRef, {
      });
  
      const propertyInfoRef = doc(docRef, 'propertyinfo', 'details');
      await setDoc(propertyInfoRef, {
        ...values,
        propertyName: values.propertyName,

        propertyId: docRef.id,
      });
  
      setFormData({
        ...formData,
        propertyDetails: {
          ...values,
          id: docRef.id,
        },
      });
      next();
    } catch (error) {
      console.error("Error adding property details: ", error);
      message.error("An error occurred while adding the property details.");
    }
  };


  const onFinishUnitInfo = async (values: UnitInfo) => {
    if (!auth.currentUser || !companyDocId) {
      message.error("You must be logged in and have a company selected to perform this action.");
      return;
    }
  
    try {
      const totalUnits = values.numFloors * values.unitsPerFloor;
      const propertyRef = doc(db, `companies/${companyDocId}/properties/${formData.propertyDetails.id}`);
      const propertyUnitsRef = doc(propertyRef, 'propertyunits', 'details');
  
      await setDoc(propertyUnitsRef, {
        numFloors: values.numFloors,
        unitsPerFloor: values.unitsPerFloor,
        totalUnits,
      });
  
      message.success("Property units added successfully!");
      next();
    } catch (error) {
      console.error("Error adding document: ", error);
      message.error("An error occurred while adding the property units.");
    }
  };

  const showModal = () => setIsModalVisible(true);
  const handleCancel = () => resetFormAndHideModal();
  const next = () => setCurrentStep(currentStep + 1);
  const prev = () => setCurrentStep(currentStep - 1);
  const resetFormAndHideModal = () => {
    setIsModalVisible(false);
    setCurrentStep(0);
    setFormData({
      propertyDetails: {
        propertyName: '',
        address: {
          addressline: '',
          city: '',
          postal: '',
          province: '',
          country: '',
        },
      },
      unitInfo: {
        numFloors: 0,
        unitsPerFloor: 0,
      },
    });
  };

  const dropdownMenu = (
    <Menu>
      <Menu.Item icon={<SettingOutlined />}>
        <Link to="/settings">Settings</Link>
      </Menu.Item>
      <Menu.Item icon={<BlockOutlined />}>
        <Link to="/dashboard">Overview</Link>
      </Menu.Item>
      <Menu.Item icon={<LogoutOutlined />}>
        <Link to="/logout">Logout</Link>
      </Menu.Item>
    </Menu>
  );

  const { token: { colorBgContainer } } = theme.useToken();

  const steps = [
    {
      title: 'Property Details',
      content: (
        <Form layout="vertical" onFinish={onFinishPropertyDetails} initialValues={formData.propertyDetails}>
          <Form.Item name="propertyName" label="Property Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item
            name={['address', 'addressline']}
            label="Address"
            rules={[{ required: true, message: 'Please input your street!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name={['address', 'city']}
            label="City"
            rules={[{ required: true, message: 'Please input your city!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name={['address', 'postal']}
            label="Postal / Zip Code"
            rules={[{ required: true, message: 'Please input your postal or zip code!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name={['address', 'province']}
            label="Province / State"
            rules={[{ required: true, message: 'Please input your province or state!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name={['address', 'country']}
            label="Country"
            rules={[{ required: true, message: 'Please select your country!' }]}
          >
            <Select showSearch>
              <Select.Option value="USA">USA</Select.Option>
              <Select.Option value="Canada">Canada</Select.Option>
            </Select>
          </Form.Item>
          <Button type="primary" htmlType="submit">Next</Button>
        </Form>
      ),
    },
    {
      title: 'Units Info',
      content: (
        <Form layout="vertical" onFinish={onFinishUnitInfo}>
          <Form.Item name="numFloors" label="Number of Floors" rules={[{ required: true }]}>
            <InputNumber />
          </Form.Item>
          <Form.Item name="unitsPerFloor" label="Units Per Floor" rules={[{ required: true }]}>
            <InputNumber />
          </Form.Item>
          <Button type="primary" htmlType="submit">Next</Button>
        </Form>
      ),
    },
  ];

  return (
    <>
      <Header style={{ display: 'flex', alignItems: 'center', padding: '0 20px', background: '#f0f2f5', borderBottom: '1px solid #e8e8e8' }}>
        <img src="/assests/light_mode_velloa_logo.png" alt="Logo" style={{ maxWidth: '100%', maxHeight: '24px' }} />
        <Title level={4} style={{ margin: 0, flex: 1 }}>Velloa</Title>
        <Button type="primary" onClick={showModal} style={{ marginRight: 20 }}>Add Property</Button>
        <div style={{ marginLeft: 'auto', padding: '0 20px' }}>
          <Dropdown overlay={dropdownMenu} trigger={['click']}>
            <Avatar style={{ backgroundColor: '#1677FF' }} icon={<UserOutlined />} />
          </Dropdown>
        </div>
      </Header>
      <div className="site-card-wrapper">
        <Row gutter={20}>
          {properties.map((property) => (
            <Col key={property.id} span={6}>
              <Card
                hoverable
                onClick={() => handleCardClick(property)}
                cover={<img alt={property.propertyName} src={property.imageUrl || '/assests/defualtpropimage.jpg'} />}
              >
                <Card.Meta
                  title={<Title level={4} style={{ margin: 0 }}>{property.propertyName}</Title>}
                  description={`${property.numUnits} units`}
                />
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      <Modal title="Add Property" visible={isModalVisible} onCancel={handleCancel} footer={null} width="1200px">
        <Steps current={currentStep}>
          {steps.map((item) => (
            <Step key={item.title} title={item.title} />
          ))}
        </Steps>
        <div className="steps-content">{steps[currentStep]?.content}</div>
      </Modal>
    </>
  );
};

export default DashboardPage;