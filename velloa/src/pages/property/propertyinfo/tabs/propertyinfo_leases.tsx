import React from 'react';
import { Table, Button } from 'antd';
import './propertyinfo_leases.css';

const PropertyInfoLeases: React.FC = () => {
  // Sample data for leases
  const leases = [
    { key: '1', unit: '101', tenant: 'Tenant A', startDate: '2024-01-01', endDate: '2025-01-01' },
    { key: '2', unit: '102', tenant: 'Tenant B', startDate: '2024-02-01', endDate: '2025-02-01' },
    // Add more leases as needed
  ];

  // Define columns for the table
  const columns = [
    {
      title: 'Unit Number',
      dataIndex: 'unit',
      key: 'unit',
    },
    {
      title: 'Tenant',
      dataIndex: 'tenant',
      key: 'tenant',
    },
    {
      title: 'Start Date',
      dataIndex: 'startDate',
      key: 'startDate',
    },
    {
      title: 'End Date',
      dataIndex: 'endDate',
      key: 'endDate',
    },
  ];

  return (
    <div className="leases-container">
      <div className="leases-header">
        <Button type="primary">New Lease</Button>
      </div>
      <Table columns={columns} dataSource={leases} />
    </div>
  );
};

export default PropertyInfoLeases;
