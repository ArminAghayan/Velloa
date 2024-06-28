import React, { useState } from 'react';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import { Form, Input, Button, Typography, message, Carousel } from 'antd';
import './forgotpassword.css';

const { Title, Paragraph } = Typography;

const ForgotPassword: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();


  const onFinish = async (values: { email: string }) => {
    setLoading(true);
    try {
      const auth = getAuth();
      await sendPasswordResetEmail(auth, values.email);
      message.success('Password reset email sent. Please check your inbox.');
      form.resetFields();
    } catch (error) {
      console.error('Error sending password reset email:', error);
      message.error('Failed to send password reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgotpassword-container">
      <div className="forgotpassword-carousel-section">
        <div className="forgotpassword-countertop">
          <img src="/assets/dark_mode_velloa_logo.png" alt="Logo" className="forgotpassword-logo" />
        </div>
        <Carousel autoplay dots={false} autoplaySpeed={8000}>
          <div>
            <img src="/assets/Account-rafiki.png" alt="Slide 1" style={{ width: '100%', height: '500px', objectFit: 'cover' }} />
            <h3>Manage and collect rent with E-transfers</h3>
          </div>
          <div>
            <img src="/assets/Accept tasks-pana.png" alt="Slide 2" style={{ width: '100%', height: '500px', objectFit: 'cover' }} />
            <h3> Manging your property made simple </h3>
          </div>
          <div>
            <img src="/assets/Fill out-pana.png" alt="Slide 3" style={{ width: '100%', height: '500px', objectFit: 'cover' }} />
            <h3> Have all your tenent infomation in one place </h3>
          </div>
        </Carousel>
      </div>
      <div className="forgotpassword-section">
        <div className="forgotpassword-card">
          <Title>Forgot Password</Title>
          <Paragraph className='forgotpassword-heading'>Enter your email address to reset your password.</Paragraph>
          <Form form={form} name="basic" initialValues={{ remember: true }} onFinish={onFinish} autoComplete="off">
            <Form.Item name="email" rules={[{ required: true, message: 'Please input your email!' }]}>
              <Input className='forgotpassword-input' placeholder="Email" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" className='forgotpassword-button' loading={loading} >
                Reset Password
              </Button>
            </Form.Item>
          </Form>
          <Paragraph className="create-account-text">
            New on our platform? <a href="/signup">Create an account</a>
          </Paragraph>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;