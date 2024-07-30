import React, { useEffect, useState, useCallback } from 'react'; // Added useCallback here
import { useNavigate, useLocation } from 'react-router-dom';
import { Typography, Button, Tabs, Modal, Upload, message, Form, Input, Divider } from 'antd';
import { LeftOutlined, UploadOutlined } from '@ant-design/icons';
import { db, storage } from '../../../firebase-config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import Cropper from 'react-easy-crop';
import { Area, Point } from 'react-easy-crop/types';
import PropertyOverview from './tabs/propertyinfo_overview';
import PropertyReports from './tabs/propertyinfo_reports';
import PropertyUnits from './tabs/propertyinfo_units';
import PropertyLeases from './tabs/propertyinfo_leases';
import PropertyTenants from './tabs/propertyinfo_tenants';
import PropertySettings from './tabs/propertyinfo_settings';
import PropertyRentalApplications from './tabs/propertyinfo_rental_applications';
import './propertyInfo.css';

const { Title } = Typography;
const { TabPane } = Tabs;

interface Property {
  key: string;
  propertyName: string;
  imageUrl: string;
  propertyType: string;
  numberOfUnits: number;
  status: string;
  photos: string[];
}

const PropertyInfo: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { property } = location.state as { property: Property } || {
    key: '',
    propertyName: '',
    imageUrl: '',
    propertyType: '',
    numberOfUnits: 0,
    status: '',
    photos: [],
  };

  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState<{ title: string, description: string } | null>(null);
  const [modalType, setModalType] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string>(property.imageUrl);
  const [photos, setPhotos] = useState<string[]>(property.photos || []);
  const [cropModalVisible, setCropModalVisible] = useState(false);
  const [cropImage, setCropImage] = useState<string | undefined>(undefined);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [form] = Form.useForm();

  const handleBackClick = () => {
    navigate('/property');
  };

  const showModal = (title: string, description: string, type: string = '') => {
    setModalContent({ title, description });
    setModalType(type);
    setModalVisible(true);
    fetchPropertyInfo(); // Fetch property info when opening the modal
  };

  const handleCancel = () => {
    setModalVisible(false);
  };

  const fetchPropertyInfo = async () => {
    try {
      const propertyRef = doc(db, 'properties', property.key);
      const propertyDoc = await getDoc(propertyRef);
      if (propertyDoc.exists()) {
        const data = propertyDoc.data();
        setOwners(data.ownership || []);
        setImageUrl(data.imageUrl || '');
        setPhotos(data.photos || []);
        form.setFieldsValue({
          propertyName: data.propertyName || '',
          street1: data.address?.street1 || '',
          street2: data.address?.street2 || '',
          city: data.address?.city || '',
          state: data.address?.state || '',
          zip: data.address?.zip || '',
          country: data.address?.country || '',
          propertyDescription: data.description || '',
        });
      } else {
        console.log("No such document!");
      }
    } catch (error) {
      console.error("Error fetching owners: ", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPropertyInfo();
  }, [property.key]);

  const handleBannerUpload = async (file: File) => {
    const storageRef = ref(storage, `properties/${property.key}/banner/${file.name}`);
    try {
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      setImageUrl(downloadURL);

      const propertyRef = doc(db, 'properties', property.key);
      await updateDoc(propertyRef, {
        imageUrl: downloadURL
      });

      message.success(`${file.name} file uploaded successfully`);
    } catch (error) {
      console.error("Error uploading banner image: ", error);
      message.error("Failed to upload banner image. Please check your permissions.");
    }
    return false;
  };

  const handlePhotosUpload = async (file: File) => {
    const storageRef = ref(storage, `properties/${property.key}/photos/${file.name}`);
    try {
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      setPhotos([...photos, downloadURL]);

      const propertyRef = doc(db, 'properties', property.key);
      await updateDoc(propertyRef, {
        photos: [...photos, downloadURL]
      });

      message.success(`${file.name} file uploaded successfully`);
    } catch (error) {
      console.error("Error uploading photo: ", error);
      message.error("Failed to upload photo. Please check your permissions.");
    }
    return false;
  };

  const handleResize = () => {
    setCropImage(imageUrl);
    setCropModalVisible(true);
  };

  const handleDelete = async () => {
    if (!imageUrl) return;

    const imageRef = ref(storage, imageUrl);
    try {
      await deleteObject(imageRef);
      setImageUrl('');

      const propertyRef = doc(db, 'properties', property.key);
      await updateDoc(propertyRef, {
        imageUrl: ''
      });

      message.success("Banner image deleted successfully");
    } catch (error) {
      console.error("Error deleting banner image: ", error);
      message.error("Failed to delete banner image. Please check your permissions.");
    }
  };

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const getCroppedImg = async (imageSrc: string, pixelCrop: Area) => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) return null;

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise<string>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          console.error('Canvas is empty');
          return reject(new Error('Canvas is empty'));
        }
        const fileUrl = window.URL.createObjectURL(blob);
        resolve(fileUrl);
      }, 'image/jpeg');
    });
  };

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.setAttribute('crossOrigin', 'anonymous'); // needed to avoid cross-origin issues on CodeSandbox
      image.src = url;
    });

  const saveCroppedImage = async () => {
    if (!cropImage || !croppedAreaPixels) return;
    try {
      const croppedImageUrl = await getCroppedImg(cropImage, croppedAreaPixels);
      if (croppedImageUrl) {
        setImageUrl(croppedImageUrl);

        const propertyRef = doc(db, 'properties', property.key);
        await updateDoc(propertyRef, {
          imageUrl: croppedImageUrl
        });

        message.success("Banner image updated successfully");
      }
      setCropModalVisible(false);
    } catch (error) {
      console.error("Error saving cropped image: ", error);
      message.error("Failed to save cropped image. Please try again.");
    }
  };

  const renderPhotosModal = () => (
    <div className="photos-modal-content">
      <div className="banner-image-section">
        <Title level={4}>Banner Image</Title>
        <Upload.Dragger name="files" multiple={false} beforeUpload={handleBannerUpload}>
          {imageUrl ? (
            <img src={imageUrl} alt="Banner" className="banner-image-preview" />
          ) : (
            <>
              <p className="ant-upload-drag-icon">
                <UploadOutlined />
              </p>
              <p className="ant-upload-text">Click or drag file to this area to upload</p>
              <p className="ant-upload-hint">Support for a single upload.</p>
            </>
          )}
        </Upload.Dragger>
        {imageUrl && (
          <div className="banner-buttons">
            <Button onClick={handleResize}>Resize</Button>
            <Button danger onClick={handleDelete}>Delete</Button>
          </div>
        )}
      </div>
      <div className="property-images-section">
        <Title level={4}>Photos</Title>
        <Upload.Dragger name="files" multiple beforeUpload={handlePhotosUpload}>
          <p className="ant-upload-drag-icon">
            <UploadOutlined />
          </p>
          <p className="ant-upload-text">Click or drag file to this area to upload</p>
          <p className="ant-upload-hint">Support for bulk upload.</p>
        </Upload.Dragger>
        <div className="property-images-list">
          {photos.map((photo, index) => (
            <img key={index} src={photo} alt={`Property ${index}`} className="property-image-preview" />
          ))}
        </div>
      </div>
    </div>
  );

  const renderCropModal = () => (
    <Modal
      visible={cropModalVisible}
      onCancel={() => setCropModalVisible(false)}
      footer={null}
      width={1000}
      bodyStyle={{ height: '700px' }}
    >
      <div className="crop-modal-content">
        <Cropper
          image={cropImage}
          crop={crop}
          zoom={zoom}
          aspect={4 / 1}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
        />
        <Button onClick={saveCroppedImage} style={{ marginTop: '10px' }}>Save</Button>
      </div>
    </Modal>
  );

  const updatePropertyName = (newName: string) => {
    form.setFieldsValue({ propertyName: newName });
  };

  return (
    <div className="property-info-container">
      <div className={`header ${!imageUrl ? 'header-no-image' : ''}`}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt="Property Header"
            className="header-image"
          />
        ) : (
          <div className="header-placeholder" />
        )}
        <Button
          icon={<LeftOutlined />}
          className="back-button"
          onClick={handleBackClick}
        />
        <div className="title-overlay">
          <Title level={2} className="property-title">
            {property.propertyName || 'No Name'}
          </Title>
        </div>
      </div>
      <div className="content-container">
        <Tabs defaultActiveKey="1" className="property-tabs">
          <TabPane tab="Overview" key="1">
            <PropertyOverview property={property} />
          </TabPane>
          <TabPane tab="Reports" key="2">
            <PropertyReports />
          </TabPane>
          <TabPane tab="Units" key="3">
            <PropertyUnits propertyId={property.key} />
          </TabPane>
          <TabPane tab="Leases" key="4">
            <PropertyLeases />
          </TabPane>
          <TabPane tab="Tenants" key="5">
            <PropertyTenants propertyId={property.key} />
          </TabPane>
          <TabPane tab="Rental Applications" key="6">
            <PropertyRentalApplications propertyId={property.key} />
          </TabPane>

          <TabPane tab="Settings" key="7">
            <PropertySettings 
              showModal={showModal} 
              handleBannerUpload={handleBannerUpload} 
              imageUrl={imageUrl} 
              photos={photos} 
              handleResize={handleResize} 
              handleDelete={handleDelete} 
              handlePhotosUpload={handlePhotosUpload} 
              updatePropertyName={updatePropertyName}  // Pass the callback to update the name
            />
          </TabPane>
        </Tabs>
      </div>
      <Modal
        title={modalContent?.title}
        visible={modalVisible}
        onCancel={handleCancel}
        footer={null}
        width={800}
      >
        {modalType === 'photos' ? renderPhotosModal() : <p>{modalContent?.description}</p>}
      </Modal>
      {renderCropModal()}
    </div>
  );
};

export default PropertyInfo;
