import React, { useState, useMemo, useEffect } from 'react';
import { 
  Card, 
  Space, 
  Typography, 
  Row, 
  Col, 
  Tag, 
  Button, 
  Empty,
  Input,
  notification,
  Avatar,
  Carousel,
  Divider,
  Alert,
  Skeleton
} from 'antd';
import { 
  EditOutlined, 
  HomeOutlined,
  ExpandOutlined,
  UserOutlined,
  FileTextOutlined,
  CopyOutlined,
  ShareAltOutlined,
  DeleteOutlined,
  MailOutlined,
  PhoneOutlined,
  CameraOutlined,
  StarOutlined,
  StarFilled,
  DollarOutlined,
  AppstoreOutlined,
  FireOutlined,
  CloudOutlined,
  CarOutlined,
  SaveOutlined,
  SendOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import { Timestamp } from 'firebase/firestore';
import { doc, updateDoc, collection, getDocs, getDoc } from 'firebase/firestore';
import { db } from '../../../../../firebase-config';
import './PropertyInfoUnitViewListing.css';
import UnitListingAmenitiesDrawer from './UnitListingDrawer/Unit_Listing_Amenities_Drawer';
import UnitListingDetailsDrawer from './UnitListingDrawer/unit_Listing_detalis_Drawer';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

// Interfaces
interface Property {
  id: string;
  propertyName?: string;
}

interface Unit {
  unitId: string;
  unitName: string;
  beds?: number;
  baths?: number;
  size?: number;
  marketRent?: number;
  ListingDescription?: string;
  ListingTitle?: string;
  status?: string;
  tenantId?: string;
  amenities?: string[];
  parking?: string;
  laundry?: string;
  interior?: string;
  appliances?: string;
  cooling?: string;
  heating?: string;
  exterior?: string;
  includedInRent?: string;
}

interface Tenant {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  email?: string;
  phone?: string;
  depositAmount?: string;
  depositDueDate?: Timestamp;
  lateFeeAmount?: string;
  lateFeeStartDay?: string;
  leaseStartDate?: Timestamp;
  leaseEndDate?: Timestamp;
  moveInDate?: Timestamp;
  paymentDate?: string;
  rentAmount?: string;
  rentDueDate?: string;
  rentersInsurance?: boolean;
  inviteToPortal?: boolean;
  unitId?: string;
}

interface UnitImage {
  id: string;
  url: string;
  fileUrl: string;
  fileName: string;
  createdAt: Timestamp;
  isVideo: boolean;
  favorite?: boolean;
}

interface PropertyInfoUnitViewListingProps {
  property: Property | null;
  unit: Unit | null;
  tenant: Tenant | null;
  companyId: string | null;
  unitImages: UnitImage[];
  onImagesUpdate: (images: UnitImage[]) => void;
  setActiveTab: (tab: string) => void;
}

// Update the interfaces to match the Firestore structure
interface CategorizedAmenities {
  'Cooling'?: string[];
  'Exterior'?: string[];
  'Heating'?: string[];
  'Included in rent'?: string[];
  'Interior & Appliances'?: string[];
  'Laundry'?: string[];
  'Parking'?: string[];
}



// Helper function to safely check array length
const hasItems = (arr: string[] | undefined): boolean => {
  console.log('Checking array:', arr);
  const result = Array.isArray(arr) && arr.length > 0;
  console.log('Has items:', result);
  return result;
};

const PropertyInfoUnitViewListing: React.FC<PropertyInfoUnitViewListingProps> = ({
  property,
  unit: initialUnit,
  tenant,
  unitImages,
  onImagesUpdate,
  setActiveTab,
}) => {
  const navigate = useNavigate();

  // Use the renamed prop in the state initialization
  const [unit, setUnit] = useState<Unit | null>(initialUnit);

  // Add state for amenities
  const [amenitiesData, setAmenitiesData] = useState<CategorizedAmenities>({
    'Cooling': [],
    'Exterior': [],
    'Heating': [],
    'Included in rent': [],
    'Interior & Appliances': [],
    'Laundry': [],
    'Parking': [],
  });
  const [unitAmenities, setUnitAmenities] = useState<string[]>([]);

  // Fetch amenities when component mounts
  useEffect(() => {
    const fetchAmenities = async () => {
      if (!property?.id || !unit?.unitId) {
        console.log('Missing property or unit ID:', { propertyId: property?.id, unitId: unit?.unitId });
        return;
      }
      
      try {
        const amenitiesRef = collection(db, 'properties', property.id, 'units', unit.unitId, 'amenities');
        const amenitiesSnapshot = await getDocs(amenitiesRef);
        
        console.log('Amenities snapshot:', amenitiesSnapshot.docs.map(doc => ({ id: doc.id, data: doc.data() })));
        
        if (!amenitiesSnapshot.empty) {
          const amenitiesDoc = amenitiesSnapshot.docs[0].data();
          console.log('Raw amenities data:', amenitiesDoc);
          
          // Check if we have categorizedAmenities
          if (amenitiesDoc.categorizedAmenities) {
            console.log('Setting amenities data:', amenitiesDoc.categorizedAmenities);
            setAmenitiesData(amenitiesDoc.categorizedAmenities);
          } else {
            console.log('No categorizedAmenities found in document');
          }
        } else {
          console.log('No amenities documents found');
        }
      } catch (error) {
        console.error('Error fetching amenities:', error);
      }
    };

    fetchAmenities();
  }, [property?.id, unit?.unitId]);

  // Add a debug effect to monitor state changes
  useEffect(() => {
    console.log('Current amenitiesData state:', amenitiesData);
  }, [amenitiesData]);

  const [isPublished, setIsPublished] = useState(false);

  // Add state to manage images locally
  const [images, setImages] = useState<UnitImage[]>(unitImages);

  // Update local images state when unitImages prop changes
  useEffect(() => {
    setImages(unitImages);
  }, [unitImages]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      notification.success({
        message: 'Copied!',
        description: `${label} has been copied to clipboard`,
        placement: 'topRight',
        duration: 3,
      });
    }).catch(() => {
      notification.error({
        message: 'Failed to copy',
        description: 'Please try again',
        placement: 'topRight',
        duration: 3,
      });
    });
  };

  const handleShare = async (text: string, title: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Velloa Listing',
          text: title,
          url: text
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          notification.error({
            message: 'Failed to share',
            description: 'Please try again',
            placement: 'topRight',
            duration: 3,
          });
        }
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      handleCopy(text, 'URL');
    }
  };

  const listingUrl = "https://app.velloaapp.com/tenant/listings/9a29a70aeb9c4c6/9a29a70aeb9c4c6";
  const screenerUrl = "https://app.velloaapp.com/tenant/listings/9a29a70aeb9c4c6/9a29a70aeb9c4c6";

  const handleStarClick = async (index: number) => {
    try {
      if (!images[index] || !images[index].id) {
        throw new Error('Invalid image data');
      }

      // Create a new array with updated favorite status
      const updatedImages = images.map((image, idx) => ({
        ...image,
        favorite: idx === index ? true : false
      }));

      // Update Firebase
      const updatePromises = updatedImages.map((image) => {
        const imgRef = doc(db, 'properties', property?.id || '', 'units', unit?.unitId || '', 'images', image.id);
        return updateDoc(imgRef, {
          favorite: image.favorite || false
        });
      });

      await Promise.all(updatePromises);

      // Update local state
      setImages(updatedImages);

      // Optionally notify the parent component
      if (onImagesUpdate) {
        onImagesUpdate(updatedImages);
      }

      notification.success({
        message: 'Favorite image updated',
        description: 'The favorite image has been updated successfully',
        placement: 'topRight',
      });
    } catch (error) {
      console.error('Error updating main image:', error);
      notification.error({
        message: 'Failed to update main image',
        description: error instanceof Error ? error.message : 'Please try again',
        placement: 'topRight',
      });
    }
  };

  // Update the mainImage useMemo to include images as a dependency
  const mainImage = useMemo(() => {
    const favoriteImage = images.find(img => img.favorite === true);
    return favoriteImage || images[0];
  }, [images]);

  const [isAmenitiesDrawerOpen, setIsAmenitiesDrawerOpen] = useState(false);
  const [isListingDetailsDrawerOpen, setIsListingDetailsDrawerOpen] = useState(false);

  const handleAmenitiesSave = async (amenities: string[]) => {
    if (!property?.id || !unit?.unitId || !companyId) {
      notification.error({
        message: 'Error',
        description: 'Missing required property information',
        placement: 'topRight',
      });
      return;
    }

    try {
      // Fetch the updated amenities data after save
      const amenitiesRef = collection(db, 'properties', property.id, 'units', unit.unitId, 'amenities');
      const amenitiesSnapshot = await getDocs(amenitiesRef);
      
      if (!amenitiesSnapshot.empty) {
        const amenitiesDoc = amenitiesSnapshot.docs[0].data();
        if (amenitiesDoc.categorizedAmenities) {
          setAmenitiesData(amenitiesDoc.categorizedAmenities);
        }
      }
    } catch (error) {
      console.error('Error refreshing amenities:', error);
      notification.error({
        message: 'Error',
        description: 'Failed to refresh amenities list',
        placement: 'topRight',
      });
    }

    setIsAmenitiesDrawerOpen(false);
  };

  const [companyId, setCompanyId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch company ID when component mounts
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userCompanyId = userDoc.data().companyuid;
            console.log('Company ID from user doc:', userCompanyId);
            setCompanyId(userCompanyId);
          } else {
            console.error('No user document found');
          }
        } catch (error) {
          console.error('Error fetching user doc:', error);
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Render loading state if still fetching company ID
  if (isLoading) {
    return (
      <Row gutter={16}>
        <Col span={16}>
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            {/* Property Card Skeleton */}
            <Card>
              <Skeleton active paragraph={{ rows: 4 }} />
              <Row gutter={16} style={{ marginTop: 16 }}>
                <Col span={16}>
                  <Skeleton.Image style={{ width: '100%', height: 300 }} />
                </Col>
                <Col span={8}>
                  <Card>
                    <Skeleton active paragraph={{ rows: 2 }} />
                  </Card>
                </Col>
              </Row>
            </Card>

            {/* Listing Details Skeleton */}
            <Card>
              <Skeleton active paragraph={{ rows: 3 }} />
            </Card>

            {/* Photos Skeleton */}
            <Card>
              <Skeleton.Image style={{ width: '100%', height: 160 }} />
            </Card>

            {/* Amenities Skeleton */}
            <Card>
              <Skeleton active paragraph={{ rows: 6 }} />
            </Card>
          </Space>
        </Col>

        <Col span={8}>
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            {/* Action Buttons Skeleton */}
            <Row gutter={8}>
              {[1, 2, 3].map(i => (
                <Col span={8} key={i}>
                  <Skeleton.Button active block style={{ height: 40 }} />
                </Col>
              ))}
            </Row>

            {/* Listing Platforms Card Skeleton */}
            <Card>
              <Skeleton active paragraph={{ rows: 4 }} />
            </Card>

            {/* Share Listing Card Skeleton */}
            <Card>
              <Skeleton active paragraph={{ rows: 4 }} />
            </Card>

            {/* Contact Card Skeleton */}
            <Card>
              <Skeleton.Avatar active size={64} style={{ marginBottom: 16 }} />
              <Skeleton active paragraph={{ rows: 3 }} />
            </Card>
          </Space>
        </Col>
      </Row>
    );
  }

  // Add this function to fetch unit details
  const fetchUnitDetails = async () => {
    if (!property?.id || !unit?.unitId) return;
    
    try {
      const unitRef = doc(db, 'properties', property.id, 'units', unit.unitId);
      const unitDoc = await getDoc(unitRef);
      
      if (unitDoc.exists()) {
        const unitData = unitDoc.data() as Unit;
        // Update the unit data in your component
        setUnit({ ...unit, ...unitData });
      }
    } catch (error) {
      console.error('Error fetching unit details:', error);
      notification.error({
        message: 'Error',
        description: 'Failed to refresh listing details',
        placement: 'topRight',
      });
    }
  };

  // Update the handler function
  const handleListingDetailsSubmit = async (values: any) => {
    setIsListingDetailsDrawerOpen(false);
    // Fetch updated unit details after drawer closes
    await fetchUnitDetails();
  };

  const handlePhotoEditClick = () => {
    setActiveTab('images');
  };

  return (
    <div>
      <Alert
        message="Your listing is currently in draft mode and is not visible to renters. Click 'Publish' to set the listing live."
        type="info"
        showIcon
        style={{ marginBottom: '16px' }}
        className="custom-alert"
      />
      <Row gutter={16}>
        <Col span={16}>
          <Space direction="vertical" size={0} style={{ width: '100%' }}>
            {/* Combined Property Info, Image, and Leads Card */}
            <Card 
              title="Property" 
              bordered={false}
              extra={
                <Space>
                  <Tag color="orange">DRAFT</Tag>
                  <Button type="text" icon={<EditOutlined />} />
                </Space>
              }
            >
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                {/* Property Info */}
                <Title level={4}>
                  {property?.propertyName || '1451 Ondulado Road, Pebble Beach, Del Monte Forest, California, 93953'}
                </Title>

                {/* Date and Payment Info */}
                <Text style={{ color: '#28A744' }}>
                Monthly payments | ${tenant?.rentAmount || '0'} | Deposit of ${tenant?.depositAmount || '0'}
                </Text>

                {/* Property Stats */}
                <Space size="large">
                  <Space>
                    <HomeOutlined />
                    <Text>House</Text>
                  </Space>
                  <Space>
                    <ExpandOutlined />
                    <Text>{unit?.size || '8394'} ft²</Text>
                  </Space>
                  <Space>
                    <HomeOutlined />
                    <Text>{unit?.beds || '7'} beds</Text>
                  </Space>
                  <Space>
                    <HomeOutlined />
                    <Text>{unit?.baths || '7'} baths</Text>
                  </Space>
                </Space>

                {/* Image and Leads Section */}
                <Row gutter={16}>
                  <Col span={16}>
                    {mainImage && (
                      <div style={{ position: 'relative' }}>
                        <img 
                          key={mainImage.id}
                          src={mainImage.fileUrl}
                          alt={`${property?.propertyName || 'Property'} main view`}
                          style={{ 
                            width: '100%', 
                            height: '300px', 
                            objectFit: 'cover',
                            borderRadius: '8px'
                          }}
                        />
                      </div>
                    )}
                  </Col>
                  <Col span={8}>
                    <Card bordered={true} style={{ height: '100%' }}>
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Space>
                          <UserOutlined style={{ color: '#8c8c8c' }} />
                          <Text>0 leads</Text>
                        </Space>
                        <Space>
                          <FileTextOutlined style={{ color: '#8c8c8c' }} />
                          <Text>0 applications</Text>
                        </Space>
                      </Space>
                    </Card>
                  </Col>
                </Row>
              </Space>
            </Card>

            {/* Listing Details Section */}
            <Card
              title="Listing details"
              extra={
                <Button 
                  type="text" 
                  icon={<EditOutlined />} 
                  onClick={() => setIsListingDetailsDrawerOpen(true)}
                />
              }
              style={{ minHeight: '250px' }}
            >
              <Title level={5}>{unit?.ListingTitle || 'No title available'}</Title>
              
              <Text>
                {unit?.ListingDescription || 'No description available'}
              </Text>
            </Card>

            {/* Photos Card */}
            <Card
              title={`Photos (${images.length})`}
              extra={<Button type="text" icon={<EditOutlined />} onClick={handlePhotoEditClick} />}
              bodyStyle={{ padding: '16px' }}
            >
              {images.length > 0 ? (
                <div style={{ position: 'relative' }}>
                  <Carousel 
                    dots={{ className: 'custom-carousel-dots' }} 
                    arrows={true}
                    slidesToShow={3}
                    slidesToScroll={3}
                    draggable={true}
                    style={{ margin: '0 -8px' }}
                  >
                    {images.map((image, index) => (
                      <div key={index}>
                        <div style={{ padding: '0 8px' }}>
                          <div className="carousel-image-container" style={{ position: 'relative' }}>
                            <img 
                              src={image.fileUrl}
                              alt={`Unit ${index + 1}`}
                              style={{ 
                                width: '100%',
                                height: '160px',
                                objectFit: 'cover',
                                borderRadius: '8px'
                              }}
                            />
                            <Button
                              className={`image-star-button ${image.favorite ? 'starred' : ''}`}
                              type="text"
                              icon={image.favorite ? 
                                <StarFilled style={{ color: '#52c41a' }} /> : 
                                <StarOutlined style={{ color: '#8c8c8c' }} />
                              }
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStarClick(index);
                              }}
                              style={{
                                position: 'absolute',
                                top: '8px',
                                right: '8px',
                                background: 'white',
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: 'none',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </Carousel>
                </div>
              ) : (
                <Empty 
                  image={<CameraOutlined style={{ fontSize: '32px', color: '#bfbfbf' }} />}
                  description="No photos uploaded yet"
                />
              )}
            </Card>

            {/* Amenities Card */}
            <Card 
              title="Amenities" 
              extra={
                <Button 
                  type="text" 
                  icon={<EditOutlined />} 
                  onClick={() => setIsAmenitiesDrawerOpen(true)}
                />
              }
            >
              <Row gutter={[24, 16]}>
                {/* First Row */}
                <Col span={12}>
                  {/* Included in Rent */}
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Space>
                      <DollarOutlined style={{ color: '#1890ff' }}/>
                      <Text strong>Included in Rent:</Text>
                    </Space>
                    <div style={{ marginLeft: '24px' }}>
                      {hasItems(amenitiesData['Included in rent']) ? (
                        <Row gutter={[8, 8]}>
                          {amenitiesData['Included in rent']?.map((amenity: string) => (
                            <Col span={24} key={amenity}>
                              <Text>{amenity}</Text>
                            </Col>
                          ))}
                        </Row>
                      ) : (
                        <Text type="secondary">No included items</Text>
                      )}
                    </div>
                  </Space>
                </Col>

                <Col span={12}>
                  {/* Interior & Appliances */}
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Space>
                      <AppstoreOutlined style={{ color: '#28A744' }}/>
                      <Text strong>Interior & Appliances:</Text>
                    </Space>
                    <div style={{ marginLeft: '24px' }}>
                      {hasItems(amenitiesData['Interior & Appliances']) ? (
                        <Row gutter={[8, 8]}>
                          {amenitiesData['Interior & Appliances']?.map((amenity: string) => (
                            <Col span={8} key={amenity}>
                              <Space>
                                <span style={{ color: '#28A744' }}>•</span>
                                <Text>{amenity}</Text>
                              </Space>
                            </Col>
                          ))}
                        </Row>
                      ) : (
                        <Text type="secondary">No interior features listed</Text>
                      )}
                    </div>
                  </Space>
                </Col>

                <Divider style={{ margin: '8px 0' }} />

                {/* Second Row */}
                <Col span={4}>
                  {/* Heating */}
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Space>
                      <FireOutlined style={{ color: '#52c41a' }}/>
                      <Text strong>Heating:</Text>
                    </Space>
                    <div style={{ marginLeft: '24px' }}>
                      {hasItems(amenitiesData['Heating']) ? (
                        <Row gutter={[8, 8]}>
                          {amenitiesData['Heating']?.map((amenity: string) => (
                            <Col span={24} key={amenity}>
                              <Text>{amenity}</Text>
                            </Col>
                          ))}
                        </Row>
                      ) : (
                        <Text type="secondary">No heating features listed</Text>
                      )}
                    </div>
                  </Space>
                </Col>

                <Col span={4}>
                  {/* Cooling */}
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Space>
                      <CloudOutlined style={{ color: '#52c41a' }}/>
                      <Text strong>Cooling:</Text>
                    </Space>
                    <div style={{ marginLeft: '24px' }}>
                      {hasItems(amenitiesData['Cooling']) ? (
                        <Row gutter={[8, 8]}>
                          {amenitiesData['Cooling']?.map((amenity: string) => (
                            <Col span={24} key={amenity}>
                              <Text>{amenity}</Text>
                            </Col>
                          ))}
                        </Row>
                      ) : (
                        <Text type="secondary">No cooling features listed</Text>
                      )}
                    </div>
                  </Space>
                </Col>

                <Col span={4}>
                  {/* Laundry */}
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Space>
                      <AppstoreOutlined style={{ color: '#52c41a' }}/>
                      <Text strong>Laundry:</Text>
                    </Space>
                    <div style={{ marginLeft: '24px' }}>
                      {hasItems(amenitiesData['Laundry']) ? (
                        <Row gutter={[8, 8]}>
                          {amenitiesData['Laundry']?.map((amenity: string) => (
                            <Col span={24} key={amenity}>
                              <Text>{amenity}</Text>
                            </Col>
                          ))}
                        </Row>
                      ) : (
                        <Text type="secondary">No laundry features listed</Text>
                      )}
                    </div>
                  </Space>
                </Col>

                <Col span={6}>
                  {/* Parking */}
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Space>
                      <CarOutlined style={{ color: '#52c41a' }}/>
                      <Text strong>Parking:</Text>
                    </Space>
                    <div style={{ marginLeft: '24px' }}>
                      {hasItems(amenitiesData['Parking']) ? (
                        <Row gutter={[8, 8]}>
                          {amenitiesData['Parking']?.map((amenity: string) => (
                            <Col span={24} key={amenity}>
                              <Text>{amenity}</Text>
                            </Col>
                          ))}
                        </Row>
                      ) : (
                        <Text type="secondary">No parking features listed</Text>
                      )}
                    </div>
                  </Space>
                </Col>

                <Col span={6}>
                  {/* Exterior */}
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Space>
                      <HomeOutlined style={{ color: '#52c41a' }}/>
                      <Text strong>Exterior:</Text>
                    </Space>
                    <div style={{ marginLeft: '24px' }}>
                      {hasItems(amenitiesData['Exterior']) ? (
                        <Row gutter={[8, 8]}>
                          {amenitiesData['Exterior']?.map((amenity: string) => (
                            <Col span={24} key={amenity}>
                              <Text>{amenity}</Text>
                            </Col>
                          ))}
                        </Row>
                      ) : (
                        <Text type="secondary">No exterior features listed</Text>
                      )}
                    </div>
                  </Space>
                </Col>
              </Row>
            </Card>
          </Space>
        </Col>

        {/* Right Column */}
        <Col span={8}>
          <Space direction="vertical" size={0} style={{ width: '100%' }}>
            {/* Action Buttons */}
            <Row gutter={8} style={{ marginBottom: '20px' }} justify="end">
              <Col span={8}>
                <Button 
                  type="default"
                  disabled={!isPublished}
                  icon={<DeleteOutlined />}
                  style={{ 
                    width: '100%', 
                    height: '40px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    backgroundColor: '#FFFFFF',
                    justifyContent: 'center'
                  }}
                >
                  Remove listing
                </Button>
              </Col>

              <Col span={8}>
                <Button 
                  type="default"
                  icon={<SaveOutlined />}
                  style={{ 
                    width: '100%', 
                    height: '40px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    backgroundColor: '#FFFFFF',
                    justifyContent: 'center'
                  }}
                >
                  Save as draft
                </Button>
              </Col>
              <Col span={8}>
                <Button 
                  type="primary"
                  icon={<SendOutlined />}
                  style={{ 
                    width: '100%', 
                    height: '40px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    justifyContent: 'center'
                  }}
                >
                  Publish
                </Button>
              </Col>
            </Row>

            {/* Listing Platforms Card */}
            <Card 
              title={
                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <span>Listing Platforms</span>
                  <Button 
                    type="link" 
                    onClick={() => window.location.href = '/settings'}
                  >
                    Set up
                  </Button>
                </Space>
              }
            
            >
              <Text type="secondary">
                Your listing is being listed on the following platforms. Use the links below to review details. 
              </Text>
              
              <Row gutter={[16, 16]} style={{ marginTop: '20px' }}>
                {['Zillow', 'Zolo', 'Hotpads', 'Trulia', 'Zumper', 'Rental Source', 'Website'].map(platform => (
                  <Col key={platform}>
                    <Button 
                      icon={<LinkOutlined />}
                      style={{ 
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      {platform}
                    </Button>
                  </Col>
                ))}
              </Row>
            </Card>

            {/* Share Listing Card */}
            <Card title="Share listing">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text type="secondary">Listing URL</Text>
                  <Input 
                    readOnly
                    value={listingUrl}
                    style={{ 
                      width: '100%', 
                      marginBottom: '8px',
                      cursor: 'pointer'
                    }}
                    onClick={() => handleCopy(listingUrl, 'Listing URL')}
                  />
                  <Space>
                    <Button 
                      type="text" 
                      icon={<CopyOutlined />}
                      style={{ padding: '4px 8px' }}
                      onClick={() => handleCopy(listingUrl, 'Listing URL')}
                    >
                      Copy
                    </Button>
                    <Button 
                      type="text" 
                      icon={<ShareAltOutlined />}
                      style={{ padding: '4px 8px' }}
                      onClick={() => handleShare(listingUrl, 'Check out this property listing')}
                    >
                      Share
                    </Button>
                  </Space>
                </div>
                
                <div style={{ marginTop: '16px' }}>
                  <Text type="secondary">Pre-Screener URL</Text>
                  <Input 
                    readOnly
                    value={screenerUrl}
                    style={{ 
                      width: '100%', 
                      marginBottom: '8px',
                      cursor: 'pointer'
                    }}
                    onClick={() => handleCopy(screenerUrl, 'Pre-screener URL')}
                  />
                  <Space>
                    <Button 
                      type="text" 
                      icon={<CopyOutlined />}
                      style={{ padding: '4px 8px' }}
                      onClick={() => handleCopy(screenerUrl, 'Pre-screener URL')}
                    >
                      Copy
                    </Button>
                    <Button 
                      type="text" 
                      icon={<ShareAltOutlined />}
                      style={{ padding: '4px 8px' }}
                      onClick={() => handleShare(screenerUrl, 'Complete your pre-screening')}
                    >
                      Share
                    </Button>
                  </Space>
                </div>
              </Space>
            </Card>

            {/* Contact Card */}
            <Card 
              title="Contact"
              extra={<Button type="text" icon={<EditOutlined />} />}
            >
              <Space direction="vertical" align="center" style={{ width: '100%' }}>
                <Avatar 
                  size={64}
                  style={{ 
                    backgroundColor: '#f0f0f0',
                    color: '#595959',
                    fontSize: '24px'
                  }}
                >
                  LR
                </Avatar>
                <Text strong style={{ fontSize: '16px', marginTop: '8px' }}>
                  Logan Ransley
                </Text>
                <Space direction="vertical" align="center">
                  <Button 
                    type="text" 
                    icon={<MailOutlined />}
                    style={{ color: '#595959' }}
                    onClick={() => handleCopy('logan@landlordstudio.com', 'Email')}
                  >
                    logan@Velloaapp.com
                  </Button>
                  <Button 
                    type="text" 
                    icon={<PhoneOutlined />}
                    style={{ color: '#595959' }}
                    onClick={() => handleCopy('No phone number', 'Phone number')}
                  >
                    No phone number
                  </Button>
                </Space>
              </Space>
            </Card>
          </Space>
        </Col>
      </Row>
      {property?.id && unit?.unitId && companyId && (
        <>
          <UnitListingAmenitiesDrawer
            open={isAmenitiesDrawerOpen}
            onClose={() => setIsAmenitiesDrawerOpen(false)}
            onSave={handleAmenitiesSave}
            currentAmenities={unitAmenities}
            propertyId={property.id}
            unitId={unit.unitId}
            companyId={companyId || ''} 
          />

          <UnitListingDetailsDrawer
            unitId={unit.unitId}
            propertyId={property.id}
            open={isListingDetailsDrawerOpen}
            onClose={() => setIsListingDetailsDrawerOpen(false)}
            onSubmit={handleListingDetailsSubmit}
            companyId={companyId || ''} 
          /> 
        </>
      )}
    </div>
  );
};

export default PropertyInfoUnitViewListing;