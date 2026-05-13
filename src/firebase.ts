import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, User, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

// Configuration Firebase pour Infinite Launcher
const firebaseConfig = {
  apiKey: "AIzaSyBTTtTZgDUwT6McnVxCutv807_FpkZ37gE",
  authDomain: "projet-5774d.firebaseapp.com",
  projectId: "projet-5774d",
  storageBucket: "projet-5774d.firebasestorage.app",
  messagingSenderId: "863809073893",
  appId: "1:863809073893:web:65a723657b289d1ac6da0c",
  measurementId: "G-GGBW8J8P0E"
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Service d'authentification
export const authService = {
  // Inscription avec email/mot de passe
  register: async (email: string, password: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      return { success: true, user: userCredential.user };
    } catch (error: any) {
      let errorMessage = 'Erreur lors de l\'inscription';
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'Cet email est déjà utilisé';
          break;
        case 'auth/weak-password':
          errorMessage = 'Le mot de passe doit contenir au moins 6 caractères';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Email invalide';
          break;
        default:
          errorMessage = error.message;
      }
      
      return { success: false, error: errorMessage };
    }
  },

  // Connexion avec email/mot de passe
  login: async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return { success: true, user: userCredential.user };
    } catch (error: any) {
      let errorMessage = 'Erreur lors de la connexion';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'Utilisateur non trouvé';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Mot de passe incorrect';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Email invalide';
          break;
        default:
          errorMessage = error.message;
      }
      
      return { success: false, error: errorMessage };
    }
  },

  // Déconnexion
  logout: async () => {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Observer les changements d'état d'authentification
  onAuthChange: (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, callback);
  },

  // Obtenir l'utilisateur actuel
  getCurrentUser: () => {
    return auth.currentUser;
  },

  // Connexion avec Google via popup
  signInWithGoogle: async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account' // Force le choix du compte à chaque fois
      });
      const userCredential = await signInWithPopup(auth, provider);
      return { success: true, user: userCredential.user };
    } catch (error: any) {
      let errorMessage = 'Erreur lors de la connexion avec Google';
      
      switch (error.code) {
        case 'auth/popup-closed-by-user':
          errorMessage = 'Fenêtre de connexion fermée';
          break;
        case 'auth/cancelled-popup-request':
          errorMessage = 'Connexion annulée';
          break;
        case 'auth/account-exists-with-different-credential':
          errorMessage = 'Un compte existe déjà avec cet email';
          break;
        case 'auth/invalid-credential':
          errorMessage = 'Identifiants invalides';
          break;
        default:
          errorMessage = error.message;
      }
      
      return { success: false, error: errorMessage };
    }
  },

  // Récupérer le dernier article publié
  getLatestArticle: async () => {
    try {
      const articlesRef = collection(db, 'articles');
      const q = query(articlesRef, orderBy('createdAt', 'desc'), limit(1));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }
      
      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      };
    } catch (error: any) {
      console.error('Erreur lors de la récupération de l\'article:', error);
      return null;
    }
  }
};

export default auth;
