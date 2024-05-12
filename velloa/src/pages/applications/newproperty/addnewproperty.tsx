import React, { useState } from 'react';
import { BankOutlined, DollarOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { Typography, Steps, Button, Input, Select, Tag, message, Form, Row, Col } from 'antd';
import { useNavigate } from 'react-router-dom';
import './addnewproperty.css';
import { Link } from 'react-router-dom';
import { IconPig } from '@tabler/icons-react';
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
  const [defaultAccount] = useState('Noam\'s bank');
  const [useReserveFund, setUseReserveFund] = useState(false);
  const [reserveAmount, setReserveAmount] = useState('');
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const handleDescriptionClick = (description: string) => {
    if (selectedDescription === description) {
      setSelectedDescription('');
    } else {
      setSelectedDescription(description);
    }
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
  ];

  
  const next = () => {
    if (current === 0 && !propertyType) {
      message.error({
        content: 'Please select a property type',

      });
      return;
    }
  
    if (current === 1) {
      form.validateFields().then(() => {
        // All fields are valid, proceed to the next step
        setCurrent(current + 1);
      }).catch((errorInfo) => {
        // There are validation errors, show error messages for each field
        const errorFields = errorInfo.errorFields;
        form.setFields(errorFields);
       
      });
      return;
    }
  
    if (current === 2) {
      if (units.length === 0) {
        message.error({
          content: 'Please add at least one unit',
          style: {
            marginTop: '80vh',
          },
        });
        return;
      }
    
      form.validateFields().then(() => {
        // All fields are valid, proceed to the next step
        setCurrent(current + 1);
      }).catch((errorInfo) => {
        // There are validation errors, Ant Design will display error messages next to the corresponding form items
      });
    
      return;
    }
  
    if (current === 3 && !useDefaultAccount && specificBankAccount.trim() === '') {
      message.error({
        content: 'Please specify a bank account',

      });
      return;
    }
  
    setCurrent(current + 1);
  };





  const prev = () => {
    setCurrent(current - 1);
  };

  const handlePropertyTypeClick = (type: string) => {
    if (propertyType === type) {
      setPropertyType('');
      setSelectedDescription('');
    } else {
      setPropertyType(type);
      setSelectedDescription('');
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
                      <IconPig size={50} />
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
                      <IconPig size={50} />
                    </div>
                    <Typography.Text
                      style={{
                        textAlign: 'center',
                        whiteSpace: 'normal',
                        wordWrap: 'break-word',
                        color: !useReserveFund ? 'white' : 'inherit',
                      }}
                    >
                      Do not set a Reserve fund for this property
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
                  How is the Ownership of the property divied?
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
                      Multiple Owners
                    </Typography.Text>
                  </Button>
                </div>

          
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
             
      
      
      
      
          default:
        return null;
    }
  };









  
  return (
    <div>
      <Steps current={current} className="custom-steps"  style={{ paddingLeft: '60px',paddingRight: '60px'}}> 
        {steps.map((item) => (
          <Step key={item.title} title={item.title} />
        ))}
      </Steps>
      <div className="steps-content" style={{ marginTop: '40px',paddingLeft: '60px',paddingRight: '60px'}}>
        {renderStepContent()}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px',paddingLeft: '60px',paddingRight: '60px' }}>
        <div>
          <Button onClick={() => { resetForms(); navigate('/property'); }}>Cancel</Button>
        </div>
        <div>
          {current > 0 && <Button onClick={prev}>Previous</Button>}
          {current === 0 && <Button type="primary" onClick={next} disabled={!propertyType}>Next</Button>}
          {current > 0 && current < steps.length - 1 && <Button type="primary" onClick={next}>Next</Button>}
          {current === steps.length - 1 && <Button type="primary" onClick={() => navigate('/propertyinfo')}>Done</Button>}
        </div>
      </div>
    </div>
  );
};



export default AddNewProperty;