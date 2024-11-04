import React, { useState, useEffect } from 'react';
import { Form, Switch, Button, Typography, Select, message } from 'antd';
import { collection, query, where, getDocs, doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
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
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      const currentUser = auth.currentUser;
      
      if (!currentUser?.uid) {
        message.error('No user found');
        return;
      }

      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      const companyId = userDoc.data()?.companyuid;

      if (!companyId) {
        message.error('No company found');
        return;
      }

      const notificationFields = {
        settings: {
          enableNotifications,
          notifiedUserId: selectedUser,
          lastUpdated: Timestamp.now()
        }
      };

      const settingsRef = doc(db, `companies/${companyId}/settings/rentalApplication`);
      await setDoc(settingsRef, { notifications: notificationFields }, { merge: true });

      setHasUnsavedChanges(false);
      message.success('Notification settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      message.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser?.uid) return;

      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      const companyId = userDoc.data()?.companyuid;
      
      if (!companyId) return;

      // First fetch users
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('companyuid', '==', companyId));
      const querySnapshot = await getDocs(q);
      const fetchedUsers: User[] = [];
      
      querySnapshot.forEach((doc) => {
        const userData = doc.data() as User;
        fetchedUsers.push({
          id: doc.id,
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          companyuid: userData.companyuid
        });
      });

      setUsers(fetchedUsers);

      // Then fetch settings
      const settingsRef = doc(db, `companies/${companyId}/settings/rentalApplication`);
      const settingsDoc = await getDoc(settingsRef);

      if (settingsDoc.exists()) {
        const data = settingsDoc.data();
        if (data.notifications?.settings) {
          const { enableNotifications: savedEnable, notifiedUserId } = data.notifications.settings;
          setEnableNotifications(savedEnable ?? true);
          setSelectedUser(notifiedUserId || (fetchedUsers[0]?.id || ''));
          setHasUnsavedChanges(false);
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

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
          <Title level={2} style={{ margin: 0 }}>Notifications</Title>
          <Switch 
            checked={enableNotifications}
            onChange={(checked) => {
              setEnableNotifications(checked);
              setHasUnsavedChanges(true);
            }}
            className="switch-dark"
            checkedChildren="On"
            unCheckedChildren="Off"
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
                onChange={(value) => {
                  setSelectedUser(value);
                  setHasUnsavedChanges(true);
                }}
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
        <Button 
          onClick={fetchSettings}
          disabled={!hasUnsavedChanges}
        >
          Cancel
        </Button>
        <Button 
          type="primary"
          onClick={handleSave}
          loading={saving}
          disabled={!hasUnsavedChanges}
        >
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </div>
  );
};

export default NotificationSettings;
