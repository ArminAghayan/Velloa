import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { login } from '../../components/redux/authSlice';
import { Form, Input, Button, Checkbox, Typography, message, Carousel } from 'antd';
import './loginpage.css';
import { AppDispatch, RootState } from '../../components/redux/store';

const { Title, Paragraph } = Typography;

const LoginPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading } = useSelector((state: RootState) => state.auth);
  const [shakeButton, setShakeButton] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [form] = Form.useForm();

  type LoginValues = {
    email: string;
    password: string;
  };

  const onFinish = async (values: LoginValues) => {
    setShakeButton(false);

    try {
      console.log('Attempting to log in with:', values, 'Remember Me:', rememberMe);
      await dispatch(login({ email: values.email, password: values.password, rememberMe })).unwrap();
      console.log('Login successful');
      message.success('Login successful!');
      
      // Force a page reload to ensure the app re-renders with the new auth state
      window.location.href = '/home';
    } catch (error) {
      console.error('Login failed:', error);
      setShakeButton(true);
      form.resetFields(); // Reset form fields
      message.error('Incorrect login information. Please try again.');
    }
  };

  const onFinishFailed = (errorInfo: any) => {
    console.error('Failed:', errorInfo);
    message.error('Please check the form fields for errors.');
  };

  return (
    <div className="login-container">
      <div className="carousel-section">
        <div className="countertop">
          <img src="/assets/dark_mode_velloa_logo.png" alt="Logo" className="logo" />
        </div>
        <Carousel autoplay dots={false} autoplaySpeed={8000}>
          <div>
            <img
              src="/assets/Account-rafiki.png"
              alt="Slide 1"
              style={{ width: '100%', height: '500px', objectFit: 'cover' }}
            />
            <h3>Manage and collect rent with E-transfers</h3>
          </div>
          <div>
            <img
              src="/assets/Accept tasks-pana.png"
              alt="Slide 2"
              style={{ width: '100%', height: '500px', objectFit: 'cover' }}
            />
            <h3>Managing your property made simple</h3>
          </div>
          <div>
            <img
              src="/assets/Fill out-pana.png"
              alt="Slide 3"
              style={{ width: '100%', height: '500px', objectFit: 'cover' }}
            />
            <h3>Have all your tenant information in one place</h3>
          </div>
        </Carousel>
      </div>
      <div className="login-section">
        <div className="login-card">
          <Title>Welcome</Title>
          <Paragraph className="heading">
            Please sign in to your account to manage your property!
          </Paragraph>
          <Form
            form={form}
            name="login"
            onFinish={onFinish}
            onFinishFailed={onFinishFailed}
            autoComplete="off"
            layout="vertical"
          >
            <Form.Item
              name="email"
              rules={[
                { required: true, message: 'Please input your email!' },
                { type: 'email', message: 'Please enter a valid email!' },
              ]}
            >
              <Input placeholder="Email" />
            </Form.Item>
            <Form.Item
              name="password"
              rules={[{ required: true, message: 'Please input your password!' }]}
            >
              <Input.Password placeholder="Password" />
            </Form.Item>
            <Form.Item>
              <Checkbox
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ marginRight: '10px' }}
              >
                Remember Me
              </Checkbox>
              <a href="/forgot-password" className="forgot-password-link">
                Forgot Password?
              </a>
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                className={`login-button ${shakeButton ? 'shake' : ''}`}
                loading={isLoading}
                block
              >
                Login
              </Button>
            </Form.Item>
          </Form>
          <Paragraph className="create-account-text">
            New to our platform? <a href="/signup">Create an account</a>
          </Paragraph>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
