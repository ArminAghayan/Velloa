// PropertyInfoSettings.tsx

import React, { useEffect, useState, useRef } from 'react';
import { 
  Row, Col, Typography, Card, Modal, Button,
  Divider,
  Flex,
} from 'antd';
import { 
  IconSettings, IconPhoto, IconBuildingEstate, IconListDetails, IconPaw,
  IconBuildingBank, IconUsers, IconPigMoney, IconReceipt2, IconApps,
  IconBellRinging, IconTicket, IconClipboardText, IconReportMoney,
  IconPercentage, IconArrowsShuffle, IconAdjustments
} from '@tabler/icons-react';
import './propertyinfo_settings.css';
import PropertyTypeSelection from './propertySettingstabs/PropertyTypeSelection';
import PhotosComponent from './propertySettingstabs/PropertyPhotosComponent';
import GeneralInfoForm from './propertySettingstabs/PropertyGeneralInfoForm';
import LateFees, { LateFeesRef } from './propertySettingstabs/propertyLateFees';
import PropertyOwners from './propertySettingstabs/PropertyOwners';
import PropertyAmenities from './propertySettingstabs/PropertyAmenities';
import PropertyPetPolicy, { PropertyPetPolicyRef } from './propertySettingstabs/PropertyPetPolicy';
import SettingsRentalApplication, { RentalApplicationRef } from './propertySettingstabs/PropertyApplications/MainRentelApplicationPage';
import RentPaymentNotifications, { RentPaymentNotificationsRef } from './propertySettingstabs/RentPaymentNotifications';
import TenantRequestSettings, { TenantRequestSettingsRef } from './propertySettingstabs/TenantRequestSettings';
import ManagementFees, { ManagementFeesRef } from './propertySettingstabs/propertyManagementFees';
import PaymentAllocation, { PaymentAllocationRef } from './propertySettingstabs/propertyPaymentAllocation';
import PropertyBankAccounts, { BankAccountsRef } from './propertySettingstabs/PropertyBankAccounts';

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
  const generalFormRef = useRef<{ handleSave: () => Promise<void> }>(null);
  const propertyTypeRef = useRef<{ handleSave: () => Promise<boolean> }>(null);
  const ownersRef = useRef<{ handleSave: () => Promise<boolean> }>(null);
  const amenitiesRef = useRef<{ handleSave: () => Promise<boolean> }>(null);
  const petPolicyRef = useRef<PropertyPetPolicyRef>(null);
  const rentalApplicationRef = useRef<RentalApplicationRef>(null);
  const lateFeesRef = useRef<LateFeesRef>(null);
  const notificationsRef = useRef<RentPaymentNotificationsRef>(null);
  const tenantRequestsRef = useRef<TenantRequestSettingsRef>(null);
  const managementFeesRef = useRef<ManagementFeesRef>(null);
  const paymentAllocationRef = useRef<PaymentAllocationRef>(null);
  const bankAccountsRef = useRef<BankAccountsRef>(null);

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

  const handleModalClose = async () => {
    if (selectedMenu === 'managementFees' && managementFeesRef.current) {
      await managementFeesRef.current.resetState();
    }
    setIsModalOpen(false);
    setSelectedMenu('');
  };

  const handleSaveClick = async () => {
    if (selectedMenu === 'general' && generalFormRef.current) {
      await generalFormRef.current.handleSave();
    } else if (selectedMenu === 'type' && propertyTypeRef.current) {
    } else if (selectedMenu === 'owners' && ownersRef.current) {
      await ownersRef.current.handleSave();
    } else if (selectedMenu === 'amenities' && amenitiesRef.current) {
    } else if (selectedMenu === 'petPolicy' && petPolicyRef.current) {
      await petPolicyRef.current.handleSave();
    } else if (selectedMenu === 'applications' && rentalApplicationRef.current) {
      await rentalApplicationRef.current.handleSave();
    } else if (selectedMenu === 'lateFees' && lateFeesRef.current) {
      await lateFeesRef.current.handleSave();
    } else if (selectedMenu === 'notifications' && notificationsRef.current) {
      await notificationsRef.current.handleSave();
    } else if (selectedMenu === 'requests' && tenantRequestsRef.current) {
      await tenantRequestsRef.current.handleSave();
    } else if (selectedMenu === 'managementFees' && managementFeesRef.current) {
      await managementFeesRef.current.handleSave();
    } else if (selectedMenu === 'paymentAllocation' && paymentAllocationRef.current) {
      await paymentAllocationRef.current.handleSave();
    } else if (selectedMenu === 'bank' && bankAccountsRef.current) {
      await bankAccountsRef.current.handleSave();
    }
  };

  const menuItems = [
    { key: 'general', icon: <IconSettings size={20} />, title: 'General Information' },
    { key: 'photos', icon: <IconPhoto size={20} />, title: 'Photos' },
    { key: 'type', icon: <IconBuildingEstate size={20} />, title: 'Property Type' },
    { key: 'amenities', icon: <IconListDetails size={20} />, title: 'Amenities' },
    { key: 'petPolicy', icon: <IconPaw size={20} />, title: 'Pet Policy' },
    { key: 'owners', icon: <IconUsers size={20} />, title: 'Owners' },
    { key: 'bank', icon: <IconBuildingBank size={20} />, title: 'Bank Accounts' },
    { key: 'reserve', icon: <IconPigMoney size={20} />, title: 'Reserve Funds' },
    { key: 'lateFees', icon: <IconReceipt2 size={20} />, title: 'Late Fees' },
    { key: 'portal', icon: <IconApps size={20} />, title: 'Tenant Portal' },
    { key: 'notifications', icon: <IconBellRinging size={20} />, title: 'Rent & Payment Notifications' },
    { key: 'requests', icon: <IconTicket size={20} />, title: 'Tenant Requests' },
    { key: 'applications', icon: <IconClipboardText size={20} />, title: 'Rental Applications' },
    { key: 'paymentInstructions', icon: <IconReportMoney size={20} />, title: 'Payment Instructions' },
    { key: 'managementFees', icon: <IconPercentage size={20} />, title: 'Management Fees' },
    { key: 'paymentAllocation', icon: <IconArrowsShuffle size={20} />, title: 'Payment Allocation' },
    { key: 'customAllocations', icon: <IconAdjustments size={20} />, title: 'Custom Allocations' }
  ];

  const renderContent = () => {
    switch (selectedMenu) {
      case 'general':
        return (
          <GeneralInfoForm 
            ref={generalFormRef}
            propertyKey={property.key} 
            updatePropertyName={updatePropertyName} 
          />
        );
      case 'photos':
        return <PhotosComponent propertyId={property.key} />;
      case 'type':
        return <PropertyTypeSelection ref={propertyTypeRef} propertyId={property.key} />;
      case 'bank':
        return <PropertyBankAccounts ref={bankAccountsRef} propertyId={property.key} />;
      case 'owners':
        return <PropertyOwners ref={ownersRef} propertyId={property.key} />;
      case 'reserve':
        return <Text>Reserve Funds content goes here.</Text>;
      case 'lateFees':
        return <LateFees ref={lateFeesRef} propertyId={property.key} />;
      case 'portal':
        return <Text>Tenant Portal content goes here.</Text>;
      case 'petPolicy':
        return <PropertyPetPolicy ref={petPolicyRef} propertyId={property.key} />;
      case 'amenities':
        return <PropertyAmenities ref={amenitiesRef} propertyId={property.key} />;
      case 'notifications':
        return <RentPaymentNotifications ref={notificationsRef} propertyId={property.key} />;
      case 'requests':
        return <TenantRequestSettings ref={tenantRequestsRef} propertyId={property.key} />;
      case 'applications':
        return <SettingsRentalApplication ref={rentalApplicationRef} propertyId={property.key} />;
      case 'paymentInstructions':
        return <Text>Payment Instructions content goes here.</Text>;
      case 'managementFees':
        return <ManagementFees ref={managementFeesRef} propertyId={property.key} />;
      case 'paymentAllocation':
        return <PaymentAllocation ref={paymentAllocationRef} propertyId={property.key} />;
      case 'customAllocations':
        return <Text>Custom Allocations content goes here.</Text>;
      default:
        return null;
    }
  };

  useEffect(() => {
    if (isModalOpen && selectedMenu === 'managementFees' && managementFeesRef.current) {
      managementFeesRef.current.loadSettings();
    }
  }, [isModalOpen, selectedMenu]);

  return (
    <div className="settings-container">
      <Row gutter={[24, 0]} className="settings-row">
        {menuItems.map((item) => (
          <Col 
            xs={24}    /* 1 card per row on mobile */
            sm={12}    /* 2 cards per row on small screens */
            md={8}     /* 3 cards per row on medium screens */
            lg={6}     /* 4 cards per row on large screens */
            xl={6}     /* 4 cards per row on extra large screens */
            key={item.key}
          >
            <Card
              hoverable
              className="settings-card"
              data-key={item.key}
              onClick={() => handleCardClick(item.key)}
              bodyStyle={{ padding: '24px' }}
            >
              <Flex className="settings-card-content">
                <div className="settings-card-left">
                  <div className="settings-card-icon">
                    {React.cloneElement(item.icon, { 
                      size: 24,
                      stroke: 1.5,
                      className: 'settings-icon'
                    })}
                  </div>
                </div>
                <Flex vertical gap={8} className="settings-card-right">
                  <Text strong className="settings-card-title">{item.title}</Text>
                  <Text type="secondary" className="settings-card-description">
                    Update the {item.title.toLowerCase()} for this property.
                  </Text>
                </Flex>
              </Flex>
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
        footer={['general', 'type', 'owners', 'amenities', 'petPolicy', 'applications', 'lateFees', 'notifications', 'requests', 'managementFees', 'paymentAllocation', 'bank'].includes(selectedMenu) ? (
          <Button 
            type="primary" 
            style={{ width: '150px', height: '40px' }}
            onClick={handleSaveClick}
          >
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
