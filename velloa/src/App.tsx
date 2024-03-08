import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Darshboardpage from './pages/Darshboard/darshboardpage'; // Adjust the path as necessary
import Toolspage from './pages/Tools/toolspage'; // Adjust the path as necessary
import Unitspage from './pages/Units/units'; // Adjust the path as necessary
import Resourcespage from './pages/Resources/resources'; // Adjust the path as necessary
import Accountingpage from './pages/Accounting/accounting'; // Adjust the path as necessary
import Analyticsspage from './pages/Analytics/analytics'; // Adjust the path as necessary
import ProtectedRoute from './pages/Auth/PrivateRoute';
import LoginPage from './pages/Auth/loginpage'; // Ensure this import path is correct
import SignupPage from './pages/Auth/signup'; // Ensure this import path is correct
import SideBarPage from './components/sidebar';



const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<SideBarPage />}>
            {/* Nested routes are automatically protected and included in the sidebar */}
            <Route index element={<Darshboardpage />} />
            <Route path="dashboard" element={<Darshboardpage />} />
            <Route path="tools" element={<Toolspage />} />
            <Route path="units" element={<Unitspage/>}  />
            <Route path="resources" element={<Resourcespage/>} />
            <Route path="accounting" element={<Accountingpage/>} />
            <Route path="analytics" element={<Analyticsspage/>} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
