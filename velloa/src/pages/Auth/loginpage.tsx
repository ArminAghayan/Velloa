import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { login } from '../../components/redux/authSlice';
import { Form, Input, Button, Checkbox, Typography, message, Carousel } from 'antd';
import './loginpage.css';
import { AppDispatch, RootState } from '../../components/redux/store';

const { Title, Paragraph } = Typography;

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);
  const [shakeButton, setShakeButton] = useState(false);
  const [form] = Form.useForm();

  type LoginValues = {
    email: string;
    password: string;
    remember: boolean;
  };

  const onFinish = async (values: LoginValues) => {
    setShakeButton(false);

    try {
      const result = await dispatch(login({ email: values.email, password: values.password })).unwrap();
      console.log('User logged in successfully:', result);
      navigate('/home');
    } catch (error) {
      console.error('Login failed:', error);
      setShakeButton(true);
      form.resetFields(); // Reset form fields
      message.error('Incorrect login information. Please try again.');
    }
  };

  return (
    <div className="login-container">
      <div className="carousel-section">
        <div className="countertop">
          <img src="/assests/dark_mode_velloa_logo.png" alt="Logo" className="logo" />
        </div>
        <Carousel autoplay dots={false} autoplaySpeed={8000}>
          <div>
            <img
              src="/assests/Account-rafiki.png"
              alt="Slide 1"
              style={{ width: '100%', height: '500px', objectFit: 'cover' }}
            />
            <h3>Manage and collect rent with E-transfers</h3>
          </div>
          <div>
            <img
              src="/assests/Accept tasks-pana.png"
              alt="Slide 2"
              style={{ width: '100%', height: '500px', objectFit: 'cover' }}
            />
            <h3> Manging your property made simple </h3>
          </div>
          <div>
            <img
              src="/assests/Fill out-pana.png"
              alt="Slide 3"
              style={{ width: '100%', height: '500px', objectFit: 'cover' }}
            />
            <h3> Have all your tenent infomation in one place </h3>
          </div>
        </Carousel>
      </div>
      <div className="login-section">
        <div className="login-card">
          <Title>Welcome</Title>
          <Paragraph className="heading">Please sign-in to your account to manage your property!</Paragraph>
          <Form form={form} name="basic" initialValues={{ remember: true }} onFinish={onFinish} autoComplete="off">
            <Form.Item
              name="email"
              rules={[{ required: true, message: 'Please input your email!' }]}
            >
              <Input placeholder="Email" />
            </Form.Item>
            <Form.Item
              name="password"
              rules={[{ required: true, message: 'Please input your password!' }]}
            >
              <Input.Password placeholder="Password" />
            </Form.Item>
            <Form.Item name="remember" valuePropName="checked">
              <Checkbox>Remember Me</Checkbox>
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
