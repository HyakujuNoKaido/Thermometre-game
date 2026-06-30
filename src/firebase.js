const firebaseConfig = {
    apiKey: "AIzaSyBEwzH6QEPWegpgBmnevtiBX9gqy3V3dcY",
    authDomain: "le-thermometre.firebaseapp.com",
    databaseURL: "https://le-thermometre-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "le-thermometre",
    storageBucket: "le-thermometre.firebasestorage.app",
    messagingSenderId: "650617838327",
    appId: "1:650617838327:web:f20b05a54fe85a781011f2"
};

if (!window.firebase.apps.length) {
    window.firebase.initializeApp(firebaseConfig);
}

export const db = window.firebase.database();
export const ServerValue = window.firebase.database.ServerValue;
