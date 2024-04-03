import { Typography, Input, Button, Table, Row, Col } from 'antd';

const { Title } = Typography;

const NewTenant: React.FC = () => {
  const columns = [
    { title: 'Unit Number', dataIndex: 'unitNumber', key: 'unitNumber' },
    { title: 'Number of Packages', dataIndex: 'numPackages', key: 'numPackages' },
    { title: 'Picked Up', dataIndex: 'pickedUp', key: 'pickedUp' },
  ];

  return (
    <>
      <Title level={2}>New Tenant</Title>
      <Row gutter={[16, 16]}>
        <Col span={24} style={{ paddingBottom: '20px' }}>
          <Row gutter={[16, 16]}>
            <Col span={18}>
              <Input.Search placeholder="Search by unit number" />
            </Col>
            <Col span={6}>
              <Button type="primary" block>+ New Application</Button>
            </Col>
          </Row>
        </Col>
      </Row>
      <Row>
        <Col span={24}>
          <Table columns={columns} dataSource={[]} />
        </Col>
      </Row>
    </>
  );
};

export default NewTenant;