import { Typography, Input, Button, Table, Row, Col } from 'antd';
import { useState } from 'react';
import './newapplications.css';
import NewApplicationModal from './newapplicationmodal/newapplicationmodal';


const { Title } = Typography;

const NewApplications: React.FC = () => {
    const [activeFilter, setActiveFilter] = useState('all');
    const [isModalVisible, setIsModalVisible] = useState(false);

  const columns = [
    { title: 'Name', dataIndex: 'unitNumber', key: 'unitNumber' },
    { title: 'Type of Application', dataIndex: 'typeapplcation', key: 'typeapplcation' },
    { title: 'Date created', dataIndex: 'datecreated', key: 'datecreated' },
    { title: 'Status', dataIndex: 'pickedUp', key: 'pickedUp' },
    { title: 'Action', dataIndex: 'pickedUp', key: 'pickedUp' },
  ];

  const handleFilter = (filter: string) => {
    setActiveFilter(filter);
    // Apply the filter logic here based on the selected button
    console.log(`Filtering by: ${filter}`);
  };


  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  return (
    <>
      <Title level={2} className="application-title">
        Application
      </Title>
      <Row gutter={[16, 16]} className='application-search-add-row'>
        <Col span={24}>
          <Row justify="space-between" align="middle">
            <Col span={8}>
              <Input placeholder="Search by unit number" className="search-bar" />
            </Col>
            <Col>
              <Button type="primary" className="new-application-button" onClick={() => setIsModalVisible(true)}>
                + New Application
                
              </Button>
            </Col>
          </Row>
        </Col>
      </Row>
      <Row gutter={[16, 16]} className="application-filter-row">
        <Col span={24}>
          <Row>
          <Col>
              <Button
                type="primary"
                className={`filter-button ${activeFilter === 'all' ? 'active' : ''}`}
                onClick={() => handleFilter('all')}
              >
                All
              </Button>
            </Col>
            <Col>
              <Button
                type="primary"
                className={`filter-button ${activeFilter === 'newApplications' ? 'active' : ''}`}
                onClick={() => handleFilter('newApplications')}
              >
                New Tenant
              </Button>
            </Col>
            <Col>
              <Button
                type="primary"
                className={`filter-button ${activeFilter === 'renewalForms' ? 'active' : ''}`}
                onClick={() => handleFilter('renewalForms')}
              >
                Renewal Forms
              </Button>
            </Col>
            <Col>
              <Button
                type="primary"
                className={`filter-button ${activeFilter === 'notices' ? 'active' : ''}`}
                onClick={() => handleFilter('notices')}
              >
                Notices
              </Button>
            </Col>
          </Row>
        </Col>
      </Row>
      <Row>
        <Col span={24}>
          <Table columns={columns} dataSource={[]} />
        </Col>
      </Row>
      <NewApplicationModal
        visible={isModalVisible}
        onCancel={handleCancel}
      />

    </>
  );
};

export default NewApplications;