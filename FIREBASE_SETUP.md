# Firebase Email Authentication Setup Tutorial

## Overview
Tutorial ini menjelaskan cara mengatur Firebase Email Authentication untuk KokoroLens website.

## Langkah 1: Buat Firebase Project

1. Buka [Firebase Console](https://console.firebase.google.com/)
2. Klik "Add project" atau "Buat project"
3. Isi nama project (contoh: `kokorolens-web`)
4. Pilih atau buat Google Analytics account (opsional)
5. Klik "Create project"

## Langkah 2: Aktifkan Email/Password Authentication

1. Di Firebase Console, buka project yang baru dibuat
2. Di sidebar kiri, klik **Build** → **Authentication**
3. Klik tab **Sign-in method**
4. Cari **Email/Password** dan klik ikon pensil
5. Aktifkan **Enable**
6. Klik **Save**

## Langkah 3: Aktifkan Google Authentication (Opsional)

1. Di tab **Sign-in method** yang sama
2. Cari **Google** dan klik ikon pensil
3. Aktifkan **Enable**
4. Pilih project email support
5. Klik **Save**

## Langkah 4: Tambahkan Web App ke Firebase

1. Di Firebase Console, klik gear icon (Project Settings)
2. Scroll ke bawah ke "Your apps"
3. Klik **</>** (Web icon)
4. Isi nama app (contoh: `KokoroLens Web`)
5. Klik **Register app**
6. Firebase akan menampilkan konfigurasi SDK seperti ini:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "kokorolens-web.firebaseapp.com",
  projectId: "kokorolens-web",
  storageBucket: "kokorolens-web.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};
```

7. Copy konfigurasi tersebut
8. Buka file `firebase-config.js` di project Anda
9. Ganti placeholder dengan konfigurasi asli dari Firebase

## Langkah 5: Update firebase-config.js

Buka file `firebase-config.js` dan update dengan konfigurasi Firebase Anda:

```javascript
// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",  // Ganti dengan API key Anda
  authDomain: "kokorolens-web.firebaseapp.com",       // Ganti dengan authDomain Anda
  projectId: "kokorolens-web",                       // Ganti dengan projectId Anda
  storageBucket: "kokorolens-web.appspot.com",        // Ganti dengan storageBucket Anda
  messagingSenderId: "123456789012",                  // Ganti dengan messagingSenderId Anda
  appId: "1:123456789012:web:abcdef123456"           // Ganti dengan appId Anda
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Export auth instance
const auth = firebase.auth();
```

## Langkah 6: Tambahkan Authorized Domains

1. Di Firebase Console → Project Settings
2. Scroll ke bawah ke "Your apps" → pilih Web app Anda
3. Cari section **Authorized domains**
4. Klik **Add domain**
5. Tambahkan:
   - `localhost` (untuk development)
   - Domain Netlify Anda (contoh: `kokorolens.netlify.app`)
   - Custom domain jika ada (contoh: `app.kokorolens.com`)
6. Klik **Add**

## Langkah 7: Buat User di Firebase (Testing)

1. Di Firebase Console → Authentication
2. Klik tab **Users**
3. Klik **Add user**
4. Masukkan email dan password
5. Klik **Add user**

User ini bisa digunakan untuk testing login.

## Langkah 8: Deploy ke Netlify

1. Push perubahan ke GitHub
2. Netlify akan otomatis deploy
3. Setelah deploy, pastikan domain Netlify sudah ditambahkan di Firebase Authorized domains

## Kebutuhan Firebase Email Authentication

### 1. Firebase Project
- Project Firebase aktif
- Email/Password authentication di-enable
- (Opsional) Google authentication di-enable

### 2. Firebase Configuration
- API Key
- Auth Domain
- Project ID
- Storage Bucket
- Messaging Sender ID
- App ID

### 3. Authorized Domains
- localhost (untuk development)
- Domain production (Netlify atau custom domain)

### 4. Firebase SDK
- Firebase App SDK (sudah ditambahkan di index.html)
- Firebase Auth SDK (sudah ditambahkan di index.html)

## Cara Kerja Authentication

### Email/Password Login
```javascript
function loginWithEmailPassword(email, password){
  auth.signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      // Login berhasil
      console.log('Email login success:', userCredential.user);
      enterApp();
    })
    .catch((error) => {
      // Login gagal
      console.error('Email login error:', error);
      alert('Login gagal: ' + error.message);
    });
}
```

### Google OAuth Login
```javascript
function loginWithGoogle(){
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider)
    .then((result) => {
      // Login Google berhasil
      console.log('Google login success:', result.user);
      enterApp();
    })
    .catch((error) => {
      // Login Google gagal
      console.error('Google login error:', error);
      alert('Login Google gagal: ' + error.message);
    });
}
```

## Troubleshooting

### Error: "auth/invalid-api-key"
- Pastikan API key di firebase-config.js benar
- Cek Firebase Console → Project Settings → General → API keys

### Error: "auth/unauthorized-domain"
- Pastikan domain sudah ditambahkan di Firebase Authorized domains
- Cek Firebase Console → Project Settings → Your apps → Authorized domains

### Error: "auth/user-not-found"
- User belum dibuat di Firebase
- Buat user di Firebase Console → Authentication → Users

### Error: "auth/wrong-password"
- Password salah
- Reset password di Firebase Console → Authentication → Users

## Security Best Practices

1. **Jangan commit firebase-config.js dengan API key asli ke public repository**
   - Gunakan environment variables untuk production
   - Atau gunakan Firebase Hosting yang menyediakan auto-configuration

2. **Gunakan Firebase Rules untuk Realtime Database/Firestore**
   - Atur security rules untuk membatasi akses data

3. **Enable Email Verification**
   - Di Firebase Console → Authentication → Sign-in method
   - Aktifkan "Email verification" untuk keamanan tambahan

4. **Monitor Authentication Logs**
   - Firebase Console → Authentication → Users
   - Monitor aktivitas login yang mencurigakan

## Next Steps

Setelah Firebase authentication berjalan:
1. Implementasi user session management
2. Tambahkan fitur logout
3. Implementasi user profile management
4. Tambahkan role-based access control (jika diperlukan)
