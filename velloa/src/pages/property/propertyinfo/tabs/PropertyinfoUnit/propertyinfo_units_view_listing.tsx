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
import { doc, updateDoc, collection, getDocs, getDoc, addDoc, query, where } from 'firebase/firestore';
import { db } from '../../../../../firebase-config';
import './PropertyInfoUnitViewListing.css';
import UnitListingAmenitiesDrawer from './UnitListingDrawer/Unit_Listing_Amenities_Drawer';
import UnitListingDetailsDrawer from './UnitListingDrawer/unit_Listing_detalis_Drawer';
import { getAuth } from 'firebase/auth';
import UnitListingPropertyDrawer from './UnitListingDrawer/unit_Listing_property_drawer';
import UnitListingContactDrawer from './UnitListingDrawer/unit_Listing_contact_drawer';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

// Interfaces
interface PropertyAddress {
  street?: string;
  unit?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

interface Property {
  id: string;
  propertyName?: string;
  address?: PropertyAddress;
  propertySettings?: {
    propertyType?: string;
    propertyKind?: string;
  };
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
  contactInfo?: {
    type: 'user' | 'custom';
    userId?: string;
    firstName?: string;
    middleName?: string;
    lastName?: string;
    email?: string;
    phoneNumber?: string;
  };
  availableDate?: Timestamp;
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

// Add this interface near the top with other interfaces
interface ListingData {
  propertyId: string;
  unitId: string;
  companyId: string;
  status: 'active' | 'draft';
  propertyName: string;
  unitName: string;
  beds?: number;
  baths?: number;
  size?: number;
  marketRent?: number;
  ListingDescription?: string;
  ListingTitle?: string;
  amenities?: CategorizedAmenities;
  contactInfo?: {
    type: 'user' | 'custom';
    userId?: string;
    firstName?: string;
    middleName?: string;
    lastName?: string;
    email?: string;
    phoneNumber?: string;
  };
  photos?: UnitImage[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  address?: PropertyAddress;
  propertySettings?: {
    propertyType?: string;
    propertyKind?: string;
  };
  availableDate?: Timestamp;
}

// Helper function to safely check array length
const hasItems = (arr: string[] | undefined): boolean => {
  console.log('Checking array:', arr);
  const result = Array.isArray(arr) && arr.length > 0;
  console.log('Has items:', result);
  return result;
};

const formatPhoneNumber = (value: string): string => {
  if (!value) return '';
  const phoneNumber = value.replace(/\D/g, '');
  if (phoneNumber.length >= 10) {
    return `(${phoneNumber.slice(0, 3)})-${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
  }
  return phoneNumber;
};

const formatAvailableDate = (timestamp: Timestamp | null | undefined): string => {
  if (!timestamp) return 'Available Today';
  
  const availableDate = dayjs(timestamp.toDate());
  const today = dayjs();
  
  if (availableDate.isSame(today, 'day') || availableDate.isBefore(today)) {
    return 'Available Today';
  }
  
  return `Available ${availableDate.format('MMM D, YYYY')}`;
};

const PropertyInfoUnitViewListing: React.FC<PropertyInfoUnitViewListingProps> = ({
  property,
  unit: initialUnit,
  tenant,
  unitImages,
  onImagesUpdate,
  setActiveTab,
}) => {
  // Move all hooks to the top level
  const [contactInfo, setContactInfo] = useState<any>(null);
  const [unit, setUnit] = useState<Unit | null>(initialUnit);
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
  const [isPublished, setIsPublished] = useState(false);
  const [images, setImages] = useState<UnitImage[]>(unitImages);
  const [isAmenitiesDrawerOpen, setIsAmenitiesDrawerOpen] = useState(false);
  const [isListingDetailsDrawerOpen, setIsListingDetailsDrawerOpen] = useState(false);
  const [isPropertyDrawerOpen, setIsPropertyDrawerOpen] = useState(false);
  const [isContactDrawerOpen, setIsContactDrawerOpen] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [listingId, setListingId] = useState<string | null>(null);

  // Update the listingUrls useMemo
  const listingUrls = useMemo(() => {
    const baseUrl = window.location.origin;
    return {
      listing: listingId ? `${baseUrl}/company/${companyId}/listings?listingId=${listingId}` : 'No Link Active',
      screener: listingId ? `${baseUrl}/company/${companyId}/listings?listingId=${listingId}&screen=true` : 'No Link Active'
    };
  }, [companyId, listingId]);

  // Combined fetch effect
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        // Fetch company ID
        const auth = getAuth();
        const user = auth.currentUser;
        if (user) {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userCompanyId = userDoc.data().companyuid;
            setCompanyId(userCompanyId);
          }
        }

        // Fetch property settings
        if (property?.id) {
          const propertySettingsRef = doc(db, 'properties', property.id, 'propertySettings', 'propertyType');
          const propertySettingsDoc = await getDoc(propertySettingsRef);
          
          if (propertySettingsDoc.exists()) {
            const settingsData = propertySettingsDoc.data();
            // Update the property object with the settings
            property.propertySettings = {
              propertyType: settingsData.propertyType || '',
              propertyKind: settingsData.propertyKind || ''
            };
          }
        }

        // Fetch unit details directly from Firestore
        if (property?.id && initialUnit?.unitId) {
          const unitRef = doc(db, 'properties', property.id, 'units', initialUnit.unitId);
          const unitDoc = await getDoc(unitRef);
          
          if (unitDoc.exists()) {
            const unitData = unitDoc.data() as Unit;
            setUnit({ ...initialUnit, ...unitData });

            // Fetch contact info based on the fresh unit data
            if (unitData.contactInfo?.type === 'user' && unitData.contactInfo?.userId) {
              const userDoc = await getDoc(doc(db, 'users', unitData.contactInfo.userId));
              if (userDoc.exists()) {
                const userData = userDoc.data();
                setContactInfo({
                  firstName: userData.firstName,
                  middleName: userData.middleName,
                  lastName: userData.lastName,
                  phoneNumber: userData.phoneNumber,
                  email: userData.email,
                });
              }
            } else if (unitData.contactInfo?.type === 'custom') {
              setContactInfo(unitData.contactInfo);
            }

            // Fetch amenities
            const amenitiesRef = collection(db, 'properties', property.id, 'units', initialUnit.unitId, 'amenities');
            const amenitiesSnapshot = await getDocs(amenitiesRef);
            
            if (!amenitiesSnapshot.empty) {
              const amenitiesDoc = amenitiesSnapshot.docs[0].data();
              if (amenitiesDoc.categorizedAmenities) {
                setAmenitiesData(amenitiesDoc.categorizedAmenities);
              }
            }
          }
        }

        // Set initial images
        setImages(unitImages);

        // Fetch listing ID if property and unit exist
        if (property?.id && initialUnit?.unitId) {
          const listingsCollectionRef = collection(db, 'listings');
          const q = query(
            listingsCollectionRef,
            where('propertyId', '==', property.id),
            where('unitId', '==', initialUnit.unitId)
          );
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            setListingId(querySnapshot.docs[0].id);
          }
        }

      } catch (error) {
        console.error('Error fetching initial data:', error);
        notification.error({
          message: 'Error',
          description: 'Failed to load some data. Please try refreshing the page.',
          placement: 'topRight',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, [property?.id, initialUnit?.unitId, unitImages]); // Updated dependencies

  // Also update the handleCopy and handleShare functions to prevent copying/sharing N/A
  const handleCopy = (text: string, label: string) => {
    if (text === 'No Link Active') {
      notification.info({
        message: 'Not Available',
        description: 'The listing URL will be available after publishing.',
        placement: 'topRight',
        duration: 3,
      });
      return;
    }
    
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
    if (text === 'No Link Active') {
      notification.info({
        message: 'Not Available',
        description: 'The listing URL will be available after publishing.',
        placement: 'topRight',
        duration: 3,
      });
      return;
    }

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

  const handlePublish = async () => {
    if (!property?.id || !unit?.unitId || !companyId) {
      notification.error({
        message: 'Error',
        description: 'Missing required information',
        placement: 'topRight',
      });
      return;
    }

    try {
      console.log('Property data:', property); // Debug log
      console.log('Property settings:', property.propertySettings); // Debug log

      console.log('Starting publish process...'); // Debug log

      // Fetch latest property settings before publishing
      const propertySettingsRef = doc(db, 'properties', property.id, 'propertySettings', 'propertyType');
      const propertySettingsDoc = await getDoc(propertySettingsRef);
      
      let propertySettings = {
        propertyType: '',
        propertyKind: ''
      };

      if (propertySettingsDoc.exists()) {
        const settingsData = propertySettingsDoc.data();
        propertySettings = {
          propertyType: settingsData.propertyType || '',
          propertyKind: settingsData.propertyKind || ''
        };
      }

      // Update unit status
      const unitRef = doc(db, 'properties', property.id, 'units', unit.unitId);
      await updateDoc(unitRef, {
        status: 'active',
        updatedAt: Timestamp.now()
      });

      // Fetch images from unit's images collection
      const imagesCollectionRef = collection(db, 'properties', property.id, 'units', unit.unitId, 'images');
      const imagesSnapshot = await getDocs(imagesCollectionRef);
      
      console.log('Images snapshot size:', imagesSnapshot.size); // Debug log
      
      const unitImages = imagesSnapshot.docs.map(doc => {
        const data = doc.data();
        console.log('Raw image data:', data); // Debug log
        return {
          id: doc.id,
          ...data
        };
      }) as UnitImage[];

      console.log('Mapped unit images:', unitImages); // Debug log

      // Prepare photos data - filter out any undefined values and ensure all required fields
      const listingPhotos = unitImages
        .filter(img => {
          const isValid = img && img.id && (img.url || img.fileUrl);
          if (!isValid) {
            console.log('Filtered out invalid image:', img); // Debug log
          }
          return isValid;
        })
        .map(img => {
          const photo = {
            id: img.id,
            url: img.url || img.fileUrl || '', // Fallback to fileUrl if url is missing
            fileUrl: img.fileUrl || img.url || '', // Fallback to url if fileUrl is missing
            fileName: img.fileName || '',
            createdAt: img.createdAt || Timestamp.now(),
            isVideo: Boolean(img.isVideo),
            favorite: Boolean(img.favorite)
          } satisfies UnitImage;
          
          console.log('Processed photo:', photo); // Debug log
          return photo;
        });

      console.log('Final listing photos:', listingPhotos); // Debug log

      // Clean amenities data
      const cleanAmenitiesData: CategorizedAmenities = {};
      Object.entries(amenitiesData).forEach(([key, value]) => {
        if (Array.isArray(value) && value.length > 0) {
          cleanAmenitiesData[key as keyof CategorizedAmenities] = value;
        }
      });

      // Clean contact info
      const cleanContactInfo = unit.contactInfo ? {
        type: unit.contactInfo.type || 'custom',
        ...(unit.contactInfo.userId && { userId: unit.contactInfo.userId }),
        ...(unit.contactInfo.firstName && { firstName: unit.contactInfo.firstName }),
        ...(unit.contactInfo.middleName && { middleName: unit.contactInfo.middleName }),
        ...(unit.contactInfo.lastName && { lastName: unit.contactInfo.lastName }),
        ...(unit.contactInfo.email && { email: unit.contactInfo.email }),
        ...(unit.contactInfo.phoneNumber && { phoneNumber: unit.contactInfo.phoneNumber }),
      } : undefined;

      // Prepare listing data
      const listingData: Partial<ListingData> = {
        propertyId: property.id,
        unitId: unit.unitId,
        companyId: companyId,
        status: 'active',
        propertyName: property.propertyName || '',
        unitName: unit.unitName || '',
        ...(property.address && { address: property.address }),
        propertySettings: propertySettings,
        ...(unit.beds !== undefined && { beds: unit.beds }),
        ...(unit.baths !== undefined && { baths: unit.baths }),
        ...(unit.size !== undefined && { size: unit.size }),
        ...(unit.marketRent !== undefined && { marketRent: unit.marketRent }),
        ...(unit.ListingDescription && { ListingDescription: unit.ListingDescription }),
        ...(unit.ListingTitle && { ListingTitle: unit.ListingTitle }),
        ...(Object.keys(cleanAmenitiesData).length > 0 && { amenities: cleanAmenitiesData }),
        ...(cleanContactInfo && { contactInfo: cleanContactInfo }),
        ...(unit.availableDate && { availableDate: unit.availableDate }),
        photos: listingPhotos,
        updatedAt: Timestamp.now()
      };

      console.log('Final listing data:', listingData); // Debug log

      // Check if listing already exists
      const listingsCollectionRef = collection(db, 'listings');
      const q = query(
        listingsCollectionRef,
        where('propertyId', '==', property.id),
        where('unitId', '==', unit.unitId)
      );
      const querySnapshot = await getDocs(q);

      let docRef;
      if (!querySnapshot.empty) {
        // Update existing listing
        const existingDoc = querySnapshot.docs[0];
        docRef = doc(db, 'listings', existingDoc.id);
        await updateDoc(docRef, listingData);
        setListingId(existingDoc.id); // Set the listing ID
        console.log('Updated listing with data:', listingData); // Debug log
        
        // Verify the update
        const updatedDoc = await getDoc(docRef);
        console.log('Verified updated data:', updatedDoc.data());
      } else {
        // Create new listing
        listingData.createdAt = Timestamp.now();
        docRef = await addDoc(listingsCollectionRef, listingData);
        setListingId(docRef.id); // Set the listing ID
        console.log('Created new listing with data:', listingData); // Debug log
        
        // Verify the creation
        const newDoc = await getDoc(docRef);
        console.log('Verified new data:', newDoc.data());
      }

      // Update local state
      setIsPublished(true);
      setUnit(prev => prev ? { ...prev, status: 'active' } : null);

      notification.success({
        message: 'Success',
        description: querySnapshot.empty 
          ? 'Listing has been published successfully'
          : 'Listing has been updated successfully',
        placement: 'topRight',
      });
    } catch (error) {
      console.error('Error in handlePublish:', error);
      notification.error({
        message: 'Error',
        description: error instanceof Error ? error.message : 'Failed to publish listing. Please try again.',
        placement: 'topRight',
      });
    }
  };

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
                  <div style={{ width: '100%', height: '300px', background: '#f0f0f0', borderRadius: '8px' }} />
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
            <Card
              title="Photos (0)"
              extra={<Skeleton.Button active size="small" style={{ width: 70 }} />}
              bodyStyle={{ padding: '16px' }}
            >
              <div style={{ position: 'relative' }}>
                <Row gutter={16} >
                  {[1, 2, 3].map((index) => (
                    <Col span={8} key={index}>
                      <div style={{ position: 'relative' }}>
                        <div style={{ width: '100%', height: '160px', background: '#f0f0f0', borderRadius: '8px' }} />
                      </div>
                    </Col>
                  ))}
                </Row>
              </div>
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

  return (
    <div>
      <Alert
        message={
          isPublished 
            ? "Your listing is live and visible to renters. Click 'Update' to save any changes."
            : "Your listing is currently in draft mode and is not visible to renters. Click 'Publish' to set the listing live."
        }
        type={isPublished ? "success" : "info"}
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
                  <Button 
                    type="text" 
                    icon={<EditOutlined />} 
                    onClick={() => setIsPropertyDrawerOpen(true)}
                  >
                    Edit
                  </Button>
                </Space>
              }
            >
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                {/* Property Info */}
                <Title level={4}>
                  {property?.propertyName || 'not named'}
                </Title>

                {/* Date and Payment Info */}
                <Text style={{ color: '#28A744' }}>
                      Monthly payments | ${unit?.marketRent || '0'} | {formatAvailableDate(unit?.availableDate)}
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
                    {mainImage ? (
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
                    ) : (
                      <div 
                        style={{ 
                          width: '100%', 
                          height: '300px', 
                          background: '#f5f5f5',
                          borderRadius: '8px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px'
                        }}
                      >
                        <CameraOutlined style={{ fontSize: '32px', color: '#bfbfbf' }} />
                        <Text type="secondary">No images available</Text>
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
                  onClick={handlePublish}
                  style={{ 
                    width: '100%', 
                    height: '40px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    justifyContent: 'center'
                  }}
                >
                  {isPublished ? 'Update' : 'Publish'}
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
                <Space wrap>
                  <Button type="default">
                    <Space>
                    <LinkOutlined />
                      <img 
                        src={`${process.env.PUBLIC_URL}/assets/zillow-logo.png`}
                        alt="Zillow" 
                        height={15}
                        style={{ objectFit: 'contain' }}
                      />
                    </Space>
                  </Button>

                  
                  <Button type="default">
                    <Space>
                    <LinkOutlined />
                      <img 
                        src={`${process.env.PUBLIC_URL}/assets/trulia_logo.png`}
                        alt="Trulia" 
                        height={15}
                        style={{ objectFit: 'contain' }}
                      />
                    </Space>
                  </Button>
                  <Button type="default">
                    <Space>
                      <LinkOutlined />
                      <img 
                        src={`${process.env.PUBLIC_URL}/assets/hotpads.svg`}
                        alt="Hotpads" 
                        height={20}
                        style={{ objectFit: 'contain' }}
                      />
                    </Space>
                  </Button>


                  <Button type="default">
                    <Space>
                      <LinkOutlined />
                      <img 
                        src={`${process.env.PUBLIC_URL}/assets/zolo-logo.png`}
                        alt="Zolo" 
                        height={15}
                        style={{ objectFit: 'contain' }}
                      />
                    </Space>
                  </Button>

                  <Button type="default">
                    <Space>
                      <LinkOutlined />
                      <img 
                        src={`${process.env.PUBLIC_URL}/assets/zumper-logo.svg`}
                        alt="Zumper" 
                        height={30}
                        style={{ objectFit: 'contain' }}
                      />
                    </Space>
                  </Button>

                  <Button type="default">
                    <Space>
                      <LinkOutlined />
                      <span style={{ 
                        fontWeight: 500,
                        fontSize: '14px'
                      }}>
                        RentalSource
                      </span>
                    </Space>
                  </Button>

                  <Button type="default">
                    <Space>
                      <LinkOutlined /> 
                      <span style={{ 
                        fontWeight: 500,
                        fontSize: '14px'
                      }}>
                        Website
                      </span>
                    </Space>
                  </Button>
                </Space>
              </Row>
            </Card>

            {/* Share Listing Card */}
            <Card title="Share listing">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text type="secondary">Listing URL</Text>
                  <Input 
                    readOnly
                    value={listingUrls.listing}
                    style={{ 
                      width: '100%', 
                      marginBottom: '8px',
                      cursor: 'pointer'
                    }}
                    onClick={() => handleCopy(listingUrls.listing, 'Listing URL')}
                  />
                  <Space>
                    <Button 
                      type="text" 
                      icon={<CopyOutlined />}
                      style={{ padding: '4px 8px' }}
                      onClick={() => handleCopy(listingUrls.listing, 'Listing URL')}
                    >
                      Copy
                    </Button>
                    <Button 
                      type="text" 
                      icon={<ShareAltOutlined />}
                      style={{ padding: '4px 8px' }}
                      onClick={() => handleShare(listingUrls.listing, 'Check out this property listing')}
                    >
                      Share
                    </Button>
                  </Space>
                </div>
                
                <div style={{ marginTop: '16px' }}>
                  <Text type="secondary">Pre-Screener URL</Text>
                  <Input 
                    readOnly
                    value={listingUrls.screener}
                    style={{ 
                      width: '100%', 
                      marginBottom: '8px',
                      cursor: 'pointer'
                    }}
                    onClick={() => handleCopy(listingUrls.screener, 'Pre-screener URL')}
                  />
                  <Space>
                    <Button 
                      type="text" 
                      icon={<CopyOutlined />}
                      style={{ padding: '4px 8px' }}
                      onClick={() => handleCopy(listingUrls.screener, 'Pre-screener URL')}
                    >
                      Copy
                    </Button>
                    <Button 
                      type="text" 
                      icon={<ShareAltOutlined />}
                      style={{ padding: '4px 8px' }}
                      onClick={() => handleShare(listingUrls.screener, 'Complete your pre-screening')}
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
              extra={
                <Button 
                  type="text" 
                  icon={<EditOutlined />} 
                  onClick={() => setIsContactDrawerOpen(true)}
                />
              }
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
                  {contactInfo ? (
                    `${contactInfo.firstName?.[0] || ''}${contactInfo.lastName?.[0] || ''}`
                  ) : 'NA'}
                </Avatar>
                <Text strong style={{ fontSize: '16px', marginTop: '8px' }}>
                  {contactInfo ? (
                    <>
                      {contactInfo.firstName}
                      {contactInfo.middleName ? ` ${contactInfo.middleName} ` : ' '}
                      {contactInfo.lastName}
                    </>
                  ) : 'No Contact Set'}
                </Text>
                <Space direction="vertical" align="center">
                  {contactInfo?.email && (
                    <Button 
                      type="text" 
                      icon={<MailOutlined />}
                      style={{ color: '#595959' }}
                      onClick={() => handleCopy(contactInfo.email, 'Email')}
                    >
                      {contactInfo.email}
                    </Button>
                  )}
                  {contactInfo?.phoneNumber && (
                    <Button 
                      type="text" 
                      icon={<PhoneOutlined />}
                      style={{ color: '#595959' }}
                      onClick={() => handleCopy(contactInfo.phoneNumber, 'Phone number')}
                    >
                      {formatPhoneNumber(contactInfo.phoneNumber)}
                    </Button>
                  )}
                </Space>
              </Space>
            </Card>
          </Space>
        </Col>
      </Row>
      {property?.id && unit?.unitId && (
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
            unitDetails={{ 
              beds: unit?.beds,
              baths: unit?.baths,
              size: unit?.size,
              marketRent: unit?.marketRent
            }}
          /> 

          <UnitListingPropertyDrawer
            open={isPropertyDrawerOpen}
            onClose={() => setIsPropertyDrawerOpen(false)}
            propertyId={property.id}
            unitId={unit.unitId}
            onSubmit={fetchUnitDetails}
          />

          <UnitListingContactDrawer
            open={isContactDrawerOpen}
            onClose={() => setIsContactDrawerOpen(false)}
            propertyId={property.id}
            unitId={unit.unitId}
            onSubmit={fetchUnitDetails}
            companyId={companyId || ''} 
          />
        </>
      )}
    </div>
  );
};

export default PropertyInfoUnitViewListing;