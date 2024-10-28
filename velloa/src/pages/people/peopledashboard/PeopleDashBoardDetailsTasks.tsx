import React, { useState, useEffect } from 'react';
import { Table, Button, Space, message, Input, Tag, Tooltip, Typography, Skeleton, Dropdown, MenuProps } from 'antd';
import { PlusOutlined, ReloadOutlined, RightOutlined, ClockCircleOutlined, CheckCircleOutlined, ProfileOutlined, UserOutlined, ToolOutlined, DownOutlined } from '@ant-design/icons';
import { collection, query, where, getDocs, Timestamp, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { db } from '../../../firebase-config';
import { useNavigate } from 'react-router-dom';
import NewTaskDrawer from '../../maintenance/Tasks/NewTaskDrawer';
import PeopleWorkOrder from '../../maintenance/Tasks/PeopleWorkOrder';  
import OwnerRequestDrawer from '../../maintenance/Tasks/PeopleOwnerRequest';  // Add this import
import './PeopleDashBoardDetailsTasks.css';
const { Text } = Typography;

interface TasksTabProps {
  personId: string | undefined;
  companyId: string | null;
  isVendor?: boolean;
  peopleType?: string | null;  // Add this line
}

interface Assignee {
  uid: string;
  name: string;
}

interface Task {
  key: string;
  taskRefId: string;
  title: string;
  description: string;
  status: string;
  dueDate: string;
  assignees: { uid: string; name: string }[];
  priority: string;
  taskType: string;
  subTaskType: string; // Add this line
}

const TasksTab: React.FC<TasksTabProps> = ({ personId, companyId, isVendor, peopleType }) => {
  console.log('peopleType:', peopleType); // Debug line
  console.log('isVendor:', isVendor); // Debug line

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTaskDrawerVisible, setNewTaskDrawerVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [taskTypeFilter, setTaskTypeFilter] = useState<string>('All');
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [loadingAssignees, setLoadingAssignees] = useState<boolean>(false);
  const navigate = useNavigate();
  const [workOrderDrawerVisible, setWorkOrderDrawerVisible] = useState(false);
  const [ownerRequestDrawerVisible, setOwnerRequestDrawerVisible] = useState(false);

  const fetchAssignees = async () => {
    if (!companyId) return;
    
    setLoadingAssignees(true);
    try {
      const usersQuery = query(
        collection(db, 'users'),
        where('companyuid', '==', companyId),
        
      );
      const usersSnapshot = await getDocs(usersQuery);

      if (usersSnapshot.empty) {
        message.warning('No users found for this company.');
        setAssignees([]);
        return;
      }

      const assigneeData: Assignee[] = usersSnapshot.docs.map(
        (doc: QueryDocumentSnapshot<DocumentData>) => {
          const userData = doc.data();
          const name = `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'Unknown User';
          return {
            uid: doc.id,
            name,
          };
        }
      );

      setAssignees(assigneeData);
    } catch (error) {
      console.error('Error fetching assignees:', error);
      if (error instanceof Error) {
        message.error(`Failed to fetch assignees: ${error.message}`);
      } else {
        message.error('Failed to fetch assignees due to an unknown error.');
      }
    } finally {
      setLoadingAssignees(false);
    }
  };

  const fetchTasks = async () => {
    if (!personId || !companyId) return;

    setLoading(true);
    try {
      // Create query based on whether the person is a vendor or owner
      const tasksQuery = query(
        collection(db, 'maintenance'),
        where('companyId', '==', companyId),
        where(peopleType?.toLowerCase() === 'vendor' ? 'vendor' : 'owner', '==', personId)  // Changed 'relatedTo' to 'owner'
      );

      const tasksSnapshot = await getDocs(tasksQuery);

      const assigneeMap: Record<string, string> = {};
      assignees.forEach(assignee => {
        assigneeMap[assignee.uid] = assignee.name;
      });

      const tasksData = tasksSnapshot.docs.map(doc => {
        const data = doc.data();
        const taskAssignees: { uid: string; name: string }[] = Array.isArray(data.assignees) 
          ? data.assignees.map((assignee: any) => ({
              uid: assignee.uid || '',
              name: assigneeMap[assignee.uid] || 'Unknown',
            }))
          : [];
        return {
          key: doc.id,
          taskRefId: data.taskRefId || '',
          title: data.title || '',
          description: data.description || '',
          status: data.status || '',
          dueDate: data.dueDate instanceof Timestamp 
            ? data.dueDate.toDate().toLocaleDateString() 
            : '',
          assignees: taskAssignees,
          priority: data.priority || '',
          taskType: data.taskType || '',
          subTaskType: data.subTaskType || '',
        } as Task;
      });
      setTasks(tasksData);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      if (error instanceof Error) {
        message.error(`Failed to fetch tasks: ${error.message}`);
      } else {
        message.error('Failed to fetch tasks: Unknown error');
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (companyId) {
      fetchAssignees();
    }
  }, [companyId]);

  useEffect(() => {
    if (personId && companyId && assignees.length > 0) {
      fetchTasks();
    } else {
      setLoading(false);
    }
  }, [personId, companyId, assignees]);

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

  const createSkeletonData = (count: number): Task[] => {
    return Array.from({ length: count }, (_, index) => ({
      key: `skeleton-${index}`,
      taskRefId: '',
      title: '',
      description: '',
      status: '',
      dueDate: '',
      assignees: [],
      priority: '',
      taskType: '',
      subTaskType: '',
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
    const matchesSearch = (task.title?.toLowerCase() || '').includes(searchText.toLowerCase()) ||
      (task.taskRefId?.toLowerCase() || '').includes(searchText.toLowerCase()) ||
      task.assignees?.some(assignee => (assignee.name?.toLowerCase() || '').includes(searchText.toLowerCase())) || false;

    const matchesTaskType = taskTypeFilter === 'All' || (task.taskType?.toLowerCase() || '') === taskTypeFilter.toLowerCase();

    return matchesSearch && matchesTaskType;
  });

  const columns = [
    {
      title: 'Task',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: Task) => (
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
      render: (assignees: { uid: string; name: string }[]) => 
        assignees.map(assignee => assignee.name).join(', '),
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

  const handleTaskClick = (task: Task) => {
    navigate(`/maintenance/${task.key}`);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchTasks();
  };

  const handleAddWorkOrder = () => {
    if (companyId && personId) {
      setWorkOrderDrawerVisible(true);
    } else {
      message.error('Company ID and Person ID are required to add a new work order');
    }
  };

  const handleAddTask = () => {
    if (companyId && personId) {
      setNewTaskDrawerVisible(true);
    } else {
      message.error('Company ID and Person ID are required to add a new task');
    }
  };

  const handleAddOwnerRequest = () => {
    if (companyId && personId) {
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
    ...(peopleType?.toLowerCase() === 'vendor' ? [{
      key: 'workOrder',
      label: 'Work Order',
      icon: <ToolOutlined />,
      onClick: () => handleAddWorkOrder(),
    }] : []),
    ...(peopleType?.toLowerCase() === 'owner' ? [{
      key: 'ownerRequest',
      label: 'Owner Request',
      icon: <UserOutlined />,
      onClick: () => handleAddOwnerRequest(),
    }] : []),
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
      {companyId && personId && (
        <>
          <NewTaskDrawer
            visible={newTaskDrawerVisible}
            onClose={() => setNewTaskDrawerVisible(false)}
            companyId={companyId}
          />
          <PeopleWorkOrder
            visible={workOrderDrawerVisible}
            onClose={() => setWorkOrderDrawerVisible(false)}
            companyId={companyId}
            personId={personId}
          />
          <OwnerRequestDrawer
            visible={ownerRequestDrawerVisible}
            onClose={() => setOwnerRequestDrawerVisible(false)}
            companyId={companyId}
            personId={personId}
          />
        </>
      )}
    </div>
  );
};

export default TasksTab;
