import React, { useEffect, useState } from 'react';
import { Typography, Card, Row, Col, Skeleton, message, Button } from 'antd';
import { db } from '../../../../firebase-config';
import { doc, getDoc } from 'firebase/firestore';
import { IconUserCircle, IconBuildingEstate, IconKey, IconCircleDashedCheck } from '@tabler/icons-react';

const { Title, Text } = Typography;

interface Owner {
  name: string;
  percentage: number;
}

interface Property {
  key: string;
  propertyName: string;
  propertyType: string;
  numberOfUnits: number;
  status: string;
  photos?: string[]; // Mark photos as optional
}

interface PropertyOverviewProps {
  property: Property;
}

const PropertyInfoOverview: React.FC<PropertyOverviewProps> = ({ property }) => {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOwners = async () => {
      try {
        const propertyRef = doc(db, 'properties', property.key);
        const propertyDoc = await getDoc(propertyRef);
        if (propertyDoc.exists()) {
          const data = propertyDoc.data();
          setOwners(data.ownership || []);
        } else {
          console.log("No such document!");
        }
      } catch (error) {
        console.error("Error fetching owners: ", error);
        message.error("Failed to fetch property owners.");
      } finally {
        setLoading(false);
      }
    };

    fetchOwners();
  }, [property.key]);

  return (
    <div>

    <Row gutter={16} className="property-row">
    <Col span={24} className="property-col">
    <div className="quick-action-buttons">
      <Row gutter={[8, 8]}>
        <Col span={2}>
          <Button type="primary" block>New Lease</Button>
        </Col>
        <Col span={2}>
          <Button type="primary" block>New Unit</Button>
        </Col>
        <Col span={2}>
          <Button type="primary" block>Quick Note</Button>
        </Col>
     
        
      </Row>
    </div>
  </Col>
      <Col span={6} className="property-col">
        <Card className="quick-action-card">
          <div className="property-card-content">
            <IconBuildingEstate size={48} className="icon-building-estate-property-info" />
            <Title level={5} className="label">Property Type:</Title>
            <Text className="value">{property.propertyType}</Text>
          </div>
        </Card>
      </Col>
      <Col span={6} className="property-col">
        <Card className="quick-action-card">
          <div className="property-card-content">
            <IconKey size={48} className="icon-circle-key-property-info" />
            <Title level={5} className="label">Active Units:</Title>
            <Text className="value">{property.numberOfUnits}</Text>
          </div>
        </Card>
      </Col>
      <Col span={6} className="property-col">
    <Card className="quick-action-card">
      <div className="property-card-content">
        <IconUserCircle size={48} className="icon-circle-dashed-check-property-info" />
        <Title level={5} className="label">Pending Applications:</Title>
        <Text className="value">5</Text> {/* Replace with actual dynamic value */}
      </div>
    </Card>
  </Col>
      <Col span={6} className="property-col">
        <Card className="quick-action-card">
          <div className="property-card-content">
            <IconCircleDashedCheck size={48} className="icon-circle-dashed-check-property-info" />
            <Title level={5} className="label">Status:</Title>
            <Text className="value" style={{ color: 'green' }}>{property.status || 'N/A'}</Text>
          </div>
        </Card>
      </Col>
      
    </Row>
      <Row gutter={16} className="property-row">
        <Col span={24} className="property-col">
          <Card size="small" title="Owners" className="owners-card">
            <div className="owners-content">
              {loading ? (
                <Skeleton active />
              ) : (
                owners.length > 0 ? (
                  owners.map((owner, index) => (
                    <Card key={index} className="owner-card">
                      <div className="owner-card-content">
                        <div className="owner-icon">
                          <img
                            src={`https://api.dicebear.com/6.x/initials/svg?seed=${owner.name}&backgroundColor=28a745`}
                            style={{
                              height: 48,
                              width: 48,
                              objectFit: 'cover',
                              borderRadius: '50%',
                            }}
                          />
                        </div>                      
                        <div className="owner-details">
                          <Title level={5} className="owner-name">{owner.name}</Title>
                          <Text className="owner-percentage">{owner.percentage}% Ownership</Text>
                        </div>
                      </div>
                    </Card>
                  ))
                ) : (
                  <p>No owners found.</p>
                )
              )}
            </div>
          </Card>
        </Col>
      </Row>
      <Row gutter={16} className="property-row">
        <Col span={24} className="property-col">
          <Card size="small" title="Photos" className="photos-card">
            <div className="photos-content">
              <Row gutter={[8, 8]}>
                {property.photos?.map((photo, index) => (
                  <Col key={index} span={6}>
                    <img src={photo} alt={`Property ${index}`} className="property-image-preview" />
                  </Col>
                ))}
              </Row>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default PropertyInfoOverview;
