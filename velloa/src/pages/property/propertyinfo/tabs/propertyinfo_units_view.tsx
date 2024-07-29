import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Button, Row, Col, Typography, Input, Form, message, Spin, Drawer, Badge, Empty, List, Modal, Upload, UploadFile } from 'antd';
import { LeftOutlined, EditOutlined, SaveOutlined, PlusOutlined, RightOutlined, UploadOutlined } from '@ant-design/icons';
import { getFirestore, doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { DndContext, PointerSensor, useSensor, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { v4 as uuidv4 } from 'uuid';
import PropertyInfoUnitViewNotes from './PropertyInfoUnitViewNotes';
import './propertyinfo_units_view.css';

const { Text, Title } = Typography;
const { TextArea } = Input;

interface Image {
  id: string;
  url: string;
}

interface Unit {
  unitId: string;
  unitName: string;
  size: string;
  beds: number;
  baths: number;
  marketRent: number;
  tenant: string;
  description: string;
  notes?: string[];
  images?: Image[];
}

interface Property {
  id: string;
  name: string;
}

const listings = [
  { website: "Zillow", status: "Active", date: "2024-06-20", imgSrc: "/assets/zillow-btn-png.png", statusColor: "green" },
  { website: "Hotpads", status: "Active", date: "2024-06-20", imgSrc: "/assets/hotpads-logo.svg", statusColor: "green" },
  { website: "Trulia", status: "Active", date: "2024-06-20", imgSrc: "/assets/trulia-btn.png", statusColor: "green" },
  { website: "Dwellsy", status: "Inactive", date: "n/a", imgSrc: "/assets/Dwellsy-btn.png", statusColor: "red" },
  { website: "Other", status: "Inactive", date: "n/a", imgSrc: "/assets/Other-btn-light.png", statusColor: "red" },
];

const DraggableUploadListItem = ({ originNode, file }: { originNode: React.ReactElement, file: UploadFile }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: file.uid });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {originNode}
    </div>
  );
};

const PropertyInfoUnitView: React.FC = () => {
  const navigate = useNavigate();
  const { propertyId, unitName } = useParams<{ propertyId: string; unitName: string }>();
  const [property, setProperty] = useState<Property | null>(null);
  const [unit, setUnit] = useState<Unit | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedUnit, setEditedUnit] = useState<Unit | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [isImageDrawerVisible, setIsImageDrawerVisible] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [isNoteModalVisible, setIsNoteModalVisible] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [isImageUpdated, setIsImageUpdated] = useState(false);

  useEffect(() => {
    const fetchPropertyAndUnit = async () => {
      if (!propertyId || !unitName) {
        message.error('Missing required parameters');
        navigate(-1);
        return;
      }
  
      const db = getFirestore();
      const propertyRef = doc(db, 'properties', propertyId);
  
      try {
        const propertySnap = await getDoc(propertyRef);
        if (propertySnap.exists()) {
          const propertyData = { id: propertySnap.id, ...propertySnap.data() } as Property;
          setProperty(propertyData);
  
          // Fetch the specific unit from the 'units' subcollection
          const unitsCollectionRef = collection(db, 'properties', propertyId, 'units');
          const q = query(unitsCollectionRef, where("unitName", "==", unitName));
          const unitQuerySnapshot = await getDocs(q);
  
          if (!unitQuerySnapshot.empty) {
            const unitDoc = unitQuerySnapshot.docs[0];
            const unitData = { unitId: unitDoc.id, ...unitDoc.data() } as Unit;
            setUnit(unitData);
            setEditedUnit(unitData);
            setFileList(unitData.images ? unitData.images.map(({ url, id }) => {
              const fileName = url ? url.split('%2F').pop()?.split('?').shift() : `image-${id}.png`;
              return {
                uid: id,
                name: fileName || `image-${id}.png`,
                status: 'done',
                url,
              };
            }) : []);
          } else {
            message.error('Unit not found');
          }
        } else {
          message.error('Property not found');
        }
      } catch (error) {
        console.error("Error fetching property and unit: ", error);
        message.error('Failed to fetch data');
      } finally {
        setIsLoading(false);
      }
    };
  
    fetchPropertyAndUnit();
  }, [propertyId, unitName, navigate, isImageUpdated]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleEdit = (section: 'details' | 'description' | 'notes') => {
    if (section === 'details') {
      setDrawerVisible(true);
    } else if (section === 'description') {
      setIsEditingDescription(!isEditingDescription);
    } else if (section === 'notes') {
      setIsEditingNotes(!isEditingNotes);
    }
  };

  const handleInputChange = (field: keyof Unit, value: string | number) => {
    setEditedUnit(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleSave = async (section: 'details' | 'description' | 'notes') => {
    if (!editedUnit || !property) {
      message.error('Cannot update unit: Missing data');
      return;
    }
  
    const db = getFirestore();
    const unitRef = doc(db, 'properties', property.id, 'units', editedUnit.unitId);
  
    try {
      // Create an object with only the fields that should be updated
      const updateData: Partial<Unit> = {
        unitName: editedUnit.unitName,
        size: editedUnit.size,
        beds: editedUnit.beds,
        baths: editedUnit.baths,
        marketRent: editedUnit.marketRent,
        tenant: editedUnit.tenant,
        description: editedUnit.description,
        notes: editedUnit.notes,
        images: editedUnit.images,
      };
  
      await updateDoc(unitRef, updateData);
  
      if (section === 'details') {
        setIsEditingDetails(false);
        setDrawerVisible(false);
      } else if (section === 'description') {
        setIsEditingDescription(false);
      } else if (section === 'notes') {
        setIsEditingNotes(false);
      }
  
      setUnit(editedUnit);
      message.success('Unit updated successfully');
  
      if (section === 'details' || section === 'notes') {
        setIsImageUpdated(!isImageUpdated);
      }
    } catch (error) {
      console.error("Error updating document: ", error);
      message.error('Failed to update unit');
    }
  };

  const handleAddImage = () => {
    setIsImageDrawerVisible(true);
  };

  const handleNewNote = () => {
    navigate(`/property/${propertyId}/unit/${unitName}/notes/new`);
  };

  const sensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 10 },
  });

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (active.id !== over?.id) {
      setFileList((prev) => {
        const activeIndex = prev.findIndex((i) => i.uid === active.id);
        const overIndex = prev.findIndex((i) => i.uid === over?.id);
        return arrayMove(prev, activeIndex, overIndex);
      });
    }
  };

  const handleUploadChange = async ({ fileList: newFileList }: { fileList: UploadFile[] }) => {
    setFileList(newFileList);
  };

  const handleBeforeUpload = async (file: File) => {
    const storage = getStorage();
    const id = uuidv4();
    const storageRef = ref(storage, `units/${propertyId}/${unitName}/${id}`);
    console.log('Uploading file to:', storageRef.fullPath);
  
    const uploadTask = uploadBytesResumable(storageRef, file);
  
    uploadTask.on('state_changed',
      (snapshot) => {
        // Observe state change events such as progress, pause, and resume
      },
      (error) => {
        console.error('Upload failed:', error);
        message.error('Failed to upload image');
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          setEditedUnit(prev => {
            if (!prev) return null;
            const newImages = prev.images ? [...prev.images, { id, url: downloadURL }] : [{ id, url: downloadURL }];
            return { ...prev, images: newImages };
          });
          message.success('Image uploaded successfully');
        });
      }
    );
  
    return false;
  };

  const handleRemoveImage = async (file: UploadFile) => {
    try {
      const image = fileList.find(f => f.uid === file.uid);
      if (!image) {
        message.error('Image not found');
        return;
      }
      const id = image.uid;
  
      console.log(`Attempting to delete file with ID: ${id}`);
  
      const storage = getStorage();
      const storageRef = ref(storage, `units/${propertyId}/${unitName}/${id}`);
  
      console.log('Deleting file from:', storageRef.fullPath);
  
      await deleteObject(storageRef);
      setEditedUnit(prev => {
        if (!prev) return null;
        const newImages = prev.images?.filter((img) => img.id !== id) || [];
        return { ...prev, images: newImages };
      });
      setFileList(prevList => prevList.filter(item => item.uid !== file.uid));
      message.success('Image deleted successfully');
    } catch (error) {
      console.error('Error deleting image:', error);
      message.error('Failed to delete image');
    }
  };

  if (isLoading) {
    return <Spin size="large" />;
  }

  if (!property || !unit || !editedUnit) {
    return <div>No data available</div>;
  }

  return (
    <div className="property-info-unit-view">
      <Button
        className="back-button-unit-view" 
        icon={<LeftOutlined />}
        onClick={handleBack}
      />
      <Title level={2} className="property-title">{property.name}</Title>
      <Title level={2} className="unit-title">Unit {editedUnit.unitName}</Title>
      <Card
        className="unit-details-card" 
        title="Unit Details"
        extra={
          <Button
            icon={isEditingDetails ? <SaveOutlined /> : <EditOutlined />}
            onClick={() => isEditingDetails ? handleSave('details') : handleEdit('details')}
          >
            {isEditingDetails ? 'Save' : 'Edit'}
          </Button>
        }
      >
        <Form layout="vertical">
          <Row gutter={[16, 16]}>
            {([
              { field: 'unitName', label: 'Unit Name' },
              { field: 'baths', label: 'Baths' },
              { field: 'marketRent', label: 'Market Rent' },
              { field: 'beds', label: 'Beds' },
              { field: 'size', label: 'Size (square ft)' },
              { field: 'tenant', label: 'Tenant' }
            ] as Array<{ field: keyof Unit, label: string }>).map(({ field, label }) => (
              <Col span={8} key={field}>
                <Form.Item>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Text strong style={{ marginRight: 8 }}>{label}:</Text>
                    {isEditingDetails ? (
                      <Input 
                        value={typeof editedUnit[field] === 'string' || typeof editedUnit[field] === 'number' ? editedUnit[field] as string | number : ''}
                        onChange={(e) => handleInputChange(field, e.target.value)}
                        style={{ flex: 1 }}
                      />
                    ) : (
                      <Text style={{ flex: 1 }}>{typeof editedUnit[field] === 'string' || typeof editedUnit[field] === 'number' ? editedUnit[field] as string | number : ''}</Text>
                    )}
                  </div>
                </Form.Item>
              </Col>
            ))}
          </Row>
        </Form>
      </Card>
      <Row gutter={16}>
        <Col span={12}>
          <Card
            className="description-card"
            title="Description"
            extra={
              <Button
                icon={isEditingDescription ? <SaveOutlined /> : <EditOutlined />}
                onClick={() => isEditingDescription ? handleSave('description') : handleEdit('description')}
              >
                {isEditingDescription ? 'Save' : 'Edit'}
              </Button>
            }
            style={{ minHeight: '262px' }}
          >
            {isEditingDescription ? (
              <TextArea
                value={editedUnit.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                autoSize={{ minRows: 3, maxRows: 6 }}
              />
            ) : (
              <Text>{editedUnit.description || 'No description available.'}</Text>
            )}
          </Card>
        </Col>
        <Col span={12}>
          <Card
            className="notes-card"
            title="Notes"
            extra={
              <Button
                icon={<PlusOutlined />}
                onClick={() => setIsNoteModalVisible(true)}
              >
                Add
              </Button>
            }
          >
            <Row style={{ fontWeight: 'bold', marginBottom: '10px' }}>
            <Col span={8}>Name</Col>
              <Col span={8}>Date</Col>
              <Col span={8} style={{ textAlign: 'right' }}>Action</Col>
            </Row>
            {editedUnit.notes && editedUnit.notes.length > 0 ? (
              <List
                itemLayout="horizontal"
                dataSource={Array.isArray(editedUnit.notes) ? editedUnit.notes.map((note: string, index: number) => ({ name: `Note ${index + 1}`, date: note })) : []}
                renderItem={(item: { name: string; date: string }) => (
                  <List.Item>
                    <Row style={{ width: '100%' }} align="middle">
                      <Col span={8}>
                        <Text>{item.name}</Text>
                      </Col>
                      <Col span={8}>
                        <Text>{item.date}</Text>
                      </Col>
                      <Col span={8} style={{ textAlign: 'right' }}>
                        <RightOutlined />
                      </Col>
                    </Row>
                  </List.Item>
                )}
              />
            ) : (
              <Empty 
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No notes available"
              />
            )}
          </Card>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Card 
            className="images-card" 
            title="Images"
            extra={
              <Button icon={<PlusOutlined />} onClick={handleAddImage}>
                Add
              </Button>
            }
            style={{ minHeight: '240px' }}
          >
            {fileList.length === 0 ? (
              <div className="empty-upload-area">
                <Empty 
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="No images available"
                />
              </div>
            ) : (
              <div className="image-list">
                {fileList.map((file) => (
                  <div key={file.uid} className="image-item">
                    <img src={file.url} alt={file.name} />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Col>
        <Col span={12}>
          <Card className="tenant-info-card" title="Tenant Info">
            {unit.tenant ? (
              <Text>{unit.tenant}</Text>
            ) : (
              <Empty 
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No tenant information available"
              />
            )}
          </Card>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Card 
            className="listings-card"
            title="Listings"
          >
            <Row style={{ fontWeight: 'bold', marginBottom: '10px' }}>
              <Col span={6}>Website</Col>
              <Col span={6}>Status</Col>
              <Col span={6}>Date Posted</Col>
              <Col span={6} style={{ textAlign: 'right' }}>Action</Col>
            </Row>
            <List
              itemLayout="horizontal"
              dataSource={listings}
              renderItem={item => (
                <List.Item>
                  <Row style={{ width: '100%' }} align="middle">
                    <Col span={6} style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', paddingLeft: '10px' }}>
                      {item.imgSrc ? (
                        <div style={{ width: '110px', height: '24px' }}>
                          <img 
                            src={item.imgSrc}
                            alt={item.website}
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                          />
                        </div>
                      ) : (
                        <Text>{item.website}</Text>
                      )}
                    </Col>
                    <Col span={6}>
                      <Badge 
                        count={item.status}
                        style={{ backgroundColor: item.statusColor, color: 'white', padding: '0 8px' }}
                      />
                    </Col>
                    <Col span={6}>
                      <Text>{item.date}</Text>
                    </Col>
                    <Col span={6} style={{ textAlign: 'right' }}>
                      <RightOutlined />
                    </Col>
                  </Row>
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card 
            className="maintenance-card"
            title="Maintenance"
            extra={
              <Button icon={<PlusOutlined />}>
                New
              </Button>
            }
          >
            <List
              itemLayout="horizontal"
              dataSource={[]}
              renderItem={() => (
                <List.Item>
                  <Empty 
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="No maintenance requests"
                  />
                </List.Item>
              )}
              style={{ minHeight: '275px' }}
            />
          </Card>
        </Col>
      </Row>
      <Drawer
        title="Edit Unit Details"
        width={480}
        onClose={() => setDrawerVisible(false)}
        visible={drawerVisible}
        bodyStyle={{ paddingBottom: 80 }}
        extra={
          <Button
            icon={<SaveOutlined />}
            onClick={() => handleSave('details')}
          >
            Save
          </Button>
        }
      >
        <Form layout="vertical">
          {(Object.keys(editedUnit) as Array<keyof Unit>).filter(key => 
            ['unitName', 'size', 'beds', 'baths', 'marketRent', 'tenant'].includes(key)
          ).map((field) => (
            <Form.Item key={field} label={field.charAt(0).toUpperCase() + field.slice(1)}>
              <Input 
                value={typeof editedUnit[field] === 'string' || typeof editedUnit[field] === 'number' ? editedUnit[field] as string | number : ''}
                onChange={(e) => handleInputChange(field, e.target.value)}
              />
            </Form.Item>
          ))}
        </Form>
      </Drawer>
      <Drawer
        title="Upload Images"
        width={480}
        onClose={() => {
          setIsImageDrawerVisible(false);
          setIsImageUpdated(!isImageUpdated);
        }}
        visible={isImageDrawerVisible}
        bodyStyle={{ paddingBottom: 80 }}
      >
        <DndContext sensors={[sensor]} onDragEnd={onDragEnd}>
          <SortableContext items={fileList.map((i) => i.uid)} strategy={verticalListSortingStrategy}>
            <div style={{ paddingBottom: '20px' }}>
              <Upload.Dragger
                listType="picture"
                fileList={fileList}
                onChange={handleUploadChange}
                beforeUpload={handleBeforeUpload}
                onRemove={handleRemoveImage}
                itemRender={(originNode, file) => (
                  <DraggableUploadListItem originNode={originNode} file={file} />
                )}
                showUploadList={{ showRemoveIcon: true }}
                style={{ marginBottom: '20px' }}
              >
                <p className="ant-upload-drag-icon">
                  <UploadOutlined />
                </p>
                <p className="ant-upload-text">Click or drag file to this area to upload</p>
                <p className="ant-upload-hint">
                  Support for a single or bulk upload. Strictly prohibit from uploading company data or other
                  banned files
                </p>
              </Upload.Dragger>
            </div>
          </SortableContext>
        </DndContext>
        <div className="upload-drawer-buttons" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
          <Button
            icon={<SaveOutlined />}
            onClick={() => {
              handleSave('details');
              setIsImageDrawerVisible(false);
            }}
          >
            Save
          </Button>
        </div>
      </Drawer>
      <Modal
        title="New Note"
        visible={isNoteModalVisible}
        onCancel={() => setIsNoteModalVisible(false)}
        footer={null}
      >
        {propertyId && unitName && (
          <PropertyInfoUnitViewNotes
            propertyId={propertyId}
            unitName={unitName}
            onSave={() => handleSave('notes')}
          />
        )}
      </Modal>
    </div>
  );
};

export default PropertyInfoUnitView;