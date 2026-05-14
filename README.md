# Infinite Launcher

Un launcher Minecraft open source, développé principalement par IA. Ce projet a été créé rapidement et le code n'est pas toujours bien structuré ni optimisé. Il contient des parties mal implémentées et mérite une refactorisation sérieuse. Toute contribution bénévole est la bienvenue pour améliorer la qualité et ajouter des fonctionnalités !

## À propos

Infinite Launcher est un launcher Minecraft gratuit et open source qui permet de lancer Minecraft avec des modpacks, gérer les versions Java automatiquement, et synchroniser des actualités via un site wiki communautaire. Il utilise Electron pour l'interface desktop et React pour l'UI moderne.

**Avertissement :** Ce projet a été généré en grande partie par des outils d'IA. Le code peut contenir des bugs, des inefficacités ou des pratiques non optimales. Nous encourageons les développeurs bénévoles à contribuer pour refactoriser, optimiser et étendre les fonctionnalités.

## Fonctionnalités

- **Lancement de Minecraft** : Lance le jeu avec des modpacks installés depuis Modrinth
- **Gestion automatique de Java** : Télécharge et configure automatiquement les versions Java requises (8, 17, 21) selon la version Minecraft
- **Authentification Microsoft** : Connexion sécurisée via comptes Microsoft pour jouer
- **Gestion des modpacks** : Parcours, recherche et installation de modpacks depuis Modrinth
- **Mises à jour automatiques** : Système intégré pour mettre à jour le launcher
- **Interface multi-langues** : Support de plusieurs langues
- **Synchronisation cloud** : Utilise Firebase pour l'authentification et la synchronisation des données
- **Site wiki communautaire** : Site web pour publier et lire des articles/actualités, hébergé sur Firebase
- **Barre de titre personnalisée** : Contrôles de fenêtre natifs

## Spécifications système (honnêtes)

- **OS** : Windows 10/11 (64-bit) - Testé principalement sur Windows
- **RAM** : Minimum 8 Go (recommandé 16 Go pour les gros modpacks avec beaucoup de mods)
- **Stockage** : 1 Go pour le launcher + espace pour Minecraft et les modpacks (plusieurs Go selon les packs)
- **CPU** : Processeur moderne avec au moins 4 cœurs
- **Internet** : Requis pour télécharger les modpacks, Java, et synchroniser les données
- **GPU** : Selon les modpacks utilisés (certains nécessitent une bonne carte graphique)

**Note :** Les performances peuvent varier selon la complexité des modpacks. Le launcher n'est pas optimisé pour les configurations faibles.

## Installation

### Téléchargement

Téléchargez la dernière version depuis la page [Releases](https://github.com/Clipdescript/Infinite-Launcher/releases).

### Compilation depuis les sources

#### Prérequis

- Node.js 18 ou supérieur
- npm ou yarn
- Git

#### Commandes

```bash
# Cloner le dépôt
git clone https://github.com/Clipdescript/Infinite-Launcher.git
cd Infinite-Launcher

# Installer les dépendances
npm install

# Lancer en mode développement (ouvre l'app Electron)
npm run dev

# Compiler pour la production (crée un exécutable)
npm run build

# Lancer en mode preview (sans Electron, juste le site web)
npm run preview

# Vérifier le code (linting)
npm run lint
```

## Structure du projet

```
Infinite-Launcher/
├── electron/                 # Processus principal Electron
│   ├── main.ts              # Point d'entrée principal, gestion des fenêtres, IPC
│   ├── preload.ts           # Script de préchargement pour la sécurité IPC
│   └── GameManager.ts       # Gestion du lancement Minecraft, Java, modpacks
├── src/                     # Application React (renderer)
│   ├── components/          # Composants UI
│   │   ├── AuthPage.tsx     # Page d'authentification Microsoft
│   │   └── ModpacksPage.tsx # Page de gestion des modpacks
│   ├── styles/              # Styles CSS modulaires
│   ├── types/               # Définitions TypeScript
│   ├── App.tsx              # Composant principal React
│   ├── main.tsx             # Point d'entrée React
│   └── firebase.ts          # Configuration Firebase
├── wiki-site/               # Site wiki communautaire (HTML/JS/CSS)
│   ├── index.html           # Page publique des articles
│   ├── admin.html           # Interface admin pour publier
│   ├── app.js               # Logique commune
│   ├── admin.js             # Logique admin
│   ├── style.css            # Styles du site
│   └── firebase.json        # Config Firebase Hosting
├── dist-electron/           # Sortie compilée Electron
├── release/                 # Builds publiés
├── temp-extract/            # Dossier temporaire pour extractions
├── package.json             # Dépendances et scripts
├── vite.config.ts           # Config Vite
├── electron.vite.config.ts  # Config Electron-Vite
├── tsconfig.json            # Config TypeScript
└── README.md                # Ce fichier
```

## Stack technique

- **Frontend** : React 18, TypeScript, Vite
- **Backend** : Electron 33, Node.js
- **Lancement Minecraft** : minecraft-launcher-core
- **Authentification** : msmc (Microsoft), Firebase
- **Base de données** : Firestore (Firebase)
- **Hébergement site** : Firebase Hosting
- **Build** : electron-builder, Vite
- **Styles** : CSS modules, Heroicons

## Configuration

### Firebase

1. Créez un projet sur [Firebase Console](https://console.firebase.google.com)
2. Activez Authentication (Email/Password, Google) et Firestore
3. Copiez la config dans `src/firebase.ts` et les fichiers du wiki-site

### Variables d'environnement

Créez un `.env` à la racine :

```env
GH_TOKEN=votre_token_github_pour_mises_a_jour
```

## Hébergement du site wiki

Le site wiki est dans `wiki-site/`. Pour l'héberger :

```bash
cd wiki-site
npm install -g firebase-tools
firebase login
firebase init  # Sélectionnez Hosting et Firestore
firebase deploy
```

## Contribution

Ce projet a besoin d'aide ! Étant généré par IA, il y a beaucoup à améliorer :

- Refactorisation du code
- Optimisation des performances
- Ajout de fonctionnalités (Linux/Mac support, plus de langues, etc.)
- Correction de bugs
- Amélioration de l'UI/UX

N'hésitez pas à ouvrir des issues ou PRs. Toute contribution est appréciée !

## Licence

ISC (voir package.json)

## Contact

- GitHub : [Clipdescript/Infinite-Launcher](https://github.com/Clipdescript/Infinite-Launcher)
- Site : [projet-5774d.web.app](https://projet-5774d.web.app)

## Contribuer

Les contributions sont les bienvenues ! Veuillez suivre ces directives :

1. Forkez le dépôt
2. Créez une branche de fonctionnalité (`git checkout -b feature/fonctionnalite-incroyable`)
3. Commitez vos changements (`git commit -m 'Ajout fonctionnalité incroyable'`)
4. Poussez vers la branche (`git push origin feature/fonctionnalite-incroyable`)
5. Ouvrez une Pull Request

### Style de Code

- Utilisez TypeScript pour la sécurité des types
- Suivez la configuration ESLint
- Écrivez des messages de commit significatifs
- Ajoutez des commentaires pour la logique complexe

## Feuille de Route

- [ ] Support Linux et macOS
- [ ] Mode hors ligne
- [ ] Support des skins personnalisés
- [ ] Navigateur de serveurs
- [ ] Gestionnaire de resource packs
- [ ] Intégration des shader packs
- [ ] Outils d'optimisation des performances

## Licence

Ce projet est sous licence ISC - voir le fichier [LICENSE](LICENSE) pour plus de détails.

## Remerciements

- [Minecraft Launcher Core](https://github.com/Pierce01/MinecraftLauncher-core) - Fonctionnalité principale du launcher
- [Modrinth](https://modrinth.com) - API des modpacks
- [MSMC](https://github.com/Hanro50/MSMC) - Authentification Microsoft
- [Electron](https://www.electronjs.org) - Framework desktop multiplateforme
- [React](https://react.dev) - Framework UI

## Support

- **Site Web**: [https://projet-5774d.web.app](https://projet-5774d.web.app)
- **Discord**: [Rejoindre notre communauté](https://discord.gg/PUetupkA)
- **Issues**: [GitHub Issues](https://github.com/Clipdescript/Infinite-Launcher/issues)

## Avertissement

Infinite Launcher n'est pas approuvé par ou associé à Mojang Studios ou Microsoft Corporation. Minecraft est une marque déposée de Mojang Studios.

## Auteurs

- **Clipdescript** - [GitHub](https://github.com/Clipdescript)

## Historique des Versions

- **2.0.5** - Dernière version avec système de mise à jour amélioré
- **2.0.2** - Version publique initiale

---

Fait avec dévouement pour la communauté Minecraft.
