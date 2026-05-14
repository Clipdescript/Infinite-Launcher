
import { app, BrowserWindow, ipcMain, Menu, MenuItemConstructorOptions, protocol, net, shell } from 'electron';
import pkg from 'electron-updater';
const { autoUpdater } = pkg;
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import * as msmc from 'msmc';
import { GameManager } from './GameManager.js';

// ESM compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Lazy loading du gestionnaire de jeu pour démarrage plus rapide
let gameManager: GameManager | null = null;
const getGameManager = () => {
  if (!gameManager) {
    gameManager = new GameManager();
  }
  return gameManager;
};

// Variables globales pour stocker la session
let authManager = new msmc.Auth("select_account");
let userProfile: any = null;

// Cache pour les versions Minecraft (évite les requêtes répétées)
let versionsCache: any[] | null = null;
let versionsCacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Cache pour les modpacks
let modpacksCache: { [key: string]: any } | null = null;
let modpacksCacheTime = 0;

// Fonction helper pour déterminer le mode
function isDevMode(): boolean {
    return process.env.NODE_ENV === 'development' || !app.isPackaged;
}

function createMenu(win: BrowserWindow) {
    const isMac = process.platform === 'darwin';
    
    const template: MenuItemConstructorOptions[] = [
        // { role: 'appMenu' }
        ...(isMac ? [{
            label: app.name,
            submenu: [
                { role: 'about' },
                { type: 'separator' },
                { role: 'services' },
                { type: 'separator' },
                { role: 'hide' },
                { role: 'hideOthers' },
                { role: 'unhide' },
                { type: 'separator' },
                { role: 'quit' }
            ]
        }] as MenuItemConstructorOptions[] : []),
        // { role: 'fileMenu' }
        {
            label: 'Fichier',
            submenu: [
                isMac ? { role: 'close' } : { role: 'quit', label: 'Quitter' }
            ]
        },
        // { role: 'viewMenu' }
        {
            label: 'Affichage',
            submenu: [
                { role: 'reload', label: 'Actualiser' },
                { role: 'forceReload', label: 'Forcer l\'actualisation' },
                { role: 'toggleDevTools', label: 'Outils de développement' },
                { type: 'separator' },
                { role: 'resetZoom', label: 'Zoom par défaut' },
                { role: 'zoomIn', label: 'Zoom avant' },
                { role: 'zoomOut', label: 'Zoom arrière' },
                { type: 'separator' },
                { role: 'togglefullscreen', label: 'Plein écran' }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

function createWindow() {
    const preloadPath = join(__dirname, 'preload.cjs');
    
    console.log('Preload path:', preloadPath);
    console.log('Preload exists:', existsSync(preloadPath));
    
    const win = new BrowserWindow({
        width: 1000,
        height: 700,
        minWidth: 900,
        minHeight: 600,
        icon: join(__dirname, '../Infinite.ico'),
        frame: false,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: false,
            preload: preloadPath,
            v8CacheOptions: 'code',
            backgroundThrottling: false,
            webSecurity: true,
            allowRunningInsecureContent: false,
            experimentalFeatures: false
        },
        autoHideMenuBar: true,
        resizable: true,
        backgroundColor: '#1a1a1a',
        show: true
    });

    // Optimisation: afficher immédiatement
    win.show();
    
    // Intercepter les liens externes et les ouvrir dans le navigateur par défaut
    win.webContents.setWindowOpenHandler(({ url }) => {
        // Ouvrir tous les liens externes dans le navigateur par défaut
        if (url.startsWith('http://') || url.startsWith('https://')) {
            shell.openExternal(url);
        }
        return { action: 'deny' }; // Empêcher l'ouverture dans une nouvelle fenêtre Electron
    });

    // Intercepter les clics sur les liens dans la fenêtre principale
    win.webContents.on('will-navigate', (event, url) => {
        // Si c'est un lien externe, l'ouvrir dans le navigateur
        if (url.startsWith('http://') || url.startsWith('https://')) {
            event.preventDefault();
            shell.openExternal(url);
        }
    });
    
    if (isDevMode()) {
        win.loadURL('http://localhost:5173');
    } else {
        // En production, charger depuis dist
        const indexPath = join(__dirname, '../dist/index.html');
        
        win.loadFile(indexPath).catch(err => {
            console.error('Failed to load index.html:', err);
        });
    }

    // Afficher la fenêtre après un délai si ready-to-show ne se déclenche pas
    setTimeout(() => {
        if (!win.isVisible()) {
            console.log('Forçage de l\'affichage de la fenêtre');
            win.show();
        }
    }, 3000);

    // Gestion des erreurs de chargement
    win.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
        console.error('Échec du chargement:', errorCode, errorDescription);
        if (isDevMode()) {
            console.log("Le serveur Vite n'est pas prêt, rechargement...");
            setTimeout(() => win.loadURL('http://localhost:5173'), 1000);
        } else {
            // En production, forcer l'affichage même en cas d'erreur
            win.show();
        }
    });

    // Configuration de l'auto-updater
    if (!isDevMode()) {
        // Configuration de l'auto-updater
        autoUpdater.autoDownload = true; // Télécharger automatiquement
        autoUpdater.autoInstallOnAppQuit = true; // Installer à la fermeture
        autoUpdater.allowPrerelease = false; // Pas de versions beta
        
        // Logs pour debug
        autoUpdater.on('checking-for-update', () => {
            console.log('🔍 Vérification des mises à jour...');
        });

        autoUpdater.on('update-not-available', () => {
            console.log('✅ Application à jour');
        });

        autoUpdater.on('error', (err) => {
            console.error('❌ Erreur de mise à jour:', err);
            win.webContents.send('update-error', { error: err.message });
        });
        
        // Vérifier au démarrage
        autoUpdater.checkForUpdatesAndNotify();
        
        // Vérifier toutes les 4 heures
        setInterval(() => {
            console.log('🔄 Vérification périodique des mises à jour...');
            autoUpdater.checkForUpdatesAndNotify();
        }, 4 * 60 * 60 * 1000);
    } else {
        console.log('🔧 Mode développement - Mises à jour désactivées');
    }

    autoUpdater.on('update-available', () => {
        console.log('📥 Mise à jour disponible - Téléchargement en cours...');
        win.webContents.send('update-status', { status: 'available' });
    });

    autoUpdater.on('download-progress', (progressObj) => {
        const percent = Math.round(progressObj.percent);
        console.log(`⬇️ Téléchargement: ${percent}% (${Math.round(progressObj.transferred / 1024 / 1024)}MB / ${Math.round(progressObj.total / 1024 / 1024)}MB)`);
        win.webContents.send('update-progress', { 
            percent: progressObj.percent,
            transferred: progressObj.transferred,
            total: progressObj.total
        });
    });

    autoUpdater.on('update-downloaded', () => {
        console.log('✅ Mise à jour téléchargée - Redémarrage à la fermeture');
        win.webContents.send('update-status', { status: 'downloaded' });
    });

    // Gestionnaire pour redémarrer l'application après mise à jour
    ipcMain.handle('restart-app', () => {
        autoUpdater.quitAndInstall();
    });

    // Gestionnaires pour les contrôles de fenêtre
    ipcMain.handle('window-minimize', () => {
        win.minimize();
    });

    ipcMain.handle('window-maximize', () => {
        if (win.isMaximized()) {
            win.unmaximize();
        } else {
            win.maximize();
        }
    });

    ipcMain.handle('window-close', () => {
        win.close();
    });

    return win;
}

app.whenReady().then(() => {
    const win = createWindow();
    createMenu(win);

    // Gestionnaire pour récupérer les versions avec cache intelligent
    ipcMain.handle('get-versions', async () => {
        try {
            const now = Date.now();
            
            // Utiliser le cache si disponible et valide
            if (versionsCache && (now - versionsCacheTime) < CACHE_DURATION) {
                return versionsCache;
            }

            const response = await fetch('https://piston-meta.mojang.com/mc/game/version_manifest_v2.json');
            const data: any = await response.json();
            
            const releases = data.versions.filter((v: any) => {
                if (v.type !== 'release') return false;
                if (!v.id.startsWith('1.')) return false;
                if (v.id.includes('w') || v.id.includes('-')) return false;
                return true;
            });
            
            // Mettre en cache
            versionsCache = releases;
            versionsCacheTime = now;
            
            return releases;
        } catch (error) {
            console.error('Erreur récupération versions:', error);
            // Retourner le cache même expiré en cas d'erreur
            return versionsCache || [];
        }
    });

    // Gestionnaire pour récupérer les modpacks avec cache
    ipcMain.handle('get-modpacks', async (event, offset = 0, limit = 100) => {
        try {
            const now = Date.now();
            const cacheKey = `${offset}-${limit}`;
            
            // Vérifier le cache pour cette page spécifique
            if (modpacksCache && modpacksCache[cacheKey] && (now - modpacksCacheTime) < CACHE_DURATION) {
                return modpacksCache[cacheKey];
            }

            const headers = {
                'User-Agent': 'Infinite-Launcher/2.0 (contact@example.com)'
            };
            
            const facets = encodeURIComponent('[["project_type:modpack"]]');
            const url = `https://api.modrinth.com/v2/search?facets=${facets}&sort=downloads&limit=${limit}&offset=${offset}`;
            
            const response = await fetch(url, { headers });
            
            if (!response.ok) {
                console.error(`Erreur HTTP Modrinth: ${response.status}`);
                return { hits: modpacksCache?.[cacheKey]?.hits || [], total: 0 };
            }
            
            const data: any = await response.json();
            const result = {
                hits: data.hits || [],
                total: data.total_hits || 0,
                offset: offset,
                limit: limit
            };
            
            // Initialiser le cache si nécessaire
            if (!modpacksCache) {
                modpacksCache = {};
            }
            
            modpacksCache[cacheKey] = result;
            modpacksCacheTime = now;
            
            return result;
        } catch (error) {
            console.error('Erreur récupération modpacks:', error);
            return { hits: [], total: 0, offset: 0, limit: limit };
        }
    });

    // Gestion de la connexion Microsoft
    ipcMain.handle('login-microsoft', async () => {
        try {
            const xboxManager = await authManager.launch("electron");
            const token = await xboxManager.getMinecraft();
            
            if (!token || !token.profile || !token.mcToken) {
                throw new Error("Connexion réussie mais aucune licence Minecraft Java trouvée sur ce compte.");
            }
            
            userProfile = {
                name: token.profile.name,
                uuid: token.profile.id,
                accessToken: token.mcToken
            };
            
            return { success: true, profile: userProfile };
        } catch (error: any) {
            console.error("Erreur de connexion Microsoft:", error);
            let message = error.message || "Erreur inconnue";
            if (message.includes("cancelled") || message.includes("closed")) {
                message = "Connexion annulée par l'utilisateur.";
            } else if (message.includes("network")) {
                message = "Erreur réseau. Vérifiez votre connexion internet.";
            }
            return { success: false, error: message };
        }
    });

    ipcMain.handle('launch-game', async (event, options) => {
        try {
            console.log(`Lancement de la version ${options.version} pour ${options.username}...`);
            
            if (userProfile && userProfile.name === options.username && userProfile.accessToken) {
                options.uuid = userProfile.uuid;
                options.accessToken = userProfile.accessToken;
            }

            const callbacks = {
                onProgress: (percent: number, task: string) => {
                    win.webContents.send('progress', { current: percent, total: 100, task: task });
                },
                onLog: (message: string) => {
                    win.webContents.send('log', message);
                },
                onError: (error: string) => {
                    win.webContents.send('log', `[ERREUR] ${error}`);
                    win.webContents.send('error', error);
                }
            };

            // Lazy loading du GameManager
            const manager = getGameManager();
            manager.launch(options, callbacks).catch(err => {
                console.error("Erreur fatale lors du lancement:", err);
                callbacks.onError(err.message || err);
            });
            
            return { success: true };

        } catch (error: any) {
            console.error('Erreur lancement:', error);
            return { success: false, error: error.message };
        }
    });

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        // Nettoyage du cache avant de quitter
        versionsCache = null;
        modpacksCache = null;
        gameManager = null;
        app.quit();
    }
});
