import React from 'react';
import { Card, Empty } from 'antd';

interface PeopleLeasingProps {
  personId: string;
  companyId: string;
}

const PeopleLeasing: React.FC<PeopleLeasingProps> = ({ personId, companyId }) => {
  return (
    <Card title="Leasing Information">
      <Empty 
        description="Leasing information will be displayed here" 
        image={Empty.PRESENTED_IMAGE_SIMPLE} 
      />
    </Card>
  );
};

export default PeopleLeasing; 