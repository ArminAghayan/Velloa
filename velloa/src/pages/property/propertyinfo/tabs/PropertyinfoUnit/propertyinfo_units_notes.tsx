import React, { useState, useEffect } from 'react';
import { 
  Input, 
  Button, 
  Table, 
  Typography, 
  message, 
  Modal, 
  Dropdown, 
  Menu,
  Row,
  Col,
  Form,
  Select,
  Tag,
  Skeleton,
} from 'antd';
import { 
  PlusOutlined, 
  MoreOutlined, 
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  UploadOutlined
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
  Timestamp,
} from 'firebase/firestore';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { db } from '../../../../../firebase-config';
import './propertyinfo_units_notes.css';

const { TextArea } = Input;
const { Title, Text, Paragraph } = Typography;
const { confirm } = Modal;
const { Option } = Select;

interface Note {
  id: string;
  title: string;
  content: string;
  tags?: string[];
  createdAt?: Timestamp;
  createdBy?: string;
  attachments?: string[];
  companyId?: string;
}

interface PropertyUnitNotesProps {
  propertyId: string;
  unitId: string;
}

const PropertyUnitNotes: React.FC<PropertyUnitNotesProps> = ({ propertyId, unitId }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editNoteContent, setEditNoteContent] = useState('');
  const [loading, setLoading] = useState<boolean>(false);
  const [searchText, setSearchText] = useState('');
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  const fetchNoteTags = async (companyId: string) => {
    try {
      const noteTagsDoc = await getDoc(doc(db, 'companies', companyId, 'settings', 'notetags'));
      if (noteTagsDoc.exists()) {
        const tags = noteTagsDoc.data().tags || [];
        setAvailableTags(tags.map((tag: any) => tag.name));
      }
    } catch (error) {
      console.error('Error fetching note tags:', error);
    }
  };

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        fetchUserName(user.uid);
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const companyId = userDoc.data().companyuid;
          if (companyId) {
            fetchNoteTags(companyId);
          }
        }
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
    if (propertyId && unitId && currentUser) {
      fetchNotes();
    }
  }, [propertyId, unitId, currentUser]);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const notesRef = collection(db, 'properties', propertyId, 'units', unitId, 'notes');
      const q = query(notesRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const fetchedNotes = querySnapshot.docs.map(docSnapshot => ({
        id: docSnapshot.id,
        title: docSnapshot.data().title || '',
        content: docSnapshot.data().content || 'No content available.',
        tags: docSnapshot.data().tags || [],
        createdAt: docSnapshot.data().createdAt || Timestamp.fromDate(new Date()),
        createdBy: docSnapshot.data().createdBy || 'Unknown',
        companyId: docSnapshot.data().companyId || docSnapshot.data().companyuid,
      })) as Note[];
      setNotes(fetchedNotes);
    } catch (error) {
      console.error('Error fetching notes:', error);
      message.error('Failed to fetch notes. Please try again.');
    } finally {
      setLoading(false);
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
      const noteDocRef = doc(db, 'properties', propertyId, 'units', unitId, 'notes', selectedNote.id);
      await updateDoc(noteDocRef, {
        content: editNoteContent.trim(),
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
          const noteDocRef = doc(db, 'properties', propertyId, 'units', unitId, 'notes', record.id);
          await deleteDoc(noteDocRef);
          message.success('Note deleted successfully');
          await fetchNotes();
        } catch (error) {
          console.error('Error deleting note:', error);
          message.error('Failed to delete note. Please try again.');
        }
      },
    });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchText(value);
    
    const lowercasedSearch = value.toLowerCase();
    const filtered = notes.filter(note => {
      const contentMatch = note.content?.toLowerCase().includes(lowercasedSearch);
      const createdByMatch = note.createdBy?.toLowerCase().includes(lowercasedSearch);
      return contentMatch || createdByMatch;
    });
    setFilteredNotes(filtered);
  };

  const handleNewNoteClick = () => {
    setIsModalVisible(true);
  };

  useEffect(() => {
    setFilteredNotes(notes);
  }, [notes]);

  const handleFormSubmit = async (values: any) => {
    try {
      const propertyDoc = await getDoc(doc(db, 'properties', propertyId));
      if (!propertyDoc.exists()) {
        message.error('Property not found');
        return;
      }

      const companyuid = propertyDoc.data().companyuid;

      if (!companyuid) {
        message.error('Company ID not found');
        return;
      }

      const newNote = {
        title: values.title,
        content: values.content,
        tags: values.tags || [],
        createdAt: Timestamp.now(),
        createdBy: userName || currentUser?.email || 'Unknown User',
        companyId: companyuid,
      };

      const notesRef = collection(db, 'properties', propertyId, 'units', unitId, 'notes');
      await addDoc(notesRef, newNote);
      message.success('Note added successfully');
      setIsModalVisible(false);
      form.resetFields();
      await fetchNotes();
    } catch (error) {
      console.error('Error adding note:', error);
      message.error('Failed to add note. Please try again.');
    }
  };

  const renderSkeletonRow = () => (
    <div style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
      <Row gutter={16} align="middle">
        <Col flex="1">
          <Skeleton.Input style={{ width: '100%' }} active size="small" />
          <div style={{ marginTop: 8 }}>
            <Skeleton.Input style={{ width: '60%' }} active size="small" />
          </div>
        </Col>
        <Col style={{ width: 200 }}>
          <Skeleton.Input style={{ width: '80%' }} active size="small" />
        </Col>
        <Col style={{ width: 150 }}>
          <Skeleton.Input style={{ width: '80%' }} active size="small" />
        </Col>
        <Col style={{ width: 200 }}>
          <Skeleton.Input style={{ width: '80%' }} active size="small" />
        </Col>
        <Col style={{ width: 80 }}>
          <Skeleton.Button active size="small" />
        </Col>
      </Row>
    </div>
  );

  if (!currentUser) {
    return <div>Please log in to view and add notes.</div>;
  }

  return (
    <div className="unit-notes-container">
      <div className="unit-notes-box">
        <Row gutter={16} justify="space-between" align="middle" style={{ marginBottom: '16px' }}>
          <Col xs={24} sm={24} md={12} lg={12}>
            <Row gutter={16} wrap={false}>
              <Col>
                <Input
                  className='unit-notes-search-input'
                  placeholder="Search notes"
                  value={searchText}
                  onChange={handleSearchChange}
                />
              </Col>
            </Row>
          </Col>
          <Col 
            xs={24} 
            sm={24} 
            md={12} 
            lg={12} 
            style={{ 
              textAlign: 'right',
              marginTop: 16
            }}
            className="new-note-button-container"
          >
            <Button
              className='unit-notes-new-note-button'
              onClick={handleNewNoteClick}
              type="default"
              icon={<PlusOutlined />}
            >
              Add New
            </Button>
          </Col>
        </Row>
        <Table
          columns={[
            {
              title: 'Note',
              dataIndex: 'content',
              key: 'content',
              render: (text: string) => loading ? (
                <Skeleton.Input style={{ width: '100%' }} active size="small" />
              ) : (
                <Typography.Paragraph
                  ellipsis={{ rows: 2 }}
                  style={{ marginBottom: 0 }}
                >
                  {text}
                </Typography.Paragraph>
              )
            },
            {
              title: 'Tags',
              dataIndex: 'tags',
              key: 'tags',
              width: 200,
              render: (tags: string[]) => loading ? (
                <Skeleton.Input style={{ width: '80%' }} active size="small" />
              ) : (
                <span>
                  {tags?.map((tag) => (
                    <Tag key={tag} color="blue" style={{ marginBottom: '4px' }}>
                      {tag}
                    </Tag>
                  ))}
                </span>
              )
            },
            {
              title: 'Created At',
              dataIndex: 'createdAt',
              key: 'createdAt',
              width: 150,
              render: (timestamp: Timestamp) => loading ? (
                <Skeleton.Input style={{ width: '80%' }} active size="small" />
              ) : (
                timestamp?.toDate().toLocaleDateString() || 'N/A'
              )
            },
            {
              title: 'Created By',
              dataIndex: 'createdBy',
              key: 'createdBy',
              width: 200,
              render: (text: string) => loading ? (
                <Skeleton.Input style={{ width: '80%' }} active size="small" />
              ) : text
            },
            {
              title: '',
              key: 'action',
              width: 80,
              render: (_: any, record: Note) => loading ? (
                <Skeleton.Button active size="small" />
              ) : (
                <Dropdown
                  overlay={
                    <Menu>
                      <Menu.Item 
                        key="1" 
                        onClick={(e) => {
                          e.domEvent.stopPropagation();
                          handleEdit(record);
                        }}
                      >
                        Edit
                      </Menu.Item>
                      <Menu.Item 
                        key="2" 
                        onClick={(e) => {
                          e.domEvent.stopPropagation();
                          handleDelete(record);
                        }}
                      >
                        Delete
                      </Menu.Item>
                    </Menu>
                  }
                  trigger={['click']}
                >
                  <Button
                    type="text"
                    icon={<MoreOutlined />}
                    onClick={e => e.stopPropagation()}
                  />
                </Dropdown>
              )
            }
          ]}
          dataSource={loading ? Array(5).fill({}) : filteredNotes}
          rowKey={loading ? 
            ((record: any, index?: number) => `loading-${index}`) : 
            'id'
          }
          pagination={{ 
            pageSize: 10,
            showSizeChanger: false 
          }}
          onRow={(record) => ({
            onClick: () => !loading && handleView(record),
            style: { cursor: loading ? 'default' : 'pointer' }
          })}
        />
      </div>

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
              <Text strong>Title: </Text>
              <Text>{selectedNote.title}</Text>
            </Paragraph>
            <Paragraph style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Text strong>Tags: </Text>
              <span>
                {selectedNote.tags?.length ? 
                  selectedNote.tags.map((tag) => (
                    <Tag key={tag} color="blue" style={{ marginRight: '4px' }}>
                      {tag}
                    </Tag>
                  ))
                  : 
                  <Text type="secondary">No tags</Text>
                }
              </span>
            </Paragraph>
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

      <Modal
        className="new-note-drawer"
        title={
          <Typography.Title level={5} style={{ margin: 0 }}>
            Create New Note
          </Typography.Title>
        }
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsModalVisible(false)}>
            Cancel
          </Button>,
          <Button key="submit" type="primary" onClick={() => form.submit()}>
            Save
          </Button>,
        ]}
        width={600}
      >
        <div style={{ marginBottom: '24px' }}>
          <Typography.Link 
            href="https://velloaapp.com" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              color: 'rgba(0, 0, 0, 0.45)',
              textDecoration: 'underline'
            }}
          >
            <InfoCircleOutlined />
            Learn about creating and editing notes
          </Typography.Link>
        </div>

        <Form 
          form={form} 
          onFinish={handleFormSubmit} 
          layout="vertical"
        >
          <Form.Item
            name="title"
            rules={[{ required: true, message: 'Please enter a title' }]}
          >
            <Input 
              placeholder="What's your note's title?" 
            />
          </Form.Item>

          <Form.Item
            name="content"
            rules={[{ required: true, message: 'Please enter note content' }]}
          >
            <TextArea
              placeholder="Write your note..."
              rows={6}
            />
          </Form.Item>

          <Form.Item name="tags">
            <Select
              mode="multiple"
              placeholder="Select Tags"
              style={{ width: '100%', marginBottom: '16px' }}
              dropdownStyle={{ padding: '8px' }}
              className="unit-notes-tag-select"
            >
              {availableTags.map(tag => (
                <Option key={tag} value={tag}>{tag}</Option>
              ))}
            </Select>
          </Form.Item>

          <div 
            style={{ 
              border: '1px dashed #d9d9d9',
              borderRadius: '2px',
              padding: '20px',
              textAlign: 'center',
              background: '#fafafa',
              marginTop: '16px'
            }}
          >
            <Typography.Text type="secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <UploadOutlined />
              Drag files or <Typography.Link>Click here</Typography.Link> to upload
            </Typography.Text>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default PropertyUnitNotes;