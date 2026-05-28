import { createContext, useContext, useReducer, useEffect } from 'react';
import { storage } from '../utils/storage';

const UserContext = createContext(null);

const initialState = {
  isOnboarded: false,
  name: '',
  nickname: '',
  heightCm: '',
  weightKg: '',
  familyName: '',
  familyRelation: '배우자',
  geminiApiKey: '',
  weightHistory: [], // [{ date, weight }]
};

function userReducer(state, action) {
  switch (action.type) {
    case 'SET_PROFILE':
      return { ...state, ...action.payload };
    case 'COMPLETE_ONBOARDING':
      return { ...state, isOnboarded: true };
    case 'UPDATE_WEIGHT': {
      const entry = { date: action.payload.date, weight: action.payload.weight };
      const history = [...state.weightHistory.filter(h => h.date !== entry.date), entry];
      history.sort((a, b) => a.date.localeCompare(b.date));
      return { ...state, weightKg: action.payload.weight, weightHistory: history };
    }
    case 'SET_API_KEY':
      return { ...state, geminiApiKey: action.payload };
    case 'RESET':
      return { ...initialState };
    default:
      return state;
  }
}

export function UserProvider({ children }) {
  const saved = storage.get('user', initialState);
  const [state, dispatch] = useReducer(userReducer, saved);

  useEffect(() => {
    storage.set('user', state);
  }, [state]);

  return (
    <UserContext.Provider value={{ user: state, dispatch }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within UserProvider');
  return context;
}
