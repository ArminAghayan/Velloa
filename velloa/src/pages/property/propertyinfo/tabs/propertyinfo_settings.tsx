// PropertyInfoSettings.tsx

import React, { useEffect, useState } from 'react';
import { 
  Row, Col, Typography, Card, Modal, Button,
  Divider,
} from 'antd';
import { 
  IconSettings, IconPhoto, IconBuildingBank, IconHome2, IconUserCircle, 
  IconPigMoney, IconFileDollar, IconFiles, IconMailbox, IconDeviceFloppy, 
  IconPencil
} from '@tabler/icons-react';
import './propertyinfo_settings.css';
import PropertyTypeSelection from './propertySettingstabs/PropertyTypeSelection';
import PhotosComponent from './propertySettingstabs/PropertyPhotosComponent';
import GeneralInfoForm from './propertySettingstabs/PropertyGeneralInfoForm';
import LateFees from './propertySettingstabs/propertyLateFees';

const { Text } = Typography;

interface Property {
  key: string;
  propertyName: string;
  propertyType: string;
  numberOfUnits: number;
  status: string;
  photos?: string[];
}

interface PropertySettingsProps {
  property: Property;
  updatePropertyName: (newName: string) => void;
}

const PropertyInfoSettings: React.FC<PropertySettingsProps> = ({ property, updatePropertyName }) => {
  const [selectedMenu, setSelectedMenu] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const handleShowPhotos = () => {
      setSelectedMenu('photos');
      setIsModalOpen(true);
    };

    window.addEventListener('showPhotosSection', handleShowPhotos);
    return () => window.removeEventListener('showPhotosSection', handleShowPhotos);
  }, []);

  const handleCardClick = (key: string) => {
    setSelectedMenu(key);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedMenu('');
  };

  const menuItems = [
    { key: 'general', icon: <IconSettings size={20} />, title: 'General Information' },
    { key: 'photos', icon: <IconPhoto size={20} />, title: 'Photos' },
    { key: 'type', icon: <IconHome2 size={20} />, title: 'Property Type' },
    { key: 'bank', icon: <IconBuildingBank size={20} />, title: 'Bank Accounts' },
    { key: 'owners', icon: <IconUserCircle size={20} />, title: 'Owners' },
    { key: 'reserve', icon: <IconPigMoney size={20} />, title: 'Reserve Funds' },
    { key: 'lateFees', icon: <IconFileDollar size={20} />, title: 'Late Fees' },
    { key: 'portal', icon: <IconFiles size={20} />, title: 'Tenant Portal' },
    { key: 'notifications', icon: <IconMailbox size={20} />, title: 'Rent & Payment Notifications' },
    { key: 'requests', icon: <IconPencil size={20} />, title: 'Tenant Requests' },
    { key: 'applications', icon: <IconDeviceFloppy size={20} />, title: 'Rental Applications' },
    { key: 'paymentInstructions', icon: <IconFiles size={20} />, title: 'Payment Instructions' },
    { key: 'managementFees', icon: <IconFileDollar size={20} />, title: 'Management Fees' },
    { key: 'paymentAllocation', icon: <IconFiles size={20} />, title: 'Payment Allocation' },
    { key: 'customAllocations', icon: <IconPencil size={20} />, title: 'Custom Allocations' }
  ];

  const renderContent = () => {
    switch (selectedMenu) {
      case 'general':
        return (
          <GeneralInfoForm 
            propertyKey={property.key} 
            updatePropertyName={updatePropertyName} 
          />
        );
      case 'photos':
        return <PhotosComponent propertyId={property.key} />;
      case 'type':
        return <PropertyTypeSelection propertyId={property.key} />;
      case 'bank':
        return <Text>Bank Accounts content goes here.</Text>;
      case 'owners':
        return <Text>Owners content goes here.</Text>;
      case 'reserve':
        return <Text>Reserve Funds content goes here.</Text>;
      case 'lateFees':
        return <LateFees />;
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
        return null;
    }
  };

  return (
    <div className="settings-container">
      <Row gutter={[24, 24]} className="settings-row">
        {menuItems.map((item) => (
          <Col xs={24} sm={12} md={8} lg={6} key={item.key}>
            <Card
              hoverable
              className="settings-card"
              onClick={() => handleCardClick(item.key)}
            >
              <div className="settings-card-content">
                <div className="settings-card-icon">
                  {React.cloneElement(item.icon, { 
                    size: 24,
                    stroke: 1.5,
                    className: 'settings-icon'
                  })}
                </div>
                <Text className="settings-card-title">{item.title}</Text>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Modal
       title={
        <>
          <Typography.Title level={4} style={{ color: '#28A745', margin: 0 }}>
            {menuItems.find(item => item.key === selectedMenu)?.title}
          </Typography.Title>
          <Divider style={{ margin: '16px 0 8px 0' }} />
        </>
      }
        open={isModalOpen}
        onCancel={handleModalClose}
        width={1200}
        footer={selectedMenu === 'general' ? (
          <Button type="primary" style={{ width: '150px', height: '40px' }}>
            Save Changes
          </Button>
        ) : null}
      >
        {renderContent()}
      </Modal>
    </div>
  );
};

export default PropertyInfoSettings;
