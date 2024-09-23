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

const PeoplePage: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);

  const fetchCompanyId = useCallback(async () => {
    if (!auth.currentUser) {
      console.error("No authenticated user");
      return null;
    }
    try {
      const companiesQuery = query(
        collection(db, 'companies'),
        where(`members.${auth.currentUser.uid}`, '!=', null)
      );
      const companiesSnapshot = await getDocs(companiesQuery);
      if (companiesSnapshot.empty) {
        console.error("User is not a member of any company");
        return null;
      }
      // Assuming a user is only a member of one company
      return companiesSnapshot.docs[0].id;
    } catch (error) {
      console.error("Error fetching company ID:", error);
      return null;
    }
  }, []);


  useEffect(() => {
    const init = async () => {
      const fetchedCompanyId = await fetchCompanyId();
      if (fetchedCompanyId) {
        setCompanyId(fetchedCompanyId);
      } else {
        message.error("Failed to fetch company ID. Please try again.");
      }
    };
    init();
  }, [fetchCompanyId]);


  const handleAddTaskClick = () => {
    setDrawerVisible(true);
  };

  const handleNewOwnerRequest = () => {
    navigate('/newownerrequest');
  };

  const handleNewTenantRequest = () => {
    navigate('/newtenantrequest');
  };

  const handleNewWorkOrder = () => {
    navigate('/newworkorder');
  };



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
      render: (text: string) => (loading ? <Skeleton.Input style={{ width: '100px' }} active size="small" /> : text),
    },
    {
      title: 'Assigned To',
      dataIndex: 'assignees',
      key: 'assignees',
      sorter: (a: MaintenanceData, b: MaintenanceData) => a.assignees.join(', ').localeCompare(b.assignees.join(', ')),
      render: (assignees: string[]) => (loading ? <Skeleton.Input style={{ width: '100px' }} active size="small" /> : assignees.join(', ')),
    },
    {
      title: 'Due At',
      dataIndex: 'dueDate',
      key: 'dueDate',
      sorter: (a: MaintenanceData, b: MaintenanceData) => a.dueDate.localeCompare(b.dueDate),
      render: (text: string) => (loading ? <Skeleton.Input style={{ width: '100px' }} active size="small" /> : text),
    },
    {
      title: 'Related To',
      dataIndex: 'relatedTo',
      key: 'relatedTo',
      sorter: (a: MaintenanceData, b: MaintenanceData) => a.relatedTo.localeCompare(b.relatedTo),
      render: (text: string) => (loading ? <Skeleton.Input style={{ width: '100px' }} active size="small" /> : text),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      sorter: (a: MaintenanceData, b: MaintenanceData) => a.status.localeCompare(b.status),
      render: (text: string) => (loading ? <Skeleton.Input style={{ width: '100px' }} active size="small" /> : text),
    },
    {
      title: '',
      align: 'center' as 'center',
      key: 'arrow',
      render: () => (loading ? <Skeleton.Button style={{ width: '24px' }} active size="small" shape="circle" /> : <RightOutlined />),
    },
  ];



  const handleTaskClick = (task: MaintenanceData) => {
    navigate('/taskinfo/', { state: { task } });
  };

  const addTaskMenu = (
    <Menu>
      <Menu.Item
        key="newTask"
        icon={<FileTextOutlined />}
        onClick={handleAddTaskClick}
      >
        New Tenants
      </Menu.Item>
      <Menu.Item
        key="newOwnerRequest"
        icon={<UserOutlined />}
        onClick={handleNewOwnerRequest}
      >
        New Prospects
      </Menu.Item>
      <Menu.Item
        key="newTenantRequest"
        icon={<UserOutlined />}
        onClick={handleNewTenantRequest}
      >
        New Vendors
      </Menu.Item>
      <Menu.Item
        key="newWorkOrder"
        icon={<FileTextOutlined />}
        onClick={handleNewWorkOrder}
      >
        New Prospects
      </Menu.Item>
    </Menu>
  );

  return (
    <div style={{ padding: '64px 36px' }}>
      <Title level={1} style={{ textAlign: 'left', marginTop: '0px', marginBottom: '20px' }}>
        People
      </Title>
      <div className="property-page-container">
      <Row gutter={16} justify="space-between" align="middle" style={{ marginBottom: '16px' }}>
        <Col span={16}>
          <Row gutter={16}>
            <Col>
              <Input
                placeholder="Search notes"
                className='note-search-input'
                value={searchText}
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
                New People <DownOutlined />
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

export default PeoplePage;