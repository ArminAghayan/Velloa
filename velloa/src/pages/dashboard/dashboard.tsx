import React, { useState, useEffect, createContext, ReactElement } from 'react';
import { Button, Modal, Steps, Form, Input, Select, InputNumber, Space, message, Layout, Menu, Dropdown, Avatar, Typography, theme, Card, Col, Row, Table, Popconfirm } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined, SettingOutlined, LogoutOutlined, UserOutlined, BlockOutlined, UploadOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { db, auth } from '../../firebase-config';
import { collection, addDoc, query, where, getDocs,writeBatch, doc } from 'firebase/firestore';
import './dashboard.css';

// Define the property details and unit info interfaces
interface PropertyDetails {
  propertyName: string;
  address: {
    addressline: string;
    city: string;
    postal: string;
    province: string;
    country: string;
  };
  imageUrl?: string; // Assuming you'll manage the upload and set this
  numUnits: number;
}

interface Property {
  id: string;
  propertyName: string;
  imageUrl?: string;
  numUnits: number;
  // Add other property fields if necessary
}

interface UnitInfo {
  numberOfFloors: number;
  unitsPerFloor: number;
  unitNumberOffset?: number; // Optional offset for unit numbering
}

// We'll need a new interface for unit numbers to facilitate editing in the table
interface UnitNumber {
  key: string;
  floor: number;
  unit: number;
  customUnitNumber?: number; // Allows for custom unit number edits
}

interface EditableTableProps {
  unitNumbers: UnitNumber[];
  setUnitNumbers: React.Dispatch<React.SetStateAction<UnitNumber[]>>;
}

const { Header } = Layout;
const { Title } = Typography;
const { Step } = Steps;
const { Option } = Select;
const EditableContext = createContext<any | null>(null);

const EditableRow: React.FC<any> = ({ index, ...props }) => {
  const [form] = Form.useForm();
  return (
    <Form form={form} component={false}>
      <EditableContext.Provider value={form}>
        <tr {...props} />
      </EditableContext.Provider>
    </Form>
  );
};

const EditableCell: React.FC<any> = ({
  title,
  editable,
  children,
  dataIndex,
  record,
  ...restProps
}) => {
  const form = React.useContext(EditableContext);
  return (
    <td {...restProps}>
      {editable ? (
        <Form.Item
          name={dataIndex}
          style={{ margin: 0 }}
          rules={[{ required: true, message: `${title} is required.` }]}
        >
          <Input />
        </Form.Item>
      ) : (
        children
      )}
    </td>
  );
};

const DashboardPage: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<any>({ propertyDetails: {}, unitInfo: {} });
  const [companyDocId, setCompanyDocId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("Loading company...");
  const [properties, setProperties] = useState<Property[]>([]);
  const navigate = useNavigate();
  const [unitNumbers, setUnitNumbers] = useState<UnitNumber[]>([]);

  const handleGenerateUnitsClick = () => {
    const floors = formData.unitInfo.numberOfFloors;
    const unitsPerFloor = formData.unitInfo.unitsPerFloor;
    const offset = formData.unitInfo.unitNumberOffset || 100;
    const generatedUnits = generateUnitNumbers(floors, unitsPerFloor, offset);
    
    console.log(generatedUnits); // Debug: Check generated units
    setUnitNumbers(generatedUnits); // Update state with generated units
    next(); // Proceed to the next step
  };
  
  

  const handleCardClick = (property: Property) => {
    navigate('/home', { state: { property } });
  };

  const generateUnitNumbers = (floors: number, unitsPerFloor: number, offset: number = 100) => {
    let generatedUnits: UnitNumber[] = [];
    let unitNumber = offset;
  
    for (let floor = 1; floor <= floors; floor++) {
      for (let unit = 1; unit <= unitsPerFloor; unit++, unitNumber++) {
        generatedUnits.push({
          key: `${floor}-${unit}`,
          floor: floor,
          unit: unitNumber,
        });
      }
    }
    return generatedUnits;
  };
  

  useEffect(() => {
    const fetchUserCompany = async () => {
      if (auth.currentUser) {
        const userUid = auth.currentUser.uid;
        console.log("Fetching company for user ID:", userUid); // Debug log
        const companiesRef = collection(db, "companies");
        const q = query(companiesRef, where("uid", "==", userUid)); // Make sure 'uid' matches your Firestore structure
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const companyData = querySnapshot.docs[0].data();
          console.log("Company data found:", companyData); // Confirm this logs expected data
          setCompanyDocId(querySnapshot.docs[0].id);
          setCompanyName(companyData.companyName); // Assuming 'name' is the correct field
        } else {
          console.log("No company found for the user."); // Helpful for debugging
          setCompanyName("No company found."); // Update UI accordingly
        }
      }
    };

    fetchUserCompany();
  }, []);

  useEffect(() => {
    const fetchProperties = async () => {
      if (auth.currentUser && companyDocId) {
        const propertiesRef = collection(db, `companies/${companyDocId}/properties`);
        const snapshot = await getDocs(propertiesRef);

        if (!snapshot.empty) {
          const propertiesList: Property[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            propertyName: doc.data().propertyName, // Replace with your actual field name
            imageUrl: doc.data().imageUrl, // Replace with your actual field name
            numUnits: doc.data().numUnits, // Replace with your actual field name
          }));

          console.log("Properties found:", propertiesList);
          setProperties(propertiesList);
        } else {
          console.log("No properties found for this company.");
        }
      }
    };

    fetchProperties();
  }, [companyDocId]);

  const EditableCell = ({
    editing,
    dataIndex,
    title,
    inputType, // "number" or "text"
    record,
    index,
    children,
    ...restProps
  }: any) => {
    const inputNode = inputType === 'number' ? <InputNumber /> : <Input />;
    return (
      <td {...restProps}>
        {editing ? (
          <Form.Item
            name={dataIndex}
            style={{ margin: 0 }}
            rules={[
              {
                required: true,
                message: `Please Input ${title}!`,
              },
            ]}
          >
            {inputNode}
          </Form.Item>
        ) : (
          children
        )}
      </td>
    );
  };

  const EditableTable: React.FC<{ unitNumbers: UnitNumber[] }> = ({ unitNumbers }) => {
    const [form] = Form.useForm();
    const [editingKey, setEditingKey] = useState<string | number>('');
  
    const isEditing = (record: UnitNumber): boolean => record.key === editingKey;
  
    const edit = (record: UnitNumber): void => {
      form.setFieldsValue({ ...record });
      setEditingKey(record.key);
    };
  
    const cancel = (): void => {
      setEditingKey('');
    };
  
    const save = async (key: React.Key): Promise<void> => {
      try {
        const row = (await form.validateFields()) as UnitNumber;
  
        const newData = [...unitNumbers];
        const index = newData.findIndex((item) => key === item.key);
  
        if (index > -1) {
          const item = newData[index];
          newData.splice(index, 1, { ...item, ...row });
          setUnitNumbers(newData);
          setEditingKey('');
        } else {
          newData.push(row);
          setUnitNumbers(newData);
          setEditingKey('');
        }
      } catch (errInfo) {
        console.log('Validate Failed:', errInfo);
      }
    };

    const columns = [
      {
        title: 'Floor',
        dataIndex: 'floor',
        width: '25%',
        editable: true,
      },
      {
        title: 'Unit',
        dataIndex: 'unit',
        width: '25%',
        editable: true,
      },
      {
        title: 'Custom Unit Number',
        dataIndex: 'customUnitNumber',
        width: '25%',
        editable: true,
      },
    ];

    const mergedColumns = columns.map((col) => {
      if (!col.editable) {
        return col;
      }
      return {
        ...col,
        onCell: (record: UnitNumber) => ({
          record,
          inputType: col.dataIndex === 'floor' || col.dataIndex === 'unit' ? 'number' : 'text',
          dataIndex: col.dataIndex,
          title: col.title,
          editing: isEditing(record),
        }),
      };
    });

    return (
      <Form form={form} component={false}>
        <Table
          components={{
            body: {
              cell: EditableCell,
            },
          }}
          bordered
          dataSource={unitNumbers}
          columns={mergedColumns}
          rowClassName="editable-row"
          pagination={{
            onChange: cancel,
          }}
        />
      </Form>
    );
  };

  // Finish handlers for each step
  const onFinishPropertyDetails = (values: PropertyDetails) => {
    setFormData({ ...formData, propertyDetails: values });
    next();
  };

  const onFinishUnitInfo = async (values: UnitInfo) => {
    if (!auth.currentUser || !companyDocId) {
      message.error("You must be logged in and have a company selected to perform this action.");
      return;
    }
  
    try {
      // Reference to the properties collection
      const propertyRef = collection(db, `companies/${companyDocId}/properties`);
      // Add the property
      const propertyDocRef = await addDoc(propertyRef, {
        ...formData.propertyDetails,
        ...values,
      });
  
      // Prepare to add unit numbers to Firestore under the specific property
      const batch = writeBatch(db); // Using a batch to perform all additions in a single operation
  
      // Iterate over each unit number to add
      unitNumbers.forEach((unit) => {
        // Generate the reference for a new document within the units collection for the property
        const unitRef = doc(collection(db, `companies/${companyDocId}/properties/${propertyDocRef.id}/propertyunits/units`));
        batch.set(unitRef, unit); // Prepare to set the unit data
      });
  
      await batch.commit(); // Commit the batch operation
  
      message.success("Property and units added successfully!");
      resetFormAndHideModal();
    } catch (error) {
      console.error("Error adding document: ", error);
      message.error("An error occurred while adding the property and units.");
    }
  };
  
  
  

  // Helper functions
  const showModal = () => setIsModalVisible(true);
  const handleCancel = () => resetFormAndHideModal();
  const next = () => setCurrentStep(currentStep + 1);
  const prev = () => setCurrentStep(currentStep - 1);
  const resetFormAndHideModal = () => {
    setIsModalVisible(false);
    setCurrentStep(0);
    setFormData({ propertyDetails: {}, unitInfo: {} });
  };

  // Dropdown menu for user options
  const dropdownMenu = (
    <Menu>
      <Menu.Item icon={<SettingOutlined />}><Link to="/settings">Settings</Link></Menu.Item>
      <Menu.Item icon={<BlockOutlined />}><Link to="/dashboard">Overview</Link></Menu.Item>
      <Menu.Item icon={<LogoutOutlined />}><Link to="/logout">Logout</Link></Menu.Item>
    </Menu>
  );

  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const steps = [
    {
      title: 'Property Details',
      content: (
        <Form layout="vertical" onFinish={onFinishPropertyDetails} initialValues={formData.propertyDetails}>
          <Form.Item name="propertyName" label="Property Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item
            name={['address', 'addressline']}
            label="Address"
            rules={[{ required: true, message: 'Please input your street!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name={['address', 'city']}
            label="City"
            rules={[{ required: true, message: 'Please input your city!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name={['address', 'postal']}
            label="Postal / Zip Code"
            rules={[{ required: true, message: 'Please input your postal or zip code!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name={['address', 'province']}
            label="Province / State"
            rules={[{ required: true, message: 'Please input your province or state!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name={['address', 'country']}
            label="Country"
            rules={[{ required: true, message: 'Please select your country!' }]}
          >
            <Select showSearch>
              {/* Populate with your list of countries */}
              <Select.Option value="USA">USA</Select.Option>
              <Select.Option value="Canada">Canada</Select.Option>
              {/* Add more options as needed */}
            </Select>
          </Form.Item>
          <Button type="primary" htmlType="submit">Next</Button>
        </Form>
      ),
    },
    {
      title: 'Units Info',
      content: (
        <Form layout="vertical" onFinish={onFinishUnitInfo}>
          {/* Existing inputs for floors and units per floor */}
          <Form.Item name="numberOfFloors" label="Number of Floors" rules={[{ required: true }]}>
            <InputNumber min={1} />
          </Form.Item>
          <Form.Item name="unitsPerFloor" label="Units per Floor" rules={[{ required: true }]}>
            <InputNumber min={1} />
          </Form.Item>
          {/* Add input for optional unit number offset */}
          <Form.Item name="unitNumberOffset" label="Unit Number Offset (Optional)">
            <InputNumber />
          </Form.Item>
          {/* Button to generate units */}
          <Button type="primary" onClick={handleGenerateUnitsClick}>Next</Button>
        </Form>
      ),
    },
    {
      title: 'Review Units',
      content: (
        <div>
             <EditableTable unitNumbers={unitNumbers} />

      <Button type="primary" onClick={() => next()}>Next</Button>
    </div>
      ),
    },
    {
      title: 'Finish',
      content: (
        <div>
          <p>All steps completed - you&apos;re finished</p>
          <Button type="primary" onClick={() => onFinishUnitInfo(formData.unitInfo)}>Done</Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <Header style={{ display: 'flex', alignItems: 'center', padding: '0 20px', background: '#f0f2f5', borderBottom: '1px solid #e8e8e8' }}>
        <img src="/assests/light_mode_velloa_logo.png" alt="Logo" style={{ maxWidth: '100%', maxHeight: '24px' }} />
        <Title level={4} style={{ margin: 0, flex: 1 }}>Velloa</Title>
        <Button type="primary" onClick={showModal} style={{ marginRight: 20 }}>Add Property</Button>
        <div style={{ marginLeft: 'auto', padding: '0 20px' }}> {/* Apply padding to this wrapper div */}
          <Dropdown overlay={dropdownMenu} trigger={['click']}>
            <Avatar style={{ backgroundColor: '#1677FF' }} icon={<UserOutlined />} />
          </Dropdown>
        </div>
      </Header>
      <div className="site-card-wrapper">
        <Row gutter={20}>
          {properties.map((property) => (
            <Col key={property.id} span={6}> {/* Reduced span from 8 to 6 for smaller width */}
              <Card
                hoverable
                onClick={() => handleCardClick(property)}
                cover={<img alt={property.propertyName} src={property.imageUrl || '/assests/defualtpropimage.jpg'} />}
              >
                <Card.Meta
                  title={<Title level={4} style={{ margin: 0 }}>{property.propertyName}</Title>}
                  description={`${property.numUnits} units`}
                />
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      <Modal title="Add Property" visible={isModalVisible} onCancel={handleCancel} footer={null} width="1200px">
        <Steps current={currentStep}>
          {steps.map((item) => (
            <Step key={item.title} title={item.title} />
          ))}
        </Steps>
        <div className="steps-content">{steps[currentStep].content}</div>
        <div className="steps-action">
          {currentStep > 0 && (
            <Button style={{ margin: '0 8px' }} onClick={() => prev()}>
              Previous
            </Button>
          )}
        </div>
      </Modal>
    </>
  );
};

export default DashboardPage;
