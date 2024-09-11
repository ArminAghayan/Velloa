import React, { useState, useEffect, useCallback } from 'react';
import { Typography, Table, Space, Input, Skeleton, Button, message } from 'antd';
import { RightOutlined, PlusOutlined, ReloadOutlined, UserOutlined, FileTextOutlined } from '@ant-design/icons';
import { SortOrder } from 'antd/lib/table/interface';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase-config';
import { collection, getDocs } from 'firebase/firestore';
import './maintenancepage.css';

const { Title } = Typography;

interface MaintenanceData {
  key: string;
  task: string;
  assignedTo: string;
  dueAt: string;
  relatedTo: string;
  status: string;
}

const MaintenancePage: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [maintenanceTasks, setMaintenanceTasks] = useState<MaintenanceData[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleAddTaskClick = () => {
    navigate('/addnewtask');
  };

  const fetchMaintenanceTasks = useCallback(async () => {
    try {
      setLoading(true);
      const tasksQuery = collection(db, 'maintenanceTasks');
      const querySnapshot = await getDocs(tasksQuery);

      const tasksData: MaintenanceData[] = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          key: doc.id,
          task: data.task || '',
          assignedTo: data.assignedTo || '',
          dueAt: data.dueAt || '',
          relatedTo: data.relatedTo || '',
          status: data.status || '',
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
  }, []);

  useEffect(() => {
    fetchMaintenanceTasks();
  }, [fetchMaintenanceTasks]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchMaintenanceTasks();
  };

  const createSkeletonData = (count: number): MaintenanceData[] => {
    return Array.from({ length: count }, (_, index) => ({
      key: `skeleton-${index}`,
      task: '',
      assignedTo: '',
      dueAt: '',
      relatedTo: '',
      status: '',
    }));
  };

  const columns = [
    {
      title: 'Task',
      dataIndex: 'task',
      key: 'task',
      defaultSortOrder: 'ascend' as SortOrder,
      sorter: (a: MaintenanceData, b: MaintenanceData) => a.task.localeCompare(b.task),
      render: (text: MaintenanceData['task']) => (loading ? <Skeleton.Input style={{ width: '100px' }} active size="small" /> : text),
    },
    {
      title: 'Assigned To',
      dataIndex: 'assignedTo',
      key: 'assignedTo',
      sorter: (a: MaintenanceData, b: MaintenanceData) => a.assignedTo.localeCompare(b.assignedTo),
      render: (text: MaintenanceData['assignedTo']) => (loading ? <Skeleton.Input style={{ width: '100px' }} active size="small" /> : text),
    },
    {
      title: 'Due At',
      dataIndex: 'dueAt',
      key: 'dueAt',
      sorter: (a: MaintenanceData, b: MaintenanceData) => a.dueAt.localeCompare(b.dueAt),
      render: (text: MaintenanceData['dueAt']) => (loading ? <Skeleton.Input style={{ width: '100px' }} active size="small" /> : text),
    },
    {
      title: 'Related To',
      dataIndex: 'relatedTo',
      key: 'relatedTo',
      sorter: (a: MaintenanceData, b: MaintenanceData) => a.relatedTo.localeCompare(b.relatedTo),
      render: (text: MaintenanceData['relatedTo']) => (loading ? <Skeleton.Input style={{ width: '100px' }} active size="small" /> : text),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      sorter: (a: MaintenanceData, b: MaintenanceData) => a.status.localeCompare(b.status),
      render: (text: MaintenanceData['status']) => (loading ? <Skeleton.Input style={{ width: '100px' }} active size="small" /> : text),
    },
    {
      title: '',
      align: 'center' as 'center',
      key: 'arrow',
      render: () => (loading ? <Skeleton.Button style={{ width: '24px' }} active size="small" shape="circle" /> : <RightOutlined />),
    },
  ];

  const filteredTasks = maintenanceTasks.filter((task) =>
    task.task.toLowerCase().includes(searchText.toLowerCase()) ||
    task.relatedTo.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleTaskClick = (task: MaintenanceData) => {
    navigate('/taskinfo/', { state: { task } });
  };

  return (
    <div style={{ padding: '64px 36px' }}>
      <Title level={1} style={{ textAlign: 'left', marginTop: '0px', marginBottom: '20px' }}>
        Maintenance
      </Title>
      <div className="property-page-container">
        <div className="search-and-add">
          <Input
            placeholder="Search tasks"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="search-input"
          />
          <Space>
          <Button type="default" icon={<PlusOutlined />} className="add-property-button">
              Add Task
            </Button>
            <Button type="default" icon={<UserOutlined />} className="add-property-button">
              New Owner Request
            </Button>
            <Button type="default" icon={<UserOutlined />} className="add-property-button">
              New Tenant Request
            </Button>
            <Button type="default" icon={<FileTextOutlined />} className="add-property-button">
              New Work Order
            </Button>
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
          className="custom-table"
        />
      </div>
    </div>
  );
};

export default MaintenancePage;
