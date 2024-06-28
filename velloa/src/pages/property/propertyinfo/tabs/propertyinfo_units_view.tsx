import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Button, Row, Col, Typography, Input, Form, message, Spin, Drawer, Badge, Empty, List, Modal } from 'antd';
import { LeftOutlined, EditOutlined, SaveOutlined, PlusOutlined, RightOutlined } from '@ant-design/icons';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { getStorage, ref, uploadString } from 'firebase/storage';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { nanoid } from 'nanoid';

const { Text, Title } = Typography;
const { TextArea } = Input;

interface Unit {
  unitName: string;
  size: string;
  beds: number;
  baths: number;
  marketRent: number;
  tenant: string;
  description: string;
  notes?: string[];
  images?: string[];
}

interface Property {
  id: string;
  name: string;
  units: Unit[];
}

const listings = [
  { website: "Zillow", status: "Active", date: "2024-06-20", imgSrc: "/assets/zillow-btn-png.png", statusColor: "green" },
  { website: "Hotpads", status: "Active", date: "2024-06-20", imgSrc: "/assets/hotpads-logo.svg", statusColor: "green" },
  { website: "Trulia", status: "Active", date: "2024-06-20", imgSrc: "/assets/trulia-btn.png", statusColor: "green" },
  { website: "Dwellsy", status: "Inactive", date: "n/a", imgSrc: "/assets/Dwellsy-btn.png", statusColor: "red" },
  { website: "Other", status: "Inactive", date: "n/a", imgSrc: "/assets/Other-btn-light.png", statusColor: "red" },
];

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
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [isNoteModalVisible, setIsNoteModalVisible] = useState(false);
  const [noteContent, setNoteContent] = useState('');

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

          const unitData = propertyData.units.find(u => u.unitName === unitName);
          if (unitData) {
            setUnit(unitData);
            setEditedUnit(unitData);
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
  }, [propertyId, unitName, navigate]);

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
    const propertyRef = doc(db, 'properties', property.id);

    try {
      const updatedUnits = property.units.map(u =>
        u.unitName === editedUnit.unitName ? editedUnit : u
      );

      await updateDoc(propertyRef, { units: updatedUnits });

      if (section === 'details') {
        setIsEditingDetails(false);
        setDrawerVisible(false);
      } else if (section === 'description') {
        setIsEditingDescription(false);
      } else if (section === 'notes') {
        setIsEditingNotes(false);
      }

      setUnit(editedUnit);
      setProperty({ ...property, units: updatedUnits });
      message.success('Unit updated successfully');
    } catch (error) {
      console.error("Error updating document: ", error);
      message.error('Failed to update unit');
    }
  };

  const handleAddImage = () => {
    console.log('Add image clicked');
  };

  const handleNewNote = () => {
    navigate(`/property/${propertyId}/unit/${unitName}/notes/new`);
  };

  const editor = useEditor({
    extensions: [StarterKit],
    content: noteContent,
    onUpdate: ({ editor }) => {
      setNoteContent(editor.getHTML());
    },
  });

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
                        value={editedUnit[field]} 
                        onChange={(e) => handleInputChange(field, e.target.value)}
                        style={{ flex: 1 }}
                      />
                    ) : (
                      <Text style={{ flex: 1 }}>{field === 'tenant' ? (editedUnit.tenant || 'Vacant') : editedUnit[field]}</Text>
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
            style={{ minHeight: '262px' }}  // Adjust this value as needed
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
              <Button icon={<PlusOutlined />} onClick={handleNewNote}>
                New
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
                dataSource={Array.isArray(editedUnit.notes) ? editedUnit.notes.map((note, index) => ({ name: `Note ${index + 1}`, date: note })) : []}
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
          >
            {editedUnit.images && editedUnit.images.length === 0 ? (
              <Empty 
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No images available"
              />
            ) : (
              <Text>Image gallery placeholder</Text>
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
              style={{ minHeight: '275px' }}  // Adjust this value as needed
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
                value={editedUnit[field]} 
                onChange={(e) => handleInputChange(field, e.target.value)}
              />
            </Form.Item>
          ))}
        </Form>
      </Drawer>
      <Modal
        title="New Note"
        visible={isNoteModalVisible}
        onCancel={() => setIsNoteModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsNoteModalVisible(false)}>
            Cancel
          </Button>,
          <Button key="save" type="primary" icon={<SaveOutlined />} onClick={() => handleSave('details')}>
          </Button>
        ]}
      >
        <EditorContent editor={editor} />
      </Modal>
    </div>
  );
};

export default PropertyInfoUnitView;
