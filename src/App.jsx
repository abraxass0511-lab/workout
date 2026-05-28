import { useState, useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { UserProvider, useUser } from './contexts/UserContext';
import { WorkoutProvider, useWorkout } from './contexts/WorkoutContext';
import BottomNav from './components/BottomNav';
import MonthlyWeightModal from './components/MonthlyWeightModal';
import MonthlyRewardModal from './components/MonthlyRewardModal';
import LoginPage from './pages/LoginPage';
import OnboardingPage from './pages/OnboardingPage';
import CalendarPage from './pages/CalendarPage';
import RoutinePage from './pages/RoutinePage';
import AchievementPage from './pages/AchievementPage';
import SettingsPage from './pages/SettingsPage';
import { onAuthChange, loadCloudData } from './utils/firebase';
import './App.css';

function CloudSync() {
  const { dispatch: userDispatch } = useUser();
  const { dispatch: workoutDispatch } = useWorkout();
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    if (synced) return;
    (async () => {
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
    })();
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
  const [authUser, setAuthUser] = useState(undefined); // undefined = loading

  useEffect(() => {
    let unsub = null;
    onAuthChange((user) => {
      setAuthUser(user || null);
    }).then((fn) => { unsub = fn; });
    return () => { if (unsub) unsub(); };
  }, []);

  // Loading state
  if (authUser === undefined) {
    return (
      <div className="app-loading">
        <div className="app-loading-spinner"></div>
        <p>로딩 중...</p>
      </div>
    );
  }

  // Not logged in
  if (!authUser) {
    return <LoginPage />;
  }

  // Logged in
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
