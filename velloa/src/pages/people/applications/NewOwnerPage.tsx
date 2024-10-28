import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Steps,
  Form,
  Input,
  Button,
  message,
  Row,
  Col,
  Select,
  Upload,
  Divider,
  DatePicker,
  Card,
  Typography,
  Spin,
  Switch,
  Radio,
  Space,
  Alert,
} from 'antd';
import {
  UserOutlined,
  MinusCircleOutlined,
  PlusOutlined,
  SaveOutlined,
  PhoneOutlined,
  HomeOutlined,
  LoadingOutlined,
  ToolOutlined,
  SafetyOutlined,
  MailOutlined,
  PrinterOutlined,
  SendOutlined,
  DollarOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import './NewOwnerPage.css';
import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage';
import { db, auth } from '../../../firebase-config';
import { UploadFile } from 'antd/lib/upload/interface';
import { RcFile } from 'antd/lib/upload';
import dayjs from 'dayjs';

const { Option } = Select;
const { Title, Text } = Typography;

interface NewOwnerPageProps {
  visible: boolean;
  onClose: () => void;
  companyId: string;
  onSubmitSuccess: () => void;
}

interface Property {
  uid: string;
  propertyName: string;
}

const NewOwnerPage: React.FC<NewOwnerPageProps> = ({
  visible,
  onClose,
  companyId,
  onSubmitSuccess,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [avatarUploading, setAvatarUploading] = useState<boolean>(false);
  const [avatarFile, setAvatarFile] = useState<UploadFile | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [showSecondaryAddress, setShowSecondaryAddress] = useState(false);
  const [propertyAccess, setPropertyAccess] = useState('all');
  const [properties, setProperties] = useState<Property[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('email');
  const [askForPin, setAskForPin] = useState(false);

  const storage = getStorage();
  const { Step } = Steps;

  // You might want to fetch these options from an API or define them elsewhere


  useEffect(() => {
    const fetchProperties = async () => {
      setLoadingProperties(true);
      try {
        const propertiesCollection = collection(db, 'properties');
        const propertiesSnapshot = await getDocs(propertiesCollection);
        const propertiesData: Property[] = [];

        for (const propertyDoc of propertiesSnapshot.docs) {
          let propertyName = 'Unknown Property';

          const settingsCollection = collection(db, 'properties', propertyDoc.id, 'propertySettings');
          const settingsSnapshot = await getDocs(settingsCollection);
          
          if (!settingsSnapshot.empty) {
            const settingsDoc = settingsSnapshot.docs[0]; // Get the first document in the collection
            const settingsData = settingsDoc.data();
            propertyName = settingsData?.propertyName || 'Unnamed Property';
          }

          propertiesData.push({ uid: propertyDoc.id, propertyName });
        }

        console.log('Fetched Properties:', propertiesData);
        setProperties(propertiesData);
      } catch (error) {
        console.error('Error fetching properties:', error);
      } finally {
        setLoadingProperties(false);
      }
    };

    fetchProperties();
  }, []);

  const TwoStepView = () => {
    const startIndex = Math.floor(currentStep / 2) * 2;
    const visibleSteps = steps.slice(startIndex, startIndex + 2);

    return (
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
        <Steps current={currentStep % 2} style={{ flex: 1, margin: '0 10px' }}>
          {visibleSteps.map((step, index) => (
            <Step key={startIndex + index} title={step.title} icon={step.icon} />
          ))}
        </Steps>
      </div>
    );
  };

  useEffect(() => {
    if (visible) {
      form.resetFields();
      setCurrentStep(0);
    }
  }, [visible, companyId]);

  const handleAvatarUpload = async (file: RcFile) => {
    setAvatarUploading(true);
    const storageReference = storageRef(storage, `avatars/${file.name}`);
    try {
      await uploadBytes(storageReference, file);
      const downloadURL = await getDownloadURL(storageReference);
      setAvatarFile(file);
      setAvatarUrl(downloadURL);
      form.setFieldsValue({ avatar: downloadURL });
      message.success('Avatar uploaded successfully');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      message.error('Failed to upload avatar');
    } finally {
      setAvatarUploading(false);
    }
  };

  const beforeUpload = (file: UploadFile) => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
    if (!isJpgOrPng) {
      message.error('You can only upload JPG/PNG file!');
    }
    const isLt2M = file.size! / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('Image must smaller than 2MB!');
    }
    return isJpgOrPng && isLt2M;
  };

  const uploadButton = (
    <div>
      {avatarUploading ? <LoadingOutlined /> : <PlusOutlined />}
      <div style={{ marginTop: 8 }}>Upload</div>
    </div>
  );

  const steps = [
    {
      title: 'Personal Info',
      content: (
        <Form
          form={form}
          layout="vertical"
          name="personal_info"
          initialValues={{
            firstName: '',
            lastName: '',
            company: '',
            jobTitle: '',
            notes: '',
            avatar: '',
          }}
        >
          <Row justify="start" style={{ marginTop: 24,}}>
            <Col>
              <Form.Item name="avatar">
                <Upload
                  name="avatar"
                  listType="picture-card"
                  className="avatar-uploader"
                  showUploadList={false}
                  beforeUpload={beforeUpload}
                  customRequest={({ file, onSuccess }) => {
                    handleAvatarUpload(file as RcFile).then(() => {
                      onSuccess && onSuccess('ok');
                    });
                  }}
                  accept=".jpg,.jpeg,.pdf"
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="avatar"
                      style={{ width: '100%' }}
                    />
                  ) : (
                    uploadButton
                  )}
                </Upload>
              </Form.Item>
            </Col>
          </Row>
          <Divider  />
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="firstName"
                rules={[{ required: true, message: 'Please enter the first name' }]}
              >
                <Input placeholder="First Name" size="middle" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="middleName">
                <Input placeholder="Middle Name" size="middle" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="lastName"
                rules={[{ required: true, message: 'Please enter the last name' }]}
              >
                <Input placeholder="Last Name" size="middle" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="company"
                // Remove the required rule to make it optional
              >
                <Input placeholder="Company" size="middle" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="jobTitle">
                <Input placeholder="Job Title" size="middle" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Notes"
            name="notes"
            rules={[
              { max: 10000, message: 'Notes cannot exceed 10000 characters' },
            ]}
          >
            <Input.TextArea
              rows={4}
              placeholder="Additional notes"
              maxLength={10000}
              showCount
            />
          </Form.Item>
        </Form>
      ),
      icon: <UserOutlined />,
    },
    {
      title: 'Portal Info',
      content: (
        <Form
          form={form}
          layout="vertical"
          name="portal_info"
          style={{ marginTop: 24 }}
        >
          <Form.Item
            name="portalEmail"
            label="Portal Email"
            rules={[
              { required: true, type: 'email', message: 'Please enter a valid email' },
            ]}
          >
            <Input 
              prefix={<MailOutlined />} 
              placeholder="Enter email for portal access" 
            />
          </Form.Item>

          <Alert
            message="Portal Access Information"
            description="Please provide an email address for portal access. This will be used for login credentials."
            type="info"
            showIcon
            style={{ marginTop: 24 }}
          />
        </Form>
      ),
      icon: <SafetyOutlined />,
    },
    {
      title: 'Contact Info',
      content: (
        <Form
          form={form}
          layout="vertical"
          name="contact_info"
          style={{ marginTop: 24 }}
        >
          <Form.List name="phones" initialValue={[{ type: 'mobile', number: '' }]}>
            {(fields, { add, remove }) => (
              <>
                {fields.map((field, index) => (
                  <Row gutter={16} key={field.key} className="contactRow">
                    <Col span={10}>
                      <Form.Item
                        name={[field.name, 'type']}
                        noStyle
                      >
                        <Select placeholder="Type" className="contactSelect" size="middle">
                          <Option value="mobile">Mobile</Option>
                          <Option value="work">Work</Option>
                          <Option value="home">Home</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name={[field.name, 'number']}
                        noStyle
                        rules={[
                          {
                            pattern: /^\+?[1-9]\d{1,14}$/,
                            message: 'Please enter a valid phone number',
                          },
                        ]}
                      >
                        <Input
                          placeholder="Enter phone number"
                          className="contactInput"
                          size="middle"
                        />
                      </Form.Item>
                    </Col>
                    <Col span={2}>
                      {fields.length > 1 && (
                        <MinusCircleOutlined onClick={() => remove(field.name)} />
                      )}
                    </Col>
                  </Row>
                ))}
                <Button type="link" onClick={() => add()} className="addButton">
                  + Add Another Phone
                </Button>
              </>
            )}
          </Form.List>

          <Form.List name="emails" initialValue={[{ type: 'primary', address: '' }]}>
            {(fields, { add, remove }) => (
              <>
                {fields.map((field, index) => (
                  <Row gutter={16} key={field.key} className="contactRow">
                    <Col span={10}>
                      <Form.Item
                        name={[field.name, 'type']}
                        noStyle
                      >
                        <Select placeholder="Type" className="contactSelect" size="middle">
                          <Option value="primary">Primary</Option>
                          <Option value="work">Work</Option>
                          <Option value="personal">Personal</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name={[field.name, 'address']}
                        noStyle
                        rules={[
                          {
                            required: true,
                            type: 'email',
                            message: 'Please enter a valid email address',
                          },
                        ]}
                      >
                        <Input
                          placeholder="Enter email address"
                          className="contactInput"
                          size="middle"
                        />
                      </Form.Item>
                    </Col>
                    <Col span={2}>
                      {fields.length > 1 && (
                        <MinusCircleOutlined onClick={() => remove(field.name)} />
                      )}
                    </Col>
                  </Row>
                ))}
                <Button type="link" onClick={() => add()} className="addButton">
                  + Add Another Email
                </Button>
              </>
            )}
          </Form.List>

          <Form.Item>
            <div style={{ color: '#ff4d4f', marginTop: 8 }}>
              Please enter an email address! You can optionally add a mobile phone number
            </div>
          </Form.Item>
        </Form>
      ),
      icon: <PhoneOutlined />,
    },
    {
      title: 'Address',
      content: (
        <Form
          form={form}
          layout="vertical"
          name="address_info"
          style={{ marginTop: 24 }}
        >
          <Card title="Primary Address" style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item
                  name={['addresses', 0, 'street']}
                  label="Street Address"
                >
                  <Input placeholder="Enter street address" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name={['addresses', 0, 'city']}
                  label="City"
                >
                  <Input placeholder="Enter city" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name={['addresses', 0, 'state']}
                  label="State/Province"
                >
                  <Input placeholder="Enter state or province" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name={['addresses', 0, 'postalCode']}
                  label="Postal Code"
                >
                  <Input placeholder="Enter postal code" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name={['addresses', 0, 'country']}
                  label="Country"
                >
                  <Select
                    placeholder="Select country"
                    style={{
                      height: '40px',
                      fontSize: '14px',
                    }}
                    dropdownStyle={{
                      maxHeight: 400,
                      overflow: 'auto',
                      fontSize: '14px',
                    }}
                  >
                    <Option value="us">United States</Option>
                    <Option value="ca">Canada</Option>
                    {/* Add more countries as needed */}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Form.Item
            label="Add Secondary Address"
            name="hasSecondaryAddress"
            valuePropName="checked"
          >
            <Switch
              onChange={(checked) => setShowSecondaryAddress(checked)}
              checkedChildren="Yes"
              unCheckedChildren="No"
            />
          </Form.Item>

          {showSecondaryAddress && (
            <Card title="Secondary Address" style={{ marginTop: 16 }}>
              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item
                    name={['addresses', 1, 'street']}
                    label="Street Address"
                    rules={[{ required: true, message: 'Please enter the street address' }]}
                  >
                    <Input placeholder="Enter street address" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name={['addresses', 1, 'city']}
                    label="City"
                    rules={[{ required: true, message: 'Please enter the city' }]}
                  >
                    <Input placeholder="Enter city" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name={['addresses', 1, 'state']}
                    label="State/Province"
                    rules={[{ required: true, message: 'Please enter the state or province' }]}
                  >
                    <Input placeholder="Enter state or province" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name={['addresses', 1, 'postalCode']}
                    label="Postal Code"
                    rules={[{ required: true, message: 'Please enter the postal code' }]}
                  >
                    <Input placeholder="Enter postal code" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name={['addresses', 1, 'country']}
                    label="Country"
                    rules={[{ required: true, message: 'Please select the country' }]}
                  >
                    <Select
                      placeholder="Select country"
                      style={{
                        height: '40px',
                        fontSize: '14px',
                      }}
                      dropdownStyle={{
                        maxHeight: 400,
                        overflow: 'auto',
                        fontSize: '14px',
                      }}
                    >
                      <Option value="us">United States</Option>
                      <Option value="ca">Canada</Option>
                      {/* Add more countries as needed */}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          )}
        </Form>
      ),
      icon: <HomeOutlined />,
    },
    {
      title: 'Agreement',
      content: (
        <Form
          form={form}
          layout="vertical"
          name="agreement_info"
          style={{ marginTop: 24 }}
        >

          <Form.Item
            name="agreementStartDate"
            label="Agreement Start Date"
            rules={[{ required: true, message: 'Please select the agreement start date' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="agreementEndDate"
            label="Agreement End Date"
            rules={[{ required: true, message: 'Please select the agreement end date' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      ),
      icon: <ToolOutlined />,
    },
    {
      title: 'Tax',
      content: (
        <Form
          form={form}
          layout="vertical"
          name="tax_info"
          style={{ marginTop: 24 }}
        >
          <Form.Item
            name="sendT776"
            label="Would you like to send Owners T776?"
            rules={[{ required: true, message: 'Please select an option' }]}
          >
            <Radio.Group>
              <Space direction="vertical">
                <Radio value="doNotSend">Do not send T776 to this owner</Radio>
                <Radio value="send">I want to send T776 to this owner</Radio>
              </Space>
            </Radio.Group>
          </Form.Item>
        </Form>
      ),
      icon: <InfoCircleOutlined />,
    },
    {
      title: 'Payment',
      content: (
        <Form
          form={form}
          layout="vertical"
          name="payment_info"
          style={{ marginTop: 24 }}
        >
          <Form.Item
            name="enablePayments"
            valuePropName="checked"
            label="Enable send payments for this owner"
          >
            <Switch />
          </Form.Item>
          <Divider style={{ marginTop: '24px', marginBottom: '24px' }} />
          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.enablePayments !== currentValues.enablePayments}
          >
            {({ getFieldValue }) =>
              getFieldValue('enablePayments') ? (
                <>
                  <Row>
                    <Col span={24}>
                      <Text strong style={{ fontSize: '16px', display: 'block', marginBottom: '24px' }}>Payment Sending Method</Text>
                    </Col>
                  </Row>
                  <Row justify="center">
                    <Space size="large">
                      <Button
                        type="default"
                        onClick={() => setSelectedPaymentMethod('email')}
                        style={{ 
                          height: '100px', 
                          width: '150px', 
                          display: 'flex', 
                          flexDirection: 'column', 
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '16px',
                          border: selectedPaymentMethod === 'email' ? '2px solid #28a745' : '1px solid #d9d9d9'
                        }}
                      >
                        <SendOutlined style={{ fontSize: '24px' }} />
                        <div style={{ textAlign: 'center' }}>
                          <div>Email</div>
                          <div style={{ fontSize: '12px', color: '#28a745', marginTop: '-4px' }}>(Recommended)</div>
                        </div>
                      </Button>
                      <Button
                        type="default"
                        onClick={() => setSelectedPaymentMethod('mail')}
                        style={{ 
                          height: '100px', 
                          width: '150px', 
                          display: 'flex', 
                          flexDirection: 'column', 
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '16px',
                          border: selectedPaymentMethod === 'mail' ? '2px solid #28a745' : '1px solid #d9d9d9'
                        }}
                      >
                        <MailOutlined style={{ fontSize: '24px' }} />
                        <div>Mail Check</div>
                      </Button>
                    </Space>
                  </Row>
                  {selectedPaymentMethod === 'email' && (
                    <>
                      <Row style={{ marginTop: '24px' }}>
                        <Col span={24}>
                          <Alert
                            icon={<InfoCircleOutlined />}
                            message={
                              <div>
                                <Text strong>Email</Text>
                                <br />
                                <Text>An email will be sent to the owner, asking them how they prefer to get paid.</Text>
                              </div>
                            }
                            description={
                              <div>
                                <Text>This is the preferred payment method, as it requires the user to authenticate their bank account, and gives them control if they ever need to make any changes etc.</Text>
                                <Text strong style={{ display: 'block', marginTop: '16px', marginBottom: '8px' }}>They can choose between:</Text>
                                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                                  <Space align="start">
                                    <img 
                                      src="/assets/32px-InteracLogo.svg.png" 
                                      alt="Direct Deposit" 
                                      style={{ width: '24px', height: '24px', marginTop: '4px' }} 
                                    />
                                    <div>
                                      <Text strong>Direct Deposit</Text>
                                      <br />
                                      <Text>Have the funds deposited directly to their bank account via Interac e-Transfer</Text>
                                    </div>
                                  </Space>
                                  <Space align="start">
                                    <PrinterOutlined style={{ fontSize: '24px', marginTop: '4px' }} />
                                    <div>
                                      <Text strong>Print and Deposit</Text>
                                      <br />
                                      <Text>Print the payment as a check and then deposit it through their bank's mobile app.</Text>
                                    </div>
                                  </Space>
                                </Space>
                              </div>
                            }
                            type="info"
                            showIcon
                          />
                        </Col>
                      </Row>
                      
                      <Row style={{ marginTop: '24px' }}>
                        <Col span={24}>
                          <div>
                            <Text strong style={{ fontSize: '16px', display: 'block', marginBottom: '16px' }}>Email Settings</Text>                            
                            <Form.Item
                              name="billingEmail"
                              label="Billing Email"
                              rules={[{ required: true, type: 'email', message: 'Please enter a valid email' }]}
                            >
                              <Input placeholder="recipient_email_here@doorloop.com" />
                            </Form.Item>
                            
                            <Form.Item
                              name="askForPin"
                              valuePropName="checked"
                              style={{ marginBottom: '16px' }}
                            >
                              <Switch
                                onChange={setAskForPin}
                                checkedChildren="Yes"
                                unCheckedChildren="No"
                              />
                              <Text style={{ marginLeft: '8px', marginTop: '8px' }}>Ask the payee for a PIN before accepting this payment</Text>
                            </Form.Item>
                            
                            {askForPin && (
                              <Row gutter={16}>
                                <Col span={12}>
                                  <Form.Item
                                    name="pinCode"
                                    rules={[{ required: true, message: 'Please enter a PIN code' }]}
                                  >
                                    <Input placeholder="PIN Code" />
                                  </Form.Item>
                                </Col>
                                <Col span={12}>
                                  <Form.Item
                                    name="pinHint"
                                    rules={[{ required: true, message: 'Please enter a hint for the PIN' }]}
                                  >
                                    <Input placeholder="Hint (will be visible to payee)" />
                                  </Form.Item>
                                </Col>
                              </Row>
                            )}
                          </div>
                        </Col>
                      </Row>
                    </>
                  )}
                  {selectedPaymentMethod === 'mail' && (
                    <div style={{ marginTop: '24px' }}>
                      <Alert
                        icon={<InfoCircleOutlined />}
                        message={
                          <div>
                            <Text strong>Mail Check</Text>
                            <br />
                            <Text>A check will be printed and mailed on your behalf to the address below</Text>
                          </div>
                        }
                        description={
                          <div style={{ marginTop: '16px' }}>
                            <Divider/>
                            <Text strong>Please Note:</Text>
                            <br />
                            <Text>The preferred payment sending method is email as it would allow the recipient to input and verify this information.</Text>
                          </div>
                        }
                        type="info"
                        showIcon
                      />
                      
                      <Title level={5} style={{ marginTop: '24px', marginBottom: '16px' }}>Address Settings</Title>
                      
                      <Form.Item
                        name={['mailAddress', 'street1']}
                        rules={[{ required: true, message: 'Please enter Street 1' }]}
                      >
                        <Input placeholder="Street 1" />
                      </Form.Item>
                      
                      <Form.Item name={['mailAddress', 'street2']}>
                        <Input placeholder="Street 2" />
                      </Form.Item>
                      
                      <Row gutter={16}>
                        <Col span={6}>
                          <Form.Item
                            name={['mailAddress', 'city']}
                            rules={[{ required: true, message: 'Please enter City' }]}
                          >
                            <Input placeholder="City" />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item name={['mailAddress', 'state']}>
                            <Input placeholder="State" />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                        <Form.Item
                            name={['mailAddress', 'zipCode']}
                            rules={[{ required: true, message: 'Please enter Zip code' }]}
                          >
                            <Input placeholder="Postal Code" />
                          </Form.Item>
                        </Col>
                        <Form.Item
                            name={['mailAddress', 'country']}
                            rules={[{ required: true, message: 'Please enter Country' }]}
                          >
                            <Input placeholder="Country" />
                          </Form.Item>
                        <Col span={6}>
                          
                        </Col>
                      </Row>
                      
                    </div>
                  )}
                  <Form.Item name="paymentSendingMethod" hidden>
                    <Input />
                  </Form.Item>
                </>
              ) : null
            }
          </Form.Item>
        </Form>
      ),
      icon: <DollarOutlined />,
    },
    {
      title: 'Submit',
      content: <ReviewSection form={form} properties={properties} />,
      icon: <SaveOutlined />,
    },
  ];

  const validateStep = async (step: number) => {
    try {
      switch (step) {
        case 0: // Personal Info
          await form.validateFields(['firstName', 'lastName', 'company']);
          break;
        case 1: // Portal Info
          await form.validateFields(['portalEmail']);
          break;
        case 2: // Contact Info
          await form.validateFields(['emails']);
          const emails = form.getFieldValue('emails');
          if (!emails || emails.length === 0 || !emails[0].address) {
            throw new Error('At least one email address is required');
          }
          break;
        case 3: // Address
          // Address is optional, so no validation needed
          break;
        case 4: // Agreement
          await form.validateFields(['ownerCategories', 'agreementStartDate', 'agreementEndDate']);
          break;
        case 5: // Tax
          await form.validateFields(['sendT776']);
          break;
        case 6: // Payment
          // Payment is optional, so no validation needed
          break;
      }
      return true;
    } catch (error) {
      console.error('Validation error:', error);
      if (error instanceof Error) {
        message.error(error.message);
      }
      return false;
    }
  };

  const next = async () => {
    const isValid = await validateStep(currentStep);
    if (isValid) {
      setCurrentStep(currentStep + 1);
    } else {
    }
  };

  const prev = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleDrawerClose = () => {
    form.resetFields();
    setCurrentStep(0);
    setShowSecondaryAddress(false);
    setPropertyAccess('all');
    setSelectedPaymentMethod('email');
    setAskForPin(false);
    setAvatarFile(null);
    setAvatarUrl(null);
    onClose();
  };

  const handleSubmit = async () => {
    try {
      await form.validateFields();
      setSubmitting(true);

      let formData = form.getFieldsValue(true);

      // Clean the form data
      formData = cleanFormData(formData);

      // Convert agreement dates to array format
      const agreement = {
        startDate: formData.agreementStartDate ? dayjs(formData.agreementStartDate).format('YYYY-MM-DD') : null,
        endDate: formData.agreementEndDate ? dayjs(formData.agreementEndDate).format('YYYY-MM-DD') : null
      };

      // Remove individual date fields
      delete formData.agreementStartDate;
      delete formData.agreementEndDate;

      // Handle Addresses
      const addresses = formData.addresses || [];
      delete formData.addresses; // Already captured addresses

      // Add additional fields
      formData = {
        ...formData,
        companyId,
        createdBy: auth.currentUser?.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        peopleType: "owner",
        addresses, // Add the addresses array
        agreement, // Add the agreement object
      };

      console.log('Owner Data to be submitted:', formData); // For debugging

      // Save all data to Firestore
      const docRef = await addDoc(collection(db, 'people'), formData);
      
      message.success('Owner added successfully');
      form.resetFields();
      onSubmitSuccess();
      handleDrawerClose();
    } catch (error) {
      console.error('Error adding owner:', error);
      if (error instanceof Error) {
        message.error(`Failed to add owner: ${error.message}`);
      } else {
        message.error('An unknown error occurred while adding the owner');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Add this function to clean the form data
  const cleanFormData = (data: any) => {
    // Helper function to remove undefined values and empty objects
    const clean = (obj: any): any => {
      Object.keys(obj).forEach(key => {
        if (obj[key] && typeof obj[key] === 'object') {
          clean(obj[key]);
        } else if (obj[key] === undefined) {
          delete obj[key];
        }
      });
      return obj;
    };

    // Clean the main data object
    let cleanedData = clean(data);

    // Handle nested arrays
    if (cleanedData.addresses) {
      cleanedData.addresses = cleanedData.addresses.filter((addr: any) =>
        addr.street || addr.city || addr.state || addr.postalCode || addr.country
      );
    }

    if (cleanedData.phones) {
      cleanedData.phones = cleanedData.phones.filter((phone: any) => 
        phone && phone.number
      );
    }

    if (cleanedData.emails) {
      cleanedData.emails = cleanedData.emails.filter((email: any) => 
        email && email.address
      );
    }

    return cleanedData;
  };

  return (
    <Drawer
      title="New Owner"
      width={'50%'}
      onClose={handleDrawerClose}
      visible={visible}
      bodyStyle={{ paddingBottom: 80 }}
      className="new-owner-drawer"
      footer={
        <div style={{ textAlign: 'right' }}>
          {currentStep > 0 && (
            <Button style={{ margin: '0 8px' }} onClick={prev}>
              Previous
            </Button>
          )}
          {currentStep < steps.length - 1 && (
            <Button onClick={next} type="primary">
              Next
            </Button>
          )}
          {currentStep === steps.length - 1 && (
            <Button
              onClick={handleSubmit}
              type="primary"
              loading={submitting}
            >
              Submit
            </Button>
          )}
        </div>
      }
    >
      <TwoStepView />
      <div>{steps[currentStep].content}</div>
    </Drawer>
  );
};

interface FormValues {
  firstName?: string;
  lastName?: string;
  company?: string;
  jobTitle?: string;
  notes?: string;
  phones?: Array<{ type: string; number: string }>;
  emails?: Array<{ type: string; address: string }>;
  addresses?: Array<{
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  }>;
  ownerCategories?: string[];
  agreement?: {
    startDate: string | null;
    endDate: string | null;
  };
  propertyAccess?: 'all' | 'specific';
  specificProperties?: string[];
  enablePayments?: boolean;
  paymentSendingMethod?: 'email' | 'mail';
  billingEmail?: string;
  askForPin?: boolean;
  pinCode?: string;
  pinHint?: string;
  mailAddress?: {
    street1: string;
    street2?: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  portalEmail?: string;
  portalPhone?: string;
  sendCredentials?: boolean;
  sendT776?: 'doNotSend' | 'send';
}

const ReviewSection: React.FC<{ form: any; properties: Property[] }> = ({ form, properties }) => {
  const [formValues, setFormValues] = useState<FormValues>(form.getFieldsValue(true));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setFormValues(form.getFieldsValue(true));
  }, [form]);

  const InfoItem = ({ label, value }: { label: string; value: any }) => (
    <div style={{ marginBottom: 16 }}>
      <Text strong>{label}: </Text>
      <Text>{value || 'N/A'}</Text>
    </div>
  );

  if (loading) {
    return <Spin size="large" />;
  }

  return (
    <div style={{ padding: '24px 0' }}>
      <Title level={3}>Review Your Information</Title>
      
      <Row gutter={[0, 24]}>
        <Col span={24}>
          <Card title="Personal Info">
            <Row gutter={16}>
              <Col span={12}>
                <InfoItem label="First Name" value={formValues.firstName} />
                <InfoItem label="Last Name" value={formValues.lastName} />
                <InfoItem label="Company" value={formValues.company} />
              </Col>
              <Col span={12}>
                <InfoItem label="Job Title" value={formValues.jobTitle} />
                <InfoItem label="Notes" value={formValues.notes} />
              </Col>
            </Row>
          </Card>
        </Col>
        
        <Col span={24}>
          <Card title="Contact Info">
            <Row gutter={16}>
              <Col span={12}>
                {formValues.phones?.map((phone, index) => (
                  <InfoItem key={`phone-${index}`} label={`Phone ${index + 1}`} value={`${phone.type}: ${phone.number}`} />
                ))}
              </Col>
              <Col span={12}>
                {formValues.emails?.map((email, index) => (
                  <InfoItem key={`email-${index}`} label={`Email ${index + 1}`} value={`${email.type}: ${email.address}`} />
                ))}
              </Col>
            </Row>
          </Card>
        </Col>
        
        <Col span={24}>
          <Card title="Addresses">
            {formValues.addresses?.map((address, index) => (
              <div key={`address-${index}`} style={{ marginBottom: 16 }}>
                <Text strong>{index === 0 ? 'Primary Address' : `Address ${index + 1}`}</Text>
                <InfoItem label="Street" value={address.street} />
                <InfoItem label="City" value={address.city} />
                <InfoItem label="State" value={address.state} />
                <InfoItem label="Postal Code" value={address.postalCode} />
                <InfoItem label="Country" value={address.country} />
              </div>
            ))}
          </Card>
        </Col>

        <Col span={24}>
          <Card title="Agreement">
            <InfoItem label="Owner Categories" value={formValues.ownerCategories?.join(', ')} />
            <InfoItem 
              label="Agreement Start Date" 
              value={formValues.agreement?.startDate || 'N/A'} 
            />
            <InfoItem 
              label="Agreement End Date" 
              value={formValues.agreement?.endDate || 'N/A'} 
            />
          </Card>
        </Col>

        <Col span={24}>
          <Card title="Tax">
            <InfoItem label="Would you like to send a T776 to this owner?" value={formValues.sendT776 === 'send' ? 'Yes' : 'No'} />
          </Card>
        </Col>

        <Col span={24}>
          <Card title="Payment">
            <InfoItem label="Enable Payments" value={formValues.enablePayments ? 'Yes' : 'No'} />
            {formValues.enablePayments && (
              <>
                <InfoItem label="Payment Sending Method" value={formValues.paymentSendingMethod} />
                {formValues.paymentSendingMethod === 'email' && (
                  <>
                    <InfoItem label="Billing Email" value={formValues.billingEmail} />
                    <InfoItem label="Ask for PIN" value={formValues.askForPin ? 'Yes' : 'No'} />
                    {formValues.askForPin && (
                      <>
                        <InfoItem label="PIN Code" value={formValues.pinCode} />
                        <InfoItem label="PIN Hint" value={formValues.pinHint} />
                      </>
                    )}
                  </>
                )}
                {formValues.paymentSendingMethod === 'mail' && (
                  <>
                    <InfoItem label="Mailing Address" value={`${formValues.mailAddress?.street1}, ${formValues.mailAddress?.street2 || ''}, ${formValues.mailAddress?.city}, ${formValues.mailAddress?.state}, ${formValues.mailAddress?.zipCode}, ${formValues.mailAddress?.country}`} />
                  </>
                )}
              </>
            )}
          </Card>
        </Col>

        <Col span={24}>
          <Card title="Portal Information">
            <InfoItem label="Portal Email" value={formValues.portalEmail} />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default NewOwnerPage;
