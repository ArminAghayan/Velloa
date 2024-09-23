import React, { useState, useEffect } from 'react';
import { Typography, Button, Row, Col, notification, Spin, Divider } from 'antd';
import { getFirestore, doc, setDoc, collection, query, getDocs, addDoc } from 'firebase/firestore';
import './PropertyTypeSelection.css';

const { Title, Text } = Typography;

interface PropertyTypeSelectionProps {
  propertyId: string;
}

const PropertyTypeSelection: React.FC<PropertyTypeSelectionProps> = ({ propertyId }) => {
  const [propertyKind, setPropertyKind] = useState<string | null>(null);
  const [propertyType, setPropertyType] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [settingsDocId, setSettingsDocId] = useState<string | null>(null);

  const propertyTypesByKind: { [key: string]: string[] } = {
    Residential: ['House', 'Apartment', 'Townhouse', 'Other'],
    Commercial: ['Office', 'Retail', 'Industrial', 'Storage', 'Other'],
    Industrial: ['Factory', 'Plant', 'Mill', 'Other'],
    Land: ['Agricultural', 'Residential Land', 'Commercial Land', 'Other'],
  };

  const fetchPropertyTypeInfo = async () => {
    const db = getFirestore();
    const propertySettingsRef = collection(doc(db, 'properties', propertyId), 'propertySettings');
    try {
      const querySnapshot = await getDocs(query(propertySettingsRef));
      if (!querySnapshot.empty) {
        const settingsDoc = querySnapshot.docs[0];
        setSettingsDocId(settingsDoc.id);
        const data = settingsDoc.data();
        const fetchedKind = data.propertyKind || null;
        const fetchedType = data.propertyType || null;
        
        if (fetchedKind && Object.keys(propertyTypesByKind).includes(fetchedKind)) {
          setPropertyKind(fetchedKind);
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
        console.warn('No propertySettings document found!');
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
  }, [propertyId]);

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
    const propertySettingsRef = collection(doc(db, 'properties', propertyId), 'propertySettings');
    try {
      if (settingsDocId) {
        await setDoc(doc(propertySettingsRef, settingsDocId), {
          propertyKind,
          propertyType,
        }, { merge: true });
      } else {
        const newDocRef = await addDoc(propertySettingsRef, {
          propertyKind,
          propertyType,
        });
        setSettingsDocId(newDocRef.id);
      }
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

  const handleKindSelect = (kind: string) => {
    if (kind !== propertyKind) {
      setPropertyKind(kind);
      setPropertyType(null);
    }
  };

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
      <Title style={{ color: '#4CAF50' }}level={2} className="main-title">Property Type</Title>
      <Divider />
      
      <div className="property-kind-selection">
        <Title  level={5}>Which kind of property do you manage?</Title>
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

      <Divider />

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