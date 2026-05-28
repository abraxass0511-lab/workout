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

function ensureInit() {
  if (app) return;
  const fb = window.firebase;
  if (!fb) return;
  app = fb.initializeApp(firebaseConfig);
  auth = fb.auth();
  db = fb.firestore();
}

export function initAuth() {
  return new Promise((resolve) => {
    ensureInit();
    if (!auth) { resolve(null); return; }

    auth.onAuthStateChanged((user) => {
      if (user) {
        currentUid = user.uid;
        resolve(user.uid);
      } else {
        auth.signInAnonymously()
          .then((cred) => {
            currentUid = cred.user.uid;
            resolve(cred.user.uid);
          })
          .catch((err) => {
            console.error('Auth error:', err);
            resolve(null);
          });
      }
    });
  });
}

export function getUid() {
  return currentUid;
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
