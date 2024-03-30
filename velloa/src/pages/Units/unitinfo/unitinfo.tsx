import React from 'react';
import { useLocation } from 'react-router-dom';
import { Typography, Row, Col, Button,Card,List  } from 'antd';

const { Title, Text } = Typography;

// Define the UnitData type
type UnitData = {
  key: string;
  unitNumber: number | '';
  floor: number | '';
  unitPrice: number | '';
  fullName: string | '';
  firstName: string | '';
  lastName: string | '';
  email: string | '';
  phoneNumber: string | '';
};

interface paymentsData {
  key: string;
  paymentDate: string;
  amount: number;
  status: string;
}

interface serviceRequestsData {
  key: string;
  requestDate: string;
  requestType: string;
  status: string;
  description: string;
}

interface documentsData {
  key: string;
  documentName: string;
  uploadDate: string;
  status: string;
  type: string;
}


const UnitInfoPage: React.FC = () => {
  const location = useLocation();
  const { unit } = location.state as { unit: UnitData };

  return (
    <div >
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Title level={2}>Unit: {unit.unitNumber}</Title>
        </Col>
        <Col span={12} style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <Button type="default" style={{ marginRight: '10px' }}>Edit</Button>
          <Button type="default" style={{ marginRight: '10px' }}>List</Button>
          <Button type="default" style={{ marginRight: '10px' }}>Message</Button>
          <Button type="primary"style={{ marginRight: '10px', width: '120px'}}>Request</Button>
        </Col>
        <Col span={8}>
          <Text>Full Name:{unit.fullName}Armin Aghayan</Text>
        </Col>
        <Col span={8}>
          <Text>Last Name:</Text>
        </Col>
        <Col span={8}>
          <Text>Email: arminarmin@gmail.com</Text>
        </Col>
        <Col span={8}>
        <Text>Title:</Text>
        </Col>
        <Col span={8}>
          <Text>Suffix: N/a</Text>
        </Col>
        <Col span={8}>
          <Text>Phone Number: 416-319-2828</Text>
        </Col>
        <Col span={8}>
          <Text>First Name:</Text>
        </Col>
        <Col span={8}>
          <Text>Unit Price: {unit.unitPrice}</Text>
        </Col>
        <Col span={8}>
          <Text>Other Number:</Text>
        </Col>
        <Col span={8}>
          <Text>Middle Name: N/a</Text>
        </Col>
        <Col span={16}>
          <Text>Tenent Rent Period: 10/10/2023</Text>
        </Col>
     
        
      </Row>
  
      <Row gutter={[16, 16]} style={{ marginTop: '20px' }}>
        <Col span={24}>
          <Card title="Payments">
            <List itemLayout="horizontal">

            </List>
          </Card>        
        </Col>
        <Col span={24}>
          <Card title="Serivce Requests">
            <List itemLayout="horizontal">

            </List>
          </Card>  
        </Col>
        <Col span={24}>
          <Card title="Documents">
            <List itemLayout="horizontal">

            </List>
          </Card>  
        </Col>
      </Row>
    </div>
  );
};

export default UnitInfoPage;