import React, { useEffect, useState } from 'react';
import { Table, message, Button, Row, Col, Drawer, Form, Input, DatePicker, Select, Typography, Spin } from 'antd';
import { db } from '../../../../firebase-config';
import { collection, getDocs, addDoc, updateDoc } from 'firebase/firestore';
import { PlusOutlined, LoadingOutlined } from '@ant-design/icons';
import { v4 as uuidv4 } from 'uuid';

const { Title, Text } = Typography;
const { Option } = Select;

interface SignatureRequest {
  requestId: string;
  documentName: string;
  requestedFrom: string;
  status: string;
  dueDate: string;
  documentType: string;
}

const PropertySignatures: React.FC = () => {
  const [signatures, setSignatures] = useState<SignatureRequest[]>([]);
  const [filteredSignatures, setFilteredSignatures] = useState<SignatureRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    const fetchSignatures = async () => {
      try {
        const signaturesRef = collection(db, 'signatures');
        const signaturesSnapshot = await getDocs(signaturesRef);
        const fetchedSignatures: SignatureRequest[] = signaturesSnapshot.docs.map(doc => ({
          ...(doc.data() as SignatureRequest),
          requestId: doc.id,
        }));
        setSignatures(fetchedSignatures);
        setFilteredSignatures(fetchedSignatures);
      } catch (error) {
        console.error("Error fetching signatures: ", error);
        message.error("Failed to fetch signature requests");
      } finally {
        setLoading(false);
      }
    };

    fetchSignatures();
  }, []);

  const columns = [
    { title: 'Document Name', dataIndex: 'documentName', key: 'documentName' },
    { title: 'Requested From', dataIndex: 'requestedFrom', key: 'requestedFrom' },
    { title: 'Status', dataIndex: 'status', key: 'status' },
    { title: 'Due Date', dataIndex: 'dueDate', key: 'dueDate' },
    { title: 'Document Type', dataIndex: 'documentType', key: 'documentType' },
  ];

  const handleNewSignature = () => {
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
      const newSignature: SignatureRequest = {
        requestId: uuidv4(),
        documentName: values.documentName,
        requestedFrom: values.requestedFrom,
        status: values.status,
        dueDate: values.dueDate.format('YYYY-MM-DD'),
        documentType: values.documentType,
      };

      const signaturesRef = collection(db, 'signatures');
      const docRef = await addDoc(signaturesRef, newSignature);
      await updateDoc(docRef, { requestId: docRef.id });
      newSignature.requestId = docRef.id;

      setSignatures(prev => [...prev, newSignature]);
      setFilteredSignatures(prev => [...prev, newSignature]);
      message.success('Signature request added successfully');
      handleDrawerClose();
    } catch (error) {
      console.error("Error adding signature request: ", error);
      message.error("Failed to add signature request");
    }
  };

  return (
    <div className="signatures-container">
      <div className="signatures-box">
        <Row gutter={16} justify="space-between" align="middle" style={{ marginBottom: '16px' }}>
          <Col xs={24} sm={24} md={12} lg={12}>
            <Row gutter={16} wrap={false}>
              <Col>
                <Input
                  placeholder="Search signature requests"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </Col>
              <Col>
                <Select
                  placeholder="Filter by status"
                  onChange={(value) => setFilterStatus(value)}
                  allowClear
                  style={{ width: 150 }}
                >
                  <Option value="Pending">Pending</Option>
                  <Option value="Signed">Signed</Option>
                  <Option value="Expired">Expired</Option>
                </Select>
              </Col>
            </Row>
          </Col>
          <Col xs={24} sm={24} md={12} lg={12} style={{ textAlign: 'right', marginTop: 16 }}>
            <Button onClick={handleNewSignature} type="default" icon={<PlusOutlined />}>
              New Signature Request
            </Button>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={filteredSignatures}
          loading={{
            spinning: loading,
            indicator: <Spin indicator={<LoadingOutlined spin />} />
          }}
          rowKey="requestId"
        />

        <Drawer
          title="Add New Signature Request"
          width={720}
          onClose={handleDrawerClose}
          visible={drawerVisible}
          bodyStyle={{ paddingBottom: 80 }}
        >
          <Form form={form} layout="vertical" onFinish={handleFormSubmit}>
            <Form.Item
              name="documentName"
              label="Document Name"
              rules={[{ required: true, message: 'Please enter the document name' }]}
            >
              <Input placeholder="Document Name" />
            </Form.Item>
            <Form.Item
              name="requestedFrom"
              label="Requested From"
              rules={[{ required: true, message: 'Please enter the requested from' }]}
            >
              <Input placeholder="Requested From" />
            </Form.Item>
            <Form.Item
              name="status"
              label="Status"
              rules={[{ required: true, message: 'Please select the status' }]}
            >
              <Select placeholder="Select status">
                <Option value="Pending">Pending</Option>
                <Option value="Signed">Signed</Option>
                <Option value="Expired">Expired</Option>
              </Select>
            </Form.Item>
            <Form.Item
              name="dueDate"
              label="Due Date"
              rules={[{ required: true, message: 'Please select the due date' }]}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              name="documentType"
              label="Document Type"
              rules={[{ required: true, message: 'Please enter the document type' }]}
            >
              <Input placeholder="Document Type" />
            </Form.Item>
            <Button type="primary" htmlType="submit">
              Submit
            </Button>
          </Form>
        </Drawer>
      </div>
    </div>
  );
};

export default PropertySignatures; 