import type { ILauncherOptions } from 'minecraft-launcher-core';
import { createRequire } from 'module';
import { app } from 'electron';
import { join } from 'path';
import { existsSync, mkdirSync, readdirSync, unlinkSync, rmSync, renameSync, writeFileSync } from 'fs';
import { platform } from 'os';
import AdmZip from 'adm-zip';

const require = createRequire(import.meta.url);
const { Client, Authenticator } = require('minecraft-launcher-core') as typeof import('minecraft-launcher-core');

// Interface pour les callbacks de progression
export interface ProgressCallbacks {
    onProgress: (percent: number, task: string) => void;
    onLog: (message: string) => void;
    onError: (error: string) => void;
}

// Cache pour les métadonnées des mods
const modMetadataCache = new Map<string, { url: string; timestamp: number }>();
const METADATA_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

export class GameManager {
    private launcher: InstanceType<typeof Client>;
    private gameDir: string;
    private runtimeDir: string;

    constructor() {
        this.launcher = new Client();
        this.gameDir = join(app.getPath('userData'), 'minecraft_game');
        this.runtimeDir = join(app.getPath('userData'), 'runtime');
        
        if (!existsSync(this.gameDir)) {
            mkdirSync(this.gameDir, { recursive: true });
        }
        if (!existsSync(this.runtimeDir)) {
            mkdirSync(this.runtimeDir, { recursive: true });
        }
    }

    async ensureJava(mcVersion: string, callbacks: ProgressCallbacks): Promise<string> {
        let javaVersion = 8;
        const v = parseFloat(mcVersion.replace(/\./g, '').substring(0, 3));
        
        if (mcVersion.startsWith("1.21") || mcVersion.startsWith("1.20.5") || mcVersion.startsWith("1.20.6")) {
            javaVersion = 21;
        } else if (v >= 118) {
            javaVersion = 17;
        } else if (v >= 117) {
            javaVersion = 17;
        } else {
            javaVersion = 8;
        }

        callbacks.onLog(`Version Minecraft ${mcVersion} détectée. Java requis : ${javaVersion}`);

        const javaPath = this.findEmbeddedJava(javaVersion);
        if (javaPath) {
            callbacks.onLog(`Java ${javaVersion} trouvé: ${javaPath}`);
            return javaPath;
        }

        callbacks.onLog(`Java ${javaVersion} manquant. Téléchargement...`);
        return await this.downloadJava(javaVersion, callbacks);
    }

    private findEmbeddedJava(version: number): string | null {
        const javaExec = platform() === 'win32' ? 'java.exe' : 'java';
        const specificPath = join(this.runtimeDir, `java-${version}`, 'bin', javaExec);
        if (existsSync(specificPath)) return specificPath;
        
        const entries = readdirSync(this.runtimeDir);
        for (const entry of entries) {
            if (entry.includes(version.toString()) && (entry.includes('jdk') || entry.includes('jre') || entry.includes('java'))) {
                const potentialPath = join(this.runtimeDir, entry, 'bin', javaExec);
                if (existsSync(potentialPath)) return potentialPath;
            }
        }
        return null;
    }

    private async downloadJava(version: number, callbacks: ProgressCallbacks): Promise<string> {
        const osType = platform() === 'win32' ? 'windows' : platform() === 'darwin' ? 'mac' : 'linux';
        const url = `https://api.adoptium.net/v3/binary/latest/${version}/ga/${osType}/x64/jdk/hotspot/normal/eclipse?project=jdk`;

        const zipPath = join(this.runtimeDir, `java-${version}.zip`);
        const extractPath = join(this.runtimeDir, `java-${version}`);
        const tempExtractDir = join(this.runtimeDir, `temp-${version}`);
        
        callbacks.onProgress(0, `Téléchargement de Java ${version}...`);
        
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Erreur téléchargement Java ${version}: ${response.statusText}`);
        const zipBuffer = Buffer.from(await response.arrayBuffer());
        writeFileSync(zipPath, zipBuffer);
        callbacks.onLog(`Java ${version} téléchargé, extraction en cours...`);
        callbacks.onProgress(70, `Extraction de Java ${version}...`);
        
        try {
            if (existsSync(tempExtractDir)) {
                rmSync(tempExtractDir, { recursive: true, force: true });
            }
            const zip = new AdmZip(zipPath);
            zip.extractAllTo(tempExtractDir, true);

            const extractedFolder = readdirSync(tempExtractDir)[0];
            if (!extractedFolder) {
                throw new Error(`Archive Java ${version} invalide ou vide`);
            }
            const source = join(tempExtractDir, extractedFolder);
            
            if (existsSync(extractPath)) {
                rmSync(extractPath, { recursive: true, force: true });
            }
            renameSync(source, extractPath);
            
            const javaPath = join(extractPath, 'bin', platform() === 'win32' ? 'java.exe' : 'java');
            callbacks.onProgress(100, `Java ${version} prêt`);
            return javaPath;
        } finally {
            if (existsSync(zipPath)) {
                unlinkSync(zipPath);
            }
            if (existsSync(tempExtractDir)) {
                rmSync(tempExtractDir, { recursive: true, force: true });
            }
        }
    }

    // Fonction optimisée avec cache pour récupérer la dernière version d'un mod
    private async getModVersion(modId: string, mcVersion: string, loader: string = 'fabric'): Promise<string | null> {
        try {
            const cacheKey = `${modId}-${mcVersion}-${loader}`;
            const cached = modMetadataCache.get(cacheKey);
            
            // Utiliser le cache si valide
            if (cached && (Date.now() - cached.timestamp) < METADATA_CACHE_DURATION) {
                return cached.url;
            }

            const url = `https://api.modrinth.com/v2/project/${modId}/version?loaders=["${loader}"]&game_versions=["${mcVersion}"]`;
            const response = await fetch(url);
            if (!response.ok) return null;
            
            const versions: any = await response.json();
            if (versions.length > 0) {
                const downloadUrl = versions[0].files[0].url;
                modMetadataCache.set(cacheKey, { url: downloadUrl, timestamp: Date.now() });
                return downloadUrl;
            }
            return null;
        } catch (e) {
            console.error(`Erreur récup mod ${modId}:`, e);
            return null;
        }
    }

    private async installOptimizedMods(mcVersion: string, callbacks: ProgressCallbacks) {
        const modsDir = join(this.gameDir, 'mods');
        if (!existsSync(modsDir)) {
            mkdirSync(modsDir, { recursive: true });
        }

        const mods = [
            { id: 'P7dR8mSH', name: 'Fabric API' },
            { id: 'AANobbMI', name: 'Sodium' },
            { id: '3P5GcnTA', name: 'Iris' },
            { id: 'hvFnDODi', name: 'Lithium' }
        ];

        callbacks.onLog("Vérification des mods d'optimisation...");

        // Téléchargement parallèle des mods pour performance
        const downloadPromises = mods.map(async (mod) => {
            try {
                const existingFiles = readdirSync(modsDir);
                const alreadyInstalled = existingFiles.some(f => 
                    f.toLowerCase().includes(mod.name.toLowerCase().replace(' ', '-')) && f.endsWith('.jar')
                );
                
                if (alreadyInstalled) {
                    callbacks.onLog(`${mod.name} déjà présent.`);
                    return;
                }

                callbacks.onProgress(0, `Recherche de ${mod.name}...`);
                const downloadUrl = await this.getModVersion(mod.id, mcVersion);
                
                if (downloadUrl) {
                    const fileName = downloadUrl.split('/').pop() || `${mod.name}.jar`;
                    const destPath = join(modsDir, fileName);
                    
                    callbacks.onLog(`Téléchargement de ${mod.name}...`);
                    
                    const response = await fetch(downloadUrl);
                    if (!response.ok) throw new Error(`Erreur HTTP ${response.status}`);
                    
                    const arrayBuffer = await response.arrayBuffer();
                    writeFileSync(destPath, Buffer.from(arrayBuffer));
                    callbacks.onLog(`${mod.name} installé.`);
                } else {
                    callbacks.onLog(`Aucune version compatible de ${mod.name} trouvée pour ${mcVersion}`);
                }
            } catch (e: any) {
                callbacks.onLog(`Erreur install ${mod.name}: ${e.message}`);
            }
        });

        await Promise.all(downloadPromises);
    }

    private async installFabric(mcVersion: string, callbacks: ProgressCallbacks): Promise<string> {
        callbacks.onLog("Vérification de Fabric Loader...");
        
        const loaderUrl = 'https://meta.fabricmc.net/v2/versions/loader';
        const loaderResp = await fetch(loaderUrl);
        if (!loaderResp.ok) throw new Error("Impossible de récupérer les versions Fabric");
        const loaders: any = await loaderResp.json();
        const latestLoader = loaders[0].version;
        
        const fabricVersionName = `fabric-loader-${latestLoader}-${mcVersion}`;
        const versionDir = join(this.gameDir, 'versions', fabricVersionName);
        const versionJsonPath = join(versionDir, `${fabricVersionName}.json`);

        if (existsSync(versionJsonPath)) {
            callbacks.onLog(`Fabric ${latestLoader} déjà installé.`);
            return fabricVersionName;
        }

        callbacks.onProgress(0, "Installation du profil Fabric...");
        const profileUrl = `https://meta.fabricmc.net/v2/versions/loader/${mcVersion}/${latestLoader}/profile/json`;
        const profileResp = await fetch(profileUrl);
        if (!profileResp.ok) throw new Error("Impossible de télécharger le profil Fabric");
        
        const profileJson = await profileResp.json();
        
        if (!existsSync(versionDir)) mkdirSync(versionDir, { recursive: true });
        writeFileSync(versionJsonPath, JSON.stringify(profileJson, null, 2));
        
        callbacks.onLog(`Profil Fabric installé : ${fabricVersionName}`);
        return fabricVersionName;
    }

    private async installForge(mcVersion: string, callbacks: ProgressCallbacks): Promise<string> {
        const forgeDir = join(this.gameDir, 'forge');
        if (!existsSync(forgeDir)) mkdirSync(forgeDir, { recursive: true });

        const installerPath = join(forgeDir, `forge-${mcVersion}-installer.jar`);

        if (existsSync(installerPath)) {
             callbacks.onLog(`Installateur Forge pour ${mcVersion} trouvé.`);
             return installerPath;
        }

        callbacks.onProgress(0, "Recherche de Forge...");
        
        try {
            const promoUrl = 'https://files.minecraftforge.net/net/minecraftforge/forge/promotions_slim.json';
            const promoResp = await fetch(promoUrl);
            if (!promoResp.ok) throw new Error("Impossible de récupérer les versions Forge");
            
            const promos: any = await promoResp.json();
            const promoKey = promos.promos[`${mcVersion}-recommended`] ? `${mcVersion}-recommended` : `${mcVersion}-latest`;
            const forgeVersion = promos.promos[promoKey];
            
            if (!forgeVersion) throw new Error(`Aucune version de Forge trouvée pour ${mcVersion}`);
            
            const fullVersion = `${mcVersion}-${forgeVersion}`;
            const downloadUrl = `https://maven.minecraftforge.net/net/minecraftforge/forge/${fullVersion}/forge-${fullVersion}-installer.jar`;
            
            callbacks.onLog(`Téléchargement de Forge ${fullVersion}...`);
            
            const response = await fetch(downloadUrl);
            if (!response.ok) throw new Error(`Erreur téléchargement Forge: ${response.status}`);
            
            const arrayBuffer = await response.arrayBuffer();
            writeFileSync(installerPath, Buffer.from(arrayBuffer));
            
            callbacks.onLog(`Forge ${fullVersion} téléchargé.`);
            return installerPath;
            
        } catch (e: any) {
             throw new Error(`Erreur installation Forge: ${e.message}`);
        }
    }

    async launch(options: any, callbacks: ProgressCallbacks) {
        try {
            callbacks.onLog("Initialisation du lancement...");
            
            // 1. Préparer Java
            const javaPath = await this.ensureJava(options.version, callbacks);
            
            // 2. Configuration du lancement
            
            // Gestion de l'authentification (Offline ou Microsoft)
            let authorization;
            if (options.accessToken && options.uuid) {
                // Mode connecté
                authorization = {
                    access_token: options.accessToken,
                    client_token: options.clientToken,
                    uuid: options.uuid,
                    name: options.username,
                    user_properties: {} as any,
                    meta: {} as any
                };
            } else {
                // Mode offline (Crack)
                callbacks.onLog("Mode hors-ligne détecté. Utilisation d'un profil local.");
                authorization = Authenticator.getAuth(options.username);
            }

            // Aikar's Flags (Optimisation GC et performances)
            const jvmArgs = [
                "-XX:+UseG1GC",
                "-XX:+ParallelRefProcEnabled",
                "-XX:MaxGCPauseMillis=200",
                "-XX:+UnlockExperimentalVMOptions",
                "-XX:+DisableExplicitGC",
                "-XX:+AlwaysPreTouch",
                "-XX:G1NewSizePercent=30",
                "-XX:G1MaxNewSizePercent=40",
                "-XX:G1HeapRegionSize=8M",
                "-XX:G1ReservePercent=20",
                "-XX:G1HeapWastePercent=5",
                "-XX:G1MixedGCCountTarget=4",
                "-XX:InitiatingHeapOccupancyPercent=15",
                "-XX:G1MixedGCLiveThresholdPercent=90",
                "-XX:G1RSetUpdatingPauseTimePercent=5",
                "-XX:SurvivorRatio=32",
                "-XX:+PerfDisableSharedMem",
                "-XX:MaxTenuringThreshold=1",
                "-Dusing.aikars.flags=https://mcflags.emc.gs",
                "-Daikars.new.flags=true"
            ];

            // Préparation des options de base
            const opts: ILauncherOptions = {
                clientPackage: undefined, 
                authorization: authorization,
                root: this.gameDir,
                version: {
                    number: options.version,
                    type: "release"
                },
                memory: {
                    max: options.maxMem || "2G",
                    min: "1G"
                },
                javaPath: javaPath,
                customArgs: jvmArgs, // Ajout des flags d'optimisation
                overrides: {
                    detached: false
                }
            };

            // LOGIQUE VANILLA OPTIMISÉ (Fabric + Sodium + Iris)
            if (options.loader === 'vanilla' || options.loader === 'fabric') {
                callbacks.onLog("Mode Optimisé activé (Fabric + Sodium + Iris)");
                
                // 1. Installer les mods
                await this.installOptimizedMods(options.version, callbacks);
                
                // 2. Installer et configurer Fabric Loader
                try {
                    const fabricVersionName = await this.installFabric(options.version, callbacks);
                    
                    // IMPORTANT : On dit à MCLC d'utiliser cette version CUSTOM qu'on vient de créer
                    opts.version.number = options.version; // La version de base reste la version MC (ex: 1.20.1)
                    opts.version.custom = fabricVersionName; // Mais on charge le JSON custom (ex: fabric-loader-...)
                    
                } catch (e: any) {
                    callbacks.onLog(`Erreur installation Fabric: ${e.message}. Retour au Vanilla.`);
                }
            }

            // Gestion Forge
            if (options.loader === 'forge') {
                try {
                    callbacks.onLog("Installation de Forge...");
                    const forgeInstallerPath = await this.installForge(options.version, callbacks);
                    opts.forge = forgeInstallerPath;
                    callbacks.onLog(`Forge configuré avec l'installateur : ${forgeInstallerPath}`);
                } catch (e: any) {
                     callbacks.onError(`Impossible d'installer Forge: ${e.message}`);
                     return;
                }
            }

            callbacks.onLog(`Lancement de ${opts.version.custom || opts.version.number} avec Java à ${javaPath}`);
            
            this.launcher.launch(opts);

            this.launcher.on('debug', (e) => callbacks.onLog(`[DEBUG] ${e}`));
            this.launcher.on('data', (e) => callbacks.onLog(`[GAME] ${e}`));
            this.launcher.on('progress', (e) => {
                callbacks.onProgress(e.task / e.total * 100, `Chargement: ${e.type}`);
                callbacks.onLog(`[PROGRESS] ${e.type} - ${e.task}/${e.total}`);
            });
            this.launcher.on('download-status', (e) => {
                 // Calcul de la progression en MB
                 const currentMB = (e.current / 1024 / 1024).toFixed(1);
                 const totalMB = (e.total / 1024 / 1024).toFixed(1);
                 // Progression globale du téléchargement
                 const percent = Math.round((e.current / e.total) * 100);
                 
                 callbacks.onProgress(percent, `Téléchargement ${e.name}: ${currentMB}/${totalMB} MB`);
                 // On évite de spammer les logs
                 if (percent % 10 === 0) {
                     callbacks.onLog(`[DOWNLOAD] ${e.name} (${currentMB}/${totalMB} MB)`);
                 }
            });
            
        } catch (error: any) {
            callbacks.onError(error.message || error);
        }
    }
}
