import React, { useState } from 'react';
import { Form, Button, Input, Typography, Checkbox, message, Steps, Select, DatePicker, InputNumber, Row, Col, Divider, Layout, Menu } from 'antd';
import {PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import './RentalApplicationForm.css';
import Header from './Header/UserHeader';

const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { Content } = Layout;

const RentalApplicationForm: React.FC = () => {
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: 'Personal Information',
      content: (
        <div className="step-content">
          <Form.Item
            label="First Name"
            name="firstName"
            rules={[{ required: true, message: 'Please enter your first name' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Middle Name"
            name="middleName"
            // Optional field, so no required rule
          >
            <Input placeholder="Optional" />
          </Form.Item>

          <Form.Item
            label="Last Name"
            name="lastName"
            rules={[{ required: true, message: 'Please enter your last name' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Please enter your email' },
              { type: 'email', message: 'Please enter a valid email' }
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Phone Number"
            name="phone"
            rules={[{ required: true, message: 'Please enter your phone number' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Date of Birth"
            name="dateOfBirth"
            rules={[{ required: true, message: 'Please select your date of birth' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            label="Social Security Number"
            name="ssn"
            rules={[{ required: true, message: 'Please enter your SSN' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Email"
            name="email"
            rules={[{ required: true, message: 'Please enter your email' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Phone Number"
            name="phone"
            rules={[{ required: true, message: "Please enter your phone number" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Gender"
            name="gender"
            rules={[{ required: true, message: 'Please enter your gender' }]}
          >
            <Select>
              <Option value="male">Male</Option>
              <Option value="female">Female</Option>
              <Option value="other">Other</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Marital Status"
            name="maritalStatus"
            rules={[{ required: true, message: 'Please select your marital status' }]}
          >
            <Select>
              <Option value="single">Single</Option>
              <Option value="married">Married</Option>
              <Option value="divorced">Divorced</Option>
              <Option value="widowed">Widowed</Option>
              <Option value="separated">Separated</Option>
            </Select>
          </Form.Item>
          <Form.Item
            label="Driver's License Number"
            name="driverLicense"
            rules={[{ required: true, message: "Please enter your driver's license number" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Driver's License Province"
            name="driverLicenseProvince"
            rules={[{ required: true, message: 'Please select your driver license province' }]}
          >
            <Select>
              <Option value="AB">Alberta</Option>
              <Option value="BC">British Columbia</Option>
              <Option value="MB">Manitoba</Option>
              <Option value="NB">New Brunswick</Option>
              <Option value="NL">Newfoundland and Labrador</Option>
              <Option value="NS">Nova Scotia</Option>
              <Option value="NT">Northwest Territories</Option>
              <Option value="NU">Nunavut</Option>
              <Option value="ON">Ontario</Option>
              <Option value="PE">Prince Edward Island</Option>
              <Option value="QC">Quebec</Option>
              <Option value="SK">Saskatchewan</Option>
              <Option value="YT">Yukon</Option>
            </Select>
          </Form.Item>
          <Form.Item
            label="Tell us about yourself"
            name="aboutYourself"
            rules={[{ required: true, message: 'Please tell us about yourself' }]}
          >
            <TextArea />
          </Form.Item>

         
         
        </div>
      )
    },
    {
      title: 'Residential Information',
      content: (
        <div>
          <Form.Item
            label="Street Address Line 1"
            name="streetAddress1"
            rules={[{ required: true, message: 'Please enter your street address' }]}
          >
            <Input placeholder="123 Main Street" />
          </Form.Item>

          <Form.Item
            label="Street Address Line 2"
            name="streetAddress2"
          >
            <Input placeholder="Apt, Suite, Unit (Optional)" />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="City"
                name="city"
                rules={[{ required: true, message: 'Please enter your city' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Province"
                name="province"
                rules={[{ required: true, message: 'Please select your province' }]}
              >
                <Select style={{ height: '40px' }}>
                  <Option value="AB">Alberta</Option>
                  <Option value="BC">British Columbia</Option>
                  <Option value="MB">Manitoba</Option>
                  <Option value="NB">New Brunswick</Option>
                  <Option value="NL">Newfoundland and Labrador</Option>
                  <Option value="NS">Nova Scotia</Option>
                  <Option value="NT">Northwest Territories</Option>
                  <Option value="NU">Nunavut</Option>
                  <Option value="ON">Ontario</Option>
                  <Option value="PE">Prince Edward Island</Option>
                  <Option value="QC">Quebec</Option>
                  <Option value="SK">Saskatchewan</Option>
                  <Option value="YT">Yukon</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Postal Code"
                name="postalCode"
                rules={[{ required: true, message: 'Please enter your postal code' }]}
              >
                <Input placeholder="A1A 1A1" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Country"
                name="country"
                initialValue="Canada"
                rules={[{ required: true }]}
              >
                <Input disabled />
              </Form.Item>
            </Col>
          </Row>
          <Divider />

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Landlord Phone Number"
                name="landlordPhone"
                rules={[{ required: true, message: 'Please enter your landlord phone number' }]}
              >
                <Input placeholder="123-456-7890" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Landlord Email"
                name="landlordEmail"
                rules={[{ required: true, message: 'Please enter your landlord email' }]}
              >
                <Input placeholder="john.doe@example.com" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Move-in Date"
                name="moveInDate"
                rules={[{ required: true, message: 'Please enter your move-in date' }]}
              >
                <DatePicker style={{ width: '100%', height: '40px' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Monthly Payment"
                name="monthlyPayment"
                rules={[{ required: true, message: 'Please enter your monthly payment' }]}
              >
                <Input type="number" prefix="$" style={{ height: '40px', padding: '6px' }} />
              </Form.Item>
            </Col>
          </Row>
        </div>
      )
    },
    {
      title: 'Employment Information',
      content: (
        <div>
          <Form.Item
            label="Job Type"
            name="jobType"
            rules={[{ required: true, message: 'Please enter your job type' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Annual Income"
            name="annualIncome"
            rules={[{ required: true, message: 'Please enter your annual income' }]}
          >
            <Input type="number" prefix="$" />
          </Form.Item>

          <Form.Item
            label="Title Position"
            name="titlePosition"
            rules={[{ required: true, message: 'Please enter your position title' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Company Name"
            name="companyName"
            rules={[{ required: true, message: 'Please enter your company name' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="I currently work here"
            name="currentlyEmployed"
            valuePropName="checked"
          >
            <Checkbox />
          </Form.Item>

          <Form.Item
            label="Supervisor Name"
            name="supervisorName"
            rules={[{ required: true, message: 'Please enter your supervisor name' }]}
          >
            <Input />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Start Date"
                name="startDate"
                rules={[{ required: true, message: 'Please select your start date' }]}
              >
                <DatePicker style={{ width: '100%', height: '40px' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="End Date"
                name="endDate"
              >
                <DatePicker style={{ width: '100%', height: '40px' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Supervisor Email"
                name="supervisorEmail"
                rules={[
                  { required: true, message: 'Please enter your supervisor email' },
                  { type: 'email', message: 'Please enter a valid email' }
                ]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Supervisor Phone"
                name="supervisorPhone"
                rules={[{ required: true, message: 'Please enter your supervisor phone number' }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
        </div>
      )
    },
    {
      title: 'Vehicle Information',
      content: (
        <div>
          <Form.Item
            label="Make"
            name="vehicleMake"
            rules={[{ required: true, message: 'Please enter vehicle make' }]}
          >
            <Input placeholder="e.g., Toyota, Honda" />
          </Form.Item>

          <Form.Item
            label="Model"
            name="vehicleModel"
            rules={[{ required: true, message: 'Please enter vehicle model' }]}
          >
            <Input placeholder="e.g., Camry, Civic" />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Year"
                name="vehicleYear"
                rules={[{ required: true, message: 'Please enter vehicle year' }]}
              >
                <InputNumber 
                  style={{ width: '100%', height: '40px' }} 
                  min={1900} 
                  max={new Date().getFullYear() + 1}
                  placeholder="e.g., 2020" 
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Color"
                name="vehicleColor"
                rules={[{ required: true, message: 'Please enter vehicle color' }]}
              >
                <Input placeholder="e.g., Silver" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="License Plate"
                name="licensePlate"
                rules={[{ required: true, message: 'Please enter license plate number' }]}
              >
                <Input placeholder="e.g., ABC 123" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Province Registered"
                name="provinceRegistered"
                rules={[{ required: true, message: 'Please select province of registration' }]}
              >
                <Select style={{ height: '40px' }}>
                  <Option value="AB">Alberta</Option>
                  <Option value="BC">British Columbia</Option>
                  <Option value="MB">Manitoba</Option>
                  <Option value="NB">New Brunswick</Option>
                  <Option value="NL">Newfoundland and Labrador</Option>
                  <Option value="NS">Nova Scotia</Option>
                  <Option value="NT">Northwest Territories</Option>
                  <Option value="NU">Nunavut</Option>
                  <Option value="ON">Ontario</Option>
                  <Option value="PE">Prince Edward Island</Option>
                  <Option value="QC">Quebec</Option>
                  <Option value="SK">Saskatchewan</Option>
                  <Option value="YT">Yukon</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </div>
      )
    },
    {
      title: 'Dependents',
      content: (
        <div>
          <Form.List
            name="dependents"
            initialValue={[{}]}
          >
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <div key={key} style={{ marginBottom: 24 }}>
                    <Row gutter={16}>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          {...restField}
                          name={[name, 'firstName']}
                          label="First Name"
                          rules={[{ required: true, message: 'Please enter first name' }]}
                        >
                          <Input placeholder="First Name" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          {...restField}
                          name={[name, 'lastName']}
                          label="Last Name"
                          rules={[{ required: true, message: 'Please enter last name' }]}
                        >
                          <Input placeholder="Last Name" />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={16}>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          {...restField}
                          name={[name, 'dateOfBirth']}
                          label="Date of Birth"
                          rules={[{ required: true, message: 'Please select date of birth' }]}
                        >
                          <DatePicker style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          {...restField}
                          name={[name, 'relationship']}
                          label="Relationship"
                          rules={[{ required: true, message: 'Please select relationship' }]}
                        >
                          <Select placeholder="Select relationship">
                            <Option value="child">Child</Option>
                            <Option value="spouse">Spouse</Option>
                            <Option value="parent">Parent</Option>
                            <Option value="sibling">Sibling</Option>
                            <Option value="other">Other</Option>
                          </Select>
                        </Form.Item>
                      </Col>
                    </Row>

                    <Form.Item
                      {...restField}
                      name={[name, 'occupation']}
                      label="Occupation"
                      rules={[{ required: true, message: 'Please enter occupation' }]}
                    >
                      <Input placeholder="Occupation" />
                    </Form.Item>

                    {fields.length > 1 && (
                      <Button 
                        type="text" 
                        onClick={() => remove(name)} 
                        icon={<MinusCircleOutlined />} 
                        style={{ marginBottom: 24 }}
                      >
                        Remove Dependent
                      </Button>
                    )}

                    <Divider />
                  </div>
                ))}

                <Form.Item>
                  <Button 
                    type="default" 
                    onClick={() => add()} 
                    block 
                    icon={<PlusOutlined />}
                  >
                    Add Another Dependent
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
        </div>
      )
    }
  ];

  const handleSubmit = async (values: any) => {
    try {
      console.log('Form values:', values);
      message.success('Application submitted successfully!');
    } catch (error) {
      console.error('Error submitting application:', error);
      message.error('Failed to submit application');
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header />
      <Content style={{ 
        padding: '40px 20px',
        backgroundColor: '#f5f5f5'
      }}>
        <Row gutter={24} justify="center">
          <Col xs={24} lg={8}>
            <div style={{ 
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              padding: '32px',
              height: '350px'
            }}>
              <Title level={3}>Company Name</Title>
            </div>
          </Col>

          <Col xs={24} lg={14}>
            <div style={{ 
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              padding: '32px'
            }}>
              <Title level={2} style={{ textAlign: 'center', marginBottom: '32px' }}>
                Rental Application
              </Title>
              
              <Steps 
                current={currentStep} 
                items={steps
                  .map((step, index) => ({
                    ...step,
                    status: index === currentStep ? 'process' as const : 
                            index < currentStep ? 'finish' as const : 
                            index > currentStep ? 'wait' as const : undefined
                  }))
                  .slice(Math.max(0, currentStep - 1), Math.min(currentStep + 2, steps.length))} 
                style={{ 
                  marginBottom: 32, 
                  padding: '0 24px',
                  width: '100%' 
                }}
                progressDot
              />

              <div style={{ padding: '0 24px' }}>
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleSubmit}
                >
                  {steps[currentStep].content}

                  <div style={{ 
                    marginTop: 32,
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: 12
                  }}>
                    {currentStep > 0 && (
                      <Button 
                        onClick={() => setCurrentStep(currentStep - 1)}
                      >
                        Previous
                      </Button>
                    )}
                    {currentStep < steps.length - 1 && (
                      <Button 
                        type="primary" 
                        onClick={() => setCurrentStep(currentStep + 1)}
                      >
                        Next
                      </Button>
                    )}
                    {currentStep === steps.length - 1 && (
                      <Button type="primary" htmlType="submit">
                        Submit Application
                      </Button>
                    )}
                  </div>
                </Form>
              </div>
            </div>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
};

export default RentalApplicationForm;
