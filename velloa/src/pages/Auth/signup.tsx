import React, { useState, useEffect } from 'react';
import { Steps, Form, Input, Button, DatePicker, Space, message, Row, Col,InputNumber  } from 'antd';
import { MinusCircleOutlined, PlusOutlined, CheckCircleOutlined, LoadingOutlined } from '@ant-design/icons';

import { auth, createUserWithEmailAndPassword, db, addDoc, collection } from '../../firebase-config';

const { Step } = Steps;

const Signup: React.FC = () => {
    const [currentStep, setCurrentStep] = useState<number>(0);
    const [form] = Form.useForm();

    const nextStep = async () => {
        try {
          // Determine fields to validate based on the current step
          const fieldsToValidate = currentStep === 0 ? ['email', 'password', 'confirmationNumber'] :
                                  currentStep === 1 ? ['title', 'firstName', 'lastName', 'dob', 'address'] :
                                  currentStep === 2 ? ['companyName', 'companyAddress', 'properties'] : [];
          
          // Validate only the required fields for the current step
          await form.validateFields(fieldsToValidate);
          setCurrentStep(currentStep + 1); // Proceed to next step if validation is successful
        } catch (error) {
          // Handle validation failure (e.g., by showing a message)
          console.error('Validation failed:', error);
        }
      };
          const prevStep = () => setCurrentStep(currentStep - 1);
    const [showCheckMark, setShowCheckMark] = useState(false); // New state
    const [loading, setLoading] = useState<boolean>(false); // State to control loading indicator

    const handleFirebaseSignup = async (email: string, password: string) => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            return userCredential.user;
        } catch (error) {
            throw error;
        }
    };

    // Adjust the handleSubmit function to call handleFormSubmit

    useEffect(() => {
        // If on the last step, trigger loading and then show checkmark after a delay
        if (currentStep === 3) {
          setLoading(true);
          const timer = setTimeout(() => {
            setLoading(false);
            message.success('Registration Complete!');
          }, 10000); // Wait for 10 seconds
    
          // Cleanup function to clear the timeout if the component unmounts
          return () => clearTimeout(timer);
        }
      }, [currentStep]);

    const handleSubmit = async () => {
        const { email, password, companyName, companyAddress, properties } = form.getFieldsValue();
        
        try {
            const user = await handleFirebaseSignup(email, password);

            const companyRef = await addDoc(collection(db, "companies"), {
              uid: user.uid,
              companyName,
              companyAddress
            });

            for (const property of properties) {
                const propertyRef = await addDoc(collection(db, "properties"), {
                  companyId: companyRef.id,
                  propertyName: property.name,
                  propertyAddress: property.address // Include property address
                });

                // Create a new document in the standalone "units" collection
                await addDoc(collection(db, "units"), {
                  propertyId: propertyRef.id, // Link unit to property
                  numberOfUnits: property.units // Store number of units for the property
                });
            }

            message.success('Signup successful!');
        } catch (error) {
            console.error('Signup failed:', error);
            message.error('Signup failed.');
        }
    };


    const renderStepContent = (step: number) => {

        
        switch (step) {
            case 0:
                return (
                    <>
                        <Form.Item name="email" label="Email" rules={[{ required: true, message: 'Please input your email!' }]}>
                <Input />
              </Form.Item>
              <Form.Item name="password" label="Password" rules={[{ required: true, message: 'Please input your password!' }]}>
                <Input.Password />
              </Form.Item>
              <Form.Item name="confirmationNumber" label="Confirmation Number" rules={[{ required: true, message: 'Please input your confirmation number!' }]}>
                <Input />
              </Form.Item>
                    </>
                );
            case 1:
                return (
                    <>
                       <Form.Item name="title" label="Title">
                <Input />
              </Form.Item>
              <Form.Item name="firstName" label="First Name" rules={[{ required: true, message: 'Please input your first name!' }]}>
                <Input />
              </Form.Item>
              <Form.Item name="middleName" label="Middle Name">
                <Input />
              </Form.Item>
              <Form.Item name="lastName" label="Last Name" rules={[{ required: true, message: 'Please input your last name!' }]}>
                <Input />
              </Form.Item>
              <Form.Item name="suffix" label="Suffix">
                <Input />
              </Form.Item>
              <Form.Item name="dob" label="Date of Birth" rules={[{ required: true, message: 'Please select your date of birth!' }]}>
                <DatePicker />
              </Form.Item>
              <Form.Item name="address" label="Address" rules={[{ required: true, message: 'Please input your address!' }]}>
                <Input />
              </Form.Item>
                    </>
                );
                case 2:
                    return (
                        <>
                            <Form.Item name="companyName" label="Company Name" rules={[{ required: true, message: 'Please input your company name!' }]}>
                                <Input />
                            </Form.Item>
                            <Form.Item name="companyAddress" label="Company Address" rules={[{ required: true, message: 'Please input your company address!' }]}>
                                <Input />
                            </Form.Item>
                            <Form.List name="properties">
                                        {(fields, { add, remove }) => (
                                            <>
                                                {fields.map(({ key, name, fieldKey, ...restField }) => (
                                                    <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                                                        <Form.Item
                                                            {...restField}
                                                            name={[name, 'name']}
                                                            fieldKey={fieldKey} // Directly use fieldKey here without wrapping in an array
                                                            rules={[{ required: true, message: 'Missing property name' }]}
                                                        >
                                                            <Input placeholder="Property Name" />
                                                        </Form.Item>
                                                        <Form.Item
                                                            {...restField}
                                                            name={[name, 'address']}
                                                            fieldKey={fieldKey} // And here
                                                            rules={[{ required: true, message: 'Missing property address' }]}
                                                        >
                                                            <Input placeholder="Property Address" />
                                                        </Form.Item>
                                                        <Form.Item
                                                            {...restField}
                                                            name={[name, 'units']}
                                                            fieldKey={fieldKey} // And here
                                                            rules={[{ required: true, message: 'Missing number of units' }]}
                                                        >
                                                            <InputNumber min={1} placeholder="Number of Units" />
                                                        </Form.Item>
                                                        <MinusCircleOutlined onClick={() => remove(name)} />
                                                    </Space>
                                                ))}

                                                <Form.Item>
                                                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                                        Add Property
                                                    </Button>
                                                </Form.Item>
                                            </>
                                        )}
                                    </Form.List>

                        </>
                    );
                // Case 3 adjustments for unit input
                case 3:
        if (loading) {
          return <div style={{ textAlign: 'center', marginTop: 48 }}>
            <LoadingOutlined style={{ fontSize: '24px' }} />
            <p>Processing...</p>
          </div>;
        } else {
          return <div style={{ textAlign: 'center', marginTop: 48 }}>
            <CheckCircleOutlined style={{ color: 'green', fontSize: '24px' }} />
            <p>Registration Complete!</p>
          </div>;
        }
      default:
        return null;
    }
  };
    return (
        <div>
            <Steps current={currentStep}>
                <Step title="Email and Passowrd" />
                <Step title="Personal Information" />
                <Step title="Company Information" />
                <Step title="Complete" />
            </Steps>
            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                autoComplete="off"
                style={{ marginTop: 32 }}
            >
                {renderStepContent(currentStep)}
                <Row justify="space-between" style={{ marginTop: 24 }}>
                    <Col>
                        <Button disabled={currentStep === 0} onClick={prevStep}>
                            Previous
                        </Button>
                    </Col>
                    <Col>
                        <Button type="primary" onClick={currentStep < 3 ? nextStep : handleSubmit}>
                            {currentStep < 3 ? 'Next' : 'Submit'}
                        </Button>
                    </Col>
                </Row>
            </Form>
        </div>
    );
};

export default Signup;
