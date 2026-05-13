# 🎮 Craft Launcher - Wiki Communautaire

Site web hébergé sur Firebase pour gérer les actualités du launcher.

## 📋 Fonctionnalités

- **Page publique** (`index.html`) : Affiche tous les articles publiés
- **Page admin** (`admin.html`) : Interface pour publier de nouveaux articles
- **Synchronisation automatique** : Les articles publiés apparaissent dans le launcher

## 🚀 Installation et Déploiement

### 1. Installer Firebase CLI

```bash
npm install -g firebase-tools
```

### 2. Se connecter à Firebase

```bash
firebase login
```

### 3. Initialiser le projet Firebase

```bash
cd wiki-site
firebase init
```

Sélectionnez :
- ✅ Firestore
- ✅ Hosting

### 4. Configuration Firebase

Remplacez la configuration dans `index.html` et `admin.html` :

```javascript
const firebaseConfig = {
    apiKey: "VOTRE_API_KEY",
    authDomain: "VOTRE_PROJECT_ID.firebaseapp.com",
    projectId: "VOTRE_PROJECT_ID",
    storageBucket: "VOTRE_PROJECT_ID.appspot.com",
    messagingSenderId: "VOTRE_SENDER_ID",
    appId: "VOTRE_APP_ID"
};
```

Vous pouvez trouver ces informations dans :
Firebase Console → Project Settings → Your apps → Web app

### 5. Déployer sur Firebase Hosting

```bash
firebase deploy
```

Votre site sera accessible à : `https://VOTRE_PROJECT_ID.web.app`

## 📝 Utilisation

### Publier un article

1. Accédez à `https://VOTRE_PROJECT_ID.web.app/admin.html`
2. Remplissez le formulaire :
   - **Titre** : Le titre principal de l'article
   - **Date** : Date de sortie (optionnel)
   - **Contenu** : Utilisez du HTML pour formater
3. Cliquez sur "Publier l'article"

### Format du contenu HTML

```html
<h4>Titre de section</h4>
<p>- Point 1</p>
<p>- Point 2</p>

<h4>Autre section</h4>
<p>Description...</p>
```

### Exemple d'article complet

**Titre :** `Minecraft 1.21.11 - Mounts of Mayhem`

**Date :** `Date de sortie : 15 janvier 2026`

**Contenu :**
```html
<h4>Nouvelles Armes : Les Lances (Spears)</h4>
<p>- Une nouvelle arme de portée ! Maintenez pour charger et relâchez pour infliger des dégâts, du recul et désarçonner les ennemis montés.</p>
<p>- Nouvel enchantement "Lunge" (Fente) : Propulse le joueur vers l'avant lors d'une attaque chargée.</p>

<h4>Nautilus et Vie Marine</h4>
<p>- Ajout des créatures Nautilus et Zombie Nautilus dans les océans.</p>
<p>- Nouvelle Armure de Nautilus offrant des effets uniques sous l'eau.</p>

<h4>Montures et Améliorations</h4>
<p>- Les Chevaux Zombies peuvent désormais être apprivoisés, équipés de selles et d'armures !</p>
<p>- Ajout de l'Armure pour Cheval en Netherite : La protection ultime pour votre fidèle destrier, l'immunisant contre le feu et la lave.</p>
<p>- Nouveaux mobs : Chameaux Husks et Parched.</p>
```

## 🔒 Sécurité

### Protéger la page admin

Pour sécuriser l'accès à la page admin, vous pouvez :

1. **Utiliser Firebase Authentication** (recommandé)
2. **Masquer l'URL** : Ne partagez pas le lien `admin.html` publiquement
3. **Ajouter un mot de passe** : Modifier `admin.html` pour demander un mot de passe

### Exemple de protection par mot de passe simple

Ajoutez au début de `admin.html` :

```javascript
const ADMIN_PASSWORD = "votre_mot_de_passe_secret";
const password = prompt("Mot de passe admin :");
if (password !== ADMIN_PASSWORD) {
    alert("Accès refusé");
    window.location.href = "index.html";
}
```

## 🔗 Intégration avec le Launcher

Le launcher récupère automatiquement le dernier article publié depuis Firebase.

Dans `App.tsx`, les articles sont chargés depuis Firestore et affichés dans la section news.

## 📊 Structure de la base de données

### Collection : `articles`

```javascript
{
    title: "Titre de l'article",
    date: "Date de sortie : 15 janvier 2026",
    content: "<h4>Section</h4><p>Contenu...</p>",
    createdAt: Timestamp
}
```

## 🎨 Personnalisation

Vous pouvez personnaliser :
- Les couleurs dans les fichiers CSS
- Le logo et les images
- Les styles de la page admin
- Les règles de sécurité Firestore

## 📞 Support

Pour toute question, contactez l'équipe de développement.

---

**Note** : N'oubliez pas de remplacer la configuration Firebase par la vôtre avant de déployer !
