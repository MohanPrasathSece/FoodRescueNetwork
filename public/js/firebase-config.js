// Firebase configuration and initialization
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
const firebaseConfig = {
    apiKey: "AIzaSyA3F4_IXYQP4Jgj1IUsceHlpNkh5HFGv-E",
    authDomain: "foodapp-e3a72.firebaseapp.com",
    projectId: "foodapp-e3a72",
    storageBucket: "foodapp-e3a72.firebasestorage.app",
    messagingSenderId: "612182449855",
    appId: "1:612182449855:web:19d738bfcdec07abdb700a",
    measurementId: "G-DFDP3HH58H"
  };
  

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get references to Firebase services
const auth = firebase.auth();
const db = firebase.firestore();

// Authentication state observer
auth.onAuthStateChanged((user) => {
    if (user) {
        // User is signed in
        const userEmail = document.getElementById('userEmail');
        if (userEmail) {
            userEmail.textContent = user.email;
        }
        
        // Check user role and redirect if necessary
        db.collection('users').doc(user.uid).get()
            .then((doc) => {
                if (doc.exists) {
                    const userData = doc.data();
                    const currentPage = window.location.pathname;
                    const role = userData.role;

                    // Redirect users based on their role
                    if (currentPage === '/index.html' || currentPage === '/') {
                        switch(role) {
                            case 'donor':
                                window.location.href = '/donor.html';
                                break;
                            case 'volunteer':
                                window.location.href = '/volunteer.html';
                                break;
                            case 'admin':
                                window.location.href = '/admin.html';
                                break;
                        }
                    }
                }
            });
    } else {
        // User is signed out
        const currentPage = window.location.pathname;
        if (currentPage !== '/index.html' && currentPage !== '/') {
            window.location.href = '/index.html';
        }
    }
});

// Login functionality
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        auth.signInWithEmailAndPassword(email, password)
            .catch((error) => {
                alert('Error: ' + error.message);
            });
    });
}

// Logout functionality
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        auth.signOut();
    });
}