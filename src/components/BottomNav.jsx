import { NavLink, useLocation } from 'react-router-dom';
import { Calendar, Target, Trophy, Settings } from 'lucide-react';
import './BottomNav.css';

const navItems = [
  { path: '/', icon: Calendar, label: '캘린더', id: 'nav-calendar' },
  { path: '/routine', icon: Target, label: '목표운동', id: 'nav-routine' },
  { path: '/achievement', icon: Trophy, label: '성과', id: 'nav-achievement' },
  { path: '/settings', icon: Settings, label: '설정', id: 'nav-settings' },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="bottom-nav" id="bottom-navigation">
      <div className="bottom-nav-inner">
        {navItems.map(item => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`nav-item ${isActive ? 'active' : ''}`}
              id={item.id}
            >
              <div className="nav-icon-wrap">
                <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                {isActive && <div className="nav-glow" />}
              </div>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
