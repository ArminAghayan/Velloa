import React, { useEffect, useState } from 'react';
import { Table, message, Button, Row, Col, Drawer, Form, Input, InputNumber, Steps, Upload, Typography, Select } from 'antd';
import { db } from '../../../../firebase-config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { UploadOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setSelectedUnit } from '../../../../components/redux/unitslice'; // Corrected path
import './propertyinfo_units.css';

export interface Unit {
  unitName: string;
  tenant?: string;
  beds: number;
  baths: number;
  marketRent: number;
  size: number;
  description?: string;
  images?: string[];
}

interface PropertyInfoUnitsProps {
  propertyId: string;
}

const { Step } = Steps;
const { Title, Text } = Typography;
const { Option } = Select;

const PropertyInfoUnits: React.FC<PropertyInfoUnitsProps> = ({ propertyId }) => {
  const [units, setUnits] = useState<Unit[]>([]);
  const [filteredUnits, setFilteredUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [visibleSteps, setVisibleSteps] = useState([0, 1]);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchUnits = async () => {
      try {
        const propertyRef = doc(db, 'properties', propertyId);
        const propertyDoc = await getDoc(propertyRef);
        if (propertyDoc.exists()) {
          const data = propertyDoc.data();
          const unitsWithVacant = (data.units || []).map((unit: Unit) => ({
            ...unit,
            tenant: unit.tenant || 'Vacant'
          }));
          setUnits(unitsWithVacant);
          setFilteredUnits(unitsWithVacant);
        } else {
          console.log("No such document!");
        }
      } catch (error) {
        console.error("Error fetching units: ", error);
        message.error("Failed to fetch units. Please check your permissions.");
      } finally {
        setLoading(false);
      }
    };

    fetchUnits();
  }, [propertyId]);

  useEffect(() => {
    handleFilter();
  }, [searchText, filterStatus]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };

  const handleFilterChange = (value: string) => {
    setFilterStatus(value);
  };

  const handleFilter = () => {
    let filtered = units;
    if (searchText) {
      filtered = filtered.filter(unit =>
        unit.unitName.toLowerCase().includes(searchText.toLowerCase())
      );
    }
    if (filterStatus) {
      filtered = filtered.filter(unit =>
        filterStatus === 'Occupied'
          ? unit.tenant && unit.tenant !== 'Vacant'
          : unit.tenant === 'Vacant'
      );
    }
    setFilteredUnits(filtered);
  };

  const columns = [
    {
      title: 'Unit Number',
      dataIndex: 'unitName',
      key: 'unitName',
    },
    {
      title: 'Tenant',
      dataIndex: 'tenant',
      key: 'tenant',
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
      title: 'Market Rent',
      dataIndex: 'marketRent',
      key: 'marketRent',
    },
    {
      title: 'Size',
      dataIndex: 'size',
      key: 'size',
    },
  ];

  const handleRowClick = (unit: Unit) => {
    dispatch(setSelectedUnit(unit));
    navigate(`/propertyinfo/${unit.unitName}`);
  };

  const handleNewUnitClick = () => {
    setDrawerVisible(true);
  };

  const handleDrawerClose = () => {
    setDrawerVisible(false);
    setCurrentStep(0);
    setVisibleSteps([0, 1]);
    form.resetFields();
  };

  const handleNext = () => {
    form
      .validateFields()
      .then(() => {
        const newCurrentStep = currentStep + 1;
        setCurrentStep(newCurrentStep);
        setVisibleSteps([newCurrentStep, newCurrentStep + 1]);
      })
      .catch((error) => {
        console.error('Validation Failed:', error);
      });
  };

  const handlePrev = () => {
    const newCurrentStep = currentStep - 1;
    setCurrentStep(newCurrentStep);
    setVisibleSteps([newCurrentStep - 1, newCurrentStep]);
  };

  const handleFormSubmit = async () => {
    try {
      const values = await form.validateFields();
      console.log('Form Values:', values);  // Debugging the form values
  
      const propertyRef = doc(db, 'properties', propertyId);
      const propertyDoc = await getDoc(propertyRef);
      if (propertyDoc.exists()) {
        const data = propertyDoc.data();
        if (!data.units) {
          data.units = [];
        }
        const updatedUnits = [...(data.units || []), values];
        console.log('Updated Units:', updatedUnits);  // Debugging the updated units
  
        await updateDoc(propertyRef, { units: updatedUnits });
  
        setUnits(updatedUnits);
        setFilteredUnits(updatedUnits);
        message.success('Unit added successfully');
        form.resetFields();
        setDrawerVisible(false);
        setCurrentStep(0);
        setVisibleSteps([0, 1]);
      } else {
        console.log("No such document!");
      }
    } catch (error) {
      console.error("Error adding unit: ", error);
      message.error("Failed to add unit. Please check your permissions.");
    }
  };
  
  
  

  return (
    <div className="units-container">
      <div className="units-box">
        <Row gutter={16} justify="space-between" align="middle" style={{ marginBottom: '16px' }}>
          <Col span={16}>
            <Row gutter={16}>
              <Col>
                <Input
                  className="unit-search-input"
                  placeholder="Search units"
                  value={searchText}
                  onChange={handleSearchChange}
                />
              </Col>
              <Col>
                <Select
                  className="unit-dropdown-input"
                  placeholder="Filter by status"
                  onChange={handleFilterChange}
                  allowClear
                >
                  <Option value="Occupied">Occupied</Option>
                  <Option value="Vacant">Vacant</Option>
                </Select>
              </Col>
            </Row>
          </Col>
          <Col span={4} style={{ textAlign: 'right' }}>
            <Button type="default" className="new-unit-button" onClick={handleNewUnitClick}>
              <PlusOutlined /> New Unit
            </Button>
          </Col>
        </Row>
        <Table
          columns={columns}
          dataSource={filteredUnits}
          loading={loading}
          onRow={(record) => {
            return {
              onClick: () => {
                handleRowClick(record);
              },
            };
          }}
        />
      </div>

      <Drawer
        title="New Unit"
        width={600}
        onClose={handleDrawerClose}
        visible={drawerVisible}
        bodyStyle={{ paddingBottom: 80 }}
      >
        <Steps current={currentStep} progressDot>
          <Step title="General Info" />
          <Step title="Additional Info" />
          <Step title="Review" />
        </Steps>
        <Form layout="vertical" form={form} onFinish={handleFormSubmit}>
  {visibleSteps.includes(0) && currentStep === 0 && (
    <div style={{ marginTop: '24px' }}>
      <Form.Item
        name="unitName"
        label="Unit Number"
        rules={[{ required: true, message: 'Please enter the unit number' }]}
        className="unitdrawerinput"
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="beds"
        label="Number of Beds"
        rules={[{ required: true, message: 'Please enter the number of beds' }]}
        className="unitdrawerinput"
      >
        <InputNumber min={0} className="unitdrawerinput" />
      </Form.Item>
      <Form.Item
        name="baths"
        label="Number of Baths"
        rules={[{ required: true, message: 'Please enter the number of baths' }]}
        className="unitdrawerinput"
      >
        <InputNumber min={0} className="unitdrawerinput" />
      </Form.Item>
      <Form.Item
        name="marketRent"
        label="Market Rent"
        rules={[{ required: true, message: 'Please enter the market rent' }]}
        className="unitdrawerinput"
      >
        <InputNumber min={0} className="unitdrawerinput" />
      </Form.Item>
      <Form.Item
        name="size"
        label="Size"
        rules={[{ required: true, message: 'Please enter the size' }]}
        className="unitdrawerinput"
      >
        <InputNumber min={0} className="unitdrawerinput" />
      </Form.Item>
      <Form.Item>
        <Button type="primary" onClick={handleNext}>
          Next
        </Button>
      </Form.Item>
    </div>
  )}
  {visibleSteps.includes(1) && currentStep === 1 && (
    <div style={{ marginTop: '24px' }}>
      <Form.Item
        name="description"
        label="Description"
        rules={[{ required: false, message: 'Please enter a description' }]}
        className="unitdrawerinput"
      >
        <Input.TextArea rows={4} />
      </Form.Item>
      <Form.Item
        name="images"
        label="Images"
        valuePropName="fileList"
        getValueFromEvent={e => (Array.isArray(e) ? e : e && e.fileList)}
        rules={[{ required: false, message: 'Please upload images' }]}
      >
        <Upload.Dragger name="files" multiple={true} beforeUpload={() => false}>
          <p className="ant-upload-drag-icon">
            <UploadOutlined />
          </p>
          <p className="ant-upload-text">Click or drag file to this area to upload</p>
          <p className="ant-upload-hint">Support for multiple images</p>
        </Upload.Dragger>
      </Form.Item>
      <Form.Item>
        <Button style={{ marginRight: 8 }} onClick={handlePrev}>
          Previous
        </Button>
        <Button type="primary" onClick={handleNext}>
          Next
        </Button>
      </Form.Item>
    </div>
  )}
  {visibleSteps.includes(2) && currentStep === 2 && (
    <div style={{ marginTop: '24px' }}>
      <Title level={4}>Review Information</Title>
      <div className="review-item">
        <Text strong>Unit Number:</Text> <Text>{form.getFieldValue('unitName')}</Text>
      </div>
      <div className="review-item">
        <Text strong>Number of Beds:</Text> <Text>{form.getFieldValue('beds')}</Text>
      </div>
      <div className="review-item">
        <Text strong>Number of Baths:</Text> <Text>{form.getFieldValue('baths')}</Text>
      </div>
      <div className="review-item">
        <Text strong>Market Rent:</Text> <Text>{form.getFieldValue('marketRent')}</Text>
      </div>
      <div className="review-item">
        <Text strong>Size:</Text> <Text>{form.getFieldValue('size')}</Text>
      </div>
      <div className="review-item">
        <Text strong>Description:</Text> <Text>{form.getFieldValue('description')}</Text>
      </div>
      <div className="review-item">
        <Text strong>Images:</Text> <Text>{form.getFieldValue('images')?.length || 0} images uploaded</Text>
      </div>
      <Form.Item>
        <Button style={{ marginRight: 8 }} onClick={handlePrev}>
          Previous
        </Button>
        <Button type="primary" htmlType="submit">
          Submit
        </Button>
      </Form.Item>
    </div>
  )}
</Form>


      </Drawer>
    </div>
  );
};

export default PropertyInfoUnits;
