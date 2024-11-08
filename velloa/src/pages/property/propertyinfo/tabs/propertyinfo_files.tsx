import React, { useEffect, useState, useCallback } from 'react';
import { Modal, Table, Button, Row, Col, Form, Input, Upload, Select, message, Progress, Popconfirm, Spin } from 'antd';
import { UploadOutlined, PlusOutlined, DeleteOutlined, CloseOutlined, LoadingOutlined } from '@ant-design/icons';
import { db, storage } from '../../../../firebase-config';
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import DocViewer, { DocViewerRenderers } from '@cyntler/react-doc-viewer';
import { v4 as uuidv4 } from 'uuid';
import './property_files.css';

const { Option } = Select;

export interface PropertyFile {
  fileId: string;
  fileName: string;
  fileType: string;
  uploadDate: string;
  size: number;
  uploadedBy: string;
  fileUrl: string;
  unitId?: string;
}

interface PropertyFilesProps {
  propertyId: string;
}

const PropertyFiles: React.FC<PropertyFilesProps> = ({ propertyId }) => {
  const [files, setFiles] = useState<PropertyFile[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<PropertyFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState('');
  const [previewFile, setPreviewFile] = useState<PropertyFile | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    const filesRef = collection(db, 'properties', propertyId, 'files');
    try {
      const filesSnapshot = await getDocs(filesRef);
      const fetchedFiles: PropertyFile[] = await Promise.all(
        filesSnapshot.docs.map(async (doc) => {
          const data = doc.data() as PropertyFile;
          try {
            const freshUrl = await getDownloadURL(ref(storage, data.fileUrl));
            return { ...data, fileId: doc.id, fileUrl: freshUrl };
          } catch (error) {
            console.error("Error refreshing download URL: ", error);
            return { ...data, fileId: doc.id };
          }
        })
      );
      setFiles(fetchedFiles);
      setFilteredFiles(fetchedFiles);
    } catch (error) {
      console.error("Error fetching files: ", error);
      message.error("Failed to fetch files. Please check your permissions.");
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

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

  const handleRowClick = (file: PropertyFile) => {
    setPreviewFile(file);
    setPreviewModalVisible(true);
  };

  const handleDeleteSelected = async () => {
    try {
      for (const key of selectedRowKeys) {
        const fileToDelete = files.find(file => file.fileId === key);
        if (fileToDelete) {
          await deleteDoc(doc(db, 'properties', propertyId, 'files', fileToDelete.fileId));
          const storageRef = ref(storage, fileToDelete.fileUrl);
          await deleteObject(storageRef);
        }
      }
      
      setFiles(prevFiles => prevFiles.filter(file => !selectedRowKeys.includes(file.fileId)));
      setFilteredFiles(prevFiltered => prevFiltered.filter(file => !selectedRowKeys.includes(file.fileId)));
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

  const columns = [
    { title: 'File Name', dataIndex: 'fileName', key: 'fileName' },
    { title: 'File Type', dataIndex: 'fileType', key: 'fileType' },
    { 
      title: 'Upload Date', 
      dataIndex: 'uploadDate', 
      key: 'uploadDate', 
      render: (text: string) => new Date(text).toLocaleDateString(),
      sorter: (a: PropertyFile, b: PropertyFile) => new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime(),
      sortDirections: ['descend', 'ascend'] as ['descend', 'ascend'],
    },
    { title: 'Size', dataIndex: 'size', key: 'size', render: (size: number) => `${size} KB` },
    { title: 'Uploaded By', dataIndex: 'uploadedBy', key: 'uploadedBy' }
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
      if (!values.file || values.file.length === 0) {
        throw new Error('No file selected');
      }

      const file = values.file[0].originFileObj;

      if (!file) {
        throw new Error('File object is not available');
      }

      const fileType = file.type || 'Unknown/Unsupported';
      const fileName = values.fileName || file.name;
      const storageRef = ref(storage, `properties/${propertyId}/files/${uuidv4()}-${fileName}`);
      
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        }, 
        (error) => {
          console.error("Upload error: ", error);
          message.error(`Upload failed: ${error.message}`);
        }, 
        async () => {
          const fileUrl = await getDownloadURL(uploadTask.snapshot.ref);
          const newFile: PropertyFile = {
            fileId: uploadTask.snapshot.metadata.fullPath,
            fileName: fileName,
            fileType: fileType,
            uploadDate: new Date().toISOString(),
            size: Math.round((file.size / 1024) * 100) / 100,
            uploadedBy: 'Current User',
            fileUrl: fileUrl
          };

          const filesRef = collection(db, 'properties', propertyId, 'files');
          await addDoc(filesRef, newFile);

          setFiles(prevFiles => [...prevFiles, newFile]);
          setFilteredFiles(prevFiltered => [...prevFiltered, newFile]);
          message.success('File added successfully');
          setUploadProgress(0);
          handleUploadModalClose();
        }
      );
    } catch (error: any) {
      console.error("Error adding file: ", error);
      message.error(`Failed to add file: ${error.message}`);
    }
  };

  useEffect(() => {
    const lowercasedSearch = searchText.toLowerCase();
    const filtered = files.filter(file => {
      const fileNameMatch = file.fileName.toLowerCase().includes(lowercasedSearch);
      let typeMatch = true;
      
      if (filterType !== '' && file.fileType) {
        const lowerCaseFileType = file.fileType.toLowerCase();
        switch (filterType.toLowerCase()) {
          case 'document':
            typeMatch = ['pdf', 'doc', 'docx', 'txt'].some(ext => lowerCaseFileType.includes(ext));
            break;
          case 'image':
            typeMatch = ['jpg', 'jpeg', 'png', 'gif', 'bmp','webp','mp4'].some(ext => lowerCaseFileType.includes(ext));
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
    setFilteredFiles(filtered);
  }, [files, searchText, filterType]);

  return (
    <div className="file-container">
      <div className="files-box">
        <Row gutter={16} justify="space-between" align="middle" style={{ marginBottom: '16px' }}>
          <Col xs={24} sm={24} md={12} lg={12}>
            <Row gutter={16} wrap={false}>
              <Col>
                <Input
                  className='file-search-input'
                  placeholder="Search files"
                  value={searchText}
                  onChange={handleSearchChange}
                />
              </Col>
              <Col>
                <Select
                  className='file-dropdown-input'
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
            xs={24} 
            sm={24} 
            md={12} 
            lg={12} 
            style={{ 
              textAlign: 'right',
              marginTop: 16
            }}
            className="file-actions-container"
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
                    className='delete-files-button'
                    type="primary"
                    danger
                    icon={<DeleteOutlined />}
                    style={{ marginRight: '8px' }}
                  >
                    Delete Selected
                  </Button>
                </Popconfirm>
                <Button
                  className='cancel-selection-button'
                  onClick={handleCancelSelection}
                  icon={<CloseOutlined />}
                  style={{ marginRight: '8px' }}
                >
                  Cancel Selection
                </Button>
              </>
            )}
            <Button
              className='new-file-button'
              onClick={handleNewFileClick}
              type="default"
              icon={<PlusOutlined />}
            >
              New File
            </Button>
          </Col>
        </Row>

        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={filteredFiles}
          loading={{
            spinning: loading,
            indicator: <Spin indicator={<LoadingOutlined spin />} size="large" />
          }}
          rowKey="fileId"
          onRow={(record) => ({
            onClick: () => handleRowClick(record),
          })}
        />
      </div>

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
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFormSubmit}
        >
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
              <p className="ant-upload-drag-icon"><UploadOutlined /></p>
              <p className="ant-upload-text">Click or drag file to this area to upload</p>
            </Upload.Dragger>
          </Form.Item>
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <Spin indicator={<LoadingOutlined spin />} />
              <Progress percent={Math.round(uploadProgress)} status="active" />
            </div>
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
                retainURLParams: false
              },
              csvDelimiter: ",",
              pdfZoom: {
                defaultZoom: 1.1,
                zoomJump: 0.2,
              },
              pdfVerticalScrollByDefault: true,
              loadingRenderer: {
                showLoadingTimeout: 1000
              }
            }}
            style={{ height: '100%', width: '100%' }}
          />
        )}
      </Modal>
    </div>
  );
};

export default PropertyFiles;