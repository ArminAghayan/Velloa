import React from 'react';
import { Table, Input, Button, Space } from 'antd';
import { IconAdjustmentsHorizontal } from '@tabler/icons-react';

interface ReconciliationTabProps {
  companyId: string;
}

const ReconciliationPage: React.FC<ReconciliationTabProps> = ({ companyId }) => {
  const columns = [
    // Add your reconciliation columns here
  ];

  return (
    <div>
      <div className="search-section">
        <Space size={0}>
          <Input
            placeholder="Search Reconciliations"
            className="search-input"
          />
          <Button
            icon={<IconAdjustmentsHorizontal size={20} />}
            style={{ height: 40, width: 40, marginLeft: -8 }}
          />
        </Space>
      </div>

      <Table 
        size="small"
        // Add your reconciliation data here
      />
    </div>
  );
};

export default ReconciliationPage;