const { contextBridge, ipcRenderer } = require('electron');

// Validation des inputs pour sécurité IPC
const validateLaunchOptions = (options) => {
    if (!options || typeof options !== 'object') return false;
    if (typeof options.username !== 'string' || options.username.length < 1 || options.username.length > 16) return false;
    
    // Validation modpack mode (ne nécessite pas version)
    if (options.modpack) {
        if (typeof options.modpack !== 'string' || options.modpack.length > 100) return false;
    } else {
        // Mode normal: version requise
        if (typeof options.version !== 'string' || options.version.length > 50) return false;
        // Loader optionnel mais validé si présent
        if (options.loader && !['vanilla', 'fabric', 'forge'].includes(options.loader)) return false;
    }
    
    // Validation mémoire si présente
    if (options.minMem && !/^\d+[MG]$/i.test(options.minMem)) return false;
    if (options.maxMem && !/^\d+[MG]$/i.test(options.maxMem)) return false;
    
    return true;
};

// API sécurisée exposée au renderer
const api = {
    launchGame: (options) => {
        if (!validateLaunchOptions(options)) {
            return Promise.reject(new Error('Options de lancement invalides'));
        }
        return ipcRenderer.invoke('launch-game', options);
    },
    
    getVersions: () => ipcRenderer.invoke('get-versions'),
    
    getModpacks: (offset, limit) => ipcRenderer.invoke('get-modpacks', offset, limit),
    
    loginMicrosoft: () => ipcRenderer.invoke('login-microsoft'),
    
    // Listeners avec nettoyage automatique
    onLog: (callback) => {
        const listener = (_event, data) => callback(data);
        ipcRenderer.on('log', listener);
        return () => ipcRenderer.removeListener('log', listener);
    },
    
    onProgress: (callback) => {
        const listener = (_event, data) => callback(data);
        ipcRenderer.on('progress', listener);
        return () => ipcRenderer.removeListener('progress', listener);
    },
    
    onUpdateStatus: (callback) => {
        const listener = (_event, data) => callback(data);
        ipcRenderer.on('update-status', listener);
        return () => ipcRenderer.removeListener('update-status', listener);
    },
    
    onUpdateProgress: (callback) => {
        const listener = (_event, data) => callback(data);
        ipcRenderer.on('update-progress', listener);
        return () => ipcRenderer.removeListener('update-progress', listener);
    },
    
    restartApp: () => ipcRenderer.invoke('restart-app'),
    
    // Authentification Google via navigateur système
    signInWithGoogle: () => ipcRenderer.invoke('sign-in-with-google'),
    
    // Contrôles de fenêtre
    windowMinimize: () => ipcRenderer.invoke('window-minimize'),
    windowMaximize: () => ipcRenderer.invoke('window-maximize'),
    windowClose: () => ipcRenderer.invoke('window-close')
};

// Type-safe API exposure
contextBridge.exposeInMainWorld('api', api);
console.log('Preload script loaded successfully, API exposed:', Object.keys(api));
