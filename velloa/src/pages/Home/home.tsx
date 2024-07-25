import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchUserDetails } from '../../components/redux/authSlice';
import { RootState, AppDispatch } from '../../components/redux/store';
import { Card, Statistic, Row, Col, Typography, List } from 'antd';
import { auth } from '../../firebase-config'; // Import the auth object
import { Column } from '@ant-design/charts';

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

  const fakeMaintenances = [
    { title: 'Leaky Faucet', description: 'Fix leaky faucet in unit 101' },
    { title: 'Broken Window', description: 'Replace broken window in unit 203' },
    { title: 'Clogged Drain', description: 'Unclog drain in unit 305' },
  ];

  const fakeRecentPayments = [
    { title: 'John Doe', description: 'Paid $1200 for rent' },
    { title: 'Jane Smith', description: 'Paid $1400 for rent' },
    { title: 'Sam Johnson', description: 'Paid $1300 for rent' },
  ];

  const fakeRentalApplications = [
    { title: 'Alice Brown', description: 'Applied for unit 102' },
    { title: 'Bob White', description: 'Applied for unit 204' },
    { title: 'Charlie Black', description: 'Applied for unit 306' },
  ];

  const profitLossData = [
    { month: 'January', profit: 1020000, loss: 500000 },
    { month: 'February', profit: 800000, loss: 423400 },
    { month: 'March', profit: 1200000, loss: 300000 },
  ];

  const dataForChart = profitLossData.flatMap(({ month, profit, loss }) => [
    { month, type: 'Profit', value: profit },
    { month, type: 'Loss', value: loss },
  ]);

  const config = {
    data: dataForChart,
    isGroup: true,
    xField: 'month',
    yField: 'value',
    seriesField: 'type',
    groupField: 'type',
    height: 225, // Set the maximum height of the chart
    label: {
      layout: [
        { type: 'interval-adjust-position' },
        { type: 'interval-hide-overlap' },
        { type: 'adjust-color' },
      ],
    },
  };

  return (
    <div style={{ padding: '64px 36px' }}>
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
            <Statistic title="Pending Applications" value={39} precision={0} />
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
            <List
              itemLayout="horizontal"
              dataSource={fakeMaintenances}
              renderItem={item => (
                <List.Item>
                  <List.Item.Meta
                    title={item.title}
                    description={item.description}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col span={12}>
        <Card className="homepagecards" title="Profit & Loss" style={{ maxHeight: '325px' }}>
          <Column {...config} />
        </Card>

        </Col>
      </Row>
      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={12}>
          <Card title="Recent Payments">
            <List
              itemLayout="horizontal"
              dataSource={fakeRecentPayments}
              renderItem={item => (
                <List.Item>
                  <List.Item.Meta
                    title={item.title}
                    description={item.description}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Rental Applications">
            <List
              itemLayout="horizontal"
              dataSource={fakeRentalApplications}
              renderItem={item => (
                <List.Item>
                  <List.Item.Meta
                    title={item.title}
                    description={item.description}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Homepage;
