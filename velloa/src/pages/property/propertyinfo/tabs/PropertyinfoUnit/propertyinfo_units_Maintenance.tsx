import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Space, message, Input, Tag, Tooltip, Typography, Skeleton, Dropdown, MenuProps } from 'antd';
import { ReloadOutlined, RightOutlined, ClockCircleOutlined, CheckCircleOutlined, ProfileOutlined, UserOutlined, ToolOutlined, DownOutlined } from '@ant-design/icons';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db, auth } from '../../../../../firebase-config';
import { useNavigate } from 'react-router-dom';
import './propertyinfo_units_Maintenance.css';
const { Text } = Typography;

interface TasksTabProps {
  personId: string | undefined;
  companyId: string | null;
  unitId: string;
}

interface MaintenanceData {
  key: string;
  taskRefId: string;
  subject: string;
  assignees: { uid: string; name: string }[];
  dueDate: string;
  relatedTo: string;
  status: string;
  priority: string;
  taskType: string;
  companyId: string;
}

interface Assignee {
  uid: string;
  name: string;
}

const PropertyinfoUnitMaintenance: React.FC<TasksTabProps> = ({ personId, companyId: propCompanyId, unitId }) => {

  const [tasks, setTasks] = useState<MaintenanceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTaskDrawerVisible, setNewTaskDrawerVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [taskTypeFilter, setTaskTypeFilter] = useState<string>('All');
  const [loadingAssignees, setLoadingAssignees] = useState<boolean>(false);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const navigate = useNavigate();
  const [workOrderDrawerVisible, setWorkOrderDrawerVisible] = useState(false);
  const [ownerRequestDrawerVisible, setOwnerRequestDrawerVisible] = useState(false);
  const [assignees, setAssignees] = useState<Assignee[]>([]);

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
      return companiesSnapshot.docs[0].id;
    } catch (error) {
      console.error("Error fetching company ID:", error);
      return null;
    }
  }, []);

  const fetchAssignees = async () => {
    if (!companyId) return;
    
    setLoadingAssignees(true);
    try {
      const usersQuery = query(
        collection(db, 'users'),
        where('companyuid', '==', companyId)
      );
      const usersSnapshot = await getDocs(usersQuery);

      const assigneeData: Assignee[] = usersSnapshot.docs.map(doc => {
        const userData = doc.data();
        return {
          uid: doc.id,
          name: `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'Unknown User',
        };
      });

      setAssignees(assigneeData);
    } catch (error) {
      console.error('Error fetching assignees:', error);
      message.error('Failed to fetch assignees');
    } finally {
      setLoadingAssignees(false);
    }
  };

  const fetchTasks = useCallback(async () => {
    if (!companyId || !unitId) return;
    
    try {
      setLoading(true);
      const tasksQuery = query(
        collection(db, 'maintenance'),
        where('companyId', '==', companyId),
        where('relatedUnit', '==', unitId)
      );
      const querySnapshot = await getDocs(tasksQuery);

      const assigneeMap: Record<string, string> = {};
      assignees.forEach(assignee => {
        assigneeMap[assignee.uid] = assignee.name;
      });

      const tasksData: MaintenanceData[] = querySnapshot.docs.map(doc => {
        const data = doc.data();
        const taskAssignees = Array.isArray(data.assignees) 
          ? data.assignees.map((assignee: any) => ({
              uid: assignee.uid || '',
              name: assigneeMap[assignee.uid] || 'Unknown',
            }))
          : [];

        return {
          key: doc.id,
          subject: data.subject || '',
          taskRefId: data.taskRefId || '',
          assignees: taskAssignees,
          dueDate: data.dueDate instanceof Timestamp 
            ? data.dueDate.toDate().toLocaleDateString() 
            : '',
          relatedTo: data.relatedTo || '',
          status: data.status || '',
          priority: data.priority || 'Low',
          taskType: data.taskType || 'Task',
          companyId: data.companyId || '',
        };
      });

      setTasks(tasksData);
    } catch (error) {
      console.error("Error fetching tasks: ", error);
      message.error("Failed to fetch maintenance tasks. Please try again.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [companyId, unitId, assignees]);

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
      fetchAssignees();
    }
  }, [companyId]);

  useEffect(() => {
    if (companyId && assignees.length > 0 && unitId) {
      fetchTasks();
    }
  }, [fetchTasks, companyId, assignees, unitId]);

  const getStatusTag = (status: string) => {
    const trimmedStatus = status.trim().toLowerCase();
    
    if (trimmedStatus === 'not started') {
      return <Tag icon={<ClockCircleOutlined />} color="default">Not Started</Tag>;
    } else if (trimmedStatus === 'in progress') {
      return <Tag icon={<ClockCircleOutlined />} color="warning">In Progress</Tag>;
    } else if (trimmedStatus === 'finished' || trimmedStatus === 'completed') {
      return <Tag icon={<CheckCircleOutlined />} color="success">Finished</Tag>;
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
      case 'task': return <ProfileOutlined />;
      case 'owner request': return <UserOutlined />;
      case 'tenant request': return <UserOutlined />;
      case 'work order': return <ToolOutlined />;
      default: return <ProfileOutlined />;
    }
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
      status: '',
      priority: '',
      taskType: '',
      companyId: '',
    }));
  };

  const getDayOfWeek = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };

  const handleTaskTypeFilter = (value: string) => {
    setTaskTypeFilter(value);
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = (task.subject?.toLowerCase() || '').includes(searchText.toLowerCase()) ||
      (task.taskRefId?.toLowerCase() || '').includes(searchText.toLowerCase()) ||
      task.assignees?.some((assignee: Assignee) => (assignee.name?.toLowerCase() || '').includes(searchText.toLowerCase())) || false;

    const matchesTaskType = taskTypeFilter === 'All' || (task.taskType?.toLowerCase() || '') === taskTypeFilter.toLowerCase();

    return matchesSearch && matchesTaskType;
  });

  const columns = [
    {
      title: 'Task',
      dataIndex: 'subject',
      key: 'subject',
      render: (text: string, record: MaintenanceData) => (
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
                backgroundColor: '#f0f0f0',
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
      ),
    },
    {
      title: 'Assigned To',
      dataIndex: 'assignees',
      key: 'assignees',
      render: (assignees: Assignee[]) => 
        assignees?.map((assignee: Assignee) => assignee.name).join(', ') || '',
    },
    {
      title: 'Due Date',
      dataIndex: 'dueDate',
      key: 'dueDate',
      render: (text: string) => (
        <Space direction="vertical" size={0}>
          <Text>{text}</Text>
          <Text type="secondary">{getDayOfWeek(text)}</Text>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '',
      key: 'action',
      render: () => <RightOutlined />,
    },
  ];

  const handleTaskClick = (task: MaintenanceData) => {
    navigate(`/maintenance/${task.key}`);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchTasks();
  };

  const handleAddWorkOrder = () => {
    if (propCompanyId && personId) {
      setWorkOrderDrawerVisible(true);
    } else {
      message.error('Company ID and Person ID are required to add a new work order');
    }
  };

  const handleAddTask = () => {
    if (propCompanyId && personId) {
      setNewTaskDrawerVisible(true);
    } else {
      message.error('Company ID and Person ID are required to add a new task');
    }
  };

  const handleAddOwnerRequest = () => {
    if (propCompanyId && personId) {
      setOwnerRequestDrawerVisible(true);
    } else {
      message.error('Company ID and Person ID are required to add a new owner request');
    }
  };

  const items: MenuProps['items'] = [
    {
      key: 'task',
      label: 'Task',
      icon: <ProfileOutlined />,
      onClick: () => handleAddTask(),
    },
  ];

  return (
    <div className="property-page-container">
      <div className="search-and-add">
        <Input
          placeholder="Search user or task ID"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="search-input"
        />
        <Space>
          <Dropdown 
            menu={{ items }} 
            placement="bottomRight"
            trigger={['click']}
          >
            <Button className="add-task-button">
              Add New <DownOutlined />
            </Button>
          </Dropdown>
          <Button
            icon={<ReloadOutlined spin={isRefreshing} />}
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="refresh-button"
            style={{width: '40px'}}
          />
        </Space>
      </div>

      {loading ? (
        <Table
          columns={columns}
          dataSource={createSkeletonData(3)} // Show 3 skeleton rows
          rowKey="key"
          components={{
            body: {
              cell: () => (
                <td style={{ padding: '16px' }}>
                  <Skeleton.Input active size="small" style={{ width: '100%' }} />
                </td>
              ),
            },
          }}
          pagination={false}
        />
      ) : (
        <Table
          columns={columns}
          dataSource={filteredTasks}
          rowKey="key"
          onRow={(record) => ({
            onClick: () => handleTaskClick(record),
            style: { cursor: 'pointer' },
          })}
          locale={{
            emptyText: 'No tasks found',
          }}
        />
      )}
    </div>
  );
};

export default PropertyinfoUnitMaintenance;
