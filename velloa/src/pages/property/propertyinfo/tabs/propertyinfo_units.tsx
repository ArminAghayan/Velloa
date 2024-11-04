import React, { useEffect, useState, useCallback } from 'react';
import { Table, message, Button, Row, Col, Drawer, Form, Input, InputNumber, Steps, Upload, Typography, Select } from 'antd';
import { db } from '../../../../firebase-config';
import { collection, getDocs, addDoc, updateDoc } from 'firebase/firestore';
import { UploadOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setSelectedUnit } from '../../../../components/redux/unitslice';
import { v4 as uuidv4 } from 'uuid';
import './propertyinfo_units.css';

const { Title, Text } = Typography;
const { Step } = Steps;
const { Option } = Select;

export interface Unit {
  unitId: string;
  unitName: string;
  occupancy?: string;
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
  const [formData, setFormData] = useState({});
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const fetchUnits = useCallback(async () => {
    setLoading(true);
    const unitsRef = collection(db, 'properties', propertyId, 'units');
    try {
      const unitsSnapshot = await getDocs(unitsRef);
      const fetchedUnits: Unit[] = unitsSnapshot.docs.map(doc => ({
        ...(doc.data() as Unit),
        unitId: doc.id,
        occupancy: doc.data().tenant || 'Vacant'
      }));
      setUnits(fetchedUnits);
      setFilteredUnits(fetchedUnits);
    } catch (error) {
      console.error("Error fetching units: ", error);
      message.error("Failed to fetch units. Please check your permissions.");
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);

  useEffect(() => {
    handleFilter();
  }, [searchText, filterStatus, units]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };

  const handleFilterChange = (value: string) => {
    setFilterStatus(value);
  };

  const handleFilter = useCallback(() => {
    let filtered = units;
    if (searchText) {
      filtered = filtered.filter(unit =>
        unit.unitName.toLowerCase().includes(searchText.toLowerCase())
      );
    }
    if (filterStatus) {
      filtered = filtered.filter(unit =>
        filterStatus === 'Occupied'
          ? unit.occupancy && unit.occupancy !== 'Vacant'
          : unit.occupancy === 'Vacant'
      );
    }
    setFilteredUnits(filtered);
  }, [units, searchText, filterStatus]);

  const columns = [
    { title: 'Unit Number', dataIndex: 'unitName', key: 'unitName' },
    { title: 'Tenant', dataIndex: 'occupancy', key: 'occupancy' },
    { title: 'Beds', dataIndex: 'beds', key: 'beds' },
    { title: 'Baths', dataIndex: 'baths', key: 'baths' },
    { title: 'Market Rent', dataIndex: 'marketRent', key: 'marketRent' },
    { title: 'Size', dataIndex: 'size', key: 'size' },
  ];

  const handleRowClick = (unit: Unit) => {
    dispatch(setSelectedUnit(unit));
    navigate(`/property/${propertyId}/unit/${unit.unitId}`);
  };

  const handleNewUnitClick = () => {
    setDrawerVisible(true);
    setCurrentStep(0);
    setVisibleSteps([0, 1]);
    form.resetFields();
    setFormData({});
  };

  const handleDrawerClose = () => {
    setDrawerVisible(false);
    setCurrentStep(0);
    setVisibleSteps([0, 1]);
    form.resetFields();
    setFormData({});
  };

  const handleNext = async () => {
    try {
      const values = await form.validateFields();
      console.log('Current step values:', values);

      setFormData(prevData => ({
        ...prevData,
        ...values
      }));

      const newCurrentStep = currentStep + 1;
      setCurrentStep(newCurrentStep);
      setVisibleSteps([newCurrentStep, newCurrentStep + 1]);
    } catch (error) {
      console.error('Validation Failed:', error);
    }
  };

  const handlePrev = () => {
    const newCurrentStep = currentStep - 1;
    setCurrentStep(newCurrentStep);
    setVisibleSteps([newCurrentStep - 1, newCurrentStep]);
  };

  const handleFormSubmit = async () => {
    try {
      const values = await form.validateFields();
      console.log('Final step values:', values);

      const allFormData = {
        ...formData,
        ...values
      };

      // Function to remove undefined values
      const removeUndefined = (obj: any): any => {
        Object.keys(obj).forEach(key => {
          if (obj[key] && typeof obj[key] === 'object') {
            removeUndefined(obj[key]);
          } else if (obj[key] === undefined) {
            delete obj[key];
          }
        });
        return obj;
      };

      const newUnit: Unit = removeUndefined({
        unitId: uuidv4(),
        unitName: allFormData.unitName ?? '',
        beds: allFormData.beds ?? 0,
        baths: allFormData.baths ?? 0,
        marketRent: allFormData.marketRent ?? 0,
        size: allFormData.size ?? 0,
        description: allFormData.description ?? '',
        images: allFormData.images ?? [],
        occupancy: 'Vacant',
      });

      console.log('New unit object:', newUnit);

      const unitsRef = collection(db, 'properties', propertyId, 'units');
      const docRef = await addDoc(unitsRef, newUnit);
      await updateDoc(docRef, { unitId: docRef.id });
      newUnit.unitId = docRef.id;

      setUnits(prevUnits => [...prevUnits, newUnit]);
      setFilteredUnits(prevFiltered => [...prevFiltered, newUnit]);
      message.success('Unit added successfully');
      handleDrawerClose();
    } catch (error) {
      console.error("Error adding unit: ", error);
      const errorMessage = (error as Error).message;
      message.error(`Failed to add unit: ${errorMessage || 'Unknown error'}`);
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <>
            <Form.Item
              name="unitName"
              label="Unit Number"
              rules={[{ required: true, message: 'Please enter Unit Number' }]}
            >
              <Input
                placeholder="Unit Number"
                onChange={(e) => form.setFieldsValue({ unitName: e.target.value })}
              />
            </Form.Item>
            <Form.Item 
              name="beds" 
              label="Number of Beds" 
              rules={[{ required: true, message: 'Please enter the number of beds' }]}
            >
              <InputNumber min={0} />
            </Form.Item>
            <Form.Item 
              name="baths" 
              label="Number of Baths" 
              rules={[{ required: true, message: 'Please enter the number of baths' }]}
            >
              <InputNumber min={0} />
            </Form.Item>
            <Form.Item 
              name="marketRent" 
              label="Market Rent" 
              rules={[{ required: true, message: 'Please enter the market rent' }]}
            >
              <InputNumber min={0} prefix="$" />
            </Form.Item>
            <Form.Item 
              name="size" 
              label="Size (sq ft)" 
              rules={[{ required: true, message: 'Please enter the size' }]}
            >
              <InputNumber min={0} />
            </Form.Item>
            <Form.Item style={{ textAlign: 'right' }}>
              <Button style={{ marginRight: 8 }} onClick={handlePrev} disabled={currentStep === 0}>
                Previous
              </Button>
              <Button type="primary" onClick={handleNext}>
                Next
              </Button>
            </Form.Item>
          </>
        );
      case 1:
        return (
          <>
            <Form.Item name="description" label="Description">
              <Input.TextArea rows={4} onChange={(e) => form.setFieldsValue({ description: e.target.value })} />
            </Form.Item>
            <Form.Item name="images" label="Images" valuePropName="fileList" getValueFromEvent={(e) => Array.isArray(e) ? e : e?.fileList}>
              <Upload.Dragger multiple beforeUpload={() => false}>
                <p className="ant-upload-drag-icon"><UploadOutlined /></p>
                <p className="ant-upload-text">Click or drag file to this area to upload</p>
                <p className="ant-upload-hint">Support for multiple images</p>
              </Upload.Dragger>
            </Form.Item>
            <Form.Item style={{ textAlign: 'right' }}>
              <Button style={{ marginRight: 8 }} onClick={handlePrev}>
                Previous
              </Button>
              <Button type="primary" onClick={handleNext}>
                Next
              </Button>
            </Form.Item>
          </>
        );
      case 2:
        return (
          <>
            <Title level={4}>Review Information</Title>
            <div className="review-item">
              <Text strong>Unit Number:</Text> <Text>{form.getFieldValue('unitName')}</Text>
            </div>
            <div className="review-item">
              <Text strong>Beds:</Text> <Text>{form.getFieldValue('beds')}</Text>
            </div>
            <div className="review-item">
              <Text strong>Baths:</Text> <Text>{form.getFieldValue('baths')}</Text>
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
            <Form.Item style={{ textAlign: 'right' }}>
              <Button style={{ marginRight: 8 }} onClick={handlePrev}>
                Previous
              </Button>
              <Button type="primary" htmlType="submit">
                Submit
              </Button>
            </Form.Item>
          </>
        );
      default:
        return null;
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
                  className='unit-search-input'
                  placeholder="Search units"
                  value={searchText}
                  onChange={handleSearchChange}
                />
              </Col>
              <Col>
                <Select
                  className='unit-dropdown-input'
                  placeholder="Filter by status"
                  onChange={handleFilterChange}
                  allowClear
                  style={{ width: 150 }}
                >
                  <Option value="Occupied">Occupied</Option>
                  <Option value="Vacant">Vacant</Option>
                </Select>
              </Col>
            </Row>
          </Col>
          <Col span={4} style={{ textAlign: 'right' }}>
            <Button 
            className='new-unit-button'
            onClick={handleNewUnitClick} 
            type="primary" 
            icon={<PlusOutlined />}>
              New Unit
            </Button>
          </Col>
        </Row>
        <Table
          columns={columns}
          dataSource={filteredUnits}
          loading={loading}
          onRow={(record) => ({
            onClick: () => handleRowClick(record),
          })}
          rowKey="unitId"
        />
      </div>

      <Drawer
        title="Add New Unit"
        width="50%"
        onClose={handleDrawerClose}
        visible={drawerVisible}
        bodyStyle={{ paddingBottom: 80 }}
      >
        <Steps current={currentStep} progressDot>
          <Step title="Basic Info" />
          <Step title="Additional Info" />
          <Step title="Review" />
        </Steps>
        <Form 
          form={form} 
          layout="vertical" 
          style={{ marginTop: '2rem' }}
          onFinish={handleFormSubmit}
        >
          {renderStepContent(currentStep)}
        </Form>
      </Drawer>
    </div>
  );
};

export default PropertyInfoUnits;
