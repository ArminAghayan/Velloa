import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { Typography, Space, Checkbox, Input, message } from 'antd';
import { IconPaw } from '@tabler/icons-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../../../../firebase-config';
import './PropertyPetPolicy.css';

const { Text } = Typography;
const { TextArea } = Input;

interface PropertyPetPolicyProps {
  propertyId: string;
}

export interface PropertyPetPolicyRef {
  handleSave: () => Promise<boolean>;
}

const PropertyPetPolicy = forwardRef<PropertyPetPolicyRef, PropertyPetPolicyProps>(
  ({ propertyId }, ref) => {
    const [petsAllowed, setPetsAllowed] = useState<boolean>(true);
    const [allowedPets, setAllowedPets] = useState<string[]>([]);
    const [additionalDetails, setAdditionalDetails] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);

    useImperativeHandle(ref, () => ({
      handleSave: async () => {
        try {
          console.log('Saving pet policy...', {
            petsAllowed,
            allowedPets,
            additionalDetails
          });
          
          await setDoc(
            doc(db, 'properties', propertyId, 'propertySettings', 'petPolicy'),
            {
              petsAllowed,
              allowedPets,
              additionalDetails,
            },
            { merge: true }
          );
          
          message.success('Pet policy saved successfully');
          return true;
        } catch (error) {
          console.error('Save error:', error);
          message.error('Failed to save pet policy');
          return false;
        }
      }
    }));

    useEffect(() => {
      loadPetPolicy();
    }, [propertyId]);

    const loadPetPolicy = async () => {
      if (!propertyId) return;
      
      try {
        setLoading(true);
        const petPolicyDoc = await getDoc(
          doc(db, 'properties', propertyId, 'propertySettings', 'petPolicy')
        );
        
        if (petPolicyDoc.exists()) {
          const data = petPolicyDoc.data();
          console.log('Loaded pet policy:', data);
          setPetsAllowed(data.petsAllowed ?? true);
          setAllowedPets(data.allowedPets ?? []);
          setAdditionalDetails(data.additionalDetails ?? '');
        }
      } catch (error) {
        console.error('Error loading pet policy:', error);
        message.error('Failed to load pet policy');
      } finally {
        setLoading(false);
      }
    };

    const handlePetTypeChange = (checkedValues: string[]) => {
      setAllowedPets(checkedValues);
    };

    const handlePetsAllowedChange = (allowed: boolean) => {
      setPetsAllowed(allowed);
    };



    if (loading) {
      return <div>Loading...</div>;
    }

    return (
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Text>Set your pet policy for this property.</Text>
        
        <div className="pet-button-group">
          <button
            className={`pet-button ${petsAllowed ? 'selected' : ''}`}
            onClick={() => handlePetsAllowedChange(true)}
            type="button"
          >
            <IconPaw size={20} className="icon" />
            <span className="text">Pets Allowed</span>
          </button>
          
          <button
            className={`pet-button ${!petsAllowed ? 'selected' : ''}`}
            onClick={() => handlePetsAllowedChange(false)}
            type="button"
          >
            <IconPaw size={20} className="icon" />
            <span className="text">Pets Not Allowed</span>
          </button>
        </div>

        {petsAllowed && (
          <>
            <div>
              <Text strong>Please select which pets are allowed in this property</Text>
              <div style={{ marginTop: 16 }}>
                <Checkbox.Group onChange={handlePetTypeChange} value={allowedPets}>
                  <Space direction="horizontal" size="large">
                    <Checkbox value="smallDogs">Small Dogs</Checkbox>
                    <Checkbox value="largeDogs">Large Dogs</Checkbox>
                    <Checkbox value="cats">Cats</Checkbox>
                  </Space>
                </Checkbox.Group>
              </div>
            </div>

            <div className="textarea-container">
              <Text>If you have any specific pet restrictions, please add them here...</Text>
              <TextArea
                rows={4}
                value={additionalDetails}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
                  setAdditionalDetails(e.target.value)
                }
                maxLength={500}
                style={{ marginTop: 8 }}
              />
            </div>
          </>
        )}
      </Space>
    );
  }
);

export default PropertyPetPolicy; 