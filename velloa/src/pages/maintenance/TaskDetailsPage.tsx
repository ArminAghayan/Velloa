import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Typography, Row, Col, Table, Empty, Button, Tabs, Space, Dropdown, Menu, message, Skeleton } from 'antd';
import { EditOutlined, CheckCircleOutlined, ToolOutlined, LeftOutlined, MoreOutlined, CalendarOutlined } from '@ant-design/icons';
import TaskNotesPage from './TaskNotesPage';
import TaskFilesPage from './TaskFilesPage';
import './TaskDetailsPage.css';
import { db } from '../../firebase-config';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { MaintenanceData } from './maintenancepage';  

const { Title, Text } = Typography;
const { TabPane } = Tabs;

// Placeholder SubtasksContent component
const SubtasksContent: React.FC = () => {
  return (
    <div>
      <h3>Subtasks</h3>
      <p>Subtasks content will be implemented here.</p>
    </div>
  );
};

const TaskDetailsPage: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const [task, setTask] = useState<MaintenanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchTaskDetails = async () => {
      if (!taskId) {
        message.error("No task ID provided.");
        setLoading(false);
        return;
      }

      try {
        const taskDocRef = doc(db, 'maintenance', taskId);
        const taskDocSnap = await getDoc(taskDocRef);
        
        if (taskDocSnap.exists()) {
          setTask({ ...(taskDocSnap.data() as MaintenanceData), key: taskDocSnap.id });
        } else {
          message.error('Task not found.');
        }
      } catch (error) {
        console.error('Error fetching task details:', error);
        message.error('Failed to fetch task details.');
      } finally {
        setLoading(false);
      }
    };

    fetchTaskDetails();
  }, [taskId]);

  const formatDate = (date: Timestamp | string | undefined) => {
    if (!date) return 'N/A';
    if (date instanceof Timestamp) {
      return date.toDate().toLocaleDateString();
    }
    return new Date(date).toLocaleDateString();
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

  if (loading) {
    return <Skeleton active />;
  }

  if (!task) {
    return <div>Task not found</div>;
  }

  return (
    <div className="task-details-page">
      <div className="task-details-top-container">
        <div className="task-details-back-button">
          <Button 
            icon={<LeftOutlined />} 
            onClick={() => navigate('/maintenance')}
          >
            Back
          </Button>
        </div>

        <div className='task-details-header'>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Title level={4}>{task.subject} #{task.key}</Title>
              <Dropdown overlay={menu} trigger={['click']}>
                <Button icon={<MoreOutlined />} />
              </Dropdown>
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
            <Card className='task-details-quick-actions-card'>
              <Title level={5}>Quick Actions</Title>
              <Text>What would you like to do next?</Text>
              <Row gutter={16} style={{ marginTop: '10px' }}>
                <Col span={8}>
                  <Button 
                    type="primary" 
                    icon={<EditOutlined />} 
                    block
                  >
                    Post An Update
                  </Button>
                </Col>
                <Col span={8}>
                  <Button 
                    type="primary" 
                    icon={<CheckCircleOutlined />} 
                    block
                  >
                    Complete Task
                  </Button>
                </Col>
                <Col span={8}>
                  <Button 
                    type="primary" 
                    icon={<ToolOutlined />} 
                    block
                  >
                    New Work Order
                  </Button>
                </Col>
              </Row>
            </Card>
            
            <Row gutter={16}>
              <Col span={8}>
                <Card>
                  <Text>Created At</Text>
                  <br />
                  <Text strong>{formatDate(task.createdAt)}</Text>
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Text>Due Date</Text>
                  <br />
                  <Text strong>{formatDate(task.dueDate)}</Text>
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Text>Status</Text>
                  <br />
                  <Text strong>{task.status}</Text>
                </Card>
              </Col>
            </Row>

            <Card style={{ marginTop: '16px' }}>
              <Title level={5}>Description</Title>
              <Text>{task.description || 'No description available.'}</Text>
              <Row gutter={16} style={{ marginTop: '16px' }}>
                <Col span={8}>
                  <Text>Vendor: {task.vendor || 'N/A'}</Text>
                </Col>
                <Col span={8}>
                  <Text>Approved By Owner: {task.approvedByOwner ? 'Yes' : 'No'}</Text>
                </Col>
                <Col span={8}>
                  <Text>Permission To Enter: {task.permissionToEnter ? 'Yes' : 'No'}</Text>
                </Col>
              </Row>
            </Card>

            <Card style={{ marginTop: '16px' }}>
              <Title level={5}>Parts And Labor</Title>
              <Table 
                columns={[
                  { title: 'Quantity', dataIndex: 'quantity' },
                  { title: 'Account', dataIndex: 'account' },
                  { title: 'Description', dataIndex: 'description' },
                  { title: 'Price', dataIndex: 'price' },
                  { title: 'Total', dataIndex: 'total' },
                ]}
                dataSource={task.partsAndLabor || []}
                pagination={false}
              />
            </Card>
          </>
        )}
        {activeTab === 'subtasks' && <SubtasksContent />}
        {activeTab === 'notes' && <TaskNotesPage />}
        {activeTab === 'files' && <TaskFilesPage taskId={taskId} />}
      </div>
    </div>
  );
};

export default TaskDetailsPage;