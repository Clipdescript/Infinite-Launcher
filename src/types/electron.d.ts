// Types pour l'API Electron exposée via contextBridge

export interface LaunchOptions {
  version: string;
  username: string;
  maxMem?: string;
  loader?: 'vanilla' | 'fabric' | 'forge';
  uuid?: string;
  accessToken?: string;
  clientToken?: string;
}

export interface ProgressData {
  current: number;
  total: number;
  task: string;
}

export interface UpdateStatus {
  status: 'available' | 'downloaded';
}

export interface UpdateProgress {
  percent: number;
  transferred: number;
  total: number;
}

export interface UserProfile {
  name: string;
  uuid: string;
  accessToken: string;
}

export interface LoginResult {
  success: boolean;
  profile?: UserProfile;
  error?: string;
}

export interface GoogleSignInResult {
  success: boolean;
  idToken?: string;
  accessToken?: string;
  error?: string;
}

export interface ModpacksResult {
  hits: any[];
  total: number;
  offset: number;
  limit: number;
}

export interface ElectronAPI {
  launchGame: (options: LaunchOptions) => Promise<{ success: boolean; error?: string }>;
  getVersions: () => Promise<any[]>;
  getModpacks: (offset?: number, limit?: number) => Promise<ModpacksResult>;
  loginMicrosoft: () => Promise<LoginResult>;
  signInWithGoogle: () => Promise<GoogleSignInResult>;
  onLog: (callback: (data: string) => void) => () => void;
  onProgress: (callback: (data: ProgressData) => void) => () => void;
  onUpdateStatus: (callback: (data: UpdateStatus) => void) => () => void;
  onUpdateProgress: (callback: (data: UpdateProgress) => void) => () => void;
  restartApp: () => Promise<void>;
  getMinecraftNews: () => Promise<{ success: boolean; data?: any[]; error?: string }>;
  windowMinimize: () => Promise<void>;
  windowMaximize: () => Promise<void>;
  windowClose: () => Promise<void>;
}

declare global {
  interface Window {
    api: ElectronAPI;
  }
}

export {};
