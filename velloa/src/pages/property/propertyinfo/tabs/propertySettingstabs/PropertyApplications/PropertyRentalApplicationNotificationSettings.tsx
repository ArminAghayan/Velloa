import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Form, Switch, Typography, Select, notification } from 'antd';
import { collection, query, where, getDocs, doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db, auth } from '../../../../../../firebase-config';
import './PropertyRentalApplicationApplicantInfoSettings.css';

const { Title, Text } = Typography;

// Add User interface
interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  companyuid: string;
}

interface NotificationSettingsProps {
  propertyId: string;
  useCompanySettings: boolean;
  setUseCompanySettings: (value: boolean) => void;
}

export interface NotificationSettingsRef {
  handleSave: () => Promise<boolean>;
}

const NotificationSettings = forwardRef<NotificationSettingsRef, NotificationSettingsProps>(({
  propertyId,
  useCompanySettings,
  setUseCompanySettings
}, ref) => {
  const [enableNotifications, setEnableNotifications] = useState(true);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const handleSave = async (): Promise<boolean> => {
    try {
      setSaving(true);
      const currentUser = auth.currentUser;
      
      if (!currentUser?.uid) {
        notification.error({
          message: 'Error',
          description: 'No user found',
          placement: 'topRight'
        });
        return false;
      }

      const propertySettingsRef = doc(db, `properties/${propertyId}/propertySettings/rentalApplication`);
      await setDoc(propertySettingsRef, {
        type: 'custom',
        settings: {
          notifications: {
            enabled: enableNotifications,
            notifiedUserId: selectedUser,
            lastUpdated: Timestamp.now()
          }
        }
      }, { merge: true });

      setHasUnsavedChanges(false);
      notification.success({
        message: 'Success',
        description: 'Notification settings saved successfully!',
        placement: 'topRight'
      });
      return true;
    } catch (error) {
      console.error('Error saving settings:', error);
      notification.error({
        message: 'Error',
        description: 'Failed to save settings',
        placement: 'topRight'
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  useImperativeHandle(ref, () => ({
    handleSave: async () => {
      try {
        return await handleSave();
      } catch (error) {
        return false;
      }
    }
  }));

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

      // Then fetch property settings
      const propertySettingsRef = doc(db, `properties/${propertyId}/propertySettings/rentalApplication`);
      const settingsDoc = await getDoc(propertySettingsRef);

      if (settingsDoc.exists()) {
        const data = settingsDoc.data();
        if (data.settings?.notifications) {
          const notificationSettings = data.settings.notifications;
          setEnableNotifications(notificationSettings.enabled ?? true);
          setSelectedUser(notificationSettings.notifiedUserId || (fetchedUsers[0]?.id || ''));
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
          Velloa can automatically notify you by email when a new rental application is submitted
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
    </div>
  );
});

NotificationSettings.displayName = 'NotificationSettings';

export default NotificationSettings;
