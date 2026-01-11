import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { MapPage } from './pages/MapPage';
import { RegionInfoPage } from './pages/RegionInfoPage';
import { ReportPage } from './pages/ReportPage';
import { ReportCompletePage } from './pages/ReportCompletePage';
import { PartnerPage } from './pages/PartnerPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { MyPage } from './pages/MyPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminReports } from './pages/admin/AdminReports';
import { AdminUsers } from './pages/admin/AdminUsers';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Admin Routes - 자체 레이아웃 사용 */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/reports" element={<AdminReports />} />
          <Route path="/admin/users" element={<AdminUsers />} />

          {/* Public Routes - 메인 레이아웃 사용 */}
          <Route path="/" element={<Layout><HomePage /></Layout>} />
          <Route path="/map" element={<Layout><MapPage /></Layout>} />
          <Route path="/region/:regionId" element={<Layout><RegionInfoPage /></Layout>} />
          <Route path="/report" element={<Layout><ReportPage /></Layout>} />
          <Route path="/report/complete" element={<Layout><ReportCompletePage /></Layout>} />
          <Route path="/partner" element={<Layout><PartnerPage /></Layout>} />
          <Route path="/login" element={<Layout><LoginPage /></Layout>} />
          <Route path="/signup" element={<Layout><SignupPage /></Layout>} />
          <Route path="/mypage" element={<Layout><MyPage /></Layout>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
