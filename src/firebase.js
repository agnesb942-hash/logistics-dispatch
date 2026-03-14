// src/firebase.js
// 共用 Firebase 初始化模組 — 統一設定、避免重複初始化
// 所有元件透過 initFirebase() 取得 { db, doc, getDoc, setDoc, ... } 等 Firestore 工具

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAe5gxLBHN9CQ6zVhKF6zQGbvgMXCbqoF4",
  authDomain: "jc-logi-map.firebaseapp.com",
  projectId: "jc-logi-map",
  storageBucket: "jc-logi-map.firebasestorage.app",
  messagingSenderId: "98258062805",
  appId: "1:98258062805:web:d004b291c639e126e7c15c"
};

const FIREBASE_CDN = 'https://www.gstatic.com/firebasejs/10.12.0';

let _instance = null;

// SHA-256 雜湊（Web Crypto API，瀏覽器原生支援）
export const hashPassword = async (pw) => {
  const data = new TextEncoder().encode(pw);
  const buf  = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
};

export const initFirebase = async () => {
  if (_instance) return _instance;
  try {
    const fbApp  = await import(`${FIREBASE_CDN}/firebase-app.js`);
    const fstore = await import(`${FIREBASE_CDN}/firebase-firestore.js`);
    const existing = fbApp.getApps();
    const app = existing.length > 0 ? existing[0] : fbApp.initializeApp(FIREBASE_CONFIG);
    const db  = fstore.getFirestore(app);
    _instance = { db, ...fstore };
    return _instance;
  } catch (e) {
    console.warn('[Firebase] 初始化失敗：', e);
    return null;
  }
};
