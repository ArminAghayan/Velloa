import React, { useState } from 'react';
import { UserOutlined, BankOutlined, UnorderedListOutlined, HomeOutlined } from '@ant-design/icons';
import { Card, Row, Col, Typography, Modal } from 'antd';
import { useNavigate } from 'react-router-dom';
import './MainSettings.css';
import RentalApplicationSettings from './settingsPages/PropertySettings/SettingsRentalApplication';
import NoteTagSettings from './settingsPages/Notetag/NoteTagSettings';
import FileTagSettings from './settingsPages/FileTag/FileTagSettings';
const { Title } = Typography;

interface MenuItemType {
  key: string;
  label: string;
  icon?: React.ReactNode;
  children?: SubMenuItemType[];
}

interface SubMenuItemType {
  key: string;
  label: string;
}

const items: MenuItemType[] = [
  {
    key: 'personal',
    label: 'Personal',
    icon: <UserOutlined />,
    children: [
      { key: 'personal-info', label: 'Personal Information' },
      { key: 'login-password', label: 'Login & Password' },
    ],
  },
  {
    key: 'company',
    label: 'Company',
    icon: <BankOutlined />,
    children: [
      { key: 'company-info', label: 'Company Info' },
      { key: 'region-currency', label: 'Region & Currency' },
      { key: 'default-account', label: 'Default Account' },
      { key: 'users', label: 'Users' },
      { key: 'user-roles', label: 'User Roles' },
      { key: 'subscription', label: 'Subscription' },
      { key: 'quickbooks', label: 'QuickBooks Sync' },
      { key: 'listings', label: 'Listings' },
      { key: 'send-payments', label: 'Send Payments' },
      { key: 'company-start-date', label: 'Company Start Date' },
    ],
  },
  {
    key: 'related-lists',
    label: 'Related Lists',
    icon: <UnorderedListOutlined />,
    children: [
      { key: 'portfolios', label: 'Portfolios' },
      { key: 'note-tags', label: 'Note Tags' },
      { key: 'file-tags', label: 'File Tags' },
      { key: 'vendor-classification', label: 'Vendor Classification' },
      { key: 'lead-sources', label: 'Lead Sources' },
    ],
  },
  {
    key: 'property-settings',
    label: 'Property Settings',
    icon: <HomeOutlined />,
    children: [
      { key: 'tenant-portal', label: 'Tenant Portal' },
      { key: 'owner-portal', label: 'Owner Portal' },
      { key: 'rent-payment-notifications', label: 'Rent & Payment Notifications' },
      { key: 'payment-instructions', label: 'Payment Instructions' },
      { key: 'tenant-requests', label: 'Tenant Requests' },
      { key: 'owner-requests', label: 'Owner Requests' },
      { key: 'late-fees', label: 'Late Fees' },
      { key: 'rental-application', label: 'Rental Application' },
      { key: 'management-fees', label: 'Management Fees' },
      { key: 'payment-allocation', label: 'Payment Allocation' },
    ],
  },
];

const MainSettings: React.FC = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<{title: string, content: React.ReactNode} | null>(null);

  const handleClick = (key: string) => {
    switch(key) {
      case 'rental-application':
        setModalContent({
          title: 'Rental Application',
          content: <RentalApplicationSettings />
        });
        setIsModalOpen(true);
        break;
      case 'note-tags':
        setModalContent({
          title: 'Note Tags',
          content: <NoteTagSettings />
        });
        setIsModalOpen(true);
        break;
      case 'file-tags':
        setModalContent({
          title: 'File Tags',
          content: <FileTagSettings />
        });
        setIsModalOpen(true);
        break;
      default:
        navigate(`/settings/${key}`);
    }
  };

  return (
    <div style={{ padding: '64px 36px' }}>
      <Title level={1}>Settings</Title>
      <Row gutter={[16, 16]}>
        {items.map((category) => (
          <React.Fragment key={category.key}>
            <Col span={24}>
              <Title level={3}>
                {category.icon} {category.label}
              </Title>
            </Col>
            {category.children?.map((item: SubMenuItemType) => (
              <Col xs={24} sm={12} md={8} lg={6} key={item.key}>
                <Card
                  hoverable
                  onClick={() => handleClick(item.key)}
                  style={{ 
                    height: '100%',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ 
                    fontSize: '16px',
                    textAlign: 'center',
                    padding: '12px 0'
                    
                  }}>
                    {item.label}
                  </div>
                </Card>
              </Col>
            ))}
          </React.Fragment>
        ))}
      </Row>
      
      <Modal
        title={modalContent?.title}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setModalContent(null);
        }}
        footer={null}
        width={1100}
        bodyStyle={{ padding: 0, minHeight: '500px' }}
        centered
        className='settings-modal'
      >
        {modalContent?.content}
      </Modal>
    </div>
  );
};

export default MainSettings;
