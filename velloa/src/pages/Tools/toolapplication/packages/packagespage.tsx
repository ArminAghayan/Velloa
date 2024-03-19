import React, { useState, useEffect } from 'react';
import { Table, Input, Button, Modal, Form } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { db, auth } from '../../../../firebase-config';
import { collection, addDoc, getDocs, doc, deleteDoc, query, where,updateDoc } from 'firebase/firestore';

interface Package {
  id: string;
  unitNumber: string;
  numberOfPackages: number;
  pickedUp: boolean;
}

const PackagesPage: React.FC = () => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [companyDocId, setCompanyDocId] = useState('');
  const [propertyDocId, setPropertyDocId] = useState('');

  useEffect(() => {
    const fetchCompanyAndProperty = async () => {
      if (auth.currentUser) {
        const userUid = auth.currentUser.uid;
        const companiesRef = collection(db, 'companies');
        const companyQuery = query(companiesRef, where('uid', '==', userUid));
        const companySnapshot = await getDocs(companyQuery);

        if (!companySnapshot.empty) {
          const companyDoc = companySnapshot.docs[0];
          const companyId = companyDoc.id;
          setCompanyDocId(companyId);

          const propertiesRef = collection(db, `companies/${companyId}/properties`);
          const propertySnapshot = await getDocs(propertiesRef);

          if (!propertySnapshot.empty) {
            const propertyDoc = propertySnapshot.docs[0];
            const propertyId = propertyDoc.id;
            setPropertyDocId(propertyId);
          }
        }
      }
    };
    fetchCompanyAndProperty();
  }, []);

  useEffect(() => {
    const fetchPackages = async () => {
      if (companyDocId && propertyDocId) {
        const packagesRef = collection(db, `companies/${companyDocId}/properties/${propertyDocId}/tools/package/packageid`);
        const snapshot = await getDocs(packagesRef);
        const packagesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Package[];
        setPackages(packagesData);
      }
    };

    fetchPackages();
  }, [companyDocId, propertyDocId]);

  const handleSearch = (value: string) => {
    setSearchValue(value);
  };

  const handlePickedUp = async (packageId: string) => {
    await deleteDoc(doc(db, `companies/${companyDocId}/properties/${propertyDocId}/tools/package/packageid`, packageId));
    setPackages(packages.filter((item) => item.id !== packageId));
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
          onClick={() => handlePickedUp(record.id)}
        >
          Confirm
        </Button>
      ),
    },
  ];

  const handleAddPackage = async (values: any) => {
    const { unitNumber, numberOfPackages } = values;
  
    // Parse numberOfPackages as an integer
    const parsedNumberOfPackages = parseInt(numberOfPackages, 10);
  
    // Check if a package with the same unit number already exists
    const existingPackage = packages.find((item) => item.unitNumber === unitNumber);
  
    if (existingPackage) {
      // If a package with the same unit number exists, add the entered number of packages to the existing value
      const updatedPackage: Package = {
        ...existingPackage,
        numberOfPackages: existingPackage.numberOfPackages + parsedNumberOfPackages,
      };
  
      await updateDoc(doc(db, `companies/${companyDocId}/properties/${propertyDocId}/tools/package/packageid`, existingPackage.id), {
        numberOfPackages: updatedPackage.numberOfPackages,
      });
  
      setPackages(
        packages.map((item) => (item.id === existingPackage.id ? updatedPackage : item))
      );
    } else {
      // If a package with the same unit number doesn't exist, add a new package
      const newPackage: Omit<Package, 'id'> = {
        unitNumber,
        numberOfPackages: parsedNumberOfPackages,
        pickedUp: false,
      };
  
      const docRef = await addDoc(collection(db, `companies/${companyDocId}/properties/${propertyDocId}/tools/package/packageid`), newPackage);
      setPackages([...packages, { id: docRef.id, ...newPackage }]);
    }
  
    setModalVisible(false);
  };

  const filteredPackages = packages.filter((item) =>
    item.unitNumber.toLowerCase().includes(searchValue.toLowerCase())
  );

  return (
    <div style={{ margin: '20px' }}>
      <h1>Packages</h1>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Input
          placeholder="Search by unit number"
          value={searchValue}
          onChange={(e) => handleSearch(e.target.value)}
          style={{ width: 300 }}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
          Add Package
        </Button>
      </div>
      <Table columns={columns} dataSource={filteredPackages} />
      <Modal
        visible={modalVisible}
        title="Add Package"
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form onFinish={handleAddPackage}>
          <Form.Item
            name="unitNumber"
            label="Unit Number"
            rules={[{ required: true, message: 'Please enter the unit number' }]}
          >
            <Input />
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