// TaskDetailsPage.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Card,
  Typography,
  Row,
  Col,
  Table,
  Button,
  Tabs,
  Space,
  Dropdown,
  Menu,
  Skeleton,
  Divider,
  Modal,
  Input,
  InputNumber,
  message,
} from 'antd';
import {
  EditOutlined,
  CheckCircleOutlined,
  ToolOutlined,
  LeftOutlined,
  MoreOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  PlusOutlined,
  BellOutlined,
} from '@ant-design/icons';
import TaskNotesPage from './TaskNotesPage';
import TaskFilesPage from './TaskFilesPage';
import './TaskDetailsPage.css';
import { db, auth } from '../../firebase-config';
import {
  doc,
  getDoc,
  collection,
  getDocs,
  Timestamp,
  query,
  where,
  updateDoc,
  deleteDoc,
  writeBatch,
  QueryDocumentSnapshot,
  DocumentData,
} from 'firebase/firestore';
import TaskUpdateDrawer from './Tasks/update/TaskUpdateDrawer';
import { AnimatePresence } from 'framer-motion';
import CompletionScreen from '../../components/CompletionScreen';
import TaskSubtasksPage from './TaskSubtasksPage';
import SubWorkOrderDrawer from './Tasks/update/TaskSubWorkOrderDrawer';
import TaskEditDrawer from './Tasks/update/TaskEditDrawer';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

interface Assignee {
  uid: string;
  name: string;
}

interface PartsAndLabor {
  id: string;
  description: string;
  quantity: number;
  total: number;
  unitPrice: number;
  account?: string;
}

// **Updated Interface: Including 'name' in assignees**
export interface MaintenanceData {
  key: string;
  taskRefId: string;
  subject: string;
  assignees: { uid: string; name: string }[]; // Added 'name'
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
  permitEntering?: boolean;
  entryNotes?: string;
  companyId: string;
  decision?: string;
  subjectVendor?: string;
};

const getStatusIcon = (status: string | undefined) => {
  if (!status) return <EditOutlined />; // Default icon if status is undefined

  switch (status.toLowerCase()) {
    case 'in progress':
      return <ClockCircleOutlined />;
    case 'completed':
      return <CheckCircleOutlined />;
    default:
      return <EditOutlined />;
  }
};

const getPriorityStyle = (priority: string) => {
  let backgroundColor;
  let textColor = '#fff';

  switch (priority.toLowerCase()) {
    case 'high':
      backgroundColor = '#f5222d';
      break;
    case 'medium':
      backgroundColor = '#faad14';
      textColor = '#000';
      break;
    case 'low':
      backgroundColor = '#52c41a';
      break;
    default:
      backgroundColor = '#d9d9d9';
      textColor = '#000';
  }

  return {
    backgroundColor,
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '14px',
    color: textColor,
    display: 'inline-block',
  };
};

const TaskDetailsPage: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const [task, setTask] = useState<MaintenanceData | null>(null);
  const [partsAndLabor, setPartsAndLabor] = useState<PartsAndLabor[]>([]);
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAssignees, setLoadingAssignees] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [updateDrawerVisible, setUpdateDrawerVisible] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [showCompletionScreen, setShowCompletionScreen] = useState(false);
  const [subWorkOrderDrawerVisible, setSubWorkOrderDrawerVisible] = useState(false);
  const [editingSubWorkOrder, setEditingSubWorkOrder] = useState<any | null>(null);
  const [editDrawerVisible, setEditDrawerVisible] = useState(false);
  const [isEditingPartsLabor, setIsEditingPartsLabor] = useState(false);
  const [editablePartsLabor, setEditablePartsLabor] = useState<PartsAndLabor[]>([]);

  const truncateString = (str: string, num: number) => {
    if (str.length <= num) {
      return str;
    }
    return str.slice(0, num) + '...';
  };

  /**
   * **fetchAssignees Function**
   * Fetches all assignees associated with the current company.
   */
  const fetchAssignees = useCallback(async (): Promise<Assignee[]> => {
    if (!companyId) return [];

    setLoadingAssignees(true);
    try {
      const usersQuery = query(
        collection(db, 'users'),
        where('companyuid', '==', companyId)
      );
      const usersSnapshot = await getDocs(usersQuery);

      if (usersSnapshot.empty) {
        message.warning('No users found for this company.');
        setAssignees([]);
        return [];
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
      return assigneeData;
    } catch (error) {
      console.error('Error fetching assignees:', error);
      if (error instanceof Error) {
        message.error(`Failed to fetch assignees: ${error.message}`);
      } else {
        message.error('Failed to fetch assignees due to an unknown error.');
      }
      return [];
    } finally {
      setLoadingAssignees(false);
    }
  }, [companyId]);

  /**
   * **fetchCompanyId Function**
   * Fetches the company ID based on the authenticated user.
   */
  const fetchCompanyId = useCallback(async () => {
    if (!auth.currentUser) {
      console.error('No authenticated user');
      return null;
    }
    try {
      const companiesQuery = query(
        collection(db, 'companies'),
        where(`members.${auth.currentUser.uid}`, '!=', null)
      );
      const companiesSnapshot = await getDocs(companiesQuery);
      if (companiesSnapshot.empty) {
        console.error('User is not a member of any company');
        return null;
      }
      return companiesSnapshot.docs[0].id;
    } catch (error) {
      console.error('Error fetching company ID:', error);
      return null;
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const fetchedCompanyId = await fetchCompanyId();
      if (fetchedCompanyId) {
        setCompanyId(fetchedCompanyId);
      } else {
        message.error('Failed to fetch company information.');
        // Optionally, navigate away or handle the error appropriately
      }
    };
    init();
  }, [fetchCompanyId]);

  /**
   * **fetchPartsAndLabor Function**
   * Fetches parts and labor data associated with the task.
   */
  const fetchPartsAndLabor = useCallback(async () => {
    if (!taskId || !companyId) {
      console.log('Missing taskId or companyId:', { taskId, companyId });
      return;
    }

    try {
      setLoading(true);
      console.log('Fetching parts and labor for taskId:', taskId);

      const partsAndLaborCollectionRef = collection(db, 'maintenance', taskId, 'partsandlabor');
      const partsAndLaborSnapshot = await getDocs(partsAndLaborCollectionRef);

      const partsAndLaborData = partsAndLaborSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as PartsAndLabor[];

      console.log('Fetched parts and labor data:', partsAndLaborData);

      setPartsAndLabor(partsAndLaborData);
    } catch (error) {
      console.error('Error fetching parts and labor:', error);
      message.error('Failed to fetch parts and labor data.');
    } finally {
      setLoading(false);
    }
  }, [taskId, companyId]);

  /**
   * **fetchTaskDetails Function**
   * Fetches the task details and maps the assignees with their names.
   */
  const fetchTaskDetails = useCallback(async () => {
    if (!taskId || !companyId) {
      console.log('Missing taskId or companyId:', { taskId, companyId });
      return;
    }

    try {
      setLoading(true);
      console.log('Fetching task details for taskId:', taskId, 'and companyId:', companyId);

      if (!auth.currentUser) {
        throw new Error('User is not authenticated');
      }

      const companyDoc = await getDoc(doc(db, 'companies', companyId));
      if (!companyDoc.exists()) {
        throw new Error('Company does not exist');
      }
      const companyData = companyDoc.data();
      if (!companyData.members || !companyData.members[auth.currentUser.uid]) {
        throw new Error('User is not a member of the company');
      }

      const taskDocRef = doc(db, 'maintenance', taskId);
      const taskDocSnap = await getDoc(taskDocRef);

      if (!taskDocSnap.exists()) {
        throw new Error('Task document does not exist');
      }

      const taskData = taskDocSnap.data() as MaintenanceData;

      // **Fetch all assignees for the company**
      const allAssignees = await fetchAssignees();

      // **Map task assignees with fetched assignees to include names**
      const taskAssignees: Assignee[] = taskData.assignees.map(assigneeId => {
        const assignee = allAssignees.find(a => a.uid === assigneeId.uid);
        return assignee ? assignee : { uid: assigneeId.uid, name: 'Unknown User' };
      });

      const fullTaskData = {
        ...taskData,
        key: taskDocSnap.id,
        assignees: taskAssignees,
      };

      setTask(fullTaskData);
      console.log('Task data fetched successfully:', fullTaskData);

      if (fullTaskData.companyId !== companyId) {
        throw new Error('Task companyId does not match the current companyId');
      }

      // Fetch parts and labor separately
      await fetchPartsAndLabor();
    } catch (error) {
      console.error('Error fetching task details:', error);
      if (error instanceof Error) {
        message.error(`Failed to fetch task details: ${error.message}`);
      } else {
        message.error('Failed to fetch task details due to an unknown error.');
      }
      // Optionally, set an error state or handle the error appropriately
    } finally {
      setLoading(false);
    }
  }, [taskId, companyId, fetchPartsAndLabor, fetchAssignees]);

  useEffect(() => {
    if (companyId) {
      fetchTaskDetails();
    }
  }, [fetchTaskDetails, companyId]);

  useEffect(() => {
    if (isEditingPartsLabor) {
      setEditablePartsLabor([...partsAndLabor]);
    }
  }, [isEditingPartsLabor, partsAndLabor]);

  const handleToggleEditPartsLabor = () => {
    if (isEditingPartsLabor) {
      handleCancelPartsLabor();
    } else {
      setIsEditingPartsLabor(true);
    }
  };

  const handleSavePartsLabor = async () => {
    if (!taskId || !companyId) {
      console.error('Task ID or Company ID is missing.');
      message.error('Cannot save parts and labor without Task ID and Company ID.');
      return;
    }

    try {
      setLoading(true);
      const partsAndLaborRef = collection(db, 'maintenance', taskId, 'partsandlabor');

      // Batch operation for updating parts and labor
      const batch = writeBatch(db);
      editablePartsLabor.forEach(item => {
        // Determine if it's a new item or existing
        const docRef = item.id.startsWith('temp-') ? doc(collection(db, 'maintenance', taskId, 'partsandlabor')) : doc(partsAndLaborRef, item.id);
        batch.set(docRef, {
          description: item.description,
          account: item.account || '',
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.quantity * item.unitPrice,
        }, { merge: true });
      });

      await batch.commit();

      message.success('Parts and Labor updated successfully');
      setIsEditingPartsLabor(false);

      await fetchPartsAndLabor();
    } catch (error) {
      console.error('Error updating parts and labor:', error);
      if (error instanceof Error) {
        message.error(`Failed to update parts and labor: ${error.message}`);
      } else {
        message.error('Failed to update parts and labor due to an unknown error.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelPartsLabor = () => {
    setIsEditingPartsLabor(false);
    setEditablePartsLabor([]);
  };

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

  const completeTask = async () => {
    if (!taskId || !companyId) {
      console.error('Task or Company ID is missing.');
      message.error('Cannot complete task without Task ID and Company ID.');
      return;
    }

    try {
      setLoading(true);
      const taskDocRef = doc(db, 'maintenance', taskId);
      await updateDoc(taskDocRef, { status: 'Completed' });

      setShowCompletionScreen(true);
      message.success('Task marked as completed.');
    } catch (error) {
      console.error('Error completing task:', error);
      if (error instanceof Error) {
        message.error(`Failed to complete task: ${error.message}`);
      } else {
        message.error('Failed to complete task due to an unknown error.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = () => {
    Modal.confirm({
      title: 'Are you sure you want to delete this task?',
      content: 'This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        if (!taskId) {
          console.error('Task ID is missing.');
          message.error('Cannot delete task without Task ID.');
          return;
        }

        try {
          setLoading(true);
          const taskDocRef = doc(db, 'maintenance', taskId);
          await deleteDoc(taskDocRef);

          message.success('Task deleted successfully.');
          navigate('/maintenance');
        } catch (error) {
          console.error('Error deleting task:', error);
          if (error instanceof Error) {
            message.error(`Failed to delete task: ${error.message}`);
          } else {
            message.error('Failed to delete task due to an unknown error.');
          }
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handleEdit = () => {
    setEditDrawerVisible(true);
  };

  const handlePostUpdate = () => {
    setUpdateDrawerVisible(true);
  };

  const handleEditDrawerClose = () => {
    setEditDrawerVisible(false);
  };

  const handleUpdateDrawerClose = () => {
    setUpdateDrawerVisible(false);
  };

  /**
   * **handleUpdateSuccess Function**
   * Refetches task details after an update to ensure assignees' names are up-to-date.
   */
  const handleUpdateSuccess = useCallback(async () => {
    if (!taskId || !companyId) {
      console.error('Task ID or Company ID is missing.');
      return;
    }

    try {
      setLoading(true);
      const taskDocRef = doc(db, 'maintenance', taskId);
      const taskDocSnap = await getDoc(taskDocRef);

      if (!taskDocSnap.exists()) {
        throw new Error('Task document does not exist');
      }

      const taskData = taskDocSnap.data() as MaintenanceData;

      // Fetch all assignees for the company
      const allAssignees = await fetchAssignees();

      // Map task assignees with fetched assignees to include names
      const taskAssignees: Assignee[] = taskData.assignees.map(assigneeId => {
        const assignee = allAssignees.find(a => a.uid === assigneeId.uid);
        return assignee ? assignee : { uid: assigneeId.uid, name: 'Unknown User' };
      });

      const updatedTaskData = {
        ...taskData,
        key: taskDocSnap.id,
        assignees: taskAssignees,
      };

      setTask(updatedTaskData);
      console.log('Task data updated successfully:', updatedTaskData);
    } catch (error) {
      console.error('Error updating task details:', error);
      if (error instanceof Error) {
        message.error(`Failed to update task details: ${error.message}`);
      } else {
        message.error('Failed to update task details due to an unknown error.');
      }
    } finally {
      setLoading(false);
    }
  }, [taskId, companyId, fetchAssignees]);

  const handleTaskCompleted = () => {
    console.log('Task completed');
    handleUpdateSuccess();
  };

  const handleNewWorkOrder = () => {
    setEditingSubWorkOrder(null);
    setSubWorkOrderDrawerVisible(true);
  };

  const handleSubWorkOrderDrawerClose = () => {
    setSubWorkOrderDrawerVisible(false);
    setEditingSubWorkOrder(null);
  };

  const menu = (
    <Menu>
      <Menu.Item icon={<EditOutlined />} key="edit" onClick={handleEdit}>
        Edit
      </Menu.Item>
      <Menu.Item key="2" icon={<CalendarOutlined />} onClick={handlePostUpdate}>
        Reschedule
      </Menu.Item>
      <Menu.Item key="3" icon={<CheckCircleOutlined />} onClick={completeTask}>
        Mark as Complete
      </Menu.Item>
      <Menu.Item key="4" icon={<BellOutlined />}>
        Send Notification
      </Menu.Item>
      <Menu.Item key="5" icon={<DeleteOutlined />} onClick={handleDeleteTask}>
        Delete
      </Menu.Item>
    </Menu>
  );

  useEffect(() => {
    const checkUserPermissions = async () => {
      if (!auth.currentUser) {
        console.error('No authenticated user');
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        const userData = userDoc.data();
        console.log('User data:', userData);

        if (companyId) {
          const companyDoc = await getDoc(doc(db, 'companies', companyId));
          const companyData = companyDoc.data();
          console.log('Company data:', companyData);

          if (companyData && companyData.members && companyData.members[auth.currentUser.uid]) {
            console.log('User is a member of the company');
          } else {
            console.error('User is not a member of the company');
            message.error('You do not have permission to view this task.');
            navigate('/maintenance'); // Redirecting the user if they don't have permissions
          }
        }
      } catch (error) {
        console.error('Error checking user permissions:', error);
        message.error('An error occurred while verifying permissions.');
      }
    };

    checkUserPermissions();
  }, [companyId, navigate]);

  if (loading || loadingAssignees) {
    return <Skeleton active />;
  }

  if (!task) {
    return <div>Task not found</div>;
  }

  const convertToTaskData = (data: MaintenanceData) => {
    return {
      subject: data.subject,
      description: data.description || '',
      decision: data.decision || '',
      subjectVendor: data.subjectVendor || '',
      approvedByOwner: data.approvedByOwner ? 'Yes' : 'No',
      permitEntering: data.permitEntering || false,
    };
  };

  return (
    <div className="task-details-page">
      <div className="task-details-top-container">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '40px',
          }}
        >
          <Button icon={<LeftOutlined />} onClick={() => navigate(-1)}>
            Back
          </Button>
          <Dropdown overlay={menu} trigger={['click']}>
            <Button icon={<MoreOutlined />} />
          </Dropdown>
        </div>

        <div className="task-details-header">
          <Row justify="space-between" align="middle">
            <Col>
              <Space direction="vertical" size="small">
                <Title level={2} style={{ marginBottom: '5px' }}>
                  {truncateString(task.subject, 40)}
                </Title>
                {task.taskType && (
                  <Text type="secondary" style={{ fontSize: '16px', marginBottom: '5px',marginLeft: '3px',color: '#666' }}>
                    {task.taskType || 'No task type specified'}
                </Text>
                )}
                {task.relatedToName && task.relatedTo && (
                  <Link to={`/property/${task.relatedTo}`}>
                    <Title level={5} type="secondary" style={{cursor: 'pointer',marginLeft: '3px', color: '#28A745' }}>
                      {task.relatedToName}
                    </Title>
                  </Link>
                )}
                
                <Space>
                  <div
                    style={{
                      backgroundColor: '#f0f0f0',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '14px',
                      color: '#666',
                      display: 'inline-block',
                      marginLeft: '3px'
                    }}
                  >
                    #{task.taskRefId}
                  </div>
                </Space>
              </Space>
            </Col>
            <Col>
              <Space>
                <div style={getPriorityStyle(task.priority)}>Priority: {task.priority}</div>
              </Space>
            </Col>
          </Row>
        </div>
      </div>

      <div className="task-details-menu">
        <Tabs activeKey={activeTab} onChange={key => setActiveTab(key)}>
          <TabPane tab="Overview" key="overview" />
          <TabPane tab="Subtasks" key="subtasks" />
          <TabPane tab="Notes" key="notes" />
          <TabPane tab="Files" key="files" />
        </Tabs>
      </div>

      <div className="task-details-content">
        {activeTab === 'overview' && (
          <>
            <Card
              className="task-details-quick-actions-card card-padding-top"
              size="small"
              title="Quick Actions"
            >
              <div className="task-details-quick-actions-text-container">
                <Text className="task-details-quick-actions-text">
                  What would you like to do next?
                </Text>
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
                    onClick={completeTask}
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
                    onClick={handleNewWorkOrder}
                  >
                    New Work Order
                  </Button>
                </Col>
              </Row>
            </Card>

            <Row gutter={16}>
              <Col span={8}>
                <Card size="small" className="task-details-info-card card-padding-top">
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
                <Card size="small" className="task-details-info-card card-padding-top">
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
                <Card size="small" className="task-details-info-card card-padding-top">
                  <div className="task-details-info-content">
                    <div className="icon">{getStatusIcon(task.status)}</div>
                    <div className="text">Status</div>
                    <div className="date">{task.status}</div>
                  </div>
                </Card>
              </Col>
            </Row>

            <Card
              className="task-details-description-card card-padding-top"
              style={{ boxShadow: 'none' }}
              size="small"
              title="Description"
            >
              <div className="description-padding-top">
                <Text style={{ paddingLeft: '8px' }}>
                  {task.description || 'No description available.'}
                </Text>
                <Divider />
                <div style={{ paddingLeft: '8px', paddingBottom: '16px' }}>
                  <Row gutter={16} style={{ marginTop: '24px' }}>
                    <Col span={6}>
                      <Text strong>Vendor:</Text>
                      <br />
                      <Text>{task.vendor || 'No vendor assigned'}</Text>
                    </Col>
                    <Col span={6}>
                      <Text strong>Assignees:</Text>
                      <br />
                      {task.assignees && task.assignees.length > 0 ? (
                        task.assignees.map((assignee) => (
                          <Text key={assignee.uid}>
                            {assignee.name} {/* Displaying Assignee Name */}
                          </Text>
                        ))
                      ) : (
                        <Text>No assignees assigned</Text>
                      )}
                    </Col>
                    <Col span={6}>
                      <Text strong>Approved By Owner:</Text>
                      <br />
                      <Text>{task.approvedByOwner ? 'Yes' : 'No'}</Text>
                    </Col>
                    <Col span={6}>
                      <Text strong>Permission To Enter:</Text>
                      <br />
                      <Text>{task.permitEntering ? 'Yes' : 'No'}</Text>
                    </Col>
                  </Row>
                </div>
              </div>
            </Card>

            <Card
              className="task-details-parts-labor-card card-padding-top"
              style={{ marginTop: '24px', boxShadow: 'none' }}
              size="small"
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Parts And Labor</span>
                  {!isEditingPartsLabor ? (
                    <Button type="primary" icon={<EditOutlined />} onClick={handleToggleEditPartsLabor}>
                      Edit
                    </Button>
                  ) : (
                    <Space>
                      <Button type="primary" onClick={handleSavePartsLabor} disabled={loading}>
                        Save
                      </Button>
                      <Button onClick={handleCancelPartsLabor} disabled={loading}>
                        Cancel
                      </Button>
                    </Space>
                  )}
                </div>
              }
            >
              <Skeleton loading={loading}>
                <Table
                  columns={[
                    {
                      title: 'Description',
                      dataIndex: 'description',
                      render: (text: string, record: PartsAndLabor, index: number) =>
                        isEditingPartsLabor ? (
                          <Input
                            value={editablePartsLabor[index].description}
                            onChange={e => {
                              const newData = [...editablePartsLabor];
                              newData[index].description = e.target.value;
                              setEditablePartsLabor(newData);
                            }}
                          />
                        ) : (
                          text
                        ),
                    },
                    {
                      title: 'Account',
                      dataIndex: 'account',
                      render: (text: string | undefined, record: PartsAndLabor, index: number) =>
                        isEditingPartsLabor ? (
                          <Input
                            value={editablePartsLabor[index].account || ''}
                            onChange={e => {
                              const newData = [...editablePartsLabor];
                              newData[index].account = e.target.value;
                              setEditablePartsLabor(newData);
                            }}
                          />
                        ) : (
                          text || '—'
                        ),
                    },
                    {
                      title: 'Quantity',
                      dataIndex: 'quantity',
                      render: (value: number, record: PartsAndLabor, index: number) =>
                        isEditingPartsLabor ? (
                          <InputNumber
                            min={1}
                            value={editablePartsLabor[index].quantity}
                            onChange={val => {
                              const newData = [...editablePartsLabor];
                              newData[index].quantity = val || 1;
                              newData[index].total =
                                (val || 1) * (editablePartsLabor[index].unitPrice || 0);
                              setEditablePartsLabor(newData);
                            }}
                          />
                        ) : (
                          value
                        ),
                    },
                    {
                      title: 'Unit Price',
                      dataIndex: 'unitPrice',
                      render: (value: number, record: PartsAndLabor, index: number) =>
                        isEditingPartsLabor ? (
                          <InputNumber
                            min={0}
                            step={0.01}
                            value={editablePartsLabor[index].unitPrice}
                            onChange={val => {
                              const newData = [...editablePartsLabor];
                              newData[index].unitPrice = val || 0;
                              newData[index].total =
                                (editablePartsLabor[index].quantity || 0) * (val || 0);
                              setEditablePartsLabor(newData);
                            }}
                          />
                        ) : (
                          `$${value.toFixed(2)}`
                        ),
                    },
                    {
                      title: 'Total',
                      dataIndex: 'total',
                      render: (value: number) => `$${value.toFixed(2)}`,
                    },
                    isEditingPartsLabor
                      ? {
                          title: 'Action',
                          dataIndex: 'action',
                          render: (_: any, record: PartsAndLabor, index: number) =>
                            editablePartsLabor.length > 0 ? (
                              <DeleteOutlined
                                onClick={() => {
                                  const newData = [...editablePartsLabor];
                                  newData.splice(index, 1);
                                  setEditablePartsLabor(newData);
                                }}
                                style={{ color: 'red' }}
                              />
                            ) : null,
                        }
                      : {},
                  ]}
                  dataSource={isEditingPartsLabor ? editablePartsLabor : partsAndLabor}
                  pagination={false}
                  className="parts-and-labor-table"
                  size="small"
                  rowKey="id"
                  footer={() =>
                    isEditingPartsLabor ? (
                      <Button
                        type="dashed"
                        onClick={() => {
                          setEditablePartsLabor([
                            ...editablePartsLabor,
                            {
                              id: `temp-${Date.now()}`,
                              description: '',
                              quantity: 1,
                              unitPrice: 0,
                              total: 0,
                            },
                          ]);
                        }}
                        icon={<PlusOutlined />}
                        disabled={loading}
                      >
                        Add Parts/Labor
                      </Button>
                    ) : null
                  }
                  summary={data => {
                    const totalSum = data.reduce((sum, record) => sum + record.total, 0);
                    return (
                      <Table.Summary.Row> 
                        <Table.Summary.Cell colSpan={4} align="right" index={0}>  
                          <Text strong>Total:</Text>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={0}>
                          <Text strong>${totalSum.toFixed(2)}</Text>
                        </Table.Summary.Cell>
                        {isEditingPartsLabor && <Table.Summary.Cell index={0} />}
                      </Table.Summary.Row>
                    );
                  }}
                />
              </Skeleton>
            </Card>
          </>
        )}
        {activeTab === 'subtasks' && taskId && companyId && (
          <TaskSubtasksPage taskId={taskId} companyId={companyId} />
        )}
        {activeTab === 'notes' && taskId && (
          <TaskNotesPage taskId={taskId} />
        )}
        {activeTab === 'files' && taskId && (
          <TaskFilesPage taskId={taskId} />
        )}
      </div>

      {companyId && task && (
        <>
          <TaskEditDrawer
            visible={editDrawerVisible}
            onClose={handleEditDrawerClose}
            taskId={taskId}
            taskData={convertToTaskData(task)}
            companyId={companyId}
            onUpdateSuccess={handleUpdateSuccess}
          />
          <TaskUpdateDrawer
            visible={updateDrawerVisible}
            onClose={handleUpdateDrawerClose}
            taskId={taskId}
            taskData={task}
            companyId={companyId}
            onUpdateSuccess={handleUpdateSuccess}
            onTaskCompleted={handleTaskCompleted}
          />
        </>
      )}

      <AnimatePresence>
        {showCompletionScreen && (
          <CompletionScreen onComplete={() => navigate('/maintenance')} />
        )}
      </AnimatePresence>

      {taskId && companyId && (
        <SubWorkOrderDrawer
          visible={subWorkOrderDrawerVisible}
          onClose={handleSubWorkOrderDrawerClose}
          parentTaskId={taskId}
          companyId={companyId}
          editingSubWorkOrder={editingSubWorkOrder}
        />
      )}
    </div>
  );
};

export default TaskDetailsPage;