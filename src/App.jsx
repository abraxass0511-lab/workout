import { useState, useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { UserProvider, useUser } from './contexts/UserContext';
import { WorkoutProvider, useWorkout } from './contexts/WorkoutContext';
import BottomNav from './components/BottomNav';
import MonthlyWeightModal from './components/MonthlyWeightModal';
import MonthlyRewardModal from './components/MonthlyRewardModal';
import OnboardingPage from './pages/OnboardingPage';
import CalendarPage from './pages/CalendarPage';
import RoutinePage from './pages/RoutinePage';
import AchievementPage from './pages/AchievementPage';
import SettingsPage from './pages/SettingsPage';
import { initAuth, loadCloudData } from './utils/firebase';
import './App.css';

function CloudSync() {
  const { dispatch: userDispatch } = useUser();
  const { dispatch: workoutDispatch } = useWorkout();
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    if (synced) return;

    initAuth().then(async (uid) => {
      if (!uid) { setSynced(true); return; }

      const data = await loadCloudData();
      if (data) {
        if (data.profile) {
          userDispatch({ type: 'LOAD_CLOUD', payload: data.profile });
        }
        if (data.workout) {
          workoutDispatch({ type: 'LOAD_CLOUD', payload: data.workout });
        }
      }
      setSynced(true);
    });
  }, [synced]);

  return null;
}

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
          <CloudSync />
          <AppContent />
        </WorkoutProvider>
      </UserProvider>
    </HashRouter>
  );
}
