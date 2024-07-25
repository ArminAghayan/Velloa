import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Layout, Menu, Dropdown, Avatar } from 'antd';
import {
  HomeIcon,
  BuildingOffice2Icon,
  DocumentTextIcon,
  UsersIcon,
  WrenchScrewdriverIcon,
  CheckCircleIcon,
  BanknotesIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ArrowLeftOnRectangleIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../components/redux/authSlice';
import { AppDispatch, RootState } from '../components/redux/store';
import 'antd/dist/reset.css';

import './Sidebar.css'; // Import your CSS file

const { Content, Sider } = Layout;

const Sidebar: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation();
  const selectedProperty = useSelector((state: RootState) => state.property.property);
  const userData = useSelector((state: RootState) => state.auth.userData);

  const handleLogout = () => {
    dispatch(logout());
  };

  const dropdownMenu = (
    <Menu>
      <Menu.Item icon={<Cog6ToothIcon className="dropdownsideIcon" />}>
        <Link to="/settings">Settings</Link>
      </Menu.Item>
      <Menu.Item icon={<ArrowLeftOnRectangleIcon className="dropdownsideIcon" />} onClick={handleLogout}>
        Logout
      </Menu.Item>
    </Menu>
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        width={250}
        collapsed={false}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          backgroundColor: '#188034' // colorPrimaryActive
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '16px',
            textAlign: 'center',
            justifyContent: 'center',
          }}
        >
          <img
            src="/assets/dark_mode_velloa_logo.png"
            alt="Logo"
            style={{ maxWidth: '100%', maxHeight: '36px' }}
          />
        </div>
        <Menu theme="dark" mode="inline" defaultSelectedKeys={['1']}>
          <Menu.Item key="1" icon={<HomeIcon className="custom-icon" />}>
            <Link to="/home">Home</Link>
          </Menu.Item>
          <Menu.Item key="2" icon={<BuildingOffice2Icon className="custom-icon" />}>
            <Link to="/property">Property</Link>
          </Menu.Item>
          <Menu.Item key="3" icon={<DocumentTextIcon className="custom-icon" />}>
            <Link to="/leasing">Leasing</Link>
          </Menu.Item>
          <Menu.Item key="4" icon={<UsersIcon className="custom-icon" />}>
            <Link to="/people">People</Link>
          </Menu.Item>
          <Menu.Item key="5" icon={<WrenchScrewdriverIcon className="custom-icon" />}>
            <Link to="/tools">Tools</Link>
          </Menu.Item>
          <Menu.Item key="6" icon={<CheckCircleIcon className="custom-icon" />}>
            <Link to="/tasks">Tasks</Link>
          </Menu.Item>
          <Menu.Item key="7" icon={<BanknotesIcon className="custom-icon" />}>
            <Link to="/accounting">Accounting</Link>
          </Menu.Item>
          <Menu.Item key="9" icon={<ChartBarIcon className="custom-icon" />}>
            <Link to="/analytics">Analytics</Link>
          </Menu.Item>
        </Menu>
        <div style={{ position: 'absolute', bottom: 0, width: '100%' }}>
        <Dropdown overlay={dropdownMenu} trigger={['click']} placement="topCenter" className="sidebar-dropdown">
          <div className="user-info-container">
            <div className="user-info">
              <Avatar icon={<UserIcon className="custom-icon" />} />
              {userData && <span className="user-name">{`${userData.firstName} ${userData.lastName}`}</span>}
            </div>
          </div>
        </Dropdown>

        </div>
      </Sider>
      <Layout>
        <Content style={{ marginLeft: 250, overflow: 'auto',  }}>
          <div style={{ minHeight: '100vh' }}>
            <Outlet context={{ property: location.state?.property }} />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default Sidebar;
