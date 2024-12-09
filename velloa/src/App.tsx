import React, { useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase-config';
import { setAuthenticated, fetchUserDetails } from './components/redux/authSlice';
import {ConfigProvider } from 'antd';
import Calendar from './pages/Calendar/Calendar';
import LoginPage from './pages/Auth/loginpage';
import HomePage from './pages/Home/home';
import Toolspage from './pages/Tools/toolspage';
import Propertypage from './pages/property/property';
import Resourcespage from './pages/Resources/resources';
import Leasingpage from './pages/leasing/leasingPage';
import Peoplepage from './pages/people/peoplePage';
import Accountingpage from './pages/Accounting/accounting';
import Analyticsspage from './pages/Analytics/analytics';
import SignupPage from './pages/Auth/signup';
import SideBarPage from './components/sidebar';
import MessagesPage from './pages/Tools/toolapplication/messages/messagespage';
import MaintenancePage from './pages/maintenance/maintenancepage';
import Logbook from './pages/Tools/toolapplication/logbook/logbook';
import NewApplications from './pages/Tools/toolapplication/newapplications/newapplications';
import NewTenant from './pages/Tools/toolapplication/newtenant/newtenant';
import UnitInfoPage from './pages/property/propertyinfo/unitinfo';
import ForgotPassword from './pages/Auth/forgotpassword';
import Applicationviewer from './pages/Tools/toolapplication/newapplications/applicationviewer/applicationviewer';
import AddNewProperty from './pages/applications/newproperty/addnewproperty';
import PropertyInfoUnitView from './pages/property/propertyinfo/tabs/PropertyinfoUnit/propertyinfo_units_view';
import ProspectsDetailsPage from './pages/people/peopledashboard/PeopleDashboarddetails';
import TaskDetailsPage from './pages/maintenance/TaskDetailsPage';
import MainSettings from './components/Settings/MainSettings';
import { AppDispatch, RootState } from './components/redux/store';
import RentalApplicationForm from './UserApplication/RentalApplicationForm';
import UserListingsPage from './UserApplication/UserListingPage/ListingPage';
import UserAboutPage from './UserApplication/UserAboutPage/UserAboutPage';
import UserHomePage from './UserApplication/UserHomePage/UserHomePage';
import PropertyOverview from './pages/property/propertyinfo/tabs/propertyinfo_overview';
import ChartsOfAccounts from './pages/Accounting/Sections/ChartsOfAccounts/chartsOfAccounts';
import TransactionsPage from './pages/Accounting/Sections/Transactions/OverviewPage';
import UserLayout from './UserApplication/UserLayout';

// Define the theme object
const theme = {
  token: {
    colorPrimary: "#28a745",
    colorInfo: "#28a745",
    sizeStep: 4,
    wireframe: false,
    colorBgLayout: "#F3F5F8",
  },
  components: {
    Menu: {
      darkItemBg: "#188034",
      darkSubMenuItemBg: "#188034",
      darkPopupBg: "#FFFFFF",
      ItemBg: "#188034",
      SubMenuItemBg: "#188034",
      PopupBg: "#d8e6d9",
    },
    Layout: {
      headerBg: "#d8e6d9",
      siderBg: "#188034",
    },
    Button: {
      dangerShadow: "",
      defaultShadow: "",
      primaryShadow: "",
      lineWidth: 1.25,
      
    },
    Card: {
      colorBorderSecondary: "rgb(230, 233, 236)",
      lineWidth: 1.25,
    },
    Table: {
      borderColor: "rgb(230, 233, 236)",
      lineWidth: 1.25,
      headerBg: "rgb(255, 255, 255)",
    },
    Tabs: {
      lineWidth: 2,
      lineWidthBold: 2,
      colorBorderSecondary: "rgb(230, 233, 236)",
    },
    
  },
};

const AnimatedRoutes: React.FC = () => {
  const location = useLocation();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  // Add company-specific paths to public paths
  const isPublicPath = [
    '/login',
    '/signup',
    '/forgot-password'
  ].includes(location.pathname) || 
    location.pathname.startsWith('/homepage/') ||
    location.pathname.startsWith('/company/');
  
  if (!isAuthenticated && !isPublicPath) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Routes location={location} key={location.pathname}>
      {/* Public Company-Specific Routes - No authentication required */}
      <Route element={<UserLayout />}>
        <Route path="/company/:companyId" element={<UserHomePage />} />
        <Route path="/company/:companyId/listings" element={<UserListingsPage />} />
        <Route path="/company/:companyId/about" element={<UserAboutPage />} />
        <Route path="/company/:companyId/rental-applications" element={<RentalApplicationForm />} />
      </Route>

      {/* Public Routes with UserLayout */}
      <Route element={<UserLayout />}>
        <Route path="/tenant-portal" element={<UserHomePage />} />
        <Route path="/tenant-portal/listings" element={<UserListingsPage />} />
        <Route path="/tenant-portal/about" element={<UserAboutPage />} />
        <Route path="/tenant-portal/rental-applications" element={<RentalApplicationForm />} />
      </Route>

      {/* Auth Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={
        <SignupPage />
      } />
      <Route path="/forgot-password" element={
        <ForgotPassword />
      } />

      {/* Protected routes */}
      <Route path="/" element={<SideBarPage />}>
        <Route index element={<HomePage />} />
        <Route path="settings" element={<MainSettings />} />
        <Route path="calendar" element={<Calendar />} />
        <Route path="home" element={<HomePage />} />
        <Route path="tools" element={<Toolspage />} />
        <Route path="property" element={<Propertypage />} />
        <Route path="resources" element={<Resourcespage />} />
        <Route path="leasing" element={<Leasingpage />} />
        <Route path="people" element={<Peoplepage />} />
        <Route path="/accounting/chartofaccounts" element={<ChartsOfAccounts />} />
        <Route path="/accounting/transactions" element={<TransactionsPage />} />
        <Route path="people/:peopleId" element={<ProspectsDetailsPage />} />
        <Route path="accounting" element={<Accountingpage />} />
        <Route path="analytics" element={<Analyticsspage />} />
        <Route path="messages" element={<MessagesPage />} />
        <Route path="maintenance" element={<MaintenancePage />} />
        <Route path="maintenance/:taskId" element={<TaskDetailsPage />} />
        <Route path="logbook" element={<Logbook />} />
        <Route path="applications" element={<NewApplications />} />
        <Route path="new-tenant" element={<NewTenant />} />
        <Route path="/unitinfo" element={<UnitInfoPage />} />
        <Route path="/applicationviewer" element={<Applicationviewer />} />
        <Route path="/addnewproperty" element={<AddNewProperty />} />
        <Route path="property/:uid" element={<PropertyOverview />} />
        <Route path="property/:propertyId/unit/:unitId" element={<PropertyInfoUnitView />} />
      </Route>

      {/* Redirect any unknown routes to home */}
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        dispatch(setAuthenticated(true));
        dispatch(fetchUserDetails(user.uid));
      } else {
        dispatch(setAuthenticated(false));
      }
    });

    return () => unsubscribe();
  }, [dispatch]);

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        width: '100vw',
        backgroundColor: '#ffffff'
      }}>
        <img 
          src="/assets/light_mode_velloa_logo.png"
          alt="Velloa Logo"
          style={{
            maxWidth: '150px',
            height: 'auto'
          }}
        />
      </div>
    );
  }

  return (
    <ConfigProvider theme={theme}>
      <Router>
        <AnimatedRoutes />
      </Router>
    </ConfigProvider>
  );
};


export default App;
