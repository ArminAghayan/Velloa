import React, { useEffect, useState } from 'react';
import { 
  Button, Image, Table, Space, Tag, Modal, Progress, notification, Upload
} from 'antd';
import { InboxOutlined, DeleteOutlined } from '@ant-design/icons';
import { 
  IconPlus, IconTrash, IconX, IconStarFilled
} from '@tabler/icons-react';
import { getFirestore, doc, collection, addDoc, deleteDoc, updateDoc, getDocs } from 'firebase/firestore';
import { getStorage, ref, deleteObject, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

const { Dragger } = Upload;

interface Photo {
  id: string;
  url: string;
  name: string;
  date: string;
  isHeader: boolean;
}

interface PhotosComponentProps {
  propertyKey: string;
}

const PhotosComponent: React.FC<PhotosComponentProps> = ({ propertyKey }) => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [newPhotos, setNewPhotos] = useState<{ url: string; file: File }[]>([]);
  const [uploadKey, setUploadKey] = useState(0);
  const [isImageViewVisible, setIsImageViewVisible] = useState(false);
  const [currentImage, setCurrentImage] = useState('');
  const [headerPhotoId, setHeaderPhotoId] = useState<string | null>(null);

  const fetchPhotos = async () => {
    const db = getFirestore();
    const photosCollectionRef = collection(db, 'properties', propertyKey, 'photos');
    const querySnapshot = await getDocs(photosCollectionRef);
    const fetchedPhotos: Photo[] = [];
    querySnapshot.forEach((doc) => {
      fetchedPhotos.push({ id: doc.id, ...doc.data() } as Photo);
      if (doc.data().isHeader) {
        setHeaderPhotoId(doc.id);
      }
    });
    setPhotos(fetchedPhotos);
  };

  useEffect(() => {
    fetchPhotos();
  }, [propertyKey]);

  const resetModalState = () => {
    setNewPhotos([]);
    setUploadProgress(0);
    setIsUploading(false);
    setUploadKey(prevKey => prevKey + 1);
  };

  const handleUploadPhoto = async (file: File) => {
    const storage = getStorage();
    const db = getFirestore();
    const uuid = uuidv4();
    const storageRef = ref(storage, `properties/${propertyKey}/photos/${uuid}`);
    
    try {
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      const newPhoto: Omit<Photo, 'id'> = {
        url: downloadURL,
        name: file.name,
        date: new Date().toISOString(),
        isHeader: photos.length === 0,
      };
      
      const photosCollectionRef = collection(db, 'properties', propertyKey, 'photos');
      const docRef = await addDoc(photosCollectionRef, newPhoto);
      
      if (newPhoto.isHeader) {
        setHeaderPhotoId(docRef.id);
      }
      
      await fetchPhotos();
      
      notification.success({
        message: 'Upload Successful',
        description: `${file.name} has been uploaded successfully.`,
      });
      
      return true;
    } catch (error) {
      console.error("Error uploading photo: ", error);
      notification.error({
        message: 'Upload Failed',
        description: `Failed to upload ${file.name}.`,
      });
      return false;
    }
  };

  const handleDeleteImages = async () => {
    const db = getFirestore();
    const storage = getStorage();
    
    try {
      for (const key of selectedRowKeys) {
        const photo = photos.find(p => p.id === key);
        if (photo) {
          // Delete from Storage
          const storageRef = ref(storage, photo.url);
          await deleteObject(storageRef);
          
          // Delete from Firestore
          const photoDocRef = doc(db, 'properties', propertyKey, 'photos', photo.id);
          await deleteDoc(photoDocRef);
        }
      }
      
      await fetchPhotos(); // Refresh the photos list
      setSelectedRowKeys([]);
      
      notification.success({
        message: 'Images Deleted',
        description: 'The selected images have been successfully deleted.',
        placement: 'top',
      });
    } catch (error) {
      console.error("Error deleting images: ", error);
      notification.error({
        message: 'Deletion Failed',
        description: 'There was an error deleting the images. Please try again.',
        placement: 'top',
      });
    }
  };

  const handleMarkAsHeader = async () => {
    if (selectedRowKeys.length === 1) {
      const db = getFirestore();
      const newHeaderId = selectedRowKeys[0] as string;
      
      try {
        // Remove header status from old header
        if (headerPhotoId) {
          const oldHeaderDocRef = doc(db, 'properties', propertyKey, 'photos', headerPhotoId);
          await updateDoc(oldHeaderDocRef, { isHeader: false });
        }
        
        // Set new header
        const newHeaderDocRef = doc(db, 'properties', propertyKey, 'photos', newHeaderId);
        await updateDoc(newHeaderDocRef, { isHeader: true });
        
        setHeaderPhotoId(newHeaderId);
        await fetchPhotos(); // Refresh the photos list
        setSelectedRowKeys([]);
        
        notification.success({
          message: 'Header Updated',
          description: 'The header photo has been updated successfully.',
          placement: 'top',
        });
      } catch (error) {
        console.error("Error updating header: ", error);
        notification.error({
          message: 'Update Failed',
          description: 'There was an error updating the header photo. Please try again.',
          placement: 'top',
        });
      }
    }
  };

  const handleCancelSelection = () => {
    setSelectedRowKeys([]);
  };

  const showUploadModal = () => {
    setIsUploadModalVisible(true);
  };

  const handleUploadModalCancel = () => {
    setIsUploadModalVisible(false);
    setUploadProgress(0);
    setNewPhotos([]);
    resetModalState();
  };

  const handleUploadModalSave = async () => {
    if (newPhotos.length > 0) {
      for (const photo of newPhotos) {
        await handleUploadPhoto(photo.file);
      }
      setNewPhotos([]);
    }
    setIsUploadModalVisible(false);
    setUploadProgress(0);
    fetchPhotos();
    resetModalState();
  };

  const handleRemoveNewPhoto = (index: number) => {
    setNewPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleRowClick = (record: Photo) => {
    setCurrentImage(record.url);
    setIsImageViewVisible(true);
  };

  const handleImageViewClose = () => {
    setIsImageViewVisible(false);
  };

  const uploadProps = {
    name: 'file',
    multiple: true,
    accept: 'image/*',
    showUploadList: false,
    beforeUpload: (file: File) => {
      setIsUploading(true);
      setUploadProgress(0);
      const url = URL.createObjectURL(file);
      setNewPhotos(prev => [...prev, { url, file }]);
      setUploadProgress(100);
      setIsUploading(false);
      return false; // Prevent default upload behavior
    },
    onProgress: (info: any) => {
      setUploadProgress(info.percent);
    },
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Preview',
      dataIndex: 'url',
      key: 'preview',
      render: (url: string, record: Photo) => (
        <Image
          src={url}
          alt={record.name}
          width={50}
          height={50}
          style={{ objectFit: 'cover' }}
          preview={false}
        />
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_: any, record: Photo) => (
        record.isHeader ? <Tag color="blue">Header</Tag> : null
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedRowKeys: React.Key[]) => {
      setSelectedRowKeys(selectedRowKeys);
    },
  };

  return (
    <div className="photo-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2>Photos</h2>
        <Space>
          {selectedRowKeys.length > 0 && (
            <>
              <Button icon={<IconTrash size={16} />} onClick={handleDeleteImages}>Delete</Button>
              <Button icon={<IconX size={16} />} onClick={handleCancelSelection}>Cancel</Button>
              {selectedRowKeys.length === 1 && (
                <Button icon={<IconStarFilled size={16} />} onClick={handleMarkAsHeader}>Mark as Header</Button>
              )}
            </>
          )}
          <Button type="primary" icon={<IconPlus size={16} />} onClick={showUploadModal}>
            Add Photo
          </Button>
        </Space>
      </div>
      <Table
        rowSelection={rowSelection}
        columns={columns}
        dataSource={photos}
        rowKey="id"
        pagination={{ pageSize: 6 }}
        onRow={(record) => ({
          onClick: () => handleRowClick(record),
        })}
      />
      <Modal
        title="Upload Photos"
        visible={isUploadModalVisible}
        onCancel={handleUploadModalCancel}
        onOk={handleUploadModalSave}
        okText="Save"
        cancelText="Cancel"
      >
        <Dragger {...uploadProps}>
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">Click or drag file to this area to upload</p>
          <p className="ant-upload-hint">
            Support for a single or bulk upload.
          </p>
        </Dragger>
        {isUploading && (
          <Progress percent={uploadProgress} status="active" style={{ marginTop: 16 }} />
        )}
        {newPhotos.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <h4>Newly Uploaded Photos:</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              {newPhotos.map((photo, index) => (
                <div key={index} style={{ position: 'relative', margin: 4 }}>
                  <Image
                    src={photo.url}
                    alt={`New Photo ${index + 1}`}
                    style={{ width: 100, height: 100, objectFit: 'cover' }}
                  />
                  <Button
                    icon={<DeleteOutlined />}
                    size="small"
                    style={{ position: 'absolute', top: 5, right: 5 }}
                    onClick={() => handleRemoveNewPhoto(index)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
      <Modal
        visible={isImageViewVisible}
        onCancel={handleImageViewClose}
        footer={null}
        width="80%"
      >
        <img alt="Full size" style={{ width: '100%' }} src={currentImage} />
      </Modal>
    </div>
  );
};

export default PhotosComponent;
