import React, { useState, useEffect, useCallback } from 'react';
import { Typography, Table, Space, Input, Skeleton, Button, message, Dropdown, Menu,Col, Row, Select } from 'antd';
import { RightOutlined, ReloadOutlined, UserOutlined, FileTextOutlined, DownOutlined } from '@ant-design/icons';
import { SortOrder } from 'antd/lib/table/interface';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../../firebase-config';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';

const { Option } = Select;

const { Title } = Typography;

interface MaintenanceData {
  key: string;
  subject: string;
  assignees: string[];
  dueDate: string;
  relatedTo: string;
  status: string;
}

const leasingPage: React.FC = () => {







  const createSkeletonData = (count: number): MaintenanceData[] => {
    return Array.from({ length: count }, (_, index) => ({
      key: `skeleton-${index}`,
      subject: '',
      assignees: [],
      dueDate: '',
      relatedTo: '',
      status: '',
    }));
  };

  const columns = [
    {
      title: 'Task',
      dataIndex: 'subject',
      key: 'subject',
      defaultSortOrder: 'ascend' as SortOrder,
      sorter: (a: MaintenanceData, b: MaintenanceData) => a.subject.localeCompare(b.subject),
    },
    {
      title: 'Assigned To',
      dataIndex: 'assignees',
      key: 'assignees',
      sorter: (a: MaintenanceData, b: MaintenanceData) => a.assignees.join(', ').localeCompare(b.assignees.join(', ')),
    },
    {
      title: 'Due At',
      dataIndex: 'dueDate',
      key: 'dueDate',
      sorter: (a: MaintenanceData, b: MaintenanceData) => a.dueDate.localeCompare(b.dueDate),
    },
    {
      title: 'Related To',
      dataIndex: 'relatedTo',
      key: 'relatedTo',
      sorter: (a: MaintenanceData, b: MaintenanceData) => a.relatedTo.localeCompare(b.relatedTo),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      sorter: (a: MaintenanceData, b: MaintenanceData) => a.status.localeCompare(b.status),
    },
    {
      title: '',
      align: 'center' as 'center',
      key: 'arrow',
    },
  ];




  const addTaskMenu = (
    <Menu>
      <Menu.Item
        key="newTask"
        icon={<FileTextOutlined />}
      >
        New Tenants
      </Menu.Item>
      <Menu.Item
        key="newOwnerRequest"
        icon={<UserOutlined />}
      >
        New Prospects
      </Menu.Item>
      <Menu.Item
        key="newTenantRequest"
        icon={<UserOutlined />}
      >
        New Vendors
      </Menu.Item>
      <Menu.Item
        key="newWorkOrder"
        icon={<FileTextOutlined />}
      >
        New Prospects
      </Menu.Item>
    </Menu>
  );

  return (
    <div style={{ padding: '64px 24px' }}>
      <Title level={1} style={{ textAlign: 'left', marginTop: '0px', marginBottom: '20px' }}>
        Leasing
      </Title>
      <div className="property-page-container">
      <Row gutter={16} justify="space-between" align="middle" style={{ marginBottom: '16px' }}>
        <Col span={16}>
          <Row gutter={16}>
            <Col>
              <Input
                placeholder="Search notes"
                className='note-search-input'
              />
            </Col>
            <Col>
              <Select
                placeholder="Filter by category"
                allowClear
                className='note-dropdown-input'
                defaultValue= 'Tenants'
              >
                <Option value="Tenants">Tenants</Option>
                <Option value="Prospects">Prospects</Option>
                <Option value="Vendors">Vendors</Option>
                <Option value="Prospects">Prospects</Option>
              </Select>
            </Col>
          </Row>
        </Col>
        <Col span={4} style={{ textAlign: 'right' }}>
        <Dropdown overlay={addTaskMenu} trigger={['click']}>
              <Button className="add-property-button">
                New Lease <DownOutlined />
              </Button>
            </Dropdown>
            
        </Col>
      </Row>

        <Table
          columns={columns}
          size="middle"
          pagination={{ pageSize: 10 }}
       
          className="custom-table"
        />
      </div>
      
    </div>
  );
};

export default leasingPage;