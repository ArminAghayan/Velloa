import { Menu } from 'antd';
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
import './settingsRentalApplication.css';
import { useState } from 'react';
import GeneralSettings from './GeneralSettings';
import InstructionsSettings from './InstructionsSettings';
import ApplicantInfoSettings from './ApplicantInfoSettings';
import ResidentialSettings from './ResidentialSettings';
import EmploymentSettings from './EmploymentSettings';
import VehicleSettings from './VehicleSettings';
import DependentsSettings from './DependentsSettings';
import EmergencyContactsSettings from './EmergencyContactsSettings';
import PetsSettings from './PetsSettings';
import AdditionalIncomeSettings from './AdditionalIncomeSettings';
import CustomQuestionsSettings from './CustomQuestionsSettings';
import RequestDocumentsSettings from './RequestDocumentsSettings';
import TermsAndConditionsSettings from './TermsAndConditionsSettings';
import NotificationSettings from './NotificationSettings';
import ApplicationLinkSettings from './ApplicationLinkSettings';
const SettingsRentalApplication = () => {
  const [selectedMenuItem, setSelectedMenuItem] = useState('settings');

  return (
    <div style={{ height: '80vh', display: 'flex', flexDirection: 'column' }}>
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
            background: '#188034', 
            color: 'white',
            borderRadius: '8px',
            minHeight: '100%'
          }}
          theme="dark"
          selectedKeys={[selectedMenuItem]}
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
          background: 'white',
          borderRadius: '8px',
          overflow: 'auto',
          border: '1px solid #f5f5f5'
        }}>
          {selectedMenuItem === 'settings' && <GeneralSettings />}
          {selectedMenuItem === 'instructions' && <InstructionsSettings />}
          {selectedMenuItem === 'applicant-info' && <ApplicantInfoSettings />}
          {selectedMenuItem === 'residential' && <ResidentialSettings />}
          {selectedMenuItem === 'employment' && <EmploymentSettings />}
          {selectedMenuItem === 'vehicle' && <VehicleSettings />}
          {selectedMenuItem === 'dependants' && <DependentsSettings />}
          {selectedMenuItem === 'emergency' && <EmergencyContactsSettings />}
          {selectedMenuItem === 'pets' && <PetsSettings />}
          {selectedMenuItem === 'income' && <AdditionalIncomeSettings />}
          {selectedMenuItem === 'questions' && <CustomQuestionsSettings />}
          {selectedMenuItem === 'documents' && <RequestDocumentsSettings />}
          {selectedMenuItem === 'terms' && <TermsAndConditionsSettings />}
          {selectedMenuItem === 'notifications' && <NotificationSettings />}
          {selectedMenuItem === 'link' && <ApplicationLinkSettings />}

        </div>
      </div>
    </div>
  );
};

export default SettingsRentalApplication;
