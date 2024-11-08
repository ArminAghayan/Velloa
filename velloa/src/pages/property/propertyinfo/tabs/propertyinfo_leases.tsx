import React, { useEffect, useState } from 'react';
import { Table, message, Button, Row, Col, Drawer, Form, Input, DatePicker, Select, Typography, Spin } from 'antd';
import { db } from '../../../../firebase-config';
import { collection, getDocs, addDoc, updateDoc } from 'firebase/firestore';
import { PlusOutlined, LoadingOutlined } from '@ant-design/icons';
import { v4 as uuidv4 } from 'uuid';
import './propertyinfo_leases.css';

const { Title, Text } = Typography;
const { Option } = Select;

export interface Lease {
  leaseId: string;
  unit: string;
  tenant: string;
  startDate: string;
  endDate: string;
}

const PropertyInfoLeases: React.FC = () => {
  const [leases, setLeases] = useState<Lease[]>([]);
  const [filteredLeases, setFilteredLeases] = useState<Lease[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [current, setCurrent] = useState(0);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    const fetchLeases = async () => {
      try {
        const leasesRef = collection(db, 'leases');
        const leasesSnapshot = await getDocs(leasesRef);
        const fetchedLeases: Lease[] = leasesSnapshot.docs.map(doc => ({
          ...(doc.data() as Lease),
          leaseId: doc.id,
        }));
        setLeases(fetchedLeases);
        setFilteredLeases(fetchedLeases);
      } catch (error) {
        console.error("Error fetching leases: ", error);
        message.error("Failed to fetch leases. Please check your permissions.");
      } finally {
        setLoading(false);
      }
    };

    fetchLeases();
  }, []);

  useEffect(() => {
    handleFilter();
  }, [searchText, filterStatus, leases]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };

  const handleFilterChange = (value: string) => {
    setFilterStatus(value);
  };

  const handleFilter = () => {
    let filtered = leases;
    if (searchText) {
      filtered = filtered.filter(lease =>
        lease.unit.toLowerCase().includes(searchText.toLowerCase()) ||
        lease.tenant.toLowerCase().includes(searchText.toLowerCase())
      );
    }
    setFilteredLeases(filtered);
  };

  const columns = [
    { title: 'Unit Number', dataIndex: 'unit', key: 'unit' },
    { title: 'Lessee Name', dataIndex: 'tenant', key: 'tenant' },
    { title: 'Start Date', dataIndex: 'startDate', key: 'startDate' },
    { title: 'End Date', dataIndex: 'endDate', key: 'endDate' },
  ];

  const handleRowClick = (lease: Lease) => {
    // Implement row click functionality if needed
  };

  const handleNewLeaseClick = () => {
    setDrawerVisible(true);
    setCurrent(0);
    form.resetFields();
  };

  const handleDrawerClose = () => {
    setDrawerVisible(false);
    setCurrent(0);
    form.resetFields();
  };

  const handleFormSubmit = async () => {
    try {
      const values = await form.validateFields();
      const newLease: Lease = {
        leaseId: uuidv4(),
        unit: values.unit,
        tenant: values.tenant,
        startDate: values.startDate.format('YYYY-MM-DD'),
        endDate: values.endDate.format('YYYY-MM-DD'),
      };

      const leasesRef = collection(db, 'leases');
      const docRef = await addDoc(leasesRef, newLease);
      await updateDoc(docRef, { leaseId: docRef.id });
      newLease.leaseId = docRef.id;

      setLeases(prevLeases => [...prevLeases, newLease]);
      setFilteredLeases(prevFiltered => [...prevFiltered, newLease]);
      message.success('Lease added successfully');
      handleDrawerClose();
    } catch (error) {
      console.error("Error adding lease: ", error);
      if (error instanceof Error) {
        message.error(`Failed to add lease: ${error.message}`);
      } else {
        message.error("Failed to add lease. Please try again.");
      }
    }
  };

  return (
    <div className="leases-container">
      <div className="leases-box">
        <Row gutter={16} justify="space-between" align="middle" style={{ marginBottom: '16px' }}>
          <Col xs={24} sm={24} md={12} lg={12}>
            <Row gutter={16} wrap={false}>
              <Col>
                <Input
                  className="lease-search-input"
                  placeholder="Search leases"
                  value={searchText}
                  onChange={handleSearchChange}
                />
              </Col>
              <Col>
                <Select
                  className="lease-dropdown-input"
                  placeholder="Filter by status"
                  onChange={handleFilterChange}
                  allowClear
                  style={{ width: 150 }}
                >
                  <Option value="Occupied">Occupied</Option>
                  <Option value="Vacant">Vacant</Option>
                </Select>
              </Col>
            </Row>
          </Col>
          <Col 
            xs={24} 
            sm={24} 
            md={12} 
            lg={12} 
            style={{ 
              textAlign: 'right',
              marginTop: 16
            }}
            className="new-lease-button-container"
          >
            <Button 
              className="new-lease-button" 
              onClick={handleNewLeaseClick} 
              type="default" 
              icon={<PlusOutlined />}
            >
              New Lease
            </Button>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={filteredLeases}
          loading={{
            spinning: loading,
            indicator: <Spin indicator={<LoadingOutlined spin />} size="large" />
          }}
          onRow={(record) => ({
            onClick: () => handleRowClick(record),
          })}
          rowKey="leaseId"
        />

        <Drawer
          title="Add New Lease"
          width={720}
          onClose={handleDrawerClose}
          visible={drawerVisible}
          bodyStyle={{ paddingBottom: 80 }}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleFormSubmit}
          >
            <Form.Item
              name="unit"
              label="Unit Number"
              rules={[{ required: true, message: 'Please enter the unit number' }]}
            >
              <Input placeholder="Unit Number" />
            </Form.Item>
            <Form.Item
              name="tenant"
              label="Tenant Name"
              rules={[{ required: true, message: 'Please enter the tenant name' }]}
            >
              <Input placeholder="Tenant Name" />
            </Form.Item>
            <Form.Item
              name="startDate"
              label="Start Date"
              rules={[{ required: true, message: 'Please select the start date' }]}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              name="endDate"
              label="End Date"
              rules={[{ required: true, message: 'Please select the end date' }]}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Button 
              type="primary" 
              htmlType="submit"
            >
              Submit
            </Button>
          </Form>
        </Drawer>
      </div>
    </div>
  );
};

export default PropertyInfoLeases;
