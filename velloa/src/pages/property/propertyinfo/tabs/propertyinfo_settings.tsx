import React from 'react';
import { Row, Col, Card, Typography, Button, Upload } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { 
  IconSettings, IconPhoto, IconBuildingBank, IconHome2, IconUserCircle, 
  IconPigMoney, IconFileDollar, IconFiles, IconMailbox, IconDeviceFloppy, 
  IconPencil 
} from '@tabler/icons-react';

const { Title, Text } = Typography;

interface PropertySettingsProps {
  showModal: (title: string, description: string, type?: string) => void;
  handleBannerUpload: (file: File) => Promise<boolean>;
  imageUrl: string;
  photos: string[];
  handleResize: () => void;
  handleDelete: () => void;
  handlePhotosUpload: (file: File) => Promise<boolean>;
}

const PropertyInfoSettings: React.FC<PropertySettingsProps> = ({ 
  showModal, handleBannerUpload, imageUrl, photos, handleResize, handleDelete, handlePhotosUpload 
}) => {
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

  return (
    <Row gutter={16} className="settings-row">
      <Col span={6} className="property-col">
        <button className="settings-card-button" onClick={() => showModal("General Information", "Update your property address, name and description.")}>
          <Card className="settings-card">
            <div className="settings-card-content">
              <IconSettings className="settings-card-icon" size={48} />
              <div className="settings-card-details">
                <Title level={5} className="settings-card-title">General Information</Title>
                <Text className="settings-card-description">Update your property address, name and description.</Text>
              </div>
            </div>
          </Card>
        </button>
      </Col>
      <Col span={6} className="property-col">
        <button className="settings-card-button" onClick={() => showModal("Photos", "Upload photos for this property", "photos")}>
          <Card className="settings-card">
            <div className="settings-card-content">
              <IconPhoto className="settings-card-icon" size={48} />
              <div className="settings-card-details">
                <Title level={5} className="settings-card-title">Photos</Title>
                <Text className="settings-card-description">Upload photos for this property</Text>
              </div>
            </div>
          </Card>
        </button>
      </Col>
      <Col span={6} className="property-col">
        <button className="settings-card-button" onClick={() => showModal("Bank Accounts", "Select the property bank accounts.")}>
          <Card className="settings-card">
            <div className="settings-card-content">
              <IconBuildingBank className="settings-card-icon" size={48} />
              <div className="settings-card-details">
                <Title level={5} className="settings-card-title">Bank Accounts</Title>
                <Text className="settings-card-description">Select the property bank accounts.</Text>
              </div>
            </div>
          </Card>
        </button>
      </Col>
      <Col span={6} className="property-col">
        <button className="settings-card-button" onClick={() => showModal("Property Type", "Let us know which property")}>
          <Card className="settings-card">
            <div className="settings-card-content">
              <IconHome2 className="settings-card-icon" size={48} />
              <div className="settings-card-details">
                <Title level={5} className="settings-card-title">Property Type</Title>
                <Text className="settings-card-description">Let us know which property</Text>
              </div>
            </div>
          </Card>
        </button>
      </Col>
      <Col span={6} className="property-col">
        <button className="settings-card-button" onClick={() => showModal("Owners", "Update the owners for this property.")}>
          <Card className="settings-card">
            <div className="settings-card-content">
              <IconUserCircle className="settings-card-icon" size={48} />
              <div className="settings-card-details">
                <Title level={5} className="settings-card-title">Owners</Title>
                <Text className="settings-card-description">Update the owners for this property.</Text>
              </div>
            </div>
          </Card>
        </button>
      </Col>
      <Col span={6} className="property-col">
        <button className="settings-card-button" onClick={() => showModal("Reserve Funds", "Edit the amount of reserve funds.")}>
          <Card className="settings-card">
            <div className="settings-card-content">
              <IconPigMoney className="settings-card-icon" size={48} />
              <div className="settings-card-details">
                <Title level={5} className="settings-card-title">Reserve Funds</Title>
                <Text className="settings-card-description">Edit the amount of reserve funds.</Text>
              </div>
            </div>
          </Card>
        </button>
      </Col>
      <Col span={6} className="property-col">
        <button className="settings-card-button" onClick={() => showModal("Late Fees", "Set the late fees for these leases.")}>
          <Card className="settings-card">
            <div className="settings-card-content">
              <IconFileDollar className="settings-card-icon" size={48} />
              <div className="settings-card-details">
                <Title level={5} className="settings-card-title">Late Fees</Title>
                <Text className="settings-card-description">Set the late fees for these leases.</Text>
              </div>
            </div>
          </Card>
        </button>
      </Col>
      <Col span={6} className="property-col">
        <button className="settings-card-button" onClick={() => showModal("Tenant Portal", "Resident portal access settings Edit the tenant portal settings.")}>
          <Card className="settings-card">
            <div className="settings-card-content">
              <IconFiles className="settings-card-icon" size={48} />
              <div className="settings-card-details">
                <Title level={5} className="settings-card-title">Tenant Portal</Title>
                <Text className="settings-card-description">Resident portal access settings Edit the tenant portal settings.</Text>
              </div>
            </div>
          </Card>
        </button>
      </Col>
      <Col span={6} className="property-col">
        <button className="settings-card-button" onClick={() => showModal("Rent & Payment Notifications", "Send email and text notifications to your tenants.")}>
          <Card className="settings-card">
            <div className="settings-card-content">
              <IconMailbox className="settings-card-icon" size={48} />
              <div className="settings-card-details">
                <Title level={5} className="settings-card-title">Rent & Payment Notifications</Title>
                <Text className="settings-card-description">Send email and text notifications to your tenants.</Text>
              </div>
            </div>
          </Card>
        </button>
      </Col>
      <Col span={6} className="property-col">
        <button className="settings-card-button" onClick={() => showModal("Tenant Requests", "Get notified and automatically assign new tenant requests.")}>
          <Card className="settings-card">
            <div className="settings-card-content">
              <IconPencil className="settings-card-icon" size={48} />
              <div className="settings-card-details">
                <Title level={5} className="settings-card-title">Tenant Requests</Title>
                <Text className="settings-card-description">Get notified and automatically assign new tenant requests.</Text>
              </div>
            </div>
          </Card>
        </button>
      </Col>
      <Col span={6} className="property-col">
        <button className="settings-card-button" onClick={() => showModal("Rental Applications", "Edit the property rental applications")}>
          <Card className="settings-card">
            <div className="settings-card-content">
              <IconDeviceFloppy className="settings-card-icon" size={48} />
              <div className="settings-card-details">
                <Title level={5} className="settings-card-title">Rental Applications</Title>
                <Text className="settings-card-description">Edit the property rental applications</Text>
              </div>
            </div>
          </Card>
        </button>
      </Col>
      <Col span={6} className="property-col">
        <button className="settings-card-button" onClick={() => showModal("Payment Instructions", "Specify instructions for tenants on how they should pay their rent.")}>
          <Card className="settings-card">
            <div className="settings-card-content">
              <IconFiles className="settings-card-icon" size={48} />
              <div className="settings-card-details">
                <Title level={5} className="settings-card-title">Payment Instructions</Title>
                <Text className="settings-card-description">Specify instructions for tenants on how they should pay their rent.</Text>
              </div>
            </div>
          </Card>
        </button>
      </Col>
      <Col span={6} className="property-col">
        <button className="settings-card-button" onClick={() => showModal("Management Fees", "Calculate and generate bills automatically for your properties")}>
          <Card className="settings-card">
            <div className="settings-card-content">
              <IconFileDollar className="settings-card-icon" size={48} />
              <div className="settings-card-details">
                <Title level={5} className="settings-card-title">Management Fees</Title>
                <Text className="settings-card-description">Calculate and generate bills automatically for your properties</Text>
              </div>
            </div>
          </Card>
        </button>
      </Col>
      <Col span={6} className="property-col">
        <button className="settings-card-button" onClick={() => showModal("Payment Allocation", "Edit how payments are automatically received, either by custom priority or date.")}>
          <Card className="settings-card">
            <div className="settings-card-content">
              <IconFiles className="settings-card-icon" size={48} />
              <div className="settings-card-details">
                <Title level={5} className="settings-card-title">Payment Allocation</Title>
                <Text className="settings-card-description">Edit how payments are automatically received, either by custom priority or date.</Text>
              </div>
            </div>
          </Card>
        </button>
      </Col>
      <Col span={6} className="property-col">
        <button className="settings-card-button" onClick={() => showModal("Custom Allocations", "Add custom allocation priorities to your lease charges and credits.")}>
          <Card className="settings-card">
            <div className="settings-card-content">
              <IconPencil className="settings-card-icon" size={48} />
              <div className="settings-card-details">
                <Title level={5} className="settings-card-title">Custom Allocations</Title>
                <Text className="settings-card-description">Add custom allocation priorities to your lease charges and credits.</Text>
              </div>
            </div>
          </Card>
        </button>
      </Col>
    </Row>
  );
};

export default PropertyInfoSettings;