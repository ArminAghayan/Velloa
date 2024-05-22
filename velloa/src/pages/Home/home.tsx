import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchUserDetails } from '../../components/redux/authSlice';
import { RootState, AppDispatch } from '../../components/redux/store';
import { Card, Statistic, Row, Col, Typography, List } from 'antd';
import { auth } from '../../firebase-config'; // Import the auth object

const { Title } = Typography;

const Homepage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.auth.userData);

  useEffect(() => {
    const fetchUser = async () => {
      if (!user) {
        const currentUser = auth.currentUser;
        if (currentUser) {
          await dispatch(fetchUserDetails(currentUser.uid));
        } else {
          console.error('No user logged in.');
          navigate('/login');
        }
      }
    };

    fetchUser();
  }, [user, dispatch, navigate]);

  return (
    <div style={{ padding: '24px 36px' }}>
      <Title level={1}>
        <span>Welcome Back, {user?.firstName} {user?.lastName}!</span>
      </Title>
      <Row gutter={16}>
        <Col span={6}>
          <Card className="homepagecards">
            <Statistic title="Prepaid revenue" value={1000000} precision={0} valueStyle={{ color: '#3f8600' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="homepagecards">
            <Statistic title="Outstanding revenue" value={410000} precision={0} valueStyle={{ color: '#FF4D4F' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Occupancy rate" value={98} precision={0} />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="homepagecards">
            <Statistic title="Occupancy rate" value={78} precision={0} valueStyle={{ color: '#3f8600' }} suffix="%" />
          </Card>
        </Col>
      </Row>
      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={12}>
          <Card className="homepagecards" title="Maintenances">
            <List itemLayout="horizontal"></List>
          </Card>
        </Col>
        <Col span={12}>
          <Card className="homepagecards" title="Profit & Loss">
            <List itemLayout="horizontal"></List>
          </Card>
        </Col>
      </Row>
      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={12}>
          <Card title="Recent Payments">
            <List itemLayout="horizontal"></List>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Rental Applications">
            <List itemLayout="horizontal"></List>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Homepage;