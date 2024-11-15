import React, { useEffect, useState } from 'react';
import { Table, message, Button, Row, Col, Drawer, Form, Input, DatePicker, Select, Typography, Spin } from 'antd';
import { db } from '../../../../firebase-config';
import { collection, getDocs, addDoc, updateDoc } from 'firebase/firestore';
import { PlusOutlined, LoadingOutlined } from '@ant-design/icons';
import { v4 as uuidv4 } from 'uuid';
import './propertyinfo_listings.css';

const { Option } = Select;

interface Listing {
  listingId: string;
  unit: string;
  price: number;
  status: string;
  dateListed: string;
  description: string;
}

const PropertyListings: React.FC = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [filteredListings, setFilteredListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const listingsRef = collection(db, 'listings');
        const listingsSnapshot = await getDocs(listingsRef);
        const fetchedListings: Listing[] = listingsSnapshot.docs.map(doc => ({
          ...(doc.data() as Listing),
          listingId: doc.id,
        }));
        setListings(fetchedListings);
        setFilteredListings(fetchedListings);
      } catch (error) {
        console.error("Error fetching listings: ", error);
        message.error("Failed to fetch listings");
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, []);

  const columns = [
    { title: 'Unit Number', dataIndex: 'unit', key: 'unit' },
    { title: 'Price', dataIndex: 'price', key: 'price', render: (price: number) => `$${price}` },
    { title: 'Status', dataIndex: 'status', key: 'status' },
    { title: 'Date Listed', dataIndex: 'dateList', key: 'dateList' },
  ];

  const handleNewListing = () => {
    setDrawerVisible(true);
    form.resetFields();
  };

  const handleDrawerClose = () => {
    setDrawerVisible(false);
    form.resetFields();
  };

  const handleFormSubmit = async () => {
    try {
      const values = await form.validateFields();
      const newListing: Listing = {
        listingId: uuidv4(),
        unit: values.unit,
        price: values.price,
        status: values.status,
        dateListed: values.dateListed.format('YYYY-MM-DD'),
        description: values.description,
      };

      const listingsRef = collection(db, 'listings');
      const docRef = await addDoc(listingsRef, newListing);
      await updateDoc(docRef, { listingId: docRef.id });
      newListing.listingId = docRef.id;

      setListings(prev => [...prev, newListing]);
      setFilteredListings(prev => [...prev, newListing]);
      message.success('Listing added successfully');
      handleDrawerClose();
    } catch (error) {
      console.error("Error adding listing: ", error);
      message.error("Failed to add listing");
    }
  };

  return (
    <div className="listings-container">
      <div className="listings-box">
        <Row gutter={16} justify="space-between" align="middle" style={{ marginBottom: '16px' }}>
          <Col xs={24} sm={24} md={12} lg={12}>
            <Row gutter={16} wrap={false}>
              <Col>
                <Input
                  placeholder="Search listings"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="listings-search-input"
                />
              </Col>
              <Col>
                <Select
                  placeholder="Filter by status"
                  onChange={(value) => setFilterStatus(value)}
                  allowClear
                  style={{ width: 150 }}
                  className="listings-dropdown-input"
                >
                  <Option value="Active">Active</Option>
                  <Option value="Pending">Pending</Option>
                  <Option value="Closed">Closed</Option>
                </Select>
              </Col>
            </Row>
          </Col>
          <Col xs={24} sm={24} md={12} lg={12} style={{ textAlign: 'right',              marginTop: 16
 }}>
            <Button onClick={handleNewListing} type="default" icon={<PlusOutlined />} className="new-listing-button">
              New Listing
            </Button>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={filteredListings}
          loading={{
            spinning: loading,
            indicator: <Spin indicator={<LoadingOutlined spin />} />
          }}
          rowKey="listingId"
        />


      </div>
    </div>
  );
};

export default PropertyListings; 