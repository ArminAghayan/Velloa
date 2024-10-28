import React, { useState, useEffect } from 'react';
import { Typography, Radio, Space, Button, Checkbox, Switch, Input, Form, Modal } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { doc, updateDoc, getDoc, collection, setDoc, Timestamp } from 'firebase/firestore';
import { db, auth } from '../../../../firebase-config';
import { message } from 'antd';

const { Title, Text } = Typography;

interface BaseSettingsData {
  planType: string;
  termsAccepted: boolean;
  lastUpdated: string;
}

const GeneralSettings: React.FC = () => {
  const [selectedPlan, setSelectedPlan] = useState('all-in-one');
  const [chargeApplicationFee, setChargeApplicationFee] = useState(false);
  const [applicationFee, setApplicationFee] = useState('75.00');
  const [requestReports, setRequestReports] = useState(false);
  const [saving, setSaving] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [initialValues, setInitialValues] = useState({
    planType: 'all-in-one',
    termsAccepted: false,
    applicationFee: 75,
    chargeApplicationFee: false,
    requestReports: false
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Calculate fees
  const processingFee = chargeApplicationFee ? (Number(applicationFee) * 0.029) + 0.30 : 0;
  const reportsCost = requestReports ? 20.00 : 0;
  const totalProfit = chargeApplicationFee ? 
    Number(applicationFee) - processingFee - reportsCost : 0;

  // Fetch initial values
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser?.uid) return;

        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        const companyId = userDoc.data()?.companyuid;
        
        if (!companyId) return;

        const settingsRef = doc(db, `companies/${companyId}/settings/rentalApplication`);
        const settingsDoc = await getDoc(settingsRef);

        if (settingsDoc.exists()) {
          const data = settingsDoc.data();
          const settings = data.generalSettings?.[0] || {};
          
          setInitialValues({
            planType: settings.planType || 'all-in-one',
            termsAccepted: data.termsAccepted,
            applicationFee: settings.applicationFee || 75,
            chargeApplicationFee: settings.chargeApplicationFee || false,
            requestReports: settings.requestReports || false
          });
          
          setSelectedPlan(settings.planType || 'all-in-one');
          setTermsAccepted(data.termsAccepted);

          // Set the switch states directly
          setChargeApplicationFee(settings.chargeApplicationFee || false);
          setApplicationFee((settings.applicationFee || 75).toString());
          setRequestReports(settings.requestReports || false);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };

    fetchSettings();
  }, []);

  // Check for changes
  useEffect(() => {
    const hasChanges = 
      selectedPlan !== initialValues.planType ||
      termsAccepted !== initialValues.termsAccepted ||
      (selectedPlan === 'custom' && (
        Number(applicationFee) !== initialValues.applicationFee ||
        chargeApplicationFee !== initialValues.chargeApplicationFee ||
        requestReports !== initialValues.requestReports
      ));
    
    setHasUnsavedChanges(hasChanges);
  }, [selectedPlan, termsAccepted, applicationFee, chargeApplicationFee, requestReports, initialValues]);

  // Prompt before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const renderCustomFeeSection = () => {
    if (selectedPlan !== 'custom') return null;
    
    return (
      <div style={{ marginTop: 16, padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ marginBottom: 8 }}>
            <Text strong>Application Fee</Text>
          </div>
          <Switch 
            checked={chargeApplicationFee}
            onChange={setChargeApplicationFee}
            style={{ marginRight: 8 }}
          />
          <Text>Charge applicants an application fee</Text>
          
          {chargeApplicationFee && (
            <div style={{ marginTop: 16 }}>
              <Text style={{ display: 'block', marginBottom: 8 }}>
                How much would you like to charge for an application fee?
              </Text>
              <Input 
                prefix="$"
                value={applicationFee}
                onChange={(e) => setApplicationFee(e.target.value)}
                style={{ width: 200 }}
              />
              <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                Online Payment Credit Card Fee: ${processingFee.toFixed(2)}
              </Text>
            </div>
          )}
        </div>

        <div>
          <div style={{ marginBottom: 8 }}>
            <Text strong>Transunion Report</Text>
          </div>
          <Switch 
            checked={requestReports}
            onChange={setRequestReports}
            style={{ marginRight: 8 }}
          />
          <Text>Request Credit, Criminal and Eviction History reports from Transunion</Text>
          {requestReports && (
            <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
              Transunion Reports Cost: $20.00
            </Text>
          )}
        </div>
      </div>
    );
  };

  // Update the Summary section
  const renderSummary = () => {
    if (selectedPlan !== 'custom') return (
      <>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <Text>Total cost for applicant</Text>
          <Text>$49.90</Text>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
          <Text>Your Revenue</Text>
          <Text style={{ color: '#52c41a' }}>$0.00</Text>
        </div>
      </>
    );

    const total = Number(applicationFee) + processingFee + reportsCost;
    
    return (
      <>
        {chargeApplicationFee && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <Text>Application Fee</Text>
            <Text>${applicationFee}</Text>
          </div>
        )}
        {chargeApplicationFee && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <Text>Online Credit Card Processing Cost (2.9% + C$0.30)</Text>
            <Text>${processingFee.toFixed(2)}</Text>
          </div>
        )}
        {requestReports && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <Text>Transunion Reports Cost</Text>
            <Text>$20.00</Text>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
          <Text>Your Profit</Text>
          <Text style={{ color: totalProfit > 0 ? '#52c41a' : '#f5222d' }}>
            ${totalProfit.toFixed(2)}
          </Text>
        </div>
      </>
    );
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      Modal.confirm({
        title: 'Unsaved Changes',
        content: 'You have unsaved changes. Do you want to discard them?',
        okText: 'Discard',
        cancelText: 'Keep Editing',
        onOk: () => {
          // Reset to initial values
          setSelectedPlan(initialValues.planType);
          setTermsAccepted(initialValues.termsAccepted);
          window.history.back();
        }
      });
    } else {
      window.history.back();
    }
  };

  const handleSave = async () => {
    try {
      if (!termsAccepted) {
        message.error('Please accept the terms and conditions');
        return;
      }

      setSaving(true);
      const currentUser = auth.currentUser;
      
      if (!currentUser?.uid) {
        message.error('No user found');
        return;
      }

      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      const companyId = userDoc.data()?.companyuid;

      if (!companyId) {
        message.error('No company found');
        return;
      }

      const generalSettings = selectedPlan === 'custom' ? [{
        planType: selectedPlan,
        applicationFee: chargeApplicationFee ? Number(applicationFee) : 0,
        chargeApplicationFee,
        requestReports,
        termsAccepted,
        lastUpdated: Timestamp.now()
      }] : [{
        planType: selectedPlan,
        termsAccepted,
        lastUpdated: Timestamp.now()
      }];

      const settingsData = {
        generalSettings
      };

      const settingsRef = doc(db, `companies/${companyId}/settings/rentalApplication`);
      await setDoc(settingsRef, settingsData, { merge: true });

      // Update initial values after successful save with all required properties
      setInitialValues({
        planType: selectedPlan,
        termsAccepted,
        applicationFee: selectedPlan === 'custom' ? Number(applicationFee) : 75,
        chargeApplicationFee: selectedPlan === 'custom' ? chargeApplicationFee : false,
        requestReports: selectedPlan === 'custom' ? requestReports : false
      });
      
      setHasUnsavedChanges(false);
      message.success('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      message.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%',
      position: 'relative',
      backgroundColor: '#fff',
      borderRadius: '8px',
      overflow: 'hidden'
    }}>
      <div style={{ 
        maxWidth: 800, 
        flex: 1, 
        overflowY: 'auto', 
        padding: '24px 12px 80px 24px'
      }}>
        <Title level={2} style={{ marginTop: 0 }}>General Settings</Title>
        
        <Text style={{ color: '#666', display: 'block', marginBottom: 16 }}>
          Choose your ideal settings and fee plan with flexible solutions for you and your applicants.
        </Text>

        {/* Warning Banner */}
        <div style={{ 
          padding: '8px 12px', 
          background: '#fff7e6', 
          borderRadius: 4, 
          marginBottom: 16, 
          display: 'flex', 
          alignItems: 'center', 
          gap: 8 
        }}>
          <span style={{ color: '#fa8c16' }}>⚠</span>
          <Text>Check local rental application fee regulations to stay compliant.</Text>
        </div>

        {/* Radio Group */}
        <Radio.Group 
          value={selectedPlan}
          onChange={(e) => {
            const newPlan = e.target.value;
            setSelectedPlan(newPlan);
            // Only reset terms if changing to a different plan
            if (newPlan !== initialValues.planType) {
              setTermsAccepted(false);
            } else {
              // Restore the original terms acceptance if returning to the saved plan
              setTermsAccepted(initialValues.termsAccepted);
            }
          }}
          style={{ width: '100%', marginBottom: 32 }}
        >
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {/* All-In-One Solution */}
            <div style={{ border: '1px solid #e8e8e8', borderRadius: 8, padding: 16, background: 'white' }}>
              <Radio value="all-in-one">
                <div>
                  <Text strong>All-In-One Solution</Text>
                  <span style={{ 
                    marginLeft: 8, 
                    background: '#e6f7ff', 
                    color: '#1890ff', 
                    padding: '2px 8px', 
                    borderRadius: 4, 
                    fontSize: 12 
                  }}>
                    Recommended
                  </span>
                </div>
                <div style={{ marginLeft: 24, color: '#666', marginTop: 8 }}>
                  • No additional setup or merchant account required<br/>
                  • Applicants pay $49.90 for their background check<br/>
                  • Access comprehensive criminal, eviction, and credit reports from TransUnion
                </div>
              </Radio>
            </div>

            {/* Custom Fee Plan */}
            <div style={{ border: '1px solid #e8e8e8', borderRadius: 8, padding: 16, background: '#fafafa' }}>
              <Radio value="custom">
                <div>
                  <Text strong>Custom Fee Plan</Text>
                  <InfoCircleOutlined style={{ marginLeft: 8, color: '#999' }} />
                </div>
                <div style={{ marginLeft: 24, color: '#666', marginTop: 8 }}>
                  • Merchant account required<br/>
                  • Set custom fees to generate revenue and choose to cover or offset screening costs<br/>
                  • Choose when to request TransUnion screening reports for an applicant
                </div>
              </Radio>
            </div>

            {/* Application-Only Plan */}
            <div style={{ border: '1px solid #e8e8e8', borderRadius: 8, padding: 16, background: 'white' }}>
              <Radio value="application-only">
                <Text strong>Application-Only Plan</Text>
                <div style={{ marginLeft: 24, color: '#666', marginTop: 8 }}>
                  • Free and unlimited application form submissions<br/>
                  • Screening not included; reports available for a fee upon request
                </div>
              </Radio>
            </div>
          </Space>
        </Radio.Group>

        {renderCustomFeeSection()}

        {/* Summary Section */}
        <div style={{ borderTop: '1px solid #e8e8e8', paddingTop: 24 }}>
          <Title level={4}>Summary</Title>
          {renderSummary()}
          
          <Checkbox 
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
          >
            I accept the <a>Velloa</a> and <a>TransUnion</a> Terms and Conditions.
          </Checkbox>

        </div>

        <div style={{ 
          borderTop: '1px solid #f0f0f0',
          padding: '16px 24px',
          backgroundColor: '#fff',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 12,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000
        }}>
          <Button 
            onClick={handleCancel}
            style={{ 
              borderRadius: '6px',
              border: '1px solid #E2E8F0'
            }}
          >
            Cancel
          </Button>
          <Button 
            type="primary" 
            onClick={handleSave}
            loading={saving}
            disabled={!hasUnsavedChanges}
            
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GeneralSettings;
