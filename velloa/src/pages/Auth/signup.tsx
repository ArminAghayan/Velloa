import React, { useState } from 'react';
import { Steps, Form, Input, Button, DatePicker, Space, message, Row, Col } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { auth, createUserWithEmailAndPassword, db, addDoc, collection } from '../../firebase-config';

const { Step } = Steps;

const Signup: React.FC = () => {
    const [currentStep, setCurrentStep] = useState<number>(0);
    const [form] = Form.useForm();

    const nextStep = () => setCurrentStep(currentStep + 1);
    const prevStep = () => setCurrentStep(currentStep - 1);

    const handleFirebaseSignup = async (email: string, password: string) => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            return userCredential.user;
        } catch (error) {
            throw error;
        }
    };

    const handleFormSubmit = async (values: any) => {
        try {
            const { email, password, ...rest } = values;
            const user = await handleFirebaseSignup(email, password);
            await addDoc(collection(db, "users"), {
                uid: user.uid,
                ...rest
            });
            message.success('Signup successful!');
        } catch (error) {
            console.error(error);
            message.error('Signup failed. Please try again.');
        }
    };

    // Adjust the handleSubmit function to call handleFormSubmit
    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            await handleFormSubmit(values);
        } catch (errorInfo) {
            console.log('Failed:', errorInfo);
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
                            fieldKey={fieldKey} // Just use fieldKey directly here
                            rules={[{ required: true, message: 'Missing property name' }]}
                        >
                            <Input placeholder="Property Name" />
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
            case 3:
                return (
                    <>
                        {/* Form fields for step 3 */}
                    </>
                );
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
                <Step title="Property Setup" />
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
