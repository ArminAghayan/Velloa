import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { 
  Switch, 
  Select, 
  Typography,
  Space,
  notification,
  Form
} from 'antd';
import { collection, getDocs, query, where, getDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '../../../../../firebase-config';
import './TenantRequestSettings.css';
import { InfoCircleOutlined } from '@ant-design/icons';

interface TenantRequestSettingsProps {
  propertyId: string;
}

export interface TenantRequestSettingsRef {
  handleSave: () => Promise<boolean>;
}

const TenantRequestSettings = forwardRef<TenantRequestSettingsRef, TenantRequestSettingsProps>(
  ({ propertyId }, ref) => {
    // State for toggles
    const [notifyTenant, setNotifyTenant] = useState(false);
    const [notifyAssignedUsers, setNotifyAssignedUsers] = useState(false);
    const [autoAssignUsers, setAutoAssignUsers] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [companyUsers, setCompanyUsers] = useState<Array<{id: string, name: string}>>([]);

    // Fetch company users
    useEffect(() => {
      const fetchCompanyUsers = async () => {
        try {
          const propertyDoc = await getDoc(doc(db, 'properties', propertyId));
          if (!propertyDoc.exists()) {
            console.error('Property not found');
            return;
          }

          const companyId = propertyDoc.data().companyuid;
          if (!companyId) {
            console.error('Company ID not found');
            return;
          }

          const usersRef = collection(db, 'users');
          const q = query(usersRef, where('companyuid', '==', companyId));
          const querySnapshot = await getDocs(q);
          
          const users = querySnapshot.docs.map(doc => {
            const userData = doc.data();
            return {
              id: doc.id,
              name: `${userData.firstName} ${userData.lastName}`
            };
          });
          
          setCompanyUsers(users);
        } catch (error) {
          console.error('Error fetching company users:', error);
        }
      };

      if (propertyId) {
        fetchCompanyUsers();
      }
    }, [propertyId]);

    // Load existing settings
    useEffect(() => {
      const loadSettings = async () => {
        try {
          const settingsDoc = await getDoc(
            doc(db, 'properties', propertyId, 'propertySettings', 'tenantRequests')
          );
          
          if (settingsDoc.exists()) {
            const data = settingsDoc.data();
            setNotifyTenant(data.notifyTenant ?? false);
            setNotifyAssignedUsers(data.notifyAssignedUsers ?? false);
            setAutoAssignUsers(data.autoAssignUsers ?? false);
            setSelectedUsers(data.selectedUsers ?? []);
          }
        } catch (error) {
          console.error('Error loading tenant request settings:', error);
        }
      };

      if (propertyId) {
        loadSettings();
      }
    }, [propertyId]);

    // Save settings
    const handleSave = async () => {
      try {
        const settings = {
          notifyTenant,
          notifyAssignedUsers,
          autoAssignUsers,
          selectedUsers,
          updatedAt: new Date()
        };

        await setDoc(
          doc(db, 'properties', propertyId, 'propertySettings', 'tenantRequests'),
          settings,
          { merge: true }
        );

        notification.success({
          message: 'Success',
          description: 'Tenant request settings saved successfully.',
          placement: 'topRight'
        });
        return true;
      } catch (error) {
        console.error('Error saving tenant request settings:', error);
        notification.error({
          message: 'Error',
          description: 'Failed to save tenant request settings.',
          placement: 'topRight'
        });
        return false;
      }
    };

    useImperativeHandle(ref, () => ({
      handleSave
    }));

    return (
      <div className="tenant-request-settings">
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Typography.Link
              href="https://velloaapp.com/property-ownership"
              target="_blank"
              rel="noopener noreferrer"
              className="learn-more-link"
              style={{ color: '#666' }}
            >
            <InfoCircleOutlined />
              Learn about tenant requests
            </Typography.Link>          
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div className="setting-item">
              <Switch 
                checked={notifyTenant}
                onChange={setNotifyTenant}
                style={{ marginRight: '24px' }}
              />
              <span>
                Automatically notify the tenant once a tenant request is received
              </span> 
            </div>

            <div className="setting-item">
              <Switch 
                checked={notifyAssignedUsers}
                onChange={setNotifyAssignedUsers}
              />
              <span>
                Automatically notify assigned users when a tenant request is received
              </span>
            </div>

            <div className="setting-item">
              <Switch 
                checked={autoAssignUsers}
                onChange={setAutoAssignUsers}
              />
              <span>
                Automatically assign users when a tenant request is received
              </span>
            </div>

            {autoAssignUsers && (
              <Form.Item 
                label="Select users to assign" 
                style={{ marginTop: 16 }}
              >
              <Select
                mode="multiple"
                style={{ width: '170px' }}
                placeholder="Select users"
                value={selectedUsers}
                onChange={setSelectedUsers}
                options={companyUsers.map(user => ({
                  value: user.id,
                  label: user.name
                }))}
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
              />
              </Form.Item>
            )}
          </Space>
        </Space>
      </div>
    );
  }
);

export default TenantRequestSettings;
