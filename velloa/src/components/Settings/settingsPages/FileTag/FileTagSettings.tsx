import React, { useState, useEffect } from 'react';
import { Button, Input, Card, Typography, Space, Modal, Divider, notification } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { db, auth } from '../../../../firebase-config';
import { collection, doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { User } from 'firebase/auth';

const { Text } = Typography;
const { confirm } = Modal;

interface FileTag {
  id: string;
  name: string;
  createdAt: Timestamp | Date;
}

export const FileTagSettings: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<any>(null);
  const [tags, setTags] = useState<FileTag[]>([]);
  const [newTag, setNewTag] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser?.uid) return;

        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        const companyId = userDoc.data()?.companyuid;
        
        if (!companyId) return;

        setCompany({ id: companyId });

        const settingsRef = doc(db, `companies/${companyId}/settings/filetags`);
        const settingsDoc = await getDoc(settingsRef);

        if (settingsDoc.exists()) {
          const data = settingsDoc.data();
          const tags = data.tags || [];
          setTags(tags.map((tag: any) => ({
            id: tag.id,
            name: tag.name,
            createdAt: tag.createdAt
          })));
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
        notification.error({
          message: 'Error',
          description: 'Failed to load tags'
        });
      }
    };

    fetchSettings();
  }, []);

  const handleAddTag = async () => {
    try {
      if (!newTag.trim()) {
        notification.error({
          message: 'Tag name cannot be empty'
        });
        return;
      }
      
      const currentUser = auth.currentUser;
      if (!currentUser?.uid) {
        notification.error({
          message: 'No user found'
        });
        return;
      }

      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      const companyId = userDoc.data()?.companyuid;
      
      if (!companyId) {
        notification.error({
          message: 'No company found'
        });
        return;
      }

      const settingsRef = doc(db, `companies/${companyId}/settings/filetags`);
      const settingsDoc = await getDoc(settingsRef);
      
      const newTagRef = doc(collection(db, 'temp'));
      const newTagData: FileTag = {
        id: newTagRef.id,
        name: newTag.trim(),
        createdAt: Timestamp.now()
      };

      await setDoc(settingsRef, {
        tags: settingsDoc.exists() 
          ? [...settingsDoc.data().tags || [], newTagData]
          : [newTagData]
      }, { merge: true });

      setTags(prevTags => [...prevTags, newTagData]);
      
      setNewTag('');
      setIsAdding(false);
      notification.success({
        message: 'Success',
        description: 'Tag added successfully'
      });
    } catch (error) {
      console.error('Error adding tag:', error);
      notification.error({
        message: 'Error',
        description: 'Failed to add tag'
      });
    }
  };

  const showDeleteConfirm = (id: string, name: string) => {
    confirm({
      title: 'Are you sure you want to delete this tag?',
      icon: <ExclamationCircleOutlined />,
      content: `Tag: ${name}`,
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk() {
        handleDeleteTag(id);
      },
    });
  };

  const handleDeleteTag = async (id: string) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser?.uid) {
        notification.error({
          message: 'Error',
          description: 'No user found'
        });
        return;
      }

      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      const companyId = userDoc.data()?.companyuid;
      
      if (!companyId) {
        notification.error({
          message: 'Error',
          description: 'No company found'
        });
        return;
      }

      const settingsRef = doc(db, `companies/${companyId}/settings/filetags`);
      const settingsDoc = await getDoc(settingsRef);
      
      if (settingsDoc.exists()) {
        const currentTags = settingsDoc.data().tags || [];
        const updatedTags = currentTags.filter((tag: any) => tag.id !== id);
        
        await setDoc(settingsRef, {
          tags: updatedTags
        }, { merge: true });
        
        setTags(prevTags => prevTags.filter(tag => tag.id !== id));
        notification.success({
          message: 'Success',
          description: 'Tag deleted successfully'
        });
      }
    } catch (error) {
      console.error('Error deleting tag:', error);
      notification.error({
        message: 'Error',
        description: 'Failed to delete tag'
      });
    }
  };

  const handleEditTag = async (id: string, newName: string) => {
    try {
      if (!company?.id) return;
      if (!newName.trim()) {
        notification.error({
          message: 'Error',
          description: 'Tag name cannot be empty'
        });
        return;
      }

      const settingsRef = doc(db, `companies/${company.id}/settings/filetags`);
      const settingsDoc = await getDoc(settingsRef);
      
      if (settingsDoc.exists()) {
        const currentTags = settingsDoc.data().tags || [];
        const updatedTags = currentTags.map((tag: any) => 
          tag.id === id ? { ...tag, name: newName.trim() } : tag
        );
        
        await setDoc(settingsRef, {
          tags: updatedTags
        }, { merge: true });
        
        setTags(prevTags => prevTags.map(tag => 
          tag.id === id ? { ...tag, name: newName.trim() } : tag
        ));
        
        setEditingTag(null);
        setEditingName('');
        notification.success({
          message: 'Success',
          description: 'Tag updated successfully'
        });
      }
    } catch (error) {
      console.error('Error updating tag:', error);
      notification.error({
        message: 'Error',
        description: 'Failed to update tag'
      });
    }
  };

  return (
    <div style={{ height: '500px', display: 'flex', flexDirection: 'column' }}>
        <div>
          <Text type="secondary">
            Create file tags to categorize your files and keep track of your files.
          </Text>
          <Divider />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, position: 'relative' }}>
          <Space 
            direction="vertical" 
            style={{ 
              width: '100%',
              overflow: 'auto',
              padding: '0 16px',
              position: 'absolute',
              top: 0,
              bottom: 44,
              left: 0,
              right: 0
            }} 
            size={4}
          >
            {tags.map(tag => (
              <Card
                key={tag.id}
                size="small"
                bordered={false}
                style={{
                  border: '1px solid #e8e8e8',
                  marginBottom: '8px'
                }}
                bodyStyle={{ padding: '12px' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <Text type="secondary" style={{ fontSize: '12px' }}>Tag Name</Text>
                      {editingTag === tag.id ? (
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <Input
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onPressEnter={() => handleEditTag(tag.id, editingName)}
                            style={{ flex: 1 }}
                            size="middle"
                          />
                          <Button
                            type="primary"
                            style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                            onClick={() => handleEditTag(tag.id, editingName)}
                            size="middle"
                          >
                            Save
                          </Button>
                          <Button
                            type="primary"
                            onClick={() => {
                              setEditingTag(null);
                              setEditingName('');
                            }}
                            size="middle"
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ flex: 1 }}>{tag.name}</div>
                          <Button
                            type="text"
                            icon={<EditOutlined />}
                            onClick={() => {
                              setEditingTag(tag.id);
                              setEditingName(tag.name);
                            }}
                            size="small"
                          />
                          <Button
                            type="text"
                            icon={<DeleteOutlined />}
                            danger
                            onClick={() => showDeleteConfirm(tag.id, tag.name)}
                            size="small"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}

            {isAdding && (
              <Card
                size="small"
                bordered={false}
                style={{border: '1px solid #e8e8e8'}}
              >
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
                  <div style={{ flex: 1 }}>
                    <Text type="secondary">Tag Name</Text>
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Enter tag name"
                      onPressEnter={handleAddTag}
                    />
                  </div>
                  <Button
                    onClick={handleAddTag}
                    style={{ height: '40px', width: '100px' }}
                  >
                    Save
                  </Button>
                  <Button
                    type="default"
                    onClick={() => {
                      setIsAdding(false);
                      setNewTag('');
                    }}
                    style={{ height: '40px', width: '100px' }}
                  >
                    Cancel
                  </Button>
                </div>
              </Card>
            )}
          </Space>

          {!isAdding && (
            <div style={{ 
              position: 'absolute', 
              bottom: 0, 
              left: 0, 
              right: 0,
              padding: '8px 16px',
              borderTop: '1px solid #f0f0f0',
              backgroundColor: '#fff'
            }}>
              <Button
                type="link"
                icon={<PlusOutlined />}
                onClick={() => setIsAdding(true)}
              >
                Add Line Item
              </Button>
            </div>
          )}
        </div>
    </div>
  );
};

export default FileTagSettings;