// PropertyInfoSettings.tsx

import React, { useEffect, useState } from 'react';
import { 
  Row, Col, Typography, Menu, notification
} from 'antd';
import { 
  IconSettings, IconPhoto, IconBuildingBank, IconHome2, IconUserCircle, 
  IconPigMoney, IconFileDollar, IconFiles, IconMailbox, IconDeviceFloppy, 
  IconPencil, IconPlus, IconTrash, IconX, IconStarFilled
} from '@tabler/icons-react';
import { useLocation } from 'react-router-dom';
import './propertyinfo_settings.css';
import PropertyTypeSelection from './propertySettingstabs/PropertyTypeSelection';
import PhotosComponent from './propertySettingstabs/PropertyPhotosComponent';
import GeneralInfoForm from './propertySettingstabs/PropertyGeneralInfoForm'; // Import the new component
import LateFees from './propertySettingstabs/propertyLateFees';
const { Text } = Typography;

interface PropertySettingsProps {
  updatePropertyName: (newName: string) => void;
}

const PropertyInfoSettings: React.FC<PropertySettingsProps> = ({ updatePropertyName }) => {
  const [selectedMenu, setSelectedMenu] = useState('general');
  const location = useLocation();
  const { property } = location.state as { property: { key: string } };

  const handleMenuClick = ({ key }: { key: string }) => {
    setSelectedMenu(key);
  };

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
        return <PhotosComponent propertyKey={property.key} />;
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
        return <Text>Select an item from the menu.</Text>;
    }
  };

  return (
    <Row className="settings-row">
      <Col span={6} className="sidebar-container">
        <Menu 
          onClick={handleMenuClick} 
          selectedKeys={[selectedMenu]} 
          mode="vertical" 
          className="settings-menu"
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
