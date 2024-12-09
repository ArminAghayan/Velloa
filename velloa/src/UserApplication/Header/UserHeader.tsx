import React, { useState } from 'react';
import { Layout, Menu, Button, Drawer } from 'antd';
import { MenuOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import './UserHeader.css';

const { Header: AntHeader } = Layout;

interface HeaderProps {
  companyId: string;
}

const Header: React.FC<HeaderProps> = ({ companyId }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuVisible, setMobileMenuVisible] = useState(false);

  const menuItems = [
    {
      key: `/company/${companyId}`,
      label: 'Home',
    },
    {
      key: `/company/${companyId}/listings`,
      label: 'Listings',
    },
    {
      key: `/company/${companyId}/about`,
      label: 'About',
    }
  ];

  const handleMenuClick = (key: string) => {
    navigate(key);
    setMobileMenuVisible(false);
  };

  return (
    <AntHeader className="user-header">
      <div className="header-content">
        <div className="left-section">
          <img 
            src="/assets/light_mode_velloa_logo.png" 
            alt="Velloa Logo" 
            onClick={() => navigate(`/company/${companyId}`)}
          />
          <div className="desktop-menu">
            <Menu
              mode="horizontal"
              items={menuItems}
              selectedKeys={[location.pathname]}
              onClick={({ key }) => handleMenuClick(key)}
              disabledOverflow={true}
            />
          </div>
        </div>

        <div className="right-section">
          <Button 
            type="primary" 
            className="tenant-portal-btn"
            onClick={() => navigate(`/company/${companyId}/rental-applications`)}
          >
            Tenant Portal
          </Button>
          <Button
            className="mobile-menu-button"
            icon={<MenuOutlined />}
            onClick={() => setMobileMenuVisible(true)}
          />
        </div>

        <Drawer
          title="Menu"
          placement="right"
          onClose={() => setMobileMenuVisible(false)}
          open={mobileMenuVisible}
          className="mobile-menu-drawer"
        >
          <Menu
            mode="vertical"
            items={menuItems}
            selectedKeys={[location.pathname]}
            onClick={({ key }) => handleMenuClick(key)}
          />
          <Button 
            type="primary" 
            block
            style={{ marginTop: '16px' }}
            onClick={() => {
              navigate(`/company/${companyId}/rental-applications`);
              setMobileMenuVisible(false);
            }}
          >
            Tenant Portal
          </Button>
        </Drawer>
      </div>
    </AntHeader>
  );
};

export default Header;