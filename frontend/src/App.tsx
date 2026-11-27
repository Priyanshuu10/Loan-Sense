import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { ApplicationsPage } from './pages/ApplicationsPage';
import { ApplicationDetailPage } from './pages/ApplicationDetailPage';
import { FraudDetectionPage } from './pages/FraudDetectionPage';
import { NewApplicationPage } from './pages/NewApplicationPage';
import { OverviewPage } from './pages/OverviewPage';
import { RiskAnalysisPage } from './pages/RiskAnalysisPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<OverviewPage />} />
          <Route path="/applications" element={<ApplicationsPage />} />
          <Route path="/applications/:id" element={<ApplicationDetailPage />} />
          <Route path="/new" element={<NewApplicationPage />} />
          <Route path="/analysis" element={<RiskAnalysisPage />} />
          <Route path="/fraud" element={<FraudDetectionPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
