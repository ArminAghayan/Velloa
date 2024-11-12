import React, { useState, useEffect, useCallback } from 'react';
import { 
  Modal, 
  Button, 
  Row, 
  Col, 
  Form, 
  Input, 
  Upload, 
  Select, 
  notification, 
  Space, 
  Typography,
  Image,
  List,
  Card,
  Divider,
  Skeleton,
} from 'antd';
import { 
  PlusOutlined, 
  DeleteOutlined, 
  CloseOutlined,
  FileImageOutlined,
  EditOutlined,
  PlaySquareOutlined,
  CameraOutlined,
  SelectOutlined
} from '@ant-design/icons';
import { auth, db, storage } from '../../../../../firebase-config';
import { collection, getDocs, addDoc, deleteDoc, doc, getDoc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { UploadFile as AntUploadFile, UploadChangeParam, RcFile } from 'antd/lib/upload';
import './PropertyPhotosComponent.css';
const { Option } = Select;

// Constants
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB in bytes

const ALLOWED_FILE_TYPES = {
  images: ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp'],
  videos: ['.mp4', '.webm', '.avi', '.wmv', '.mpeg', '.m4v', '.mov']
};

// Interfaces
interface UnitImage {
  id?: string;
  fileName: string;
  fileType: string;
  uploadDate: Timestamp;
  size: number;
  uploadedBy: string;
  uploadedByName: string;
  fileUrl: string;
  companyId: string;
  isVideo: boolean;
}

interface PropertyUnitImagesProps {
  propertyId: string;
  isModalOpen?: boolean;
  setIsModalOpen?: (isOpen: boolean) => void;
  shouldOpenUploadModal?: boolean;
  setShouldOpenUploadModal?: (value: boolean) => void;
}

interface UserData {
  firstName: string;
  lastName: string;
  email?: string;
}

interface CustomUploadFile extends AntUploadFile<any> {
  originFileObj: RcFile;
}

const PropertyPhotosComponent: React.FC<PropertyUnitImagesProps> = ({
  propertyId,
  isModalOpen,
  setIsModalOpen,
  shouldOpenUploadModal,
  setShouldOpenUploadModal
}) => {
  const [images, setImages] = useState<UnitImage[]>([]);
  const [filteredImages, setFilteredImages] = useState<UnitImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState<UnitImage | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileList, setFileList] = useState<CustomUploadFile[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingName, setEditingName] = useState<string>('');
  const [totalProgress, setTotalProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState(0);
  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null);
  const [form] = Form.useForm();
  const [filterType, setFilterType] = useState('');
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // Helper function to get file extension
  const getFileExtension = (filename: string): string => {
    return filename.split('.').pop()?.toLowerCase() || '';
  };

  // Helper function to check if file type is allowed
  const isFileTypeAllowed = (file: File): boolean => {
    if (file.size > MAX_FILE_SIZE) {
      notification.error({
        message: 'File too large',
        description: `File ${file.name} is too large. Maximum size is 50MB`
      });
      return false;
    }

    const extension = getFileExtension(file.name);
    const allAllowedTypes = [...ALLOWED_FILE_TYPES.images, ...ALLOWED_FILE_TYPES.videos]
      .map(ext => ext.replace('.', ''));
    
    if (!allAllowedTypes.includes(extension)) {
      notification.error({
        message: 'Invalid file type',
        description: 'Only image and video files are allowed'
      });
      return false;
    }
    return true;
  };


  const fetchImages = useCallback(async () => {
    setLoading(true);
    
    if (!auth.currentUser) {
      console.error('No authenticated user');
      notification.error({
        message: 'Authentication Error',
        description: 'Please login to view images'
      });
      setLoading(false);
      return;
    }

    try {
      // First get the property's companyId
      const propertyDocRef = doc(db, 'properties', propertyId);
      const propertyDoc = await getDoc(propertyDocRef);
      if (!propertyDoc.exists()) {
        throw new Error('Property not found');
      }
      const companyId = propertyDoc.data().companyuid;

      const photosRef = collection(db, 'properties', propertyId, 'photos');
      const photosSnapshot = await getDocs(photosRef);

      if (photosSnapshot.empty) {
        console.log('No photos found');
        setImages([]);
        setFilteredImages([]);
        setLoading(false);
        return;
      }

      const fetchedImages: UnitImage[] = await Promise.all(
        photosSnapshot.docs.map(async (docSnapshot) => {
          const data = docSnapshot.data();
          
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
              fileName: data.fileName || 'Untitled',
              fileType: data.fileType || 'Unknown',
              uploadedByName: uploadedByName,
              companyId: data.companyId || companyId,
              isVideo: data.isVideo || false
            } as UnitImage;
          } catch (error) {
            console.error("Error processing image:", error);
            return {
              ...data,
              id: docSnapshot.id,
              fileName: data.fileName || 'Untitled',
              fileType: data.fileType || 'Unknown',
              uploadedByName: data.uploadedByName || 'Unknown User',
              companyId: data.companyId || companyId,
              isVideo: data.isVideo || false
            } as UnitImage;
          }
        })
      );

      setImages(fetchedImages);
      setFilteredImages(fetchedImages);
    } catch (error) {
      console.error("Error fetching images:", error);
      notification.error({
        message: 'Failed to fetch images',
        description: 'Failed to fetch images'
      });
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchImages();
      }
    });

    return () => unsubscribe();
  }, [fetchImages]);

  const handleFileChange = (info: UploadChangeParam<AntUploadFile<any>>) => {
    const { fileList: newFileList } = info;
    
    const filteredNewFiles = newFileList
      .filter((file) => file.originFileObj && isFileTypeAllowed(file.originFileObj))
      .filter((newFile) => 
        !fileList.some(existingFile => existingFile.name === newFile.name)
      );

    const updatedFileList = [...fileList, ...filteredNewFiles] as CustomUploadFile[];
    
    setFileList(updatedFileList);
    form.setFieldsValue({
      file: updatedFileList
    });
  };

  const handleFilterChange = (value: string) => {
    setFilterType(value || '');
  };

  const handleNewImageClick = () => {
    setUploadModalVisible(true);
    form.resetFields();
  };

  const handleUploadModalClose = () => {
    if (uploadProgress > 0 && uploadProgress < 100) {
      return;
    }
    setUploadModalVisible(false);
    form.resetFields();
    setFileList([]);
    setUploadProgress(0);
  };

  const handlePreviewModalClose = () => {
    if (videoRef) {
      videoRef.pause();
      videoRef.currentTime = 0;
    }
    setPreviewImage(null);
    setPreviewModalVisible(false);
  };

  const handleRowClick = (image: UnitImage) => {
    if (!isSelectionMode && image.isVideo) {
      setPreviewImage(image);
      setPreviewModalVisible(true);
    }
  };

  const handleDeleteSelected = async () => {
    try {
      for (const itemId of selectedItems) {
        const imageToDelete = images.find(image => image.id === itemId);
        if (imageToDelete?.id) {
          const imageDocRef = doc(db, 'properties', propertyId, 'images', imageToDelete.id);
          await deleteDoc(imageDocRef);
          
          if (imageToDelete.fileUrl) {
            const storageRef = ref(storage, imageToDelete.fileUrl);
            await deleteObject(storageRef);
          }
        }
      }
      
      // Update the images list
      setImages(prevImages => prevImages.filter(image => 
        !selectedItems.includes(image.id || '')
      ));
      setFilteredImages(prevFiltered => prevFiltered.filter(image => 
        !selectedItems.includes(image.id || '')
      ));
      
      // Clear selections and exit selection mode
      setSelectedItems([]);
      setIsSelectionMode(false);
      
      notification.success({
        message: 'Delete Success',
        description: 'Selected items deleted successfully'
      });
    } catch (error) {
      console.error("Error deleting items: ", error);
      notification.error({
        message: 'Delete Failed',
        description: 'Failed to delete selected items'
      });
    }
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




  const handleFormSubmit = async (values: any) => {
    try {
      if (!auth.currentUser?.uid) {
        notification.error({
          message: 'Authentication Error',
          description: 'User is not authenticated'
        });
        return;
      }

      const currentUser = auth.currentUser;

      // First get the property's companyId
      const propertyDocRef = doc(db, 'properties', propertyId);
      const propertyDoc = await getDoc(propertyDocRef);
      if (!propertyDoc.exists()) {
        throw new Error('Property not found');
      }
      
      const companyId = propertyDoc.data().companyuid;
      if (!companyId) {
        throw new Error('Company ID not found for this property');
      }

      // Get the user's full name
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists()) {
        throw new Error('User document not found');
      }
      const userData = userDoc.data() as UserData;
      const userFullName = `${userData.firstName} ${userData.lastName}` || currentUser.email || 'Unknown User';

      if (!fileList || fileList.length === 0) {
        throw new Error('No files selected');
      }

      const totalFiles = fileList.length;
      setUploadedFiles(0);
      setTotalProgress(0);

      await Promise.all(fileList.map(async (fileItem, index) => {
        const file = fileItem.originFileObj;
        const fileName = fileItem.name;
        const storageFileName = `${uuidv4()}-${fileName}`;
        const storageRef = ref(storage, `properties/${propertyId}/photos/${storageFileName}`);
        
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
                const extension = getFileExtension(fileName);
                const isVideo = ['mp4', 'webm', 'avi', 'wmv', 'mpeg', 'm4v', 'mov'].includes(extension);
                
                const newImage: UnitImage = {
                  fileName: fileName,
                  fileType: isVideo ? 'Video' : 'Image',
                  uploadDate: Timestamp.now(),
                  size: Math.round((file.size / 1024) * 100) / 100,
                  uploadedBy: currentUser.uid,
                  uploadedByName: userFullName,
                  fileUrl: downloadURL,
                  companyId: companyId,
                  isVideo: isVideo
                };

                const photosRef = collection(db, 'properties', propertyId, 'photos');
                await addDoc(photosRef, newImage);
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
      notification.success({
        message: 'Upload Complete',
        description: 'All files uploaded successfully'
      });
      handleUploadModalClose();
      await fetchImages();
      
    } catch (error: any) {
      console.error("Error adding files: ", error);
      notification.error({
        message: 'Upload Failed',
        description: error.message || 'Failed to upload files'
      });
      setTotalProgress(0);
      setUploadedFiles(0);
    }
  };

  useEffect(() => {
    const filtered = images.filter(image => {
      const typeMatch = !filterType || 
        (image.fileType?.toLowerCase()?.includes(filterType.toLowerCase()) ?? false);
      return typeMatch;
    });
    setFilteredImages(filtered);
  }, [images, filterType]);

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    if (isSelectionMode) {
      // Clear selections when exiting selection mode
      setSelectedItems([]);
    }
  };

  const handleCardSelection = (itemId: string) => {
    if (!isSelectionMode) return;
    
    setSelectedItems(prev => {
      if (prev.includes(itemId)) {
        return prev.filter(id => id !== itemId);
      } else {
        return [...prev, itemId];
      }
    });
  };

  const handleCardClick = (item: UnitImage, e: React.MouseEvent) => {
    if (isSelectionMode) {
      handleCardSelection(item.id || '');
    } else {
      if (item.isVideo) {
        handleRowClick(item);
      } else {
        // For images, trigger the preview by clicking the hidden preview button
        const previewButton = e.currentTarget.querySelector('.ant-image-mask');
        if (previewButton) {
          (previewButton as HTMLElement).click();
        }
      }
    }
  };

  // Use the props to control the modal visibility
  useEffect(() => {
    if (isModalOpen) {
      // Open your image upload modal here
      // ... your modal opening logic
    }
  }, [isModalOpen]);

  useEffect(() => {
    if (shouldOpenUploadModal) {
      setUploadModalVisible(true);
      setShouldOpenUploadModal?.(false); // Reset the flag after opening
    }
  }, [shouldOpenUploadModal, setShouldOpenUploadModal]);

  return (
    <div className="property-photos-container">
      <div className="property-photos-box">
        <Row gutter={16} justify="space-between" align="middle" style={{ marginBottom: '16px' }}>
          <Col xs={24} sm={24} md={12} lg={12}>
            <Row gutter={16} wrap={false}>
              <Col>
                <Select
                  className='property-photos-dropdown-input'
                  placeholder="Filter by type"
                  onChange={handleFilterChange}
                  allowClear
                  style={{ width: 150 }}
                >
                  <Option value="Image">Image</Option>
                  <Option value="Video">Video</Option>
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
            className="new-image-button-container"
          >
            <Space>
              {isSelectionMode ? (
                <>
                  <Button
                    onClick={handleDeleteSelected}
                    type="primary"
                    danger
                    disabled={selectedItems.length === 0}
                    icon={<DeleteOutlined />}
                    className="property-photos-delete-selected-button"
                  >
                    Delete Selected ({selectedItems.length})
                  </Button>
                  <Button
                    onClick={toggleSelectionMode}
                    icon={<CloseOutlined />}
                    className="property-photos-cancel-selection-button"
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={toggleSelectionMode}
                    icon={<SelectOutlined />}
                    className="property-photos-select-button"
                  >
                    Select
                  </Button>
                  <Button
                    className='property-photos-new-image-button'
                    onClick={handleNewImageClick}
                    type="default"
                    icon={<PlusOutlined />}
                  >
                    Upload New
                  </Button>
                </>
              )}
            </Space>
          </Col>
        </Row>

        <Divider style={{ margin: '0 0 24px 0' }} />

        {loading ? (
          <List
            grid={{
              gutter: 16,
              xs: 1,
              sm: 2,
              md: 3,
              lg: 4,
              xl: 4,
              xxl: 5,
            }}
            dataSource={Array.from({ length: 5 }, (_, index) => ({ key: `loading-${index}` }))}
            renderItem={(_, index) => (
              <List.Item>
                <Card
                  style={{ width: '100%' }}
                  bodyStyle={{ padding: '12px' }}
                  cover={
                    <Skeleton.Image 
                      active
                      className="skeleton-node-full-width"
                      style={{ 
                        width: '100%', 
                        height: 200,
                        borderTopLeftRadius: '8px',
                        borderTopRightRadius: '8px',
                        padding: 0,
                        margin: 0,
                      }} 
                    />
                  }
                >
                  <div style={{ minHeight: '80px' }}>
                    <Skeleton.Input active size="small" style={{ width: '40%', marginBottom: '8px' }} />
                    <Skeleton.Input active size="small" style={{ width: '30%', marginBottom: '8px' }} />
                    <Skeleton.Input active size="small" style={{ width: '60%' }} />
                  </div>
                </Card>
              </List.Item>
            )}
            locale={{ emptyText: ' ' }}
          />
        ) : (
          <List
            loading={false}
            grid={{
              gutter: 16,
              xs: 1,
              sm: 2,
              md: 3,
              lg: 4,
              xl: 4,
              xxl: 5,
            }}
            dataSource={filteredImages}
            pagination={{
              pageSize: 12,
              showSizeChanger: false
            }}
            renderItem={(item: UnitImage) => (
              <List.Item>
                <Card
                  hoverable
                  style={{ 
                    cursor: isSelectionMode ? 'default' : 'pointer', 
                    width: '100%', 
                    flex: 1,
                    border: selectedItems.includes(item.id || '') ? '2px solid #1890ff' : undefined
                  }}
                  bodyStyle={{ padding: '12px' }}
                  onClick={(e) => handleCardClick(item, e)}
                  cover={
                    item.isVideo ? (
                      <div style={{
                        height: 200,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#f5f5f5',
                        borderTopLeftRadius: '6px',
                        borderTopRightRadius: '6px',
                        overflow: 'hidden',
                        width: '100%'
                      }}>
                        <PlaySquareOutlined style={{ fontSize: '40px', color: '#168033' }} />
                      </div>
                    ) : (
                      <div 
                        style={{
                          borderTopLeftRadius: '6px',
                          borderTopRightRadius: '6px',
                          overflow: 'hidden',
                          width: '100%',
                          position: 'relative'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isSelectionMode) {
                            handleCardSelection(item.id || '');
                          }
                        }}
                      >
                        <Image
                          src={item.fileUrl}
                          alt={item.fileName}
                          style={{ 
                            height: 200, 
                            objectFit: 'cover',
                            width: '100%',
                            display: 'block'
                          }}
                          preview={!isSelectionMode}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isSelectionMode) {
                              handleCardSelection(item.id || '');
                            }
                          }}
                        />
                      </div>
                    )
                  }
                >
                  <div style={{ minHeight: '80px' }}>
                    <Typography.Text type="secondary" style={{ fontSize: '12px' }}>
                      {item.fileType} • {item.size} KB
                    </Typography.Text>
                    <div style={{ 
                      marginTop: '4px', 
                      fontSize: '12px', 
                      color: '#000000'
                    }}>
                      {item.uploadDate instanceof Timestamp 
                        ? item.uploadDate.toDate().toLocaleDateString()
                        : new Date(item.uploadDate).toLocaleDateString()}
                    </div>
                    <Typography.Text style={{ 
                      fontSize: '12px',
                      display: 'block',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      color: '#000000'
                    }}>
                      Uploaded by: {item.uploadedByName}
                    </Typography.Text>
                  </div>
                </Card>
              </List.Item>
            )}
            locale={{ emptyText: ' ' }}
          />
        )}
      </div>

      <Modal
        title="Upload Images & Videos"
        visible={uploadModalVisible}
        onCancel={handleUploadModalClose}
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
          Here, you can upload images and videos to this unit.
        </p>

        <Form form={form} onFinish={handleFormSubmit}>
          <Form.Item
            name="file"
            valuePropName="fileList"
            getValueFromEvent={(e) => e && e.fileList}
            rules={[{ required: true, message: 'Please upload at least one file' }]}
            style={{ width: '100%', marginTop: 0 }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
              {/* File list display */}
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
                    {file.type?.includes('video') ? 
                      <PlaySquareOutlined style={{ fontSize: '24px', color: '#168033' }} /> : 
                      <FileImageOutlined style={{ fontSize: '24px', color: '#168033' }} />
                    }
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
                            maxWidth: '35ch'
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

              {/* Upload dragger area */}
              <Upload.Dragger
                multiple={true}
                beforeUpload={() => false}
                onChange={handleFileChange}
                className="full-width-upload"
                showUploadList={false}
                accept="image/jpeg,image/png,image/gif,image/svg+xml,image/webp,video/mp4,video/webm,video/avi,video/x-ms-wmv,video/mpeg,video/x-m4v,video/quicktime"
                style={{ 
                  padding: '8px',
                  height: '100px'
                }}
              >
                <p style={{ marginBottom: '2px' }}>
                  <CameraOutlined style={{ fontSize: '20px', color: '#28A744' }} />
                </p>
                <p style={{ marginBottom: '2px' }}>
                  Drag multiple files here or <Button type="link" style={{ padding: '0' }}>click to upload</Button>
                </p>
                <p style={{ color: '#8c8c8c', fontSize: '12px', margin: 0 }}>
                  (Max upload size of 50MB)
                </p>
              </Upload.Dragger>

              {/* Upload progress */}
              {totalProgress > 0 && (
                <div className="property-photos-progress-container">
                  <div className="property-photos-progress-bar-bg">
                    <div 
                      className="property-photos-progress-bar"
                      style={{
                        width: `${totalProgress}%`,
                      }}
                    />
                  </div>
                  <div className="property-photos-progress-text">
                    {`Uploading ${uploadedFiles}/${fileList.length} files (${Math.round(totalProgress)}%)`}
                  </div>
                </div>
              )}
            </div>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={previewImage?.fileName}
        visible={previewModalVisible}
        onCancel={handlePreviewModalClose}
        footer={null}
        width="90%"
        style={{ top: 20 }}
        centered
      >
        {previewImage?.isVideo && (
          <video
            ref={(el) => setVideoRef(el)}
            controls
            style={{ 
              maxWidth: '100%', 
              maxHeight: 'calc(90vh - 100px)',
              margin: '0 auto',
              display: 'block'
            }}
            src={previewImage.fileUrl}
          >
            Your browser does not support the video tag.
          </video>
        )}
      </Modal>
    </div>
  );
};

export default PropertyPhotosComponent;
