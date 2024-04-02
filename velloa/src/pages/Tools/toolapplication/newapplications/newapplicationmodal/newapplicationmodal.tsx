import { Modal, List, Input, Button, Upload } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { useState } from 'react';
import './newapplicationsmodal.css';

interface NewApplicationModalProps {
  visible: boolean;
  onCancel: () => void;
}

const NewApplicationModal: React.FC<NewApplicationModalProps> = ({ visible, onCancel }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const listData = [
    'Ant Design Title 1',
    'Ant Design Title 2',
    'Ant Design Title 3',
    // Add more list items as needed
  ];

  const filteredData = listData.filter((item) =>
    item.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleUpload = (file: File) => {
    // Handle the uploaded file here
    console.log('Uploaded file:', file);
    // Set the preview image URL
    const imageUrl = URL.createObjectURL(file);
    setPreviewImage(imageUrl);
  };

  return (
    <Modal
      title="New Application"
      visible={visible}
      onCancel={onCancel}
      footer={null}
      wrapClassName="new-application-modal"
      width={1300}
    >
      <div className="new-application-header">
        <Input
          placeholder="Search"
          onChange={handleSearch}
          className="new-application-search"
        />
        <Upload
          beforeUpload={(file) => {
            handleUpload(file);
            return false;
          }}
          showUploadList={false}
        >
          <Button icon={<UploadOutlined />}>Upload</Button>
        </Upload>
      </div>
      <div className="new-application-body">
        <List
          dataSource={filteredData}
          renderItem={(item) => (
            <List.Item className="new-application-item">
              <div className="new-application-item-content">
                {previewImage && (
                  <div className="new-application-item-image">
                    <img src={previewImage} alt="Preview" />
                  </div>
                )}
                <div className="new-application-item-title">{item}</div>
              </div>
            </List.Item>
          )}
        />
      </div>
    </Modal>
  );
};

export default NewApplicationModal;