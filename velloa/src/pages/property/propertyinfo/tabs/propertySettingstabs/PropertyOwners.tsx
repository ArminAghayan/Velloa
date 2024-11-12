import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Button, Card, Input, Typography, notification, Row, Col, Select, Avatar } from 'antd';
import { PlusOutlined, DeleteOutlined, InfoCircleOutlined, EditOutlined } from '@ant-design/icons';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../../../../firebase-config';
import './PropertyOwners.css';
import { collection, query, where, getDocs } from 'firebase/firestore';

interface Owner {
    id: string;
    name: string;
    ownershipPercentage: number;
    peopleId: string; // Changed from optional to required
    isEditing?: boolean;
  }

interface PropertyOwnersProps {
  propertyId: string;
}

const PropertyOwners = forwardRef<{ handleSave: () => Promise<boolean> }, PropertyOwnersProps>(
  ({ propertyId }, ref) => {
    const [owners, setOwners] = useState<Owner[]>([]);
    const [peopleOptions, setPeopleOptions] = useState<{ value: string; label: string }[]>([]);

    const fetchPeopleOptions = async () => {
      try {
        const peopleRef = collection(db, 'people');
        const q = query(peopleRef, where('peopleType', '==', 'owner'));
        const querySnapshot = await getDocs(q);
        
        const options = querySnapshot.docs.map(doc => {
          const data = doc.data();
          const fullName = `${data.firstName || ''} ${data.middleName || ''} ${data.lastName || ''}`.trim();
          const displayName = data.company
            ? fullName ? `${fullName} | ${data.company}` : data.company
            : fullName;
          
          return {
            value: doc.id,
            label: displayName
          };
        });
        setPeopleOptions(options);
      } catch (error) {
        console.error('Error fetching people:', error);
      }
    };

    useEffect(() => {
      fetchOwners();
      fetchPeopleOptions();
    }, [propertyId]);

    const fetchOwners = async () => {
      try {
        const ownersDocRef = doc(db, 'properties', propertyId, 'propertySettings', 'owners');
        const docSnap = await getDoc(ownersDocRef);

        if (docSnap.exists()) {
          const ownersData = docSnap.data().owners || [];
          
          // Fetch people data for each owner
          const ownersWithDetails = await Promise.all(
            ownersData.map(async (owner: any) => {
              const peopleDoc = await getDoc(doc(db, 'people', owner.peopleId));
              const peopleData = peopleDoc.data();
              
              const fullName = `${peopleData?.firstName || ''} ${peopleData?.middleName || ''} ${peopleData?.lastName || ''}`.trim();
              const displayName = peopleData?.company
                ? fullName ? `${fullName} | ${peopleData.company}` : peopleData.company
                : fullName;

              return {
                id: owner.peopleId, // Using peopleId as the id
                peopleId: owner.peopleId,
                name: displayName,
                ownershipPercentage: owner.ownershipPercentage,
                isEditing: false
              };
            })
          );

          setOwners(ownersWithDetails);
        }
      } catch (error) {
        console.error('Error fetching owners:', error);
      }
    };

const addOwner = () => {
    setOwners([
      ...owners,
      {
        id: Date.now().toString(),
        name: '',
        ownershipPercentage: 0,
        peopleId: '', // Initialized to empty string
        isEditing: true
      }
    ]);
  };

    const removeOwner = (id: string) => {
      setOwners(owners.filter(owner => owner.id !== id));
    };

    const updateOwner = (id: string, field: keyof Owner, value: string | number) => {
      console.log('Updating owner:', { id, field, value });
      setOwners(prevOwners => {
        const newOwners = prevOwners.map(owner => 
          owner.id === id ? { ...owner, [field]: value } : owner
        );
        console.log('Updated owners:', newOwners);
        return newOwners;
      });
    };

    const toggleEdit = (id: string) => {
      setOwners(owners.map(owner =>
        owner.id === id ? { ...owner, isEditing: !owner.isEditing } : owner
      ));
    };

    const handleSave = async () => {
        try {
          // Get the latest owners state
          const currentOwners = [...owners];
          console.log('Current owners state at save:', currentOwners);
          
          // Check if any owners are missing peopleId
          const missingOwners = currentOwners.filter(owner => !owner.peopleId || owner.peopleId.trim() === '');
          console.log('Owners missing peopleId:', missingOwners);

          if (missingOwners.length > 0) {
            notification.error({
              message: 'Validation Error',
              description: 'All owners must have a selected Owner.',
              placement: 'topRight'
            });
            return false;
          }

          // Validate total ownership percentage equals 100
          const total = currentOwners.reduce((sum, owner) => sum + owner.ownershipPercentage, 0);
          if (total !== 100) {
            notification.error({
              message: 'Validation Error',
              description: 'Total ownership percentage must equal 100%',
              placement: 'topRight'
            });
            return false;
          }
      
          // Prepare data to save by excluding 'name' and 'isEditing'
          const ownersToSave = currentOwners.map(({ id, peopleId, ownershipPercentage }) => ({
            peopleId,
            ownershipPercentage
          }));
      
          const ownersDocRef = doc(db, 'properties', propertyId, 'propertySettings', 'owners');
          await setDoc(ownersDocRef, {
            owners: ownersToSave,
            lastUpdated: Timestamp.now()
          });
      
          notification.success({
            message: 'Success',
            description: 'Property owners updated successfully',
            placement: 'topRight'
          });
          return true;
        } catch (error) {
          console.error('Error saving owners:', error);
          notification.error({
            message: 'Error',
            description: 'Failed to update property owners',
            placement: 'topRight'
          });
          return false;
        }
      };

    // Expose handleSave method through ref
    useImperativeHandle(ref, () => ({
      handleSave
    }));

    return (
      <div className="property-owners">
        <Row justify="space-between" align="middle" className="owners-header">
          <Col>
            <Typography.Link
              href="https://velloaapp.com/property-ownership"
              target="_blank"
              rel="noopener noreferrer"
              className="learn-more-link"
            >
              <InfoCircleOutlined />
              Learn about property ownership
            </Typography.Link>
          </Col>
          <Col>
            <Button
              onClick={addOwner}
              icon={<PlusOutlined />}
              className="add-owner-button"
            >
              Add Owner
            </Button>
          </Col>
        </Row>


        <div className="owners-list">
          {owners.map(owner => (
            <Card 
              key={owner.id} 
              className={`owner-card ${!owner.peopleId ? 'incomplete-owner' : ''}`}
              style={{ width: 300, marginBottom: 16 }}
              actions={[
                <Button
                  key="edit"
                  type="text"
                  icon={<EditOutlined />}
                  onClick={() => toggleEdit(owner.id)}
                />,
                <Button
                  key="delete"
                  type="text"
                  icon={<DeleteOutlined />}
                  onClick={() => removeOwner(owner.id)}
                  danger
                />
              ]}
            >
              <div className="owner-card-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <Avatar size={64}>
                  {owner.name ? owner.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : '??'}
                </Avatar>
                
                {owner.isEditing ? (
                  <>
                    <div style={{ width: '100%' }}>
                      <Typography.Text type="secondary" style={{ marginBottom: '4px', display: 'block' }}>
                        Owner {!owner.peopleId && <Typography.Text type="danger">(Required)</Typography.Text>}
                      </Typography.Text>
                      <Select
                        showSearch
                        placeholder="Select Owner"
                        value={owner.peopleId || undefined}
                        onChange={(value, option: any) => {
                          console.log('Select onChange fired with:', {
                            value,
                            option,
                            currentOwner: owner
                          });
                          updateOwner(owner.id, 'peopleId', value);
                          updateOwner(owner.id, 'name', option.label);
                        }}
                        options={peopleOptions}
                        filterOption={(input, option) =>
                          (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                        style={{ width: '100%' }}
                        status={!owner.peopleId ? 'error' : undefined}
                      />
                    </div>
                    
                    <div style={{ width: '100%' }}>
                      <Typography.Text type="secondary" style={{ marginBottom: '4px', display: 'block' }}>
                        Ownership Percentage
                      </Typography.Text>
                      <Input
                        type="number"
                        placeholder="Ownership %"
                        value={owner.ownershipPercentage}
                        onChange={e => updateOwner(owner.id, 'ownershipPercentage', parseFloat(e.target.value))}
                        suffix="%"
                        style={{ width: '100%' }}
                        status={!owner.ownershipPercentage ? 'error' : undefined}
                      />
                    </div>
                  </>
                ) : (
                  <div style={{ width: '100%', textAlign: 'center' }}>
                    <Typography.Text 
                      strong 
                      style={{ 
                        fontSize: '16px', 
                        display: 'block', 
                        marginBottom: '8px'
                      }}
                    >
                      {owner.name || 'No Owner Selected'}
                    </Typography.Text>
                    <Typography.Text 
                      style={{ 
                        fontSize: '14px', 
                        display: 'block'
                      }}
                    >
                      Ownership (%): {owner.ownershipPercentage || 0}%
                    </Typography.Text>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }
);

export default PropertyOwners; 