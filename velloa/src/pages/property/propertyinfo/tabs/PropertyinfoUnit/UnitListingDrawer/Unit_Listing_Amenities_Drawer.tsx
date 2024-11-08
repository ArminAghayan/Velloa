import React, { useState, useEffect } from 'react';
import { Drawer, Typography, Button, Space, Divider, notification, Spin } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { doc, setDoc,getDoc, Timestamp, serverTimestamp, collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../../../../../../firebase-config';
import { 
  DollarOutlined,  
  AppstoreOutlined,  
  FireOutlined,  
  CloudOutlined,  
  ShoppingOutlined,  
  CarOutlined,  
  HomeOutlined,  
} from '@ant-design/icons';

const { Title } = Typography;

interface UnitListingAmenitiesDrawerProps {
  open: boolean;
  onClose: () => void;
  onSave: (amenities: string[]) => void;
  currentAmenities: string[];
  propertyId: string;
  unitId: string;
  companyId: string;
}

interface AmenityData {
  category: string;
  items: string[];
}

const amenities = {
  'Included in rent': [
    'Water', 'Sewage', 'Garbage', 'Electricity', 'Gas',
    'Internet', 'Cable', 'Sat TV', 'Hot water'
  ],
  'Interior & Appliances': [
    'Dishwasher', 'Washer', 'Dryer', 'Freezer', 'Microwave',
    'Range oven', 'A/C', 'Ceiling fan', 'Refrigerator',
    'Fireplace', 'Intercom', 'Security system'
  ],
  'Heating': [
    'Central', 'Forced air', 'Heat Pump', 'Radiant', 'Electric', 'Geothermal', 'Solar', 'Ductless Mini-Split', 'Natural Gas', 'Other'
  ],
  'Cooling': [
    'Central', 'Evaporative', 'Geothermal', 'Heat Pump', 'Wall', 'Solar', 'Ceiling Fans', 'Ductless Mini-Split', 'Other'
  ],
  'Laundry': [
    'In-unit', 'Shared'
  ],
  'Parking': [
    'Carport', 'Garage / Attached', 'Garage / Detached', 'Off-street'
  ],
  'Exterior': [
    'Deck', 'Courtyard', 'Fenced yard', 'Garden', 'Lawn',
    'Pool', 'Patio', 'Balcony'
  ]
};

// Add this constant to map categories to their icons
const categoryIcons = {
  'Included in rent': <DollarOutlined style={{ marginRight: 8, color: '#28A744' }} />,
  'Interior & Appliances': <AppstoreOutlined style={{ marginRight: 8, color: '#28A744' }} />,
  'Heating': <FireOutlined style={{ marginRight: 8, color: '#28A744' }} />,
  'Cooling': <CloudOutlined style={{ marginRight: 8, color: '#28A744' }} />,
  'Laundry': <ShoppingOutlined style={{ marginRight: 8, color: '#28A744' }} />,
  'Parking': <CarOutlined style={{ marginRight: 8, color: '#28A744' }} />,
  'Exterior': <HomeOutlined style={{ marginRight: 8, color: '#28A744' }} />,
};

// TypeScript type for the icons object
type CategoryIconsType = typeof categoryIcons;

const UnitListingAmenitiesDrawer: React.FC<UnitListingAmenitiesDrawerProps> = ({
  open,
  onClose,
  onSave,
  currentAmenities = [],
  propertyId,
  unitId,
  companyId
}) => {
  const [selectedAmenities, setSelectedAmenities] = useState<AmenityData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [amenitiesDocId, setAmenitiesDocId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchAmenities = async () => {
      if (!open || !propertyId || !unitId) return;

      console.log('Fetching amenities with:', {
        propertyId,
        unitId,
        companyId
      });

      try {
        const amenitiesCollectionRef = collection(db, 'properties', propertyId, 'units', unitId, 'amenities');
        const amenitiesSnapshot = await getDocs(amenitiesCollectionRef);
        
        console.log('Amenities snapshot exists:', !amenitiesSnapshot.empty);
        if (!amenitiesSnapshot.empty) {
          console.log('First amenity doc ID:', amenitiesSnapshot.docs[0].id);
        }

        if (!isMounted) return;

        const amenitiesDoc = amenitiesSnapshot.docs[0];

        if (amenitiesDoc) {
          const data = amenitiesDoc.data();
          setAmenitiesDocId(amenitiesDoc.id);
          
          // Get the categorized amenities from Firestore
          const categorizedAmenities = data.categorizedAmenities || {};
          
          // Transform the data to match our state structure
          const formattedAmenities = Object.entries(amenities).map(([category, _]) => ({
            category,
            items: categorizedAmenities[category] || []
          }));

          setSelectedAmenities(formattedAmenities);
        } else {
          // Initialize empty categories if no document exists
          const emptyCategories = Object.keys(amenities).map(category => ({
            category,
            items: []
          }));
          setSelectedAmenities(emptyCategories);
        }
      } catch (error) {
        console.error('Fetch error details:', error);
        notification.error({
          message: 'Error',
          description: 'Failed to load existing amenities',
          placement: 'topRight'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAmenities();

    return () => {
      isMounted = false;
    };
  }, [open, propertyId, unitId]);

  const handleAmenityClick = (amenity: string, category: string) => {
    setSelectedAmenities(prev => {
      const categoryIndex = prev.findIndex(a => a.category === category);
      
      if (categoryIndex === -1) {
        // Category doesn't exist, create new
        return [...prev, { category, items: [amenity] }];
      }

      const updatedCategories = [...prev];
      const categoryAmenities = prev[categoryIndex].items;

      if (categoryAmenities.includes(amenity)) {
        // Remove amenity if already selected
        updatedCategories[categoryIndex] = {
          ...prev[categoryIndex],
          items: categoryAmenities.filter(a => a !== amenity)
        };
      } else {
        // Add amenity to category
        updatedCategories[categoryIndex] = {
          ...prev[categoryIndex],
          items: [...categoryAmenities, amenity]
        };
      }

      return updatedCategories;
    });
  };

  const renderAmenityButton = (amenity: string, category: string) => {
    const isSelected = selectedAmenities
      .find(a => a.category === category)?.items
      .includes(amenity) ?? false;
    
    return (
      <Button
        key={amenity}
        type={isSelected ? "primary" : "default"}
        onClick={() => handleAmenityClick(amenity, category)}
        style={{ 
          margin: '0 8px 8px 0',
          background: isSelected ? '#28A744' : 'white',
          color: isSelected ? 'white' : '#595959',
        }}
      >
        {amenity}
      </Button>
    );
  };

  const footerStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    borderTop: '1px solid #e8e8e8',
    padding: '10px 16px',
    textAlign: 'right',
    left: 0,
    background: 'white'
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      
      console.log('Starting save with:', {
        propertyId,
        unitId,
        companyId,
        amenitiesDocId
      });

      const propertyDoc = await getDoc(doc(db, 'properties', propertyId));
      const propertyData = propertyDoc.data();
      
      console.log('Property data:', {
        exists: propertyDoc.exists(),
        companyuid: propertyData?.companyuid,
        propertyId: propertyDoc.id
      });

      if (!propertyDoc.exists() || !propertyData?.companyuid) {
        throw new Error('Property not found or missing company ID');
      }

      const companyuid = propertyData.companyuid;

      const categorizedAmenities = selectedAmenities.reduce((acc, cat) => {
        acc[cat.category] = cat.items;
        return acc;
      }, {} as Record<string, string[]>);

      const newAmenities = {
        categorizedAmenities,
        updatedAt: serverTimestamp(),
        companyId: companyuid  // Make sure to use the companyuid from the property document
      };

      const amenitiesCollectionRef = collection(db, 'properties', propertyId, 'units', unitId, 'amenities');

      if (amenitiesDocId) {
        await setDoc(doc(amenitiesCollectionRef, amenitiesDocId), newAmenities, { merge: true });
      } else {
        const docRef = await addDoc(amenitiesCollectionRef, newAmenities);
        setAmenitiesDocId(docRef.id);
      }

      notification.success({
        message: 'Success',
        description: 'Unit amenities saved successfully',
        placement: 'topRight'
      });
      
      await onSave(Object.values(categorizedAmenities).flat());
      onClose();
    } catch (error) {
      console.error('Error saving amenities:', error);
      notification.error({
        message: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save amenities',
        placement: 'topRight'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Drawer
      title="Edit Amenities"
      placement="right"
      width={600}
      onClose={onClose}
      open={open}
      footer={
        <div style={footerStyle}>
          <Space>
            <Button 
              style={{ height: '40px', width: '100px' }} 
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button 
              style={{ height: '40px', width: '150px' }} 
              type="primary" 
              icon={<SaveOutlined />} 
              onClick={handleSave}
              loading={isLoading}
            >
              Save
            </Button>
          </Space>
        </div>
      }
    >
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Spin tip="Loading amenities..." />
        </div>
      ) : (
        <div style={{ marginBottom: '60px' }}>
          {Object.entries(amenities).map(([category, items], index, array) => (
            <div key={category}>
              <Title level={5} style={{ marginBottom: '16px', display: 'flex', alignItems: 'center' }}>
                {categoryIcons[category as keyof CategoryIconsType]}
                {category}
              </Title>
              <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                {items.map(item => renderAmenityButton(item, category))}
              </div>
              {index < array.length - 1 && (
                <Divider style={{ margin: '24px 0' }} />
              )}
            </div>
          ))}
        </div>
      )}
    </Drawer>
  );
};

export default UnitListingAmenitiesDrawer;
