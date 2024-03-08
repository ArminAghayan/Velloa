import React from 'react';
import { Card, Col, Row,Typography  } from 'antd';
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

// Your icon imports here...
const { Title } = Typography;

interface ToolButtonProps {
  icon: React.ReactNode;
  text: string;
}

const ToolButton: React.FC<ToolButtonProps> = ({ icon, text }) => (
  <Card 
    hoverable 
    style={{ 
      width: '100%', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '150px', // Set a fixed height or manage via responsive design
      backgroundColor: '#F2F2F2', // Set the background color
    }}
    bodyStyle={{
      padding: '24px', // Add padding if needed
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
  return (
    
    <div style={{padding: '20px' }}> {/* Set the background of the entire page here */}
          <Title level={1} style={{ textAlign: 'left',marginTop: '0px', marginBottom: '20px' }}>Tools</Title>

      <Row gutter={[16, 16]} justify="start"> {/* Use 'start' to align columns to the start of the row */}
        <Col xs={12} sm={8} md={6} lg={4} xl={3}>
          <ToolButton icon={<MessageOutlined />} text="Messages" />
        </Col>
        <Col xs={12} sm={8} md={6} lg={4} xl={3}>
          <ToolButton icon={<ToolOutlined />} text="Maintenance" />
        </Col>
        <Col xs={12} sm={8} md={6} lg={4} xl={3}>
          <ToolButton icon={<GiftOutlined />} text="Packages" />
        </Col>
        <Col xs={12} sm={8} md={6} lg={4} xl={3}>
          <ToolButton icon={<TeamOutlined />} text="Visitors" />
        </Col>
        <Col xs={12} sm={8} md={6} lg={4} xl={3}>
          <ToolButton icon={<BookOutlined />} text="Logbook" />
        </Col>
        <Col xs={12} sm={8} md={6} lg={4} xl={3}>
          <ToolButton icon={<BulbOutlined />} text="Amenities" />
        </Col>
        <Col xs={12} sm={8} md={6} lg={4} xl={3}>
          <ToolButton icon={<FileAddOutlined />} text="New Applications" />
        </Col>
        <Col xs={12} sm={8} md={6} lg={4} xl={3}>
          <ToolButton icon={<CalendarOutlined />} text="Events" />
        </Col>
        <Col xs={12} sm={8} md={6} lg={4} xl={3}>
          <ToolButton icon={<UserAddOutlined />} text="New Tenant" />
        </Col>
        
        {/* Repeat for other tools as needed */}
      </Row>
    </div>
  );
};

export default ToolsPage;
