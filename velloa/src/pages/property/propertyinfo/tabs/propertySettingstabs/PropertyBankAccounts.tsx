import React, { forwardRef, useImperativeHandle, useState, useEffect, useCallback } from 'react';
import { 
  Typography,  Select,
  Row, Col, notification,
  Radio
} from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../../../../firebase-config';
const { Text } = Typography;
const { Option } = Select;

export interface BankAccountsRef {
    handleSave: () => Promise<boolean>;
    loadSettings: () => Promise<void>;
    resetState: () => void;
  }

interface BankAccountsProps {
  propertyId: string;
}

interface BankAccount {
  id: string;
  accountName: string;
  accountNumber: string;
  routingNumber: string;
}


const PropertyBankAccounts = forwardRef<BankAccountsRef, BankAccountsProps>(({ propertyId }, ref) => {
  const [accountType, setAccountType] = useState<'default' | 'custom'>('default');
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [operatingAccount, setOperatingAccount] = useState<string>('');
  const [escrowAccount, setEscrowAccount] = useState<string>('');


  const loadSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      const bankRef = doc(db, 'properties', propertyId, 'propertySettings', 'BankAccounts');
      const bankDoc = await getDoc(bankRef);
      
      if (bankDoc.exists()) {
        const data = bankDoc.data();
        setAccountType(data.accountType || 'default');
        setAccounts(data.accounts || []);
        setOperatingAccount(data.operatingAccount || '');
        setEscrowAccount(data.escrowAccount || '');
      } else {
        setAccountType('default');
      }
    } catch (error) {
      console.error('Error loading bank account settings:', error);
      setAccountType('default');
    } finally {
      setIsLoading(false);
    }
  }, [propertyId]);

  const handleSave = async () => {
    try {
      const bankRef = doc(db, 'properties', propertyId, 'propertySettings', 'BankAccounts');
      
      const configData = {
        accountType,
        accounts: accounts || [],
        operatingAccount: operatingAccount,
        escrowAccount: escrowAccount
      };

      await setDoc(bankRef, configData);

      notification.success({
        message: 'Settings Saved',
        description: 'Bank account settings have been successfully updated.',
        placement: 'topRight'
      });
      
      return true;
    } catch (error) {
      console.error('Error saving bank account settings:', error);
      notification.error({
        message: 'Save Failed',
        description: 'There was an error saving your bank account settings.',
        placement: 'topRight'
      });
      return false;
    }
  };

  const resetState = async () => {
    setAccountType('default');
    setAccounts([]);
    setOperatingAccount('');
    setEscrowAccount('');
    return Promise.resolve();
  };




  useImperativeHandle(ref, () => ({
    handleSave,
    loadSettings,
    resetState
  }));

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className='payment-allocation-box' style={{ 
      height: '70vh',
    }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
        <Col>
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
            Learn about bank accounts
          </Typography.Link>
        </Col>
      </Row>

      <div style={{ marginBottom: '24px' }}>
        <Text>
          You can set up different bank accounts for your each property, or use the company default bank accounts set in the company settings.
        </Text>
        <Radio.Group 
          value={accountType} 
          onChange={(e) => setAccountType(e.target.value)}
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '16px',
            marginTop: '16px' 
          }}
        >
          <Radio value="default" style={{ 
            display: 'flex', 
            alignItems: 'flex-start',
            padding: '8px 12px',
            backgroundColor: accountType === 'default' ? '#f0f0f0' : 'transparent',
            borderRadius: '4px'
          }}>
            <Text>Use company default payment allocation rules</Text>
          </Radio>
          
          <Radio value="custom" style={{ 
            display: 'flex', 
            alignItems: 'flex-start',
            padding: '8px 12px',
            backgroundColor: accountType === 'custom' ? '#f0f0f0' : 'transparent',
            borderRadius: '4px'
          }}>
            <Text>Specify payment allocation rules for this property</Text>
          </Radio>
        </Radio.Group>
      </div>

    {accountType === 'custom' && (
       <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
         <div>
           <Text strong style={{ display: 'block', marginBottom: '8px' }}>
             Which account should we use as the operating bank account?
           </Text>
           <Select
             style={{ width: '350px', height: '40px' }}
             placeholder="Select Account"
             onChange={(value) => setOperatingAccount(value)}
             
           >
             {accounts.map((account) => (
               <Option key={account.id} value={account.id}>
                 {account.accountName}
               </Option>
             ))}
           </Select>
         </div>

         <div>
           <Text strong style={{ display: 'block', marginBottom: '8px' }}>
             Which account should we use as the escrow bank account for lease deposits?
           </Text>
           <Text type="secondary" style={{ display: 'block', marginBottom: '8px' }}>
             (Can be the same as the operating bank account)
           </Text>
           <Select
             style={{ width: '350px', height: '40px' }}
             placeholder="Select Account"
             onChange={(value) => setEscrowAccount(value)}
           >
             {accounts.map((account) => (
               <Option key={account.id} value={account.id}>
                 {account.accountName}
               </Option>
             ))}
           </Select>
         </div>
       </div>
      )}
    </div>
  );
});

export default PropertyBankAccounts; 