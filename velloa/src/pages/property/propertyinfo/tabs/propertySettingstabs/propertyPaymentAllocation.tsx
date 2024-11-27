import React, { forwardRef, useImperativeHandle, useState, useEffect } from 'react';
import { 
  Typography, Card, Radio, Select,
  Button, Row, Col, notification,
  Space
} from 'antd';
import { InfoCircleOutlined, PlusOutlined, DeleteOutlined, MenuOutlined } from '@ant-design/icons';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../../../../firebase-config';
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import './propertyPaymentAllocation.css';
const { Text } = Typography;
const { Option } = Select;

export interface PaymentAllocationRef {
  handleSave: () => Promise<boolean>;
  loadSettings: () => Promise<void>;
  resetState: () => Promise<void>;
}

interface PaymentAllocationProps {
  propertyId: string;
}

interface AllocationRule {
  id: string;
  category: string;
  priority: number;
}

const SortableItem = ({ rule, index, onDelete, onChange }: {
  rule: AllocationRule;
  index: number;
  onDelete: () => void;
  onChange: (value: string) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: rule.id });

  const style: React.CSSProperties = {
    transform: transform ? `translate3d(0, ${transform.y}px, 0)` : undefined,
    transition,
    padding: '8px 12px',
    marginBottom: '8px',
    background: '#fff',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...(isDragging ? { 
      zIndex: 1,
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)' 
    } : {})
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Space>
        <MenuOutlined 
          {...attributes} 
          {...listeners}
          style={{ cursor: 'grab', color: '#999', padding: '0 8px' }} 
        />
        <Select
          value={rule.category}
          style={{ width: 250, height: '40px' }}
          onChange={onChange}
        />
        <Button
          type="text"
          icon={<DeleteOutlined />}
          onClick={onDelete}
          style={{ color: '#ff4d4f' }}
        />
      </Space>
    </div>
  );
};

const PaymentAllocation = forwardRef<PaymentAllocationRef, PaymentAllocationProps>(({ propertyId }, ref) => {
  const [allocationType, setAllocationType] = useState<'default' | 'custom'>('default');
  const [rules, setRules] = useState<AllocationRule[]>([]);
  const [showAddRule, setShowAddRule] = useState(false);
  const [editingRuleIndex, setEditingRuleIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [newRule, setNewRule] = useState<AllocationRule>({
    id: `rule-${Date.now()}`,
    category: '',
    priority: 1
  });
  const [allocatedType, setAllocatedType] = useState<'oldest' | 'manual'>('oldest');

  const sensors = useSensors(useSensor(PointerSensor));

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const allocationRef = doc(db, 'properties', propertyId, 'propertySettings', 'PaymentAllocation');
      const allocationDoc = await getDoc(allocationRef);
      
      if (allocationDoc.exists()) {
        const data = allocationDoc.data();
        setAllocationType(data.allocationType || 'default');
        setAllocatedType(data.allocatedType || 'oldest');
        setRules(data.rules || []);
      }
    } catch (error) {
      console.error('Error loading payment allocation settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const allocationRef = doc(db, 'properties', propertyId, 'propertySettings', 'PaymentAllocation');
      
      const configData = {
        allocationType,
        allocatedType,
        rules: rules || []
      };

      await setDoc(allocationRef, configData);

      notification.success({
        message: 'Settings Saved',
        description: 'Payment allocation settings have been successfully updated.',
        placement: 'topRight'
      });
      
      return true;
    } catch (error) {
      console.error('Error saving payment allocation settings:', error);
      notification.error({
        message: 'Save Failed',
        description: 'There was an error saving your payment allocation settings.',
        placement: 'topRight'
      });
      return false;
    }
  };

  const resetState = async () => {
    setAllocationType('default');
    setRules([]);
    setShowAddRule(false);
    setEditingRuleIndex(null);
    return Promise.resolve();
  };

  const handleAddCategory = () => {
    const newRule: AllocationRule = {
      id: `rule-${Date.now()}`,
      category: '',
      priority: rules.length + 1
    };
    setRules([...rules, newRule]);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = rules.findIndex((item) => item.id === active.id);
      const newIndex = rules.findIndex((item) => item.id === over.id);
      
      const newRules = arrayMove(rules, oldIndex, newIndex).map((item, index) => ({
        ...item,
        priority: index + 1,
      }));
      
      setRules(newRules);
    }
  };

  useImperativeHandle(ref, () => ({
    handleSave,
    loadSettings,
    resetState
  }));

  useEffect(() => {
    loadSettings();
  }, [propertyId]);

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
            Learn about payment allocation
          </Typography.Link>
        </Col>
      </Row>

      <div style={{ marginBottom: '24px' }}>
        <Text>
          Configure how incoming payments are allocated across different categories.
        </Text>
        <Radio.Group 
          value={allocationType} 
          onChange={(e) => setAllocationType(e.target.value)}
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
            backgroundColor: allocationType === 'default' ? '#f0f0f0' : 'transparent',
            borderRadius: '4px'
          }}>
            <Text>Use company default payment allocation rules</Text>
          </Radio>
          
          <Radio value="custom" style={{ 
            display: 'flex', 
            alignItems: 'flex-start',
            padding: '8px 12px',
            backgroundColor: allocationType === 'custom' ? '#f0f0f0' : 'transparent',
            borderRadius: '4px'
          }}>
            <Text>Specify payment allocation rules for this property</Text>
          </Radio>
        </Radio.Group>
      </div>

      {allocationType === 'custom' && (
        <Card 
          title="Payment Categories" 
          style={{
            flex: '1', 
            overflowY: 'auto',
            maxHeight: '475px',
          }}
        >
          <div style={{ marginBottom: '16px' }}>
          <Typography.Title level={5} style={{ marginBottom: '16px', display: 'block' }}>
            Allocated by:
          </Typography.Title>
            <Text type='secondary' style={{ display: 'block', marginBottom: '8px' }}>
              How should payments be allocated to charges?
            </Text>
            <Select
              value={allocatedType}
              onChange={setAllocatedType}
              style={{ width: '250px', marginBottom: '16px', height: '40px' }}
            >
              <Option value="oldest">Oldest Charge First</Option>
              <Option value="manual">Allocate Manually</Option>
            </Select>
          </div>

          <Typography.Title level={5} style={{ marginBottom: '16px', display: 'block' }}>
            Categories
          </Typography.Title>
          <Text type='secondary' style={{ marginBottom: '16px', display: 'block' }}>
            Set the payment priority of your categories. Categories listed are prioritized first in order.
            Those not shown will be prioritized from oldest to newest.
          </Text>

          <DndContext 
            sensors={sensors}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={rules.map(rule => rule.id)}
              strategy={verticalListSortingStrategy}
            >
              <div style={{ marginBottom: '16px' }}>
                {rules.map((rule, index) => (
                  <SortableItem
                    key={rule.id}
                    rule={rule}
                    index={index}
                    onDelete={() => {
                      const newRules = rules.filter((_, i) => i !== index);
                      setRules(newRules);
                    }}
                    onChange={(value) => {
                      const newRules = [...rules];
                      newRules[index].category = value;
                      setRules(newRules);
                    }}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <Button
            type="text"
            icon={<PlusOutlined />}
            onClick={handleAddCategory}
            style={{
              color: '#28A745',
            }}
          >
            Add a category
          </Button>
        </Card>
      )}
    </div>
  );
});

export default PaymentAllocation; 