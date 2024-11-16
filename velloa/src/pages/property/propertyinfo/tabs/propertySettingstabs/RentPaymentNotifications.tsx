import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { 
  Card, 
  Switch, 
  Input, 
  Select, 
  Typography, 
  Form,
  Space,
  Divider,
  notification
} from 'antd';
import './RentPaymentNotifications.css';
import { collection, getDocs, query, where, getDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '../../../../../firebase-config'; // adjust path as needed
const { Title } = Typography;

interface RentPaymentNotificationsProps {
  propertyId: string;
}

export interface RentPaymentNotificationsRef {
  handleSave: () => Promise<boolean>;
}

const RentPaymentNotifications = forwardRef<RentPaymentNotificationsRef, RentPaymentNotificationsProps>(
  ({ propertyId }, ref) => {
    const [form] = Form.useForm();

    // State for toggles
    const [sendRentReminder, setSendRentReminder] = useState(false);
    const [skipIfPaid, setSkipIfPaid] = useState(false);
    const [sendOverdueNotifications, setSendOverdueNotifications] = useState(false);
    const [postChargesBeforeDue, setPostChargesBeforeDue] = useState(false);
    const [sendPostingNotification, setSendPostingNotification] = useState(false);
    const [attachStatement, setAttachStatement] = useState(false);
    const [attachInvoice, setAttachInvoice] = useState(false);
    const [sendPaymentConfirmation, setSendPaymentConfirmation] = useState(false);
    const [notifyUsers, setNotifyUsers] = useState(false);
    const [sendReturnedNotification, setSendReturnedNotification] = useState(false);
    const [notifyUsersReturned, setNotifyUsersReturned] = useState(false);
    const [enableTextMessages, setEnableTextMessages] = useState(false);
    const [companyUsers, setCompanyUsers] = useState<Array<{id: string, name: string}>>([]);
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [selectedUsersReturned, setSelectedUsersReturned] = useState<string[]>([]);

    useEffect(() => {
      const fetchCompanyUsers = async () => {
        try {
          // Get company ID from property ID (same pattern as notes)
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

          // Query users collection for the company's users
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
          notification.error({
            message: 'Error',
            description: 'Failed to fetch company users.',
            placement: 'topRight'
          });
        }
      };

      if (propertyId) {
        fetchCompanyUsers();
      }
    }, [propertyId]);

    const handleSave = async () => {
      try {
        const notificationSettings = {
          rentReminder: {
            enabled: sendRentReminder,
            daysBeforeDue: form.getFieldValue('daysBeforeDue') || 5,
            skipIfPaid,
          },
          rentOverdue: {
            enabled: sendOverdueNotifications,
            daysAfterDue: form.getFieldValue('daysAfterDue') || 1,
            frequency: form.getFieldValue('frequency') || 'daily',
          },
          rentPosted: {
            postBeforeDue: postChargesBeforeDue,
            sendNotification: sendPostingNotification,
            attachStatement,
            attachInvoice,
          },
          paymentReceived: {
            sendConfirmation: sendPaymentConfirmation,
            notifyUsers,
            selectedUsers,
          },
          paymentReturned: {
            sendNotification: sendReturnedNotification,
            notifyUsers: notifyUsersReturned,
            selectedUsers: selectedUsersReturned,
          },
          textMessages: {
            enabled: enableTextMessages,
          },
          updatedAt: new Date(),
        };

        await setDoc(
          doc(db, 'properties', propertyId, 'propertySettings', 'notifications'), 
          notificationSettings,
          { merge: true }
        );

        notification.success({
          message: 'Success',
          description: 'Notification settings saved successfully.',
          placement: 'topRight',
        });
        return true;
      } catch (error) {
        console.error('Error saving notification settings:', error);
        notification.error({
          message: 'Error',
          description: 'Failed to save notification settings.',
          placement: 'topRight',
        });
        return false;
      }
    };

    useImperativeHandle(ref, () => ({
      handleSave,
    }));
    
    useEffect(() => {
      const loadSettings = async () => {
        try {
          const settingsDoc = await getDoc(
            doc(db, 'properties', propertyId, 'propertySettings', 'notifications')
          );
          
          if (settingsDoc.exists()) {
            const data = settingsDoc.data();
            
            // Update all state variables with saved settings
            setSendRentReminder(data.rentReminder?.enabled ?? false);
            setSkipIfPaid(data.rentReminder?.skipIfPaid ?? false);
            setSendOverdueNotifications(data.rentOverdue?.enabled ?? false);
            setPostChargesBeforeDue(data.rentPosted?.postBeforeDue ?? false);
            setSendPostingNotification(data.rentPosted?.sendNotification ?? false);
            setAttachStatement(data.rentPosted?.attachStatement ?? false);
            setAttachInvoice(data.rentPosted?.attachInvoice ?? false);
            setSendPaymentConfirmation(data.paymentReceived?.sendConfirmation ?? false);
            setNotifyUsers(data.paymentReceived?.notifyUsers ?? false);
            setSelectedUsers(data.paymentReceived?.selectedUsers ?? []);
            setSendReturnedNotification(data.paymentReturned?.sendNotification ?? false);
            setNotifyUsersReturned(data.paymentReturned?.notifyUsers ?? false);
            setSelectedUsersReturned(data.paymentReturned?.selectedUsers ?? []);
            setEnableTextMessages(data.textMessages?.enabled ?? false);

            // Set form values
            form.setFieldsValue({
              daysBeforeDue: data.rentReminder?.daysBeforeDue ?? 5,
              daysAfterDue: data.rentOverdue?.daysAfterDue ?? 1,
              frequency: data.rentOverdue?.frequency ?? 'daily',
            });
          }
        } catch (error) {
          console.error('Error loading notification settings:', error);
        }
      };

      if (propertyId) {
        loadSettings();
      }
    }, [propertyId, form]);

    return (
      <Card bordered={false} className="RentPaymentNotifications">
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Rent Reminder Section */}
          <div>
            <Title level={5}>Rent Reminder</Title>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Switch 
                  checked={sendRentReminder}
                  onChange={setSendRentReminder}
                />
                <span style={{ marginLeft: 8 }}>
                  Send a notification to remind the tenant about an upcoming rent
                </span>
              </div>
              
              {sendRentReminder && (
                <Form.Item label="Days before rent is due">
                  <Input 
                    type="number"
                    style={{ width: 200 }}
                    defaultValue={5}
                  />
                </Form.Item>
              )}

              <div>
                <Switch 
                  checked={skipIfPaid}
                  onChange={setSkipIfPaid}
                />
                <span style={{ marginLeft: 8 }}>
                  Do not send a notification if the tenant has already paid
                </span>
              </div>
            </Space>
          </div>

          <Divider />

          {/* Rent Overdue Section */}
          <div>
            <Title level={5}>Rent Overdue</Title>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Switch 
                  checked={sendOverdueNotifications}
                  onChange={setSendOverdueNotifications}
                />
                <span style={{ marginLeft: 8 }}>
                  Send recurring notifications to remind the tenant about overdue rent
                </span>
              </div>

              {sendOverdueNotifications && (
                <Space direction="horizontal" size="large">
                  <Form.Item label="Days after rent is due">
                    <Input 
                      type="number"
                      style={{ width: 200 }}
                      defaultValue={1}
                    />
                  </Form.Item>

                  <Form.Item label="Frequency">
                    <Select
                      style={{ width: 200 }}
                      defaultValue="daily"
                      options={[
                        { value: 'daily', label: 'Daily' },
                        { value: 'weekly', label: 'Weekly' },
                        { value: 'biweekly', label: 'Bi-weekly' },
                        { value: 'monthly', label: 'Monthly' },
                      ]}
                    />
                  </Form.Item>
                </Space>
              )}
            </Space>
          </div>

          <Divider />

          {/* Rent Posted Section */}
          <div>
            <Title level={5}>Rent Posted</Title>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Switch 
                  checked={postChargesBeforeDue}
                  onChange={setPostChargesBeforeDue}
                />
                <span style={{ marginLeft: 8 }}>
                  Post charges to the account before the due date
                </span>
              </div>

              <div>
                <Switch 
                  checked={sendPostingNotification}
                  onChange={setSendPostingNotification}
                />
                <span style={{ marginLeft: 8 }}>
                  Send a notification to the tenant when rent is posted
                </span>
              </div>

              <div>
                <Switch 
                  checked={attachStatement}
                  onChange={setAttachStatement}
                />
                <span style={{ marginLeft: 8 }}>
                  Attach an account statement to the email
                </span>
              </div>

              <div>
                <Switch 
                  checked={attachInvoice}
                  onChange={setAttachInvoice}
                />
                <span style={{ marginLeft: 8 }}>
                  Attach an invoice to the email
                </span>
              </div>
            </Space>
          </div>

          <Divider />

          {/* Payment Received Section */}
          <div>
            <Title level={5}>Payment Received</Title>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Switch 
                  checked={sendPaymentConfirmation}
                  onChange={setSendPaymentConfirmation}
                />
                <span style={{ marginLeft: 8 }}>
                  Send a notification to the tenant when they make an online payment
                </span>
              </div>

              <div>
                <Switch 
                  checked={notifyUsers}
                  onChange={setNotifyUsers}
                />
                <span style={{ marginLeft: 8 }}>
                  Send a notification to Velloa users when a tenant makes an online payment
                </span>
              </div>

              {notifyUsers && (
                <Form.Item 
                  label="Select users to notify" 
                  style={{ marginTop: 16 }}
                >
                  <Select
                    mode="multiple"
                    style={{width: '170px' }}
                    placeholder="Search users"
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
          </div>

          <Divider />

          {/* Payment Returned Section */}
          <div>
            <Title level={5}>Payment Returned</Title>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Switch 
                  checked={sendReturnedNotification}
                  onChange={setSendReturnedNotification}
                />
                <span style={{ marginLeft: 8 }}>
                  Send a notification to the tenant when an online payment is returned
                </span>
              </div>

              <div>
                <Switch 
                  checked={notifyUsersReturned}
                  onChange={setNotifyUsersReturned}
                />
                <span style={{ marginLeft: 8 }}>
                  Send a notification to Velloa users when an online payment is returned
                </span>
              </div>

              {notifyUsersReturned && (
                <Form.Item 
                  label="Select users to notify" 
                  style={{ marginTop: 16 }}
                >
                  <Select
                    mode="multiple"
                    style={{width: '170px' }}
                    placeholder="Search users"
                    value={selectedUsersReturned}
                    onChange={setSelectedUsersReturned}
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
          </div>

          <Divider />

          {/* Text Messages Section */}
          <div>
            <Title level={5}>Text Messages</Title>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Switch 
                  checked={enableTextMessages}
                  onChange={setEnableTextMessages}
                />
                <span style={{ marginLeft: 8 }}>
                  Enable text message notifications for tenants
                </span>
              </div>
            </Space>
          </div>
        </Space>
      </Card>
    );
  }
);

export default RentPaymentNotifications; 