import React, { useState } from 'react';
import { Typography, Steps, Button, Input, Select } from 'antd';
import { useNavigate } from 'react-router-dom';
import './addnewproperty.css';

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
  const navigate = useNavigate();

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
          <div>
            <Input placeholder="Street 1"  />
            <Input placeholder="Street 2" />
            <Input placeholder="City"/>
            <Select
            placeholder="Select Country"
            style={{ width: '100%' }}
          >
            <Option value="usa">USA</Option>
            <Option value="canada">Canada</Option>
          </Select>
          <Select
            placeholder="State/Province"
            style={{ width: '100%' }}
          >
            <Option value="ontario">Ontario</Option>
            <Option value="quebec">Quebec</Option>
          </Select>
            <Input placeholder="Zip/Postal Code" />
          </div>
        );
        case 2:
          return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <h3>Let's add the units for the property</h3>
              <p>Add all your units below.</p>
  
              {units.map((unit, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ marginRight: '10px' }}>
                    {index + 1}
                  </div>
                  <Input
                    placeholder="Unit Name"
                    value={unit.unitName}
                    onChange={(e) => handleUnitChange(index, 'unitName', e.target.value)}
                    style={{ width: '200px', marginRight: '10px', fontSize: '16px' }}
                  />
                  <Input
                    placeholder="Beds"
                    value={unit.beds}
                    onChange={(e) => handleUnitChange(index, 'beds', e.target.value)}
                    style={{ width: '120px', marginRight: '10px', fontSize: '16px' }}
                  />
                  <Input
                    placeholder="Baths"
                    value={unit.baths}
                    onChange={(e) => handleUnitChange(index, 'baths', e.target.value)}
                    style={{ width: '200px', marginRight: '10px', fontSize: '16px' }}
                  />
                  <Input
                    placeholder="Size"
                    value={unit.size}
                    onChange={(e) => handleUnitChange(index, 'size', e.target.value)}
                    style={{ width: '200px', marginRight: '10px', fontSize: '16px' }}
                  />
                  <Input
                    placeholder="Market Rent"
                    value={unit.marketRent}
                    onChange={(e) => handleUnitChange(index, 'marketRent', e.target.value)}
                    style={{ width: '200px', marginRight: '10px', fontSize: '16px' }}
                  />
                  {index !== 0 && <Button danger onClick={() => removeUnit(index)}>X</Button>}
                </div>
              ))}
  
              <Button type="dashed" onClick={addAnotherUnit} style={{ marginTop: '20px' }}>
                + Add Another Unit
              </Button>
            </div>
          );
      // Add cases for other steps
      default:
        return null;
    }
  };

  return (
    <div>
      <Steps current={current} className="custom-steps">
        {steps.map(item => (
          <Step key={item.title} title={item.title} />
        ))}
      </Steps>
      <div className="steps-content" style={{ marginTop: '40px' }}>
        {renderStepContent()}
      </div>
      <div className="steps-action" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
        <div>
          {current > 0 && (
            <Button onClick={prev}>
              Previous
            </Button>
          )}
        </div>
        <div>
          {current === 0 && (
            <Button type="primary" onClick={next} disabled={!propertyType}>
              Next
            </Button>
          )}
          {current > 0 && current < steps.length - 1 && (
            <Button type="primary" onClick={next}>
              Next
            </Button>
          )}
          {current === steps.length - 1 && (
            <Button type="primary" onClick={() => navigate('/propertyinfo')}>
              Done
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddNewProperty;