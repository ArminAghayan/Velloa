import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Typography, Row, Col, Table, Empty, Button, Tabs, Space, Dropdown, Menu, message, Skeleton, Divider } from 'antd';
import { EditOutlined, CheckCircleOutlined, ToolOutlined, LeftOutlined, MoreOutlined, CalendarOutlined, ClockCircleOutlined } from '@ant-design/icons';
import TaskNotesPage from './TaskNotesPage';
import TaskFilesPage from './TaskFilesPage';
import './TaskDetailsPage.css';
import { db, auth } from '../../firebase-config';
import { doc, getDoc, collection, getDocs, Timestamp, query, where } from 'firebase/firestore';
import { MaintenanceData } from './maintenancepage';  
import TaskUpdateDrawer from './Tasks/TaskUpdateDrawer';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

interface PartsAndLabor {
  id: string;
  quantity: number;
  account: string;
  description: string;
  unitPrice: number;
  total: number;
}

// Placeholder SubtasksContent component
const SubtasksContent: React.FC = () => {
  return (
    <div>
      <h3>Subtasks</h3>
      <p>Subtasks content will be implemented here.</p>
    </div>
  );
};

const getStatusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case 'in progress':
      return <ClockCircleOutlined />;
    case 'complete':
      return <CheckCircleOutlined />;
    default:
      return <EditOutlined />;
  }
};

const TaskDetailsPage: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const [task, setTask] = useState<MaintenanceData | null>(null);
  const [partsAndLabor, setPartsAndLabor] = useState<PartsAndLabor[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [updateDrawerVisible, setUpdateDrawerVisible] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

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

  const fetchTaskDetails = useCallback(async () => {
    if (!taskId || !companyId) return;

    try {
      setLoading(true);
      const taskDocRef = doc(db, 'maintenance', taskId);
      const taskDocSnap = await getDoc(taskDocRef);
      
      if (taskDocSnap.exists()) {
        const taskData = { ...(taskDocSnap.data() as MaintenanceData), key: taskDocSnap.id };
        setTask(taskData);
        
        // Fetch parts and labor subcollection
        const partsAndLaborCollectionRef = collection(db, 'maintenance', taskId, 'partsandlabor');
        const partsAndLaborSnapshot = await getDocs(partsAndLaborCollectionRef);
        
        const partsAndLaborData = partsAndLaborSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as PartsAndLabor[];
        
        setPartsAndLabor(partsAndLaborData);
      } else {
        message.error('Task not found.');
      }
    } catch (error) {
      console.error('Error fetching task details:', error);
      message.error('Failed to fetch task details.');
    } finally {
      setLoading(false);
    }
  }, [taskId, companyId]);

  useEffect(() => {
    fetchTaskDetails();
  }, [fetchTaskDetails, refreshKey]);

  const formatDate = (date: Timestamp | string | undefined) => {
    if (!date) return 'N/A';
    if (date instanceof Timestamp) {
      return date.toDate().toLocaleDateString();
    }
    return new Date(date).toLocaleDateString();
  };

  const formatDateTime = (date: Timestamp | string | undefined) => {
    if (!date) return 'N/A';
    if (date instanceof Timestamp) {
      return date.toDate().toLocaleString();
    }
    return new Date(date).toLocaleString();
  };

  const menu = (
    <Menu>
      <Menu.Item key="1" icon={<EditOutlined />}>
        Edit
      </Menu.Item>
      <Menu.Item key="2" icon={<CalendarOutlined />}>
        Reschedule
      </Menu.Item>
      <Menu.Item key="3" icon={<CheckCircleOutlined />}>
        Mark as Complete
      </Menu.Item>
    </Menu>
  );

  const handlePostUpdate = () => {
    setUpdateDrawerVisible(true);
  };

  const handleUpdateDrawerClose = () => {
    setUpdateDrawerVisible(false);
  };

  const handleUpdateSuccess = () => {
    setRefreshKey(prevKey => prevKey + 1);
  };

  if (loading) {
    return <Skeleton active />;
  }

  if (!task) {
    return <div>Task not found</div>;
  }

  return (
    <div className="task-details-page">
      <div className="task-details-top-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <Button
            icon={<LeftOutlined />}
            onClick={() => navigate(-1)}
          >
            Back
          </Button>
          <Dropdown overlay={menu} trigger={['click']}>
            <Button icon={<MoreOutlined />} />
          </Dropdown>
        </div>

        <div className='task-details-header'>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Title level={4} style={{ marginBottom: '4px' }}>{task.subject}</Title>
            <div style={{
              backgroundColor: '#f0f0f0',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '14px',
              color: '#666',
              display: 'inline-block'
            }}>
              #{task.taskRefId}
            </div>
          </Space>
        </div>
      </div>

      <div className="task-details-menu">
        <Tabs defaultActiveKey="overview" onChange={(key) => setActiveTab(key)}>
          <TabPane tab="Overview" key="overview" />
          <TabPane tab="Subtasks" key="subtasks" />
          <TabPane tab="Notes" key="notes" />
          <TabPane tab="Files" key="files" />
        </Tabs>
      </div>

      <div className='task-details-content'>
        {activeTab === 'overview' && (
          <>
            <Card 
              className='task-details-quick-actions-card card-padding-top' 
              size="small" 
              title="Quick Actions"
            >
              <div className='task-details-quick-actions-text-container'>
                <Text className='task-details-quick-actions-text'>What would you like to do next?</Text>
              </div>
              <Row gutter={16} style={{ marginTop: '10px' }}>
                <Col span={8}>
                  <Button 
                    type="primary" 
                    icon={<EditOutlined />} 
                    block
                    className="tall-button"
                    onClick={handlePostUpdate}
                  >
                    Post An Update
                  </Button>
                </Col>
                <Col span={8}>
                  <Button 
                    type="primary" 
                    icon={<CheckCircleOutlined />} 
                    block
                    className="tall-button"
                  >
                    Complete Task
                  </Button>
                </Col>
                <Col span={8}>
                  <Button 
                    type="primary" 
                    icon={<ToolOutlined />} 
                    block
                    className="tall-button"
                  >
                    New Work Order
                  </Button>
                </Col>
              </Row>
            </Card>
            
            <Row gutter={16}>
              <Col span={8}>
                <Card 
                  size="small" 
                  className="task-details-info-card card-padding-top"
                >
                  <div className="task-details-info-content">
                    <div className="icon">
                      <EditOutlined />
                    </div>
                    <div className="text">Created At</div>
                    <div className="date">{formatDate(task.createdAt)}</div>
                  </div>
                </Card>
              </Col>
              <Col span={8}>
                <Card 
                  size="small" 
                  className="task-details-info-card card-padding-top"
                >
                  <div className="task-details-info-content">
                    <div className="icon">
                      <CalendarOutlined />
                    </div>
                    <div className="text">Due Date</div>
                    <div className="date">{formatDateTime(task.dueDate)}</div>
                  </div>
                </Card>
              </Col>
              <Col span={8}>
                <Card 
                  size="small" 
                  className="task-details-info-card card-padding-top"
                >
                  <div className="task-details-info-content">
                    <div className="icon">
                      {getStatusIcon(task.status)}
                    </div>
                    <div className="text">Status</div>
                    <div className="date">{task.status}</div>
                  </div>
                </Card>
              </Col>
            </Row>

            <Card 
              className='task-details-description-card card-padding-top' 
              style={{ boxShadow: 'none' }} 
              size="small" 
              title="Description"
            >
              <div className="description-padding-top">
                <Text style={{ paddingLeft: "8px" }}>
                  {task.description || 'No description available.'}
                </Text>
                <Divider />
                <div style={{ paddingLeft: "8px", paddingBottom: '16px' }}>
                  <Row gutter={16} style={{ marginTop: '24px' }}>
                    <Col span={8}>
                      <Text strong>Vendor:</Text>
                      <br />
                      <Text>{task.vendor || 'N/A'}</Text>
                    </Col>
                    <Col span={8}>
                      <Text strong>Approved By Owner:</Text>
                      <br />
                      <Text>{task.approvedByOwner ? 'Yes' : 'No'}</Text>
                    </Col>
                    <Col span={8}>
                      <Text strong>Permission To Enter:</Text>
                      <br />
                      <Text>{task.permissionToEnter ? 'Yes' : 'No'}</Text>
                    </Col>
                  </Row>
                </div>
              </div>
            </Card>

            <Card 
              className='task-details-parts-labor-card card-padding-top' 
              style={{ marginTop: '24px', boxShadow: 'none' }} 
              size="small" 
              title="Parts And Labor"
            >
              <Table 
                columns={[
                  { title: 'Description', dataIndex: 'description' },
                  { title: 'Account', dataIndex: 'account' },
                  { title: 'Quantity', dataIndex: 'quantity' },
                  { 
                    title: 'Price', 
                    dataIndex: 'unitPrice',
                    render: (price: number) => `$${price.toFixed(2)}`
                  },
                  { 
                    title: 'Total', 
                    dataIndex: 'total',
                    render: (total: number) => `$${total.toFixed(2)}`
                  },
                ]}
                dataSource={partsAndLabor}
                pagination={false}
                className="parts-and-labor-table"
                size='small'
              />
            </Card>
          </>
        )}
        {activeTab === 'subtasks' && <SubtasksContent />}
        {activeTab === 'notes' && <TaskNotesPage taskId={taskId} />}
        {activeTab === 'files' && <TaskFilesPage taskId={taskId} />}
      </div>
      {companyId && (
        <TaskUpdateDrawer
          visible={updateDrawerVisible}
          onClose={handleUpdateDrawerClose}
          taskId={taskId}
          taskData={task}
          companyId={companyId}
          onUpdateSuccess={handleUpdateSuccess}
        />
      )}
    </div>
  );
};

export default TaskDetailsPage;