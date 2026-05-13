import React from 'react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

interface AuthPageProps {
  authMode: 'login' | 'register';
  authEmail: string;
  authPassword: string;
  authError: string;
  authLoading: boolean;
  onBack: () => void;
  onModeChange: (mode: 'login' | 'register') => void;
  onEmailChange: (email: string) => void;
  onPasswordChange: (password: string) => void;
  onSubmit: () => void;
  onGoogleSignIn: () => void;
}

const AuthPage: React.FC<AuthPageProps> = ({
  authMode,
  authEmail,
  authPassword,
  authError,
  authLoading,
  onBack,
  onModeChange,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  onGoogleSignIn
}) => {
  return (
    <div className="auth-overlay">
      <div className="auth-header">
        <button className="back-btn" onClick={onBack}>
          <ArrowLeftIcon className="icon" />
        </button>
        <h2>Inscription / Connexion</h2>
      </div>
      
      <div className="auth-content">
        <div className="auth-tabs">
          <button 
            className={`auth-tab ${authMode === 'login' ? 'active' : ''}`}
            onClick={() => onModeChange('login')}
          >
            Connexion
          </button>
          <button 
            className={`auth-tab ${authMode === 'register' ? 'active' : ''}`}
            onClick={() => onModeChange('register')}
          >
            Inscription
          </button>
        </div>
        
        {authError && (
          <div className="auth-error">
            {authError}
          </div>
        )}
        
        <div className="auth-form">
          <div className="auth-input-group">
            <label>Email</label>
            <input 
              type="email" 
              value={authEmail}
              onChange={(e) => onEmailChange(e.target.value)}
              placeholder="votre@email.com"
              disabled={authLoading}
            />
          </div>
          
          <div className="auth-input-group">
            <label>Mot de passe</label>
            <input 
              type="password" 
              value={authPassword}
              onChange={(e) => onPasswordChange(e.target.value)}
              placeholder="••••••••"
              disabled={authLoading}
            />
          </div>
          
          <button 
            className="auth-submit-btn"
            onClick={onSubmit}
            disabled={authLoading || !authEmail || !authPassword}
          >
            {authLoading ? (
              <div className="loading-squares">
                <div className="loading-square"></div>
                <div className="loading-square"></div>
                <div className="loading-square"></div>
                <div className="loading-square"></div>
              </div>
            ) : (
              authMode === 'login' ? 'Se connecter' : 'S\'inscrire'
            )}
          </button>

          <div className="auth-divider">
            <span>ou</span>
          </div>

          <button 
            className="auth-google-btn"
            onClick={onGoogleSignIn}
            disabled={authLoading}
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="google-icon" />
            Continuer avec Google
          </button>
          
          {authMode === 'login' ? (
            <p>Pas encore de compte ? <button onClick={() => onModeChange('register')} className="auth-switch">S'inscrire</button></p>
          ) : (
            <p>Déjà un compte ? <button onClick={() => onModeChange('login')} className="auth-switch">Se connecter</button></p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
