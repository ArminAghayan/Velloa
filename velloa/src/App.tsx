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
import { ConfigProvider, Spin } from 'antd';
import LoginPage from './pages/Auth/loginpage';
import HomePage from './pages/Home/home';
import Toolspage from './pages/Tools/toolspage';
import Propertypage from './pages/property/property';
import Resourcespage from './pages/Resources/resources';
import Leasingpage from './pages/leasing/leasingPage';
import Peoplepage from './pages/people/peoplePage';
import Accountingpage from './pages/Accounting/accounting';
import Analyticsspage from './pages/Analytics/analytics';
import ProtectedRoute from './pages/Auth/PrivateRoute';
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
import PropertyInfo from './pages/property/propertyinfo/propertyinfo';
import PropertyInfoUnitView from './pages/property/propertyinfo/tabs/PropertyinfoUnit/propertyinfo_units_view';
import ProspectsDetailsPage from './pages/people/peopledashboard/PeopleDashboarddetails';
import TaskDetailsPage from './pages/maintenance/TaskDetailsPage';
import MainSettings from './components/Settings/MainSettings';
import { AnimatePresence, motion } from 'framer-motion';
import { AppDispatch, RootState } from './components/redux/store';
import RentalApplication from './components/Settings/settingsPages/PropertySettings/SettingsRentalApplication';
import RentalApplicationForm from './components/UserApplication/RentalApplicationForm';
import UserListingsPage from './components/UserApplication/UserListingPage/ListingPage';
import UserAboutPage from './components/UserApplication/UserAboutPage/UserAboutPage';
import UserHomePage from './components/UserApplication/UserHomePage/UserHomePage';

// Define the theme object
const theme = {
  token: {
    colorPrimary: "#28a745",
    colorInfo: "#28a745",
    fontSize: 14,
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

// Define animation variants
const pageVariants = {
  initial: {
    opacity: 0,
    x: "100vw", // Start off-screen to the right
  },
  in: {
    opacity: 1,
    x: 0, // Enter to the screen
  },
  out: {
    opacity: 0,
    x: "-100vw", // Exit off-screen to the left
  },
};

const pageTransition = {
  type: "tween",
  ease: "anticipate",
  duration: 0.5,
};

// Create a wrapper component for animated pages
const AnimatedPage: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <motion.div
    initial="initial"
    animate="in"
    exit="out"
    variants={pageVariants}
    transition={pageTransition}
  >
    {children}
  </motion.div>
);

const AnimatedRoutes: React.FC = () => {
  const location = useLocation();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  // Check if the current path is the public rental application
  const isPublicPath = location.pathname === '/tenant-portal/rental-applications';
  const isPublicPath2 = location.pathname === '/tenant-portal';
  const isPublicPath3 = location.pathname === '/tenant-portal/listings';
  const isPublicPath4 = location.pathname === '/tenant-portal/about';
  
  
  
  // If not authenticated and not on a public path, redirect to login
  if (!isAuthenticated && !isPublicPath && !isPublicPath2 && !isPublicPath3 && !isPublicPath4 && location.pathname !== '/login' && 
      location.pathname !== '/signup' && location.pathname !== '/forgot-password') {
    return <Navigate to="/login" replace />;
  }

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public Routes */}
        <Route path="/tenant-portal" element={
          <AnimatedPage>
            <UserHomePage />
          </AnimatedPage>
        } />
        <Route path="/tenant-portal/listings" element={
          <AnimatedPage>
            <UserListingsPage />
          </AnimatedPage>
        } />
        <Route path="/tenant-portal/about" element={
          <AnimatedPage>
            <UserAboutPage />
          </AnimatedPage>
        } />
        <Route path="/tenant-portal/rental-applications" element={
          <AnimatedPage>
            <RentalApplicationForm />
          </AnimatedPage>
        } />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={
          <AnimatedPage>
            <SignupPage />
          </AnimatedPage>
        } />
        <Route path="/forgot-password" element={
          <AnimatedPage>
            <ForgotPassword />
          </AnimatedPage>
        } />

        {/* Protected routes */}
        <Route path="/" element={<SideBarPage />}>
          <Route index element={<AnimatedPage><HomePage /></AnimatedPage>} />
          <Route path="settings" element={<AnimatedPage><MainSettings /></AnimatedPage>} />
          <Route path="home" element={<AnimatedPage><HomePage /></AnimatedPage>} />
          <Route path="tools" element={<AnimatedPage><Toolspage /></AnimatedPage>} />
          <Route path="property" element={<AnimatedPage><Propertypage /></AnimatedPage>} />
          <Route path="resources" element={<AnimatedPage><Resourcespage /></AnimatedPage>} />
          <Route path="leasing" element={<AnimatedPage><Leasingpage /></AnimatedPage>} />
          <Route path="people" element={<AnimatedPage><Peoplepage /></AnimatedPage>} />
          <Route path="people/:peopleId" element={<AnimatedPage><ProspectsDetailsPage /></AnimatedPage>} />
          <Route path="accounting" element={<AnimatedPage><Accountingpage /></AnimatedPage>} />
          <Route path="analytics" element={<AnimatedPage><Analyticsspage /></AnimatedPage>} />
          <Route path="messages" element={<AnimatedPage><MessagesPage /></AnimatedPage>} />
          <Route path="maintenance" element={<AnimatedPage><MaintenancePage /></AnimatedPage>} />
          <Route path="maintenance/:taskId" element={<AnimatedPage><TaskDetailsPage /></AnimatedPage>} />
          <Route path="logbook" element={<AnimatedPage><Logbook /></AnimatedPage>} />
          <Route path="applications" element={<AnimatedPage><NewApplications /></AnimatedPage>} />
          <Route path="new-tenant" element={<AnimatedPage><NewTenant /></AnimatedPage>} />
          <Route path="/unitinfo" element={<AnimatedPage><UnitInfoPage /></AnimatedPage>} />
          <Route path="/applicationviewer" element={<AnimatedPage><Applicationviewer /></AnimatedPage>} />
          <Route path="/addnewproperty" element={<AnimatedPage><AddNewProperty /></AnimatedPage>} />
          <Route path="property/:uid" element={<AnimatedPage><PropertyInfo /></AnimatedPage>} />
          <Route path="property/:propertyId/unit/:unitId" element={<AnimatedPage><PropertyInfoUnitView /></AnimatedPage>} />
        </Route>

        {/* Redirect any unknown routes to home */}
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </AnimatePresence>
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
      }}>
        <Spin size="large" />
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
