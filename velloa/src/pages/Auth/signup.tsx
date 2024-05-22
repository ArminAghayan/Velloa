import React, { useState, useEffect } from 'react';
import { Steps, Form, Input, Button, DatePicker, Select, message, Carousel } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { auth, createUserWithEmailAndPassword, db } from '../../firebase-config';
import { sendEmailVerification } from "firebase/auth";
import moment from 'moment';
import { Timestamp } from 'firebase/firestore';
import { addDoc, collection, doc, setDoc, updateDoc } from 'firebase/firestore';
import './signup.css';

const { Step } = Steps;

interface AccountFormValues {
  email: string;
  password: string;
}

interface PersonalInfoFormValues {
  title: string;
  firstName: string;
  middleName: string;
  lastName: string;
  suffix: string;
  dob: moment.Moment; // Ensure you have moment.js installed or use a Date type
  address: {
    addressline: string;
    secondAddressLine: string;
    city: string;
    postal: string;
    province: string;
    country: string;
  };
}

interface CompanyInfoFormValues {
  companyName: string;
  companyPhoneNumber: string;
  companyEmail: string;
  companyAddress: {
    addressline: string;
    secondAddressLine?: string; // Make optional if not required
    city: string;
    postal: string;
    province: string;
    country: string;
  };
}

const Signup = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();


  const handleAccountCreation = async ({ email, password }: AccountFormValues) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(userCredential.user);
      message.info('A verification email has been sent. Please verify your email.');
      // Move to loading / email verification check page
      setCurrentStep(currentStep + 1); // Assuming this is your loading/verification page
    } catch (error: any) { // Adjust error handling as needed
      if (error instanceof Error) {
        console.error('Account creation failed:', error);
        message.error(`Account creation failed. ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePersonalInfoSubmit = async (values: PersonalInfoFormValues) => {
    if (!auth.currentUser) {
      message.error("You must be logged in to perform this action.");
      return;
    }

    const processedValues = {
      ...values,
      middleName: values.middleName || "",
      suffix: values.suffix || "",
      dob: values.dob ? Timestamp.fromDate(values.dob.toDate()) : null,
      address: {
        ...values.address,
        secondAddressLine: values.address.secondAddressLine || "",
      },
      uid: auth.currentUser.uid,
    };

    try {
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      await setDoc(userDocRef, processedValues);
      console.log("User document written with ID: ", userDocRef.id);
      message.success("Personal information saved successfully!");

      // Proceed to the next step
      setCurrentStep(currentStep + 1);
    } catch (error) {
      console.error("Error adding user document: ", error);
      message.error("Failed to save personal information.");
    }
  };

  useEffect(() => {
    // This function checks the user's email verification status
    const checkEmailVerified = async () => {
      // Ensure currentUser is not null before attempting to reload or access properties
      if (auth.currentUser) {
        await auth.currentUser.reload();
        if (auth.currentUser.emailVerified) {
          setCurrentStep(currentStep + 1); // Move to the next step
          clearInterval(intervalId); // Clear the interval once verified
        }
      }
    };

    const intervalId = setInterval(() => {
      // Only proceed with the check if currentUser exists and email is not verified
      if (auth.currentUser && !auth.currentUser.emailVerified) {
        checkEmailVerified();
      }
    }, 10000); // Check every 15 seconds

    // Cleanup on component unmount
    return () => clearInterval(intervalId);
  }, [currentStep]);

  const handleCompanyInfoSubmit = async (values: CompanyInfoFormValues) => {
    if (!auth.currentUser) {
      console.error('No user logged in');
      message.error('You must be logged in to perform this action.');
      return;
    }

    const { companyName, companyPhoneNumber, companyEmail, companyAddress } = values;

    try {
      const companyAddressData = {
        ...companyAddress,
        secondAddressLine: companyAddress.secondAddressLine || "",
      };

      const companyData = {
        companyName,
        companyPhoneNumber,
        companyEmail,
        companyAddress: companyAddressData,
        uid: auth.currentUser.uid, // Make sure this matches the authenticated user's UID
        owner_id: auth.currentUser.uid, // Include owner_id
        members: {
          [auth.currentUser.uid]: { role: "Owner" } // Initial member with Owner role
        }
      };

      // Add company document
      const companyRef = await addDoc(collection(db, "companies"), companyData);
      const companyuid = companyRef.id;

      // Update the company document with the companyuid
      await updateDoc(companyRef, { companyuid });

      // Update the user's document with the companyuid
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userDocRef, { companyuid });

      message.success('Company information saved successfully!');
      navigate('/home', { state: { companyId: companyRef.id } });
    } catch (error) {
      console.error('Error saving company information:', error);
      message.error('Error saving company information.');
    }
  };
  
  
  
  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Form
            form={form}
            layout="vertical"
            onFinish={handleAccountCreation} 
            >
            <Form.Item
              name="email"
              label="Email"
              rules={[{ required: true, message: 'Please input your email!' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="password"
              label="Password"
              rules={[{ required: true, message: 'Please input your password!' }]}
            >
              <Input.Password />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              Create Account
            </Button>
          </Form>
        );
        case 1: // Assuming this is the loading/verification page
        return (
          <div>
            <p>Verifying your email... Please check your inbox and verify your email to continue.</p>
            <LoadingOutlined style={{ fontSize: 24 }} spin />
          </div>
        );
      
        case 2:
          return (
            <Form
              form={form}
              layout="vertical"
              onFinish={handlePersonalInfoSubmit}
            >
              <Form.Item
                name="title"
                label="Title"
                rules={[{ required: true, message: 'Please select your title!' }]}
              >
                <Select>
                  <Select.Option value="Mr">Mr</Select.Option>
                  <Select.Option value="Ms">Ms</Select.Option>
                  <Select.Option value="Mrs">Mrs</Select.Option>
                  {/* Add more options as needed */}
                </Select>
              </Form.Item>
              <Form.Item
                name="firstName"
                label="First Name"
                rules={[{ required: true, message: 'Please input your first name!' }]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="middleName"
                label="Middle Name"
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="lastName"
                label="Last Name"
                rules={[{ required: true, message: 'Please input your last name!' }]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="suffix"
                label="Suffix"
              >
                <Select>
                  <Select.Option value="Jr">Jr</Select.Option>
                  <Select.Option value="Sr">Sr</Select.Option>
                  {/* Add more options as needed */}
                </Select>
              </Form.Item>
              <Form.Item
                name="dob"
                label="Date of Birth"
                rules={[{ required: true, message: 'Please select your date of birth!' }]}
              >
                <DatePicker />
              </Form.Item>
              {/* Address Fields */}
      <Form.Item
        name={['address', 'addressline']}
        label="Address"
        rules={[{ required: true, message: 'Please input your street!' }]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name={['address', 'secondAddressLine']}
        label="Address Line 2 (Optional)"
      >
        <Input />
      </Form.Item>
      <Form.Item
        name={['address', 'city']}
        label="City"
        rules={[{ required: true, message: 'Please input your city!' }]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name={['address', 'postal']}
        label="Postal / Zip Code"
        rules={[{ required: true, message: 'Please input your postal or zip code!' }]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name={['address', 'province']}
        label="Province / State"
        rules={[{ required: true, message: 'Please input your province or state!' }]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name={['address', 'country']}
        label="Country"
        rules={[{ required: true, message: 'Please select your country!' }]}
      >
        <Select showSearch>
          {/* Populate with your list of countries */}
          <Select.Option value="USA">USA</Select.Option>
          <Select.Option value="Canada">Canada</Select.Option>
          {/* Add more options as needed */}
        </Select>
      </Form.Item>

      <Button type="primary" htmlType="submit">
        Save Personal Information
      </Button>
    </Form>
  );
        
  case 3:
    return (
      <Form
        form={form}
        layout="vertical"
        onFinish={handleCompanyInfoSubmit}
      >
        <Form.Item
          name="companyName"
          label="Company Name"
          rules={[{ required: true, message: 'Please input your company name!' }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="companyPhoneNumber"
          label="Company Phone Number"
          rules={[{ required: true, message: 'Please input your company phone number!' }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="companyEmail"
          label="Company Email"
          rules={[{ required: true, message: 'Please input your company email!' }]}
        >
          <Input type="email" />
        </Form.Item>
        {/* Company Address Fields */}
        <Form.Item
          name={['companyAddress', 'addressline']}
          label="Address"
          rules={[{ required: true, message: 'Please input your company street address!' }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name={['companyAddress', 'secondAddressLine']}
          label="Address Line 2 (Optional)"
        >
          <Input />
        </Form.Item>
        <Form.Item
          name={['companyAddress', 'city']}
          label="City"
          rules={[{ required: true, message: 'Please input your company city!' }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name={['companyAddress', 'postal']}
          label="Postal / Zip Code"
          rules={[{ required: true, message: 'Please input your company postal or zip code!' }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name={['companyAddress', 'province']}
          label="Province / State"
          rules={[{ required: true, message: 'Please input your company province or state!' }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name={['companyAddress', 'country']}
          label="Country"
          rules={[{ required: true, message: 'Please select your company country!' }]}
        >
          <Select showSearch>
            {/* Populate with your list of countries */}
            <Select.Option value="USA">USA</Select.Option>
            <Select.Option value="Canada">Canada</Select.Option>
            {/* Add more options as needed */}
          </Select>
        </Form.Item>
  
        <Button type="primary" htmlType="submit">
          Save Company Information
        </Button>
      </Form>
    );
  
      default:
        return null;
    }
  };    

  return (
    <div className="signup-container">
      <div className="signup-carousel-section">
        <div className="signup-countertop">
          <img src="/assests/dark_mode_velloa_logo.png" alt="Logo" className="signup-logo" />
        </div>
        <Carousel autoplay dots={false} autoplaySpeed={8000}>
          <div>
            <img src="/assests/Account-rafiki.png" alt="Slide 1" style={{ width: '100%', height: '500px', objectFit: 'cover' }} />
            <h3>Manage and collect rent with E-transfers</h3>
          </div>
          <div>
            <img src="/assests/Accept tasks-pana.png" alt="Slide 2" style={{ width: '100%', height: '500px', objectFit: 'cover' }} />
            <h3>Managing your property made simple</h3>
          </div>
          <div>
            <img src="/assests/Fill out-pana.png" alt="Slide 3" style={{ width: '100%', height: '500px', objectFit: 'cover' }} />
            <h3>Have all your tenant information in one place</h3>
          </div>
        </Carousel>
      </div>
      <div className="signup-steps-section">
        <Steps current={currentStep} progressDot={true}>
          <Step title="Create Account" />
          <Step title="Verify Email" />
          <Step title="Personal Info" />
          <Step title="Company Info" />
        </Steps>
        <div style={{ marginTop: "24px" }}>
          {renderStepContent(currentStep)}
        </div>
      </div>
    </div>
  );
  };
  
  export default Signup;