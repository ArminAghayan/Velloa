import React, { useState, useEffect } from 'react';
import { Button, Input, Typography, Modal, Divider, notification } from 'antd';
import {DeleteOutlined, PlusOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { db, auth } from '../../../../firebase-config';
import { collection, doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { User } from 'firebase/auth';

const { Text } = Typography;
const { confirm } = Modal;

interface ExpenseCategory {
  id: string;
  name: string;
  createdAt: Timestamp | Date;
}

const DEFAULT_CATEGORIES = [
  'Utilities',
  'Maintenance',
  'Repairs',
  'Taxes',
  'Insurance'
];

const gridButtonStyle = {
  width: '100%',
  height: '40px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  border: '1px solid ##D9D9D9',
  borderRadius: '8px',
  backgroundColor: '#28A744',
  color: 'white',
  cursor: 'pointer',
  position: 'relative' as const,
};

export const ExpenseCategories: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<any>(null);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [hoveredId, setHoveredId] = useState<string | null>(null);

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

        const settingsRef = doc(db, `companies/${companyId}/settings/expensecategories`);
        const settingsDoc = await getDoc(settingsRef);

        if (settingsDoc.exists()) {
          const data = settingsDoc.data();
          const existingCategories = data.categories || [];
          
          const defaultCategoriesData = DEFAULT_CATEGORIES.map(name => ({
            id: `default-${name.toLowerCase()}`,
            name,
            createdAt: Timestamp.now()
          })).filter(defaultCat => 
            !existingCategories.some((existingCat: any) => 
              existingCat.name === defaultCat.name
            )
          );

          const allCategories = [...existingCategories, ...defaultCategoriesData];
          
          if (defaultCategoriesData.length > 0) {
            await setDoc(settingsRef, {
              categories: allCategories
            }, { merge: true });
          }

          setCategories(allCategories.map((category: any) => ({
            id: category.id,
            name: category.name,
            createdAt: category.createdAt
          })));
        } else {
          const defaultCategoriesData = DEFAULT_CATEGORIES.map(name => ({
            id: `default-${name.toLowerCase()}`,
            name,
            createdAt: Timestamp.now()
          }));

          await setDoc(settingsRef, {
            categories: defaultCategoriesData
          }, { merge: true });

          setCategories(defaultCategoriesData.map((category: any) => ({
            id: category.id,
            name: category.name,
            createdAt: category.createdAt
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

  const handleAddCategory = async () => {
    try {
      if (!newCategory.trim()) {
        notification.error({
          message: 'Category name cannot be empty'
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

      const settingsRef = doc(db, `companies/${companyId}/settings/expensecategories`);
      const settingsDoc = await getDoc(settingsRef);
      
      const newCategoryRef = doc(collection(db, 'temp'));
      const newCategoryData: ExpenseCategory = {
        id: newCategoryRef.id,
        name: newCategory.trim(),
        createdAt: Timestamp.now()
      };

      await setDoc(settingsRef, {
        categories: settingsDoc.exists() 
          ? [...settingsDoc.data().categories || [], newCategoryData]
          : [newCategoryData]
      }, { merge: true });

      setCategories(prevCategories => [...prevCategories, newCategoryData]);
      
      setNewCategory('');
      setIsModalVisible(false);
      notification.success({
        message: 'Success',
        description: 'Category added successfully'
      });
    } catch (error) {
      console.error('Error adding tag:', error);
      notification.error({
        message: 'Error',
        description: 'Failed to add category'
      });
    }
  };

  const showDeleteConfirm = (id: string, name: string) => {
    if (DEFAULT_CATEGORIES.includes(name)) {
      notification.warning({
        message: 'Cannot Delete Default Category',
        description: 'This is a default category and cannot be removed.'
      });
      return;
    }

    confirm({
      title: 'Are you sure you want to delete this tag?',
      icon: <ExclamationCircleOutlined />,
      content: `Category: ${name}`,
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk() {
        handleDeleteCategory(id);
      },
    });
  };

  const handleDeleteCategory = async (id: string) => {
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

      const settingsRef = doc(db, `companies/${companyId}/settings/expensecategories`);
      const settingsDoc = await getDoc(settingsRef);
      
      if (settingsDoc.exists()) {
        const currentCategories = settingsDoc.data().categories || [];
        const updatedCategories = currentCategories.filter((category: any) => category.id !== id);
        
        await setDoc(settingsRef, {
          categories: updatedCategories
        }, { merge: true });
        
        setCategories(prevCategories => prevCategories.filter(category => category.id !== id));
        notification.success({
          message: 'Success',
          description: 'Category deleted successfully'
        });
      }
    } catch (error) {
      console.error('Error deleting tag:', error);
      notification.error({
        message: 'Error',
        description: 'Failed to delete category'
      });
    }
  };

  const handleEditCategory = async (id: string, newName: string) => {
    try {
      if (!company?.id) return;
      if (!newName.trim()) {
        notification.error({
          message: 'Error',
          description: 'Category name cannot be empty'
        });
        return;
      }

      const settingsRef = doc(db, `companies/${company.id}/settings/expensecategories`);
      const settingsDoc = await getDoc(settingsRef);
      
      if (settingsDoc.exists()) {
        const currentCategories = settingsDoc.data().categories || [];
        const updatedCategories = currentCategories.map((category: any) => 
          category.id === id ? { ...category, name: newName.trim() } : category
        );
        
        await setDoc(settingsRef, {
          categories: updatedCategories
        }, { merge: true });
        
        setCategories(prevCategories => prevCategories.map(category => 
          category.id === id ? { ...category, name: newName.trim() } : category
        ));
        
        setEditingCategory(null);
        setEditingName('');
        notification.success({
          message: 'Success',
          description: 'Category updated successfully'
        });
      }
    } catch (error) {
      console.error('Error updating tag:', error);
      notification.error({
        message: 'Error',
        description: 'Failed to update category'
      });
    }
  };

  return (
    <div style={{ height: '500px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text type="secondary">
          Create expense categories to categorize your expenses.
        </Text>
        <Button
          type="link"
          icon={<PlusOutlined />}
          onClick={() => setIsModalVisible(true)}
        >
          Add Category
        </Button>
      </div>
      <Divider />
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
        gap: '16px',
        overflow: 'auto'
      }}>
        {categories.map(category => (
          <div
            key={category.id}
            style={{ position: 'relative' }}
            onMouseEnter={() => setHoveredId(category.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <Button
              style={{
                ...gridButtonStyle,
                backgroundColor: '#28a745',
                opacity: hoveredId === category.id ? 0.9 : 1,
              }}
            >
              <span style={{ 
                textAlign: 'center',
                marginRight: hoveredId === category.id && !DEFAULT_CATEGORIES.includes(category.name) ? '24px' : '0'
              }}>{category.name}</span>
              {hoveredId === category.id && !DEFAULT_CATEGORIES.includes(category.name) && (
                <DeleteOutlined
                  style={{ 
                    color: 'white',
                    position: 'absolute',
                    right: '10px'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    showDeleteConfirm(category.id, category.name);
                  }}
                />
              )}
            </Button>
          </div>
        ))}
      </div>

      <Modal
        title="Add New Category"
        open={isModalVisible}
        onOk={handleAddCategory}
        onCancel={() => {
          setIsModalVisible(false);
          setNewCategory('');
        }}
        okText="Save"
      >
        <div style={{ marginTop: 16 }}>
          <Text type="secondary">Category Name</Text>
          <Input
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="Enter category name"
            onPressEnter={handleAddCategory}
          />
        </div>
      </Modal>
    </div>
  );
};

export default ExpenseCategories;