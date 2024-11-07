import React, { useState, useEffect } from 'react';
import { 
  Input, 
  Button, 
  Table, 
  Typography, 
  notification,
  Modal, 
  Dropdown, 
  Menu,
  Row,
  Col,
  Form,
  Select,
  Tag,
  Upload,
  UploadFile as AntUploadFile,
  Space,
} from 'antd';
import { 
  PlusOutlined, 
  MoreOutlined, 
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  UploadOutlined,
  LoadingOutlined,
  FileOutlined,
  EditOutlined,
  DeleteOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  FileImageOutlined,
  PlaySquareOutlined,
  PaperClipOutlined,
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
  setDoc,
} from 'firebase/firestore';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { db } from '../../../../../firebase-config';
import './propertyinfo_units_notes.css';
import { RcFile, UploadChangeParam } from 'antd/es/upload/interface';
import { v4 as uuidv4 } from 'uuid';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../../../../../firebase-config';

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

interface CustomUploadFile extends AntUploadFile<any> {
  originFileObj?: RcFile;
}

interface NoteTag {
  name: string;
  createdAt: string;
  id: string;
}

// Helper function to get a friendly file type name
const getFileType = (file: File): string => {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  
  // Document types
  if (extension === 'doc' || extension === 'docx') return 'Word Document';
  if (extension === 'pdf') return 'PDF Document';
  if (['xls', 'xlsx'].includes(extension)) return 'Excel Spreadsheet';
  if (['ppt', 'pptx'].includes(extension)) return 'PowerPoint';
  if (extension === 'txt') return 'Text Document';

  // Image types
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension)) {
    return `Image (${extension.toUpperCase()})`;
  }

  // Video types
  if (['mp4', 'mov', 'avi', 'wmv'].includes(extension)) {
    return `Video (${extension.toUpperCase()})`;
  }

  return `File (${extension.toUpperCase()})`;
};

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
  const [fileList, setFileList] = useState<CustomUploadFile[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingName, setEditingName] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [totalProgress, setTotalProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState(0);
  const [fileData, setFileData] = useState<{ [key: string]: any }>({});
  const [filterType, setFilterType] = useState('');
  const [availableNoteTags, setAvailableNoteTags] = useState<NoteTag[]>([]);

  const fetchNoteTags = async (companyId: string) => {
    try {
      console.log('Fetching note tags for company:', companyId);
      
      const noteTagsDoc = await getDoc(doc(db, 'companies', companyId, 'settings', 'notetags'));
      console.log('Note tags doc exists:', noteTagsDoc.exists());
      
      if (noteTagsDoc.exists()) {
        const data = noteTagsDoc.data();
        console.log('Raw note tags data:', data);
        
        // Convert the numbered objects into an array
        const tags = data?.tags ? Object.values(data.tags) : [];
        
        // Validate tags before setting them
        const validTags = tags.filter((tag: any) => 
          tag && 
          typeof tag === 'object' && 
          typeof tag.name === 'string'
        ) as NoteTag[];
        
        console.log('Validated note tags:', validTags);
        setAvailableNoteTags(validTags);

        if (validTags.length === 0) {
          notification.info({
            message: 'No Tags Available',
            description: 'No note tags have been configured for your company.',
            placement: 'topRight'
          });
        }
      } else {
        notification.info({
          message: 'No Tags Available',
          description: 'No note tags have been configured for your company.',
          placement: 'topRight'
        });
        setAvailableNoteTags([]);
      }
    } catch (error) {
      console.error('Error fetching note tags:', error);
      notification.error({
        message: 'Error',
        description: 'Failed to fetch note tags.',
        placement: 'topRight'
      });
      setAvailableNoteTags([]);
    }
  };

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed, user:', user?.uid);
      
      setCurrentUser(user);
      if (user) {
        fetchUserName(user.uid);
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          console.log('User doc exists:', userDoc.exists());
          
          if (userDoc.exists()) {
            const companyId = userDoc.data().companyuid;
            console.log('Company ID from user doc:', companyId);
            
            if (companyId) {
              await fetchNoteTags(companyId);
            } else {
              console.error('No company ID found for user');
            }
          }
        } catch (error) {
          console.error('Error fetching user doc:', error);
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
      notification.error({
        message: 'Error',
        description: 'Failed to fetch user information.',
        placement: 'topRight'
      });
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

      // Fetch file data for notes with attachments
      const allFileIds = fetchedNotes.flatMap(note => note.attachments || []);
      if (allFileIds.length > 0) {
        const fileData = await fetchFileData(allFileIds);
        setFileData(fileData);
      }

      setNotes(fetchedNotes);
      setFilteredNotes(fetchedNotes);
    } catch (error) {
      console.error('Error fetching notes:', error);
      notification.error({
        message: 'Error',
        description: 'Failed to fetch notes. Please try again.',
        placement: 'topRight'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchFileData = async (fileIds: string[]) => {
    const fileData: { [key: string]: any } = {};
    await Promise.all(
      fileIds.map(async (fileId) => {
        try {
          const fileDoc = await getDoc(doc(db, 'properties', propertyId, 'units', unitId, 'files', fileId));
          if (fileDoc.exists()) {
            fileData[fileId] = fileDoc.data();
          }
        } catch (error) {
          console.error('Error fetching file:', error);
        }
      })
    );
    return fileData;
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
      notification.error({
        message: 'Error',
        description: 'Invalid note.',
        placement: 'topRight'
      });
      return;
    }

    if (!editNoteContent.trim()) {
      notification.error({
        message: 'Error',
        description: 'Note content cannot be empty.',
        placement: 'topRight'
      });
      return;
    }

    try {
      const noteDocRef = doc(db, 'properties', propertyId, 'units', unitId, 'notes', selectedNote.id);
      await updateDoc(noteDocRef, {
        title: form.getFieldValue('editTitle'),
        content: editNoteContent.trim(),
        tags: form.getFieldValue('editTags') || [],
      });
      notification.success({
        message: 'Success',
        description: 'Note updated successfully',
        placement: 'topRight'
      });
      handleEditModalClose();
      await fetchNotes();
    } catch (error) {
      console.error('Error updating note:', error);
      notification.error({
        message: 'Error',
        description: 'Failed to update note. Please try again.',
        placement: 'topRight'
      });
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
          notification.success({
            message: 'Success',
            description: 'Note deleted successfully',
            placement: 'topRight'
          });
          await fetchNotes();
        } catch (error) {
          console.error('Error deleting note:', error);
          notification.error({
            message: 'Error',
            description: 'Failed to delete note. Please try again.',
            placement: 'topRight'
          });
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
        notification.error({
          message: 'Error',
          description: 'Property not found',
          placement: 'topRight'
        });
        return;
      }

      const companyuid = propertyDoc.data().companyuid;
      if (!companyuid) {
        notification.error({
          message: 'Error',
          description: 'Company ID not found',
          placement: 'topRight'
        });
        return;
      }

      // Array to store file IDs
      const fileIds: string[] = [];

      // First upload all files and collect their IDs
      if (fileList.length > 0) {
        const totalFiles = fileList.length;
        setUploadedFiles(0);
        setTotalProgress(0);

        // Upload each file
        await Promise.all(fileList.map(async (fileItem, index) => {
          const file = fileItem.originFileObj;
          if (!file) return;

          const fileName = fileItem.name;
          const storageFileName = `${uuidv4()}-${fileName}`;
          const storageRef = ref(storage, `properties/${propertyId}/units/${unitId}/files/${storageFileName}`);
          
          const metadata = {
            customMetadata: {
              uploadedBy: currentUser?.uid || 'unknown',
              uploadedByEmail: currentUser?.email || 'unknown',
              companyId: companyuid
            }
          };
          
          const uploadTask = uploadBytesResumable(storageRef, file, metadata);

          await new Promise((resolve, reject) => {
            uploadTask.on('state_changed',
              (snapshot) => {
                const fileProgress = (snapshot.bytesTransferred / snapshot.totalBytes);
                const combinedProgress = ((index + fileProgress) / totalFiles) * 100;
                setTotalProgress(combinedProgress);
              },
              (error) => {
                reject(error);
              },
              async () => {
                try {
                  const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                  
                  // Save file info to files collection
                  const newFile = {
                    fileName: fileName,
                    fileType: getFileType(file),
                    uploadDate: Timestamp.now(),
                    size: Math.round((file.size / 1024) * 100) / 100,
                    uploadedBy: currentUser?.uid || 'unknown',
                    uploadedByName: userName || currentUser?.email || 'Unknown User',
                    fileUrl: downloadURL,
                    companyId: companyuid
                  };

                  // Add file document and get its ID
                  const fileRef = await addDoc(collection(db, 'properties', propertyId, 'units', unitId, 'files'), newFile);
                  fileIds.push(fileRef.id); // Store the file ID
                  
                  setUploadedFiles(prev => prev + 1);
                  resolve(null);
                } catch (error) {
                  reject(error);
                }
              }
            );
          });
        }));

        setTotalProgress(0);
        setUploadedFiles(0);
      }

      // Then create the note with the file IDs
      const newNote = {
        title: values.title,
        content: values.content,
        tags: values.tags || [],
        createdAt: Timestamp.now(),
        createdBy: userName || currentUser?.email || 'Unknown User',
        companyId: companyuid,
        attachments: fileIds // Add the file IDs to the note
      };

      // Add the note
      await addDoc(collection(db, 'properties', propertyId, 'units', unitId, 'notes'), newNote);

      notification.success({
        message: 'Success',
        description: 'Note and files added successfully',
        placement: 'topRight'
      });
      setIsModalVisible(false);
      form.resetFields();
      setFileList([]);
      await fetchNotes();

    } catch (error) {
      console.error('Error adding note and files:', error);
      notification.error({
        message: 'Error',
        description: 'Failed to add note and files. Please try again.',
        placement: 'topRight'
      });
      setTotalProgress(0);
      setUploadedFiles(0);
    }
  };

  const getFileExtension = (filename: string): string => {
    return filename.split('.').pop()?.toLowerCase() || '';
  };

  const isFileTypeAllowed = (file: File): boolean => {
    if (file.size > 50 * 1024 * 1024) { // 50MB
      notification.error({
        message: 'File Too Large',
        description: `File ${file.name} is too large. Maximum size is 50MB`,
        placement: 'topRight'
      });
      return false;
    }

    const extension = getFileExtension(file.name);
    const allAllowedTypes = [
      'doc', 'docx', 'pdf', 'xls', 'xlsx',
      'jpg', 'jpeg', 'png', 'gif', 'svg',
      'mp4', 'webm', 'avi', 'wmv'
    ];
    
    if (!allAllowedTypes.includes(extension)) {
      notification.error({
        message: 'Invalid File Type',
        description: `File type .${extension} is not allowed`,
        placement: 'topRight'
      });
      return false;
    }
    return true;
  };

  const handleFileChange = (info: UploadChangeParam<AntUploadFile<any>>) => {
    const { fileList: newFileList } = info;
    
    const filteredNewFiles = newFileList
      .filter((file: AntUploadFile<any>) => 
        file.originFileObj && isFileTypeAllowed(file.originFileObj)
      )
      .filter((newFile: AntUploadFile<any>) => 
        !fileList.some(existingFile => existingFile.name === newFile.name)
      ) as CustomUploadFile[];

    const updatedFileList = [...fileList, ...filteredNewFiles];
    
    setFileList(updatedFileList);
    form.setFieldsValue({
      file: updatedFileList
    });
  };

  const handleRemoveFile = (fileIndex: number) => {
    const newFileList = fileList.filter((_, index) => index !== fileIndex);
    setFileList(newFileList);
    form.setFieldsValue({
      file: newFileList
    });
  };

  const handleEditName = (index: number, currentName: string) => {
    setEditingIndex(index);
    setEditingName(currentName);
  };

  const handleSaveEdit = (index: number) => {
    if (editingName.trim()) {
      const newFileList = [...fileList];
      const fileExtension = newFileList[index].name.split('.').pop();
      newFileList[index] = {
        ...newFileList[index],
        name: `${editingName.trim()}.${fileExtension}`
      };
      setFileList(newFileList);
      form.setFieldsValue({
        file: newFileList
      });
    }
    setEditingIndex(null);
    setEditingName('');
  };

  const getFileIcon = (fileType: string) => {
    const type = fileType.toLowerCase();
    if (type.includes('pdf')) {
      return <FilePdfOutlined style={{ fontSize: '16px', color: '#168033' }} />;
    } else if (type.includes('word') || type.includes('doc')) {
      return <FileWordOutlined style={{ fontSize: '16px', color: '#168033' }} />;
    } else if (type.includes('excel') || type.includes('spreadsheet')) {
      return <FileExcelOutlined style={{ fontSize: '16px', color: '#168033' }} />;
    } else if (type.includes('image')) {
      return <FileImageOutlined style={{ fontSize: '16px', color: '#168033' }} />;
    } else if (type.includes('video')) {
      return <PlaySquareOutlined style={{ fontSize: '16px', color: '#168033' }} />;
    }
    return <FileOutlined style={{ fontSize: '16px', color: '#168033' }} />;
  };

  const handleFileClick = (e: React.MouseEvent, fileUrl: string) => {
    e.stopPropagation(); // Prevent note row click
    window.open(fileUrl, '_blank');
  };

  useEffect(() => {
    const lowercasedSearch = searchText.toLowerCase();
    const filtered = notes.filter(note => {
      const titleMatch = note.title.toLowerCase().includes(lowercasedSearch);
      const contentMatch = note.content?.toLowerCase().includes(lowercasedSearch);
      const createdByMatch = note.createdBy?.toLowerCase().includes(lowercasedSearch);
      
      let typeMatch = true;
      if (filterType !== '') {
        if (filterType === 'general') {
          typeMatch = !note.tags || note.tags.length === 0;
        } else {
          typeMatch = note.tags?.includes(filterType) || false;
        }
      }
      
      return (titleMatch || contentMatch || createdByMatch) && typeMatch;
    });
    setFilteredNotes(filtered);
  }, [notes, searchText, filterType, availableNoteTags]);

  const handleFilterChange = (value: string) => {
    setFilterType(value || '');
  };

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
              <Col>
                <Select
                  className='unit-notes-dropdown-input'
                  placeholder="Filter by type"
                  onChange={handleFilterChange}
                  allowClear
                  style={{ width: 150 }}
                >
                  {availableNoteTags.map(tag => (
                    <Option key={tag.id} value={tag.name}>
                      {tag.name}
                    </Option>
                  ))}
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
          loading={{
            indicator: <LoadingOutlined style={{ fontSize: 24 }} spin />,
            spinning: loading
          }}
          columns={[
            {
              title: 'Note',
              dataIndex: 'title',
              key: 'title',
              render: (text: string, record: Note) => (
                <Space align="center">
                  <div style={{
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#D8E6D9',
                    borderRadius: '4px',
                    marginRight: '12px'
                  }}>
                    <PaperClipOutlined style={{ fontSize: '24px', color: '#168033' }} />
                  </div>
                  <Text 
                    strong 
                    style={{ 
                      maxWidth: '300px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                    title={record.title} // Shows full title on hover
                  >
                    {record.title.length > 40 ? `${record.title.substring(0, 40)}...` : record.title}
                  </Text>
                </Space>
              ),
            },
            {
              title: 'Tags',
              dataIndex: 'tags',
              key: 'tags',
              width: 200,
              render: (tags: string[]) => (
                <span>
                  {tags?.length ? 
                    tags.map((tag) => (
                      <Tag key={tag} color="blue" style={{ marginBottom: '4px' }}>
                        {tag}
                      </Tag>
                    ))
                    : 
                    '--'
                  }
                </span>
              )
            },
            {
              title: 'Created At',
              dataIndex: 'createdAt',
              key: 'createdAt',
              width: 150,
              render: (timestamp: Timestamp) => timestamp?.toDate().toLocaleDateString() || 'N/A'
            },
            {
              title: 'Created By',
              dataIndex: 'createdBy',
              key: 'createdBy',
              width: 200,
            },
            {
              title: '',
              key: 'action',
              width: 80,
              render: (_: any, record: Note) => (
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
          dataSource={loading ? [] : filteredNotes}
          rowKey="id"
          pagination={{ 
            pageSize: 5,
            showSizeChanger: false 
          }}
          onRow={(record) => ({
            onClick: () => handleView(record),
            style: { cursor: 'pointer' }
          })}
          locale={{
            emptyText: loading ? ' ' : 'No Data'
          }}
        />
      </div>

      <Modal
        className="new-note-drawer"
        title={<Title level={4}>{selectedNote?.title || 'Note Details'}</Title>}
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
                wordWrap: 'break-word',
                minHeight: '200px',
                overflowY: 'auto'
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
        className="new-note-drawer"
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
          <Form
            form={form}
            initialValues={{
              editTitle: selectedNote.title,
              editTags: selectedNote.tags,
            }}
          >
            <Form.Item
              name="editTitle"
              rules={[{ required: true, message: 'Please enter a title' }]}
            >
              <Input placeholder="Note title" />
            </Form.Item>

            <Form.Item name="editTags">
              <Select
                className="unit-notes-tag-select"
                mode="multiple"
                placeholder="Select Tags"
                style={{ width: '100%' }}
                dropdownStyle={{ padding: '8px' }}
              >
                {availableTags.map(tag => (
                  <Option key={tag} value={tag}>{tag}</Option>
                ))}
              </Select>
            </Form.Item>

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
          </Form>
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

          <Form.Item name="attachments" style={{ width: '100%', margin: 0 }}>
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '16px', 
              width: '100%' 
            }}>
              {fileList.map((file: any, index: number) => (
                <div key={index} style={{ 
                  padding: '12px 16px',
                  borderRadius: '4px',
                  border: '1px solid #e8e8e8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  backgroundColor: '#fff'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                    <FileOutlined style={{ fontSize: '24px', color: '#168033' }} />
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      flex: 1,
                      overflow: 'hidden'
                    }}>
                      {editingIndex === index ? (
                        <Input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onPressEnter={() => handleSaveEdit(index)}
                          onBlur={() => handleSaveEdit(index)}
                          autoFocus
                          style={{ 
                            flex: 1,
                            height: '24px',
                            padding: '0 8px',
                            lineHeight: '24px',
                            fontSize: '14px'
                          }}
                        />
                      ) : (
                        <>
                          <span style={{ 
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: '40ch'
                          }} title={file.name}>
                            {file.name}
                          </span>
                          <span style={{ color: '#8c8c8c', flexShrink: 0 }}>
                            ({((file.size || 0) / 1024).toFixed(2)} kB)
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {editingIndex !== index && (
                      <Button 
                        type="text" 
                        icon={<EditOutlined />} 
                        size="small"
                        onClick={() => handleEditName(index, file.name.split('.')[0])}
                        style={{ color: '#1890ff' }}
                      />
                    )}
                    <Button 
                      type="text" 
                      icon={<DeleteOutlined />} 
                      size="small"
                      onClick={() => handleRemoveFile(index)}
                      style={{ color: '#ff4d4f' }}
                    />
                  </div>
                </div>
              ))}

              <Upload.Dragger 
                multiple={true}
                beforeUpload={(file: RcFile) => {
                  const isAllowed = isFileTypeAllowed(file);
                  if (!isAllowed) {
                    return Upload.LIST_IGNORE;
                  }
                  return false;
                }}
                onChange={handleFileChange}
                style={{ 
                  padding: '4px',
                  height: '60px',
                  width: '100%'
                }}
                className="full-width-upload"
                fileList={[]}
                showUploadList={false}
              >
                <p style={{ margin: 0 }}>
                  <UploadOutlined style={{ fontSize: '16px', color: '#28A744', marginRight: '8px' }} />
                  Drag files here or <Button type="link" style={{ padding: '0' }}>click to upload</Button>
                </p>
              </Upload.Dragger>

              {totalProgress > 0 && (
                <div className="upload-progress-container">
                  <div className="upload-progress-bar-bg">
                    <div 
                      className="upload-progress-bar"
                      style={{ width: `${totalProgress}%` }}
                    />
                  </div>
                  <div className="upload-progress-text">
                    {`Uploading ${uploadedFiles}/${fileList.length} files (${Math.round(totalProgress)}%)`}
                  </div>
                </div>
              )}
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PropertyUnitNotes;