import React, { useState } from 'react';
import {Link, Outlet  } from 'react-router-dom';
import { Layout, Menu, Button, Dropdown, Avatar, Typography, theme } from 'antd';
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
    BlockOutlined ,
  

} from '@ant-design/icons';


const dropdownMenu = (
    <Menu>
      <Menu.Item icon={<SettingOutlined />}>
        <Link to="/settings">Settings</Link>
      </Menu.Item>
      <Menu.Item icon={<BlockOutlined />}>
        <Link to="/home">Overview</Link>
      </Menu.Item>
      <Menu.Item icon={<LogoutOutlined />}>
        <Link to="/logout">Logout</Link>
      </Menu.Item>
    </Menu>
  );
const { Header, Sider, Content } = Layout;
const { Title } = Typography;

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  return (
      <Layout style={{ minHeight: '100vh' }}>
        <Sider trigger={null} collapsible collapsed={collapsed}>
        <div className="logo" style={{ padding: '16px', textAlign: 'center' }}>
        <img src="/assests/Logo.png" alt="Logo" style={{ maxWidth: '100%', maxHeight: '24px' }} />
        </div>  
        <Menu theme="dark" mode="inline" defaultSelectedKeys={['1']}>
            <Menu.Item key="1" icon={<HomeOutlined />}>
              <Link to="/dashboard">Home</Link>
            </Menu.Item>
            <Menu.Item key="2" icon={<ToolOutlined />}>
              <Link to="/tools">Tools</Link>
            </Menu.Item>
            <Menu.Item key="3" icon={<AppstoreOutlined  />}>
              <Link to="/units">Units</Link>
            </Menu.Item>
            <Menu.Item key="4" icon={<FileSearchOutlined />}>
              <Link to="/resources">Resources</Link>
            </Menu.Item>
            <Menu.Item key="5" icon={<BankOutlined />}>
              <Link to="/accounting">Accounting</Link>
            </Menu.Item>
            <Menu.Item key="6" icon={<BarChartOutlined  />}>
              <Link to="/analytics">Analytics</Link>
          </Menu.Item>
          </Menu>
        </Sider>
        <Layout>
        <Header style={{ display: 'flex', alignItems: 'center', padding: '0', background: colorBgContainer, borderBottom: '1px solid #e8e8e8', // Add a bottom border line
 }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{
                fontSize: '16px',
                width: 64,
                height: 64,
                border: 'none',
                padding: 0,
              }}
            />
            <Title level={4} style={{ margin: 0, flex: 1 }}>
              Velloa Group
            </Title>
            <div style={{ marginLeft: 'auto', padding: '0 20px' }}> {/* Apply padding to this wrapper div */}
                <Dropdown overlay={dropdownMenu} trigger={['click']}>
                  <Avatar style={{ backgroundColor: '#1677FF' }} icon={<UserOutlined />} />
                </Dropdown>
            </div>
          </Header>
          <Content
            style={{
              minHeight: 280,
              background: colorBgContainer,
            }}
          >
            <Outlet />
          </Content>
        </Layout>
      </Layout>
  
  );
};

export default Sidebar;