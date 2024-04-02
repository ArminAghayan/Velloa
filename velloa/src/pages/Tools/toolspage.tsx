import React from 'react';
import { Card, Col, Row, Typography } from 'antd';
import {
  MessageOutlined,
  ToolOutlined,
  GiftOutlined,
  TeamOutlined,
  BookOutlined,
  BulbOutlined,
  FileAddOutlined,
  CalendarOutlined,
  UserAddOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;

interface ToolButtonProps {
  icon: React.ReactNode;
  text: string;
  onClick: () => void;
}

const ToolButton: React.FC<ToolButtonProps> = ({ icon, text, onClick }) => (
  <Card
    onClick={onClick}
    hoverable
    style={{
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '150px',
      backgroundColor: '#F0F0F0',
    }}
    bodyStyle={{
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <div style={{ fontSize: '24px', marginBottom: '8px', color: 'rgba(0, 0, 0, 0.65)' }}>{icon}</div>
    <div style={{ color: 'rgba(0, 0, 0, 0.65)' }}>{text}</div>
  </Card>
);

const ToolsPage = () => {
  const navigate = useNavigate();

  const handleClick = (path: string) => {
    navigate(path);
  };

  return (
    <div >
      <Title level={1} style={{ textAlign: 'left', marginTop: '0px', marginBottom: '20px' }}>
        Tools
      </Title>

      <Row gutter={[16, 16]} justify="start">
        <Col xs={12} sm={8} md={6} lg={4} xl={3}>
          <ToolButton icon={<MessageOutlined />} text="Messages" onClick={() => handleClick('/messages')} />
        </Col>
        <Col xs={12} sm={8} md={6} lg={4} xl={3}>
          <ToolButton icon={<ToolOutlined />} text="Maintenance" onClick={() => handleClick('/maintenance')} />
        </Col>
        <Col xs={12} sm={8} md={6} lg={4} xl={3}>
        <ToolButton icon={<FileAddOutlined />} text="Applications" onClick={() => handleClick('/applications')} />
        </Col>
        <Col xs={12} sm={8} md={6} lg={4} xl={3}>
        <ToolButton icon={<BookOutlined />} text="Logbook" onClick={() => handleClick('/logbook')} />
        </Col>
        <Col xs={12} sm={8} md={6} lg={4} xl={3}>
        <ToolButton icon={<TeamOutlined />} text="Visitors" onClick={() => handleClick('/visitors')} />
        </Col>
        <Col xs={12} sm={8} md={6} lg={4} xl={3}>
          <ToolButton icon={<BulbOutlined />} text="Amenities" onClick={() => handleClick('/amenities')} />
        </Col>
        <Col xs={12} sm={8} md={6} lg={4} xl={3}>
        <ToolButton icon={<GiftOutlined />} text="Packages" onClick={() => handleClick('/packages')} />
        </Col>
        <Col xs={12} sm={8} md={6} lg={4} xl={3}>
          <ToolButton icon={<CalendarOutlined />} text="Events" onClick={() => handleClick('/events')} />
        </Col>
        <Col xs={12} sm={8} md={6} lg={4} xl={3}>
          <ToolButton icon={<UserAddOutlined />} text="New Tenant" onClick={() => handleClick('/new-tenant')} />
        </Col>
      </Row>
    </div>
  );
};

export default ToolsPage;