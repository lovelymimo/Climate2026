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

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/region/:regionId" element={<RegionInfoPage />} />
            <Route path="/report" element={<ReportPage />} />
            <Route path="/report/complete" element={<ReportCompletePage />} />
            <Route path="/partner" element={<PartnerPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/mypage" element={<MyPage />} />
          </Routes>
        </Layout>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
