import React, { useState, useEffect } from 'react';
import { Modal, Table, Input, Button, Upload, Dropdown, Menu } from 'antd';
import { UploadOutlined, EllipsisOutlined, ArrowRightOutlined } from '@ant-design/icons';
import './newapplicationsmodal.css';
import { db } from '../../../../../firebase-config';
import { collection, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setSelectedFormId } from '../../../../../components/redux/formSlice';

interface NewApplicationModalProps {
  visible: boolean;
  onCancel: () => void;
}

interface DefaultForm {
  key: string;
  id: string;
  title: string;
  description: string;
}

const NewApplicationModal: React.FC<NewApplicationModalProps> = ({ visible, onCancel }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [tableData, setTableData] = useState<DefaultForm[]>([]);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchDefaultForms = async () => {
      try {
        const defaultFormsRef = collection(db, 'default_forms');
        const snapshot = await getDocs(defaultFormsRef);
        const defaultFormsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as DefaultForm[];
        setTableData(defaultFormsData);
      } catch (error) {
        console.error('Error fetching default forms:', error);
      }
    };

    fetchDefaultForms();
  }, []);

  const filteredData = tableData.filter((item) =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to the first page when searching
  };

  const handleUpload = (file: File) => {
    // Handle the uploaded file here
    console.log('Uploaded file:', file);
    // Set the preview image URL
    const imageUrl = URL.createObjectURL(file);
    setPreviewImage(imageUrl);
  };

  const handlePageChange = (page: number, pageSize: number | undefined) => {
    setCurrentPage(page);
    if (pageSize) {
      setPageSize(pageSize);
    }
  };

  const handleMenuClick = (record: any, e: any) => {
    // Handle the menu item click based on the record and item key
    console.log('Clicked on menu item', e.key, 'for record', record);
  };

  const handleRowClick = (record: DefaultForm) => {
    // Dispatch the action to update the selected form ID in the Redux store
    dispatch(setSelectedFormId(record.id));

    // Navigate to the ApplicationViewer component
    navigate('/applicationviewer');
  };

  const columns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: any) => (
        <div className="new-application-table-item">
          <div className="new-application-table-item-content">
            {previewImage && (
              <div className="new-application-table-item-image">
                <img src={previewImage} alt="Preview" />
              </div>
            )}
            <div className="new-application-table-item-title">{text}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Action',
      key: 'action',
      align: 'center' as 'center',
      width: 120,
      render: (text: string, record: any) => (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Dropdown
            overlay={
              <Menu onClick={(e) => handleMenuClick(record, e)}>
                <Menu.Item key="print">Print</Menu.Item>
                <Menu.Item key="edit">Edit</Menu.Item>
                <Menu.Item key="delete">Delete</Menu.Item>
              </Menu>
            }
            trigger={['click']}
          >
            <Button
              type="text"
              icon={<EllipsisOutlined />}
              style={{ padding: 0, fontSize: 12 }}
            />
          </Dropdown>
          <Button
            type="link"
            icon={<ArrowRightOutlined />}
            style={{ padding: 0, fontSize: 12, marginLeft: 20 }}
          />
        </div>
      ),
    },
  ];

  return (
    <Modal
      title="New Application"
      visible={visible}
      onCancel={onCancel}
      footer={null}
      wrapClassName="new-application-modal"
      className="new-application-modal"
      width={1000}
    >
      <div className="new-application-header">
        <Input placeholder="Search" onChange={handleSearch} className="new-application-modal-search" />
        <Upload beforeUpload={(file) => { handleUpload(file); return false; }} showUploadList={false}>
          <Button icon={<UploadOutlined />}>Upload</Button>
        </Upload>
      </div>
      <div className="new-application-body">
        <Table
          columns={columns}
          size='small'
          dataSource={paginatedData}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: filteredData.length,
            onChange: handlePageChange,
          }}
          scroll={{ y: 350 }}
          onRow={(record) => ({
            onClick: () => handleRowClick(record),
          })}
        />
      </div>
    </Modal>
  );
};

export default NewApplicationModal;