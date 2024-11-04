import React from 'react';
import { Layout, Menu, Button } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import './UserHeader.css';

const { Header: AntHeader } = Layout;

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      key: '/tenant-portal',
      label: 'Home',
    },
    {
      key: '/tenant-portal/listings',
      label: 'Listings',
    },
    {
      key: '/tenant-portal/about',
      label: 'About',
    },
    {
      key: '/tenant-portal/rental-applications',
      label: 'Tenant Portal',
      className: 'header-nav-item'
    }
  ];

  return (
    <AntHeader style={{ 
      backgroundColor: 'white', 
      borderBottom: '1px solid #f0f0f0',
      padding: '0 50px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <img 
          src="/assets/light_mode_velloa_logo.png" 
          alt="Velloa Logo" 
          style={{ height: '32px', cursor: 'pointer' }}
          onClick={() => navigate('/')}
        />
        <Menu
          mode="horizontal"
          items={menuItems}
          style={{ 
            border: 'none',
            minWidth: '400px'
          }}
          selectedKeys={[location.pathname]}
          onClick={({ key }) => navigate(key)}
          disabledOverflow={true}
        />
      </div>
      
      <Button type="primary" onClick={() => navigate('/tenant-portal/rental-applications')}>
        Tenant Portal
      </Button>
    </AntHeader>
  );
};

export default Header;