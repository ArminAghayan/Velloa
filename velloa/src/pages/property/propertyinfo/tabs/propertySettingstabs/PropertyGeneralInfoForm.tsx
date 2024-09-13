// propertySettingstabs/GeneralInfoForm.tsx

import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Row, Col, Typography, notification } from 'antd';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import './PropertyGeneralInfoForm.css'
const { Text } = Typography;

interface GeneralInfoFormProps {
  propertyKey: string;
  updatePropertyName: (newName: string) => void;
}

const GeneralInfoForm: React.FC<GeneralInfoFormProps> = ({ propertyKey, updatePropertyName }) => {
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
    const db = getFirestore();
    const docRef = doc(db, 'properties', propertyKey);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      setPropertyName(data.propertyName || '');
      setStreet1(data.address?.street1 || '');
      setStreet2(data.address?.street2 || '');
      setCity(data.address?.city || '');
      setState(data.address?.state || '');
      setZip(data.address?.zip || '');
      setCountry(data.address?.country || '');
      setPropertyDescription(data.description || '');
      setCharacterCount((data.description || '').length);
      form.setFieldsValue({
        propertyName: data.propertyName || '',
        street1: data.address?.street1 || '',
        street2: data.address?.street2 || '',
        city: data.address?.city || '',
        state: data.address?.state || '',
        zip: data.address?.zip || '',
        country: data.address?.country || '',
        propertyDescription: data.description || '',
      });
    } else {
      console.log('No such document!');
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

  const updateDatabase = async (updates: any) => {
    const db = getFirestore();
    const docRef = doc(db, 'properties', propertyKey);
    try {
      await updateDoc(docRef, updates);
      notification.success({
        message: 'Database Updated',
        description: 'The property information has been successfully updated.',
        placement: 'top',
      });
    } catch (error) {
      console.error("Error updating document: ", error);
      notification.error({
        message: 'Update Failed',
        description: 'There was an error updating the property information.',
        placement: 'top',
      });
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      await updateDatabase({
        propertyName: values.propertyName,
        description: values.propertyDescription,
        address: {
          street1: values.street1,
          street2: values.street2,
          city: values.city,
          state: values.state,
          zip: values.zip,
          country: values.country,
        },
      });

      updatePropertyName(values.propertyName);
    } catch (error) {
      console.error('Validation Failed:', error);
    }
  };

  return (
    <div className="general-container">

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
      <Form.Item label={<span className="generalinfo_label">Detailed description of this property</span>} name="propertyDescription">
        <Input.TextArea value={propertyDescription} onChange={handleDescriptionChange} />
      </Form.Item>
      <div className="character-count">{characterCount}/800 characters</div>
      <Button type="primary" onClick={handleSave}>Save</Button>
    </Form>
    </div>
  );
};

export default GeneralInfoForm;
