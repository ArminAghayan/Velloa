import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../firebase-config';
import { doc, getDoc } from 'firebase/firestore';
import { Card, Statistic, Row, Col, Divider, Typography,List } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';

const { Title } = Typography;

interface User {
  id: string;
  firstName: string;
  lastName: string;
  // Add other relevant fields
}

const TopCards: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      if (auth.currentUser) {
        try {
          const userDocRef = doc(db, 'users', auth.currentUser.uid);
          const userDocSnapshot = await getDoc(userDocRef);

          if (userDocSnapshot.exists()) {
            const userData = userDocSnapshot.data();
            setUser({
              id: userDocSnapshot.id,
              firstName: userData.firstName,
              lastName: userData.lastName,
              // Add other relevant fields
            });
          } else {
            console.error('User document not found.');
            // Optionally, you can redirect the user to the signup page or show an error message
            navigate('/signup');
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      } else {
        console.error('No user logged in.');
        // Redirect the user to the login page
        navigate('/login');
      }
    };

    fetchUserData();
  }, [navigate]);

  return (
    <>
    
        <Title level={1} style={{ padding: '0px 0px' }}>
          <span>Welcome Back!</span>
        </Title>
    
      <Row gutter={16}>
        <Col span={6}>
          <Card className='homepagecards'>
            <Statistic title="Prepaid revenue" value={1000000} precision={0}   valueStyle={{ color: '#3f8600' }}
/>
          </Card>
        </Col>
        <Col span={6}>
          <Card className='homepagecards'>
            <Statistic title="Outstanding revenue" value={410000} precision={0} valueStyle={{ color: '#FF4D4F' }}
/>
          </Card >
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Occupancy rate" value={98} precision={0} />
          </Card>
        </Col>
        <Col span={6}>
          <Card className='homepagecards'>
            <Statistic
              title="Occupancy rate"
              value={78}
              precision={0}
              valueStyle={{ color: '#3f8600'}}
              suffix="%"
            />
          </Card>
        </Col>
      </Row>
      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={12}>
          <Card  className='homepagecards' title='Maintences'>
          <List itemLayout="horizontal">
          </List>
          </Card>
        </Col>
        <Col span={12}>
          <Card className='homepagecards' title='Profit & Loss'>
          <List itemLayout="horizontal">
          </List>
          </Card>
        </Col>
        
      </Row>
      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={12}>
          <Card title='Recent Payments'>
          <List itemLayout="horizontal">
          </List>
          </Card>
        </Col>
        <Col span={12}>
          <Card title='Rental Applications'>
          <List itemLayout="horizontal">
          </List>
          </Card>
        </Col>
        
      </Row>
    </>
  );
};

export default TopCards;