import React, { useEffect, useState } from 'react';

import { Row, Col, Typography, Button, Input, Form, notification, Menu, Upload, Image,Table,Space } from 'antd';
import { 
  IconSettings, IconPhoto, IconBuildingBank, IconHome2, IconUserCircle, 
  IconPigMoney, IconFileDollar, IconFiles, IconMailbox, IconDeviceFloppy, 
  IconPencil, IconPlus, IconTrash, IconX, IconStarFilled
} from '@tabler/icons-react';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { useLocation } from 'react-router-dom';
import './propertyinfo_settings.css';

const { Text } = Typography;

interface PropertySettingsProps {
  showModal: (title: string, description: string, type?: string) => void;
  handleBannerUpload: (file: File) => Promise<boolean>;
  imageUrl: string;
  photos: string[];
  handleResize: () => void;
  handleDelete: () => void;
  handlePhotosUpload: (file: File) => Promise<boolean>;
  updatePropertyName: (newName: string) => void;
}

const PropertyInfoSettings: React.FC<PropertySettingsProps> = ({ 
  showModal, handleBannerUpload, imageUrl, photos, handleResize, handleDelete, handlePhotosUpload, updatePropertyName 
}) => {
  const [selectedMenu, setSelectedMenu] = useState('general');
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
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);


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
    if (selectedMenu === 'general') {
      fetchPropertyInfo();
    }
  }, [selectedMenu, property.key]);

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= 800) {
      setPropertyDescription(value);
      setCharacterCount(value.length);
      form.setFieldsValue({ propertyDescription: value });
    }
  };
  const handleImageSelection = (selectedRowKeys: React.Key[], selectedRows: any[]) => {
    setSelectedRowKeys(selectedRowKeys);
  };

  const handleDeleteImages = () => {
    // Implement delete functionality here
    console.log('Delete image:', selectedImage);
    setSelectedImage(null);
    setSelectedRowKeys([]);
  };

  const handleCancelSelection = () => {
    setSelectedImage(null);
    setSelectedRowKeys([]);
  };

  const handleMarkAsHeader = () => {
    // Implement mark as header functionality here
    console.log('Mark as header:', selectedImage);
    setSelectedImage(null);
    setSelectedRowKeys([]);
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

    updatePropertyName(propertyName);
  };

  const handleMenuClick = ({ key }: { key: string }) => {
    setSelectedMenu(key);
  };

  const renderContent = () => {
    switch (selectedMenu) {
      case 'general':
        return (
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
            <Button type="primary" onClick={handleSave}>Save</Button>
          </Form>
        );
        case 'photos':

      const columns = [
        {
          title: 'Name',
          dataIndex: 'name',
          key: 'name',
        },
        {
          title: 'Date',
          dataIndex: 'date',
          key: 'date',
        },
        {
          title: 'Preview',
          dataIndex: 'preview',
          key: 'preview',
          render: (text: string, record: any) => (
            <Image
              src={record.url}
              alt={record.name}
              width={50}
              height={50}
              style={{ objectFit: 'cover' }}
            />
          ),
        },
      ];

      const data = photos.map((photo, index) => ({
        key: index,
        name: `Photo ${index + 1}`,
        date: new Date().toLocaleDateString(), // Replace with actual upload date
        url: photo,
      }));

      const rowSelection = {
        selectedRowKeys,
        onChange: (rowSelection: React.Key[]) => {
          setSelectedRowKeys(rowSelection);
        },
      };

      return (
        <div className="photo-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2>Photos</h2>
          <Space>
            {selectedRowKeys.length > 0 && (
              <>
                <Button icon={<IconTrash size={16} />} onClick={handleDeleteImages}>Delete</Button>
                <Button icon={<IconX size={16} />} onClick={handleCancelSelection}>Cancel</Button>
                {selectedRowKeys.length === 1 && (
                  <Button icon={<IconStarFilled size={16} />} onClick={handleMarkAsHeader}>Mark as Header</Button>
                )}
              </>
            )}
            <Button type="primary" icon={<IconPlus size={16} />}>
              Add Photo
            </Button>
          </Space>
        </div>
        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={data}
        />
      </div>
    );
      case 'bank':
        return <Text>Bank Accounts content goes here.</Text>;
      case 'type':
        return <Text>Property Type content goes here.</Text>;
      case 'owners':
        return <Text>Owners content goes here.</Text>;
      case 'reserve':
        return <Text>Reserve Funds content goes here.</Text>;
      case 'lateFees':
        return <Text>Late Fees content goes here.</Text>;
      case 'portal':
        return <Text>Tenant Portal content goes here.</Text>;
      case 'notifications':
        return <Text>Rent & Payment Notifications content goes here.</Text>;
      case 'requests':
        return <Text>Tenant Requests content goes here.</Text>;
      case 'applications':
        return <Text>Rental Applications content goes here.</Text>;
      case 'paymentInstructions':
        return <Text>Payment Instructions content goes here.</Text>;
      case 'managementFees':
        return <Text>Management Fees content goes here.</Text>;
      case 'paymentAllocation':
        return <Text>Payment Allocation content goes here.</Text>;
      case 'customAllocations':
        return <Text>Custom Allocations content goes here.</Text>;
      default:
        return <Text>Select an item from the menu.</Text>;
    }
  };

  return (
    <Row className="settings-row">
      <Col span={6} className="sidebar-container">
      <Menu onClick={handleMenuClick} selectedKeys={[selectedMenu]} mode="vertical"  className="settings-menu"
      >
          <Menu.Item key="general" icon={<IconSettings size={20} />}>
            General Information
          </Menu.Item>
          <Menu.Item key="photos" icon={<IconPhoto size={20} />}>
            Photos
          </Menu.Item>
          <Menu.Item key="bank" icon={<IconBuildingBank size={20} />}>
            Bank Accounts
          </Menu.Item>
          <Menu.Item key="type" icon={<IconHome2 size={20} />}>
            Property Type
          </Menu.Item>
          <Menu.Item key="owners" icon={<IconUserCircle size={20} />}>
            Owners
          </Menu.Item>
          <Menu.Item key="reserve" icon={<IconPigMoney size={20} />}>
            Reserve Funds
          </Menu.Item>
          <Menu.Item key="lateFees" icon={<IconFileDollar size={20} />}>
            Late Fees
          </Menu.Item>
          <Menu.Item key="portal" icon={<IconFiles size={20} />}>
            Tenant Portal
          </Menu.Item>
          <Menu.Item key="notifications" icon={<IconMailbox size={20} />}>
            Rent & Payment Notifications
          </Menu.Item>
          <Menu.Item key="requests" icon={<IconPencil size={20} />}>
            Tenant Requests
          </Menu.Item>
          <Menu.Item key="applications" icon={<IconDeviceFloppy size={20} />}>
            Rental Applications
          </Menu.Item>
          <Menu.Item key="paymentInstructions" icon={<IconFiles size={20} />}>
            Payment Instructions
          </Menu.Item>
          <Menu.Item key="managementFees" icon={<IconFileDollar size={20} />}>
            Management Fees
          </Menu.Item>
          <Menu.Item key="paymentAllocation" icon={<IconFiles size={20} />}>
            Payment Allocation
          </Menu.Item>
          <Menu.Item key="customAllocations" icon={<IconPencil size={20} />}>
            Custom Allocations
          </Menu.Item>
        </Menu>
      </Col>
      <Col span={18}>
        <div className="content-container">
          {renderContent()}
        </div>
      </Col>
    </Row>
  );
};

export default PropertyInfoSettings;
