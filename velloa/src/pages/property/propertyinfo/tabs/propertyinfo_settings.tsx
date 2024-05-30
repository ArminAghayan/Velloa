import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Typography, Button, Modal, Input, Form, Divider, notification } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { 
  IconSettings, IconPhoto, IconBuildingBank, IconHome2, IconUserCircle, 
  IconPigMoney, IconFileDollar, IconFiles, IconMailbox, IconDeviceFloppy, 
  IconPencil 
} from '@tabler/icons-react';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { useLocation } from 'react-router-dom';
import './propertyinfo_settings.css';

const { Title, Text } = Typography;

interface PropertySettingsProps {
  showModal: (title: string, description: string, type?: string) => void;
  handleBannerUpload: (file: File) => Promise<boolean>;
  imageUrl: string;
  photos: string[];
  handleResize: () => void;
  handleDelete: () => void;
  handlePhotosUpload: (file: File) => Promise<boolean>;
  updatePropertyName: (newName: string) => void;  // Add the new prop for updating the name
}

const PropertyInfoSettings: React.FC<PropertySettingsProps> = ({ 
  showModal, handleBannerUpload, imageUrl, photos, handleResize, handleDelete, handlePhotosUpload, updatePropertyName 
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [propertyName, setPropertyName] = useState('');
  const [street1, setStreet1] = useState('');
  const [street2, setStreet2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [country, setCountry] = useState('');
  const [propertyDescription, setPropertyDescription] = useState('');
  const [characterCount, setCharacterCount] = useState(0);
  const [form] = Form.useForm();
  const location = useLocation();
  const { property } = location.state as { property: { key: string } };

  const fetchPropertyInfo = async () => {
    const db = getFirestore();
    const docRef = doc(db, 'properties', property.key);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      setPropertyName(data.propertyName || '');
      setStreet1(data.address?.street1 || '');
      setStreet2(data.address?.street2 || '');
      setCity(data.address?.city || '');
      setState(data.address?.state || '');
      setZip(data.address?.zip || '');
      setCountry(data.address?.country || '');
      setPropertyDescription(data.description || '');
      setCharacterCount((data.description || '').length);
      form.setFieldsValue({
        propertyName: data.propertyName || '',
        street1: data.address?.street1 || '',
        street2: data.address?.street2 || '',
        city: data.address?.city || '',
        state: data.address?.state || '',
        zip: data.address?.zip || '',
        country: data.address?.country || '',
        propertyDescription: data.description || '',
      });
    } else {
      console.log('No such document!');
    }
  };

  useEffect(() => {
    if (isModalVisible) {
      fetchPropertyInfo();
    }
  }, [isModalVisible, property.key]);

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= 800) {
      setPropertyDescription(value);
      setCharacterCount(value.length);
      form.setFieldsValue({ propertyDescription: value });
    }
  };

  const handleSave = async () => {
    const db = getFirestore();
    const docRef = doc(db, 'properties', property.key);

    await updateDoc(docRef, {
      propertyName,
      description: propertyDescription,
      address: {
        street1,
        street2,
        city,
        state,
        zip,
        country,
      }
    });

    notification.success({
      message: 'Property Information Updated',
      description: 'The property information has been successfully updated.',
      placement: 'top',
    });

    updatePropertyName(propertyName);  // Call the callback to update the name in PropertyInfo
    setIsModalVisible(false);
  };

  const showGeneralInfoModal = () => {
    setModalTitle("General Information");
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };
  return (
    <>
      <Row gutter={16} className="settings-row">
        <Col span={6} className="property-col">
          <button className="settings-card-button" onClick={showGeneralInfoModal}>
            <Card className="settings-card">
              <div className="settings-card-content">
                <IconSettings className="settings-card-icon" size={48} />
                <div className="settings-card-details">
                  <Title level={5} className="settings-card-title">General Information</Title>
                  <Text className="settings-card-description">Update your property address, name and description.</Text>
                </div>
              </div>
            </Card>
          </button>
        </Col>
        <Col span={6} className="property-col">
          <button className="settings-card-button" onClick={() => showModal("Photos", "Upload photos for this property", "photos")}>
            <Card className="settings-card">
              <div className="settings-card-content">
                <IconPhoto className="settings-card-icon" size={48} />
                <div className="settings-card-details">
                  <Title level={5} className="settings-card-title">Photos</Title>
                  <Text className="settings-card-description">Upload photos for this property</Text>
                </div>
              </div>
            </Card>
          </button>
        </Col>
        <Col span={6} className="property-col">
          <button className="settings-card-button" onClick={() => showModal("Bank Accounts", "Select the property bank accounts.")}>
            <Card className="settings-card">
              <div className="settings-card-content">
                <IconBuildingBank className="settings-card-icon" size={48} />
                <div className="settings-card-details">
                  <Title level={5} className="settings-card-title">Bank Accounts</Title>
                  <Text className="settings-card-description">Select the property bank accounts.</Text>
                </div>
              </div>
            </Card>
          </button>
        </Col>
        <Col span={6} className="property-col">
          <button className="settings-card-button" onClick={() => showModal("Property Type", "Let us know which property")}>
            <Card className="settings-card">
              <div className="settings-card-content">
                <IconHome2 className="settings-card-icon" size={48} />
                <div className="settings-card-details">
                  <Title level={5} className="settings-card-title">Property Type</Title>
                  <Text className="settings-card-description">Let us know which property</Text>
                </div>
              </div>
            </Card>
          </button>
        </Col>
        <Col span={6} className="property-col">
          <button className="settings-card-button" onClick={() => showModal("Owners", "Update the owners for this property.")}>
            <Card className="settings-card">
              <div className="settings-card-content">
                <IconUserCircle className="settings-card-icon" size={48} />
                <div className="settings-card-details">
                  <Title level={5} className="settings-card-title">Owners</Title>
                  <Text className="settings-card-description">Update the owners for this property.</Text>
                </div>
              </div>
            </Card>
          </button>
        </Col>
        <Col span={6} className="property-col">
          <button className="settings-card-button" onClick={() => showModal("Reserve Funds", "Edit the amount of reserve funds.")}>
            <Card className="settings-card">
              <div className="settings-card-content">
                <IconPigMoney className="settings-card-icon" size={48} />
                <div className="settings-card-details">
                  <Title level={5} className="settings-card-title">Reserve Funds</Title>
                  <Text className="settings-card-description">Edit the amount of reserve funds.</Text>
                </div>
              </div>
            </Card>
          </button>
        </Col>
        <Col span={6} className="property-col">
          <button className="settings-card-button" onClick={() => showModal("Late Fees", "Set the late fees for these leases.")}>
            <Card className="settings-card">
              <div className="settings-card-content">
                <IconFileDollar className="settings-card-icon" size={48} />
                <div className="settings-card-details">
                  <Title level={5} className="settings-card-title">Late Fees</Title>
                  <Text className="settings-card-description">Set the late fees for these leases.</Text>
                </div>
              </div>
            </Card>
          </button>
        </Col>
        <Col span={6} className="property-col">
          <button className="settings-card-button" onClick={() => showModal("Tenant Portal", "Resident portal access settings Edit the tenant portal settings.")}>
            <Card className="settings-card">
              <div className="settings-card-content">
                <IconFiles className="settings-card-icon" size={48} />
                <div className="settings-card-details">
                  <Title level={5} className="settings-card-title">Tenant Portal</Title>
                  <Text className="settings-card-description">Resident portal access settings Edit the tenant portal settings.</Text>
                </div>
              </div>
            </Card>
          </button>
        </Col>
        <Col span={6} className="property-col">
          <button className="settings-card-button" onClick={() => showModal("Rent & Payment Notifications", "Send email and text notifications to your tenants.")}>
            <Card className="settings-card">
              <div className="settings-card-content">
                <IconMailbox className="settings-card-icon" size={48} />
                <div className="settings-card-details">
                  <Title level={5} className="settings-card-title">Rent & Payment Notifications</Title>
                  <Text className="settings-card-description">Send email and text notifications to your tenants.</Text>
                </div>
              </div>
            </Card>
          </button>
        </Col>
        <Col span={6} className="property-col">
          <button className="settings-card-button" onClick={() => showModal("Tenant Requests", "Get notified and automatically assign new tenant requests.")}>
            <Card className="settings-card">
              <div className="settings-card-content">
                <IconPencil className="settings-card-icon" size={48} />
                <div className="settings-card-details">
                  <Title level={5} className="settings-card-title">Tenant Requests</Title>
                  <Text className="settings-card-description">Get notified and automatically assign new tenant requests.</Text>
                </div>
              </div>
            </Card>
          </button>
        </Col>
        <Col span={6} className="property-col">
          <button className="settings-card-button" onClick={() => showModal("Rental Applications", "Edit the property rental applications")}>
            <Card className="settings-card">
              <div className="settings-card-content">
                <IconDeviceFloppy className="settings-card-icon" size={48} />
                <div className="settings-card-details">
                  <Title level={5} className="settings-card-title">Rental Applications</Title>
                  <Text className="settings-card-description">Edit the property rental applications</Text>
                </div>
              </div>
            </Card>
          </button>
        </Col>
        <Col span={6} className="property-col">
          <button className="settings-card-button" onClick={() => showModal("Payment Instructions", "Specify instructions for tenants on how they should pay their rent.")}>
            <Card className="settings-card">
              <div className="settings-card-content">
                <IconFiles className="settings-card-icon" size={48} />
                <div className="settings-card-details">
                  <Title level={5} className="settings-card-title">Payment Instructions</Title>
                  <Text className="settings-card-description">Specify instructions for tenants on how they should pay their rent.</Text>
                </div>
              </div>
            </Card>
          </button>
        </Col>
        <Col span={6} className="property-col">
          <button className="settings-card-button" onClick={() => showModal("Management Fees", "Calculate and generate bills automatically for your properties")}>
            <Card className="settings-card">
              <div className="settings-card-content">
                <IconFileDollar className="settings-card-icon" size={48} />
                <div className="settings-card-details">
                  <Title level={5} className="settings-card-title">Management Fees</Title>
                  <Text className="settings-card-description">Calculate and generate bills automatically for your properties</Text>
                </div>
              </div>
            </Card>
          </button>
        </Col>
        <Col span={6} className="property-col">
          <button className="settings-card-button" onClick={() => showModal("Payment Allocation", "Edit how payments are automatically received, either by custom priority or date.")}>
            <Card className="settings-card">
              <div className="settings-card-content">
                <IconFiles className="settings-card-icon" size={48} />
                <div className="settings-card-details">
                  <Title level={5} className="settings-card-title">Payment Allocation</Title>
                  <Text className="settings-card-description">Edit how payments are automatically received, either by custom priority or date.</Text>
                </div>
              </div>
            </Card>
          </button>
        </Col>
        <Col span={6} className="property-col">
          <button className="settings-card-button" onClick={() => showModal("Custom Allocations", "Add custom allocation priorities to your lease charges and credits.")}>
            <Card className="settings-card">
              <div className="settings-card-content">
                <IconPencil className="settings-card-icon" size={48} />
                <div className="settings-card-details">
                  <Title level={5} className="settings-card-title">Custom Allocations</Title>
                  <Text className="settings-card-description">Add custom allocation priorities to your lease charges and credits.</Text>
                </div>
              </div>
            </Card>
          </button>
        </Col>
      </Row>

      <Modal 
        title={<div className="custom-modal-header"><Title level={4}>{modalTitle}</Title></div>}
        visible={isModalVisible}
        footer={[
          <Button key="save" type="primary" onClick={handleSave}>Save</Button>,
        ]}
        className="custom-glass-modal"
        width={800}  // Set the width of the modal
        maskClosable={true}  // Allow closing when clicking outside
        closable={true}      // Allow closing with the close button (X)
        onCancel={handleCancel} // Handle the cancel button
      >
        <Text>This information will be used in your online listings.</Text>
        <Divider />  
        <Form form={form} layout="vertical">
          <Form.Item 
            label={<span className="generalinfo_label">Property Name</span>} 
            name="propertyName"
            rules={[{ required: true, message: 'Please enter the property name' }]}
          >
            <Input value={propertyName} onChange={(e) => setPropertyName(e.target.value)} />
          </Form.Item>
          <Form.Item 
            label={<span className="generalinfo_label">Street 1</span>} 
            name="street1"
            rules={[{ required: true, message: 'Please enter the street address' }]}
          >
            <Input value={street1} onChange={(e) => setStreet1(e.target.value)} />
          </Form.Item>
          <Form.Item label={<span className="generalinfo_label">Street 2</span>} name="street2">
            <Input value={street2} onChange={(e) => setStreet2(e.target.value)} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item 
                label={<span className="generalinfo_label">City</span>} 
                name="city"
                rules={[{ required: true, message: 'Please enter the city' }]}
              >
                <Input value={city} onChange={(e) => setCity(e.target.value)} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item 
                label={<span className="generalinfo_label">State</span>} 
                name="state"
                rules={[{ required: true, message: 'Please enter the state' }]}
              >
                <Input value={state} onChange={(e) => setState(e.target.value)} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item 
                label={<span className="generalinfo_label">Zip code</span>} 
                name="zip"
                rules={[{ required: true, message: 'Please enter the zip code' }]}
              >
                <Input value={zip} onChange={(e) => setZip(e.target.value)} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item 
                label={<span className="generalinfo_label">Country</span>} 
                name="country"
                rules={[{ required: true, message: 'Please enter the country' }]}
              >
                <Input value={country} onChange={(e) => setCountry(e.target.value)} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label={<span className="generalinfo_label">Detailed description of this property</span>} name="propertyDescription">
            <Input.TextArea value={propertyDescription} onChange={handleDescriptionChange} />
          </Form.Item>
          <div className="character-count">{characterCount}/800 characters</div>  
        </Form>
      </Modal>
    </>
  );
};

export default PropertyInfoSettings;



