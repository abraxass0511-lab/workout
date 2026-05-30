// Firebase via global compat SDK loaded from CDN in index.html
// Uses window.firebase to avoid Vite bundle issues

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "antigravity-workout-app1.firebaseapp.com",
  projectId: "antigravity-workout-app1",
  storageBucket: "antigravity-workout-app1.firebasestorage.app",
  messagingSenderId: "265599282964",
  appId: "1:265599282964:web:1c11a9f3da95ec40761c01",
};

let app, db, auth;
let currentUid = null;
let currentUser = null;

function ensureInit() {
  if (app) return true;
  const fb = window.firebase;
  if (!fb) return false;
  app = fb.initializeApp(firebaseConfig);
  auth = fb.auth();
  db = fb.firestore();

  // Handle redirect result (after Google redirect login)
  auth.getRedirectResult().then((result) => {
    if (result?.user) {
      currentUid = result.user.uid;
      currentUser = result.user;
    }
  }).catch((e) => {
    console.error('Redirect result error:', e);
  });

  return true;
}

// Wait for Firebase CDN scripts to load
function waitForFirebase() {
  return new Promise((resolve) => {
    if (window.firebase) { resolve(); return; }
    const check = setInterval(() => {
      if (window.firebase) { clearInterval(check); resolve(); }
    }, 50);
    // Timeout after 5s
    setTimeout(() => { clearInterval(check); resolve(); }, 5000);
  });
}

// Listen for auth state changes
export async function onAuthChange(callback) {
  await waitForFirebase();
  ensureInit();
  if (!auth) { callback(null); return () => {}; }
  return auth.onAuthStateChanged((user) => {
    if (user) {
      currentUid = user.uid;
      currentUser = user;
    } else {
      currentUid = null;
      currentUser = null;
    }
    callback(user);
  });
}

// Google Sign-in
export async function signInWithGoogle() {
  await waitForFirebase();
  ensureInit();
  if (!auth) return null;
  const provider = new window.firebase.auth.GoogleAuthProvider();

  // Try popup first (works in Chrome, Safari, etc.)
  try {
    const result = await auth.signInWithPopup(provider);
    return result.user;
  } catch (e) {
    console.error('Popup sign-in error:', e);
    // If popup fails (blocked, in-app browser), try redirect
    if (e.code === 'auth/popup-blocked' ||
        e.code === 'auth/popup-closed-by-user' ||
        e.code === 'auth/cancelled-popup-request' ||
        e.code === 'auth/unauthorized-domain') {
      // Don't redirect for unauthorized-domain, show error
      if (e.code === 'auth/unauthorized-domain') throw e;
      await auth.signInWithRedirect(provider);
    }
    return null;
  }
}

// Sign out
export async function signOut() {
  ensureInit();
  if (!auth) return;
  await auth.signOut();
}

export function getUid() {
  return currentUid;
}

export function getCurrentUser() {
  return currentUser;
}

export async function saveUserData(userData) {
  if (!currentUid || !db) return;
  try {
    await db.collection('users').doc(currentUid).set(
      { profile: userData, updatedAt: new Date().toISOString() },
      { merge: true }
    );
  } catch (e) {
    console.error('Firestore save user error:', e);
  }
}

export async function saveWorkoutData(workoutData) {
  if (!currentUid || !db) return;
  try {
    await db.collection('users').doc(currentUid).set(
      { workout: workoutData, updatedAt: new Date().toISOString() },
      { merge: true }
    );
  } catch (e) {
    console.error('Firestore save workout error:', e);
  }
}

export async function loadCloudData() {
  if (!currentUid || !db) return null;
  try {
    const snap = await db.collection('users').doc(currentUid).get();
    if (snap.exists) {
      return snap.data();
    }
  } catch (e) {
    console.error('Firestore load error:', e);
  }
  return null;
}
