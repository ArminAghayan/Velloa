import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Typography, Radio, Space, Checkbox, Switch, Input, notification } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db, auth } from '../../../../../../firebase-config';

const { Title, Text } = Typography;

interface GeneralSettingsProps {
  propertyId: string;
  useCompanySettings: boolean;
  setUseCompanySettings: (value: boolean) => void;
}

export interface RentalApplicationGeneralSettingsRef {
  handleSave: () => Promise<boolean>;
  hasUnsavedChanges: boolean;
}

interface GeneralSetting {
  type: string;
  value: string | number | boolean;
  lastUpdated: Timestamp;
}

interface InitialValues {
  planType: string;
  termsAccepted: boolean;
  applicationFee: number;
  chargeApplicationFee: boolean;
  requestReports: boolean;
}

const GeneralSettings = forwardRef<RentalApplicationGeneralSettingsRef, GeneralSettingsProps>(
  ({ propertyId, useCompanySettings, setUseCompanySettings }, ref) => {
    const [selectedPlan, setSelectedPlan] = useState('all-in-one');
    const [chargeApplicationFee, setChargeApplicationFee] = useState(false);
    const [applicationFee, setApplicationFee] = useState('75.00');
    const [requestReports, setRequestReports] = useState(false);
    const [saving, setSaving] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [initialValues, setInitialValues] = useState<InitialValues>({
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
          const propertySettingsRef = doc(db, `properties/${propertyId}/propertySettings/rentalApplication`);
          const propertySettingsDoc = await getDoc(propertySettingsRef);

          if (propertySettingsDoc.exists()) {
            const settings = propertySettingsDoc.data()?.settings || {};
            const generalSettings: GeneralSetting[] = settings.generalSettings || [];
            
            const planTypeSetting = generalSettings.find((s: GeneralSetting) => s.type === 'planType');
            const requestReportsSetting = generalSettings.find((s: GeneralSetting) => s.type === 'requestReports');
            const termsAcceptedSetting = generalSettings.find((s: GeneralSetting) => s.type === 'termsAccepted');
            const applicationFeeSetting = generalSettings.find((s: GeneralSetting) => s.type === 'applicationFee');
            const chargeApplicationFeeSetting = generalSettings.find((s: GeneralSetting) => s.type === 'chargeApplicationFee');
            
            const initialValues: InitialValues = {
              planType: planTypeSetting?.value as string || 'all-in-one',
              termsAccepted: termsAcceptedSetting?.value as boolean || false,
              applicationFee: applicationFeeSetting?.value as number || 75,
              chargeApplicationFee: chargeApplicationFeeSetting?.value as boolean || false,
              requestReports: requestReportsSetting?.value as boolean || false
            };
            
            setInitialValues(initialValues);
            setSelectedPlan(initialValues.planType);
            setTermsAccepted(initialValues.termsAccepted);
            setChargeApplicationFee(initialValues.chargeApplicationFee);
            setApplicationFee(initialValues.applicationFee.toString());
            setRequestReports(initialValues.requestReports);
          }
        } catch (error) {
          console.error('Error fetching settings:', error);
        }
      };

      fetchSettings();
    }, [propertyId]);

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



    const handleSave = async (): Promise<boolean> => {
      try {
        if (!termsAccepted) {
          notification.error({
            message: 'Error',
            description: 'Please accept the terms and conditions',
            placement: 'topRight'
          });
          return false;
        }

        setSaving(true);
        const currentUser = auth.currentUser;
        
        if (!currentUser?.uid) {
          notification.error({
            message: 'Error',
            description: 'No user found',
            placement: 'topRight'
          });
          return false;
        }

        const propertySettingsRef = doc(db, `properties/${propertyId}/propertySettings/rentalApplication`);
        await setDoc(propertySettingsRef, {
          settings: {
            generalSettings: [
              {
                type: 'planType',
                value: selectedPlan,
                lastUpdated: Timestamp.now()
              },
              {
                type: 'requestReports',
                value: requestReports,
                lastUpdated: Timestamp.now()
              },
              {
                type: 'termsAccepted',
                value: termsAccepted,
                lastUpdated: Timestamp.now()
              },
              {
                type: 'applicationFee',
                value: Number(applicationFee),
                lastUpdated: Timestamp.now()
              },
              {
                type: 'chargeApplicationFee',
                value: chargeApplicationFee,
                lastUpdated: Timestamp.now()
              }
            ],
            lastUpdated: Timestamp.now()
          }
        }, { merge: true });

        setInitialValues({
          planType: selectedPlan,
          termsAccepted,
          applicationFee: selectedPlan === 'custom' ? Number(applicationFee) : 75,
          chargeApplicationFee: selectedPlan === 'custom' ? chargeApplicationFee : false,
          requestReports: selectedPlan === 'custom' ? requestReports : false
        });
        
        setHasUnsavedChanges(false);
        notification.success({
          message: 'Success',
          description: 'Settings saved successfully!',
          placement: 'topRight'
        });
        return true;
      } catch (error) {
        console.error('Error saving settings:', error);
        notification.error({
          message: 'Error',
          description: 'Failed to save settings',
          placement: 'topRight'
        });
        return false;
      } finally {
        setSaving(false);
      }
    };

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      handleSave: async () => {
        try {
          await handleSave();
          return true;
        } catch (error) {
          return false;
        }
      },
      hasUnsavedChanges
    }));

    // If using company settings, show simplified view
    if (useCompanySettings) {
      return (
        <div style={{ padding: '24px' }}>
          <Title level={2} style={{ marginTop: 0 }}>General Settings</Title>
          
          <Radio.Group 
            value={!useCompanySettings}
            onChange={(e) => setUseCompanySettings(!e.target.value)}
            style={{ width: '100%', marginTop: 16 }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <Radio 
                value={false} 
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
                value={true} 
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
        </div>
      );
    }

    // Original return with all settings
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
          padding: '24px 12px 24px 24px'
        }}>
          <Title level={2} style={{ marginTop: 0 }}>General Settings</Title>
          
          <Radio.Group 
            value={!useCompanySettings}
            onChange={(e) => setUseCompanySettings(!e.target.value)}
            style={{ width: '100%', marginBottom: 24 }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <Radio 
                value={false} 
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
                value={true} 
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
        </div>
      </div>
    );
  }
);

export default GeneralSettings;
