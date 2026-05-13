// Configuration Firebase
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getFirestore, doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

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

// Récupérer l'ID de l'article depuis l'URL
const urlParams = new URLSearchParams(window.location.search);
const articleId = urlParams.get('id');

// Charger l'article
async function loadArticle() {
    const container = document.getElementById('article-container');
    
    if (!articleId) {
        container.innerHTML = '<div class="no-articles">Article introuvable.</div>';
        return;
    }
    
    try {
        const docRef = doc(db, 'articles', articleId);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
            container.innerHTML = '<div class="no-articles">Article introuvable.</div>';
            return;
        }
        
        const article = docSnap.data();
        
        const date = article.createdAt ? new Date(article.createdAt.toDate()).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }) : 'Date inconnue';
        
        // Mettre à jour le titre de la page
        document.title = `${article.title || 'Article'} - Infinite Launcher Wiki`;
        
        container.innerHTML = `
            <article class="article-card">
                <h1 class="article-title">${article.title || 'Sans titre'}</h1>
                <p class="article-date">Publié le ${date}</p>
                <div class="article-content">${article.content || ''}</div>
            </article>
        `;
        
        // Rendre les images cliquables
        const images = container.querySelectorAll('img');
        images.forEach(img => {
            img.style.cursor = 'pointer';
            img.onclick = () => openImageViewer(img.src);
        });
        
    } catch (error) {
        console.error('Erreur lors du chargement de l\'article:', error);
        container.innerHTML = '<div class="no-articles">Erreur lors du chargement de l\'article.</div>';
    }
}

// Charger au démarrage
loadArticle();
