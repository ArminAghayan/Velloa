import React, { useState,useEffect } from 'react';
import { Button, Modal, Steps, Form, Input, Select, InputNumber, Space, message, Layout, Menu, Dropdown, Avatar, Typography,theme } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined, SettingOutlined, LogoutOutlined, UserOutlined, BlockOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { db, auth } from '../../firebase-config';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';

// Define the property details and unit info interfaces
interface PropertyDetails {
  propertyName: string;
  address: string;
  numUnits: number;
}

interface UnitInfo {
  unitType: string;
}

const { Header } = Layout;
const { Title } = Typography;
const { Step } = Steps;
const { Option } = Select;

const DashboardPage = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    propertyDetails: {},
    unitInfo: {}
  });

  const showModal = () => setIsModalVisible(true);
  const handleCancel = () => setIsModalVisible(false);
  const next = () => setCurrentStep(currentStep + 1);
  const prev = () => setCurrentStep(currentStep - 1);

  const [companyDocId, setCompanyDocId] = useState<string | null>(null);

  
  
  const onFinishPropertyDetails = (values: PropertyDetails) => {
    setFormData({ ...formData, propertyDetails: values });
    next(); // Move to the next step
  };







  const onFinishUnitInfo = async (values: UnitInfo) => {
    setFormData({ ...formData, unitInfo: values });
  
    // Check if the user is logged in
    if (!auth.currentUser) {
      message.error("You must be logged in to perform this action.");
      return;
    }
  
    // Check if a company is selected
if (!companyDocId) {
  message.error("You must select a company to perform this action.");
  return;
}

try {
  const propertyRef = collection(db, `companies/${companyDocId}/property`);
  await addDoc(propertyRef, {
    ...formData.propertyDetails, // Include previously collected property details
    ...values, // Include unit info from this step
  });
  message.success("Property added successfully!");
  handleCancel();
  setCurrentStep(0);
  setFormData({ propertyDetails: {}, unitInfo: {} });
} catch (error) {
  console.error("Error adding document: ", error);
  message.error("An error occurred while adding the property.");
}

  
}
  
  



  

  // Dropdown menu for user options
  const dropdownMenu = (
    <Menu>
      <Menu.Item icon={<SettingOutlined />}><Link to="/settings">Settings</Link></Menu.Item>
      <Menu.Item icon={<SettingOutlined />}><Link to="/companysettings">Company Settings</Link></Menu.Item>
      <Menu.Item icon={<BlockOutlined />}><Link to="/dashboard">Overview</Link></Menu.Item>
      <Menu.Item icon={<LogoutOutlined />}><Link to="/logout">Logout</Link></Menu.Item>
    </Menu>
  );


  const {
    token: { colorBgContainer },
  } = theme.useToken();

  

  const steps = [
    {
      title: 'Property Details',
      content: (
        <Form layout="vertical" onFinish={onFinishPropertyDetails} initialValues={formData.propertyDetails}>
          <Form.Item name="propertyName" label="Property Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="address" label="Address" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="numUnits" label="Number of Units" rules={[{ required: true }]}>
            <InputNumber min={1} />
          </Form.Item>
          <Button type="primary" htmlType="submit">Next</Button>
        </Form>
      ),
    },
    {
      title: 'Units Info',
      content: (
        <Form layout="vertical" onFinish={onFinishUnitInfo} initialValues={formData.unitInfo}>
          <Form.Item name="unitType" label="Unit Type" rules={[{ required: true }]}>
            <Select>
              <Option value="numbers">100s (e.g., 807, 808, 809)</Option>
              <Option value="letters">Letters (e.g., 1A, 2B, 3C)</Option>
            </Select>
          </Form.Item>
          <Space>
            <Button onClick={prev}>Back</Button>
            <Button type="primary" htmlType="submit">Submit</Button>
          </Space>
        </Form>
      ),
    }
  ];



  return (
    <>
      <Header style={{ display: 'flex', alignItems: 'center', padding: '0 20px', background: '#f0f2f5', borderBottom: '1px solid #e8e8e8' }}>
        <Title level={4} style={{ margin: 0, flex: 1 }}>Velloa Group</Title>
        <Button type="primary" onClick={showModal} style={{ marginRight: 20 }}>Add Property</Button>
        <div style={{ marginLeft: 'auto', padding: '0 20px' }}> {/* Apply padding to this wrapper div */}
                <Dropdown overlay={dropdownMenu} trigger={['click']}>
                  <Avatar style={{ backgroundColor: '#1677FF' }} icon={<UserOutlined />} />
                </Dropdown>
            </div>
      </Header>
      <Modal title="Add Property" visible={isModalVisible} onCancel={handleCancel} footer={null}>
        <Steps current={currentStep}>
          {steps.map((item) => (
            <Step key={item.title} title={item.title} />
          ))}
        </Steps>
        <div className="steps-content">{steps[currentStep].content}</div>
      </Modal>
    </>
  );
};

export default DashboardPage;
