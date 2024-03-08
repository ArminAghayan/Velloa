import { useNavigate } from 'react-router-dom'; // Use useNavigate instead of useHistory
import { useAuth } from './AuthContext';
import { Form, Input, Button, Checkbox, Row, Col } from 'antd';
import './loginpage.css'
const LoginPage: React.FC = () => {
  const navigate = useNavigate(); // Create a navigate function
  const { login } = useAuth();

  type LoginValues = {
    email: string;
    password: string;
    remember: boolean;
  };

  const onFinish = async (values: LoginValues) => {
    try {
      await login(values.email, values.password);
      console.log('User logged in successfully');
      // Redirect to the homepage after successful login
      navigate('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
    }
  };


  return (
    <div className="login-container" >
            <div className="login-card">
            <h1 className="login-header">Velloa</h1>
        <p className="welcome-message">Welcome back!</p>

        <Form
          name="basic"
          initialValues={{ remember: true }}
          onFinish={onFinish}
          autoComplete="off"
        >
             <Form.Item>
          <p className="Email">Email:</p>
          </Form.Item>

          <Form.Item
            name="email"
            rules={[{ required: true, message: 'Please input your email!' }]}
          >
            <Input placeholder="Email" />
          </Form.Item>
          <Form.Item>
          <p className="Passwordtext">Password:</p>
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please input your password!' }]}
          >
            <Input.Password placeholder="Password" />
          </Form.Item>

          <Form.Item>
            <Row justify="space-between">
              <Col>
              <Form.Item name="remember" valuePropName="checked" noStyle>
                <Checkbox className="remember-me-checkbox">Remember me</Checkbox>
              </Form.Item>              </Col>
              <Col>
                <a href="/signup" className="forgot-password-link">signup</a>
              </Col>
            </Row>
          </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" style={{ width: '100%' }} className="login-button">
            Log in
          </Button>
        </Form.Item>
      </Form>
    
    </div>
    </div>

  );
};

export default LoginPage;


