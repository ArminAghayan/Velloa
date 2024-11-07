import React, { useState, useEffect } from 'react';
import { Drawer, Typography, Button, Space, Divider, notification, Spin } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { doc, setDoc, serverTimestamp, getDoc, addDoc, collection, Timestamp, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../../../../../../firebase-config';

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

  useEffect(() => {
    const fetchAmenities = async () => {
      if (!open || !propertyId || !unitId) return;

      setIsLoading(true);
      try {
        const amenitiesDocRef = doc(db, 'properties', propertyId, 'units', unitId, 'amenities', 'amenities');
        const amenitiesDoc = await getDoc(amenitiesDocRef);

        if (amenitiesDoc.exists()) {
          const data = amenitiesDoc.data();
          const existingAmenities = data.amenities || [];

          const categorizedAmenities = Object.entries(amenities).map(([category, items]) => ({
            category,
            items: items.filter(item => existingAmenities.includes(item))
          }));

          setSelectedAmenities(categorizedAmenities);
        } else {
          setSelectedAmenities([]);
        }
      } catch (error) {
        console.error('Error fetching amenities:', error);
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
      // First verify the property exists and get its companyuid
      const propertyDoc = await getDoc(doc(db, 'properties', propertyId));
      if (!propertyDoc.exists()) {
        notification.error({
          message: 'Error',
          description: 'Property not found',
          placement: 'topRight'
        });
        return;
      }

      const companyuid = propertyDoc.data().companyuid;
      if (!companyuid) {
        notification.error({
          message: 'Error',
          description: 'Company ID not found',
          placement: 'topRight'
        });
        return;
      }

      // Convert the selected amenities to a flat array of items
      const flatAmenities = selectedAmenities.flatMap(cat => cat.items);

      // Create the amenities document
      const newAmenities = {
        amenities: flatAmenities,
        updatedAt: Timestamp.now(),
        companyId: companyuid
      };

      // Use a fixed document ID 'amenities'
      const amenitiesDocRef = doc(db, 'properties', propertyId, 'units', unitId, 'amenities', 'amenities');
      await setDoc(amenitiesDocRef, newAmenities, { merge: true });

      onSave(flatAmenities);
      onClose();
      
      notification.success({
        message: 'Success',
        description: 'Amenities saved successfully',
        placement: 'topRight'
      });
    } catch (error) {
      console.error('Error saving amenities:', error);
      notification.error({
        message: 'Error',
        description: `Failed to save amenities: ${error instanceof Error ? error.message : 'Unknown error'}`,
        placement: 'topRight'
      });
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
              <Title level={5} style={{ marginBottom: '16px' }}>
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
