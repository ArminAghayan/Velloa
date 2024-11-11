import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchUserDetails } from '../../components/redux/authSlice';
import { RootState, AppDispatch } from '../../components/redux/store';
import {  Row, Col, Typography, Space, Select, Button, Drawer, Checkbox, Card, Statistic, Skeleton } from 'antd';
import { auth } from '../../firebase-config'; // Import the auth object
import { SettingOutlined, MenuOutlined } from '@ant-design/icons';
import TasksOpenByStatus from './Cards/Tasks_OpenByStatus';
import RecentTenantRequests from './Cards/RecentTenantRequests';
import WeeklyTasks from './Cards/WeeklyTasks';
import LeaseRenewalsFunnel from './Cards/LeaseRenewalsFunnel';
import RecentPaymentsReceived from './Cards/RecentPaymentsReceived';
import OccupancyRate from './Cards/OccupancyRate';
import TenantPortalAdoption from './Cards/TenantPortalAdoption';
import LeaseOutstandingBalances from './Cards/LeaseOutstandingBalances';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  IconCash, 
  IconAlertCircle, 
  IconUserCheck, 
  IconBuildingSkyscraper 
} from '@tabler/icons-react';

const { Title, Text } = Typography;

interface DashboardCard {
  id: string;
  component: React.ReactNode;
  title: string;
  visible: boolean;
  position: number;
}

interface SortableItemProps {
  id: string;
  title: string;
  visible: boolean;
  onVisibilityChange: (id: string, checked: boolean) => void;
}

// Create a SortableItem component
const SortableItem: React.FC<SortableItemProps> = ({ id, title, visible, onVisibilityChange }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    padding: '12px',
    border: '1px solid #f0f0f0',
    borderRadius: '4px',
    backgroundColor: 'white',
    marginBottom: '8px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Space>
        <MenuOutlined 
          style={{ color: '#999', cursor: 'move' }} 
          {...listeners}
        />
        <Checkbox
          checked={visible}
          onChange={(e) => onVisibilityChange(id, e.target.checked)}
        >
          {title}
        </Checkbox>
      </Space>
    </div>
  );
};

const MetricCard: React.FC<{
  title: string;
  value: number | string;
  prefix?: string;
  suffix?: string;
  color?: string;
  icon?: React.ReactNode;
}> = ({ title, value, prefix, suffix, color, icon }) => (
  <Card style={{ marginBottom: 16 }}>
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
      {icon && <div style={{ padding: '4px' }}>{icon}</div>}
      <Statistic
        title={title}
        value={value}
        prefix={prefix}
        suffix={suffix}
        valueStyle={{ color }}
      />
    </div>
  </Card>
);

const Homepage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.auth.userData);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [dashboardCards, setDashboardCards] = useState<DashboardCard[]>([
    { 
      id: 'recentRequests', 
      component: (
        <RecentTenantRequests 
          onCustomize={() => handleCustomizeCard('recentRequests')} 
          onDelete={() => handleDeleteCard('recentRequests')} 
        />
      ), 
      title: 'Recent Tenant Requests', 
      visible: true, 
      position: 0 
    },
    { 
      id: 'tasksStatus', 
      component: (
        <TasksOpenByStatus 
          onCustomize={() => handleCustomizeCard('tasksStatus')} 
          onDelete={() => handleDeleteCard('tasksStatus')} 
        />
      ), 
      title: 'Tasks by Status', 
      visible: true, 
      position: 1 
    },
    { 
      id: 'weeklyTasks', 
      component: (
        <WeeklyTasks 
          onCustomize={() => handleCustomizeCard('weeklyTasks')} 
          onDelete={() => handleDeleteCard('weeklyTasks')} 
        />
      ), 
      title: 'Weekly Tasks', 
      visible: true, 
      position: 2 
    },
    { 
      id: 'leaseRenewals', 
      component: (
        <LeaseRenewalsFunnel 
          onCustomize={() => handleCustomizeCard('leaseRenewals')} 
          onDelete={() => handleDeleteCard('leaseRenewals')} 
        />
      ), 
      title: 'Lease Renewals Funnel', 
      visible: true, 
      position: 3 
    },
    { 
      id: 'recentPayments', 
      component: (
        <RecentPaymentsReceived 
          onCustomize={() => handleCustomizeCard('recentPayments')} 
          onDelete={() => handleDeleteCard('recentPayments')} 
        />
      ), 
      title: 'Recent Payments', 
      visible: true, 
      position: 4 
    },
    { 
      id: 'portalAdoption', 
      component: (
        <TenantPortalAdoption 
          onCustomize={() => handleCustomizeCard('portalAdoption')} 
          onDelete={() => handleDeleteCard('portalAdoption')} 
        />
      ), 
      title: 'Portal Adoption', 
      visible: true, 
      position: 5 
    },
    { 
      id: 'occupancyRate', 
      component: (
        <OccupancyRate 
          onCustomize={() => handleCustomizeCard('occupancyRate')} 
          onDelete={() => handleDeleteCard('occupancyRate')} 
        />
      ), 
      title: 'Occupancy Rate', 
      visible: true, 
      position: 6 
    },
    { 
      id: 'outstandingBalances', 
      component: (
        <LeaseOutstandingBalances 
          onCustomize={() => handleCustomizeCard('outstandingBalances')} 
          onDelete={() => handleDeleteCard('outstandingBalances')} 
        />
      ), 
      title: 'Outstanding Balances', 
      visible: true, 
      position: 7 
    },
  ]);

  const [loading, setLoading] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  useEffect(() => {
    const fetchUser = async () => {
      if (!user) {
        const currentUser = auth.currentUser;
        if (currentUser) {
          await dispatch(fetchUserDetails(currentUser.uid));
        } else {
          console.error('No user logged in.');
          navigate('/login');
        }
      }
      setLoading(false);
    };

    fetchUser();
  }, [user, dispatch, navigate]);

  if (loading) {
    return (
      <div style={{ padding: '24px' }}>
        <Skeleton.Input style={{ width: 200, marginBottom: 24 }} active />
        <Row gutter={16} style={{ marginBottom: 24 }}>
          {[...Array(4)].map((_, i) => (
            <Col span={6} key={i}>
              <Card>
                <Skeleton active paragraph={{ rows: 1 }} />
              </Card>
            </Col>
          ))}
        </Row>
        <Row gutter={16}>
          {[...Array(6)].map((_, i) => (
            <Col span={12} key={i} style={{ marginBottom: 16 }}>
              <Card>
                <Skeleton active paragraph={{ rows: 4 }} />
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    );
  }

  const handleDeleteCard = (cardId: string) => {
    setDashboardCards(cards => 
      cards.map(card => 
        card.id === cardId ? { ...card, visible: false } : card
      )
    );
    // Save to localStorage
    localStorage.setItem('dashboardLayout', JSON.stringify(dashboardCards));
  };

  const handleCustomizeCard = (cardId: string) => {
    setIsDrawerOpen(true);
    // Add logic for customizing specific card
  };

  const renderCards = () => {
    const visibleCards = dashboardCards
      .filter(card => card.visible)
      .sort((a, b) => a.position - b.position);

    return visibleCards.map((card) => (
      <Col span={12} key={card.id} style={{ marginBottom: 16 }}>
        {card.component}
      </Col>
    ));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;
    
    if (active.id !== over.id) {
      setDashboardCards((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        
        const newItems = arrayMove(items, oldIndex, newIndex);
        return newItems.map((item, index) => ({
          ...item,
          position: index
        }));
      });
    }
  };

  const DrawerContent = (
    <div>
      <Typography.Title level={5}>Layout Settings</Typography.Title>
      <Text type="secondary" style={{ marginBottom: '16px', display: 'block' }}>
        Drag and drop cards to reorder them
      </Text>
      
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={dashboardCards.sort((a, b) => a.position - b.position)}
          strategy={verticalListSortingStrategy}
        >
          {dashboardCards
            .sort((a, b) => a.position - b.position)
            .map((card) => (
              <SortableItem
                key={card.id}
                id={card.id}
                title={card.title}
                visible={card.visible}
                onVisibilityChange={(id: string, checked: boolean) => {
                  setDashboardCards(cards =>
                    cards.map(c =>
                      c.id === id ? { ...c, visible: checked } : c
                    )
                  );
                }}
              />
            ))}
        </SortableContext>
      </DndContext>

      <Button 
        type="primary" 
        onClick={() => {
          localStorage.setItem('dashboardLayout', JSON.stringify(dashboardCards));
          setIsDrawerOpen(false);
        }}
        style={{ marginTop: '16px' }}
      >
        Save Layout
      </Button>
    </div>
  );

  return (
    <div style={{ padding: '24px' }}>
      <Row align="middle" justify="space-between" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'baseline' }}>
          <Title level={3} style={{ marginBottom: '0', marginRight: '4px' }}>Welcome Back,</Title>
          <Typography.Text style={{ fontSize: '16px' }}>
            {user?.firstName} {user?.lastName}
          </Typography.Text>
        </div>
        <Space>
          <Select defaultValue="Property" style={{ width: 200, height: '40px' }} />
          <Select defaultValue="Portfolio" style={{ width: 200, height: '40px' }} />
          <Select defaultValue="View As" style={{ width: 200, height: '40px' }} />
          <Button 
            type="text"
            icon={<SettingOutlined />}
            onClick={() => setIsDrawerOpen(true)}
            style={{ height: '40px', width: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          />
        </Space>
      </Row>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <MetricCard
            title="Prepaid revenue"
            value={1000000}
            prefix="$"
            color="#52c41a"
            icon={<IconCash size={24} stroke={1.5} color="#52c41a" />}
          />
        </Col>
        <Col span={6}>
          <MetricCard
            title="Outstanding revenue"
            value={410000}
            prefix="$"
            color="#f5222d"
            icon={<IconAlertCircle size={24} stroke={1.5} color="#f5222d" />}
          />
        </Col>
        <Col span={6}>
          <MetricCard
            title="Pending Applications"
            value={39}
            color="#1677ff"
            icon={<IconUserCheck size={24} stroke={1.5} color="#1677ff" />}
          />
        </Col>
        <Col span={6}>
          <MetricCard
            title="Occupancy rate"
            value={78}
            suffix="%"
            color="#52c41a"
            icon={<IconBuildingSkyscraper size={24} stroke={1.5} color="#52c41a" />}
          />
        </Col>
      </Row>

      <Row gutter={16}>
        {renderCards()}
      </Row>

      <Drawer
        title="Customize Dashboard"
        placement="right"
        width={600}
        onClose={() => setIsDrawerOpen(false)}
        open={isDrawerOpen}
      >
        {DrawerContent}
      </Drawer>
    </div>
  );
};

export default Homepage;
