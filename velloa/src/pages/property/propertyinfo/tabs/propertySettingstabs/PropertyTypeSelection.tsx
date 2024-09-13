// PropertyTypeSelection.tsx

import React, { useState, useEffect } from 'react';
import { Typography, Button, Row, Col, notification, Spin } from 'antd';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import './PropertyTypeSelection.css';

const { Title, Text } = Typography;

interface PropertyTypeSelectionProps {
  propertyKey: string;
}

const PropertyTypeSelection: React.FC<PropertyTypeSelectionProps> = ({ propertyKey }) => {
  const [propertyKind, setPropertyKind] = useState<string | null>(null);
  const [propertyType, setPropertyType] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  // Define property types based on the selected property kind
  const propertyTypesByKind: { [key: string]: string[] } = {
    Residential: ['House', 'Apartment', 'Townhouse', 'Other'],
    Commercial: ['Office', 'Retail', 'Industrial', 'Storage', 'Other'],
    Industrial: ['Factory', 'Plant', 'Mill', 'Other'],
    Land: ['Agricultural', 'Residential Land', 'Commercial Land', 'Other'],
  };

  // Fetch property kind and type from Firestore
  const fetchPropertyTypeInfo = async () => {
    const db = getFirestore();
    const docRef = doc(db, 'properties', propertyKey);
    try {
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        const fetchedKind = data.propertyKind || null;
        const fetchedType = data.propertyType || null;

        // Ensure that the fetched kind exists in propertyTypesByKind
        if (fetchedKind && propertyTypesByKind[fetchedKind]) {
          setPropertyKind(fetchedKind);
          // Ensure that the fetched type exists within the fetched kind
          if (fetchedType && propertyTypesByKind[fetchedKind].includes(fetchedType)) {
            setPropertyType(fetchedType);
          } else {
            setPropertyType(null);
          }
        } else {
          setPropertyKind(null);
          setPropertyType(null);
        }
      } else {
        console.warn('No such document!');
      }
    } catch (error) {
      console.error('Error fetching property data:', error);
      notification.error({
        message: 'Fetch Failed',
        description: 'There was an error fetching the property information.',
        placement: 'top',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPropertyTypeInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyKey]);

  const handleSave = async () => {
    if (!propertyKind || !propertyType) {
      notification.warning({
        message: 'Incomplete Selection',
        description: 'Please select both property kind and type before saving.',
        placement: 'top',
      });
      return;
    }

    setSaving(true);
    const db = getFirestore();
    const docRef = doc(db, 'properties', propertyKey);
    try {
      await updateDoc(docRef, {
        propertyKind,
        propertyType,
      });
      notification.success({
        message: 'Property Type Updated',
        description: 'The property type has been successfully updated.',
        placement: 'top',
      });
    } catch (error) {
      console.error('Error updating document:', error);
      notification.error({
        message: 'Update Failed',
        description: 'There was an error updating the property type.',
        placement: 'top',
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle property kind selection
  const handleKindSelect = (kind: string) => {
    if (kind !== propertyKind) {
      setPropertyKind(kind);
      // Reset propertyType if it doesn't belong to the newly selected kind
      if (!propertyTypesByKind[kind].includes(propertyType || '')) {
        setPropertyType(null);
      }
    }
  };

  // Handle property type selection
  const handleTypeSelect = (type: string) => {
    setPropertyType(type);
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <Spin tip="Loading property information..." />
      </div>
    );
  }

  return (
    <div className="property-selection">
   <Title level={4} className="main-title">Property Type</Title>

      {/* Property Kind Selection */}
      <div className="property-kind-selection">
        <Title level={5}>Which kind of property do you manage?</Title>
        <Row gutter={[16, 16]} className="mb-4">
          {Object.keys(propertyTypesByKind).map((kind) => (
            <Col key={kind}>
              <Button
                type={propertyKind === kind ? 'primary' : 'default'}
                onClick={() => handleKindSelect(kind)}
                className={`kind-button ${propertyKind === kind ? 'selected' : ''}`}
                aria-pressed={propertyKind === kind}
              >
                {kind}
              </Button>
            </Col>
          ))}
        </Row>
      </div>

      {/* Property Type Selection */}
      <div className="property-type-selection">
        <Title level={5}>Which type best describes your property?</Title>
        {propertyKind ? (
          <div className="type-group">
            <Title level={5}>{propertyKind} Types</Title>
            <Row gutter={[16, 16]} className="mb-4">
              {propertyTypesByKind[propertyKind].map((type) => (
                <Col key={type} xs={12} sm={8} md={6}>
                  <Button
                    type={propertyType === type ? 'primary' : 'default'}
                    onClick={() => handleTypeSelect(type)}
                    className={`type-button ${propertyType === type ? 'selected' : ''}`}
                    aria-pressed={propertyType === type}
                    block
                  >
                    {type}
                  </Button>
                </Col>
              ))}
            </Row>
          </div>
        ) : (
          <Text type="secondary">Please select a property kind to choose the type.</Text>
        )}
      </div>

      {/* Save Button */}
      <Button
        type="primary"
        onClick={handleSave}
        style={{ marginTop: '20px' }}
        loading={saving}
        disabled={saving || !propertyKind || !propertyType}
      >
        Save
      </Button>
    </div>
  );
};

export default PropertyTypeSelection;
