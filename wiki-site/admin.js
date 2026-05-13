// Configuration Firebase
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getFirestore, collection, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

const firebaseConfig = {
    apiKey: "AIzaSyBTTtTZgDUwT6McnVxCutv807_FpkZ37gE",
    authDomain: "projet-5774d.firebaseapp.com",
    projectId: "projet-5774d",
    storageBucket: "projet-5774d.firebasestorage.app",
    messagingSenderId: "863809073893",
    appId: "1:863809073893:web:65a723657b289d1ac6da0c",
    measurementId: "G-GGBW8J8P0E"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Éléments DOM
const authSection = document.getElementById('auth-section');
const authStatus = document.getElementById('auth-status');
const loginForm = document.getElementById('login-form');
const articleSection = document.getElementById('article-section');
const articleForm = document.getElementById('article-form');
const logoutBtn = document.getElementById('logout-btn');

const titleInput = document.getElementById('title');
const dateInput = document.getElementById('date');
const contentInput = document.getElementById('content');
const previewTitle = document.getElementById('preview-title');
const previewDate = document.getElementById('preview-date');
const previewContent = document.getElementById('preview-content');
const submitBtn = document.getElementById('submit-btn');
const successMessage = document.getElementById('success-message');
const errorMessage = document.getElementById('error-message');

// Vérifier l'état d'authentification
onAuthStateChanged(auth, (user) => {
    if (user) {
        // Utilisateur connecté
        authSection.style.display = 'none';
        articleSection.style.display = 'block';
        console.log('Utilisateur connecté:', user.email);
    } else {
        // Utilisateur non connecté
        authSection.style.display = 'block';
        articleSection.style.display = 'none';
    }
});

// Connexion
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const loginBtn = document.getElementById('login-btn');
    const loginError = document.getElementById('login-error');
    
    loginBtn.disabled = true;
    loginBtn.textContent = '⏳ Connexion...';
    loginError.style.display = 'none';
    
    try {
        await signInWithEmailAndPassword(auth, email, password);
        loginForm.reset();
    } catch (error) {
        console.error('Erreur de connexion:', error);
        loginError.textContent = '❌ Email ou mot de passe incorrect';
        loginError.style.display = 'block';
    } finally {
        loginBtn.disabled = false;
        loginBtn.textContent = '🔐 Se connecter';
    }
});

// Déconnexion
logoutBtn.addEventListener('click', async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error('Erreur de déconnexion:', error);
    }
});

// Aperçu en temps réel
titleInput.addEventListener('input', () => {
    previewTitle.textContent = titleInput.value || 'Titre de l\'article';
});

dateInput.addEventListener('input', () => {
    previewDate.textContent = dateInput.value || 'Date de sortie : ...';
});

contentInput.addEventListener('input', () => {
    previewContent.innerHTML = contentInput.value || 'Le contenu apparaîtra ici...';
});

// Soumission du formulaire
articleForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ Publication en cours...';
    successMessage.style.display = 'none';
    errorMessage.style.display = 'none';

    try {
        const article = {
            title: titleInput.value,
            date: dateInput.value || `Date de sortie : ${new Date().toLocaleDateString('fr-FR')}`,
            content: contentInput.value,
            createdAt: serverTimestamp()
        };

        await addDoc(collection(db, 'articles'), article);

        successMessage.textContent = '✅ Article publié avec succès ! Il apparaîtra dans le launcher et sur le wiki.';
        successMessage.style.display = 'block';
        
        articleForm.reset();
        previewTitle.textContent = 'Titre de l\'article';
        previewDate.textContent = 'Date de sortie : ...';
        previewContent.innerHTML = 'Le contenu apparaîtra ici...';

        // Scroll vers le haut
        window.scrollTo({ top: 0, behavior: 'smooth' });

        setTimeout(() => {
            successMessage.style.display = 'none';
        }, 5000);

    } catch (error) {
        console.error('Erreur lors de la publication:', error);
        errorMessage.textContent = '❌ Erreur lors de la publication : ' + error.message;
        errorMessage.style.display = 'block';
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = '📤 Publier l\'article';
    }
});
