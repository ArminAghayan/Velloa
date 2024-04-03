import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/Home/home';
import Toolspage from './pages/Tools/toolspage';
import Unitspage from './pages/Units/units';
import Resourcespage from './pages/Resources/resources';
import Accountingpage from './pages/Accounting/accounting';
import Analyticsspage from './pages/Analytics/analytics';
import ProtectedRoute from './pages/Auth/PrivateRoute';
import LoginPage from './pages/Auth/loginpage';
import SignupPage from './pages/Auth/signup';
import SideBarPage from './components/sidebar';
import Dashboardpage from './pages/dashboard/dashboard';
import VisitorsPage from './pages/Tools/toolapplication/vistors/vistorspage';
import MessagesPage from './pages/Tools/toolapplication/messages/messagespage';
import MaintenancePage from './pages/Tools/toolapplication/maintenance/maintenancepage';
import Logbook from './pages/Tools/toolapplication/logbook/logbook';
import PackagesPage from './pages/Tools/toolapplication/packages/packagespage';
import Amenities from './pages/Tools/toolapplication/amenities/amenitites';
import NewApplications from './pages/Tools/toolapplication/newapplications/newapplications';
import Events from './pages/Tools/toolapplication/events/events';
import NewTenant from './pages/Tools/toolapplication/newtenant/newtenant';
import UnitInfoPage from './pages/Units/unitinfo/unitinfo';
import ForgotPassword from './pages/Auth/forgotpassword';
import { ConfigProvider } from 'antd';
import Applicationviewer from './pages/Tools/toolapplication/newapplications/applicationviewer/applicationviewer';

const theme = {
  token: {
    colorPrimary: '#5475ab',
    colorInfo: '#5475ab',
    fontSize: 14,
    sizeStep: 4,
    borderRadius: 6,
    wireframe: false,
  
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
  
    },
  },
};




const App = () => {

  return (
  <ConfigProvider theme={theme}>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/dashboard" element={<ProtectedRoute />}>
            <Route index element={<Dashboardpage />} />
          </Route>
          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<SideBarPage />}>
              {/* Nested routes are automatically protected and included in the sidebar */}
              <Route index element={<HomePage />} />
              <Route path="home" element={<HomePage />} />
              <Route path="tools" element={<Toolspage />} />
              <Route path="units" element={<Unitspage />} />
              <Route path="resources" element={<Resourcespage />} />
              <Route path="accounting" element={<Accountingpage />} />
              <Route path="analytics" element={<Analyticsspage />} />
              <Route path="visitors" element={<VisitorsPage />} />
              <Route path="messages" element={<MessagesPage />} />
              <Route path="maintenance" element={<MaintenancePage />} />
              <Route path="logbook" element={<Logbook />} />
              <Route path="packages" element={<PackagesPage />} />
              <Route path="amenities" element={<Amenities />} />
              <Route path="applications" element={<NewApplications />} />
              <Route path="events" element={<Events />} />
              <Route path="new-tenant" element={<NewTenant />} />
              <Route path="/unitinfo" element={<UnitInfoPage />} />
              <Route path="/applicationviewer" element={<Applicationviewer />} />

            </Route>
          </Route>
        </Routes>
      </Router>
    </ConfigProvider>

  );
};

export default App;