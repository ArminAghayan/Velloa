import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { Form, Input, Button, Checkbox, Row, Col, Typography, message, Carousel } from 'antd';
import './loginpage.css';

const { Title, Paragraph, Text } = Typography;

type ContentStyleType = {
  height: string;
  color: string;
  lineHeight: string;
  textAlign: 'left' | 'right' | 'center' | 'justify' | 'start';
  display: 'flex';
  justifyContent: 'center';
  alignItems: 'center';
};

const contentStyle: ContentStyleType = {
  height: '100%',
  color: '#fff',
  lineHeight: '400px',
  textAlign: 'center',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
};

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [shakeButton, setShakeButton] = useState(false);
  const [form] = Form.useForm();

  type LoginValues = {
    email: string;
    password: string;
    remember: boolean;
  };

  const onFinish = async (values: LoginValues) => {
    setLoading(true);
    setShakeButton(false);

    try {
      // Simulate a minimum 5-second delay
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Perform login logic
      await login(values.email, values.password);
      console.log('User logged in successfully');
      navigate('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
      setShakeButton(true);
      form.resetFields(); // Reset form fields
      message.error('Incorrect login information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="carousel-container">
        <Carousel autoplay>
          <div style={contentStyle}>
            <img
              src="/assests/Account-rafiki.png"
              alt="Manging your property made simple!"
              style={{ maxHeight: '70%', maxWidth: '70%' }}
            />
            <div>
            <Title level={2} style={{ color: 'white' }}>
            Manage and collect rent with E-transfers
           </Title>
            </div>
          </div>
          <div style={contentStyle}>
            <img
              src="/assests/Fill out-pana.png"
              alt="Have all your tenent infomation in one place!"
              style={{ maxHeight: '70%', maxWidth: '70%' }}
            />
            <div >
            <Title level={2} style={{ color: 'white' }}>
              Have all your tenent infomation in one place
              </Title>
           </div>
          </div>
          <div style={contentStyle}>
            <img
              src="/assests/Accept tasks-pana.png"
              alt="Manage and collect rent with E-transfers!"
              style={{ maxHeight: '70%', maxWidth: '70%' }}
            />
            <div >
            <Title level={2} style={{ color: 'white' }}>
            Manging your property made simple

            </Title>
            </div>
          </div>
        </Carousel>
      </div>
      <div className="login-card">
        <div className="login-header">
          <img src="/assests/light_mode_velloa_logo.png" alt="Icon" className="login-icon" />
          <Title level={2} className="login-title">
            Velloa
          </Title>
        </div>
        <Paragraph className="welcome-message">Please sign-in to your account to mangae your property!</Paragraph>
        <Form name="basic" initialValues={{ remember: true }} onFinish={onFinish} autoComplete="off">
          <Form.Item name="email" rules={[{ required: true, message: 'Please input your email!' }]}>
            <Input placeholder="Email" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: 'Please input your password!' }]}>
            <Input.Password placeholder="Password" />
          </Form.Item>
          <Form.Item>
            <Row justify="space-between">
              <Col>
                <Form.Item name="remember" valuePropName="checked" noStyle>
                  <Checkbox className="remember-me-checkbox">Remember Me</Checkbox>
                </Form.Item>
              </Col>
              <Col>
                <Text className="forgot-password-link">
                  <a href="#">Forgot Password?</a>
                </Text>
              </Col>
            </Row>
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              className={`login-button ${shakeButton ? 'shake' : ''}`}
              loading={loading}
            >
              Login
            </Button>
          </Form.Item>
        </Form>
        <Paragraph className="create-account-text">
          New on our platform? <a href="/signup">Create an account</a>
        </Paragraph>
      </div>
    </div>
  );
};

export default LoginPage;