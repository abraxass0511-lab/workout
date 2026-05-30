import { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import { storage } from '../utils/storage';
import { saveUserData } from '../utils/firebase';

const UserContext = createContext(null);

const initialState = {
  isOnboarded: false,
  name: '',
  nickname: '',
  heightCm: '',
  weightKg: '',
  familyName: '',
  familyRelation: '배우자',
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

    case 'LOAD_CLOUD':
      return { ...state, ...action.payload };
    case 'RESET':
      return { ...initialState };
    default:
      return state;
  }
}

export function UserProvider({ children }) {
  const saved = storage.get('user', initialState);
  const [state, dispatch] = useReducer(userReducer, saved);
  const isFirstRender = useRef(true);

  useEffect(() => {
    storage.set('user', state);

    // Skip cloud save on first render (initial load)
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Save to Firestore (debounced via async)
    if (state.isOnboarded) {
      saveUserData(state);
    }
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
