# Instructions pour compiler Craft Launcher v2.0.2

## ⚠️ Problème actuel
Le fichier `app.asar` est verrouillé par un processus. 

## 🔧 Solution

### 1. Redémarrer l'ordinateur
Cela libérera tous les processus qui bloquent les fichiers.

### 2. Après le redémarrage, ouvrir PowerShell dans le dossier du projet

```powershell
cd "C:\Users\Administrateur\OneDrive\Documents\XLAUNCHER-main"
```

### 3. Compiler l'application

```powershell
npm run build
```

### 4. Le fichier .exe sera généré ici :
```
dist-electron\Craft Launcher Setup 2.0.2.exe
```

## 📝 Modifications apportées

### Corrections du bug d'ouverture :
1. ✅ Fenêtre affichée immédiatement (`show: true`)
2. ✅ Timeout de sécurité (3 secondes) pour forcer l'affichage
3. ✅ Logs de débogage pour identifier les problèmes de chargement
4. ✅ Gestion améliorée des erreurs de chargement
5. ✅ Couleur de fond changée de transparent à `#1a1a1a`

### Fichiers modifiés :
- `electron/main.ts` : Corrections du système d'affichage de la fenêtre
- `vite.config.ts` : Exclusion de dist-electron du watch

## 🚀 Tester l'application

### Option 1 : Mode développement
```powershell
npm run dev
```

### Option 2 : Application compilée
Double-cliquer sur `dist-electron\Craft Launcher Setup 2.0.2.exe`

## 📦 Uploader sur GitHub Releases

Une fois compilé :

1. Aller sur https://github.com/Clipdescript/craft-launcher/releases
2. Cliquer sur "Edit" sur la release v2.0.2
3. Supprimer l'ancien fichier .exe
4. Uploader le nouveau fichier depuis `dist-electron\`
5. Sauvegarder

Le lien de téléchargement sur le site restera le même !

## ✅ Vérifications après compilation

- [ ] L'application s'ouvre au clic
- [ ] La fenêtre s'affiche correctement
- [ ] L'interface se charge
- [ ] Les boutons fonctionnent

## 🆘 Si le problème persiste

Ouvre les DevTools (F12) dans l'application et vérifie la console pour les erreurs.
