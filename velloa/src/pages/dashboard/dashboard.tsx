import React, { useState, useEffect } from 'react';
import { Button, Modal, Steps, Form, Input, InputNumber, message, Layout, Menu, Dropdown, Avatar, Typography, theme, Card, Col, Row, Select, Skeleton, Table } from 'antd';
import { SettingOutlined, LogoutOutlined, UserOutlined, BlockOutlined,DotChartOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { db, auth } from '../../firebase-config';
import { collection, addDoc, query, where, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
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
  const [formData, setFormData] = useState<{ propertyDetails: PropertyDetails; unitInfo: UnitInfo; unitData?: { key: number; unitNumber: number; floor: number; unitPrice: number; }[] }>({
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
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

const handleCardClick = (property: Property) => {
  navigate('/home', { state: { property, unitData: formData.unitData } });
};


  const generateUnitData = (numFloors: number, unitsPerFloor: number, offset: number = 0) => {
    const unitData = [];
    for (let floor = 1; floor <= numFloors; floor++) {
      for (let unit = 1; unit <= unitsPerFloor; unit++) {
        const unitNumber = ((floor + offset) * 100) + unit;
        unitData.push({
          key: unitNumber,
          unitNumber,
          floor: floor + offset,
          unitPrice: 0,
        });
      }
    }
    return unitData;
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

  const fetchProperties = async () => {
    setLoading(true);
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
    setLoading(false);
  };
  useEffect(() => {
    fetchProperties();
  }, [companyDocId]);


  const onFinishPropertyDetails = async (values: PropertyDetails) => {
    if (!auth.currentUser || !companyDocId) {
      message.error("You must be logged in and have a company selected to perform this action.");
      return;
    }
  
    setFormData({
      ...formData,
      propertyDetails: values,
    });
  
    next();
  };

  const onFinishUnitInfo = async (values: UnitInfo & { offset: number }) => {
    if (!auth.currentUser || !companyDocId) {
      message.error("You must be logged in and have a company selected to perform this action.");
      return;
    }
  
    const unitData = generateUnitData(values.numFloors, values.unitsPerFloor, values.offset);
    setFormData({
      ...formData,
      unitInfo: {
        numFloors: values.numFloors,
        unitsPerFloor: values.unitsPerFloor,
      },
      unitData,
    });
  
    next();
  };

  const handleUnitReview = async () => {
    if (!auth.currentUser || !companyDocId) {
      message.error("You must be logged in and have a company selected to perform this action.");
      return;
    }
  
    try {
      const propertyRef = collection(db, `companies/${companyDocId}/properties`);
      const docRef = await addDoc(propertyRef, {});
  
      const propertyInfoRef = doc(docRef, 'propertyinfo', 'details');
      await setDoc(propertyInfoRef, {
        ...formData.propertyDetails,
        propertyId: docRef.id,
      });
  
      const propertyUnitsRef = doc(docRef, 'propertyunits', 'details');
      await setDoc(propertyUnitsRef, {
        numFloors: formData.unitInfo.numFloors,
        unitsPerFloor: formData.unitInfo.unitsPerFloor,
        totalUnits: formData.unitInfo.numFloors * formData.unitInfo.unitsPerFloor,
      });
  
      const propertyUnitDataRef = doc(docRef, 'propertyunits', 'units');
      await setDoc(propertyUnitDataRef, {
        units: formData.unitData,
      });
  
      message.success("Property data saved successfully!");
      resetFormAndHideModal();
      fetchProperties(); // Refresh the property list
    } catch (error) {
      console.error("Error saving property data: ", error);
      message.error("An error occurred while saving the property data.");
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
        <Link to="/login">Logout</Link>
      </Menu.Item>
    </Menu>
  );

  const { token: { colorBgContainer } } = theme.useToken();
  const columns = [
    {
      title: 'Unit Number',
      dataIndex: 'unitNumber',
      key: 'unitNumber',
    },
    {
      title: 'Floor',
      dataIndex: 'floor',
      key: 'floor',
    },
    {
      title: 'Unit Price',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
    },
  ];






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
           <Select showSearch={false}>
              <Select.Option value="USA">USA</Select.Option>
              <Select.Option value="Canada">Canada</Select.Option>
          </Select> 
          </Form.Item>


          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button type="primary" htmlType="submit">Next</Button>
          </div>
        </Form>
      ),
    },
    {
      title: 'Units Info',
      content: (
        <Form layout="vertical" onFinish={onFinishUnitInfo} initialValues={formData.unitInfo}>
          <Form.Item name="numFloors" label="Number of Floors" rules={[{ required: true }]}>
            <InputNumber />
          </Form.Item>
          <Form.Item name="unitsPerFloor" label="Units Per Floor" rules={[{ required: true }]}>
            <InputNumber />
          </Form.Item>
          <Form.Item name="offset" label="Offset Floor (e.g. If your floor start at 400 use an offset of 3)" initialValue={0}>
            <InputNumber min={0} />
          </Form.Item>          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button onClick={prev}>Previous</Button>
            <Button type="primary" htmlType="submit">Next</Button>
          </div>
        </Form>
      ),
    },
    {
      title: 'Unit Review',
      content: (
        <div>
          <Table columns={columns} dataSource={formData.unitData} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
            <Button onClick={prev}>Previous</Button>
            <Button type="primary" onClick={handleUnitReview}>Submit</Button>
          </div>
        </div>
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
    {loading ? (
      Array(4)
        .fill(null)
        .map((_, index) => (
          <Col key={index} span={6}>
            <Card style={{ height: 300 }}>
              <Skeleton active>
                <Skeleton.Image style={{ height: 200, width: '100%' }} />
                <Skeleton.Button style={{ width: '100%', marginTop: 16 }} />
                <Skeleton.Input style={{ width: '100%', marginTop: 8 }} />
              </Skeleton>
            </Card>
          </Col>
        ))
    ) : properties.length === 0 ? (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px', width: '100%', margin: '30px' }}>
        <Card style={{ width: '300px', textAlign: 'center' }}>
          <Skeleton loading={true} active={false}>
            <Skeleton.Image style={{ height: 200, width: '100%' }} />
            <Skeleton.Button style={{ width: '100%', marginTop: 16 }} />
            <Skeleton.Input style={{ width: '100%', marginTop: 8 }} />
          </Skeleton>
          <Title level={4} style={{ marginTop: '16px', color:"#D8D8D8" }}>Add a new property</Title>
        </Card>
      </div>
    ) : (
      properties.map((property) => (
        <Col key={property.id} span={6}>
          <Card
            hoverable
            onClick={() => handleCardClick(property)}
            cover={<img alt={property.propertyName} src={property.imageUrl || '/assests/defualtpropimage.jpg'} style={{ height: 200 }} />}
          >
            <Card.Meta
              title={<Title level={4} style={{ margin: 0 }}>{property.propertyName}</Title>}
              description={`${property.numUnits} units`}
            />
          </Card>
        </Col>
      ))
    )}
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