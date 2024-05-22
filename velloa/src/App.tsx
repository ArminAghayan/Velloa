import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { ConfigProvider } from 'antd';
import { Provider } from 'react-redux'; // Import Provider from react-redux
import store from './components/redux/store'; // Import the configured store
import HomePage from './pages/Home/home';
import Toolspage from './pages/Tools/toolspage';
import Propertypage from './pages/property/property';
import Resourcespage from './pages/Resources/resources';
import Accountingpage from './pages/Accounting/accounting';
import Analyticsspage from './pages/Analytics/analytics';
import ProtectedRoute from './pages/Auth/PrivateRoute';
import LoginPage from './pages/Auth/loginpage';
import SignupPage from './pages/Auth/signup';
import SideBarPage from './components/sidebar';
import MessagesPage from './pages/Tools/toolapplication/messages/messagespage';
import MaintenancePage from './pages/Tools/toolapplication/maintenance/maintenancepage';
import Logbook from './pages/Tools/toolapplication/logbook/logbook';
import NewApplications from './pages/Tools/toolapplication/newapplications/newapplications';
import NewTenant from './pages/Tools/toolapplication/newtenant/newtenant';
import UnitInfoPage from './pages/property/propertyinfo/unitinfo';
import ForgotPassword from './pages/Auth/forgotpassword';
import Applicationviewer from './pages/Tools/toolapplication/newapplications/applicationviewer/applicationviewer';
import AddNewProperty from './pages/applications/newproperty/addnewproperty';
import PropertyInfo from './pages/property/propertyinfo/propertyinfo';

import { fetchUserDetails } from './components/redux/authSlice';
import { AppDispatch } from './components/redux/store';
import { auth } from './firebase-config'; // Import the auth object from your Firebase config
 
const theme = {
  token: {
    colorPrimary: '#5475ab',
    colorInfo: '#5475ab',
    fontSize: 14,
    sizeStep: 4,
    borderRadius: 6,
    wireframe: false,
    colorBgLayout: "#ebedf0",
  },
  components: {
    Menu: {
      darkItemBg: "rgb(59, 84, 133)",
      darkSubMenuItemBg: "rgb(59, 84, 133)",
      darkPopupBg: "rgb(59, 84, 133)",
      ItemBg: "rgb(59, 84, 133)",
      SubMenuItemBg: "rgb(59, 84, 133)",
      PopupBg: "rgb(59, 84, 133)",
    },
    Layout: {
      headerBg: "rgb(240, 242, 245)",
      siderBg: "rgb(59, 84, 133)",
    },
    Button: {
      dangerShadow: "",
      defaultShadow: "",
      primaryShadow: "",
      defaultBorderColor: "#5475AB",
      lineWidth: 1.5,
  
    },
    Card: {
      colorBorderSecondary: "rgb(239, 240, 247)"
    },
    Table: {
      borderColor: "rgb(239, 240, 247)"
    },
    Tabs: {
      lineWidth: 2,
      lineWidthBold: 2,
      colorBorderSecondary: "rgb(217,219,226)",
    },
  },
};

const App: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      dispatch(fetchUserDetails(currentUser.uid));
    }
  }, [dispatch]);

  return (
    <ConfigProvider theme={theme}>
      <Provider store={store}>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<SideBarPage />}>
                {/* Nested routes are automatically protected and included in the sidebar */}
                <Route index element={<HomePage />} />
                <Route path="home" element={<HomePage />} />
                <Route path="tools" element={<Toolspage />} />
                <Route path="property" element={<Propertypage />} />
                <Route path="resources" element={<Resourcespage />} />
                <Route path="accounting" element={<Accountingpage />} />
                <Route path="analytics" element={<Analyticsspage />} />
                <Route path="messages" element={<MessagesPage />} />
                <Route path="maintenance" element={<MaintenancePage />} />
                <Route path="logbook" element={<Logbook />} />
                <Route path="applications" element={<NewApplications />} />
                <Route path="new-tenant" element={<NewTenant />} />
                <Route path="/unitinfo" element={<UnitInfoPage />} />
                <Route path="/applicationviewer" element={<Applicationviewer />} />
                <Route path="/addnewproperty" element={<AddNewProperty />} />
                <Route path="/propertyinfo" element={<PropertyInfo />} /> {/* Route for PropertyInfo */}
              </Route>
            </Route>
          </Routes>
        </Router>
      </Provider>
    </ConfigProvider>
  );
};

export default App;
