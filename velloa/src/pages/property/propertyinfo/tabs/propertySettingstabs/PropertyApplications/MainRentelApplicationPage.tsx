import { Menu, Radio, Space, Typography, notification } from 'antd';
import {
  SettingOutlined,
  InfoCircleOutlined,
  UserOutlined,
  HomeOutlined,
  BankOutlined,
  CarOutlined,
  TeamOutlined,
  PhoneOutlined,
  HeartOutlined,
  DollarOutlined,
  FormOutlined,
  FileTextOutlined,
  BookOutlined,
  BellOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import './PropertyRentalApplicationsettingsRentalApplication.css';
import { useState, useEffect, forwardRef, useImperativeHandle, useRef } from 'react';
import GeneralSettings, { RentalApplicationGeneralSettingsRef } from './PropertyRentalApplicationGeneralSettings';
import InstructionsSettings from './PropertyRentalApplicationInstructionsSettings';
import ApplicantInfoSettings, { ApplicantInfoSettingsRef } from './PropertyRentalApplicationApplicantInfoSettings';
import ResidentialSettings, { ResidentialSettingsRef } from './PropertyRentalApplicationResidentialSettings';
import EmploymentSettings, { EmploymentSettingsRef } from './PropertyRentalApplicationEmploymentSettings';
import VehicleSettings, { VehicleSettingsRef } from './PropertyRentalApplicationVehicleSettings';
import DependentsSettings, { DependentsSettingsRef } from './PropertyRentalApplicationDependentsSettings';
import EmergencyContactsSettings, { EmergencyContactsSettingsRef } from './PropertyRentalApplicationEmergencyContactsSettings';
import PetsSettings, { PetsSettingsRef } from './PropertyRentalApplicationPetsSettings';
import AdditionalIncomeSettings, { AdditionalIncomeSettingsRef } from './PropertyRentalApplicationAdditionalIncomeSettings';
import CustomQuestionsSettings, { CustomQuestionsSettingsRef } from './PropertyRentalApplicationCustomQuestionsSettings';
import RequestDocumentsSettings, { RequestDocumentsSettingsRef } from './PropertyRentalApplicationRequestDocumentsSettings';
import TermsAndConditionsSettings, { TermsAndConditionsSettingsRef } from './PropertyRentalApplicationTermsAndConditionsSettings';
import NotificationSettings, { NotificationSettingsRef } from './PropertyRentalApplicationNotificationSettings';
import ApplicationLinkSettings from './PropertyRentalApplicationApplicationLinkSettings';
import { db } from '../../../../../../firebase-config';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';

// Add property ID prop type
interface SettingsRentalApplicationProps {
  propertyId: string;
}

// Add ref interface
export interface RentalApplicationRef {
  handleSave: () => Promise<boolean>;
}

// Modify component definition to use forwardRef
const SettingsRentalApplication = forwardRef<RentalApplicationRef, SettingsRentalApplicationProps>(
  ({ propertyId }, ref) => {
    const [selectedMenuItem, setSelectedMenuItem] = useState('settings');
    const [useCompanySettings, setUseCompanySettings] = useState<boolean>(true);
    const generalSettingsRef = useRef<RentalApplicationGeneralSettingsRef>(null);
    const applicationLinkRef = useRef<{ handleSave: () => Promise<boolean> }>(null);
    const instructionsRef = useRef<{ handleSave: () => Promise<boolean> }>(null);
    const applicantInfoRef = useRef<ApplicantInfoSettingsRef>(null);
    const residentialRef = useRef<ResidentialSettingsRef>(null);
    const employmentRef = useRef<EmploymentSettingsRef>(null);
    const vehicleRef = useRef<VehicleSettingsRef>(null);
    const dependentsRef = useRef<DependentsSettingsRef>(null);
    const emergencyContactsRef = useRef<EmergencyContactsSettingsRef>(null);
    const petsRef = useRef<PetsSettingsRef>(null);
    const additionalIncomeRef = useRef<AdditionalIncomeSettingsRef>(null);
    const customQuestionsRef = useRef<CustomQuestionsSettingsRef>(null);
    const requestDocumentsRef = useRef<RequestDocumentsSettingsRef>(null);
    const termsAndConditionsRef = useRef<TermsAndConditionsSettingsRef>(null);
    const notificationRef = useRef<NotificationSettingsRef>(null);


    // Update useEffect to use propertyId
    useEffect(() => {
      const fetchRentalType = async () => {
        try {
          const propertySettingsRef = doc(db, `properties/${propertyId}/propertySettings/rentalApplication`);
          const propertySettingsDoc = await getDoc(propertySettingsRef);
          
          if (propertySettingsDoc.exists()) {
            const rentalType = propertySettingsDoc.data()?.RentalType || 'default';
            setUseCompanySettings(rentalType === 'default');
          }
        } catch (error) {
          console.error('Error fetching rental type:', error);
        }
      };

      fetchRentalType();
    }, [propertyId]);

    // Update handleSettingChange to use propertyId
    const handleSettingChange = async (e: any) => {
      const newValue = e.target.value;
      setUseCompanySettings(newValue);

      try {
        const propertySettingsRef = doc(db, `properties/${propertyId}/propertySettings/rentalApplication`);
        await setDoc(propertySettingsRef, {
          RentalType: newValue ? 'default' : 'custom'
        }, { merge: true });
      } catch (error) {
        console.error('Error updating rental type:', error);
      }
    };

    // Add handleSave method
    const handleSave = async (): Promise<boolean> => {
      try {
        if (useCompanySettings) {
          // If using company defaults, just change RentalType to default
          const propertySettingsRef = doc(db, `properties/${propertyId}/propertySettings/rentalApplication`);
          await setDoc(propertySettingsRef, {
            RentalType: 'default',
            lastUpdated: Timestamp.now()
          }, { merge: true }); // Using merge: true to keep existing settings

          notification.success({
            message: 'Success',
            description: 'Settings updated to use company defaults',
            placement: 'topRight'
          });
          return true;
        }

        // If using custom settings, set RentalType to custom and save the current section
        const propertySettingsRef = doc(db, `properties/${propertyId}/propertySettings/rentalApplication`);
        await setDoc(propertySettingsRef, {
          RentalType: 'custom',
          lastUpdated: Timestamp.now()
        }, { merge: true });

        // Then proceed with saving the current section's settings
        switch (selectedMenuItem) {
          case 'link':
            return await applicationLinkRef.current?.handleSave() || false;
          case 'instructions':
            return await instructionsRef.current?.handleSave() || false;
          case 'settings':
            return await generalSettingsRef.current?.handleSave() || false;
          case 'applicant-info':
            return await applicantInfoRef.current?.handleSave() || false;
          case 'residential':
            return await residentialRef.current?.handleSave() || false;
          case 'employment':
            return await employmentRef.current?.handleSave() || false;
          case 'vehicle':
            return await vehicleRef.current?.handleSave() || false;
          case 'income':
            return await additionalIncomeRef.current?.handleSave() || false;
          case 'dependants':
            return await dependentsRef.current?.handleSave() || false;
          case 'emergency':
            return await emergencyContactsRef.current?.handleSave() || false;
          case 'pets':
            return await petsRef.current?.handleSave() || false;
          case 'documents':
            return await requestDocumentsRef.current?.handleSave() || false;
          case 'questions':
            return await customQuestionsRef.current?.handleSave() || false;
          case 'terms':
            return await termsAndConditionsRef.current?.handleSave() || false;
          case 'notifications':
            return await notificationRef.current?.handleSave() || false;
          default:
            return true;
        }
      } catch (error) {
        console.error('Error saving settings:', error);
        notification.error({
          message: 'Error',
          description: 'Failed to save settings',
          placement: 'topRight'
        });
        return false;
      }
    };

    // Expose handleSave method via ref
    useImperativeHandle(ref, () => ({
      handleSave
    }));

    if (useCompanySettings) {
      return (
        <div style={{ margin: '20px', height: '68vh' }}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Typography.Link 
              href="https://velloaapp.com" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ 
                display: 'inline-flex',
                alignItems: 'center', 
                gap: '8px',
                color: 'rgba(0, 0, 0, 0.45)',
                textDecoration: 'underline'
              }}
            >
              <InfoCircleOutlined />
              Learn about the difference between company and property settings
            </Typography.Link>
            
            <Radio.Group 
              onChange={handleSettingChange} 
              value={useCompanySettings}
              style={{ width: '100%' }}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                <Radio 
                  value={true} 
                  style={{ 
                    padding: '16px', 
                    width: '100%', 
                    background: '#f5f5f5', 
                    borderRadius: '8px' 
                  }}
                >
                  Use company default settings for this property
                </Radio>
                <Radio 
                  value={false} 
                  style={{ 
                    padding: '16px', 
                    width: '100%', 
                    background: '#f5f5f5', 
                    borderRadius: '8px' 
                  }}
                >
                  Specify settings for this property
                </Radio>
              </Space>
            </Radio.Group>
          </Space>
        </div>
      );
    }

    return (
      <div style={{ height: '70vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ 
          flex: 1,
          display: 'flex',
          gap: '16px',
          overflow: 'hidden'
        }}>
          <Menu
            mode="inline"
            style={{ 
              width: 250, 
              background: 'white',
              color: 'black',
              borderRadius: '8px',
              minHeight: '100%'
            }}
            theme="light"
            selectedKeys={[selectedMenuItem]}
            className="custom-menu-rental-application"
            onClick={({ key }) => setSelectedMenuItem(key)}
            items={[
              { key: 'settings', icon: <SettingOutlined />, label: 'General Settings' },
              { key: 'instructions', icon: <InfoCircleOutlined />, label: 'Instructions' },
              { 
                key: 'applicant-info', 
                icon: <UserOutlined />, 
                label: <span>Applicant Info <span style={{ color: '#f59e0b' }}>(Required)</span></span>
              },
              { 
                key: 'residential', 
                icon: <HomeOutlined />, 
                label: <span>Residential <span style={{ color: '#f59e0b' }}>(Required)</span></span>
              },
              { 
                key: 'employment', 
                icon: <BankOutlined />, 
                label: <span>Employment <span style={{ color: '#f59e0b' }}>(Required)</span></span>
              },
              { key: 'vehicle', icon: <CarOutlined />, label: 'Vehicle' },
              { key: 'dependants', icon: <TeamOutlined />, label: 'Dependants' },
              { key: 'emergency', icon: <PhoneOutlined />, label: 'Emergency Contacts' },
              { key: 'pets', icon: <HeartOutlined />, label: 'Pets' },
              { key: 'income', icon: <DollarOutlined />, label: 'Additional Income & Assets' },
              { key: 'questions', icon: <FormOutlined />, label: 'Create Questions' },
              { key: 'documents', icon: <FileTextOutlined />, label: 'Request Documents' },
              { key: 'terms', icon: <BookOutlined />, label: 'Terms & Conditions' },
              { key: 'notifications', icon: <BellOutlined />, label: 'Notifications' },
              { key: 'link', icon: <LinkOutlined />, label: 'Application Link' },
            ]}
          />
          
          <div style={{
            flex: 1,
            borderRadius: '8px',
            overflow: 'auto',
            border: '1px solid #f5f5f5'
          }}>
            {selectedMenuItem === 'settings' && 
              <GeneralSettings 
                ref={generalSettingsRef}
                propertyId={propertyId}
                useCompanySettings={useCompanySettings}
                setUseCompanySettings={setUseCompanySettings}
              />
            }
            {selectedMenuItem === 'instructions' && 
              <InstructionsSettings 
                ref={instructionsRef}
                propertyId={propertyId}
                useCompanySettings={useCompanySettings}
                setUseCompanySettings={setUseCompanySettings}
              />
            }
            {selectedMenuItem === 'applicant-info' && 
              <ApplicantInfoSettings 
                ref={applicantInfoRef}
                propertyId={propertyId}
                useCompanySettings={useCompanySettings}
                setUseCompanySettings={setUseCompanySettings}
              />
            }
            {selectedMenuItem === 'residential' && 
              <ResidentialSettings 
                ref={residentialRef}
                propertyId={propertyId}
                useCompanySettings={useCompanySettings}
                setUseCompanySettings={setUseCompanySettings}
              />
            }
            {selectedMenuItem === 'employment' && 
              <EmploymentSettings 
                ref={employmentRef}
                propertyId={propertyId}
                useCompanySettings={useCompanySettings}
                setUseCompanySettings={setUseCompanySettings}
              />
            }
            {selectedMenuItem === 'vehicle' && 
              <VehicleSettings 
                ref={vehicleRef}
                propertyId={propertyId}
                useCompanySettings={useCompanySettings}
                setUseCompanySettings={setUseCompanySettings}
              />
            }
            {selectedMenuItem === 'dependants' && 
              <DependentsSettings 
                propertyId={propertyId}
                useCompanySettings={useCompanySettings}
                setUseCompanySettings={setUseCompanySettings}
                ref={dependentsRef}
              />
            }
            {selectedMenuItem === 'emergency' && 
              <EmergencyContactsSettings 
                ref={emergencyContactsRef}
                propertyId={propertyId}
                useCompanySettings={useCompanySettings}
                setUseCompanySettings={setUseCompanySettings}
              />
            }
            {selectedMenuItem === 'pets' && 
              <PetsSettings 
                ref={petsRef}
                propertyId={propertyId}
                useCompanySettings={useCompanySettings}
                setUseCompanySettings={setUseCompanySettings}
              />
            } 
            {selectedMenuItem === 'income' && 
              <AdditionalIncomeSettings 
                ref={additionalIncomeRef}
                propertyId={propertyId}
                useCompanySettings={useCompanySettings}
                setUseCompanySettings={setUseCompanySettings}
              />
            }
            {selectedMenuItem === 'questions' && 
              <CustomQuestionsSettings 
                ref={customQuestionsRef}
                propertyId={propertyId}
                useCompanySettings={useCompanySettings}
                setUseCompanySettings={setUseCompanySettings}
              />
            }
            {selectedMenuItem === 'documents' && 
              <RequestDocumentsSettings 
                ref={requestDocumentsRef}
                propertyId={propertyId}
                useCompanySettings={useCompanySettings}
                setUseCompanySettings={setUseCompanySettings}
              />
            }
            {selectedMenuItem === 'terms' && 
              <TermsAndConditionsSettings 
                ref={termsAndConditionsRef}
                propertyId={propertyId}
                useCompanySettings={useCompanySettings}
                setUseCompanySettings={setUseCompanySettings}
              />
            }
            {selectedMenuItem === 'notifications' && 
              <NotificationSettings 
                ref={notificationRef}
                propertyId={propertyId}
                useCompanySettings={useCompanySettings}
                setUseCompanySettings={setUseCompanySettings}
              />
            }
            {selectedMenuItem === 'link' && (
              <ApplicationLinkSettings
                ref={applicationLinkRef}
                propertyId={propertyId}
                useCompanySettings={useCompanySettings}
                setUseCompanySettings={setUseCompanySettings}
              />
            )}

          </div>
        </div>
      </div>
    );
  }
);

export default SettingsRentalApplication;
