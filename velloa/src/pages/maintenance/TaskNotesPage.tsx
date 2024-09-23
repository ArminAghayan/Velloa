import React, { useState } from 'react';
import { Input, Button, Table, Card, Typography } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import './TaskNotesPage.css';

const { TextArea } = Input;
const { Title } = Typography;

interface Note {
  key: string;
  content: string;
  createdAt: string;
  createdBy: string;
}

const TaskNotesPage: React.FC = () => {
  const [newNote, setNewNote] = useState('');
  const [notes, setNotes] = useState<Note[]>([]);

  const handleAddNote = () => {
    if (newNote.trim()) {
      const newNoteObj: Note = {
        key: Date.now().toString(),
        content: newNote,
        createdAt: new Date().toLocaleString(),
        createdBy: 'Current User', // Replace with actual user name
      };
      setNotes([newNoteObj, ...notes]);
      setNewNote('');
    }
  };

  const columns = [
    {
      title: 'Note',
      dataIndex: 'content',
      key: 'content',
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
    },
    {
      title: 'Created By',
      dataIndex: 'createdBy',
      key: 'createdBy',
    },
  ];

  return (
    <div className="task-notes-page">
      <Card className="new-note-card">
        <Title level={5}>Add a New Note</Title>
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
        >
          Add Note
        </Button>
      </Card>

      <Card className="notes-table-card">
        <Title level={5}>Notes History</Title>
        <Table columns={columns} dataSource={notes} pagination={false} />
      </Card>
    </div>
  );
};

export default TaskNotesPage;