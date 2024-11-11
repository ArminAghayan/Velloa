import { SettingOutlined, DeleteOutlined } from '@ant-design/icons';

export interface CardProps {
  onCustomize: () => void;
  onDelete: () => void;
}

export const getCardMenuItems = (onCustomize: () => void, onDelete: () => void) => [
  { 
    key: 'customize', 
    label: 'Customize', 
    onClick: onCustomize,
    icon: <SettingOutlined />
  },
  { 
    key: 'delete', 
    label: 'Delete', 
    onClick: onDelete,
    icon: <DeleteOutlined />
  }
]; 