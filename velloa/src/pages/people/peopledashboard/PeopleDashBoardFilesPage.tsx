import React, { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Input,
  Button,
  Select,
  Row,
  Col,
  Modal,
  Form,
  Upload,
  message,
  Progress,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  UploadOutlined,
  DeleteOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import { db, storage, auth } from '../../../firebase-config';
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  query,
  where,
  getDoc,
} from 'firebase/firestore';
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import DocViewer, { DocViewerRenderers } from '@cyntler/react-doc-viewer';
import { v4 as uuidv4 } from 'uuid';
import './PeopleDashBoardFilesPage.css';

const { Option } = Select;

interface ProspectFile {
  fileId: string;
  fileName: string;
  fileType: string;
  uploadDate: string;
  size: number;
  uploadedBy: string;
  fileUrl: string;
}

interface ProspectsFilesPageProps {
  personId?: string;
}

const ProspectsFilesPage: React.FC<ProspectsFilesPageProps> = ({ personId }) => {
  const [files, setFiles] = useState<ProspectFile[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<ProspectFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState('');
  const [previewFile, setPreviewFile] = useState<ProspectFile | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userName, setUserName] = useState<string>('');

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
        const fullName = `${userData.firstName} ${userData.lastName}`;
        setUserName(fullName);
      }
    } catch (error) {
      console.error('Error fetching user name:', error);
      message.error('Failed to fetch user information.');
    }
  };

  const fetchFiles = useCallback(async () => {
    if (!personId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const filesRef = collection(db, 'people', personId, 'files');
    try {
      const filesSnapshot = await getDocs(filesRef);
      const fetchedFiles: ProspectFile[] = await Promise.all(
        filesSnapshot.docs.map(async (doc) => {
          const data = doc.data() as ProspectFile;
          try {
            const freshUrl = await getDownloadURL(ref(storage, data.fileUrl));
            return { ...data, fileId: doc.id, fileUrl: freshUrl };
          } catch (error) {
            console.error('Error refreshing download URL: ', error);
            return { ...data, fileId: doc.id };
          }
        })
      );
      setFiles(fetchedFiles);
      setFilteredFiles(fetchedFiles);
    } catch (error) {
      console.error('Error fetching files: ', error);
      message.error('Failed to fetch files. Please check your permissions.');
    } finally {
      setLoading(false);
    }
  }, [personId]);

  useEffect(() => {
    if (currentUser) {
      fetchFiles();
    }
  }, [fetchFiles, currentUser]);

  const handleFileChange = (info: any) => {
    const { fileList } = info;
    let lastFile = fileList[fileList.length - 1];

    if (lastFile && lastFile.originFileObj) {
      form.setFieldsValue({
        file: [lastFile],
        fileName: lastFile.name,
      });
    } else {
      form.resetFields(['file', 'fileName']);
    }
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
    setUploadModalVisible(false);
    form.resetFields();
    setUploadProgress(0);
  };

  const handlePreviewModalClose = () => {
    setPreviewModalVisible(false);
    setPreviewFile(null);
  };

  const handleRowClick = (file: ProspectFile) => {
    setPreviewFile(file);
    setPreviewModalVisible(true);
  };

  const handleDeleteSelected = async () => {
    if (!personId) return;
    try {
      for (const key of selectedRowKeys) {
        const fileToDelete = files.find((file) => file.fileId === key);
        if (fileToDelete) {
          const fileDocRef = doc(
            db,
            'people',
            personId,
            'files',
            fileToDelete.fileId
          );
          await deleteDoc(fileDocRef);
          const storageRef = ref(storage, fileToDelete.fileUrl);
          await deleteObject(storageRef);
        }
      }

      setFiles((prevFiles) =>
        prevFiles.filter((file) => !selectedRowKeys.includes(file.fileId))
      );
      setFilteredFiles((prevFiltered) =>
        prevFiltered.filter((file) => !selectedRowKeys.includes(file.fileId))
      );
      setSelectedRowKeys([]);

      message.success('Selected files deleted successfully');
    } catch (error) {
      console.error('Error deleting files: ', error);
      message.error('Failed to delete selected files');
    }
  };

  const handleCancelSelection = () => {
    setSelectedRowKeys([]);
  };

  const columns = [
    { title: 'File Name', dataIndex: 'fileName', key: 'fileName' },
    { title: 'File Type', dataIndex: 'fileType', key: 'fileType' },
    {
      title: 'Upload Date',
      dataIndex: 'uploadDate',
      key: 'uploadDate',
      render: (text: string) => new Date(text).toLocaleDateString(),
      sorter: (a: ProspectFile, b: ProspectFile) =>
        new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime(),
      sortDirections: ['descend', 'ascend'] as ['descend', 'ascend'],
    },
    {
      title: 'Size',
      dataIndex: 'size',
      key: 'size',
      render: (size: number) => `${size} KB`,
    },
    { title: 'Uploaded By', dataIndex: 'uploadedBy', key: 'uploadedBy' },
  ];

  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
  };

  const handleFormSubmit = async (values: any) => {
    if (!personId || !currentUser) {
      message.error('Missing required information. Please try again.');
      return;
    }
    try {
      if (!values.file || values.file.length === 0) {
        throw new Error('No file selected');
      }

      const file = values.file[0].originFileObj;

      if (!file) {
        throw new Error('File object is not available');
      }

      const fileType = file.type || 'Unknown/Unsupported';
      const fileName = values.fileName || file.name;
      const storageRef = ref(
        storage,
        `people/${personId}/files/${uuidv4()}-${fileName}`
      );

      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error('Upload error: ', error);
          message.error(`Upload failed: ${error.message}`);
        },
        async () => {
          const fileUrl = await getDownloadURL(uploadTask.snapshot.ref);
          const newFile: ProspectFile = {
            fileId: uuidv4(),
            fileName: fileName,
            fileType: fileType,
            uploadDate: new Date().toISOString(),
            size: Math.round((file.size / 1024) * 100) / 100,
            uploadedBy: userName || currentUser.email || 'Unknown User',
            fileUrl: fileUrl,
          };

          const filesRef = collection(db, 'people', personId, 'files');
          await addDoc(filesRef, newFile);

          setFiles((prevFiles) => [...prevFiles, newFile]);
          setFilteredFiles((prevFiltered) => [...prevFiltered, newFile]);
          message.success('File added successfully');
          setUploadProgress(0);
          handleUploadModalClose();
        }
      );
    } catch (error: any) {
      console.error('Error adding file: ', error);
      message.error(`Failed to add file: ${error.message}`);
    }
  };

  useEffect(() => {
    const lowercasedSearch = searchText.toLowerCase();
    const filtered = files.filter((file) => {
      const fileNameMatch = file.fileName.toLowerCase().includes(lowercasedSearch);
      let typeMatch = true;

      if (filterType !== '' && file.fileType) {
        const lowerCaseFileType = file.fileType.toLowerCase();
        switch (filterType.toLowerCase()) {
          case 'document':
            typeMatch = ['pdf', 'doc', 'docx', 'txt'].some((ext) =>
              lowerCaseFileType.includes(ext)
            );
            break;
          case 'image':
            typeMatch = [
              'jpg',
              'jpeg',
              'png',
              'gif',
              'bmp',
              'webp',
              'mp4',
            ].some((ext) => lowerCaseFileType.includes(ext));
            break;
          case 'spreadsheet':
            typeMatch = ['xls', 'xlsx', 'csv'].some((ext) =>
              lowerCaseFileType.includes(ext)
            );
            break;
          default:
            typeMatch = true;
        }
      }

      return fileNameMatch && typeMatch;
    });
    setFilteredFiles(filtered);
  }, [files, searchText, filterType]);


  return (
    <div className="prospects-files-page">
      <Row
        gutter={16}
        justify="space-between"
        align="middle"
        style={{ marginBottom: '16px' }}
      >
        <Col span={16}>
          <Row gutter={16}>
            <Col>
              <Input
                className="search-input"
                placeholder="Search files"
                value={searchText}
                onChange={handleSearchChange}
              />
            </Col>
            <Col>
              <Select
                className="file-dropdown-input"
                placeholder="Filter by type"
                onChange={handleFilterChange}
                allowClear
                style={{ width: 150 }}
              >
                <Option value="Document">Document</Option>
                <Option value="Image">Image</Option>
                <Option value="Spreadsheet">Spreadsheet</Option>
              </Select>
            </Col>
          </Row>
        </Col>
        <Col
          span={8}
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          {selectedRowKeys.length > 0 && (
            <>
              <Popconfirm
                title="Are you sure you want to delete these files?"
                onConfirm={handleDeleteSelected}
                okText="Yes"
                cancelText="No"
              >
                <Button
                  className="delete-files-button"
                  type="primary"
                  danger
                  icon={<DeleteOutlined />}
                  style={{ marginRight: '8px', marginBottom: '8px' }}
                >
                  Delete Selected
                </Button>
              </Popconfirm>
              <Button
                className="cancel-selection-button"
                onClick={handleCancelSelection}
                icon={<CloseOutlined />}
                style={{ marginRight: '8px', marginBottom: '8px' }}
              >
                Cancel Selection
              </Button>
            </>
          )}
          <Button
            className="new-file-button"
            onClick={handleNewFileClick}
            type="default"
            icon={<PlusOutlined />}
            style={{ marginBottom: '8px' }}
          >
            New File
          </Button>
        </Col>
      </Row>
      <Table
        rowSelection={rowSelection}
        columns={columns}
        dataSource={filteredFiles}
        loading={loading}
        rowKey="fileId"
        className="prospects-files-table"
        onRow={(record) => ({
          onClick: () => handleRowClick(record),
        })}
      />

      <Modal
        title="Add New File"
        visible={uploadModalVisible}
        onOk={form.submit}
        onCancel={handleUploadModalClose}
        footer={[
          <Button key="back" onClick={handleUploadModalClose}>
            Cancel
          </Button>,
          <Button key="submit" type="primary" onClick={form.submit}>
            Submit
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical" onFinish={handleFormSubmit}>
          <Form.Item
            name="fileName"
            label="File Name"
            rules={[{ required: true, message: 'Please enter a file name' }]}
          >
            <Input placeholder="Enter file name" className="full-width-input" />
          </Form.Item>
          <Form.Item
            name="file"
            label="File"
            valuePropName="fileList"
            getValueFromEvent={(e) => e && e.fileList}
            rules={[{ required: true, message: 'Please upload a file' }]}
          >
            <Upload.Dragger
              beforeUpload={() => false}
              onChange={handleFileChange}
              className="full-width-upload"
            >
              <p className="ant-upload-drag-icon">
                <UploadOutlined />
              </p>
              <p className="ant-upload-text">
                Click or drag file to this area to upload
              </p>
            </Upload.Dragger>
          </Form.Item>
          {uploadProgress > 0 && uploadProgress < 100 && (
            <Progress percent={Math.round(uploadProgress)} status="active" />
          )}
        </Form>
      </Modal>

      <Modal
        title="Preview File"
        visible={previewModalVisible}
        onCancel={handlePreviewModalClose}
        footer={null}
        width="60%"
        bodyStyle={{ height: '70vh', overflow: 'auto' }}
      >
        {previewFile && (
          <DocViewer
            documents={[{ uri: previewFile.fileUrl }]}
            pluginRenderers={DocViewerRenderers}
            config={{
              header: {
                disableHeader: false,
                disableFileName: false,
                retainURLParams: false,
              },
              csvDelimiter: ',',
              pdfZoom: {
                defaultZoom: 1.1,
                zoomJump: 0.2,
              },
              pdfVerticalScrollByDefault: true,
              loadingRenderer: {
                showLoadingTimeout: 1000,
              },
            }}
            style={{ height: '100%', width: '100%' }}
          />
        )}
      </Modal>
    </div>
  );
};

export default ProspectsFilesPage;
