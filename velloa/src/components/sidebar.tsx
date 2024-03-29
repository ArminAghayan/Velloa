import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Layout, Menu, Button, Dropdown, Avatar, Typography, message } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  HomeOutlined,
  ToolOutlined,
  AppstoreOutlined,
  FileSearchOutlined,
  BankOutlined,
  BarChartOutlined,
  SettingOutlined,
  LogoutOutlined,
  UserOutlined,
  BlockOutlined,
} from '@ant-design/icons';
import { auth } from '../firebase-config';
import { useDispatch } from 'react-redux';
import { logout } from '../components/redux/authSlice';
import { AppDispatch } from '../components/redux/store';
import { useSelector } from 'react-redux';
import { RootState } from '../components/redux/store';
import { Property } from '../components/redux/store';


const { Header, Sider, Content } = Layout;
const { Title } = Typography;

const Sidebar = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [collapsed, setCollapsed] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const selectedProperty = useSelector<RootState, Property | null>(
    (state) => state.property.selectedProperty
  );


  const handleLogout = () => {
    dispatch(logout());
  };

  const dropdownMenu = (
    <Menu>
      <Menu.Item icon={<SettingOutlined />}>
        <Link to="/settings">Settings</Link>
      </Menu.Item>
      <Menu.Item icon={<BlockOutlined />}>
        <Link to="/dashboard">Dashboard</Link>
      </Menu.Item>
      <Menu.Item icon={<LogoutOutlined />} onClick={handleLogout}>
          Logout
      </Menu.Item>
    </Menu>
  );
  
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div className="logo" style={{ padding: '16px', textAlign: 'center' }}>
          <img src="/assests/dark_mode_velloa_logo.png" alt="Logo" style={{ maxWidth: '100%', maxHeight: '24px' }} />
        </div>
        <Menu theme="dark" mode="inline" defaultSelectedKeys={['1']}>
          <Menu.Item key="1" icon={<HomeOutlined />}>
            <Link to="/home">Home</Link>
          </Menu.Item>
          <Menu.Item key="2" icon={<ToolOutlined />}>
            <Link to="/tools">Tools</Link>
          </Menu.Item>
          <Menu.Item key="3" icon={<AppstoreOutlined />}>
            <Link to="/units">Units</Link>
          </Menu.Item>
          <Menu.Item key="4" icon={<FileSearchOutlined />}>
            <Link to="/resources">Resources</Link>
          </Menu.Item>
          <Menu.Item key="5" icon={<BankOutlined />}>
            <Link to="/accounting">Accounting</Link>
          </Menu.Item>
          <Menu.Item key="6" icon={<BarChartOutlined />}>
            <Link to="/analytics">Analytics</Link>
          </Menu.Item>
        </Menu>
      </Sider>
      <Layout>
        <Header style={{ display: 'flex', alignItems: 'center', padding: '0', borderBottom: '1px solid #e8e8e8' }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: '16px', width: 64, height: 64, border: 'none', padding: 0 }}
          />
          <Title level={4} style={{ margin: 0, flex: 1 }}>
          {selectedProperty?.propertyName || 'Velloa'}
          </Title>
          <div style={{ marginLeft: 'auto', padding: '0 40px' }}>
            <Dropdown overlay={dropdownMenu} trigger={['click']}>
              <Avatar icon={<UserOutlined />} />
            </Dropdown>
          </div>
        </Header>
        <Content style={{ minHeight: 280 }}>
          <Outlet context={{ property: location.state?.property }} />
        </Content>
      </Layout>
    </Layout>
  );
};

export default Sidebar;