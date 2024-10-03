// TaskNotesPage.tsx

import React, { useState, useEffect } from 'react';
import { 
  Input, 
  Button, 
  Table, 
  Card, 
  Typography, 
  message, 
  Modal, 
  Dropdown, 
  Menu, 
  Tooltip 
} from 'antd';
import { 
  SendOutlined, 
  MoreOutlined, 
  ExclamationCircleOutlined 
} from '@ant-design/icons';
import './TaskNotesPage.css';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  doc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  Timestamp 
} from 'firebase/firestore';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { db } from '../../firebase-config';

const { TextArea } = Input;
const { Title, Text, Paragraph } = Typography;
const { confirm } = Modal;

// Updated Note interface
interface Note {
  id: string;
  content?: string;
  createdAt?: Timestamp;
  createdBy?: string;
}

interface TaskNotesPageProps {
  taskId: string | undefined;
}

const TaskNotesPage: React.FC<TaskNotesPageProps> = ({ taskId }) => {
  const [newNote, setNewNote] = useState('');
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editNoteContent, setEditNoteContent] = useState('');
  const [loading, setLoading] = useState<boolean>(false); // Added loading state

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        fetchUserName(user.uid);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchUserName = async (uid: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const fullName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim();
        setUserName(fullName || 'Unknown User');
      }
    } catch (error) {
      console.error('Error fetching user name:', error);
      message.error('Failed to fetch user information.');
    }
  };

  useEffect(() => {
    if (taskId && currentUser) {
      fetchNotes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId, currentUser]);

  const fetchNotes = async () => {
    if (!taskId) {
      message.error('No task selected.');
      return;
    }
    setLoading(true);
    try {
      const notesRef = collection(db, 'maintenance', taskId, 'notes');
      const q = query(notesRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const fetchedNotes = querySnapshot.docs.map(docSnapshot => {
        const data = docSnapshot.data();
        return {
          id: docSnapshot.id,
          content: data.content || 'No content available.',
          createdAt: data.createdAt || Timestamp.fromDate(new Date()),
          createdBy: data.createdBy || 'Unknown',
        };
      }) as Note[];
      setNotes(fetchedNotes);
    } catch (error) {
      console.error('Error fetching notes:', error);
      message.error('Failed to fetch notes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) {
      message.error('Note content cannot be empty.');
      return;
    }
    if (!taskId) {
      message.error('No task selected.');
      return;
    }
    if (!currentUser) {
      message.error('You must be logged in to add a note.');
      return;
    }

    try {
      const notesRef = collection(db, 'maintenance', taskId, 'notes');
      const newNoteObj = {
        content: newNote.trim(),
        createdAt: Timestamp.now(), // Use Firestore Timestamp
        createdBy: userName || currentUser.email || 'Unknown User',
      };
      await addDoc(notesRef, newNoteObj);
      message.success('Note added successfully');
      setNewNote('');
      await fetchNotes(); // Refresh the notes list
    } catch (error) {
      console.error('Error adding note:', error);
      message.error('Failed to add note. Please try again.');
    }
  };

  const handleView = (record: Note) => {
    setSelectedNote(record);
    setIsViewModalVisible(true);
  };

  const handleModalClose = () => {
    setIsViewModalVisible(false);
    setSelectedNote(null);
  };

  const handleEdit = (record: Note) => {
    setSelectedNote(record);
    setEditNoteContent(record.content || '');
    setIsEditModalVisible(true);
  };

  const handleEditModalClose = () => {
    setIsEditModalVisible(false);
    setSelectedNote(null);
    setEditNoteContent('');
  };

  const handleUpdateNote = async () => {
    if (!selectedNote || !taskId) {
      message.error('Invalid note or task.');
      return;
    }

    if (!editNoteContent.trim()) {
      message.error('Note content cannot be empty.');
      return;
    }

    try {
      const noteDocRef = doc(db, 'maintenance', taskId, 'notes', selectedNote.id);
      await updateDoc(noteDocRef, {
        content: editNoteContent.trim(),
        // Optionally, you can update the 'updatedAt' field if you have one
        // updatedAt: Timestamp.now(),
      });
      message.success('Note updated successfully');
      handleEditModalClose();
      await fetchNotes();
    } catch (error) {
      console.error('Error updating note:', error);
      message.error('Failed to update note. Please try again.');
    }
  };

  const handleDelete = (record: Note) => {
    confirm({
      title: 'Are you sure you want to delete this note?',
      icon: <ExclamationCircleOutlined />,
      content: 'This action cannot be undone.',
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        if (!taskId) {
          message.error('Invalid task.');
          return;
        }
        try {
          const noteDocRef = doc(db, 'maintenance', taskId, 'notes', record.id);
          await deleteDoc(noteDocRef);
          message.success('Note deleted successfully');
          await fetchNotes();
        } catch (error) {
          console.error('Error deleting note:', error);
          message.error('Failed to delete note. Please try again.');
        }
      },
      onCancel() {
        console.log('Delete cancelled');
      },
    });
  };

  const columns = [
    {
      title: 'Note',
      dataIndex: 'content',
      key: 'content',
      render: (text: string | undefined) => (
        text && text.length > 35 ? (
          <Tooltip title={text}>
            {text.substring(0, 35)}...
          </Tooltip>
        ) : (
          text || 'No content available.'
        )
      ),
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (timestamp: Timestamp | undefined) => 
        timestamp ? timestamp.toDate().toLocaleDateString() : 'N/A',
    },
    {
      title: 'Created By',
      dataIndex: 'createdBy',
      key: 'createdBy',
      render: (text: string | undefined) => text || 'Unknown',
    },
    {
      title: '',
      key: 'action',
      render: (_: any, record: Note) => (
        <Dropdown
          overlay={
            <Menu>
              <Menu.Item
                key="1"
                onClick={(info) => {
                  info.domEvent.stopPropagation(); // Prevents the row's onClick from being triggered
                  handleEdit(record);
                }}
              >
                Edit
              </Menu.Item>
              <Menu.Item
                key="2"
                onClick={(info) => {
                  info.domEvent.stopPropagation(); // Prevents the row's onClick from being triggered
                  handleDelete(record);
                }}
              >
                Delete
              </Menu.Item>
              <Menu.Item
                key="3"
                onClick={(info) => {
                  info.domEvent.stopPropagation(); // Prevents the row's onClick from being triggered
                  handleView(record);
                }}
              >
                View
              </Menu.Item>
            </Menu>
          }
          trigger={['click']}
        >
          {/* Prevent event propagation on the Dropdown button */}
          <Button
            type="text"
            icon={<MoreOutlined />}
            onClick={(e) => {
              e.stopPropagation(); // Prevents the row's onClick from being triggered
            }}
          />
        </Dropdown>
      ),
    },
  ];

  if (!currentUser) {
    return <div>Please log in to view and add notes.</div>;
  }

  return (
    <div className="task-notes-page">
      {/* Add New Note Section */}
      <Card className="new-note-card" title="Add a New Note" size="small">
        <TextArea
          rows={4}
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Type your note here..."
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={handleAddNote}
          className="add-note-button"
          style={{ marginTop: '10px' }}
        >
          Add Note
        </Button>
      </Card>

      {/* Notes History Table */}
      <Card className="notes-table-card" title="Notes History" size="small" >
        <Table 
          columns={columns} 
          dataSource={notes} 
          rowKey="id"
          pagination={{ pageSize: 10 }}
          className="notes-history-table"
          onRow={(record) => ({
            onClick: () => handleView(record),
          })}
          rowClassName="clickable-row"
          loading={loading} // Show loading indicator
        />
      </Card>

      {/* View Note Modal */}
      <Modal
        title={<Title level={4}>Note Details</Title>}
        visible={isViewModalVisible}
        onCancel={handleModalClose}
        footer={[
          <Button key="close" onClick={handleModalClose}>
            Close
          </Button>,
        ]}
        width={700}
        bodyStyle={{ maxHeight: '80vh', overflow: 'auto' }}
      >
        {selectedNote && (
          <Typography>
            <Paragraph>
              <Text strong>Created At: </Text>
              <Text>{selectedNote.createdAt ? selectedNote.createdAt.toDate().toLocaleDateString() : 'N/A'}</Text>
            </Paragraph>
            <Paragraph>
              <Text strong>Created By: </Text>
              <Text>{selectedNote.createdBy}</Text>
            </Paragraph>
            <Paragraph>
              <Text strong>Content:</Text>
            </Paragraph>
            <Paragraph
              style={{
                border: '1px solid #d9d9d9',
                borderRadius: '4px',
                padding: '16px',
                backgroundColor: '#f5f5f5',
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word'
              }}
            >
              {selectedNote.content}
            </Paragraph>
          </Typography>
        )}
      </Modal>

      {/* Edit Note Modal */}
      <Modal
        title={<Title level={4}>Edit Note</Title>}
        visible={isEditModalVisible}
        onCancel={handleEditModalClose}
        footer={[
          <Button key="cancel" onClick={handleEditModalClose}>
            Cancel
          </Button>,
          <Button key="save" type="primary" onClick={handleUpdateNote}>
            Save Changes
          </Button>,
        ]}
        width={700}
        bodyStyle={{ maxHeight: '80vh', overflow: 'auto' }}
      >
        {selectedNote && (
          <Typography>
            <Paragraph>
              <Text strong>Created At: </Text>
              <Text>{selectedNote.createdAt ? selectedNote.createdAt.toDate().toLocaleDateString() : 'N/A'}</Text>
            </Paragraph>
            <Paragraph>
              <Text strong>Created By: </Text>
              <Text>{selectedNote.createdBy}</Text>
            </Paragraph>
            <Paragraph>
              <Text strong>Edit Content:</Text>
            </Paragraph>
            <TextArea
              rows={6}
              value={editNoteContent}
              onChange={(e) => setEditNoteContent(e.target.value)}
              placeholder="Edit your note here..."
            />
          </Typography>
        )}
      </Modal>
    </div>
  );
};

export default TaskNotesPage;
