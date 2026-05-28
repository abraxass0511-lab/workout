// Firebase via global compat SDK loaded from CDN in index.html
// Uses window.firebase to avoid Vite bundle issues

const firebaseConfig = {
  apiKey: "AIzaSyAvpZ69_opeHPoigRONfF3I8SjfKIRy8b4",
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
  if (app) return;
  const fb = window.firebase;
  if (!fb) return;
  app = fb.initializeApp(firebaseConfig);
  auth = fb.auth();
  db = fb.firestore();
}

// Listen for auth state changes
export function onAuthChange(callback) {
  ensureInit();
  if (!auth) return () => {};
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
  ensureInit();
  if (!auth) return null;
  const provider = new window.firebase.auth.GoogleAuthProvider();
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  if (isMobile) {
    // Mobile: redirect (avoids in-app browser block)
    await auth.signInWithRedirect(provider);
    return null;
  }

  // PC: popup
  try {
    const result = await auth.signInWithPopup(provider);
    return result.user;
  } catch (e) {
    console.error('Google sign-in error:', e);
    if (e.code === 'auth/popup-blocked' || e.code === 'auth/cancelled-popup-request') {
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
