import React, { useState, useEffect } from 'react';
import { Form, Switch, Button, Typography, Select } from 'antd';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../../../firebase-config';
import './ApplicantInfoSettings.css';
const { Title, Text } = Typography;

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  companyuid: string;  // Changed from companyId
}

const NotificationSettings: React.FC = () => {
  const [enableNotifications, setEnableNotifications] = useState(true);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyuid, setCompanyuid] = useState<string | null>(null);  // Changed from companyId

  // First, fetch the company ID using the user's UID
  useEffect(() => {
    const fetchCompanyId = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser?.uid) {
          console.error('No user UID found');
          return;
        }

        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          setCompanyuid(userData.companyuid);  // Changed from companyId
        } else {
          console.error('User document not found');
        }
      } catch (error) {
        console.error('Error fetching company ID:', error);
      }
    };

    fetchCompanyId();
  }, []);

  // Then, fetch users once we have the company ID
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        if (!companyuid) {  // Changed from companyId
          return;
        }

        const usersRef = collection(db, 'users');
        const q = query(
          usersRef,
          where('companyuid', '==', companyuid)  // Changed from companyId
        );

        const querySnapshot = await getDocs(q);
        const fetchedUsers: User[] = [];
        
        querySnapshot.forEach((doc) => {
          const userData = doc.data() as User;
          fetchedUsers.push({
            id: doc.id,
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email,
            companyuid: userData.companyuid  // Changed from companyId
          });
        });

        setUsers(fetchedUsers);
        
        // If there are users and no selection, select the first user
        if (fetchedUsers.length > 0 && !selectedUser) {
          setSelectedUser(fetchedUsers[0].id);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [companyuid]);  // Changed from companyId

  // Transform users data for Select options
  const userOptions = users.map(user => ({
    value: user.id,
    label: `${user.firstName} ${user.lastName}`
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ maxWidth: 800, flex: 1, overflowY: 'auto', padding: '24px 12px 24px 24px' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <Title level={2} style={{ margin: 0 }}>NOTIFICATIONS</Title>
          <Switch 
            checked={enableNotifications}
            onChange={setEnableNotifications}
            className="switch-dark"
            checkedChildren=""
            unCheckedChildren=""
          />
        </div>
        
        <Text style={{ 
          fontSize: '16px', 
          marginBottom: '32px', 
          display: 'block', 
          color: '#666',
          lineHeight: '1.5'
        }}>
          DoorLoop can automatically notify you by email when a new rental application is submitted
        </Text>

        {enableNotifications && (
          <Form layout="vertical">
            <div style={{ marginBottom: '24px' }}>
              <Text strong style={{ display: 'block', marginBottom: '8px' }}>
                Select users
              </Text>
              <Select
                value={selectedUser}
                onChange={setSelectedUser}
                style={{ width: '100%' }}
                options={userOptions}
                placeholder="Select users to notify"
                loading={loading}
                disabled={loading}
              />
            </div>
          </Form>
        )}
      </div>

      <div style={{ 
        borderTop: '1px solid #f0f0f0',
        padding: '16px 24px',
        backgroundColor: '#fff',
        display: 'flex',
        justifyContent: 'flex-end',
        gap: 12
      }}>
        <Button>Cancel</Button>
        <Button type="primary">Save</Button>
      </div>
    </div>
  );
};

export default NotificationSettings;
