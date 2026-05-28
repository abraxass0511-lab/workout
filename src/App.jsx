import { HashRouter, Routes, Route } from 'react-router-dom';
import { UserProvider, useUser } from './contexts/UserContext';
import { WorkoutProvider } from './contexts/WorkoutContext';
import BottomNav from './components/BottomNav';
import MonthlyWeightModal from './components/MonthlyWeightModal';
import MonthlyRewardModal from './components/MonthlyRewardModal';
import OnboardingPage from './pages/OnboardingPage';
import CalendarPage from './pages/CalendarPage';
import RoutinePage from './pages/RoutinePage';
import AchievementPage from './pages/AchievementPage';
import SettingsPage from './pages/SettingsPage';
import './App.css';

function AppContent() {
  const { user } = useUser();

  if (!user.isOnboarded) {
    return <OnboardingPage />;
  }

  return (
    <div className="app-shell">
      <main className="app-main">
        <Routes>
          <Route path="/" element={<CalendarPage />} />
          <Route path="/routine" element={<RoutinePage />} />
          <Route path="/achievement" element={<AchievementPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>
      <BottomNav />
      <MonthlyWeightModal />
      <MonthlyRewardModal />
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <UserProvider>
        <WorkoutProvider>
          <AppContent />
        </WorkoutProvider>
      </UserProvider>
    </HashRouter>
  );
}
