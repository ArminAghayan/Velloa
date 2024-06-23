import React from 'react';
import { useLocation } from 'react-router-dom';
import { Typography, Row, Col, Button, Card, List, Table, Input, Select } from 'antd';
import './UnitInfoPage.css'; 

const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;

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

const columns = [
  {
    title: 'Unit Number',
    dataIndex: 'unitNumber',
    key: 'unitNumber',
  },
  {
    title: 'Tenant',
    dataIndex: 'tenant',
    key: 'tenant',
  },
  {
    title: 'Beds',
    dataIndex: 'beds',
    key: 'beds',
  },
  {
    title: 'Baths',
    dataIndex: 'baths',
    key: 'baths',
  },
  {
    title: 'Market Rent',
    dataIndex: 'marketRent',
    key: 'marketRent',
  },
  {
    title: 'Size',
    dataIndex: 'size',
    key: 'size',
  },
];

const dataSource = [
  {
    key: '1',
    unitNumber: '1',
    tenant: 'Vacant',
    beds: '1',
    baths: '1',
    marketRent: '1',
    size: '1',
  },
];

const UnitInfoPage: React.FC = () => {
  const location = useLocation();
  const { unit } = location.state as { unit: UnitData };

  return (
    <div className="unit-info-container">
      <Row gutter={[16, 16]} className="search-row">
        <Col span={24}>
          <Search placeholder="Search units" style={{ width: 200, marginRight: 10 }} />
          <Select defaultValue="Filter by status" style={{ width: 200 }}>
            <Option value="vacant">Vacant</Option>
            <Option value="occupied">Occupied</Option>
          </Select>
          <Button type="primary" className="new-unit-button">+ New Unit</Button>
        </Col>
      </Row>

      <Table dataSource={dataSource} columns={columns} pagination={{ pageSize: 1 }} />

      <Row gutter={[16, 16]} style={{ marginTop: '20px' }}>
        <Col span={12}>
          <Title level={2}>Unit: {unit.unitNumber}</Title>
        </Col>
        <Col span={12} style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <Button type="default" style={{ marginRight: '10px' }}>Edit</Button>
          <Button type="default" style={{ marginRight: '10px' }}>List</Button>
          <Button type="default" style={{ marginRight: '10px' }}>Message</Button>
          <Button type="primary" style={{ marginRight: '10px', width: '120px' }}>Request</Button>
        </Col>
        <Col span={8}>
          <Text>Full Name: {unit.fullName}</Text>
        </Col>
        <Col span={8}>
          <Text>Last Name: {unit.lastName}</Text>
        </Col>
        <Col span={8}>
          <Text>Email: {unit.email}</Text>
        </Col>
        <Col span={8}>
          <Text>Title: </Text>
        </Col>
        <Col span={8}>
          <Text>Suffix: N/A</Text>
        </Col>
        <Col span={8}>
          <Text>Phone Number: {unit.phoneNumber}</Text>
        </Col>
        <Col span={8}>
          <Text>First Name: {unit.firstName}</Text>
        </Col>
        <Col span={8}>
          <Text>Unit Price: {unit.unitPrice}</Text>
        </Col>
        <Col span={8}>
          <Text>Other Number: </Text>
        </Col>
        <Col span={8}>
          <Text>Middle Name: N/A</Text>
        </Col>
        <Col span={16}>
          <Text>Tenant Rent Period: 10/10/2023</Text>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: '20px' }}>
        <Col span={24}>
          <Card title="Payments">
            <List itemLayout="horizontal">
              {/* Add List items here */}
            </List>
          </Card>
        </Col>
        <Col span={24}>
          <Card title="Service Requests">
            <List itemLayout="horizontal">
              {/* Add List items here */}
            </List>
          </Card>
        </Col>
        <Col span={24}>
          <Card title="Documents">
            <List itemLayout="horizontal">
              {/* Add List items here */}
            </List>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default UnitInfoPage;
