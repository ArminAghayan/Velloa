import React, { useState, useEffect } from 'react';
import { Table, Input, Button, Modal, Form, Select, SelectProps,Typography } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { db } from '../../../../firebase-config';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../components/redux/store';

const { Title } = Typography;

interface Package {
  id: string;
  unitNumber: string;
  numberOfPackages: number;
  pickedUp: boolean;
}

interface Unit {
  id: string;
  unitNumber?: string | number | null;
  floor?: string | number | null;
  unitPrice?: string | number | null;
}

const SearchableSelect: React.FC<SelectProps<number>> = ({ ...props }) => {
  return (
    <Select
      showSearch
      filterOption={(input, option) =>
        option?.value?.toString().includes(input) || false
      }
      {...props}
    />
  );
};

const PackagesPage: React.FC = () => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [units, setUnits] = useState<Unit[]>([]);
  const [form] = Form.useForm();
  const selectedProperty = useSelector((state: RootState) => state.property.selectedProperty);

  useEffect(() => {
    const fetchPackages = async () => {
      if (selectedProperty && selectedProperty.id) {
        try {
          const packagesRef = collection(db, `properties/${selectedProperty.id}/packages`);
          const snapshot = await getDocs(packagesRef);
          const packagesData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Package[];
          setPackages(packagesData);
        } catch (error) {
          console.error('Error fetching packages:', error);
        }
      }
    };

    const fetchUnits = async () => {
      if (selectedProperty && selectedProperty.id) {
        try {
          const unitsRef = collection(db, `properties/${selectedProperty.id}/units`);
          const unitsSnapshot = await getDocs(unitsRef);
          const unitsData: Unit[] = unitsSnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              unitNumber: typeof data.unitNumber === 'string' || typeof data.unitNumber === 'number' ? data.unitNumber : undefined,
              floor: typeof data.floor === 'string' || typeof data.floor === 'number' ? data.floor : undefined,
              unitPrice: typeof data.unitPrice === 'string' || typeof data.unitPrice === 'number' ? data.unitPrice : undefined,
            };
          });
          setUnits(unitsData);
        } catch (error) {
          console.error('Error fetching units:', error);
        }
      }
    };

    fetchPackages();
    fetchUnits();
  }, [selectedProperty]);

  const handleSearch = (value: string) => {
    setSearchValue(value);
  };

  const handlePackageStatus = async (packageId: string, pickedUp: boolean) => {
    if (selectedProperty && selectedProperty.id) {
      try {
        if (pickedUp) {
          await deleteDoc(doc(db, `properties/${selectedProperty.id}/packages`, packageId));
          setPackages(packages.filter((item) => item.id !== packageId));
        } else {
          await updateDoc(doc(db, `properties/${selectedProperty.id}/packages`, packageId), {
            pickedUp: true,
          });
          setPackages(packages.map((item) => (item.id === packageId ? { ...item, pickedUp: true } : item)));
        }
      } catch (error) {
        console.error('Error updating package:', error);
      }
    }
  };

  const columns = [
    {
      title: 'Unit Number',
      dataIndex: 'unitNumber',
      key: 'unitNumber',
    },
    {
      title: 'Number of Packages',
      dataIndex: 'numberOfPackages',
      key: 'numberOfPackages',
    },
    {
      title: 'Picked Up',
      key: 'pickedUp',
      render: (_: any, record: Package) => (
        <Button
          type="primary"
          onClick={() => handlePackageStatus(record.id, record.pickedUp)}
          icon={record.pickedUp ? <DeleteOutlined /> : undefined}
        >
          {record.pickedUp ? 'Delete' : 'Picked Up'}
        </Button>
      ),
    },
  ];

  const handleAddPackage = async (values: any) => {
    const { unitNumber, numberOfPackages } = values;

    if (selectedProperty && selectedProperty.id) {
      try {
        const newPackage: Omit<Package, 'id'> = {
          unitNumber,
          numberOfPackages: parseInt(numberOfPackages, 10),
          pickedUp: false,
        };

        const docRef = await addDoc(collection(db, `properties/${selectedProperty.id}/packages`), newPackage);
        setPackages([...packages, { id: docRef.id, ...newPackage }]);
        setModalVisible(false);
        form.resetFields();
      } catch (error) {
        console.error('Error adding package:', error);
      }
    }
  };

  const filteredPackages = packages.filter((item) =>
    item.unitNumber.toLowerCase().includes(searchValue.toLowerCase())
  );

  return (
    <div>
      <Title level={2}>Packages</Title>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Input
          placeholder="Search by unit number"
          value={searchValue}
          onChange={(e) => handleSearch(e.target.value)}
          style={{ width: 300 }}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)} >
          Add Package
        </Button>
      </div>
      <Table size='small' columns={columns} dataSource={filteredPackages} rowKey="id" />
      <Modal
        visible={modalVisible}
        title="Add Package"
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form form={form} onFinish={handleAddPackage}>
          <Form.Item
            name="unitNumber"
            label="Unit Number"
            rules={[{ required: true, message: 'Please select a unit' }]}
          >
            <SearchableSelect>
              {units.map((unit) => (
                <Select.Option key={unit.id} value={unit.unitNumber?.toString() ?? ''}>
                  {unit.unitNumber?.toString() ?? ''}
                </Select.Option>
              ))}
            </SearchableSelect>
          </Form.Item>
          <Form.Item
            name="numberOfPackages"
            label="Number of Packages"
            rules={[{ required: true, message: 'Please enter the number of packages' }]}
          >
            <Input type="number" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Submit
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PackagesPage;