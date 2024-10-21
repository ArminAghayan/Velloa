import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Steps,
  Form,
  Input,
  Button,
  message,
  Row,
  Col,
  Select,
  Upload,
  Switch,
  InputNumber,
  Divider,
  DatePicker,
  Card,
  Typography,
  Spin,
} from 'antd';
import {
  UserOutlined,
  MinusCircleOutlined,
  PlusOutlined,
  CarOutlined,
  TeamOutlined,
  SaveOutlined,
  PhoneOutlined,
  HomeOutlined,
  ProfileOutlined,
  LoadingOutlined,

} from '@ant-design/icons';
import {
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
  collectionGroup,
} from 'firebase/firestore';
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage';
import { db, auth } from '../../../firebase-config'; // Adjust the import path as needed
import { UploadFile } from 'antd/lib/upload/interface';
import moment from 'moment';


const { Option } = Select;
const { Title, Text } = Typography;

interface EditPersonDrawerProps {
  visible: boolean;
  onClose: () => void;
  companyId: string;
  onSubmitSuccess: () => void;
  personDetails?: any; // Changed from PersonDetails to any
  personId?: string;
  onUpdate?: (updatedDetails: any) => void;
}

interface Assignee {
  uid: string;
  name: string;
}

interface Property {
  id: string;
  name: string;
  units: Array<{ id: string; name: string }>;
}

interface PropertyRow {
  id: number;
  property: string | undefined;
  unit: string | undefined;
  propertyName?: string;
  unitName?: string;
}

const EditPersonDrawer: React.FC<EditPersonDrawerProps> = ({
  visible,
  onClose,
  companyId,
  personId,
  onUpdate,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm();
  const [propertyRows, setPropertyRows] = useState<PropertyRow[]>([
    { id: 0, property: undefined, unit: undefined },
  ]);
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Array<{ id: string; name: string }>>([]);
  const [loadingAssignees, setLoadingAssignees] = useState<boolean>(false);
  const [loadingProperties, setLoadingProperties] = useState<boolean>(false);
  const [loadingAllUnits, setLoadingAllUnits] = useState<boolean>(false);
  const [selectedUnits, setSelectedUnits] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [prospectId, setProspectId] = useState<string | null>(null); // New state for document ID
  const [avatarUploading, setAvatarUploading] = useState<boolean>(false); // State for avatar upload
  const [avatarFile, setAvatarFile] = useState<UploadFile | null>(null);
  const [showSecondaryAddress, setShowSecondaryAddress] = useState(false);
  const [allUnits, setAllUnits] = useState<{ [propertyId: string]: Array<{ id: string; name: string }> }>({});

  const storage = getStorage();
  const { Step } = Steps;

  const TwoStepView = () => {
    const startIndex = Math.floor(currentStep / 2) * 2;
    const visibleSteps = steps.slice(startIndex, startIndex + 2);

    return (
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
        
        <Steps current={currentStep % 2} style={{ flex: 1, margin: '0 10px' }}>
          {visibleSteps.map((step, index) => (
            <Step key={startIndex + index} title={step.title} icon={step.icon} />
          ))}
        </Steps>
      </div>
    );
  };


  useEffect(() => {
    if (visible && personId) {
      fetchPersonData();
    }
  }, [visible, personId]);

  useEffect(() => {
    if (visible && companyId) {
      fetchAssignees();
      fetchProperties();
    }
  }, [visible, companyId]);

const fetchPersonData = async () => {
  if (!personId) return;

  try {
    const personDoc = await getDoc(doc(db, 'people', personId));
    if (personDoc.exists()) {
      const personData = personDoc.data();
      
      // Fetch property and unit names
      const propertiesWithNames = await Promise.all(
        (personData.properties || []).map(async (prop: any) => {
          let propertyName = 'Unknown Property';
          let unitName = 'Unknown Unit';

          if (prop.property) {
            const propertyDoc = await getDoc(doc(db, 'properties', prop.property));
            const propertyData = propertyDoc.data();
            if (propertyData) {
              const settingsSnapshot = await getDocs(collection(db, 'properties', prop.property, 'propertySettings'));
              const settingsData = settingsSnapshot.docs[0]?.data();
              propertyName = settingsData?.propertyName || 'Unnamed Property';
            }
          }

          if (prop.unit) {
            const unitDoc = await getDoc(doc(db, 'properties', prop.property, 'units', prop.unit));
            const unitData = unitDoc.data();
            unitName = unitData?.unitNumber || unitData?.unitName || 'Unnamed Unit';
          }

          return {
            ...prop,
            propertyName,
            unitName,
          };
        })
      );

      // Populate form fields with personData, including propertyName and unitName
      form.setFieldsValue({
        firstName: personData.firstName,
        middleName: personData.middleName,
        lastName: personData.lastName,
        company: personData.company,
        jobTitle: personData.jobTitle,
        notes: personData.notes,
        phones: personData.phones || [{ type: 'mobile', number: '' }],
        emails: personData.emails || [{ type: 'primary', address: '' }],
        addresses: personData.addresses || [{
          street: '',
          city: '',
          state: '',
          postalCode: '',
          country: '',
          isPrimary: true,
        }],
        assignees: personData.assignees?.map((assignee: any) => assignee.uid) || [],
        leadStatus: personData.leadStatus || 'new',
        leadSource: personData.leadSource,
        leadMedium: personData.leadMedium,
        minBedrooms: personData.minBedrooms,
        minBathrooms: personData.minBathrooms,
        maxRent: personData.maxRent,
        moveInDate: personData.moveInDate ? moment(personData.moveInDate.toDate()) : undefined,
        properties: propertiesWithNames.map((prop) => ({
          property: prop.property,
          unit: prop.unit,
          propertyName: prop.propertyName,
          unitName: prop.unitName,
        })),
        pets: personData.pets || [{}],
        vehicles: personData.vehicles || [{}],
        dependents: personData.dependents || [{}],
      });

      // Update propertyRows state with propertyName and unitName
      setPropertyRows(propertiesWithNames.map((prop, index) => ({
        id: index,
        property: prop.property,
        unit: prop.unit,
        propertyName: prop.propertyName,
        unitName: prop.unitName,
      })));

      // Update selectedUnits to prevent duplicate unit selection
      setSelectedUnits(new Set(propertiesWithNames.map(prop => prop.unit).filter(Boolean)));

      // Set avatar file if exists
      if (personData.avatar) {
        setAvatarFile({
          uid: '-1',
          name: 'avatar',
          status: 'done',
          url: personData.avatar,
        });
      }

      // Check if there's a second address and set the toggle accordingly
      if (personData.addresses && personData.addresses.length > 1) {
        setShowSecondaryAddress(true);
        form.setFieldsValue({ hasSecondaryAddress: true });
      }
    }
  } catch (error) {
    console.error('Error fetching person data:', error);
    message.error('Failed to fetch person data. Please try again.');
  }
};

  const fetchAssignees = async () => {
    setLoadingAssignees(true);
    try {
      const usersQuery = query(
        collection(db, 'users'),
        where('companyuid', '==', companyId)
      );

      const usersSnapshot = await getDocs(usersQuery);

      if (usersSnapshot.empty) {
        message.warning('No users found for this company.');
        setAssignees([]);
        return;
      }

      const assigneeData: Assignee[] = usersSnapshot.docs.map(
        (doc) => {
          const userData = doc.data();
          return {
            uid: doc.id,
            name: `${userData.firstName || ''} ${userData.lastName || ''}`
              .trim() || 'Unknown User',
          };
        }
      );

      setAssignees(assigneeData);
    } catch (error) {
      console.error('Error fetching assignees:', error);
      message.error('Failed to fetch assignees. Please try again.');
    } finally {
      setLoadingAssignees(false);
    }
  };

  const fetchProperties = async () => {
    setLoadingProperties(true);
    try {
      const propertiesQuery = query(
        collection(db, 'properties'),
        where('companyuid', '==', companyId)
      );
      const querySnapshot = await getDocs(propertiesQuery);

      const propertiesData: Property[] = await Promise.all(
        querySnapshot.docs.map(async (doc) => {
          const propertySettingsSnapshot = await getDocs(
            collection(db, 'properties', doc.id, 'propertySettings')
          );
          const settingsDoc = propertySettingsSnapshot.docs[0];
          const settingsData = settingsDoc?.data() || {};

          // Fetch units for this property
          const unitsSnapshot = await getDocs(collection(db, 'properties', doc.id, 'units'));
          const units = unitsSnapshot.docs.map(unitDoc => ({
            id: unitDoc.id,
            name: unitDoc.data().unitNumber || unitDoc.data().unitName || `Unit ${unitDoc.id}`,
          }));

          return {
            id: doc.id,
            name: settingsData.propertyName || 'Unnamed Property',
            units: units,
          };
        })
      );

      setProperties(propertiesData);
      
      // Create allUnits object
      const allUnitsData = propertiesData.reduce((acc, property) => {
        acc[property.id] = property.units;
        return acc;
      }, {} as { [propertyId: string]: Array<{ id: string; name: string }> });
      
      setAllUnits(allUnitsData);

      // Update the units state with all fetched units
      const allUnitsList = propertiesData.flatMap(property => property.units);
      setUnits(allUnitsList);

    } catch (error) {
      console.error('Error fetching properties:', error);
      message.error('Failed to fetch properties. Please try again.');
    } finally {
      setLoadingProperties(false);
    }
  };

  const handlePropertyChange = async (value: string | undefined, index: number) => {
    setPropertyRows((prevRows) => {
      const newRows = [...prevRows];
      if (newRows[index].unit) {
        setSelectedUnits((prev) => {
          const newSet = new Set(prev);
          newSet.delete(newRows[index].unit!);
          return newSet;
        });
      }
      newRows[index] = { ...newRows[index], property: value, unit: undefined, unitName: undefined };
      return newRows;
    });
    form.setFieldsValue({ 
      [`properties.${index}.unit`]: undefined, 
      [`properties.${index}.unitName`]: undefined 
    });
    if (value) {
      const selectedProperty = properties.find(prop => prop.id === value);
      if (selectedProperty) {
        setUnits(selectedProperty.units);
        form.setFieldsValue({ [`properties.${index}.propertyName`]: selectedProperty.name });
      }
    } else {
      form.setFieldsValue({ [`properties.${index}.propertyName`]: undefined });
    }
  };

  const handleUnitChange = async (value: string | undefined, index: number) => {
    const selectedUnit = units.find(unit => unit.id === value);

    setPropertyRows((prevRows) => {
      const newRows = [...prevRows];
      if (newRows[index].unit) {
        setSelectedUnits((prev) => {
          const newSet = new Set(prev);
          newSet.delete(newRows[index].unit!);
          return newSet;
        });
      }
      newRows[index] = { 
        ...newRows[index], 
        unit: value, 
        unitName: selectedUnit ? selectedUnit.name : undefined 
      };
      return newRows;
    });

    if (value) {
      setSelectedUnits((prev) => new Set(prev).add(value));
    }

    // Update both the unit and unitName in the form fields
    form.setFieldsValue({
      [`properties.${index}.unit`]: value,
      [`properties.${index}.unitName`]: selectedUnit ? selectedUnit.name : undefined,
    });
  };

  const handleRemoveProperty = (id: number) => {
    setPropertyRows((prevRows) => {
      if (!prevRows || prevRows.length === 0) {
        return [{ id: 0, property: undefined, unit: undefined }];
      }
      if (prevRows.length === 1) {
        // If it's the last row, clear it instead of removing
        return [{ id: 0, property: undefined, unit: undefined }];
      }
      const rowToRemove = prevRows.find((row) => row.id === id);
      if (rowToRemove && rowToRemove.unit) {
        setSelectedUnits((prev) => {
          const newSet = new Set(prev);
          newSet.delete(rowToRemove.unit!);
          return newSet;
        });
      }
      return prevRows.filter((row) => row.id !== id);
    });

    // Update the form fields
    const currentProperties = form.getFieldValue('properties');
    if (!currentProperties || currentProperties.length === 0) {
      form.setFieldsValue({
        properties: [{ property: undefined, unit: undefined }],
      });
    } else if (currentProperties.length === 1) {
      // If it's the last row, clear it instead of removing
      form.setFieldsValue({
        properties: [{ property: undefined, unit: undefined }],
      });
    } else {
      const updatedProperties = currentProperties.filter(
        (_: any, index: number) => index !== id
      );
      form.setFieldsValue({ properties: updatedProperties });
    }
  };

  // Initialize form with default values
// Inside the useEffect that initializes form fields
useEffect(() => {
  form.setFieldsValue({
    phones: [{ type: 'mobile', number: '' }],
    emails: [{ type: 'primary', address: '' }],
    pets: [{}],
    vehicles: [{}],
    dependents: [{}],
    addresses: [{
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
      isPrimary: true,
    }],
  });
}, [form]);

  const handleAddAdditionalProperty = () => {
    setPropertyRows((prevRows) => [
      ...prevRows,
      { id: prevRows.length, property: undefined, unit: undefined },
    ]);

    // Clear the form fields for the new property
    const currentProperties = form.getFieldValue('properties') || [];
    form.setFieldsValue({
      properties: [...currentProperties, { property: undefined, unit: undefined }],
    });
  };

  const getFieldsForStep = (step: number) => {
    switch (step) {
      case 0:
        return [
          'avatar',
          'firstName',
          'middleName',
          'lastName',
          'company',
          'jobTitle',
          'notes',
        ];
      case 1:
        return ['phones', 'emails'];
      case 2:
        return [
          'addresses',
        ];
      case 3:
        return [
          'assignees',
          'leadStatus',
          'leadSource',
          'leadMedium',
          'minBedrooms',
          'minBathrooms',
          'maxRent',
          'moveInDate',
          'properties',
        ];
      case 4:
        return ['pets'];
      case 5:
        return ['vehicles'];
      case 6:
        return ['dependents'];
      default:
        return [];
    }
  };



  const prev = () => {
    setCurrentStep(currentStep - 1);
  };
  const cleanFormData = (data: any) => {
    // Helper function to remove undefined values and empty objects
    const clean = (obj: any): any => {
      Object.keys(obj).forEach(key => {
        if (obj[key] && typeof obj[key] === 'object') {
          clean(obj[key]);
        } else if (obj[key] === undefined) {
          delete obj[key];
        }
      });
      return obj;
    };
  
    // Clean the main data object
    let cleanedData = clean(data);
  
    // Handle nested arrays
    if (cleanedData.addresses) {
      cleanedData.addresses = cleanedData.addresses.filter((addr: any) =>
        addr.street || addr.city || addr.state || addr.postalCode || addr.country
      );
    }
  
    if (cleanedData.properties) {
      cleanedData.properties = cleanedData.properties.filter((prop: any) => 
        prop && (prop.property || prop.unit)
      );
    }
    if (cleanedData.phones) {
      cleanedData.phones = cleanedData.phones.filter((phone: any) => 
        phone && phone.number
      );
    }
    if (cleanedData.emails) {
      cleanedData.emails = cleanedData.emails.filter((email: any) => 
        email && email.address
      );
    }
    if (cleanedData.pets) {
      cleanedData.pets = cleanedData.pets.filter((pet: any) => 
        pet && Object.keys(pet).length > 0
      );
    }
    if (cleanedData.vehicles) {
      cleanedData.vehicles = cleanedData.vehicles.filter((vehicle: any) => 
        vehicle && Object.keys(vehicle).length > 0
      );
    }
    if (cleanedData.dependents) {
      cleanedData.dependents = cleanedData.dependents.filter((dependent: any) => 
        dependent && Object.keys(dependent).length > 0
      );
    }
  
    // Set default leadStatus to "new" if not selected
    if (!cleanedData.leadStatus) {
      cleanedData.leadStatus = "new";
    }
  
    return cleanedData;
  };


  const handleSubmit = async () => {
    try {
      await form.validateFields();
      setSubmitting(true);
  
      if (!personId) {
        throw new Error('No personId provided for update');
      }
  
      let formData = form.getFieldsValue(true);
      formData = cleanFormData(formData);
  
      // Convert Moment objects to Date objects
      if (formData.moveInDate) {
        formData.moveInDate = formData.moveInDate.toDate();
      }
  
      if (formData.dependents) {
        formData.dependents = formData.dependents.map((dependent: any) => {
          if (dependent.dateOfBirth) {
            dependent.dateOfBirth = dependent.dateOfBirth.toDate();
          }
          return dependent;
        });
      }
  
      // Create assignees array with objects containing uid
      const assignees = formData.assignees && Array.isArray(formData.assignees)
        ? formData.assignees.map((uid: string) => ({ uid }))
        : [];
  
      // Remove the assignees field
      delete formData.assignees;
  
      // Fetch company name
      let companyName = '';
      try {
        const companyDoc = await getDoc(doc(db, 'companies', companyId));
        if (companyDoc.exists()) {
          companyName = companyDoc.data().companyName || '';
        }
      } catch (error) {
        console.error('Error fetching company name:', error);
      }
  
      // Handle Addresses
      const addresses = formData.addresses || [];
      delete formData.addresses;
  
      // Add additional fields
      formData = {
        ...formData,
        companyId,
        companyName,
        updatedBy: auth.currentUser?.uid,
        updatedAt: serverTimestamp(),
        assignees,
        addresses,
      };
  
      // Create a reference to the person document
      const personDocRef = doc(db, 'people', personId);
  
      // Update the existing document in Firestore
      await updateDoc(personDocRef, formData);
  
      message.success('Person updated successfully!');
      onClose();
      onUpdate && onUpdate(formData);
    } catch (error) {
      console.error('Error during update:', error);
      if (error instanceof Error) {
        message.error(`Failed to update person: ${error.message}`);
      } else {
        message.error('Failed to update person. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const next = async () => {
    try {
      const fieldsToValidate = getFieldsForStep(currentStep);
      await form.validateFields(fieldsToValidate);

      // Additional validation for the contact info step
      if (currentStep === 1) { // Assuming contact info is step 1
        const formValues = form.getFieldsValue();
        const emails = formValues.emails || [];
        const hasValidEmail = emails.some((email: { address?: string }) => email && email.address);

        if (!hasValidEmail) {
            throw new Error('Please provide at least one email address.');
          }
        }

      setCurrentStep(currentStep + 1);
    } catch (error) {
      console.error('Validation failed:', error);
      if (error instanceof Error) {
        message.error(error.message);
      } else {
        message.error('Please fix the errors before proceeding.');
      }
    }
  };

  const resetDrawer = () => {
    form.resetFields();
    setCurrentStep(0);
    setPropertyRows([{ id: 0, property: undefined, unit: undefined }]);
    setSelectedUnits(new Set());
    setAvatarFile(null); // Reset the avatar file
    setProspectId(null);
    // Reset any other state variables you've added
  };

  const handleDrawerClose = () => {
    resetDrawer();
    onClose();
  };

  const handleAvatarUpload = async (file: File) => {
    setAvatarUploading(true);
    try {
      const fileRef = storageRef(storage, `avatars/${auth.currentUser?.uid}/${file.name}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      form.setFieldsValue({ avatar: url });
      setAvatarFile({
        uid: '-1',
        name: file.name,
        status: 'done',
        url: url,
      });
      message.success('Avatar uploaded successfully!');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      message.error('Failed to upload avatar. Please try again.');
    } finally {
      setAvatarUploading(false);
    }
  };

  const beforeUpload = (file: File) => {
    const isJpgOrPdf = file.type === 'image/jpeg' || file.type === 'application/pdf';
    if (!isJpgOrPdf) {
      message.error('You can only upload JPG or PDF files!');
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('File must be smaller than 2MB!');
    }
    return isJpgOrPdf && isLt2M;
  };

  const uploadButton = (
    <div>
      {avatarUploading ? <LoadingOutlined /> : <UserOutlined style={{ fontSize: 32 }} />}
      <div style={{ marginTop: 8 }}>Upload Photo</div>
    </div>
  );

  const steps = [
    {
      title: 'Personal Info',
      content: (
        <Form
          form={form}
          layout="vertical"
          name="personal_info"
          initialValues={{
            firstName: '',
            middleName: '',
            lastName: '',
            company: '',
            jobTitle: '',
            notes: '',
            avatar: '',
          }}
        >
          <Row justify="start" style={{ marginTop: 24,}}>
            <Col>
              <Form.Item name="avatar">
                <Upload
                  name="avatar"
                  listType="picture-card"
                  className="avatar-uploader"
                  showUploadList={false}
                  beforeUpload={beforeUpload}
                  customRequest={({ file, onSuccess }) => {
                    handleAvatarUpload(file as File).then(() => {
                      onSuccess && onSuccess('ok');
                    });
                  }}
                  accept=".jpg,.jpeg,.pdf"
                  fileList={avatarFile ? [avatarFile] : []}
                >
                  {avatarFile ? (
                    <img
                      src={avatarFile.url}
                      alt="avatar"
                      style={{ width: '100%' }}
                    />
                  ) : (
                    uploadButton
                  )}
                </Upload>
              </Form.Item>
            </Col>
          </Row>
          <Divider  />
          <Row gutter={16}>
            <Col span={8} >
              <Form.Item
                name="firstName"
                rules={[{ required: true, message: 'Please enter the first name' }]}
              >
                <Input placeholder="First Name" size="middle" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="middleName">
                <Input placeholder="Middle Name" size="middle" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="lastName"
                rules={[{ required: true, message: 'Please enter the last name' }]}
              >
                <Input placeholder="Last Name" size="middle" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="company"
                rules={[{ required: true, message: 'Please enter the company name' }]}
              >
                <Input placeholder="Company" size="middle" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="jobTitle"
                rules={[{ required: true, message: 'Please enter the job title' }]}
              >
                <Input placeholder="Job Title" size="middle" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Notes"
            name="notes"
            rules={[
              { max: 10000, message: 'Notes cannot exceed 10000 characters' },
            ]}
          >
            <Input.TextArea
              rows={4}
              placeholder="Additional notes"
              maxLength={10000}
              showCount
            />
          </Form.Item>
        </Form>
      ),
      icon: <UserOutlined />,
    },
    {
      title: 'Contact Info',
      content: (
        <Form
          form={form}
          layout="vertical"
          name="contact_info"
          style={{ marginTop: 24 }}
        >
          <Form.List name="phones" initialValue={[{ type: 'mobile', number: '' }]}>
            {(fields, { add, remove }) => (
              <>
                {fields.map((field, index) => (
                  <Row gutter={16} key={field.key} className="contactRow">
                    <Col span={10}>
                      <Form.Item
                        name={[field.name, 'type']}
                        noStyle
                      >
                        <Select placeholder="Type" className="contactSelect" size="middle">
                          <Option value="mobile">Mobile</Option>
                          <Option value="work">Work</Option>
                          <Option value="home">Home</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name={[field.name, 'number']}
                        noStyle
                        rules={[
                          {
                            required: true,
                            message: 'Please enter a phone number',
                          },
                          {
                            pattern: /^\+?[1-9]\d{1,14}$/,
                            message: 'Please enter a valid phone number',
                          },
                        ]}
                      >
                        <Input
                          placeholder="Enter phone number"
                          className="contactInput"
                          size="middle"
                        />
                      </Form.Item>
                    </Col>
                    <Col span={2}>
                      {fields.length > 1 && (
                        <MinusCircleOutlined onClick={() => remove(field.name)} />
                      )}
                    </Col>
                  </Row>
                ))}
                <Button type="link" onClick={() => add()} className="addButton">
                  + Add Another Phone
                </Button>
              </>
            )}
          </Form.List>

          <Form.List name="emails" initialValue={[{ type: 'primary', address: '' }]}>
            {(fields, { add, remove }) => (
              <>
                {fields.map((field, index) => (
                  <Row gutter={16} key={field.key} className="contactRow">
                    <Col span={10}>
                      <Form.Item
                        name={[field.name, 'type']}
                        noStyle
                      >
                        <Select placeholder="Type" className="contactSelect" size="middle">
                          <Option value="primary">Primary</Option>
                          <Option value="work">Work</Option>
                          <Option value="personal">Personal</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name={[field.name, 'address']}
                        noStyle
                        rules={[
                          {
                            required: true,
                            message: 'Please enter an email address',
                          },
                          {
                            type: 'email',
                            message: 'Please enter a valid email address',
                          },
                        ]}
                      >
                        <Input
                          placeholder="Enter email address"
                          className="contactInput"
                          size="middle"
                        />
                      </Form.Item>
                    </Col>
                    <Col span={2}>
                      {fields.length > 1 && (
                        <MinusCircleOutlined onClick={() => remove(field.name)} />
                      )}
                    </Col>
                  </Row>
                ))}
                <Button type="link" onClick={() => add()} className="addButton">
                  + Add Another Email
                </Button>
              </>
            )}
          </Form.List>

          <Form.Item>
            <div style={{ color: '#ff4d4f', marginTop: 8 }}>
              Please enter an email address! You can optionally add a mobile phone number
            </div>
          </Form.Item>
        </Form>
      ),
      icon: <PhoneOutlined />,
    },
    {
      title: 'Address',
      content: (
        <Form
          form={form}
          layout="vertical"
          name="address_info"
          style={{ marginTop: 24 }}
        >
          <Card title="Primary Address" style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item
                  name={['addresses', 0, 'street']}
                  label="Street Address"
                  rules={[{ required: true, message: 'Please enter the street address' }]}
                >
                  <Input placeholder="Enter street address" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name={['addresses', 0, 'city']}
                  label="City"
                  rules={[{ required: true, message: 'Please enter the city' }]}
                >
                  <Input placeholder="Enter city" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name={['addresses', 0, 'state']}
                  label="State/Province"
                  rules={[{ required: true, message: 'Please enter the state or province' }]}
                >
                  <Input placeholder="Enter state or province" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name={['addresses', 0, 'postalCode']}
                  label="Postal Code"
                  rules={[{ required: true, message: 'Please enter the postal code' }]}
                >
                  <Input placeholder="Enter postal code" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name={['addresses', 0, 'country']}
                  label="Country"
                  rules={[{ required: true, message: 'Please select the country' }]}
                >
                  <Select
                    placeholder="Select country"
                    style={{
                      height: '40px',
                      fontSize: '14px',
                    }}
                    dropdownStyle={{
                      maxHeight: 400,
                      overflow: 'auto',
                      fontSize: '14px',
                    }}
                  >
                    <Option value="us">United States</Option>
                    <Option value="ca">Canada</Option>
                    {/* Add more countries as needed */}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Form.Item
            label="Add Secondary Address"
            name="hasSecondaryAddress"
            valuePropName="checked"
          >
            <Switch
              checked={showSecondaryAddress}
              onChange={(checked) => {
                setShowSecondaryAddress(checked);
                form.setFieldsValue({ hasSecondaryAddress: checked });
              }}
              checkedChildren="Yes"
              unCheckedChildren="No"
            />
          </Form.Item>

          {showSecondaryAddress && (
            <Card title="Secondary Address" style={{ marginTop: 16 }}>
              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item
                    name={['addresses', 1, 'street']}
                    label="Street Address"
                    rules={[{ required: true, message: 'Please enter the street address' }]}
                  >
                    <Input placeholder="Enter street address" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name={['addresses', 1, 'city']}
                    label="City"
                    rules={[{ required: true, message: 'Please enter the city' }]}
                  >
                    <Input placeholder="Enter city" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name={['addresses', 1, 'state']}
                    label="State/Province"
                    rules={[{ required: true, message: 'Please enter the state or province' }]}
                  >
                    <Input placeholder="Enter state or province" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name={['addresses', 1, 'postalCode']}
                    label="Postal Code"
                    rules={[{ required: true, message: 'Please enter the postal code' }]}
                  >
                    <Input placeholder="Enter postal code" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name={['addresses', 1, 'country']}
                    label="Country"
                    rules={[{ required: true, message: 'Please select the country' }]}
                  >
                    <Select
                      placeholder="Select country"
                      style={{
                        height: '40px',
                        fontSize: '14px',
                      }}
                      dropdownStyle={{
                        maxHeight: 400,
                        overflow: 'auto',
                        fontSize: '14px',
                      }}
                    >
                      <Option value="us">United States</Option>
                      <Option value="ca">Canada</Option>
                      {/* Add more countries as needed */}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          )}
        </Form>
      ),
      icon: <HomeOutlined />,
    },
    {
      title: 'Profile',
      content: (
        <Form
          form={form}
          layout="vertical"
          name="profile_info"
          style={{ marginTop: 24 }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="assignees" label="Assignees">
                <Select
                  mode="multiple"
                  loading={loadingAssignees}
                  placeholder="Select assignees"
                >
                  {assignees.map((assignee) => (
                    <Option key={assignee.uid} value={assignee.uid}>
                      {assignee.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="leadStatus" label="Lead Status">
                <Select
                  placeholder="Select lead status"
                  style={{ height: '40px' }}
                >
                  <Option value="new">New</Option>
                  <Option value="contacted">Contacted</Option>
                  <Option value="qualified">Qualified</Option>
                  <Option value="unqualified">Unqualified</Option>
                  <Option value="closed">Closed</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="leadSource" label="Lead Source">
                <Select
                  placeholder="Select lead source"
                  style={{ height: '40px' }}
                >
                  <Option value="website">Website</Option>
                  <Option value="referral">Referral</Option>
                  <Option value="social">Social Media</Option>
                  <Option value="other">Other</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="leadMedium" label="Lead Medium">
                <Input
                  placeholder="Enter lead medium"
                  style={{ height: '40px' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">Criteria</Divider>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="minBedrooms" label="Min Bedrooms">
                <InputNumber
                  min={0}
                  placeholder="Enter number"
                  style={{ width: '100%', height: '40px', padding: '4px 0px' }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="minBathrooms" label="Min Bathrooms">
                <InputNumber
                  min={0}
                  step={0.5}
                  placeholder="Enter number"
                  style={{
                    height: '40px',
                    width: '100%',
                    padding: '4px 0px',
                  }}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="maxRent" label="Max Rent">
                <InputNumber
                  min={0}
                  formatter={(value: number | undefined) =>
                    `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                  }
                  parser={(value: string | undefined) =>
                    value ? parseFloat(value.replace(/\$\s?|(,*)/g, '')) : 0
                  }
                  style={{
                    width: '100%',
                    height: '40px',
                    padding: '4px 0px',
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="moveInDate" label="Move-in Date">
                <DatePicker
                  style={{ width: '100%', height: '40px', padding: '8px 10px' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">Related To</Divider>

          {propertyRows.map((row, index) => (
            <div key={row.id}>
              <Row gutter={16}>
                <Col span={11}>
                  <Form.Item
                    name={['properties', index, 'property']}
                    label="Property"
                    rules={[{ required: false }]}
                  >
                    <Select
                      placeholder="Search and select property"
                      showSearch
                      allowClear
                      optionFilterProp="children"
                      onChange={(value: string | undefined) =>
                        handlePropertyChange(value, index)
                      }
                      loading={loadingProperties}
                      filterOption={(input, option) =>
                        (option?.children as unknown as string)
                          .toLowerCase()
                          .includes(input.toLowerCase())
                      }
                      style={{ width: '100%' }}
                    >
                      {properties.map((property) => (
                        <Option key={property.id} value={property.id}>
                          {property.name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={11}>
                  <Form.Item
                    name={['properties', index, 'unit']}
                    label="Unit"
                    rules={[
                      {
                        required: !!row.property,
                        message: 'Please select a unit',
                      },
                    ]}
                  >
                    <Select
                      placeholder="Search and select unit"
                      showSearch
                      allowClear
                      optionFilterProp="children"
                      onChange={(value: string | undefined) =>
                        handleUnitChange(value, index)
                      }
                      disabled={!row.property}
                      loading={loadingAllUnits}
                      filterOption={(input, option) =>
                        (option?.children as unknown as string)
                          .toLowerCase()
                          .includes(input.toLowerCase())
                      }
                      style={{ width: '100%' }}
                    >
                      {units
                        .filter(
                          (unit) =>
                            !selectedUnits.has(unit.id) || unit.id === row.unit
                        )
                        .map((unit: { id: string; name: string }) => (
                          <Option key={unit.id} value={unit.id}>
                            {unit.name}
                          </Option>
                        ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={2}>
                  <Button
                    type="text"
                    icon={<MinusCircleOutlined />}
                    onClick={() => handleRemoveProperty(row.id)}
                    style={{ marginTop: 29 }}
                  />
                </Col>
              </Row>
            </div>
          ))}

          <Form.Item>
            <Button
              onClick={handleAddAdditionalProperty}
              type="link"
              icon={<PlusOutlined />}
              style={{ padding: 0 }}
            >
              Add Additional Property
            </Button>
          </Form.Item>
        </Form>
      ),
      icon: <ProfileOutlined />,
    },
    {
      title: 'Vehicles',
      content: (
        <Form
          form={form}
          layout="vertical"
          name="vehicles_info"
          style={{ marginTop: 24 }}
          initialValues={{ vehicles: [{}] }} // Initialize with one empty vehicle
        >
          <Form.List name="vehicles" initialValue={[{}]}>
          {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }, index) => (
                  <div
                    key={key}
                    style={{
                      marginBottom: 24,
                      border: '1px solid #d9d9d9',
                      padding: 16,
                      borderRadius: 8,
                    }}
                  >
                    <Row gutter={16}>
                      <Col span={8}>
                        <Form.Item
                          {...restField}
                          name={[name, 'make']}
                          label="Make"
                          rules={[
                            ({ getFieldValue }) => ({
                              validator(_, value) {
                                const vehicles = getFieldValue('vehicles');
                                const currentVehicle = vehicles[index];
                                if (
                                  Object.values(currentVehicle).some((val) => val) &&
                                  !value
                                ) {
                                  return Promise.reject('Please enter make');
                                }
                                return Promise.resolve();
                              },
                            }),
                          ]}
                        >
                          <Input placeholder="Enter make" />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item
                          {...restField}
                          name={[name, 'model']}
                          label="Model"
                          rules={[
                            ({ getFieldValue }) => ({
                              validator(_, value) {
                                const vehicles = getFieldValue('vehicles');
                                const currentVehicle = vehicles[index];
                                if (
                                  Object.values(currentVehicle).some((val) => val) &&
                                  !value
                                ) {
                                  return Promise.reject('Please enter model');
                                }
                                return Promise.resolve();
                              },
                            }),
                          ]}
                        >
                          <Input placeholder="Enter model" />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item
                          {...restField}
                          name={[name, 'year']}
                          label="Year"
                          rules={[
                            ({ getFieldValue }) => ({
                              validator(_, value) {
                                const vehicles = getFieldValue('vehicles');
                                const currentVehicle = vehicles[index];
                                if (
                                  Object.values(currentVehicle).some((val) => val) &&
                                  !value
                                ) {
                                  return Promise.reject('Please enter year');
                                }
                                return Promise.resolve();
                              },
                            }),
                          ]}
                        >
                          <InputNumber
                            style={{
                              width: '100%',
                              padding: '5px 0px',
                            }}
                            placeholder="Enter year"
                            min={1900}
                            max={new Date().getFullYear() + 1}
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={16}>
                      <Col span={8}>
                        <Form.Item
                          {...restField}
                          name={[name, 'color']}
                          label="Color"
                          rules={[
                            ({ getFieldValue }) => ({
                              validator(_, value) {
                                const vehicles = getFieldValue('vehicles');
                                const currentVehicle = vehicles[index];
                                if (
                                  Object.values(currentVehicle).some((val) => val) &&
                                  !value
                                ) {
                                  return Promise.reject('Please enter color');
                                }
                                return Promise.resolve();
                              },
                            }),
                          ]}
                        >
                          <Input placeholder="Enter color" />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item
                          {...restField}
                          name={[name, 'licensePlate']}
                          label="License Plate"
                          rules={[
                            ({ getFieldValue }) => ({
                              validator(_, value) {
                                const vehicles = getFieldValue('vehicles');
                                const currentVehicle = vehicles[index];
                                if (
                                  Object.values(currentVehicle).some((val) => val) &&
                                  !value
                                ) {
                                  return Promise.reject(
                                    'Please enter license plate'
                                  );
                                }
                                return Promise.resolve();
                              },
                            }),
                          ]}
                        >
                          <Input placeholder="Enter license plate" />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item
                          {...restField}
                          name={[name, 'state']}
                          label="State/Province"
                          rules={[
                            ({ getFieldValue }) => ({
                              validator(_, value) {
                                const vehicles = getFieldValue('vehicles');
                                const currentVehicle = vehicles[index];
                                if (
                                  Object.values(currentVehicle).some((val) => val) &&
                                  !value
                                ) {
                                  return Promise.reject(
                                    'Please enter state/province'
                                  );
                                }
                                return Promise.resolve();
                              },
                            }),
                          ]}
                        >
                          <Input placeholder="Enter state/province" />
                        </Form.Item>
                      </Col>
                    </Row>
                    {index > 0 && (
                      <Button
                        type="link"
                        onClick={() => remove(name)}
                        icon={<MinusCircleOutlined />}
                      >
                        Remove Vehicle
                      </Button>
                    )}
                  </div>
                ))}
                <Form.Item>
                  <Button
                    type="dashed"
                    onClick={() => add()}
                    block
                    icon={<PlusOutlined />}
                  >
                    Add Vehicle
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
        </Form>
      ),
      icon: <CarOutlined />,
    },
    {
      title: 'Dependents',
      content: (
        <Form
          form={form}
          layout="vertical"
          name="dependents_info"
          style={{ marginTop: 24 }}
          initialValues={{ dependents: [{}] }} // Initialize with one empty dependent
        >
          <Form.List name="dependents" initialValue={[{}]}>
          {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }, index) => (
                  <div
                    key={key}
                    style={{
                      marginBottom: 24,
                      border: '1px solid #d9d9d9',
                      padding: 16,
                      borderRadius: 8,
                    }}
                  >
                    <Row gutter={16}>
                      <Col span={8}>
                        <Form.Item
                          {...restField}
                          name={[name, 'firstName']}
                          label="First Name"
                          rules={[
                            ({ getFieldValue }) => ({
                              validator(_, value) {
                                const dependents = getFieldValue('dependents');
                                const currentDependent = dependents[index];
                                if (
                                  Object.values(currentDependent).some((val) => val) &&
                                  !value
                                ) {
                                  return Promise.reject('Please enter first name');
                                }
                                return Promise.resolve();
                              },
                            }),
                          ]}
                        >
                          <Input placeholder="Enter first name" />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item
                          {...restField}
                          name={[name, 'lastName']}
                          label="Last Name"
                          rules={[
                            ({ getFieldValue }) => ({
                              validator(_, value) {
                                const dependents = getFieldValue('dependents');
                                const currentDependent = dependents[index];
                                if (
                                  Object.values(currentDependent).some((val) => val) &&
                                  !value
                                ) {
                                  return Promise.reject('Please enter last name');
                                }
                                return Promise.resolve();
                              },
                            }),
                          ]}
                        >
                          <Input placeholder="Enter last name" />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item
                          {...restField}
                          name={[name, 'relationship']}
                          label="Relationship"
                          rules={[
                            ({ getFieldValue }) => ({
                              validator(_, value) {
                                const dependents = getFieldValue('dependents');
                                const currentDependent = dependents[index];
                                if (
                                  Object.values(currentDependent).some((val) => val) &&
                                  !value
                                ) {
                                  return Promise.reject('Please select relationship');
                                }
                                return Promise.resolve();
                              },
                            }),
                          ]}
                        >
                          <Select placeholder="Select relationship">
                            <Option value="child">Child</Option>
                            <Option value="spouse">Spouse</Option>
                            <Option value="parent">Parent</Option>
                            <Option value="sibling">Sibling</Option>
                            <Option value="other">Other</Option>
                          </Select>
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={16}>
                      <Col span={8}>
                        <Form.Item
                          {...restField}
                          name={[name, 'dateOfBirth']}
                          label="Date of Birth"
                          rules={[
                            ({ getFieldValue }) => ({
                              validator(_, value) {
                                const dependents = getFieldValue('dependents');
                                const currentDependent = dependents[index];
                                if (
                                  Object.values(currentDependent).some((val) => val) &&
                                  !value
                                ) {
                                  return Promise.reject('Please select date of birth');
                                }
                                return Promise.resolve();
                              },
                            }),
                          ]}
                        >
                          <DatePicker
                            style={{ width: '100%', padding: '8px 10px' }}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item
                          {...restField}
                          name={[name, 'gender']}
                          label="Gender"
                          rules={[
                            ({ getFieldValue }) => ({
                              validator(_, value) {
                                const dependents = getFieldValue('dependents');
                                const currentDependent = dependents[index];
                                if (
                                  Object.values(currentDependent).some((val) => val) &&
                                  !value
                                ) {
                                  return Promise.reject('Please select gender');
                                }
                                return Promise.resolve();
                              },
                            }),
                          ]}
                        >
                          <Select placeholder="Select gender">
                            <Option value="male">Male</Option>
                            <Option value="female">Female</Option>
                            <Option value="other">Other</Option>
                            <Option value="preferNotToSay">
                              Prefer not to say
                            </Option>
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item
                          {...restField}
                          name={[name, 'ssn']}
                          label="SSN (Optional)"
                        >
                          <Input placeholder="Enter SSN" />
                        </Form.Item>
                      </Col>
                    </Row>
                    {index > 0 && (
                      <Button
                        type="link"
                        onClick={() => remove(name)}
                        icon={<MinusCircleOutlined />}
                      >
                        Remove Dependent
                      </Button>
                    )}
                  </div>
                ))}
                <Form.Item>
                  <Button
                    type="dashed"
                    onClick={() => add()}
                    block
                    icon={<PlusOutlined />}
                  >
                    Add Dependent
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
        </Form>
      ),
      icon: <TeamOutlined />,
    },
    {
      title: 'Submit',
      content: <ReviewSection form={form} />,
      icon: <SaveOutlined />,
    },
  ];

  return (
    <Drawer
      title="Edit Person"
      width={'50%'}
      onClose={handleDrawerClose}
      visible={visible}
      bodyStyle={{ paddingBottom: 80 }}
      className="new-prospect-drawer"
      footer={
        <div style={{ textAlign: 'right' }}>
          {currentStep > 0 && (
            <Button style={{ margin: '0 8px' }} onClick={prev}>
              Previous
            </Button>
          )}
          {currentStep < steps.length - 1 && (
            <Button onClick={next} type="primary">
              Next
            </Button>
          )}
          {currentStep === steps.length - 1 && (
            <Button
              onClick={handleSubmit}
              type="primary"
              loading={submitting}
            >
              Submit
            </Button>
          )}
        </div>
      }
    >
      <TwoStepView />
      <div>{steps[currentStep].content}</div>
      
      {(loadingAssignees || loadingProperties || loadingAllUnits) && (
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <Spin size="large" />
          <p>Loading data...</p>
        </div>
      )}
    </Drawer>
  );
};

interface FormValues {
  firstName?: string;
  lastName?: string;
  company?: string;
  jobTitle?: string;
  phones?: Array<{ type: string; number: string }>;
  emails?: Array<{ type: string; address: string }>;
  addresses?: Array<{
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    isPrimary: boolean;
  }>;
  assignees?: string[];
  assigneeNames?: string[];
  leadStatus?: string;
  leadSource?: string;
  leadMedium?: string;
  minBedrooms?: number;
  minBathrooms?: number;
  maxRent?: number;
  moveInDate?: moment.Moment;
  properties?: Array<{
    property: string;
    unit: string;
    propertyName?: string;
    unitName?: string;
  }>;
  pets?: Array<{ name: string; type: string }>;
  vehicles?: Array<{ make: string; model: string; year: number }>;
  dependents?: Array<{ firstName: string; lastName: string; relationship: string }>;
}

const ReviewSection: React.FC<{ form: any }> = ({ form }) => {
  const [formValues, setFormValues] = useState<FormValues>(form.getFieldsValue(true));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdditionalData = async () => {
      setLoading(true);
      try {
        // Fetch assignee names
        if (formValues.assignees && formValues.assignees.length > 0) {
          const assigneePromises = formValues.assignees.map(async (uid: string) => {
            const userDoc = await getDoc(doc(db, 'users', uid));
            const userData = userDoc.data();
            return userData ? `${userData.firstName} ${userData.lastName}` : 'Unknown User';
          });
          const assigneeNames = await Promise.all(assigneePromises);
          setFormValues((prev: FormValues) => ({ ...prev, assigneeNames }));
        }

        // Fetch property and unit names
        if (formValues.properties && formValues.properties.length > 0) {
          const updatedProperties = await Promise.all(formValues.properties.map(async (prop) => {
            let propertyName = 'Unknown Property';
            let unitName = 'Unknown Unit';

            if (prop.property) {
              const propertyDoc = await getDoc(doc(db, 'properties', prop.property));
              const propertyData = propertyDoc.data();
              if (propertyData) {
                const settingsSnapshot = await getDocs(collection(db, 'properties', prop.property, 'propertySettings'));
                const settingsData = settingsSnapshot.docs[0]?.data();
                propertyName = settingsData?.propertyName || 'Unnamed Property';
              }
            }

            if (prop.unit) {
              const unitDoc = await getDoc(doc(db, 'properties', prop.property, 'units', prop.unit));
              const unitData = unitDoc.data();
              unitName = unitData?.unitNumber || unitData?.unitName || 'Unnamed Unit';
            }

            return { ...prop, propertyName, unitName };
          }));

          setFormValues((prev: FormValues) => ({ ...prev, properties: updatedProperties }));
        }

        // Fetch addresses if any
        if (formValues.addresses && formValues.addresses.length > 0) {
          // You can fetch additional data related to addresses if needed
          // For now, we'll use them as is
        }

      } catch (error) {
        console.error('Error fetching additional data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAdditionalData();
  }, [formValues.assignees, formValues.properties, formValues.addresses]);

  const InfoItem = ({ label, value }: { label: string; value: any }) => (
    <div style={{ marginBottom: 16 }}>
      <Text strong>{label}: </Text>
      <Text>{value || 'N/A'}</Text>
    </div>
  );

  const hasAddressInfo = formValues.addresses && formValues.addresses.length > 0;

  const hasProfileInfo = formValues.assignees || formValues.leadStatus || formValues.leadSource || formValues.leadMedium || 
                         formValues.minBedrooms || formValues.minBathrooms || formValues.maxRent || formValues.moveInDate;

  const hasPropertyInfo = formValues.properties && formValues.properties.length > 0 && 
                          formValues.properties.some((prop: any) => prop.property || prop.unit);

  if (loading) {
    return <Spin size="large" />;
  }

  return (
    <div style={{ padding: '24px 0' }}>
      <Title level={3}>Review Your Information</Title>
      
      <Row gutter={[0, 24]}>
        <Col span={24}>
          <Card title="Personal Info">
            <Row gutter={16}>
              <Col span={12}>
                <InfoItem label="First Name" value={formValues.firstName} />
                <InfoItem label="Last Name" value={formValues.lastName} />
              </Col>
              <Col span={12}>
                <InfoItem label="Company" value={formValues.company} />
                <InfoItem label="Job Title" value={formValues.jobTitle} />
              </Col>
            </Row>
          </Card>
        </Col>
        
        <Col span={24}>
          <Card title="Contact Info">
            <Row gutter={16}>
              <Col span={12}>
                {formValues.phones?.map((phone: any, index: number) => (
                  <InfoItem key={`phone-${index}`} label={`Phone ${index + 1}`} value={`${phone.type}: ${phone.number}`} />
                ))}
              </Col>
              <Col span={12}>
                {formValues.emails?.map((email: any, index: number) => (
                  <InfoItem key={`email-${index}`} label={`Email ${index + 1}`} value={`${email.type}: ${email.address}`} />
                ))}
              </Col>
            </Row>
          </Card>
        </Col>
        
        {hasAddressInfo && (
          <Col span={24}>
            <Card title="Addresses">
              {formValues.addresses?.map((address: any, index: number) => (
                <div key={`address-${index}`} style={{ marginBottom: 16 }}>
                  <Text strong>{index === 0 ? 'Primary Address' : `Address ${index + 1}`}</Text>
                  <InfoItem label="Street" value={address.street} />
                  <InfoItem label="City" value={address.city} />
                  <InfoItem label="State" value={address.state} />
                  <InfoItem label="Postal Code" value={address.postalCode} />
                  <InfoItem label="Country" value={address.country} />
                </div>
              ))}
            </Card>
          </Col>
        )}
        
        {hasProfileInfo && (
          <Col span={24}>
            <Card title="Profile">
              <Row gutter={16}>
                <Col span={12}>
                  <InfoItem label="Assignees" value={formValues.assigneeNames?.join(', ')} />
                  <InfoItem label="Lead Status" value={formValues.leadStatus || 'New'} />
                  <InfoItem label="Lead Source" value={formValues.leadSource} />
                  <InfoItem label="Lead Medium" value={formValues.leadMedium} />
                </Col>
                <Col span={12}>
                  <InfoItem label="Min Bedrooms" value={formValues.minBedrooms} />
                  <InfoItem label="Min Bathrooms" value={formValues.minBathrooms} />
                  <InfoItem label="Max Rent" value={formValues.maxRent} />
                  <InfoItem label="Move-in Date" value={formValues.moveInDate?.format('YYYY-MM-DD')} />
                </Col>
              </Row>
            </Card>
          </Col>
        )}
        
        {hasPropertyInfo && (
          <Col span={24}>
            <Card title="Properties">
              {formValues.properties?.map((prop: any, index: number) => (
                <InfoItem 
                  key={`property-${index}`} 
                  label={`Property ${index + 1}`} 
                  value={`${prop.propertyName || 'Unknown Property'}, ${prop.unitName || 'Unknown Unit'}`} 
                />
              ))}
            </Card>
          </Col>
        )}
        
        {formValues.pets && formValues.pets.length > 0 && formValues.pets.some((pet: any) => Object.values(pet).some(value => value)) && (
          <Col span={24}>
            <Card title="Pets">
              <Row gutter={16}>
                {formValues.pets.map((pet: any, index: number) => (
                  <Col span={12} key={`pet-${index}`}>
                    <InfoItem label={`Pet ${index + 1} Name`} value={pet.name} />
                    <InfoItem label="Type" value={pet.type} />
                    <InfoItem label="Breed" value={pet.breed} />
                    <InfoItem label="Age" value={pet.age} />
                    <InfoItem label="Gender" value={pet.gender} />
                    <InfoItem label="Weight" value={pet.weight} />
                  </Col>
                ))}
              </Row>
            </Card>
          </Col>
        )}
        
        {formValues.vehicles && formValues.vehicles.length > 0 && formValues.vehicles.some((vehicle: any) => Object.values(vehicle).some(value => value)) && (
          <Col span={24}>
            <Card title="Vehicles">
              <Row gutter={16}>
                {formValues.vehicles.map((vehicle: any, index: number) => (
                  <Col span={12} key={`vehicle-${index}`}>
                    <InfoItem label={`Vehicle ${index + 1}`} value={`${vehicle.make} ${vehicle.model}`} />
                    <InfoItem label="Year" value={vehicle.year} />
                    <InfoItem label="Color" value={vehicle.color} />
                    <InfoItem label="License Plate" value={vehicle.licensePlate} />
                    <InfoItem label="State/Province" value={vehicle.state} />
                  </Col>
                ))}
              </Row>
            </Card>
          </Col>
        )}
        
        {formValues.dependents && formValues.dependents.length > 0 && formValues.dependents.some((dependent: any) => Object.values(dependent).some(value => value)) && (
          <Col span={24}>
            <Card title="Dependents">
              <Row gutter={16}>
                {formValues.dependents.map((dependent: any, index: number) => (
                  <Col span={12} key={`dependent-${index}`}>
                    <InfoItem label={`Dependent ${index + 1}`} value={`${dependent.firstName} ${dependent.lastName}`} />
                    <InfoItem label="Relationship" value={dependent.relationship} />
                    <InfoItem label="Date of Birth" value={dependent.dateOfBirth?.format('YYYY-MM-DD')} />
                    <InfoItem label="Gender" value={dependent.gender} />
                    <InfoItem label="SSN" value={dependent.ssn} />
                  </Col>
                ))}
              </Row>
            </Card>
          </Col>
        )}
      </Row>
    </div>
  );
};

export default EditPersonDrawer;
