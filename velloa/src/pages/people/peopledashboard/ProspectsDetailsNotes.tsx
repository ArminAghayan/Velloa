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
import { db } from '../../../firebase-config';
import './ProspectsDetailsNotes.css';

const { TextArea } = Input;
const { Title, Text, Paragraph } = Typography;
const { confirm } = Modal;

interface Note {
  id: string;
  content?: string;
  createdAt?: Timestamp;
  createdBy?: string;
}

interface ProspectsDetailsNotesProps {
  personId: string; // Made personId required
}

const ProspectsDetailsNotes: React.FC<ProspectsDetailsNotesProps> = ({ personId }) => {
  const [newNote, setNewNote] = useState('');
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editNoteContent, setEditNoteContent] = useState('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      console.log('Authentication State Changed:', user);
      if (user) {
        fetchUserName(user.uid);
      } else {
        setUserName('');
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
        console.log('Fetched User Name:', fullName);
      } else {
        setUserName('Unknown User');
        console.log('User document does not exist.');
      }
    } catch (error) {
      console.error('Error fetching user name:', error);
      message.error('Failed to fetch user information.');
      setUserName('Unknown User');
    }
  };

  useEffect(() => {
    if (personId && currentUser) {
      console.log('Fetching notes for personId:', personId);
      fetchNotes();
    }
  }, [personId, currentUser]); // Ensures fetchNotes runs when personId or currentUser changes

  const fetchNotes = async () => {
    if (!personId) {
      message.error('No person selected.');
      return;
    }
    setLoading(true);
    try {
      const notesRef = collection(db, 'people', personId, 'notes');
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
      console.log('Fetched Notes:', fetchedNotes);
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
    if (!currentUser) {
      message.error('You must be logged in to add a note.');
      return;
    }

    try {
      const notesRef = collection(db, 'people', personId, 'notes');
      const newNoteObj = {
        content: newNote.trim(),
        createdAt: Timestamp.now(),
        createdBy: userName || currentUser.email || 'Unknown User',
      };
      await addDoc(notesRef, newNoteObj);
      message.success('Note added successfully');
      setNewNote('');
      await fetchNotes();
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
    if (!selectedNote) {
      message.error('Invalid note.');
      return;
    }

    if (!editNoteContent.trim()) {
      message.error('Note content cannot be empty.');
      return;
    }

    try {
      const noteDocRef = doc(db, 'people', personId, 'notes', selectedNote.id);
      await updateDoc(noteDocRef, {
        content: editNoteContent.trim(),
        // Optionally, update the updatedAt timestamp
        updatedAt: Timestamp.now(),
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
        try {
          const noteDocRef = doc(db, 'people', personId, 'notes', record.id);
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
                  info.domEvent.stopPropagation();
                  handleEdit(record);
                }}
              >
                Edit
              </Menu.Item>
              <Menu.Item
                key="2"
                onClick={(info) => {
                  info.domEvent.stopPropagation();
                  handleDelete(record);
                }}
              >
                Delete
              </Menu.Item>
              <Menu.Item
                key="3"
                onClick={(info) => {
                  info.domEvent.stopPropagation();
                  handleView(record);
                }}
              >
                View
              </Menu.Item>
            </Menu>
          }
          trigger={['click']}
        >
          <Button
            type="text"
            icon={<MoreOutlined />}
            onClick={(e) => {
              e.stopPropagation();
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
    <div className="prospects-notes-page">
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
          loading={loading}
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

export default ProspectsDetailsNotes;