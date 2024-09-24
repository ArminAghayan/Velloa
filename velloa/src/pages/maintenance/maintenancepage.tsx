import React, { useState, useEffect, useCallback } from 'react';
import { Typography, Table, Space, Input, Skeleton, Button, message, Dropdown, Menu, Tag,Tooltip, } from 'antd';
import { RightOutlined, ReloadOutlined, UserOutlined, DownOutlined, ClockCircleOutlined, CheckCircleOutlined, ProfileOutlined,ToolOutlined } from '@ant-design/icons';
import { SortOrder } from 'antd/lib/table/interface';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../../firebase-config';
import { collection, getDocs, query, where, Timestamp, doc, getDoc } from 'firebase/firestore';
import './maintenancepage.css';
import NewTaskDrawer from './Tasks/NewTaskDrawer';
import NewWorkOrder from './Tasks/NewWorkOrder';
import NewTenantRequest from './Tasks/NewTenantRequest';
import NewOwnerRequest from './Tasks/NewOwnerRequest';

const { Title, Text } = Typography;

export interface MaintenanceData {
  key: string;
  taskRefId: string;
  subject: string;
  assignees: { uid: string; name: string }[];
  dueDate: string;
  relatedTo: string;
  relatedToName: string;
  status: string;
  priority: string;
  taskType: string;
  createdAt?: string;
  description?: string;
  vendor?: string;
  approvedByOwner?: boolean;
  permissionToEnter?: boolean;
  entryNotes?: string;

}


const MaintenancePage: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [maintenanceTasks, setMaintenanceTasks] = useState<MaintenanceData[]>([]);
  const [workOrderDrawerVisible, setWorkOrderDrawerVisible] = useState(false);
  const [workNewTenantRequestVisible, setNewTenantRequestDrawerVisible] = useState(false);
  const [isOwnerRequestVisible, setIsOwnerRequestVisible] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);

  const getStatusTag = (status: string) => {
    const trimmedStatus = status.trim().toLowerCase();
    
    if (trimmedStatus === 'not started') {
      return (
        <Tag icon={<ClockCircleOutlined />} color="default">
          Not Started
        </Tag>
      );
    } else if (trimmedStatus === 'in progress') {
      return (
        <Tag icon={<ClockCircleOutlined />} color="warning">
          In Progress
        </Tag>
      );
    } else if (trimmedStatus === 'finished' || trimmedStatus === 'completed') {
      return (
        <Tag icon={<CheckCircleOutlined />} color="success">
          Finished
        </Tag>
      );
    } else {
      return <Tag color="default">{status}</Tag>;
    }
  };

  const getPriorityTag = (priority: string) => {
    const color = priority.toLowerCase() === 'high' ? 'red' : 
                  priority.toLowerCase() === 'medium' ? 'orange' : 'green';
    return <Tag color={color}>{priority} Priority</Tag>;
  };

  const getTaskTypeIcon = (taskType: string) => {
    switch (taskType.toLowerCase()) {
      case 'task':
        return <ProfileOutlined />;
      case 'owner request':
        return <UserOutlined/>;
      case 'tenant request':
        return <UserOutlined />;
      case 'vendor request':
        return <UserOutlined/>;
      case 'work order':
        return <ToolOutlined/>;
      default:
        return <ProfileOutlined />;
    }
  };

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

  const fetchMaintenanceTasks = useCallback(async () => {
    if (!companyId) return;
    
    try {
      setLoading(true);
      const tasksQuery = query(collection(db, 'maintenance'), where('companyId', '==', companyId));
      const querySnapshot = await getDocs(tasksQuery);

      const tasksData: MaintenanceData[] = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          key: doc.id,
          subject: data.subject || '',
          taskRefId: data.taskRefId || '',
          assignees: Array.isArray(data.assignees) 
            ? data.assignees.map((assignee: any) => ({
                uid: assignee.uid || '',
                name: assignee.name || 'Unknown'
              }))
            : [],
          dueDate: data.dueDate instanceof Timestamp 
            ? data.dueDate.toDate().toLocaleDateString() 
            : '',
          relatedTo: data.relatedTo || '',
          relatedToName: data.relatedToName || 'Unknown',
          status: data.status || '',
          priority: data.priority || 'Low',
          taskType: data.taskType || 'Task',
        };
      });

      setMaintenanceTasks(tasksData);
    } catch (error) {
      console.error("Error fetching maintenance tasks: ", error);
      message.error("Failed to fetch maintenance tasks. Please try again.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [companyId]);

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

  useEffect(() => {
    if (companyId) {
      fetchMaintenanceTasks();
    }
  }, [fetchMaintenanceTasks, companyId]);

  const handleAddTaskClick = () => {
    setDrawerVisible(true);
  };

  const handleNewOwnerRequest = () => {
    setIsOwnerRequestVisible(true);
  };

  const handleNewTenantRequest = () => {
    setNewTenantRequestDrawerVisible(true);
  };

  const handleNewWorkOrder = () => {
    setWorkOrderDrawerVisible(true);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setLoading(true);
    fetchMaintenanceTasks();
  };
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength)}...`;
  };
  const createSkeletonData = (count: number): MaintenanceData[] => {
    return Array.from({ length: count }, (_, index) => ({
      key: `skeleton-${index}`,
      taskRefId: '',
      subject: '',
      assignees: [],
      dueDate: '',
      relatedTo: '',
      relatedToName: '',
      status: '',
      priority: '',
      taskType: '',
    }));
  };
  const getDayOfWeek = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };

  const columns = [
    {
    title: 'Task',
    dataIndex: 'subject',
    key: 'subject',
    defaultSortOrder: 'ascend' as SortOrder,
    render: (text: string, record: MaintenanceData) => (
      loading ? (
        <Skeleton.Input style={{ width: '100%' }} active size="small" />
      ) : (
        <Space align="center" style={{ width: '100%' }}>
          <div style={{
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#d8e6d9',
            borderRadius: '4px',
            marginRight: '12px'
          }}>
            {React.cloneElement(getTaskTypeIcon(record.taskType), { 
              style: { fontSize: '24px', color: '#168033' } 
            })}
          </div>
          <Space direction="vertical" size={0} style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <Space>
                <Text strong style={{ color: 'Black', fontSize: '14px' }}>{record.taskType}</Text>
                {getPriorityTag(record.priority)}
              </Space>
              <div style={{
                backgroundColor: '#F0F2F5',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '12px',
                color: '#666',
                marginLeft: '20px'
              }}>
                #{record.taskRefId}
              </div>
            </div>
            <Tooltip title={text}>
              <Text>{truncateText(text, 30)}</Text>
            </Tooltip>
          </Space>
        </Space>
      )
    ),
  },
    {
      title: 'Assigned To',
      dataIndex: 'assignees',
      key: 'assignees',
      sorter: (a: MaintenanceData, b: MaintenanceData) => {
        const aNames = a.assignees.map(assignee => assignee.name).join(', ');
        const bNames = b.assignees.map(assignee => assignee.name).join(', ');
        return aNames.localeCompare(bNames);
      },
      render: (assignees: { uid: string; name: string }[]) => (
        loading ? <Skeleton.Input style={{ width: '100px' }} active size="small" /> 
        : assignees.map(assignee => assignee.name).join(', ')
      ),
    },
    {
      title: 'Due/ Frequency',
      dataIndex: 'dueDate',
      key: 'dueDate',
      sorter: (a: MaintenanceData, b: MaintenanceData) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
      },
      render: (text: string) => {
        if (loading) {
          return <Skeleton.Input style={{ width: '100px' }} active size="small" />;
        }
        if (!text) {
          return <Text>No Timeline</Text>;
        }
        return (
          <Space direction="vertical" size={0}>
            <Text>{text}</Text>
            <Text type="secondary">{getDayOfWeek(text)}</Text>
          </Space>
        );
      },
    },
    {
      title: 'Related To',
      dataIndex: 'relatedToName',
      key: 'relatedToName',
      sorter: (a: MaintenanceData, b: MaintenanceData) => a.relatedToName.localeCompare(b.relatedToName),
      render: (text: string) => (loading ? <Skeleton.Input style={{ width: '100px' }} active size="small" /> : text),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      sorter: (a: MaintenanceData, b: MaintenanceData) => a.status.localeCompare(b.status),
      render: (status: string) => (
        loading ? <Skeleton.Input style={{ width: '100px' }} active size="small" /> : getStatusTag(status)
      ),
    },
    {
      title: '',
      align: 'center' as 'center',
      key: 'arrow',
      render: () => (loading ? <Skeleton.Button style={{ width: '24px' }} active size="small" shape="circle" /> : <RightOutlined />),
    },
  ];

  const filteredTasks = maintenanceTasks.filter((task) =>
    task.subject.toLowerCase().includes(searchText.toLowerCase()) ||
    task.relatedToName.toLowerCase().includes(searchText.toLowerCase()) ||
    task.assignees.some(assignee => assignee.name.toLowerCase().includes(searchText.toLowerCase())) ||
    task.taskRefId.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleTaskClick = (task: MaintenanceData) => {
    navigate(`/maintenance/${task.key}`);
  };

  const addTaskMenu = (
    <Menu>
      <Menu.Item
        key="newTask"
        icon={<ProfileOutlined />}
        onClick={handleAddTaskClick}
      >
        New Task
      </Menu.Item>
      
      <Menu.Item
        key="newTenantRequest"
        icon={<UserOutlined />}
        onClick={handleNewTenantRequest}
      >
        New Tenant Request
      </Menu.Item>
      <Menu.Item
        key="newWorkOrder"
        icon={<ToolOutlined />}
        onClick={handleNewWorkOrder}
      >
        New Work Order
      </Menu.Item>
      <Menu.Item
        key="newOwnerRequest"
        icon={<UserOutlined />}
        onClick={handleNewOwnerRequest}
      >
        New Owner Request
      </Menu.Item>
    </Menu>
  );

  return (
    <div style={{ padding: '64px 36px' }}>
      <Title level={1} style={{ textAlign: 'left', marginTop: '0px', marginBottom: '20px' }}>
        Tasks & Maintenance
      </Title>
      <div className="property-page-container">
        <div className="search-and-add">
          <Input
            placeholder="Search Person or Task ID..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="search-input"
          />
          <Space>
            <Dropdown overlay={addTaskMenu} trigger={['click']}>
              <Button className="add-property-button">
                Add Task <DownOutlined />
              </Button>
            </Dropdown>
            <Button
              icon={<ReloadOutlined spin={isRefreshing} />}
              onClick={handleRefresh}
              disabled={isRefreshing}
            />
          </Space>
        </div>

        <Table
          columns={columns}
          size="middle"
          dataSource={loading ? createSkeletonData(10) : filteredTasks}
          pagination={{ pageSize: 10 }}
          onRow={(record: MaintenanceData) => ({
            onClick: () => handleTaskClick(record),
            style: { cursor: 'pointer' },
          })}
          className="maintenance-table"
        />
      </div>
      <NewTaskDrawer
        visible={drawerVisible}
        onClose={() => {
          setDrawerVisible(false);
          fetchMaintenanceTasks(); // Refresh the task list after adding a new task
        }}
        companyId={companyId || ''}
      />
      <NewWorkOrder
        visible={workOrderDrawerVisible}
        onClose={() => {
          setWorkOrderDrawerVisible(false);
          fetchMaintenanceTasks(); // Refresh the task list after adding a new work order
        }}
        companyId={companyId || ''}
      />
      <NewTenantRequest
        visible={workNewTenantRequestVisible}
        onClose={() => {
          setNewTenantRequestDrawerVisible(false);
          fetchMaintenanceTasks(); // Refresh the task list after adding a new work order
        }}
        companyId={companyId || ''}
      />
      <NewOwnerRequest
        visible={isOwnerRequestVisible}
        onClose={() => {
          setIsOwnerRequestVisible(false);
          fetchMaintenanceTasks(); // Refresh the task list after adding a new work order
        }}
        companyId={companyId || ''}
      />
    </div>
  );
};

export default MaintenancePage;