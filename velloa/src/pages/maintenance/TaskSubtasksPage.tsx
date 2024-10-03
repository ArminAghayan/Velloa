import React, { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Input,
  Button,
  Row,
  Col,
  Modal,
  Tag,
  Popconfirm,
  message,
  Dropdown,
  Menu,
  Typography,
  Space,
} from 'antd';
import { DownOutlined, EyeOutlined, EditOutlined, DeleteOutlined, ProfileOutlined, MoreOutlined, SettingOutlined, ClockCircleOutlined, CheckCircleOutlined, ToolOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { collection, getDocs, Timestamp, doc, updateDoc, deleteDoc, query, where, getDoc } from 'firebase/firestore';
import { db } from '../../firebase-config';
import TaskSubTaskDrawer from './Tasks/update/TaskSubTaskDrawer';
import TaskSubWorkOrderDrawer from './Tasks/update/TaskSubWorkOrderDrawer'; // Update this import
import './TaskSubtasksPage.css';
import { Divider } from 'antd/lib';

const { Text } = Typography;

// Update the interfaces
interface BaseItem {
  id: string;
  subject: string;
  description: string;
  createdAt: Timestamp | string;
  dateFinished?: Timestamp | string;
  priority: string;
  status: string;
  notifyAssignees: boolean;
  relatedToName: string;
  taskType: 'Work Order' | 'Task'; // Changed from 'type' to 'taskType'
}

interface Subtask extends BaseItem {
  taskType: 'Task';
  // Add any subtask-specific fields here
}

interface SubWorkOrder extends BaseItem {
  taskType: 'Work Order';
  workOrderType: 'oneTime';
  permitEntering: boolean;
  approvedByOwner: boolean;
  partsAndLabor: boolean;
  dueDate?: Timestamp | string;
  assignees?: Array<{ uid: string; name: string }>;
  estimatedHours?: number;
  estimatedCost?: number;
  vendor?: string;
  relatedProperty?: string;
  notifyAssignees: boolean;
  relatedToName: string;
}

interface PartAndLabor {
  id: string;
  description: string;
  account: string;
  quantity: number;
  unitPrice: number;
  total: number;
  subtaskId: string;
}


type SubtaskOrWorkOrder = Subtask | SubWorkOrder;

interface TaskSubtasksPageProps {
  taskId: string;
  companyId: string;
}

const TaskSubtasksPage: React.FC<TaskSubtasksPageProps> = ({ taskId, companyId }) => {
  const [subtasks, setSubtasks] = useState<SubtaskOrWorkOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority] = useState('');
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [isWorkOrderDrawerVisible, setIsWorkOrderDrawerVisible] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [editingSubtask, setEditingSubtask] = useState<Subtask | null>(null);
  const [editingSubWorkOrder, setEditingSubWorkOrder] = useState<SubWorkOrder | null>(null);
  const [selectedSubtask, setSelectedSubtask] = useState<SubtaskOrWorkOrder | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [partsAndLabor, setPartsAndLabor] = useState<PartAndLabor[]>([]);

  
  const fetchSubtasks = useCallback(async () => {
    if (!taskId) {
      message.error('Task ID is missing.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const subtasksCollectionRef = collection(db, 'maintenance', taskId, 'subtasks');
      const subtasksSnapshot = await getDocs(subtasksCollectionRef);

      const subtasksData = subtasksSnapshot.docs.map((doc) => {
        const data = doc.data() as Omit<SubtaskOrWorkOrder, 'id'>;
        return { 
          id: doc.id, 
          ...data, 
          taskType: data.taskType || 'Task' // Ensure taskType is set
        } as SubtaskOrWorkOrder;
      });
      console.log('Fetched subtasks:', subtasksData);
      setSubtasks(subtasksData);
    } catch (error) {
      console.error('Error fetching subtasks:', error);
      message.error('Failed to load subtasks.');
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    fetchSubtasks();
  }, [fetchSubtasks]);

  const formatDate = (date: Timestamp | string | undefined) => {
    if (!date) return 'N/A';
    if (date instanceof Timestamp) {
      return date.toDate().toLocaleDateString();
    }
    return new Date(date).toLocaleDateString();
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleEdit = (item: SubtaskOrWorkOrder) => {
    console.log('Editing item:', item);
    if (item.taskType === 'Work Order') {
      console.log('Opening work order drawer');
      setEditingSubWorkOrder(item);
      setIsWorkOrderDrawerVisible(true);
    } else {
      console.log('Opening subtask drawer');
      setEditingSubtask(item as Subtask);
      setIsDrawerVisible(true);
    }
  };

  const handleDelete = async (subtaskId: string) => {
    try {
      const subtaskRef = doc(db, 'maintenance', taskId, 'subtasks', subtaskId);
      await deleteDoc(subtaskRef);
      message.success('Subtask deleted.');
      fetchSubtasks();
    } catch (error) {
      console.error('Error deleting subtask:', error);
      message.error('Failed to delete subtask.');
    }
  };

  const filteredSubtasks = subtasks.filter((subtask) => {
    const matchesSearch = subtask.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterPriority ? subtask.priority === filterPriority : true;
    return matchesSearch && matchesFilter;
  });

  const openModal = async (subtask: SubtaskOrWorkOrder) => {
    setSelectedSubtask(subtask);
    setIsModalVisible(true);
    if (subtask.taskType === 'Work Order') {
      await fetchPartsAndLabor(subtask.id);
    }
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    setSelectedSubtask(null);
  };

  const columns = [
    { 
      title: 'Task', 
      dataIndex: 'taskType', 
      key: 'taskType',
      render: (taskType: 'Work Order' | 'Task', record: SubtaskOrWorkOrder) => (
        <Space align="center">
          <div style={{
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: taskType === 'Work Order' ? '#d8e6d9' : '#d8e6d9',
            borderRadius: '4px',
            marginRight: '12px'
          }}>
            {React.cloneElement(
              taskType === 'Work Order' ? <ToolOutlined /> : <ProfileOutlined />, 
              { style: { fontSize: '24px', color: taskType === 'Work Order' ? '#168033' : '#168033' } }
            )}
          </div>
          <Text strong style={{ color: 'Black', fontSize: '14px' }}>{taskType}</Text>
        </Space>
      ),
    },
    { title: 'Subject', dataIndex: 'subject', key: 'subject' },
    { title: 'Priority', dataIndex: 'priority', key: 'priority', render: (priority: string) => <Tag color={priority === 'High' ? 'red' : 'green'}>{priority}</Tag> },
    { title: 'Date Created', dataIndex: 'createdAt', key: 'createdAt', render: formatDate },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (status: string) => <Tag color={status === 'Completed' ? 'green' : 'blue'}>{status}</Tag> },
    { 
      title: 'Actions', 
      key: 'actions', 
      render: (text: any, record: SubtaskOrWorkOrder) => {
        const menu = (
          <Menu>
            <Menu.Item
              key="view"
              icon={<EyeOutlined />}
              onClick={(info) => {
                // Stop event propagation
                info.domEvent.stopPropagation();
                openModal(record);
              }}
            >
              View
            </Menu.Item>
            <Menu.Item
              key="edit"
              icon={<EditOutlined />}
              onClick={(info) => {
                // Stop event propagation
                info.domEvent.stopPropagation();
                handleEdit(record);
              }}
            >
              Edit
            </Menu.Item>
            <Menu.Item key="delete" icon={<DeleteOutlined />}>
              <Popconfirm 
                title="Are you sure you want to delete this subtask?" 
                onConfirm={(e) => {
                  e?.stopPropagation(); // Use optional chaining
                  handleDelete(record.id);
                }}
                onCancel={(e) => e?.stopPropagation()} // Use optional chaining
              >
                Delete
              </Popconfirm>
            </Menu.Item>
          </Menu>
        );

        return (
          <Dropdown overlay={menu} trigger={['click']}>
            <Button 
              type="text" // Changed from default to text
              icon={<MoreOutlined />} 
              onClick={(e) => {
                e.stopPropagation(); // Prevents the row's onClick from firing
              }} 
            />
          </Dropdown>
        );
      }
    },
  ];

  const onSelectChange = (selectedKeys: React.Key[]) => {
    setSelectedRowKeys(selectedKeys);
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
  };

  const handleStatusChange = async (subtaskId: string, newStatus: string) => {
    try {
      const subtaskRef = doc(db, 'maintenance', taskId, 'subtasks', subtaskId);
      await updateDoc(subtaskRef, { status: newStatus });
      message.success(`Subtask status updated to ${newStatus}`);
      fetchSubtasks();
      setSelectedSubtask(prev => prev ? { ...prev, status: newStatus } : null);
    } catch (error) {
      console.error('Error updating subtask status:', error);
      message.error('Failed to update subtask status.');
    }
  };

  const handleNewWorkOrderSubtask = () => {
    setEditingSubWorkOrder(null); // Ensure we're creating a new work order, not editing
    setIsWorkOrderDrawerVisible(true);
  };
  const fetchPartsAndLabor = async (subtaskId: string) => {
    try {
      console.log(`Attempting to fetch parts and labor for subtaskId: ${subtaskId}`);
      
      // First, fetch the main task to get the companyId
      const taskDocRef = doc(db, 'maintenance', taskId);
      const taskDoc = await getDoc(taskDocRef);
      
      if (!taskDoc.exists()) {
        console.error('Task document does not exist');
        message.error('Failed to load task data.');
        return;
      }
      
      const taskData = taskDoc.data();
      const companyId = taskData.companyId;
      
      console.log(`Task companyId: ${companyId}`);
      
      // Now fetch the parts and labor
      const partsAndLaborCollectionRef = collection(db, 'maintenance', taskId, 'partsandlabor');
      console.log(`Collection path: maintenance/${taskId}/partsandlabor`);
      
      const q = query(partsAndLaborCollectionRef, where("subtaskId", "==", subtaskId));
      console.log('Query created, attempting to get documents...');
      
      const querySnapshot = await getDocs(q);
      console.log(`Query executed. Number of documents: ${querySnapshot.size}`);
      
      const partsAndLaborData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as PartAndLabor));
      
      console.log('Parts and Labor data before setting state:', partsAndLaborData);
      setPartsAndLabor(partsAndLaborData);
      console.log('Parts and Labor state after setting:', partsAndLabor);
    } catch (error) {
      console.error('Error fetching parts and labor:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      message.error('Failed to load parts and labor data. Please check console for details.');
    }
  };
  

  const handleBulkDelete = () => {
    Modal.confirm({
      title: 'Are you sure you want to delete these subtasks?',
      icon: <ExclamationCircleOutlined />,
      content: 'This action cannot be undone.',
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk: async () => {
        try {
          for (const key of selectedRowKeys) {
            const subtaskId = key.toString();
            const subtaskRef = doc(db, 'maintenance', taskId, 'subtasks', subtaskId);
            await deleteDoc(subtaskRef);
          }
          message.success('Selected subtasks deleted successfully.');
          setSelectedRowKeys([]);
          fetchSubtasks();
        } catch (error) {
          console.error('Error deleting subtasks:', error);
          message.error('Failed to delete selected subtasks.');
        }
      },
    });
  };

  const handleCancelSelection = () => {
    setSelectedRowKeys([]);
  };

  // Add this function to handle row clicks
  const handleRowClick = (record: SubtaskOrWorkOrder) => {
    openModal(record);
  };

  return (
    <div className="task-subtasks-page">
      <Row gutter={16} style={{ marginBottom: '16px' }}>
        <Col span={16}>
          <Input placeholder="Search subtasks" value={searchTerm} onChange={handleSearchChange} className='search-input-subtasks' />
        </Col>
        <Col span={8} style={{ display: 'flex', justifyContent: 'flex-end' }}>
          {selectedRowKeys.length > 0 ? (
            <>
              <Button onClick={handleBulkDelete} type="primary" danger style={{ marginRight: '8px' }}>
                Delete Selected
              </Button>
              <Button onClick={handleCancelSelection}>
                Cancel
              </Button>
            </>
          ) : (
            <Dropdown overlay={
              <Menu>
                <Menu.Item key="newTask" icon={<ProfileOutlined />} onClick={() => setIsDrawerVisible(true)}>
                  New Subtask
                </Menu.Item>
                <Menu.Item key="newWorkOrderSubtask" icon={<ToolOutlined />} onClick={handleNewWorkOrderSubtask}>
                  New Work Order 
                </Menu.Item>
              </Menu>
            }>
              <Button className='add-subtask-button'>
                New Subtask <DownOutlined />
              </Button>
            </Dropdown>
          )}
        </Col>
      </Row>

      <Table
        rowSelection={rowSelection}
        columns={columns}
        dataSource={filteredSubtasks}
        loading={loading}
        rowKey="id"
        pagination={{ pageSize: 10 }}
        onRow={(record) => ({
          onClick: () => handleRowClick(record),
        })}
      />

      <TaskSubTaskDrawer
        visible={isDrawerVisible}
        onClose={() => {
          setIsDrawerVisible(false);
          setEditingSubtask(null);
        }}
        companyId={companyId}
        parentTaskId={taskId}
        onSubtaskAdded={fetchSubtasks}
        editingSubtask={editingSubtask}
      />

      <TaskSubWorkOrderDrawer
        visible={isWorkOrderDrawerVisible}
        onClose={() => {
          console.log('Closing work order drawer'); // Add this line for debugging
          setIsWorkOrderDrawerVisible(false);
          setEditingSubWorkOrder(null);
        }}
        companyId={companyId}
        parentTaskId={taskId}
        onSubWorkOrderAdded={fetchSubtasks}
        editingSubWorkOrder={editingSubWorkOrder}
      />

      {/* Modal for viewing subtask details */}
      <Modal
        title="Subtask Details"
        width={'65%'}
        visible={isModalVisible}
        onCancel={handleModalClose}
        footer={[
          <Dropdown
            key="change"
            trigger={['click']}
            overlay={
              <Menu>
                <Menu.Item key="edit" icon={<EditOutlined />} onClick={() => handleEdit(selectedSubtask!)}>
                  Edit
                </Menu.Item>
                <Menu.Item key="delete" icon={<DeleteOutlined />}>
                  <Popconfirm
                    title="Are you sure you want to delete this subtask?"
                    onConfirm={() => handleDelete(selectedSubtask!.id)}
                  >
                    Delete
                  </Popconfirm>
                </Menu.Item>
              </Menu>
            }
          >
            <Button icon={<SettingOutlined />}>
              Change <DownOutlined />
            </Button>
          </Dropdown>,
          <Dropdown
            key="status"
            trigger={['click']}
            overlay={
              <Menu>
                <Menu.Item key="inProgress" icon={<ClockCircleOutlined />} onClick={() => handleStatusChange(selectedSubtask!.id, 'In Progress')}>
                  In Progress
                </Menu.Item>
                <Menu.Item key="complete" icon={<CheckCircleOutlined />} onClick={() => handleStatusChange(selectedSubtask!.id, 'Complete')}>
                  Complete
                </Menu.Item>
              </Menu>
            }
          >
            <Button icon={<ClockCircleOutlined />}>
              Status <DownOutlined />
            </Button>
          </Dropdown>,
        ]}
      >
            <Divider />

  {selectedSubtask && (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Grid Layout for three columns */}
      <Row gutter={24}>
        {/* First Column */}
        <Col span={8}>
          <p><Text strong>Subject:</Text> {selectedSubtask.subject}</p>
          <p><Text strong>Date Created:</Text> {formatDate(selectedSubtask.createdAt)}</p>
          <p>
            <Text strong>Priority:</Text>{' '}
            <Tag color={selectedSubtask.priority === 'High' ? 'red' : 'green'}>
              {selectedSubtask.priority}
            </Tag>
          </p>        </Col>
        {/* Second Column */}
        <Col span={8}>
          <p><Text strong>Task Type:</Text> {selectedSubtask.taskType}</p>
          <p><Text strong>Date Finished:</Text> {formatDate(selectedSubtask.dateFinished)}</p>
          <p>
            <Text strong>Status:</Text>{' '}
            <Tag color={selectedSubtask.status === 'Completed' ? 'green' : 'blue'}>
              {selectedSubtask.status}
            </Tag>
          </p>          
        </Col>
        {/* Third Column (Work Order specific fields) */}
        <Col span={8}>
          {selectedSubtask.taskType === 'Work Order' && (
            <>
              <p><Text strong>Permit Entering:</Text> {selectedSubtask.permitEntering ? 'Yes' : 'No'}</p>
              <p><Text strong>Notify Assignees:</Text> {selectedSubtask.notifyAssignees ? 'Yes' : 'No'}</p>
              <p><Text strong>Approved by Owner:</Text> {selectedSubtask.approvedByOwner ? 'Yes' : 'No'}</p>
              <p><Text strong>Vendor:</Text> {selectedSubtask.vendor}</p>
            </>
          )}
        </Col>
      </Row>
      {/* Assignees Section (only for Work Orders) */}
      {selectedSubtask.taskType === 'Work Order' && selectedSubtask.assignees && selectedSubtask.assignees.length > 0 && (
        <div>
          <Text strong>Assignees:</Text>
          <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
            {selectedSubtask.assignees.map((assignee, index) => (
              <li key={index}>{assignee.name}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Description Box */}
      <div>
        <Text strong>Description:</Text>
        <div style={{
          border: '1px solid #d9d9d9', 
          padding: '16px', 
          borderRadius: '4px', 
          marginTop: '8px',
          minHeight: '120px'
        }}>
          <p>{selectedSubtask.description || 'No description available'}</p>
        </div>
      </div>
      <Divider />

      {/* Work Order Details Table */}
      {selectedSubtask.taskType === 'Work Order' && (
        
        <div>
          <Text strong>Parts and Labor:</Text>
          <Table 
            dataSource={partsAndLabor} 
            pagination={false}
            style={{ marginTop: '8px' }}
          >
              <Table.Column title="Description" dataIndex="description" key="description" />
              <Table.Column title="Account" dataIndex="account" key="account" />
              <Table.Column title="Quantity" dataIndex="quantity" key="quantity" />
              <Table.Column title="Unit Price" dataIndex="unitPrice" key="unitPrice" 
                render={(value) => value ? `$${value.toFixed(2)}` : 'N/A'}
              />
              <Table.Column title="Total" dataIndex="total" key="total" 
                render={(value) => value ? `$${value.toFixed(2)}` : 'N/A'}
              />
          </Table>
        </div>
      )}
    </div>
    
  )}
</Modal>

    </div>
  );
};

export default TaskSubtasksPage;