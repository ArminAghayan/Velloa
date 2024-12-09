import React from 'react';
import { Button, Input, Select, Form, Radio, Upload, Space, Divider, FormInstance, Row, Col, Avatar, Drawer, Modal, notification } from 'antd';
import { IconPencil, IconUpload, IconCircleCheckFilled, IconCircleXFilled, IconSearch, IconPlus, IconTrash } from '@tabler/icons-react';
import { NumericFormat } from 'react-number-format';
import { customAlphabet } from 'nanoid';
import { collection, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../../../../firebase-config';
import NewVendorPage from '../../../people/applications/NewVendorPage';
import NewOwnerPage from '../../../people/applications/NewOwnerPage';


const generateTaskRefId = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 8);
interface Transaction {
  id?: string;
  date: string;
  description: string;
  amount: number;
  status: string;
  transaction_type: 'credit' | 'debit';
  category?: string;
  property?: string;
  payee?: string;
}

interface Person {
  id: string;
  firstName: string;
  lastName: string;
  peopleType?: string;
  emails?: Array<{ address: string }>;
  company?: string;
}

interface TransactionReviewPageProps {
  transaction: Transaction | null;
  onClose: () => void;
  form: FormInstance;
  isModalVisible: boolean;
}

const TransactionReviewPage: React.FC<TransactionReviewPageProps> = ({ 
  transaction,
  onClose,
  form,
  isModalVisible
}) => {
  const [referenceId, setReferenceId] = React.useState('');
  const [properties, setProperties] = React.useState<Array<{id: string; propertyName: string}>>([]);
  const [payees, setPayees] = React.useState<Person[]>([]);
  const [isVendorDrawerOpen, setIsVendorDrawerOpen] = React.useState(false);
  const [isOwnerDrawerOpen, setIsOwnerDrawerOpen] = React.useState(false);
  const [categories, setCategories] = React.useState<Array<{id: string; name: string}>>([]);
  const [isNewCategoryModalVisible, setIsNewCategoryModalVisible] = React.useState(false);
  const [newCategoryName, setNewCategoryName] = React.useState('');
  const [lineItems, setLineItems] = React.useState<number[]>([0]);
  const [formValues, setFormValues] = React.useState({});
  const [showMemo, setShowMemo] = React.useState(false);
  const [recordType, setRecordType] = React.useState<'expense' | 'transfer'>('expense');

  React.useEffect(() => {
    setRecordType('expense');
    
    if (!isModalVisible) {
      setShowMemo(false);
      setFormValues({});
      setLineItems([0]);
      setNewCategoryName('');
      setIsNewCategoryModalVisible(false);
      setIsVendorDrawerOpen(false);
      setIsOwnerDrawerOpen(false);
      setReferenceId('');
      form.resetFields();
    }
  }, [isModalVisible, form]);

  React.useEffect(() => {
    if (isModalVisible && transaction) {
      if (recordType === 'expense') {
        setReferenceId(generateTaskRefId());
      }
    } else if (!isModalVisible) {
      setReferenceId('');
    }
  }, [isModalVisible, transaction, recordType]);

  React.useEffect(() => {
    if (recordType === 'transfer' && !referenceId) {
      setReferenceId(generateTaskRefId());
    }
  }, [recordType, referenceId]);

  React.useEffect(() => {
    const fetchProperties = async () => {
      try {
        const propertiesSnapshot = await getDocs(collection(db, 'properties'));
        
        const propertyList = await Promise.all(propertiesSnapshot.docs.map(async (doc) => {
          const propertySettingsSnapshot = await getDocs(collection(db, `properties/${doc.id}/propertySettings`));
          const generalDoc = propertySettingsSnapshot.docs.find(doc => doc.id === 'general');
          const propertyData = generalDoc?.data();
          
          console.log('Property Data:', propertyData);
          
          return {
            id: doc.id,
            propertyName: propertyData?.propertyName || 'Unnamed Property'
          };
        }));
        
        console.log('Property List:', propertyList);
        setProperties(propertyList);
      } catch (error) {
        console.error('Error fetching properties:', error);
      }
    };

    fetchProperties();
  }, []);

  React.useEffect(() => {
    const fetchPayees = async () => {
      try {
        const payeesSnapshot = await getDocs(collection(db, 'people'));
        const payeeList = payeesSnapshot.docs.map(doc => ({
          ...doc.data() as Person,
          id: doc.id
        }));
        
        console.log('Payee List:', payeeList);
        setPayees(payeeList);
      } catch (error) {
        console.error('Error fetching payees:', error);
      }
    };

    fetchPayees();
  }, []);

  React.useEffect(() => {
    const fetchCategories = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser?.uid) return;

        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        const companyId = userDoc.data()?.companyuid;
        
        if (!companyId) return;

        const settingsRef = doc(db, `companies/${companyId}/settings/expensecategories`);
        const settingsDoc = await getDoc(settingsRef);

        if (settingsDoc.exists()) {
          const categoriesData = settingsDoc.data().categories || [];
          setCategories(categoriesData.map((cat: any) => ({
            id: cat.id,
            name: cat.name
          })));
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

  const handleClose = () => {
    setShowMemo(false);
    setFormValues({});
    setLineItems([0]);
    setNewCategoryName('');
    setIsNewCategoryModalVisible(false);
    setIsVendorDrawerOpen(false);
    setIsOwnerDrawerOpen(false);
    setReferenceId('');
    setRecordType('expense');
    
    form.resetFields();
    
    onClose();
  };

  const handleSubmit = (values: any) => {
    console.log('Form values:', values);
    handleClose();
  };

  const handleAddCategory = async () => {
    try {
      if (!newCategoryName.trim()) {
        notification.error({
          message: 'Category name cannot be empty'
        });
        return;
      }
      
      const currentUser = auth.currentUser;
      if (!currentUser?.uid) return;

      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      const companyId = userDoc.data()?.companyuid;
      
      if (!companyId) return;

      const settingsRef = doc(db, `companies/${companyId}/settings/expensecategories`);
      const settingsDoc = await getDoc(settingsRef);
      
      const newCategoryRef = doc(collection(db, 'temp'));
      const newCategoryData = {
        id: newCategoryRef.id,
        name: newCategoryName.trim(),
        createdAt: new Date()
      };

      await setDoc(settingsRef, {
        categories: settingsDoc.exists() 
          ? [...settingsDoc.data().categories || [], newCategoryData]
          : [newCategoryData]
      }, { merge: true });

      setCategories(prev => [...prev, { id: newCategoryData.id, name: newCategoryData.name }]);
      
      setNewCategoryName('');
      setIsNewCategoryModalVisible(false);
      notification.success({
        message: 'Category added successfully'
      });
    } catch (error) {
      console.error('Error adding category:', error);
      notification.error({
        message: 'Failed to add category'
      });
    }
  };

  const handleAddLineItem = () => {
    setLineItems(prev => [...prev, prev.length]);
  };

  const handleDeleteLineItem = (indexToDelete: number) => {
    setLineItems(prev => prev.filter((_, index) => index !== indexToDelete));
    
    // Clear form values for the deleted line item
    form.setFieldsValue({
      [`category_${indexToDelete}`]: undefined,
      [`property_${indexToDelete}`]: undefined,
      [`description_${indexToDelete}`]: undefined,
      [`amount_${indexToDelete}`]: undefined,
    });
  };

  // Group payees by type
  const groupedPayees = React.useMemo(() => {
    const vendors = payees.filter(p => p.peopleType === 'vendor');
    const owners = payees.filter(p => p.peopleType === 'owner');
    const tenants = payees.filter(p => p.peopleType === 'tenant');
    return { vendors, owners, tenants };
  }, [payees]);

  // Add this new function to calculate total from line items
  const calculateLineItemsTotal = () => {
    const total = lineItems.reduce((sum, index) => {
      const amount = form.getFieldValue(`amount_${index}`);
      if (!amount) return sum;
      
      // If amount is a string (with $ and commas), clean it
      if (typeof amount === 'string') {
        const cleanAmount = Number(amount.replace(/[$,]/g, ''));
        return sum + (isNaN(cleanAmount) ? 0 : cleanAmount);
      }
      
      // If amount is already a number, just use it
      return sum + (typeof amount === 'number' ? amount : 0);
    }, 0);
    
    return total;
  };

  // Add form content based on record type
  const renderFormContent = () => {
    if (recordType === 'transfer') {
      return (
        <>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            marginBottom: '16px'
          }}>
            <div style={{ 
              color: '#666',
              backgroundColor: '#f0f5ff',
              border: '1px solid #d6e4ff',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '14px'
            }}>
              Ref #{referenceId}
            </div>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr 2fr', 
            gap: '16px',
            marginTop: '16px'
          }}>
            <Form.Item
              name="account"
              rules={[{ required: true, message: 'Account is required' }]}
            >
              <Select
                placeholder="Account"
                style={{ width: '100%', height: '40px' }}
              >
                {/* Add your account options here */}
              </Select>
            </Form.Item>

            <Form.Item
              name="property"
              rules={[{ required: true, message: 'Property is required' }]}
            >
              <Select
                placeholder="Property"
                style={{ width: '100%', height: '40px' }}
                options={properties.map(prop => ({
                  value: prop.id,
                  label: prop.propertyName
                }))}
              />
            </Form.Item>

            <Form.Item name="description">
              <Input
                placeholder="Description"
                style={{ width: '100%', height: '40px' }}
              />
            </Form.Item>
          </div>
        </>
      );
    }

    return (
      <>
        {lineItems.map((index) => (
          <div key={index} style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr 2fr 1fr auto',
            gap: '16px', 
            minWidth: '900px', 
            alignItems: 'start'
          }}>
            <Form.Item 
              required
              rules={[{ required: true, message: 'Category is required' }]}
              name={`category_${index}`}
            >
              <Select 
                placeholder="Category"
                style={{ width: '250px', height: '40px' }}
                options={categories.map(cat => ({
                  value: cat.id,
                  label: cat.name
                }))}
                dropdownRender={(menu) => (
                  <>
                    <div style={{ padding: '8px', display: 'flex', gap: '8px', borderBottom: '1px solid #f0f0f0' }}>
                      <Button 
                        type="link" 
                        size="small" 
                        style={{ width: '100%' }}
                        onClick={() => setIsNewCategoryModalVisible(true)}
                      >
                        <IconPlus size={16} style={{ marginRight: 4 }} />
                        Add Category
                      </Button>
                    </div>
                    {menu}
                  </>
                )}
              />
            </Form.Item>

            <Form.Item 
              required
              rules={[{ required: true, message: 'Property is required' }]}
              name={`property_${index}`}
            >
              <Select 
                placeholder="Property"
                style={{ width: '100%', height: '40px' }}
                options={properties.map(prop => ({
                  value: prop.id,
                  label: prop.propertyName
                }))}
              />
            </Form.Item>

            <Form.Item 
              name={`description_${index}`}
              initialValue={index === 0 ? transaction?.description : undefined}
            >
              <Input 
                placeholder="Description"
                style={{ width: '100%', height: '40px' }}
              />
            </Form.Item>

            <Form.Item 
              required
              rules={[{ required: true, message: 'Amount is required' }]}
              name={`amount_${index}`}
              initialValue={index === 0 ? transaction?.amount : undefined}
            >
              <NumericFormat
                style={{ width: '100%', height: '40px' }} 
                placeholder="$ Amount"
                thousandSeparator=","
                decimalSeparator="."
                prefix="$ "
                decimalScale={2}
                fixedDecimalScale={true}
                allowNegative={true}
                onValueChange={(values: { formattedValue: string; value: string }) => {
                  const { formattedValue } = values;
                  form.setFieldsValue({ [`amount_${index}`]: formattedValue });
                  setFormValues(prev => ({ ...prev, [`amount_${index}`]: formattedValue }));
                }}
                customInput={Input}
              />
            </Form.Item>

            {lineItems.length > 1 && (
              <Button 
                type="text"
                danger
                icon={<IconTrash size={18} />}
                onClick={() => handleDeleteLineItem(index)}
                style={{ marginTop: '4px' }}
              />
            )}
          </div>
        ))}

        <Button type="link" style={{ padding: 0, height: 'auto' }} onClick={handleAddLineItem}>
          + Add Line Item
        </Button>

        <div style={{ marginTop: 16 }}>
          {showMemo ? (
            <Form.Item name="memo">
              <Input.TextArea 
                placeholder="Enter memo..." 
                rows={3}
              />
            </Form.Item>
          ) : (
            <Button 
              type="link" 
              style={{ padding: 0, height: 'auto' }} 
              onClick={() => setShowMemo(true)}
            >
              <Space>
                <IconPencil size={18} />
                Add memo
              </Space>
            </Button>
          )}
        </div>
      </>
    );
  };

  return (
    <>
      <div style={{ padding: '2px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Radio.Group 
            value={recordType} 
            onChange={(e) => setRecordType(e.target.value as 'expense' | 'transfer')} 
            style={{ marginBottom: 0 }}
          >
            <Radio value="expense">Record as New Expense</Radio>
            <Radio value="transfer">Record as New Transfer</Radio>
          </Radio.Group>
          
          <Space>
            <Button type="default" icon={<IconSearch size={18} />}>
              Match to an Existing Transaction
            </Button>
          </Space>
        </div>

        <Divider style={{ margin: '24px 0' }} />

        <Form 
          form={form}
          layout="horizontal"
          initialValues={{
            description_0: transaction?.description,
            amount_0: transaction?.amount,
            recordType: 'expense' // Add this initial value
          }}
          onFinish={handleSubmit}
        >
          {/* Conditionally render payee selection only for expenses */}
          {recordType === 'expense' && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <Form.Item name="payee" style={{ margin: 0, flex: 1 }}>
                <Select 
                  placeholder="Search payee..."
                  style={{ width: '400px', height: '40px' }}
                  dropdownStyle={{ width: '400px' }}
                  optionLabelProp="label"
                  showSearch
                  mode={undefined}
                  dropdownRender={(menu) => (
                    <>
                      <div style={{ padding: '8px', display: 'flex', gap: '8px', borderBottom: '1px solid #f0f0f0' }}>
                        <Button 
                          type="link" 
                          size="small" 
                          style={{ width: '33%' }}
                          onClick={() => setIsVendorDrawerOpen(true)}
                        >
                          <IconPlus size={16} style={{ marginRight: 4 }} />
                          Add Vendor
                        </Button>
                        <Button 
                          type="link" 
                          size="small" 
                          style={{ width: '33%' }}
                          onClick={() => setIsOwnerDrawerOpen(true)}
                        >
                          <IconPlus size={16} style={{ marginRight: 4 }} />
                          Add Owner
                        </Button>
                        <Button 
                          type="link" 
                          size="small" 
                          style={{ width: '33%' }}
                          onClick={() => setIsOwnerDrawerOpen(true)}
                        >
                          <IconPlus size={16} style={{ marginRight: 4 }} />
                          Add Tenant
                        </Button>
                      </div>
                      {menu}
                    </>
                  )}
                  filterOption={(input, option) => {
                    const label = option?.label?.toString().toLowerCase() || '';
                    const email = option?.value?.toString().toLowerCase() || '';
                    
                    return (
                      label.includes(input.toLowerCase()) ||
                      email.includes(input.toLowerCase())
                    );
                  }}
                >
                  <Select.OptGroup label="Vendors">
                    {groupedPayees.vendors.map(payee => (
                      <Select.Option 
                        key={payee.id} 
                        value={payee.id}
                        label={`${payee.firstName} ${payee.lastName} (${payee.company || 'No company'})`}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Avatar 
                            size={36}
                            style={{ 
                              backgroundColor: '#f0f0f0',
                              color: '#595959',
                              fontSize: '12px'
                            }}
                          >
                            {`${payee.firstName?.[0] || ''}${payee.lastName?.[0] || ''}`}
                          </Avatar>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span>{`${payee.firstName} ${payee.lastName} (${payee.company || 'No company'})`}</span>
                            <span style={{ fontSize: '12px', color: '#666' }}>
                              {payee.emails?.[0]?.address || 'No email'}
                            </span>
                          </div>
                        </div>
                      </Select.Option>
                    ))}
                  </Select.OptGroup>
                  <Select.OptGroup label="Owners">
                    {groupedPayees.owners.map(payee => (
                      <Select.Option 
                        key={payee.id} 
                        value={payee.id}
                        label={`${payee.firstName} ${payee.lastName} (${payee.company || 'No company'})`}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Avatar 
                            size={36}
                            style={{ 
                              backgroundColor: '#f0f0f0',
                              color: '#595959',
                              fontSize: '12px'
                            }}
                          >
                            {`${payee.firstName?.[0] || ''}${payee.lastName?.[0] || ''}`}
                          </Avatar>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span>{`${payee.firstName} ${payee.lastName} (${payee.company || 'No company'})`}</span>
                            <span style={{ fontSize: '12px', color: '#666' }}>
                              {payee.emails?.[0]?.address || 'No email'}
                            </span>
                          </div>
                        </div>
                      </Select.Option>
                    ))}
                  </Select.OptGroup>
                  <Select.OptGroup label="Tenants">
                    {groupedPayees.tenants.map(payee => (
                      <Select.Option 
                        key={payee.id} 
                        value={payee.id}
                        label={`${payee.firstName} ${payee.lastName}`}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Avatar 
                            size={36}
                            style={{ 
                              backgroundColor: '#f0f0f0',
                              color: '#595959',
                              fontSize: '12px'
                            }}
                          >
                            {`${payee.firstName?.[0] || ''}${payee.lastName?.[0] || ''}`}
                          </Avatar>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span>{`${payee.firstName} ${payee.lastName}`}</span>
                            <span style={{ fontSize: '12px', color: '#666' }}>
                              {payee.emails?.[0]?.address || 'No email'}
                            </span>
                          </div>
                        </div>
                      </Select.Option>
                    ))}
                  </Select.OptGroup>
                </Select>
              </Form.Item>
              <div style={{ 
                marginLeft: '16px', 
                color: '#666',
                backgroundColor: '#f0f5ff',
                border: '1px solid #d6e4ff',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '14px'
              }}>
                Ref #{referenceId}
              </div>
            </div>
          )}

          {renderFormContent()}

          <div style={{ marginTop: 24, borderRadius: '4px' }}>
            <Upload.Dragger
              accept=".jpg,.png,.mp4,.doc,.docx,.pdf,.xlsx,.xls"
              multiple
              showUploadList={false}
            >
              <p>
                <IconUpload size={18} /> Drag files or <a>Click here</a> to upload
              </p>
              <p style={{ color: '#666' }}>
                jpg, png, mp4, doc, docx, pdf, xlsx, xls, no larger than 50 MB.
              </p>
            </Upload.Dragger>
          </div>

          <Row 
            style={{ 
              marginTop: 24, 
              padding: '16px', 
              borderRadius: '8px',
              border: '1px solid #d9d9d9'
            }}
            justify="end"
            align="middle"
          >
            <Col style={{ width: '100px', display: 'flex', justifyContent: 'space-between' }}>
              <span>Total:</span>
              <span>${(transaction?.amount || 0).toFixed(2)}</span>
            </Col>
            <Col style={{ width: '180px', display: 'flex', justifyContent: 'space-between', marginLeft: '24px' }}>
              <span>New Expense Total:</span>
              <span>${calculateLineItemsTotal().toFixed(2)}</span>
            </Col>
            <Col style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '24px' }}>
              {Math.abs((transaction?.amount || 0) - calculateLineItemsTotal()) < 0.01 ? (
                <IconCircleCheckFilled size={18} stroke={1.5} color="#52c41a" />
              ) : (
                <IconCircleXFilled size={18} stroke={1.5} color="#ff4d4f" />
              )}
              <span>Difference: ${((transaction?.amount || 0) - calculateLineItemsTotal()).toFixed(2)}</span>
            </Col>
          </Row>
        </Form>
      </div>

      <Drawer
        title="Add New Vendor"
        placement="right"
        width={600}
        onClose={() => setIsVendorDrawerOpen(false)}
        open={isVendorDrawerOpen}
      >
        <NewVendorPage 
          visible={isVendorDrawerOpen}
          companyId="default"  // Replace with actual company ID if needed
          onClose={() => setIsVendorDrawerOpen(false)}
          onSubmitSuccess={() => {
            setIsVendorDrawerOpen(false);
            // Optionally refresh the payees list here
          }}
        />
      </Drawer>

      <Drawer
        title="Add New Owner"
        placement="right"
        width={600}
        onClose={() => setIsOwnerDrawerOpen(false)}
        open={isOwnerDrawerOpen}
      >
        <NewOwnerPage 
          visible={isOwnerDrawerOpen}
          companyId="default"  // Replace with actual company ID if needed
          onClose={() => setIsOwnerDrawerOpen(false)}
          onSubmitSuccess={() => {
            setIsOwnerDrawerOpen(false);
            // Optionally refresh the payees list here
          }}
        />
      </Drawer>

      <Modal
        title="Add New Category"
        open={isNewCategoryModalVisible}
        onOk={handleAddCategory}
        onCancel={() => {
          setIsNewCategoryModalVisible(false);
          setNewCategoryName('');
        }}
        okText="Save"
      >
        <div style={{ marginTop: 16 }}>
          <Input
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="Enter category name"
            onPressEnter={handleAddCategory}
          />
        </div>
      </Modal>

    </>
  );
};

export default TransactionReviewPage;
