import React, { useState, useEffect } from 'react';
import './styles/index.css';
import logoIcon from '../Infinite.ico';
import packageJson from '../package.json';
import { authService } from './firebase';
import ModpacksPage from './components/ModpacksPage';
import AuthPage from './components/AuthPage';
import { 
  CubeIcon, 
  ServerIcon, 
  QuestionMarkCircleIcon,
  XMarkIcon,
  ArchiveBoxIcon,
  ArrowDownTrayIcon,
  PlayIcon,
  CogIcon,
  FolderIcon,
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  DocumentPlusIcon,
  StarIcon,
  ArrowPathIcon,
  GlobeAltIcon,
  InformationCircleIcon,
  UserIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  LifebuoyIcon,
  ClipboardIcon,
  DocumentDuplicateIcon,
  SpeakerWaveIcon,
  PauseIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';

// Types pour l'API exposée par preload.js
interface ModpacksResult {
  hits: any[];
  total: number;
  offset: number;
  limit: number;
}

// Pas besoin de déclarer le type ici, utilise celui de electron.d.ts

const App: React.FC = () => {
  const [username, setUsername] = useState('Steve');
  const [versions, setVersions] = useState<any[]>([]);
  const [selectedVersion, setSelectedVersion] = useState('');
  const [loader, setLoader] = useState<'vanilla'>('vanilla');
  const [minMem, setMinMem] = useState('1G');
  const [maxMem, setMaxMem] = useState('4G');
  
  const [modpacks, setModpacks] = useState<any[]>([]);
  const [showModpacks, setShowModpacks] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // États pour le chargement par lots de 50
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentOffset, setCurrentOffset] = useState(0);
  const [totalModpacks, setTotalModpacks] = useState(0);
  const ITEMS_PER_PAGE = 50; // Toujours 50 par chargement
  
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [isLaunching, setIsLaunching] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const appVersion = packageJson.version || '0.0.0';
  const publisherName = 'Infinite Launcher Communauté';
  const [userProfile, setUserProfile] = useState<any>(null);
  
  // États pour l'authentification Firebase
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // États pour la mise à jour
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateDownloaded, setUpdateDownloaded] = useState(false);
  const [updateProgress, setUpdateProgress] = useState(0);

  // États pour les articles du wiki
  const [latestArticle, setLatestArticle] = useState<any>(null);
  const [loadingArticle, setLoadingArticle] = useState(true);

  // États pour le feedback Discord
  const [discordCopying, setDiscordCopying] = useState(false);
  const [discordCopied, setDiscordCopied] = useState(false);

  // États pour le feedback copie actualité
  const [newsCopied, setNewsCopied] = useState(false);

  // État pour la lecture audio
  const [isReading, setIsReading] = useState(false);

  // Fonction de traduction via Google Translate API gratuite - SUPPRIMÉE

  useEffect(() => {
    // Vérification de sécurité pour éviter le crash si l'API n'est pas chargée
    if (!window.api) {
        console.error("L'API Electron n'est pas disponible !");
        return;
    }

    // Chargement initial des versions
    window.api.getVersions().then((vers) => {
      setVersions(vers);
      if (vers.length > 0) setSelectedVersion(vers[0].id);
    }).catch(err => console.error("Erreur chargement versions:", err));

    // Listeners avec cleanup pour éviter les fuites mémoire
    const removeProgressListener = window.api.onProgress((data) => {
      setProgress(data.current);
      setStatus(data.task || 'En cours...');
    });

    const removeLogListener = window.api.onLog((msg) => {
      console.log(msg);
      setLogs(prev => [...prev.slice(-50), msg]);
    });

    // Listeners Mise à jour
    const removeUpdateStatusListener = window.api.onUpdateStatus((data) => {
      if (data.status === 'available') {
        setUpdateAvailable(true);
        setStatus("Mise à jour disponible...");
      } else if (data.status === 'downloaded') {
        setUpdateDownloaded(true);
        setUpdateAvailable(false);
        setStatus("Mise à jour prête !");
        setUpdateProgress(100);
      }
    });

    const removeUpdateProgressListener = window.api.onUpdateProgress((data) => {
      setUpdateAvailable(true);
      setUpdateProgress(Math.round(data.percent));
      setStatus(`Téléchargement màj: ${Math.round(data.percent)}%`);
    });

    // Cleanup des listeners au démontage
    return () => {
      removeProgressListener?.();
      removeLogListener?.();
      removeUpdateStatusListener?.();
      removeUpdateProgressListener?.();
    };

  }, []);

  // Observer les changements d'état d'authentification Firebase
  useEffect(() => {
    const unsubscribe = authService.onAuthChange((user) => {
      setFirebaseUser(user);
      if (user) {
        // Utilisateur connecté, synchroniser les préférences
        console.log('Utilisateur Firebase connecté:', user.email);
      }
    });

    return () => unsubscribe();
  }, []);

  // Charger le dernier article depuis Firebase
  useEffect(() => {
    const loadLatestArticle = async () => {
      try {
        setLoadingArticle(true);
        const article = await authService.getLatestArticle();
        if (article) {
          setLatestArticle(article);
        }
      } catch (error) {
        console.error('Erreur lors du chargement de l\'article:', error);
      } finally {
        setLoadingArticle(false);
      }
    };

    loadLatestArticle();
  }, []);

  const handleRestart = async () => {
    await window.api.restartApp();
  };

  const handleLaunch = async () => {
    if (!username) return alert("Pseudo requis !");
    
    setIsLaunching(true);
    setStatus("Préparation...");
    setProgress(0);

    try {
      await window.api.launchGame({
        username,
        version: selectedVersion,
        loader: 'vanilla' as const,
        maxMem
      });
    } catch (e: any) {
      alert("Erreur: " + e.message);
      setIsLaunching(false);
    }
  };

  const handleMicrosoftLogin = async () => {
    setStatus("Connexion Microsoft...");
    const result = await window.api.loginMicrosoft();
    if (result.success && result.profile) {
      setUserProfile(result.profile);
      setUsername(result.profile.name);
      alert(`Connecté en tant que ${result.profile.name}`);
    } else {
      alert("Erreur connexion: " + result.error);
    }
    setStatus("");
  };

  // Gestion de l'authentification Firebase
  const handleFirebaseAuth = async () => {
    setAuthLoading(true);
    setAuthError('');
    
    try {
      let result;
      if (authMode === 'login') {
        result = await authService.login(authEmail, authPassword);
      } else {
        result = await authService.register(authEmail, authPassword);
      }
      
      if (result.success) {
        setShowAuth(false);
        setAuthEmail('');
        setAuthPassword('');
        alert(authMode === 'login' ? 'Connexion réussie !' : 'Inscription réussie !');
      } else {
        setAuthError(result.error || 'Erreur inconnue');
      }
    } catch (error: any) {
      setAuthError('Erreur technique: ' + error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleFirebaseLogout = async () => {
    const result = await authService.logout();
    if (result.success) {
      setFirebaseUser(null);
      alert('Déconnexion réussie');
    }
  };

  // Connexion avec Google
  const handleGoogleSignIn = async () => {
    setAuthLoading(true);
    setAuthError('');
    
    try {
      const result = await authService.signInWithGoogle();
      
      if (result.success) {
        setShowAuth(false);
        alert('Connexion avec Google réussie !');
      } else {
        setAuthError(result.error || 'Erreur inconnue');
      }
    } catch (error: any) {
      setAuthError('Erreur technique: ' + error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const loadModpacks = async (reset: boolean = false, forceLoad: boolean = false) => {
    // Si on ouvre juste la vue, ne pas recharger si déjà chargé
    if (!reset && !forceLoad && modpacks.length > 0) {
      setShowModpacks(true);
      return;
    }
    
    setShowModpacks(true);
    
    // Si reset, on recharge depuis le début
    if (reset) {
      setModpacks([]);
      setCurrentOffset(0);
      setHasMore(true);
    }
    
    const offset = reset ? 0 : currentOffset;
    
    try {
      setIsLoadingMore(true);
      const result = await window.api.getModpacks(offset, ITEMS_PER_PAGE);
      
      setTotalModpacks(result.total);
      
      if (reset) {
        setModpacks(result.hits);
      } else {
        setModpacks(prev => [...prev, ...result.hits]);
      }
      
      // Vérifier s'il y a encore des modpacks à charger
      const newOffset = offset + ITEMS_PER_PAGE;
      setCurrentOffset(newOffset);
      setHasMore(newOffset < result.total);
      
    } catch (error) {
      console.error('Erreur lors du chargement des modpacks:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const loadMoreModpacks = () => {
    if (!isLoadingMore && hasMore) {
      loadModpacks(false, true);
    }
  };

  const reloadApp = () => {
    window.location.reload();
  };

  const handleDiscordClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Ouvrir le lien Discord dans le navigateur
    window.open('https://discord.gg/PUetupkA', '_blank');
  };

  const handleCopyNews = () => {
    if (!latestArticle) return;
    
    // Créer un élément temporaire pour extraire le texte sans HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = latestArticle.content;
    const textContent = tempDiv.textContent || tempDiv.innerText || '';
    
    // Copier le titre + contenu
    const fullText = `${latestArticle.title}\n${latestArticle.date}\n\n${textContent}`;
    navigator.clipboard.writeText(fullText);
    
    // Animation de feedback
    setNewsCopied(true);
    setTimeout(() => setNewsCopied(false), 2000);
  };

  const handleReadNews = () => {
    if (!latestArticle) return;
    
    // Arrêter la lecture en cours si elle existe
    if (isReading) {
      window.speechSynthesis.cancel();
      setIsReading(false);
      return;
    }
    
    // Créer un élément temporaire pour extraire le texte sans HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = latestArticle.content;
    const textContent = tempDiv.textContent || tempDiv.innerText || '';
    
    // Créer le texte complet à lire
    const fullText = `${latestArticle.title}. ${textContent}`;
    
    // Utiliser l'API Web Speech
    const utterance = new SpeechSynthesisUtterance(fullText);
    utterance.lang = 'fr-FR';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    utterance.onstart = () => setIsReading(true);
    utterance.onend = () => setIsReading(false);
    utterance.onerror = () => setIsReading(false);
    
    window.speechSynthesis.speak(utterance);
  };

  const installModpack = async (pack: any) => {
    if (!confirm(`Installer ${pack.title} ?`)) return;
    
    setShowModpacks(false);
    setIsLaunching(true);
    setStatus(`Installation de ${pack.title}...`);
    
    try {
      await window.api.launchGame({
        username,
        version: selectedVersion,
        loader: 'vanilla' as const,
        maxMem
      });
    } catch (e: any) {
      alert("Erreur: " + e.message);
      setIsLaunching(false);
    }
  };

  return (
    <div className="app-container">
      {/* Custom Title Bar */}
      <div className="custom-titlebar">
        <div className="titlebar-controls-left">
          <button className="titlebar-button macos-close" onClick={() => window.api.windowClose()} title="Fermer">
            <svg width="12" height="12" viewBox="0 0 12 12">
              <circle cx="6" cy="6" r="6" fill="#ff5f57"/>
              <g className="icon-hover">
                <line x1="4" y1="4" x2="8" y2="8" stroke="#4d0000" strokeWidth="1.2" strokeLinecap="round"/>
                <line x1="8" y1="4" x2="4" y2="8" stroke="#4d0000" strokeWidth="1.2" strokeLinecap="round"/>
              </g>
            </svg>
          </button>
          <button className="titlebar-button macos-minimize" onClick={() => window.api.windowMinimize()} title="Réduire">
            <svg width="12" height="12" viewBox="0 0 12 12">
              <circle cx="6" cy="6" r="6" fill="#ffbd2e"/>
              <g className="icon-hover">
                <line x1="3.5" y1="6" x2="8.5" y2="6" stroke="#995700" strokeWidth="1.2" strokeLinecap="round"/>
              </g>
            </svg>
          </button>
          <button className="titlebar-button macos-maximize" onClick={() => window.api.windowMaximize()} title="Agrandir">
            <svg width="12" height="12" viewBox="0 0 12 12">
              <circle cx="6" cy="6" r="6" fill="#28c840"/>
              <g className="icon-hover">
                <polyline points="4,7.5 6,4.5 8,7.5" fill="none" stroke="#006500" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </g>
            </svg>
          </button>
        </div>
        <div className="titlebar-content">
          <span className="app-title-center">Infinite Launcher</span>
          <div className="titlebar-tools">
            {/* Affichage conditionnel selon l'état d'authentification */}
            {firebaseUser ? (
              <>
                <span className="user-email">{firebaseUser.email}</span>
                <button 
                  className="logout-btn" 
                  onClick={handleFirebaseLogout}
                  title="Déconnexion"
                >
                  <ArrowRightOnRectangleIcon className="icon" />
                </button>
              </>
            ) : (
              <button 
                className="auth-btn" 
                onClick={() => setShowAuth(true)}
                title="S'authentifier"
              >
                S'authentifier
              </button>
            )}
            
            <button className="tool-btn" title="Dossier du jeu">
              <FolderIcon className="icon" />
            </button>
            
            <button className="tool-btn" onClick={() => setShowSettings(!showSettings)} title="Réglage">
              <CogIcon className="icon" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="main-content" style={showModpacks || showAuth ? { backgroundImage: 'none', background: 'white' } : {}}>
        {/* Sidebar Left - Navigation */}
        {!showModpacks && !showAuth && (
          <div className="sidebar-left">
            <nav className="nav-menu">
              <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); loadModpacks(true); }} title="Modpacks">
                <CubeIcon className="link-icon" />
                <span>Modpacks</span>
              </a>
              <a href="#" className="nav-link nav-link-external" onClick={(e) => { e.preventDefault(); window.open('https://projet-5774d.web.app', '_blank'); }} title="Site Officiel">
                <GlobeAltIcon className="link-icon" />
                <span>Site Officiel</span>
              </a>
              <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); alert(`Infinite Launcher\nVersion ${appVersion}\n${new Date().toLocaleDateString('fr-FR')}\n${publisherName}`); }} title="À propos">
                <ExclamationCircleIcon className="link-icon" />
                <span>À propos</span>
              </a>
              <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); alert('Mise à jour - Vérification...'); }} title="Mise à jour">
                <ArrowPathIcon className="link-icon" />
                <span>Mise à jour</span>
              </a>
              <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); setShowAuth(true); }} title="Authentification">
                <UserIcon className="link-icon" />
                <span>Authentification</span>
              </a>
              <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); alert('Support & Aide - Discord: https://discord.gg/PUetupkA'); }} title="Support">
                <LifebuoyIcon className="link-icon" />
                <span>Support</span>
              </a>
              <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); alert('Communauté - Partagez vos parties, bugs et vidéos ! (En développement)'); }} title="Communauté">
                <ChatBubbleLeftRightIcon className="link-icon" />
                <span>Communauté</span>
              </a>
              <a href="#" className="nav-link" onClick={handleDiscordClick} title="Discord">
                <svg className="link-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
                <span>Discord</span>
              </a>
            </nav>
            <div className="nav-menu-bottom">
              <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); alert('Réglages avancés - En développement'); }} title="Réglage">
                <CogIcon className="link-icon" />
                <span>Réglage</span>
              </a>
            </div>
          </div>
        )}
        
        {/* Auth Overlay */}
        {showAuth && (
          <AuthPage
            authMode={authMode}
            authEmail={authEmail}
            authPassword={authPassword}
            authError={authError}
            authLoading={authLoading}
            onBack={() => setShowAuth(false)}
            onModeChange={setAuthMode}
            onEmailChange={setAuthEmail}
            onPasswordChange={setAuthPassword}
            onSubmit={handleFirebaseAuth}
            onGoogleSignIn={handleGoogleSignIn}
          />
        )}
        
        {/* Modpacks Overlay */}
        {showModpacks && (
          <ModpacksPage
            modpacks={modpacks}
            isLoadingMore={isLoadingMore}
            hasMore={hasMore}
            totalModpacks={totalModpacks}
            onBack={() => setShowModpacks(false)}
            onInstall={installModpack}
            onLoadMore={loadMoreModpacks}
          />
        )}

        {/* Sidebar Right */}
        <div className="sidebar-right">
        </div>

        {/* Content Area (News) */}
        <div className="content-area">
          {loadingArticle ? (
            <div className="news-block">
              <p>Chargement des actualités...</p>
            </div>
          ) : latestArticle ? (
            <div className="news-block">
              <div className="news-actions">
                <button 
                  className={`read-news-btn ${isReading ? 'reading' : ''}`}
                  onClick={handleReadNews}
                  title={isReading ? "Arrêter la lecture" : "Lire l'actualité"}
                >
                  {isReading ? <PauseIcon className="icon" /> : <SpeakerWaveIcon className="icon" />}
                </button>
                <button 
                  className={`copy-news-btn ${newsCopied ? 'copied' : ''}`}
                  onClick={handleCopyNews}
                  title="Copier l'actualité"
                >
                  {newsCopied ? <CheckCircleIcon className="icon" /> : <DocumentDuplicateIcon className="icon" />}
                </button>
              </div>
              <h3>{latestArticle.title}</h3>
              <span className="release-date">{latestArticle.date}</span>
              <div dangerouslySetInnerHTML={{ __html: latestArticle.content }} />
            </div>
          ) : (
            <div className="news-block">
              <h3>Minecraft 1.21.11 - Mounts of Mayhem</h3>
              <span className="release-date">Date de sortie : 15 janvier 2026</span>
              
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
            </div>
          )}
        </div>
      </main>

      {/* Progress Steps */}
      {(isLaunching || updateAvailable || updateDownloaded) && (
        <div className="progress-steps-container">
          <button className="progress-close-btn" onClick={() => setIsLaunching(false)}>
            <XMarkIcon className="icon" />
          </button>
          <div className={`progress-step ${progress > 5 ? 'completed' : 'active'}`}>
            <span className="step-icon">
              {progress > 5 ? '▪' : (
                <div className="loading-squares">
                  <div className="loading-square"></div>
                  <div className="loading-square"></div>
                  <div className="loading-square"></div>
                  <div className="loading-square"></div>
                </div>
              )}
            </span>
            <span className="step-text">Vérification des fichiers</span>
            {progress <= 5 && progress > 0 && <span className="step-percent">{Math.round(progress)}%</span>}
          </div>
          <div className={`progress-step ${progress > 25 ? 'completed' : progress > 5 ? 'active' : ''}`}>
            <span className="step-icon">
              {progress > 25 ? '▪' : progress > 5 ? (
                <div className="loading-squares">
                  <div className="loading-square"></div>
                  <div className="loading-square"></div>
                  <div className="loading-square"></div>
                  <div className="loading-square"></div>
                </div>
              ) : '▫'}
            </span>
            <span className="step-text">Téléchargement de Java</span>
            {progress > 5 && progress <= 25 && <span className="step-percent">{Math.round(progress)}%</span>}
          </div>
          <div className={`progress-step ${progress > 60 ? 'completed' : progress > 25 ? 'active' : ''}`}>
            <span className="step-icon">
              {progress > 60 ? '▪' : progress > 25 ? (
                <div className="loading-squares">
                  <div className="loading-square"></div>
                  <div className="loading-square"></div>
                  <div className="loading-square"></div>
                  <div className="loading-square"></div>
                </div>
              ) : '▫'}
            </span>
            <span className="step-text">Téléchargement de Minecraft</span>
            {progress > 25 && progress <= 60 && <span className="step-percent">{Math.round(progress)}%</span>}
          </div>
          <div className={`progress-step ${progress > 80 ? 'completed' : progress > 60 ? 'active' : ''}`}>
            <span className="step-icon">
              {progress > 80 ? '▪' : progress > 60 ? (
                <div className="loading-squares">
                  <div className="loading-square"></div>
                  <div className="loading-square"></div>
                  <div className="loading-square"></div>
                  <div className="loading-square"></div>
                </div>
              ) : '▫'}
            </span>
            <span className="step-text">Installation de Fabric</span>
            {progress > 60 && progress <= 80 && <span className="step-percent">{Math.round(progress)}%</span>}
          </div>
          <div className={`progress-step ${progress > 95 ? 'completed' : progress > 80 ? 'active' : ''}`}>
            <span className="step-icon">
              {progress > 95 ? '▪' : progress > 80 ? (
                <div className="loading-squares">
                  <div className="loading-square"></div>
                  <div className="loading-square"></div>
                  <div className="loading-square"></div>
                  <div className="loading-square"></div>
                </div>
              ) : '▫'}
            </span>
            <span className="step-text">Installation des mods d'optimisation</span>
            {progress > 80 && progress <= 95 && <span className="step-percent">{Math.round(progress)}%</span>}
          </div>
          <div className={`progress-step ${progress >= 100 ? 'success' : progress > 95 ? 'active' : ''}`}>
            <span className="step-icon">
              {progress >= 100 ? '▪' : progress > 95 ? (
                <div className="loading-squares">
                  <div className="loading-square"></div>
                  <div className="loading-square"></div>
                  <div className="loading-square"></div>
                  <div className="loading-square"></div>
                </div>
              ) : '▫'}
            </span>
            <span className="step-text">{progress >= 100 ? 'Jeu lancé avec succès !' : 'Démarrage du jeu...'}</span>
            {progress > 95 && progress < 100 && <span className="step-percent">{Math.round(progress)}%</span>}
            {progress >= 100 && <span className="step-percent">100%</span>}
          </div>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div className="settings-popup">
          <div className="setting-group">
            <label>Mémoire RAM (Min/Max)</label>
            <div className="row">
              <input value={minMem} onChange={e => setMinMem(e.target.value)} placeholder="1G" />
              <input value={maxMem} onChange={e => setMaxMem(e.target.value)} placeholder="4G" />
            </div>
          </div>
        </div>
      )}

      {/* Bottom Bar */}
      <footer className="bottom-bar">
        <div className="version-group">
          <select value={selectedVersion} onChange={e => setSelectedVersion(e.target.value)} className="version-select">
            {versions.length === 0 && <option>Dernière version 1.21.5</option>}
            {versions.map(v => <option key={v.id} value={v.id}>{v.id}</option>)}
          </select>
        </div>

        <button 
          className="play-btn" 
          onClick={updateDownloaded ? handleRestart : handleLaunch}
          disabled={isLaunching || updateAvailable}
          style={updateDownloaded ? { backgroundColor: '#e74c3c' } : {}}
        >
          {isLaunching ? 'LANCEMENT...' : 
           updateAvailable ? 'TÉLÉCHARGEMENT...' : 
           updateDownloaded ? 'REDÉMARRER' : 
           'JOUER'}
        </button>

        <div className="input-group">
          <input 
            value={username} 
            onChange={e => setUsername(e.target.value)} 
            placeholder="Nom d'utilisateur" 
            disabled={!!userProfile}
            className="user-input"
          />
        </div>
      </footer>
    </div>
  );
};

export default App;
