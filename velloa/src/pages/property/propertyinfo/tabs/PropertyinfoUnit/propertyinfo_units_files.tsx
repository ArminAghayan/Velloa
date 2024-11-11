import React, { useEffect, useState, useCallback } from 'react';
import { Modal, Table, Button, Row, Col, Form, Input, Upload, Select, message, Popconfirm, Space, Typography, notification, Tag } from 'antd';
import { UploadOutlined, PlusOutlined, DeleteOutlined, CloseOutlined, FileWordOutlined, FilePdfOutlined, FileImageOutlined, FileExcelOutlined, FilePptOutlined, FileOutlined, EditOutlined, PlaySquareOutlined, DownloadOutlined } from '@ant-design/icons';
import { auth, db, storage } from '../../../../../firebase-config';
import { collection, getDocs, addDoc, deleteDoc, doc, getDoc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import DocViewer, { DocViewerRenderers } from '@cyntler/react-doc-viewer';
import { v4 as uuidv4 } from 'uuid';
import './propertyinfo_units_files.css';
import { UploadFile as AntUploadFile, UploadChangeParam, RcFile } from 'antd/lib/upload';

const { Text } = Typography;

const { Option } = Select;

export interface UnitFile {
  id?: string;
  fileName: string;
  fileType: string;
  uploadDate: Timestamp;
  size: number;
  uploadedBy: string;
  uploadedByName: string;
  fileUrl: string;
  companyId: string;
  tags?: string[];
}

interface PropertyUnitFilesProps {
  propertyId: string;
  unitId: string;
}

// Add interface for user data
interface UserData {
  firstName: string;
  lastName: string;
  email?: string;
}

// Add these new interfaces
interface NoteTag {
  name: string;
  createdAt: string;
  id: string;
}

// Helper function to get a friendly file type name
const getFileType = (file: File): string => {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  
  // Document types
  if (extension === 'doc') return 'DOC';
  if (extension === 'docx') return 'DOCX';
  if (extension === 'pdf') return 'PDF';
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



interface CustomUploadFile extends AntUploadFile<any> {
  originFileObj: RcFile;
}

// Add this constant at the top with other constants
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB in bytes

const PropertyUnitFiles: React.FC<PropertyUnitFilesProps> = ({ propertyId, unitId }) => {
  const [files, setFiles] = useState<UnitFile[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<UnitFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState('');
  const [previewFile, setPreviewFile] = useState<UnitFile | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [fileList, setFileList] = useState<CustomUploadFile[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingName, setEditingName] = useState<string>('');
  const [totalProgress, setTotalProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState(0);
  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null);
  const [availableNoteTags, setAvailableNoteTags] = useState<NoteTag[]>([]);

  const getFilteredFiles = useCallback((
    files: UnitFile[],
    searchText: string,
    filterType: string
  ) => {
    const lowercasedSearch = searchText.toLowerCase();
    return files.filter(file => {
      const fileNameMatch = file.fileName.toLowerCase().includes(lowercasedSearch);
      let typeMatch = true;
      
      if (filterType !== '') {
        const lowerCaseFileType = file.fileType.toLowerCase();
        switch (filterType.toLowerCase()) {
          case 'document':
            typeMatch = ['pdf', 'doc', 'docx', 'txt'].some(ext => lowerCaseFileType.includes(ext));
            break;
          case 'image':
            typeMatch = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].some(ext => lowerCaseFileType.includes(ext));
            break;
          case 'video':
            typeMatch = ['mp4', 'mov', 'avi', 'wmv', 'webm'].some(ext => lowerCaseFileType.includes(ext));
            break;
          case 'spreadsheet':
            typeMatch = ['xls', 'xlsx', 'csv'].some(ext => lowerCaseFileType.includes(ext));
            break;
          default:
            typeMatch = true;
        }
      }
      
      return fileNameMatch && typeMatch;
    });
  }, []);

  const fetchFiles = useCallback(async () => {
    if (!propertyId || !unitId || !auth.currentUser) {
      console.error('Missing propertyId, unitId, or user not authenticated');
      return;
    }

    setLoading(true);
    try {
      const propertyDocRef = doc(db, 'properties', propertyId);
      const propertyDoc = await getDoc(propertyDocRef);
      if (!propertyDoc.exists()) {
        throw new Error('Property not found');
      }
      const companyId = propertyDoc.data().companyuid;

      const filesRef = collection(db, 'properties', propertyId, 'units', unitId, 'files');
      const filesSnapshot = await getDocs(filesRef);

      if (filesSnapshot.empty) {
        setFiles([]);
        setFilteredFiles([]);
        return;
      }

      const fetchedFiles: UnitFile[] = await Promise.all(
        filesSnapshot.docs.map(async (docSnapshot) => {
          const data = docSnapshot.data() as Omit<UnitFile, 'id'>;
          
          try {
            let uploadedByName = data.uploadedByName || 'Unknown User';
            if (data.uploadedBy && !data.uploadedByName) {
              try {
                const userDocRef = doc(db, 'users', data.uploadedBy);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                  const userData = userDoc.data() as UserData;
                  uploadedByName = `${userData.firstName} ${userData.lastName}`;
                }
              } catch (error) {
                console.error('Error fetching user details:', error);
              }
            }
            
            return {
              ...data,
              id: docSnapshot.id,
              uploadedByName: uploadedByName,
              companyId: data.companyId || companyId
            };
          } catch (error) {
            console.error("Error processing file:", error);
            return {
              ...data,
              id: docSnapshot.id,
              uploadedByName: data.uploadedByName || 'Unknown User',
              companyId: data.companyId || companyId
            };
          }
        })
      );

      console.log('Processed files:', fetchedFiles);
      setFiles(fetchedFiles);
      setFilteredFiles(fetchedFiles);
    } catch (error) {
      console.error("Error fetching files:", error);
      message.error("Failed to fetch files. Please check your permissions.");
    } finally {
      setLoading(false);
    }
  }, [propertyId, unitId]);

  const fetchNoteTags = async (companyId: string) => {
    try {
      console.log('Fetching File tags for company:', companyId);
      
      const noteTagsDoc = await getDoc(doc(db, 'companies', companyId, 'settings', 'filetags'));
      console.log('File tags doc exists:', noteTagsDoc.exists());
      
      if (noteTagsDoc.exists()) {
        const data = noteTagsDoc.data();
        console.log('Raw File tags data:', data);
        
        // Convert the numbered objects into an array
        const tags = data?.tags ? Object.values(data.tags) : [];
        
        // Validate tags before setting them
        const validTags = tags.filter((tag: any) => 
          tag && 
          typeof tag === 'object' && 
          typeof tag.name === 'string'
        ) as NoteTag[];
        
        console.log('Validated File tags:', validTags);
        setAvailableNoteTags(validTags);

        if (validTags.length === 0) {
          notification.info({
            message: 'No Tags Available',
            description: 'No File tags have been configured for your company.',
            placement: 'topRight'
          });
        }
      } else {
        notification.info({
          message: 'No Tags Available',
          description: 'No File tags have been configured for your company.',
          placement: 'topRight'
        });
        setAvailableNoteTags([]);
      }
    } catch (error) {
      console.error('Error fetching File tags:', error);
      notification.error({
        message: 'Error',
        description: 'Failed to fetch File tags.',
        placement: 'topRight'
      });
      setAvailableNoteTags([]);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const companyId = userDoc.data().companyuid;
            if (companyId) {
              await fetchNoteTags(companyId);
            }
          }
        } catch (error) {
          console.error('Error fetching user doc:', error);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (propertyId && unitId) {
      fetchFiles();
    }
  }, [propertyId, unitId, fetchFiles]);

  const handleFileChange = (info: UploadChangeParam<AntUploadFile<any>>) => {
    const { fileList: newFileList } = info;
    
    // Filter out files with unsupported types
    const filteredNewFiles = newFileList
      .filter((file) => file.originFileObj && isFileTypeAllowed(file.originFileObj))
      // Only process files that aren't already in the list
      .filter((newFile) => 
        !fileList.some(existingFile => existingFile.name === newFile.name)
      );

    // Combine existing files with new files
    const updatedFileList = [...fileList, ...filteredNewFiles] as CustomUploadFile[];
    
    setFileList(updatedFileList);
    form.setFieldsValue({
      file: updatedFileList
    });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };

  const handleFilterChange = (value: string) => {
    setFilterType(value || '');
  };

  const handleNewFileClick = () => {
    setUploadModalVisible(true);
    form.resetFields();
  };

  const handleUploadModalClose = () => {
    if (uploadProgress > 0 && uploadProgress < 100) {
      // Don't allow closing during upload
      return;
    }
    setUploadModalVisible(false);
    form.resetFields();
    setFileList([]);
    setUploadProgress(0);
  };

  const handlePreviewModalClose = () => {
    // Stop video if it exists
    if (videoRef) {
      videoRef.pause();
      videoRef.currentTime = 0;
    }
    setPreviewModalVisible(false);
    setPreviewFile(null);
  };

  const handleRowClick = useCallback((record: UnitFile) => {
    setPreviewFile(record);
    setPreviewModalVisible(true);
  }, []);

  const handleDeleteSelected = async () => {
    try {
      for (const key of selectedRowKeys) {
        const fileToDelete = files.find(file => file.id === key);
        if (fileToDelete?.id) {
          const fileDocRef = doc(db, 'properties', propertyId, 'units', unitId, 'files', fileToDelete.id);
          await deleteDoc(fileDocRef);
          
          if (fileToDelete.fileUrl) {
            const storageRef = ref(storage, fileToDelete.fileUrl);
            await deleteObject(storageRef);
          }
        }
      }
      
      setFiles(prevFiles => prevFiles.filter(file => 
        file.id && !selectedRowKeys.includes(file.id as React.Key)
      ));
      
      setFilteredFiles(prevFiltered => prevFiltered.filter(file => 
        file.id && !selectedRowKeys.includes(file.id as React.Key)
      ));
      
      setSelectedRowKeys([]);
      
      message.success('Selected files deleted successfully');
    } catch (error) {
      console.error("Error deleting files: ", error);
      message.error('Failed to delete selected files');
    }
  };

  const handleCancelSelection = () => {
    setSelectedRowKeys([]);
  };



  const getFileIcon = (fileType: string) => {
    const type = fileType.toLowerCase();
    if (type === 'doc' || type === 'docx') {
      return <FileWordOutlined style={{ fontSize: '24px', color: '#168033' }} />;
    } else if (type.includes('pdf')) {
      return <FilePdfOutlined style={{ fontSize: '24px', color: '#168033' }} />;
    } else if (type.includes('image') || type.includes('jpg') || type.includes('png')) {
      return <FileImageOutlined style={{ fontSize: '24px', color: '#168033' }} />;
    } else if (type.includes('excel') || type.includes('spreadsheet') || type.includes('xlsx')) {
      return <FileExcelOutlined style={{ fontSize: '24px', color: '#168033' }} />;
    } else if (type.includes('powerpoint') || type.includes('pptx')) {
      return <FilePptOutlined style={{ fontSize: '24px', color: '#168033' }} />;
    }
    return <FileOutlined style={{ fontSize: '24px', color: '#168033' }} />;
  };

  const columns = [
    {
      title: 'File',
      dataIndex: 'fileName',
      key: 'fileName',
      render: (text: string, record: UnitFile) => (
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
            {getFileIcon(record.fileType)}
          </div>
          <Text strong>{text}</Text>
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
      title: 'Type', 
      dataIndex: 'fileType', 
      key: 'fileType',
      render: (text: string) => <Text>{text}</Text>
    },
    { 
      title: 'Size', 
      dataIndex: 'size', 
      key: 'size',
      render: (size: number) => <Text>{size} KB</Text>
    },
    { 
      title: 'Upload Date', 
      dataIndex: 'uploadDate', 
      key: 'uploadDate', 
      render: (uploadDate: Timestamp) => {
        const date = uploadDate instanceof Timestamp ? uploadDate.toDate() : new Date(uploadDate);
        return date.toLocaleDateString();
      },
      sorter: (a: UnitFile, b: UnitFile) => {
        const dateA = a.uploadDate instanceof Timestamp ? a.uploadDate.toDate() : new Date(a.uploadDate);
        const dateB = b.uploadDate instanceof Timestamp ? b.uploadDate.toDate() : new Date(b.uploadDate);
        return dateA.getTime() - dateB.getTime();
      },
      sortDirections: ['descend', 'ascend'] as ['descend', 'ascend'],
    },
    { 
      title: 'Uploaded By', 
      dataIndex: 'uploadedByName', 
      key: 'uploadedByName' 
    },
   
  ];

  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    console.log('selectedRowKeys changed: ', newSelectedRowKeys);
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
  };

  const handleFormSubmit = async (values: any) => {
    try {
      if (!auth.currentUser?.uid) {
        message.error('User is not authenticated');
        return;
      }

      const currentUser = auth.currentUser;

      // First get the user's full name
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists()) {
        throw new Error('User document not found');
      }
      const userData = userDoc.data() as UserData;
      const userFullName = `${userData.firstName} ${userData.lastName}` || currentUser.email || 'Unknown User';

      // Get the property's companyId
      const propertyDoc = await getDoc(doc(db, 'properties', propertyId));
      if (!propertyDoc.exists()) {
        throw new Error('Property not found');
      }
      
      const companyId = propertyDoc.data().companyuid;
      
      if (!companyId) {
        throw new Error('Company ID not found for this property');
      }

      if (!fileList || fileList.length === 0) {
        throw new Error('No files selected');
      }

      const totalFiles = fileList.length;
      setUploadedFiles(0);
      setTotalProgress(0);

      // Get the selected tags from the form
      const selectedTags = values.tags || [];

      // Process each file in the fileList using forEach instead of for...of
      await Promise.all(fileList.map(async (fileItem, index) => {
        const file = fileItem.originFileObj;
        const fileName = fileItem.name;
        const storageFileName = `${uuidv4()}-${fileName}`;
        const storageRef = ref(storage, `properties/${propertyId}/units/${unitId}/files/${storageFileName}`);
        
        const metadata = {
          customMetadata: {
            uploadedBy: currentUser.uid,
            uploadedByEmail: currentUser.email || 'unknown',
            companyId: companyId
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
                
                const newFile: UnitFile = {
                  fileName: fileName,
                  fileType: getFileType(file),
                  uploadDate: Timestamp.now(),
                  size: Math.round((file.size / 1024) * 100) / 100,
                  uploadedBy: currentUser.uid,
                  uploadedByName: userFullName,
                  fileUrl: downloadURL,
                  companyId: companyId,
                  tags: selectedTags
                };

                const filesRef = collection(db, 'properties', propertyId, 'units', unitId, 'files');
                await addDoc(filesRef, newFile);
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
      message.success('All files uploaded successfully');
      handleUploadModalClose();
      await fetchFiles();
      
    } catch (error: any) {
      console.error("Error adding files: ", error);
      message.error(`Failed to upload files: ${error.message}`);
      setTotalProgress(0);
      setUploadedFiles(0);
    }
  };

  useEffect(() => {
    const filtered = getFilteredFiles(files, searchText, filterType);
    setFilteredFiles(filtered);
  }, [files, searchText, filterType, getFilteredFiles]);

  // Add this function to handle file deletion
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

  // Add this helper function to get file extension
  const getFileExtension = (filename: string): string => {
    return filename.split('.').pop()?.toLowerCase() || '';
  };

  // Update the isFileTypeAllowed function
  const isFileTypeAllowed = (file: File): boolean => {
    // Check file size first
    if (file.size > MAX_FILE_SIZE) {
      message.error(`File ${file.name} is too large. Maximum size is 50MB`);
      return false;
    }

    const extension = getFileExtension(file.name);
    const allAllowedTypes = [
      'doc', 'docx', 'pdf', 'xls', 'xlsx',  // documents
      'jpg', 'jpeg', 'png', 'gif', 'svg',   // images
      'mp4', 'webm', 'avi', 'wmv', 'mpeg', 'm4v', 'mov', 'video'  // videos
    ];
    
    if (!allAllowedTypes.includes(extension)) {
      message.error(`File type .${extension} is not allowed`);
      return false;
    }
    return true;
  };

  // Update the ALLOWED_FILE_TYPES constant if you're using it for the accept prop
  const ALLOWED_FILE_TYPES = {
    documents: ['.doc', '.docx', '.pdf', '.xls', '.xlsx'],
    images: ['.jpg', '.jpeg', '.png', '.gif', '.svg'],
    videos: ['.mp4', '.webm', '.avi', '.wmv', '.mpeg', '.m4v', '.mov', '.video']
  };

  const renderPreviewContent = (file: UnitFile) => {
    const fileExtension = getFileExtension(file.fileName).toLowerCase();
    const isOfficeDoc = ['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'].includes(fileExtension);
    const isVideo = ['mp4', 'webm', 'avi', 'wmv', 'mpeg', 'm4v', 'mov'].includes(fileExtension);
    const isPdf = fileExtension === 'pdf';

    if (isVideo) {
      return (
        <video
          ref={(el) => setVideoRef(el)}
          controls
          style={{ 
            maxWidth: '100%', 
            maxHeight: 'calc(90vh - 100px)',
            margin: '0 auto',
            display: 'block'
          }}
          src={file.fileUrl}
        >
          Your browser does not support the video tag.
        </video>
      );
    }

    if (isOfficeDoc) {
      return (
        <div style={{ 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          textAlign: 'center',
          backgroundColor: '#f5f5f5'
        }}>
          <div style={{ marginBottom: '1rem' }}>
            {getFileIcon(file.fileType)}
          </div>
          <Typography.Title level={4} style={{ margin: '1rem 0' }}>
            This file type cannot be previewed directly
          </Typography.Title>
          <Typography.Text type="secondary" style={{ marginBottom: '2rem' }}>
            Please download the file to view its contents
          </Typography.Text>
          <Button 
            type="primary"
            icon={<DownloadOutlined />}
            size="large"
            onClick={() => window.open(file.fileUrl, '_blank')}
          >
            Download File
          </Button>
        </div>
      );
    }

    if (isPdf) {
      return (
        <DocViewer
          documents={[{ 
            uri: file.fileUrl,
            fileName: file.fileName 
          }]}
          pluginRenderers={[DocViewerRenderers[0]]}
          config={{
            header: {
              disableHeader: true,
              disableFileName: true,
            },
            pdfZoom: {
              defaultZoom: 0.5,
              zoomJump: 0.2,
            },
            pdfVerticalScrollByDefault: true
          }}
          theme={{
            primary: '#f0f0f0',
            secondary: '#ffffff',
            tertiary: '#dddddd',
            textPrimary: '#000000',
            textSecondary: '#666666',
            disableThemeScrollbar: false
          }}
          style={{ 
            height: '100%',
            width: '100%',
            backgroundColor: '#f0f0f0',
            overflow: 'auto'
          }}
        />
      );
    }

    // For all other file types, show download button
    return (
      <div style={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        textAlign: 'center',
        backgroundColor: '#f5f5f5'
      }}>
        <div style={{ marginBottom: '1rem' }}>
          {getFileIcon(file.fileType)}
        </div>
        <Typography.Title level={4} style={{ margin: '1rem 0' }}>
          Preview not available
        </Typography.Title>
        <Typography.Text type="secondary" style={{ marginBottom: '2rem' }}>
          Please download the file to view its contents
        </Typography.Text>
        <Button 
          type="primary"
          icon={<DownloadOutlined />}
          size="large"
          onClick={() => window.open(file.fileUrl, '_blank')}
        >
          Download File
        </Button>
      </div>
    );
  };

  return (
    <div className="unit-files-container">
      <div className="unit-files-box">
        <Row gutter={16} justify="space-between" align="middle" style={{ marginBottom: '16px' }}>
          <Col xs={24} sm={24} md={12} lg={12}>
            <Row gutter={16} wrap={false}>
              <Col>
                <Input
                  className='unit-files-search-input'
                  placeholder="Search files"
                  value={searchText}
                  onChange={handleSearchChange}
                />
              </Col>
              <Col>
                <Select
                  className='unit-files-dropdown-input'
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
            className="new-file-button-container"
          >
            <Space>
              {selectedRowKeys.length > 0 && (
                <>
                  <Popconfirm
                    title="Are you sure you want to delete these files?"
                    onConfirm={handleDeleteSelected}
                    okText="Yes"
                    cancelText="No"
                  >
                    <Button
                      className='unit-files-delete-files-button'
                      type="primary"
                      danger
                      icon={<DeleteOutlined />}
                    >
                      Delete Selected
                    </Button>
                  </Popconfirm>
                  <Button
                    className='unit-files-cancel-selection-button'
                    onClick={handleCancelSelection}
                    icon={<CloseOutlined />}
                  >
                    Cancel Selection
                  </Button>
                </>
              )}
              <Button
                className='unit-files-new-file-button'
                onClick={handleNewFileClick}
                type="default"
                icon={<PlusOutlined />}
              >
                New File
              </Button>
            </Space>
          </Col>
        </Row>
        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={filteredFiles}
          loading={loading}
          rowKey="id"
          onRow={(record) => ({
            onClick: () => handleRowClick(record),
          })}
          pagination={{ 
            pageSize: 5,
            showSizeChanger: false 
          }}
          onChange={(pagination, filters, sorter) => {
            console.log('Table change:', sorter);
          }}
        />
      </div>

      <Modal
        title="Add New File"
        visible={uploadModalVisible}
        onOk={form.submit}
        onCancel={handleUploadModalClose}
        className="unit-files-upload-modal"
        footer={[
          <Button key="back" onClick={handleUploadModalClose}>
            Cancel
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            onClick={form.submit}
            loading={uploadProgress > 0 && uploadProgress < 100}
          >
            Upload
          </Button>,
        ]}
      >
        <p style={{ color: '#8c8c8c', marginBottom: '24px' }}>
          Here, you can upload files to this unit.
        </p>
        
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFormSubmit}
        >
          <Form.Item name="tags">
            <Select
              mode="multiple"
              placeholder="Select Tags"
              style={{ width: '100%', marginBottom: '16px' }}
              dropdownStyle={{ padding: '8px' }}
              className="unit-files-tag-select"
            >
              {availableNoteTags.map(tag => (
                <Option key={tag.id} value={tag.name}>{tag.name}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="file"
            valuePropName="fileList"
            getValueFromEvent={(e) => e && e.fileList}
            rules={[{ required: true, message: 'Please upload a file' }]}
            style={{ width: '100%', marginTop: 0 }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
              {/* Display uploaded files */}
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
                    {/* Show appropriate icon based on file extension */}
                    {(() => {
                      const extension = getFileExtension(file.name);
                      if (ALLOWED_FILE_TYPES.documents.includes(`.${extension}`)) {
                        if (extension === 'pdf') return <FilePdfOutlined style={{ fontSize: '24px', color: '#168033' }} />;
                        if (['doc', 'docx'].includes(extension)) return <FileWordOutlined style={{ fontSize: '24px', color: '#168033' }} />;
                        if (['xls', 'xlsx'].includes(extension)) return <FileExcelOutlined style={{ fontSize: '24px', color: '#168033' }} />;
                      }
                      if (ALLOWED_FILE_TYPES.images.includes(`.${extension}`)) {
                        return <FileImageOutlined style={{ fontSize: '24px', color: '#168033' }} />;
                      }
                      if (ALLOWED_FILE_TYPES.videos.includes(`.${extension}`)) {
                        return <PlaySquareOutlined style={{ fontSize: '24px', color: '#168033' }} />;
                      }
                      return <FileOutlined style={{ fontSize: '24px', color: '#168033' }} />;
                    })()}
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

              {/* Drag and drop area with reduced height */}
              <Upload.Dragger 
                multiple={true}
                beforeUpload={(file) => {
                  const isAllowed = isFileTypeAllowed(file);
                  if (!isAllowed) {
                    return Upload.LIST_IGNORE;
                  }
                  return false;
                }}
                onChange={handleFileChange}
                className="full-width-upload"
                style={{ 
                  padding: '8px',
                  height: '100px'
                }}
                fileList={[]}
                showUploadList={false}
                accept={ALLOWED_FILE_TYPES.documents.concat(
                  ALLOWED_FILE_TYPES.images,
                  ALLOWED_FILE_TYPES.videos
                ).join(',')}
              >
                <p style={{ marginBottom: '2px' }}>
                  <UploadOutlined style={{ fontSize: '20px', color: '#28A744' }} />
                </p>
                <p style={{ marginBottom: '2px' }}>
                  Drag multiple files here or <Button type="link" style={{ padding: '0' }}>click to upload</Button>
                </p>
                <p style={{ color: '#8c8c8c', fontSize: '12px', margin: 0 }}>
                  (Max upload size of 50MB)
                </p>
              </Upload.Dragger>

              {/* Upload progress bar with info */}
              {totalProgress > 0 && (
                <div className="upload-progress-container">
                  <div className="upload-progress-bar-bg">
                    <div 
                      className="upload-progress-bar"
                      style={{
                        width: `${totalProgress}%`,
                      }}
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

      <Modal
        title={
          <div style={{ 
            display: 'flex', 
            alignItems: 'center',
            gap: '12px'
          }}>
            {previewFile && getFileIcon(previewFile.fileType)}
            <span>{previewFile?.fileName}</span>
          </div>
        }
        visible={previewModalVisible}
        onCancel={handlePreviewModalClose}
        footer={null}
        width="80%"
        style={{ top: 20 }}
        bodyStyle={{ 
          height: 'calc(90vh - 100px)',
          padding: '0px',
          overflow: 'auto'
        }}
      >
        {previewFile && renderPreviewContent(previewFile)}
      </Modal>
    </div>
  );
};

export default PropertyUnitFiles;