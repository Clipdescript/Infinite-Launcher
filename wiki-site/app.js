// Configuration Firebase
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getFirestore, collection, getDocs, orderBy, query } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

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

// Charger les articles
async function loadArticles() {
    const container = document.getElementById('articles-container');
    
    try {
        const q = query(collection(db, 'articles'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            container.innerHTML = '<div class="no-articles">Aucun article publié pour le moment.</div>';
            return;
        }

        container.innerHTML = '';
        
        querySnapshot.forEach((doc) => {
            const article = doc.data();
            const articleCard = document.createElement('a');
            articleCard.className = 'article-card';
            articleCard.href = `article.html?id=${doc.id}`;
            
            const date = article.createdAt ? new Date(article.createdAt.toDate()).toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }) : 'Date inconnue';
            
            // Créer un extrait du contenu (premiers 200 caractères)
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = article.content || '';
            const textContent = tempDiv.textContent || tempDiv.innerText || '';
            const excerpt = textContent.substring(0, 200) + (textContent.length > 200 ? '...' : '');
            
            articleCard.innerHTML = `
                <h2 class="article-title">${article.title || 'Sans titre'}</h2>
                <p class="article-date">Publié le ${date}</p>
                <p class="article-excerpt">${excerpt}</p>
                <span class="article-read-more">Lire la suite</span>
            `;
            
            container.appendChild(articleCard);
        });
    } catch (error) {
        console.error('Erreur lors du chargement des articles:', error);
        container.innerHTML = '<div class="no-articles">Erreur lors du chargement des articles.</div>';
    }
}

// Charger au démarrage
loadArticles();
