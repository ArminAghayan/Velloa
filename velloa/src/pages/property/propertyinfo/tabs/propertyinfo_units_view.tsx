import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Button, Row, Col, Typography, Input, Form, message, Spin } from 'antd';
import { LeftOutlined, EditOutlined, SaveOutlined, PlusOutlined } from '@ant-design/icons';
import { RootState } from '../../../../components/redux/store';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import './propertyinfo_units_view.css';

const { Text, Title } = Typography;
const { TextArea } = Input;

interface Unit {
  unitName: string;
  size: string;
  beds: number;
  baths: number;
  marketRent: number;
  tenant: string;
  description: string;
  images?: string[];
}

interface Property {
  id: string;
  name: string;
  units: Unit[];
}

const PropertyInfoUnitView: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { propertyId, unitName } = useParams<{ propertyId: string; unitName: string }>();
  const [property, setProperty] = useState<Property | null>(null);
  const [unit, setUnit] = useState<Unit | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedUnit, setEditedUnit] = useState<Unit | null>(null);

  useEffect(() => {
    const fetchPropertyAndUnit = async () => {
      if (!propertyId || !unitName) {
        message.error('No property ID or unit name provided');
        setIsLoading(false);
        return;
      }

      const db = getFirestore();
      const propertyRef = doc(db, 'properties', propertyId);

      try {
        const propertySnap = await getDoc(propertyRef);
        if (propertySnap.exists()) {
          const propertyData = { id: propertySnap.id, ...propertySnap.data() } as Property;
          setProperty(propertyData);
          
          const unitData = propertyData.units.find(u => u.unitName === unitName);
          if (unitData) {
            setUnit(unitData);
            setEditedUnit(unitData);
            dispatch({ type: 'SET_SELECTED_UNIT', payload: unitData });
          } else {
            message.error('Unit not found');
          }
        } else {
          message.error('Property not found');
        }
      } catch (error) {
        console.error("Error fetching property and unit: ", error);
        message.error('Failed to fetch data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPropertyAndUnit();
  }, [propertyId, unitName, dispatch]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleEdit = (section: 'details' | 'description') => {
    if (section === 'details') {
      setIsEditingDetails(!isEditingDetails);
    } else {
      setIsEditingDescription(!isEditingDescription);
    }
  };

  const handleInputChange = (field: keyof Unit, value: string | number) => {
    setEditedUnit(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleSave = async (section: 'details' | 'description') => {
    if (!editedUnit || !property) {
      message.error('Cannot update unit: Missing data');
      return;
    }

    const db = getFirestore();
    const propertyRef = doc(db, 'properties', property.id);

    try {
      const updatedUnits = property.units.map(u => 
        u.unitName === editedUnit.unitName ? editedUnit : u
      );

      await updateDoc(propertyRef, { units: updatedUnits });

      if (section === 'details') {
        setIsEditingDetails(false);
      } else {
        setIsEditingDescription(false);
      }

      setUnit(editedUnit);
      setProperty({ ...property, units: updatedUnits });
      dispatch({ type: 'UPDATE_UNIT', payload: editedUnit });
      message.success('Unit updated successfully');
    } catch (error) {
      console.error("Error updating document: ", error);
      message.error('Failed to update unit');
    }
  };

  const handleAddImage = () => {
    // Implement image upload logic here
    console.log('Add image clicked');
  };

  if (isLoading) {
    return <Spin size="large" />;
  }

  if (!property || !unit || !editedUnit) {
    return <div>No data available</div>;
  }

  return (
    <div className="property-info-unit-view">
      <Button 
        className="back-button-unit-view" 
        icon={<LeftOutlined />}
        onClick={handleBack}
      />
      <Title level={2} className="property-title">{property.name}</Title>
      <Title level={3} className="unit-title">Unit {editedUnit.unitName}</Title>
      <Card 
        className="unit-details-card"
        title="Unit Details"
        extra={
          <Button 
            icon={isEditingDetails ? <SaveOutlined /> : <EditOutlined />} 
            onClick={() => isEditingDetails ? handleSave('details') : handleEdit('details')}
          >
            {isEditingDetails ? 'Save' : 'Edit'}
          </Button>
        }
      >
        <Form layout="vertical">
          <Row gutter={[16, 16]}>
            {(Object.keys(editedUnit) as Array<keyof Unit>).filter(key => 
              ['unitName', 'size', 'beds', 'baths', 'marketRent', 'tenant'].includes(key)
            ).map((field) => (
              <Col span={12} key={field}>
                <Form.Item label={field.charAt(0).toUpperCase() + field.slice(1)}>
                  {isEditingDetails ? (
                    <Input 
                      value={editedUnit[field]} 
                      onChange={(e) => handleInputChange(field, e.target.value)}
                    />
                  ) : (
                    <Text>{editedUnit[field]}</Text>
                  )}
                </Form.Item>
              </Col>
            ))}
          </Row>
        </Form>
      </Card>
      <Card 
        className="description-card" 
        title="Description"
        extra={
          <Button 
            icon={isEditingDescription ? <SaveOutlined /> : <EditOutlined />} 
            onClick={() => isEditingDescription ? handleSave('description') : handleEdit('description')}
          >
            {isEditingDescription ? 'Save' : 'Edit'}
          </Button>
        }
      >
        {isEditingDescription ? (
          <TextArea 
            value={editedUnit.description} 
            onChange={(e) => handleInputChange('description', e.target.value)} 
            autoSize={{ minRows: 3, maxRows: 6 }}
          />
        ) : (
          <Text>{editedUnit.description || 'No description available.'}</Text>
        )}
      </Card>
      <Row gutter={16}>
        <Col span={12}>
          <Card 
            className="images-card" 
            title="Images"
            extra={
              <Button icon={<PlusOutlined />} onClick={handleAddImage}>
                Add
              </Button>
            }
          >
            {/* Add image gallery component here */}
            <Text>Image gallery placeholder</Text>
          </Card>
        </Col>
        <Col span={12}>
          <Card className="tenant-info-card" title="Tenant Info">
            {/* Add tenant information here */}
            <Text>Tenant information placeholder</Text>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default PropertyInfoUnitView;
