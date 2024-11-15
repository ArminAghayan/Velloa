import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { Button, message, Row, Col, Typography } from 'antd';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../../../../firebase-config';
import {
  IconBallBasketball,
  IconBuildingStore,
  IconDiscount2,
  IconFence,
  IconBarbell,
  IconSofa,
  IconCarGarage,
  IconShoppingCart,
  IconWifi,
  IconRun,
  IconWashMachine,
  IconMovie,
  IconTool,
  IconPaw,
  IconBallTennis,
  IconMonkeybar,
  IconClock24,
  IconLanguage,
  IconHome,
  IconFlame,
  IconTree,
  IconDeviceGamepad2,
  IconParking,
  IconUsers,
  IconBoom,
  IconWiperWash,
  IconBeach,
  IconBooks,
  IconDoor,
  IconBuildingCommunity,
  IconSwimming,
  IconDice,
  IconShieldCheckered,
  IconCalendarTime,
  IconBox,
  IconAnchor,
  IconBabyCarriage,
  IconBuildingArch,
  IconDoorEnter,
  IconBed,
  IconHorseToy,
  IconPizza,
  IconMoonStars,
  IconPackage,
  IconRecycle,
  IconSmokingNo,
  IconSun,
  IconDropCircle,
  IconMassage,
} from '@tabler/icons-react';
import './PropertyAmenities.css';
import { InfoCircleOutlined } from '@ant-design/icons';

interface PropertyAmenitiesProps {
  propertyId: string;
}

export interface PropertyAmenitiesRef {
  handleSave: () => Promise<boolean>;
}

const amenitiesConfig = [
  { name: 'Basketball Court', icon: <IconBallBasketball size={16} /> },
  { name: 'Business Center', icon: <IconBuildingStore size={16} /> },
  { name: 'Club Discount', icon: <IconDiscount2 size={16} /> },
  { name: 'Concierge', icon: <IconShieldCheckered size={16} /> },
  { name: 'Fitness Center', icon: <IconBarbell size={16} /> },
  { name: 'Furnished Available', icon: <IconSofa size={16} /> },
  { name: 'Garage - Detached', icon: <IconCarGarage size={16} /> },
  { name: 'Grocery Service', icon: <IconShoppingCart size={16} /> },
  { name: 'High Speed', icon: <IconWifi size={16} /> },
  { name: 'Jogging/Walking Trails', icon: <IconRun size={16} /> },
  { name: 'Laundry', icon: <IconWashMachine size={16} /> },
  { name: 'Media Room', icon: <IconMovie size={16} /> },
  { name: 'On-Site Maintenance', icon: <IconTool size={16} /> },
  { name: 'Pet-Rent Required', icon: <IconPaw size={16} /> },
  { name: 'Racquetball', icon: <IconBallTennis size={16} /> },
  { name: 'Sauna', icon: <IconFlame size={16} /> },
  { name: 'Spa', icon: <IconMassage size={16} /> },
  { name: 'Availability 24 Hours', icon: <IconClock24 size={16} /> },
  { name: 'Bilingual', icon: <IconLanguage size={16} /> },
  { name: 'Car Wash Area', icon: <IconWiperWash size={16} /> },
  { name: 'Club House', icon: <IconHome size={16} /> },
  { name: 'Green Park', icon: <IconTree size={16} /> },
  { name: 'Theater', icon: <IconMovie size={16} /> },
  { name: 'Gaming Stations', icon: <IconDeviceGamepad2 size={16} /> },
  { name: 'Garage - Semi Level Parking', icon: <IconParking size={16} /> },
  { name: 'Garage - Attached', icon: <IconCarGarage size={16} /> },
  { name: 'Garage - Attached', icon: <IconCarGarage size={16} /> },
  { name: 'Garage - Underground', icon: <IconCarGarage size={16} /> },
  { name: 'Group Exercise', icon: <IconUsers size={16} /> },
  { name: 'Housekeeping', icon: <IconBoom size={16} /> },
  { name: 'Lake Front', icon: <IconBeach size={16} /> },
  { name: 'Library', icon: <IconBooks size={16} /> },
  { name: 'Multi-Use Room', icon: <IconDoor size={16} /> },
  { name: 'On-Site Management', icon: <IconBuildingCommunity size={16} /> },
  { name: 'Pool', icon: <IconSwimming size={16} /> },
  { name: 'Rec Room', icon: <IconDice size={16} /> },
  { name: 'Short Term Lease', icon: <IconCalendarTime size={16} /> },
  { name: 'Storage Space', icon: <IconBox size={16} /> },
  { name: 'Access Wells', icon: <IconDropCircle size={16} /> },
  { name: 'Boat Docks', icon: <IconAnchor size={16} /> },
  { name: 'Child Care', icon: <IconBabyCarriage size={16} /> },
  { name: 'Conference Room', icon: <IconBuildingArch size={16} /> },
  { name: 'Door Attendant', icon: <IconDoorEnter size={16} /> },
  { name: 'Free Weights', icon: <IconBarbell size={16} /> },
  { name: 'Gate', icon: <IconFence size={16} /> },
  { name: 'Guest Room', icon: <IconBed size={16} /> },
  { name: 'House Sitting', icon: <IconHorseToy size={16} /> },
  { name: 'Lake Access', icon: <IconBeach size={16} /> },
  { name: 'Meal Service', icon: <IconPizza size={16} /> },
  { name: 'Night Patrol', icon: <IconMoonStars size={16} /> },
  { name: 'Package Receiving', icon: <IconPackage size={16} /> },
  { name: 'Play Ground', icon: <IconMonkeybar size={16} /> },
  { name: 'Recycling', icon: <IconRecycle size={16} /> },
  { name: 'Smoke Free', icon: <IconSmokingNo size={16} /> },
  { name: 'Sundeck', icon: <IconSun size={16} /> },
];

const PropertyAmenities = forwardRef<PropertyAmenitiesRef, PropertyAmenitiesProps>(
  ({ propertyId }, ref) => {
    const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

    useImperativeHandle(ref, () => ({
      handleSave: async () => {
        try {
          await setDoc(doc(db, 'properties', propertyId, 'propertySettings', 'amenities'), {
            selectedAmenities: selectedAmenities
          });
          message.success('Amenities saved successfully');
          return true;
        } catch (error) {
          console.error('Save error:', error);
          message.error('Failed to save amenities');
          return false;
        }
      }
    }));

    const buttonStyle = (amenity: string) => ({
      marginRight: '8px',
      marginBottom: '8px',
      backgroundColor: selectedAmenities.includes(amenity) ? '#28a745' : 'white',
      color: selectedAmenities.includes(amenity) ? 'white' : 'rgba(0, 0, 0, 0.85)',
      border: '1px solid #d9d9d9',
      height: '32px',
      padding: '4px 16px',
      fontSize: '14px',
    });

    useEffect(() => {
      loadAmenities();
    }, [propertyId]);

    const loadAmenities = async () => {
      try {
        const amenitiesDoc = await getDoc(doc(db, 'properties', propertyId, 'propertySettings', 'amenities'));
        if (amenitiesDoc.exists()) {
          const data = amenitiesDoc.data();
          setSelectedAmenities(data.selectedAmenities || []);
        }
      } catch (error) {
        message.error('Failed to load amenities');
      }
    };

    const onChange = (amenity: string) => {
      setSelectedAmenities(prev => {
        if (prev.includes(amenity)) {
          return prev.filter(item => item !== amenity);
        } else {
          return [...prev, amenity];
        }
      });
    };

    return (
      <div>
        <div style={{ marginBottom: '16px' }}>
          <Typography.Link
            href="https://velloaapp.com"
            target="_blank"
            rel="noopener noreferrer"
            className="learn-more-link"
            style={{ color: 'rgba(0, 0, 0, 0.45)' }}
          >
            <InfoCircleOutlined />
            Learn about different types of amenities
          </Typography.Link>
          <h4 style={{ margin: 0, marginTop: '8px' }}>Select amenities included in this property</h4>
        </div>
        <div style={{ maxHeight: '500px', overflowY: 'auto', overflowX: 'hidden' }}>
          <Row gutter={[8, 8]}>
            {amenitiesConfig.map(({ name, icon }) => (
              <Col span={6} key={name}>
                <Button
                  style={{
                    ...buttonStyle(name),
                    width: '100%',
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    height: '40px'
                  }}
                  onClick={() => onChange(name)}
                >
                  {icon}
                  <span>{name}</span>
                </Button>
              </Col>
            ))}
          </Row>
        </div>
      </div>
    );
  }
);

export default PropertyAmenities; 