// propertySettingstabs/GeneralInfoForm.tsx

import React, { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { Form, Input, Row, Col, notification } from 'antd';
import { getFirestore, doc, getDoc, writeBatch, setDoc, updateDoc, Timestamp } from 'firebase/firestore';
import './PropertyGeneralInfoForm.css'
import { auth, db } from '../../../../../firebase-config';

interface GeneralInfoFormProps {
  propertyKey: string;
  updatePropertyName: (newName: string) => void;
}

const GeneralInfoForm = forwardRef<{ handleSave: () => Promise<void> }, GeneralInfoFormProps>(
  ({ propertyKey, updatePropertyName }, ref) => {
  const [propertyName, setPropertyName] = useState('');
  const [street1, setStreet1] = useState('');
  const [street2, setStreet2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [country, setCountry] = useState('');
  const [propertyDescription, setPropertyDescription] = useState('');
  const [characterCount, setCharacterCount] = useState(0);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchPropertyInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyKey]);

  const fetchPropertyInfo = async () => {
    try {
      // Get the general settings document
      const settingsDocRef = doc(db, 'properties', propertyKey, 'propertySettings', 'general');
      const docSnap = await getDoc(settingsDocRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // Set all the form values
        setPropertyName(data.propertyName || '');
        setPropertyDescription(data.propertyDescription || '');
        setCharacterCount((data.propertyDescription || '').length);
        
        // Set address values from the general document
        setStreet1(data.address?.street1 || '');
        setStreet2(data.address?.street2 || '');
        setCity(data.address?.city || '');
        setState(data.address?.state || '');
        setZip(data.address?.zip || '');
        setCountry(data.address?.country || '');

        // Update form with all values
        form.setFieldsValue({
          propertyName: data.propertyName || '',
          propertyDescription: data.propertyDescription || '',
          street1: data.address?.street1 || '',
          street2: data.address?.street2 || '',
          city: data.address?.city || '',
          state: data.address?.state || '',
          zip: data.address?.zip || '',
          country: data.address?.country || '',
        });
      } else {
        // If no general document exists yet, try to get data from the main property document
        const propertyDocRef = doc(db, 'properties', propertyKey);
        const propertyDocSnap = await getDoc(propertyDocRef);
        
        if (propertyDocSnap.exists()) {
          const propertyData = propertyDocSnap.data();
          
          // Set values from the main property document
          setPropertyName(propertyData.propertyName || '');
          setStreet1(propertyData.address?.street1 || '');
          setStreet2(propertyData.address?.street2 || '');
          setCity(propertyData.address?.city || '');
          setState(propertyData.address?.state || '');
          setZip(propertyData.address?.zip || '');
          setCountry(propertyData.address?.country || '');

          // Update form with available values
          form.setFieldsValue({
            propertyName: propertyData.propertyName || '',
            street1: propertyData.address?.street1 || '',
            street2: propertyData.address?.street2 || '',
            city: propertyData.address?.city || '',
            state: propertyData.address?.state || '',
            zip: propertyData.address?.zip || '',
            country: propertyData.address?.country || '',
          });
        }
      }
    } catch (error) {
      console.error('Error fetching property info:', error);
      notification.error({
        message: 'Error',
        description: 'Failed to fetch property information.',
        placement: 'topRight'
      });
    }
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= 800) {
      setPropertyDescription(value);
      setCharacterCount(value.length);
      form.setFieldsValue({ propertyDescription: value });
    }
  };

  const handleFormSubmit = async (values: any) => {
    let propertyDoc;
    
    try {
      // First get the property document to get companyuid
      propertyDoc = await getDoc(doc(db, 'properties', propertyKey));
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

      // Create the general settings document with all data
      const generalData = {
        propertyName: values.propertyName || '',
        propertyDescription: values.propertyDescription || '',
        lastUpdated: Timestamp.now(),
        companyuid: companyuid,
        address: {
          street1: values.street1 || '',
          street2: values.street2 || '',
          city: values.city || '',
          state: values.state || '',
          zip: values.zip || '',
          country: values.country || ''
        }
      };

      // Create the general document in propertySettings
      const settingsDocRef = doc(db, 'properties', propertyKey, 'propertySettings', 'general');
      await setDoc(settingsDocRef, generalData);

      // Only update the property name in the parent component if we got this far
      if (updatePropertyName) {
        updatePropertyName(values.propertyName);
      }

      notification.success({
        message: 'Success',
        description: 'Property settings updated successfully',
        placement: 'topRight'
      });

    } catch (error) {
      console.error('Error updating settings:', error);
      let errorMessage = 'Failed to update property settings.';
      
      if (error instanceof Error) {
        if (error.message.includes('permission-denied')) {
          errorMessage = 'You do not have permission to update this property.';
          console.log('Debug info:', {
            propertyKey,
            companyuid: propertyDoc?.data()?.companyuid,
            currentUser: auth.currentUser?.uid
          });
        }
      }
      
      notification.error({
        message: 'Error',
        description: errorMessage,
        placement: 'topRight'
      });
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      await handleFormSubmit(values);
      if (updatePropertyName) {
        updatePropertyName(values.propertyName);
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error('Form validation failed:', error);
        notification.error({
          message: 'Validation Error',
          description: 'Please check all required fields are filled correctly.',
          placement: 'topRight'
        });
      }
    }
  };

  // Expose handleSave to parent
  useImperativeHandle(ref, () => ({
    handleSave
  }));

  return (
    <div className="general-container" style={{ border: 'none' }}>
      <Form form={form} layout="vertical">
        <Form.Item 
          label={<span className="generalinfo_label">Property Name</span>} 
          name="propertyName"
          rules={[{ required: true, message: 'Please enter the property name' }]}
        >
          <Input value={propertyName} onChange={(e) => setPropertyName(e.target.value)} />
        </Form.Item>
        <Form.Item 
          label={<span className="generalinfo_label">Street 1</span>} 
          name="street1"
          rules={[{ required: true, message: 'Please enter the street address' }]}
        >
          <Input value={street1} onChange={(e) => setStreet1(e.target.value)} />
        </Form.Item>
        <Form.Item label={<span className="generalinfo_label">Street 2</span>} name="street2">
          <Input value={street2} onChange={(e) => setStreet2(e.target.value)} />
        </Form.Item>
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item 
              label={<span className="generalinfo_label">City</span>} 
              name="city"
              rules={[{ required: true, message: 'Please enter the city' }]}
            >
              <Input value={city} onChange={(e) => setCity(e.target.value)} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item 
              label={<span className="generalinfo_label">State</span>} 
              name="state"
              rules={[{ required: true, message: 'Please enter the state' }]}
            >
              <Input value={state} onChange={(e) => setState(e.target.value)} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item 
              label={<span className="generalinfo_label">Zip code</span>} 
              name="zip"
              rules={[{ required: true, message: 'Please enter the zip code' }]}
            >
              <Input value={zip} onChange={(e) => setZip(e.target.value)} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item 
              label={<span className="generalinfo_label">Country</span>} 
              name="country"
              rules={[{ required: true, message: 'Please enter the country' }]}
            >
              <Input value={country} onChange={(e) => setCountry(e.target.value)} />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item label={<span className="generalinfo_label">Description:</span>} name="propertyDescription">
          <Input.TextArea 
            value={propertyDescription} 
            onChange={handleDescriptionChange}
            showCount
            maxLength={800}
            style={{ height: 120 }}
          />
        </Form.Item>
      </Form>
    </div>
  );
});

export default GeneralInfoForm;
