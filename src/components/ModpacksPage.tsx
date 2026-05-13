import React from 'react';
import {
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  DocumentPlusIcon,
  ArchiveBoxIcon
} from '@heroicons/react/24/outline';

interface ModpacksPageProps {
  modpacks: any[];
  isLoadingMore: boolean;
  hasMore: boolean;
  totalModpacks: number;
  onBack: () => void;
  onInstall: (pack: any) => void;
  onLoadMore: () => void;
}

const ModpacksPage: React.FC<ModpacksPageProps> = ({
  modpacks,
  isLoadingMore,
  hasMore,
  totalModpacks,
  onBack,
  onInstall,
  onLoadMore
}) => {
  return (
    <div className="modpacks-overlay">
      <div className="modpacks-header">
        <button className="back-btn" onClick={onBack}>
          <ArrowLeftIcon className="icon" />
        </button>
        <h2 className="modpacks-title">Mod-packs</h2>
        <select className="version-filter">
          <option>TL-TEST</option>
          <option>1.21.5</option>
          <option>1.20.1</option>
        </select>
        <button className="create-btn">
          <DocumentPlusIcon className="icon" /> Create
        </button>
        <div className="search-box">
          <input type="text" placeholder="Search" />
          <button><MagnifyingGlassIcon className="icon-search" /></button>
        </div>
        <span className="sort-label">Sort</span>
        <select className="top-filter">
          <option>Top</option>
          <option>New</option>
          <option>Popular</option>
        </select>
      </div>

      <div className="modpacks-tabs">
        <button className="tab active">Mod-packs</button>
        <button className="tab">Mods</button>
        <button className="tab">Resource-packs</button>
        <button className="tab">Maps</button>
      </div>

      <div className="modpacks-filters">
        <span className="categories-label">Categories:</span>
        <select className="categories-select">
          <option>All</option>
          <option>Adventure</option>
          <option>Tech</option>
          <option>Magic</option>
        </select>
      </div>

      <div className="modpacks-list">
        {modpacks.length === 0 && isLoadingMore ? (
          <div className="loading-modpacks">
            <div className="loading-squares">
              <div className="loading-square"></div>
              <div className="loading-square"></div>
              <div className="loading-square"></div>
              <div className="loading-square"></div>
            </div>
            <p>Chargement des modpacks...</p>
          </div>
        ) : (
          <>
            {modpacks.map(pack => (
              <div key={pack.slug} className="modpack-item">
                <div className="modpack-thumbnail">
                  {pack.icon_url ? (
                    <img src={pack.icon_url} alt={pack.title} />
                  ) : (
                    <ArchiveBoxIcon className="placeholder-thumb-icon" />
                  )}
                </div>
                <div className="modpack-details">
                  <h3 className="modpack-name">{pack.title}</h3>
                  <p className="modpack-author">Auteur: <span>{pack.author || 'Inconnu'}</span></p>
                  <p className="modpack-description">
                    {pack.description}
                  </p>
                  <div className="modpack-stats">
                    <span className="stat">Téléchargements: <strong>{pack.downloads?.toLocaleString('fr-FR') || '0'}</strong></span>
                    <span className="stat">Mis à jour: <strong>{pack.date_modified ? new Date(pack.date_modified).toLocaleDateString('fr-FR') : 'N/A'}</strong></span>
                    <span className="stat">Version: <strong>{pack.latest_version || pack.game_versions?.[0] || pack.versions?.[0] || 'N/A'}</strong></span>
                  </div>
                </div>
                <button className="install-modpack-btn" onClick={() => onInstall(pack)}>
                  Installer
                </button>
              </div>
            ))}
            
            {/* Bouton pour charger 50 de plus */}
            {modpacks.length > 0 && (
              <div className="modpacks-footer">
                <div className="modpacks-info">
                  Affichage de {modpacks.length} sur {totalModpacks.toLocaleString('fr-FR')} modpacks
                </div>
                
                {isLoadingMore && (
                  <div className="loading-more">
                    <div className="loading-squares">
                      <div className="loading-square"></div>
                      <div className="loading-square"></div>
                      <div className="loading-square"></div>
                      <div className="loading-square"></div>
                    </div>
                    <span>Chargement de 50 modpacks supplémentaires...</span>
                  </div>
                )}
                
                {hasMore && !isLoadingMore && (
                  <button className="load-more-btn" onClick={onLoadMore}>
                    Charger 50 modpacks de plus
                  </button>
                )}
                
                {!hasMore && (
                  <div className="no-more-modpacks">
                    ✓ Tous les modpacks ont été chargés
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ModpacksPage;
