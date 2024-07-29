import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { ConfigProvider } from 'antd';
import { Provider } from 'react-redux';
import store from './components/redux/store';
import HomePage from './pages/Home/home';
import Toolspage from './pages/Tools/toolspage';
import Propertypage from './pages/property/property';
import Resourcespage from './pages/Resources/resources';
import Leasingpage from './pages/leasing/leasingPage';
import Peoplepage from './pages/people/peoplePage';
import Taskpage from './pages/task/taskPage';
import Accountingpage from './pages/Accounting/accounting';
import Analyticsspage from './pages/Analytics/analytics';
import ProtectedRoute from './pages/Auth/PrivateRoute';
import LoginPage from './pages/Auth/loginpage';
import SignupPage from './pages/Auth/signup';
import PropertyInfoUnitViewNotes from './pages/property/propertyinfo/tabs/PropertyInfoUnitViewNotes'
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
import PropertyInfoUnitView from './pages/property/propertyinfo/tabs/propertyinfo_units_view';
import { fetchUserDetails } from './components/redux/authSlice';
import { AppDispatch } from './components/redux/store';
import { auth } from './firebase-config';

const theme = {
  token: {
    colorPrimary: "#28a745",
    colorInfo: "#28a745",
    fontSize: 14,
    sizeStep: 4,
    borderRadius: 4,
    wireframe: false,
    colorBgLayout: "#F3F5F8",
  },
  components: {
    Menu: {
      darkItemBg: "#188034", // colorPrimaryActive
      darkSubMenuItemBg: "#188034", // colorPrimaryActive
      darkPopupBg: "#FFFFFF", // Keeping white as it was
      ItemBg: "#188034", // colorPrimaryActive
      SubMenuItemBg: "#188034", // colorPrimaryActive
      PopupBg: "#d8e6d9", // colorPrimaryBg
    },
    Layout: {
      headerBg: "#d8e6d9", // colorPrimaryBg
      siderBg: "#188034", // colorPrimaryActive
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
                <Route path="leasing" element={<Leasingpage />} />
                <Route path="people" element={<Peoplepage />} />
                <Route path="tasks" element={<Taskpage />} />
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
                <Route path="/propertyinfo/" element={<PropertyInfo />} />
                <Route path="propertyinfo/:propertyId/unit/:unitName" element={<PropertyInfoUnitView />} />
              </Route>
            </Route>
          </Routes>
        </Router>
      </Provider>
    </ConfigProvider>
  );
};

export default App;
