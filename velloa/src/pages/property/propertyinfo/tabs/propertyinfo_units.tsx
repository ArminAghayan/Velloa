import React, { useEffect, useState } from 'react';
import { Table, message, Button, Row, Col, Drawer, Form, Input, InputNumber, Steps, Upload, Typography, Select } from 'antd';
import { db } from '../../../../firebase-config';
import { collection, query, where, getDocs, addDoc, updateDoc } from 'firebase/firestore';
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

const PropertyInfoUnits: React.FC<PropertyInfoUnitsProps> = ({ propertyId }) => {
  const [units, setUnits] = useState<Unit[]>([]);
  const [filteredUnits, setFilteredUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [current, setCurrent] = useState(0);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchUnits = async () => {
      try {
        const unitsRef = collection(db, 'properties', propertyId, 'units');
        const unitsSnapshot = await getDocs(unitsRef);
        const fetchedUnits: Unit[] = unitsSnapshot.docs.map(doc => ({
          ...(doc.data() as Unit),
          unitId: doc.id,
          tenant: doc.data().tenant || 'Vacant'
        }));
        setUnits(fetchedUnits);
        setFilteredUnits(fetchedUnits);
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
  }, [searchText, filterStatus, units]);

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
    { title: 'Unit Number', dataIndex: 'unitName', key: 'unitName' },
    { title: 'Tenant', dataIndex: 'tenant', key: 'tenant' },
    { title: 'Beds', dataIndex: 'beds', key: 'beds' },
    { title: 'Baths', dataIndex: 'baths', key: 'baths' },
    { title: 'Market Rent', dataIndex: 'marketRent', key: 'marketRent' },
    { title: 'Size', dataIndex: 'size', key: 'size' },
  ];

  const handleRowClick = (unit: Unit) => {
    dispatch(setSelectedUnit(unit));
    navigate(`/propertyinfo/${propertyId}/unit/${unit.unitName}`);
  };

  const handleNewUnitClick = () => {
    setDrawerVisible(true);
  };

  const handleDrawerClose = () => {
    setDrawerVisible(false);
    setCurrent(0);
    form.resetFields();
  };

  const next = () => {
    form.validateFields().then(() => {
      setCurrent(current + 1);
    });
  };

  const prev = () => {
    setCurrent(current - 1);
  };

  const handleFormSubmit = async () => {
    try {
      const values = await form.validateFields();
      const newUnit: Unit = {
        unitId: uuidv4(),
        unitName: values.unitName,
        beds: values.beds,
        baths: values.baths,
        marketRent: values.marketRent,
        size: values.size,
        description: values.description,
        tenant: 'Vacant',
        images: values.images ? values.images.map((file: any) => URL.createObjectURL(file.originFileObj)) : [],
      };

      const unitsRef = collection(db, 'properties', propertyId, 'units');
      await addDoc(unitsRef, newUnit);

      setUnits(prevUnits => [...prevUnits, newUnit]);
      setFilteredUnits(prevFiltered => [...prevFiltered, newUnit]);
      message.success('Unit added successfully');
      handleDrawerClose();
    } catch (error) {
      console.error("Error adding unit: ", error);
      message.error("Failed to add unit. Please try again.");
    }
  };

  const steps = [
    { title: 'Basic Info' },
    { title: 'Additional Info' },
    { title: 'Review' },
  ];

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <>
            <Form.Item name="unitName" label="Unit Number" rules={[{ required: true, message: 'Please enter the unit number' }]}>
              <Input />
            </Form.Item>
            <Form.Item name="beds" label="Number of Beds" rules={[{ required: true, message: 'Please enter the number of beds' }]}>
              <InputNumber min={0} />
            </Form.Item>
            <Form.Item name="baths" label="Number of Baths" rules={[{ required: true, message: 'Please enter the number of baths' }]}>
              <InputNumber min={0} />
            </Form.Item>
            <Form.Item name="marketRent" label="Market Rent" rules={[{ required: true, message: 'Please enter the market rent' }]}>
              <InputNumber min={0} prefix="$" />
            </Form.Item>
            <Form.Item name="size" label="Size (sq ft)" rules={[{ required: true, message: 'Please enter the size' }]}>
              <InputNumber min={0} />
            </Form.Item>
          </>
        );
      case 1:
        return (
          <>
            <Form.Item name="description" label="Description">
              <Input.TextArea rows={4} />
            </Form.Item>
            <Form.Item name="images" label="Images" valuePropName="fileList" getValueFromEvent={(e) => Array.isArray(e) ? e : e?.fileList}>
              <Upload.Dragger multiple beforeUpload={() => false}>
                <p className="ant-upload-drag-icon"><UploadOutlined /></p>
                <p className="ant-upload-text">Click or drag file to this area to upload</p>
                <p className="ant-upload-hint">Support for multiple images</p>
              </Upload.Dragger>
            </Form.Item>
          </>
        );
      case 2:
        return (
          <>
            <Title level={4}>Review Information</Title>
            {['unitName', 'beds', 'baths', 'marketRent', 'size', 'description'].map((field) => (
              <div key={field} className="review-item">
                <Text strong>{field.charAt(0).toUpperCase() + field.slice(1)}:</Text>
                <Text>{form.getFieldValue(field)}</Text>
              </div>
            ))}
            <div className="review-item">
              <Text strong>Images:</Text>
              <Text>{form.getFieldValue('images')?.length || 0} images uploaded</Text>
            </div>
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
                  placeholder="Search units"
                  value={searchText}
                  onChange={handleSearchChange}
                />
              </Col>
              <Col>
                <Select
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
            <Button onClick={handleNewUnitClick} type="primary" icon={<PlusOutlined />}>
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
        width={720}
        onClose={handleDrawerClose}
        visible={drawerVisible}
        bodyStyle={{ paddingBottom: 80 }}
      >
        <Steps current={current}>
          {steps.map(item => (
            <Step key={item.title} title={item.title} />
          ))}
        </Steps>
        <Form form={form} layout="vertical" style={{ marginTop: '2rem' }}>
          {renderStepContent(current)}
        </Form>
        <div style={{ marginTop: '2rem' }}>
          {current > 0 && (
            <Button style={{ marginRight: 8 }} onClick={prev}>
              Previous
            </Button>
          )}
          {current < steps.length - 1 && (
            <Button type="primary" onClick={next}>
              Next
            </Button>
          )}
          {current === steps.length - 1 && (
            <Button type="primary" onClick={handleFormSubmit}>
              Submit
            </Button>
          )}
        </div>
      </Drawer>
    </div>
  );
};

export default PropertyInfoUnits;