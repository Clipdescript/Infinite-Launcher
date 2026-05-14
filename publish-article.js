#!/usr/bin/env node

// Script pour publier des articles sur le wiki Infinite Launcher
// Utilisation: node publish-article.js "Titre de l'article" "Contenu de l'article"

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Configuration Firebase (même que dans src/firebase.ts)
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

// Fonction principale
async function publishArticle(title, content) {
    try {
        console.log('📤 Publication de l\'article en cours...');

        const article = {
            title: title,
            date: `Date de sortie : ${new Date().toLocaleDateString('fr-FR')}`,
            content: content,
            createdAt: serverTimestamp()
        };

        const docRef = await addDoc(collection(db, 'articles'), article);

        console.log('✅ Article publié avec succès !');
        console.log('📄 ID du document:', docRef.id);
        console.log('🔗 L\'article apparaîtra dans le launcher et sur le wiki.');

    } catch (error) {
        console.error('❌ Erreur lors de la publication:', error.message);
        process.exit(1);
    }
}

// Vérification des arguments
const args = process.argv.slice(2);

if (args.length < 2) {
    console.log('❌ Utilisation: node publish-article.js "Titre de l\'article" "Contenu de l\'article"');
    console.log('💡 Exemple: node publish-article.js "Nouvelle mise à jour" "Découvrez les dernières fonctionnalités..."');
    process.exit(1);
}

const title = args[0];
const content = args[1];

console.log('📝 Titre:', title);
console.log('📄 Contenu:', content.substring(0, 100) + (content.length > 100 ? '...' : ''));

// Publication
publishArticle(title, content);