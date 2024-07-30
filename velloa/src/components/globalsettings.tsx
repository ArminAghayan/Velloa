import React, { useState } from 'react';
import { Modal, Form, Input, Button, Menu, Layout, Typography } from 'antd';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../components/redux/store';

const { Sider, Content } = Layout;
const { Title } = Typography;

interface GlobalSettingsProps {
  isVisible: boolean;
  onClose: () => void;
}

const GlobalSettings: React.FC<GlobalSettingsProps> = ({ isVisible, onClose }) => {
  const [form] = Form.useForm();
  const dispatch = useDispatch<AppDispatch>();
  const [selectedMenu, setSelectedMenu] = useState('general');

  const menuItems = [
    { key: 'general', label: 'General' },
    { key: 'user', label: 'User' },
    { key: 'customization', label: 'Customization' },
    { key: 'additional', label: 'Additional Settings' },
    { key: 'help', label: 'Help' },
  ];

  const renderContent = () => {
    switch (selectedMenu) {
      case 'general':
        return <div>General Settings Content</div>;
      case 'user':
        return <div>User Settings Content</div>;
      case 'customization':
        return <div>Customization Settings Content</div>;
      case 'additional':
        return <div>Additional Settings Content</div>;
      case 'help':
        return <div>Help Content</div>;
      default:
        return null;
    }
  };

  return (
    <Modal
      visible={isVisible}
      onCancel={onClose}
      footer={null}
      width={1000}
    >
      <Title level={3} style={{ marginBottom: 20 }}>Settings</Title>
      <Layout>
        <Sider width={200} theme="light">
          <Menu
            mode="inline"
            selectedKeys={[selectedMenu]}
            onClick={({ key }) => setSelectedMenu(key)}
            items={menuItems}
            style={{ height: '100%' }}
          />
        </Sider>
        <Content style={{ padding: '0 24px', minHeight: 400, backgroundColor:'white' }}>
          {renderContent()}
        </Content>
      </Layout>
    </Modal>
  );
};

export default GlobalSettings;