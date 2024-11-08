import React, { useEffect, useState, useCallback } from 'react';
import { Table, message, Button, Row, Col, Modal, Form, Input, Select, Dropdown, Menu, Spin } from 'antd';
import { MenuInfo } from 'rc-menu/lib/interface';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../../../firebase-config';
import { PlusOutlined, MoreOutlined, LoadingOutlined } from '@ant-design/icons';
import { v4 as uuidv4 } from 'uuid';
import './propertyinfo_notes.css';

const { Option } = Select;

export interface Note {
  noteId: string;
  title: string;
  content: string;
  category: string;
  createdAt: Date;
  unitID: string;
}

interface NotesTableProps {
  propertyId: string;
}

const NotesTable: React.FC<NotesTableProps> = ({ propertyId }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [viewNoteModalVisible, setViewNoteModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch notes from Firestore
  const fetchNotes = useCallback(async () => {
    setLoading(true);
    const notesRef = collection(db, 'properties', propertyId, 'notes'); // Updated path to /properties/{propertyId}/notes
    try {
      const notesSnapshot = await getDocs(notesRef);
      const fetchedNotes: Note[] = notesSnapshot.docs.map(doc => ({
        ...(doc.data() as Note),
        noteId: doc.id,
        createdAt: doc.data().createdAt.toDate(),
      }));
      setNotes(fetchedNotes);
      setFilteredNotes(fetchedNotes);
    } catch (error) {
      console.error("Error fetching notes: ", error);
      message.error("Failed to fetch notes. Please check your permissions.");
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  useEffect(() => {
    handleFilter();
  }, [searchText, filterCategory, notes]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };

  const handleFilterChange = (value: string) => {
    setFilterCategory(value);
  };

  const handleFilter = useCallback(() => {
    let filtered = notes;
    if (searchText) {
      filtered = filtered.filter(note =>
        note.title.toLowerCase().includes(searchText.toLowerCase()) ||
        note.content.toLowerCase().includes(searchText.toLowerCase())
      );
    }
    if (filterCategory) {
      filtered = filtered.filter(note => note.category === filterCategory);
    }
    setFilteredNotes(filtered);
  }, [notes, searchText, filterCategory]);

  // Handle note actions (view, edit, delete)
  const handleMenuClick = (e: MenuInfo, note: Note) => {
    e.domEvent.stopPropagation(); // Prevent row click from firing

    if (e.key === 'view') {
      setSelectedNote(note);
      setViewNoteModalVisible(true); // Open view modal
    } else if (e.key === 'edit') {
      setSelectedNote(note);
      setModalVisible(true); // Open edit modal
      form.setFieldsValue({ title: note.title, content: note.content, category: note.category });
    } else if (e.key === 'delete') {
      handleDelete(note);
    }
  };

  const handleDelete = async (note: Note) => {
    try {
      const noteDocRef = doc(db, 'properties', propertyId, 'notes', note.noteId); // Updated path to /properties/{propertyId}/notes
      await deleteDoc(noteDocRef);
      setNotes(prevNotes => prevNotes.filter(n => n.noteId !== note.noteId));
      setFilteredNotes(prevFiltered => prevFiltered.filter(n => n.noteId !== note.noteId));
      message.success('Note deleted successfully');
    } catch (error) {
      console.error("Error deleting note: ", error);
      message.error(`Failed to delete note: ${(error as Error).message || 'Unknown error'}`);
    }
  };

  // Handle row click to view a note
  const handleRowClick = (record: Note) => {
    setSelectedNote(record);
    setViewNoteModalVisible(true);
  };

  // Columns for the table with the "more actions" button
  const columns = [
    { title: 'Title', dataIndex: 'title', key: 'title' },
    { title: 'Category', dataIndex: 'category', key: 'category' },
    { 
      title: 'Created At', 
      dataIndex: 'createdAt', 
      key: 'createdAt',
      render: (date: Date) => date.toLocaleDateString(),
    },
    {
      title: '',
      key: 'action',
      render: (note: Note) => (
        <Dropdown
          overlay={
            <Menu onClick={(e) => handleMenuClick(e, note)}>
              <Menu.Item key="view">View</Menu.Item>
              <Menu.Item key="edit">Edit</Menu.Item>
              <Menu.Item key="delete">Delete</Menu.Item>
            </Menu>
          }
          trigger={['click']}
        >
          {/* Stop event propagation when clicking the button */}
          <Button icon={<MoreOutlined />} onClick={(e) => e.stopPropagation()} />
        </Dropdown>
      ),
    },
  ];

  const handleNewNoteClick = () => {
    setSelectedNote(null);  // Clear selectedNote when adding a new note
    setModalVisible(true);
    form.resetFields();
  };

  const handleModalClose = () => {
    setModalVisible(false);
    form.resetFields();
  };

  const handleFormSubmit = async () => {
    try {
      setSubmitting(true);
      const values = await form.validateFields();
      const newNote: Note = {
        noteId: uuidv4(),
        title: values.title,
        content: values.content,
        category: values.category,
        createdAt: new Date(),
        unitID: propertyId,
      };

      const notesRef = collection(db, 'properties', propertyId, 'notes'); // Updated path to /properties/{propertyId}/notes
      const docRef = await addDoc(notesRef, newNote);
      await updateDoc(docRef, { noteId: docRef.id });

      newNote.noteId = docRef.id;

      setNotes(prevNotes => [...prevNotes, newNote]);
      setFilteredNotes(prevFiltered => [...prevFiltered, newNote]);
      message.success('Note added successfully');
      handleModalClose();
    } catch (error) {
      console.error("Error adding note: ", error);
      message.error(`Failed to add note: ${(error as Error).message || 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="notes-container">
      <Row gutter={16} justify="space-between" align="middle" style={{ marginBottom: '16px' }}>
        <Col xs={24} sm={24} md={12} lg={12}>
          <Row gutter={16} wrap={false}>
            <Col>
              <Input
                placeholder="Search notes"
                className='note-search-input'
                value={searchText}
                onChange={handleSearchChange}
              />
            </Col>
            <Col>
              <Select
                placeholder="Filter by category"
                onChange={handleFilterChange}
                allowClear
                className='note-dropdown-input'
                style={{ width: 150 }}
              >
                <Option value="General">General</Option>
                <Option value="Maintenance">Maintenance</Option>
                <Option value="Financial">Financial</Option>
                <Option value="Other">Other</Option>
              </Select>
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
            onClick={handleNewNoteClick} 
            className='new-note-button'
            type="default" 
            icon={<PlusOutlined />}
          >
            Add New
          </Button>
        </Col>
      </Row>

      <Table
        columns={columns}
        dataSource={filteredNotes}
        loading={{
          spinning: loading,
          indicator: <Spin indicator={<LoadingOutlined spin />} size="large" />
        }}
        rowKey="noteId"
        onRow={(record) => ({
          onClick: () => handleRowClick(record),
        })}
      />

      {/* Add or Edit Note Modal */}
      <Modal
        title={selectedNote ? 'Edit Note' : 'Add New Note'}
        visible={modalVisible}
        onCancel={handleModalClose}
        footer={null}
        width={800}
      >
        <Form 
          form={form} 
          layout="vertical" 
          onFinish={handleFormSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="title"
                label="Title"
                rules={[{ required: true, message: 'Please enter the note title' }]}
              >
                <Input className="notes-table-input" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="category"
                label="Category"
                rules={[{ required: true, message: 'Please select a category' }]}
              >
                <Select className="notes-table-dropdown-input">
                  <Option value="General">General</Option>
                  <Option value="Maintenance">Maintenance</Option>
                  <Option value="Financial">Financial</Option>
                  <Option value="Other">Other</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="content"
            label="Content"
            rules={[
              { required: true, message: 'Please enter the note content' },
              { whitespace: true, message: 'Content cannot be empty' },
            ]}
          >
            <Input.TextArea rows={6} />
          </Form.Item>

          {/* Wrap button in its own row to ensure it's aligned to the right */}
          <Row justify="end">
            <Col>
              <Form.Item className="notes-table-button-container">
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  className="notes-table-add-button"
                  loading={submitting}
                >
                  {selectedNote ? 'Update Note' : 'Add Note'}
                </Button>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* View Note Modal */}
      {selectedNote && (
        <Modal
          title="View Note"
          visible={viewNoteModalVisible}
          onCancel={() => setViewNoteModalVisible(false)}
          footer={null}
          width={600}
        >
          <p><strong>Title:</strong> {selectedNote.title}</p>
          <p><strong>Category:</strong> {selectedNote.category}</p>
          <p><strong>Content:</strong> {selectedNote.content}</p>
        </Modal>
      )}
    </div>
  );
};

export default NotesTable;
