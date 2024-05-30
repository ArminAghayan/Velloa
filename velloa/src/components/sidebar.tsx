import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Layout, Menu, Dropdown, Avatar, Typography } from 'antd';
import {
  HomeOutlined,
  ToolOutlined,
  AppstoreOutlined,
  FileTextOutlined,
  BankOutlined,
  BarChartOutlined,
  SettingOutlined,
  LogoutOutlined,
  UserOutlined,
  UsergroupDeleteOutlined,
  CheckSquareOutlined,
} from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../components/redux/authSlice';
import { AppDispatch, RootState } from '../components/redux/store';
import 'antd/dist/reset.css';

const { Header, Content, Sider } = Layout;
const { Title } = Typography;

const Sidebar: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation();
  const selectedProperty = useSelector((state: RootState) => state.property.property);

  const handleLogout = () => {
    dispatch(logout());
  };

  const dropdownMenu = (
    <Menu>
      <Menu.Item icon={<SettingOutlined />}>
        <Link to="/settings">Settings</Link>
      </Menu.Item>
      <Menu.Item icon={<LogoutOutlined />} onClick={handleLogout}>
        Logout
      </Menu.Item>
    </Menu>
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        <div className="logo" style={{ padding: '16px', textAlign: 'center' }}>
          <img
            src="/assests/dark_mode_velloa_logo.png"
            alt="Logo"
            style={{ maxWidth: '100%', maxHeight: '36px' }}
          />
        </div>
        <Menu theme="dark" mode="inline" defaultSelectedKeys={['1']}>
          <Menu.Item key="1" icon={<HomeOutlined />}>
            <Link to="/home">Home</Link>
          </Menu.Item>
          <Menu.Item key="2" icon={<AppstoreOutlined />}>
            <Link to="/property">Property</Link>
          </Menu.Item>
          <Menu.Item key="3" icon={<FileTextOutlined />}>
            <Link to="/leasing">Leasing</Link>
          </Menu.Item>
          <Menu.Item key="4" icon={<UsergroupDeleteOutlined />}>
            <Link to="/people">People</Link>
          </Menu.Item>
          <Menu.Item key="5" icon={<ToolOutlined />}>
            <Link to="/tools">Tools</Link>
          </Menu.Item>
          <Menu.Item key="6" icon={<CheckSquareOutlined />}>
            <Link to="/tasks">Tasks</Link>
          </Menu.Item>
          <Menu.Item key="7" icon={<BankOutlined />}>
            <Link to="/accounting">Accounting</Link>
          </Menu.Item>
          <Menu.Item key="9" icon={<BarChartOutlined />}>
            <Link to="/analytics">Analytics</Link>
          </Menu.Item>
        </Menu>
      </Sider>
      <Layout>
        <Header
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '0',
            borderBottom: '1px solid #e8e8e8',
            background: '#ffffff',
            position: 'fixed',
            zIndex: 1,
            width: 'calc(100% - 200px)',
            left: 200,
          }}
        >
          <Title level={4} style={{ margin: 0, flex: 1 }}>
            {selectedProperty?.propertyName || 'Velloa'}
          </Title>
          <div style={{ marginLeft: 'auto', padding: '0 40px' }}>
            <Dropdown overlay={dropdownMenu} trigger={['click']}>
              <Avatar icon={<UserOutlined />} />
            </Dropdown>
          </div>
        </Header>
        <Content style={{ marginTop: 64, marginLeft: 200, overflow: 'auto' }}>
          <div style={{ minHeight: 280 }}>
            <Outlet context={{ property: location.state?.property }} />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default Sidebar;
