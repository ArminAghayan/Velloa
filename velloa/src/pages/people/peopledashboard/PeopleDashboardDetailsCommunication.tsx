import React from 'react';
import { Card, Empty } from 'antd';

interface PeopleCommunicationProps {
  personId: string;
  companyId: string;
}

const PeopleCommunication: React.FC<PeopleCommunicationProps> = ({ personId, companyId }) => {
  return (
    <Card title="Communication History">
      <Empty 
        description="Communication history will be displayed here" 
        image={Empty.PRESENTED_IMAGE_SIMPLE} 
      />
    </Card>
  );
};

export default PeopleCommunication; 