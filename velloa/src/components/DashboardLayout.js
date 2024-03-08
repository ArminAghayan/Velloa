// DashboardLayout.js
import React from 'react';
import SideBarPage from './sidebar'; // Adjust import path as necessary

const DashboardLayout = () => {
  return (
    <SideBarPage>
      <Outlet />  // Renders the component for the nested route
    </SideBarPage>
  );
};

export default DashboardLayout;
