import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Cấu hình Firebase - cần thay thế bằng thông tin từ Firebase Console
// sau khi tạo dự án Firebase
const firebaseConfig = {

    apiKey: "AIzaSyCi9CndXPw48GxA7Krzvn1qBjfnVcAhDro",
  
    authDomain: "toeic-dictation-app.firebaseapp.com",
  
    projectId: "toeic-dictation-app",
  
    storageBucket: "toeic-dictation-app.firebasestorage.app",
  
    messagingSenderId: "143965245308",
  
    appId: "1:143965245308:web:aa00e6198812a23f7a9ef9",
  
    measurementId: "G-7ZN5YTV3KX"
  
  };
  

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);

// Khởi tạo các dịch vụ
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db }; 