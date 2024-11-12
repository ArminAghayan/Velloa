import React, { useState, useEffect, useImperativeHandle } from 'react';
import { Button, Divider, notification, Typography } from 'antd';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../../../../firebase-config';
import './PropertyTypeSelection.css';
import { InfoCircleOutlined } from '@ant-design/icons';

interface PropertyTypeSelectionProps {
  propertyId: string;
  ref?: React.RefObject<{ handleSave: () => Promise<boolean> }>;
}

const PropertyTypeSelection = React.forwardRef<{ handleSave: () => Promise<boolean> }, PropertyTypeSelectionProps>(
  ({ propertyId }, ref) => {
    const [selectedKind, setSelectedKind] = useState<string>('');
    const [selectedType, setSelectedType] = useState<string>('');

    const propertyTypesByKind: { [key: string]: string[] } = {
      Residential: [
        'House',
        'Apartment',
        'Condo',
        'Co-op',
        'Townhouse',
        'Multi-Family',
        'Duplex/Triplex',
        'Other'
      ],
      Commercial: ['Office', 'Retail', 'Industrial', 'Storage', 'Other'],
      Industrial: ['Factory', 'Plant', 'Mill', 'Other'],
      Land: ['Agricultural', 'Residential Land', 'Commercial Land', 'Other'],
    };

    useEffect(() => {
      fetchPropertyType();
    }, [propertyId]);

    const fetchPropertyType = async () => {
      try {
        const typeDocRef = doc(db, 'properties', propertyId, 'propertySettings', 'propertyType');
        const docSnap = await getDoc(typeDocRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setSelectedKind(data.propertyKind || '');
          setSelectedType(data.propertyType || '');
        }
      } catch (error) {
        console.error('Error fetching property type:', error);
      }
    };

    const handleSave = async () => {
      try {
        if (!selectedKind || !selectedType) {
          notification.error({
            message: 'Validation Error',
            description: 'Please select both property kind and type',
            placement: 'topRight'
          });
          return false;
        }

        const typeDocRef = doc(db, 'properties', propertyId, 'propertySettings', 'propertyType');
        await setDoc(typeDocRef, {
          propertyKind: selectedKind,
          propertyType: selectedType,
          lastUpdated: Timestamp.now()
        });

        notification.success({
          message: 'Success',
          description: 'Property type updated successfully',
          placement: 'topRight'
        });
        return true;
      } catch (error) {
        console.error('Error saving property type:', error);
        notification.error({
          message: 'Error',
          description: 'Failed to update property type',
          placement: 'topRight'
        });
        return false;
      }
    };

    useImperativeHandle(ref, () => ({
      handleSave
    }));

    return (
      <div className="property-selection">
       <div style={{ marginBottom: '12px', marginTop: '12px' }}>
          <Typography.Link 
            href="https://velloaapp.com" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ 
              display: 'inline-flex',
              alignItems: 'center', 
              gap: '8px',
              color: 'rgba(0, 0, 0, 0.45)',
              textDecoration: 'underline'
            }}
          >
            <InfoCircleOutlined />
            Learn about different types of properties
          </Typography.Link>
        </div>
        
        <div className="property-kind-selection">
          <h3>Property Kind</h3>
          <div className="button-grid">
            {Object.keys(propertyTypesByKind).map((kind) => (
              <Button
                key={kind}
                type={selectedKind === kind ? 'primary' : 'default'}
                onClick={() => {
                  setSelectedKind(kind);
                  setSelectedType('');
                }}
                className="selection-button"
              >
                {kind}
              </Button>
            ))}
          </div>
        </div>

        <Divider />

        <div className="property-type-selection">
          <h3>Property Type</h3>
          <div className="button-grid">
            {selectedKind && propertyTypesByKind[selectedKind].map((type) => (
              <Button
                key={type}
                type={selectedType === type ? 'primary' : 'default'}
                onClick={() => setSelectedType(type)}
                className="selection-button"
              >
                {type}
              </Button>
            ))}
          </div>
        </div>
      </div>
    );
  }
);

export default PropertyTypeSelection;