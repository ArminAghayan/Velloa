import { useState, useEffect } from 'react';
import { BankOutlined, DollarOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { Typography, Steps, Button, Input, Select, Tag, message, Form, Row, Col, Table } from 'antd';
import { useNavigate } from 'react-router-dom';
import './addnewproperty.css';
import { Link } from 'react-router-dom';
import { IconPigMoney, IconPigOff } from '@tabler/icons-react';
import { collection, addDoc, getDoc, doc } from 'firebase/firestore';
import { auth, db } from '../../../firebase-config';

const { Title } = Typography;
const { Step } = Steps;
const { Option } = Select;

interface Unit {
  unitName: string;
  beds: string;
  baths: string;
  size: string;
  marketRent: string;
  [key: string]: any;
}

const AddNewProperty: React.FC = () => {
  const [current, setCurrent] = useState(0);
  const [propertyType, setPropertyType] = useState('');
  const [selectedDescription, setSelectedDescription] = useState('');
  const [country, setCountry] = useState('');
  const [state, setState] = useState('');
  const [units, setUnits] = useState<Unit[]>([{ unitName: '', beds: '', baths: '', size: '', marketRent: '' }]);
  const [useDefaultAccount, setUseDefaultAccount] = useState(true);
  const [specificBankAccount, setSpecificBankAccount] = useState('');
  const [defaultAccount] = useState("Noam's bank");
  const [useReserveFund, setUseReserveFund] = useState(false);
  const [reserveAmount, setReserveAmount] = useState('');
  const [owners, setOwners] = useState([{ name: '', percentage: '' }]);
  const totalPercentage = owners.reduce((sum, owner) => sum + (parseInt(owner.percentage) || 0), 0);
  const isPercentageValid = totalPercentage <= 100;
  const navigate = useNavigate();
  const [form] = Form.useForm();

  useEffect(() => {
    if (!auth.currentUser) {
      navigate('/login');
    }
  }, [navigate]);

  const handleDescriptionClick = (description: string) => {
    setSelectedDescription(selectedDescription === description ? '' : description);
  };

  const handleCountryChange = (value: string) => {
    setCountry(value);
    setState('');
  };

  const resetForms = () => {
    setPropertyType('');
    setSelectedDescription('');
    setCountry('');
    setState('');
    setUnits([{ unitName: '', beds: '', baths: '', size: '', marketRent: '' }]);
    setUseDefaultAccount(true);
    setSpecificBankAccount('');
  };

  const handleUnitChange = (index: number, field: string, value: string) => {
    const updatedUnits = [...units];
    updatedUnits[index][field] = value;
    setUnits(updatedUnits);
  };

  const addAnotherUnit = () => {
    setUnits([...units, { unitName: '', beds: '', baths: '', size: '', marketRent: '' }]);
  };

  const removeUnit = (index: number) => {
    const updatedUnits = [...units];
    updatedUnits.splice(index, 1);
    setUnits(updatedUnits);
  };

  const steps = [
    { title: 'Type' },
    { title: 'Address' },
    { title: 'Units' },
    { title: 'Bank Accounts' },
    { title: 'Reserve Funds' },
    { title: 'Ownership' },
    { title: 'Summary' },
  ];

  const next = () => {
    if (current === 0 && !propertyType) {
      message.error('Please select a property type');
      return;
    }

    if (current === 1) {
      form.validateFields().then(() => {
        setCurrent(current + 1);
      }).catch((errorInfo) => {
        const errorFields = errorInfo.errorFields;
        form.setFields(errorFields);
      });
      return;
    }

    if (current === 2 && units.length === 0) {
      message.error('Please add at least one unit');
      return;
    }

    if (current === 3 && !useDefaultAccount && specificBankAccount.trim() === '') {
      message.error('Please specify a bank account');
      return;
    }

    if (current === 5 && !isPercentageValid) {
      return;
    }

    setCurrent(current + 1);
  };

  const prev = () => {
    setCurrent(current - 1);
  };

  const handlePropertyTypeClick = (type: string) => {
    setPropertyType(type === propertyType ? '' : type);
    setSelectedDescription('');
  };

  const handleOwnerNameChange = (index: number, value: string) => {
    const updatedOwners = [...owners];
    updatedOwners[index].name = value;
    setOwners(updatedOwners);
  };

  const handleOwnerPercentageChange = (index: number, value: string) => {
    const updatedOwners = [...owners];
    updatedOwners[index].percentage = value;
    setOwners(updatedOwners);
  };

  const addOwner = () => {
    setOwners([...owners, { name: '', percentage: '' }]);
  };

  const removeOwner = (index: number) => {
    const updatedOwners = owners.filter((_, i) => i !== index);
    setOwners(updatedOwners);
  };

  const handleFormSubmit = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        message.error('User not logged in. Please log in and try again.');
        return;
      }
  
      const userId = currentUser.uid;
      const userDocRef = doc(db, 'users', userId);
      const userSnapshot = await getDoc(userDocRef);
  
      if (!userSnapshot.exists()) {
        message.error('User document not found. Please contact support.');
        return;
      }
  
      const userData = userSnapshot.data();
      const companyuid = userData?.companyuid;
  
      if (!companyuid) {
        message.error('User is not associated with any company. Please contact support.');
        return;
      }
  
      const companyDocRef = doc(db, 'companies', companyuid);
      const companySnapshot = await getDoc(companyDocRef);
  
      if (!companySnapshot.exists()) {
        message.error('Company document not found. Please contact support.');
        return;
      }
  
      const companyData = companySnapshot.data();
      const companyName = companyData?.companyName;
  
      const propertyData = {
        companyuid,
        propertyType: propertyType || '',
        propertyDescription: selectedDescription || '',
        address: {
          street1: form.getFieldValue('street1') || '',
          street2: form.getFieldValue('street2') || '',
          city: form.getFieldValue('city') || '',
          state: form.getFieldValue('state') || '',
          zip: form.getFieldValue('zip') || '',
          country: form.getFieldValue('country') || '',
        },
        units: units.map(unit => ({
          unitName: unit.unitName || '',
          beds: unit.beds || '',
          baths: unit.baths || '',
          size: unit.size || '',
          marketRent: unit.marketRent || '',
        })),
        bankAccount: useDefaultAccount ? defaultAccount : (specificBankAccount || ''),
        reserveFund: useReserveFund ? (reserveAmount || '') : null,
        ownership: useDefaultAccount
          ? [{ name: companyName || 'Unknown Company', percentage: '100' }]
          : owners.map(owner => ({
            name: owner.name || '',
            percentage: owner.percentage || '',
          })),
      };
  
      const docRef = await addDoc(collection(db, 'properties'), propertyData);
      resetForms();
      navigate('/property');
      message.success('Property added successfully!');
    } catch (error) {
      console.error('Error adding property:', error);
      message.error('An error occurred while adding the property. Please try again.');
    }
  };
  
  
  
  



  const renderStepContent = () => {
    switch (current) {
      case 0:
        return (
          <div>
            <Title level={3} style={{ textAlign: 'center', marginBottom: '40px' }}>
              Adding your property
            </Title>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              Which kind of property do you manage?
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
              <Button
                type={propertyType === 'residential' ? 'primary' : 'default'}
                onClick={() => handlePropertyTypeClick('residential')}
                style={{ marginRight: '10px', height: '60px', width: '150px' }}
                className="property-type-button"
              >
                Residential
              </Button>
              <Button
                type={propertyType === 'commercial' ? 'primary' : 'default'}
                onClick={() => handlePropertyTypeClick('commercial')}
                style={{ height: '60px', width: '150px' }}
                className="property-type-button"
              >
                Commercial
              </Button>
            </div>
            {propertyType && (
              <div>
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  Which type best describes your property?
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <Button
                    type={selectedDescription === 'house' ? 'primary' : 'default'}
                    onClick={() => handleDescriptionClick('house')}
                    className="property-subtype-button"
                  >
                    House
                  </Button>
                  <Button
                    type={selectedDescription === 'apartment' ? 'primary' : 'default'}
                    onClick={() => handleDescriptionClick('apartment')}
                    className="property-subtype-button"
                  >
                    Apartment
                  </Button>
                  <Button
                    type={selectedDescription === 'townhouse' ? 'primary' : 'default'}
                    onClick={() => handleDescriptionClick('townhouse')}
                    className="property-subtype-button"
                  >
                    Townhouse
                  </Button>
                  <Button
                    type={selectedDescription === 'office' ? 'primary' : 'default'}
                    onClick={() => handleDescriptionClick('office')}
                    className="property-subtype-button"
                  >
                    Office
                  </Button>
                  <Button
                    type={selectedDescription === 'retail' ? 'primary' : 'default'}
                    onClick={() => handleDescriptionClick('retail')}
                    className="property-subtype-button"
                  >
                    Retail
                  </Button>
                  <Button
                    type={selectedDescription === 'industrial' ? 'primary' : 'default'}
                    onClick={() => handleDescriptionClick('industrial')}
                    className="property-subtype-button"
                  >
                    Industrial
                  </Button>
                  <Button
                    type={selectedDescription === 'storage' ? 'primary' : 'default'}
                    onClick={() => handleDescriptionClick('storage')}
                    className="property-subtype-button"
                  >
                    Storage
                  </Button>
                  <Button
                    type={selectedDescription === 'other' ? 'primary' : 'default'}
                    onClick={() => handleDescriptionClick('other')}
                    className="property-subtype-button"
                  >
                    Other
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
      case 1:
          return (
            <Form form={form} onFinish={next}>
              <Row gutter={16}>
                <Col span={8}>
                  <label htmlFor="street1" className="visually-hidden">
                    Street 1
                  </label>
                  <Form.Item
                    name="street1"
                    rules={[{ required: true, message: 'Please enter Street 1' }]}
                  >
                    <Input id="street1" placeholder="Street 1" style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <label htmlFor="street2" className="visually-hidden">
                    Street 2
                  </label>
                  <Form.Item name="street2">
                    <Input id="street2" placeholder="Street 2" style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <label htmlFor="city" className="visually-hidden">
                    City
                  </label>
                  <Form.Item
                    name="city"
                    rules={[{ required: true, message: 'Please enter City' }]}
                  >
                    <Input id="city" placeholder="City" style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <label htmlFor="state" className="visually-hidden">
                    State/Province
                  </label>
                  <Form.Item
                    name="state"
                    rules={[{ required: true, message: 'Please select State/Province' }]}
                  >
                    <Select id="state" placeholder="State/Province" style={{ width: '100%' }}>
                      <Option value="Ontario">Ontario</Option>
                      <Option value="Quebec">Quebec</Option>
                      {/* Add more options as needed */}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <label htmlFor="zip" className="visually-hidden">
                    Zip/Postal Code
                  </label>
                  <Form.Item
                    name="zip"
                    rules={[{ required: true, message: 'Please enter Zip/Postal Code' }]}
                  >
                    <Input id="zip" placeholder="Zip/Postal Code" style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <label htmlFor="country" className="visually-hidden">
                    Country
                  </label>
                  <Form.Item
                    name="country"
                    rules={[{ required: true, message: 'Please select a country' }]}
                  >
                    <Select id="country" placeholder="Country" style={{ width: '100%' }}>
                      <Option value="USA">USA</Option>
                      <Option value="Canada">Canada</Option>
                      {/* Add more options as needed */}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
      
            </Form>
          );
      case 2:
            return (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <h3>Let's add the units for the property</h3>
                <p>Add all your units below.</p>
          
                <Form form={form} onFinish={next}>
                  {units.map((unit, index) => (
                    <div key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                      <div style={{ marginRight: '10px' }}>{index + 1}</div>
                      <Form.Item
                        name={`unitName-${index}`}
                        rules={[{ required: true, message: 'Please enter Unit Name' }]}
                        style={{ marginBottom: 0 }}
                      >
                        <Input
                          placeholder="Unit Name"
                          value={unit.unitName}
                          onChange={(e) => handleUnitChange(index, 'unitName', e.target.value)}
                          style={{ width: '200px', marginRight: '10px', fontSize: '16px' }}
                        />
                      </Form.Item>
                      <Form.Item
                        name={`beds-${index}`}
                        rules={[{ required: true, message: 'Please enter Beds' }]}
                        style={{ marginBottom: 0 }}
                      >
                        <Input
                          placeholder="Beds"
                          value={unit.beds}
                          onChange={(e) => handleUnitChange(index, 'beds', e.target.value)}
                          style={{ width: '120px', marginRight: '10px', fontSize: '16px' }}
                        />
                      </Form.Item>
                      <Form.Item
                        name={`baths-${index}`}
                        rules={[{ required: true, message: 'Please enter Baths' }]}
                        style={{ marginBottom: 0 }}
                      >
                        <Input
                          placeholder="Baths"
                          value={unit.baths}
                          onChange={(e) => handleUnitChange(index, 'baths', e.target.value)}
                          style={{ width: '200px', marginRight: '10px', fontSize: '16px' }}
                        />
                      </Form.Item>
                      <Form.Item
                        name={`size-${index}`}
                        rules={[{ required: true, message: 'Please enter Size' }]}
                        style={{ marginBottom: 0 }}
                      >
                        <Input
                          placeholder="Size"
                          value={unit.size}
                          onChange={(e) => handleUnitChange(index, 'size', e.target.value)}
                          style={{ width: '200px', marginRight: '10px', fontSize: '16px' }}
                        />
                      </Form.Item>
                      <Form.Item
                        name={`marketRent-${index}`}
                        rules={[{ required: true, message: 'Please enter Market Rent' }]}
                        style={{ marginBottom: 0 }}
                      >
                        <Input
                          placeholder="Market Rent"
                          value={unit.marketRent}
                          onChange={(e) => handleUnitChange(index, 'marketRent', e.target.value)}
                          style={{ width: '200px', marginRight: '10px', fontSize: '16px' }}
                        />
                      </Form.Item>
                      {index !== 0 && <Button danger onClick={() => removeUnit(index)}>X</Button>}
                    </div>
                  ))}
          
                  <Button type="dashed" onClick={addAnotherUnit} style={{ marginTop: '20px' }}>
                    + Add Another Unit
                  </Button>
          
                </Form>
              </div>
            );
      case 3:
          return (
            <div>
              <Title level={3} style={{ textAlign: 'center', marginBottom: '20px' }}>
                Property Bank Account
              </Title>
              <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                Which bank accounts should be used for this property?
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                <Button
                  type={useDefaultAccount ? 'primary' : 'default'}
                  onClick={() => setUseDefaultAccount(true)}
                  style={{
                    marginRight: '10px',
                    width: '150px',
                    height: '150px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '10px 10px 20px',
                  }}
                >
                  <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <BankOutlined style={{ fontSize: '50px' }} />
                  </div>
                  <Typography.Text
                    style={{
                      textAlign: 'center',
                      whiteSpace: 'normal',
                      wordWrap: 'break-word',
                      color: useDefaultAccount ? 'white' : 'inherit',
                    }}
                  >
                    Use company default account
                  </Typography.Text>
                </Button>
                <Button
                  type={!useDefaultAccount ? 'primary' : 'default'}
                  onClick={() => setUseDefaultAccount(false)}
                  style={{
                    width: '150px',
                    height: '150px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '10px 10px 20px',
                  }}
                >
                  <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <DollarOutlined style={{ fontSize: '50px' }} />
                  </div>
                  <Typography.Text
                    style={{
                      textAlign: 'center',
                      whiteSpace: 'normal',
                      wordWrap: 'break-word',
                      color: !useDefaultAccount ? 'white' : 'inherit',
                    }}
                  >
                    Specify bank account
                  </Typography.Text>
                </Button>
              </div>
              {useDefaultAccount && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    marginTop: '40px',
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}
                >
                  <div
                    style={{
                      width: '500px',
                      textAlign: 'left',
                      backgroundColor: '#ffffff',
                      borderRadius: '8px',
                      border: '1px solid #d9d9d9',
                      padding: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <div
                        style={{
                          backgroundColor: '#7692B8',
                          borderRadius: '50%',
                          padding: '8px',
                          marginRight: '10px',
                        }}
                      >
                        <BankOutlined style={{ fontSize: '24px', color: 'white' }} />
                      </div>
                      <Typography.Text strong>{defaultAccount}</Typography.Text>
                    </div>
                    <Tag
                      icon={<CheckCircleOutlined />}
                      color="#52c41a"
                      style={{
                        border: 'none',
                        padding: '6px 6px',
                      }}
                    >
                      Default Account
                    </Tag>
                  </div>
                  <div style={{ marginTop: '16px' }}>
                    <Typography.Text>
                      Your company's default bank account can be modified at any time through your{' '}
                      <Link to="/companysettings">Company Settings</Link>.
                    </Typography.Text>
                  </div>
                </div>
              )}
        
              {!useDefaultAccount && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    marginTop: '40px',
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ marginTop: '20px' }}>
                    <Input
                      placeholder="Specify bank account"
                      value={specificBankAccount}
                      onChange={(e) => setSpecificBankAccount(e.target.value)}
                    />
                  </div>
                  <div style={{ marginTop: '16px' }}>
                    <Typography.Text>
                      Your company's default bank account can be modified at any time through your{' '}
                      <Link to="/companysettings">Company Settings</Link>.
                    </Typography.Text>
                  </div>
                </div>
              )}
            </div>
          );
      case 4:
            return (
              <div>
                <Title level={3} style={{ textAlign: 'center', marginBottom: '20px' }}>
                  Reserve Funds
                </Title>
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                  Would you like to maintain a minimum balance ("Reserve") for this property?
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                  <Button
                    type={useReserveFund ? 'primary' : 'default'}
                    onClick={() => setUseReserveFund(true)}
                    style={{
                      marginRight: '10px',
                      width: '150px',
                      height: '150px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      padding: '10px 10px 20px',
                    }}
                  >
                    <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <IconPigMoney size={50} />
                    </div>
                    <Typography.Text
                      style={{
                        textAlign: 'center',
                        whiteSpace: 'normal',
                        wordWrap: 'break-word',
                        color: useReserveFund ? 'white' : 'inherit',
                      }}
                    >
                      Set a Reserve fund for this property
                    </Typography.Text>
                  </Button>
                  <Button
                    type={!useReserveFund ? 'primary' : 'default'}
                    onClick={() => setUseReserveFund(false)}
                    style={{
                      width: '150px',
                      height: '150px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      padding: '10px 10px 20px',
                    }}
                  >
                    <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <IconPigOff size={50} />
                    </div>
                    <Typography.Text
                      style={{
                        textAlign: 'center',
                        whiteSpace: 'normal',
                        wordWrap: 'break-word',
                        color: !useReserveFund ? 'white' : 'inherit',
                      }}
                    >
                      No Reserve fund for this property
                    </Typography.Text>
                  </Button>
                </div>
          
                {useReserveFund && (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      marginTop: '40px',
                      flexDirection: 'column',
                      alignItems: 'center',
                    }}
                  >
                    <div style={{ marginTop: '20px' }}>
                      <Input
                        placeholder="Enter reserve amount"
                        value={reserveAmount}
                        onChange={(e) => setReserveAmount(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
      case 5:
           
              return (
                <div>
                  <Title level={3} style={{ textAlign: 'center', marginBottom: '20px' }}>
                    Ownership of the Property
                  </Title>
                  <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    How is the Ownership of the property divided?
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                    <Button
                      type={useDefaultAccount ? 'primary' : 'default'}
                      onClick={() => {
                        setUseDefaultAccount(true);
                        setOwners([{ name: '', percentage: '' }]);
                      }}
                      style={{
                        marginRight: '10px',
                        width: '150px',
                        height: '150px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: '10px 10px 20px',
                      }}
                    >
                      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <DollarOutlined style={{ fontSize: '50px' }} />
                      </div>
                      <Typography.Text
                        style={{
                          textAlign: 'center',
                          whiteSpace: 'normal',
                          wordWrap: 'break-word',
                          color: useDefaultAccount ? 'white' : 'inherit',
                        }}
                      >
                        Full Ownership
                      </Typography.Text>
                    </Button>
                    <Button
                      type={!useDefaultAccount ? 'primary' : 'default'}
                      onClick={() => {
                        setUseDefaultAccount(false);
                        setOwners([{ name: '', percentage: '' }]);
                      }}
                      style={{
                        width: '150px',
                        height: '150px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: '10px 10px 20px',
                      }}
                    >
                      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <DollarOutlined style={{ fontSize: '50px' }} />
                      </div>
                      <Typography.Text
                        style={{
                          textAlign: 'center',
                          whiteSpace: 'normal',
                          wordWrap: 'break-word',
                          color: !useDefaultAccount ? 'white' : 'inherit',
                        }}
                      >
                        Multiple Owners
                      </Typography.Text>
                    </Button>
                  </div>
            
                  {!useDefaultAccount && (
        <div style={{ marginTop: '40px' }}>
          <Row gutter={[16, 16]} justify="center">
            {owners.map((owner, index) => (
              <Col key={index} xs={24} sm={12} md={8}>
                <Input
                  placeholder="Owner Name"
                  value={owner.name}
                  onChange={(e) => handleOwnerNameChange(index, e.target.value)}
                  style={{ marginBottom: '8px' }}
                />
                <Input
                  placeholder="Ownership Percentage"
                  value={owner.percentage}
                  onChange={(e) => handleOwnerPercentageChange(index, e.target.value)}
                  suffix="%"
                />
                {owners.length > 1 && (
                  <Button
                    type="link"
                    danger
                    onClick={() => removeOwner(index)}
                    style={{ marginTop: '8px' }}
                  >
                    Remove
                  </Button>
                )}
              </Col>
            ))}
          </Row>
          {!isPercentageValid && (
            <div style={{ color: 'red', textAlign: 'center', marginTop: '16px' }}>
              Total ownership percentage cannot exceed 100%.
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
            <Button type="dashed" onClick={addOwner}>
              + Add Owner
            </Button>
          </div>
        </div>
      )}
    </div>
  );
  case 6:
    return (
      <div>
        <Typography.Title level={3} style={{ textAlign: 'center', marginBottom: '20px' }}>
          Summary
        </Typography.Title>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          Please review your selections and confirm to proceed.
        </div>
        <div style={{ marginBottom: '20px' }}>
          <Typography.Title level={4}>Property Type:</Typography.Title>
          <Input value={propertyType} disabled />
        </div>
        <div style={{ marginBottom: '20px' }}>
          <Typography.Title level={4}>Property Description:</Typography.Title>
          <Input value={selectedDescription} disabled />
        </div>
        <div style={{ marginBottom: '20px' }}>
          <Typography.Title level={4}>Address:</Typography.Title>
          <Input
            value={`${form.getFieldValue('street1')}, ${form.getFieldValue('street2')}\n${form.getFieldValue('city')}, ${form.getFieldValue('state')}, ${form.getFieldValue('zip')}\n${form.getFieldValue('country')}`}
            disabled
          />
        </div>
        <div style={{ marginBottom: '20px' }}>
          <Typography.Title level={4}>Units:</Typography.Title>
          <Table
            bordered
            dataSource={units}
            columns={[
              {
                title: 'Unit',
                render: (_, __, index) => `Unit ${index + 1}`,
              },
              {
                title: 'Unit Name',
                dataIndex: 'unitName',
                key: 'unitName',
              },
              {
                title: 'Beds',
                dataIndex: 'beds',
                key: 'beds',
              },
              {
                title: 'Baths',
                dataIndex: 'baths',
                key: 'baths',
              },
              {
                title: 'Size',
                dataIndex: 'size',
                key: 'size',
              },
              {
                title: 'Market Rent',
                dataIndex: 'marketRent',
                key: 'marketRent',
              },
            ]}
            pagination={false}
          />
        </div>
        <div style={{ marginBottom: '20px' }}>
          <Typography.Title level={4}>Bank Account:</Typography.Title>
          <Input
            value={useDefaultAccount ? `Using company default account: ${defaultAccount}` : `Specific bank account: ${specificBankAccount}`}
            disabled
          />
        </div>
        <div style={{ marginBottom: '20px' }}>
          <Typography.Title level={4}>Reserve Fund:</Typography.Title>
          <Input
            value={useReserveFund ? `Reserve fund amount: ${reserveAmount}` : 'No reserve fund set for this property.'}
            disabled
          />
        </div>
        <div style={{ marginBottom: '20px' }}>
          <Typography.Title level={4}>Ownership:</Typography.Title>
          {useDefaultAccount ? (
            <Input value="Full Ownership" disabled />
          ) : (
            <div>
              {owners.map((owner, index) => (
                <Input
                  key={index}
                  value={`Owner ${index + 1}: ${owner.name} - ${owner.percentage}%`}
                  disabled
                />
              ))}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}></div>
      </div>
    );  
      
      
      
          default:
        return null;
    }
  };









  
  return (
    <div style={{ padding: '24px 36px' }}>
      <Steps current={current} className="custom-steps"  style={{ paddingLeft: '60px',paddingRight: '60px'}}> 
        {steps.map((item) => (
          <Step key={item.title} title={item.title} />
        ))}
      </Steps>
      <div className="steps-content" style={{ marginTop: '40px',paddingLeft: '60px',paddingRight: '60px'}}>
        {renderStepContent()}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', paddingLeft: '60px', paddingRight: '60px' }}>
        <div>
          <Button onClick={() => { resetForms(); navigate('/property'); }}>Cancel</Button>
        </div>
        <div>
          {current > 0 && <Button onClick={prev}>Previous</Button>}
          {current === 0 && <Button type="primary" onClick={next} disabled={!propertyType}>Next</Button>}
          {current > 0 && current < steps.length - 1 && <Button type="primary" onClick={next}>Next</Button>}
          {current === steps.length - 1 && <Button type="primary" onClick={handleFormSubmit}>Done</Button>}
        </div>
      </div>
    </div>
  );
};



export default AddNewProperty;