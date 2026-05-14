// Configuration GitHub
const GITHUB_REPO_OWNER = 'Clipdescript';
const GITHUB_REPO_NAME = 'Infinite-Launcher';
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/releases/latest`;

// Fonction pour formater la date avec heure et secondes
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

// Fonction pour récupérer la dernière version depuis GitHub
async function fetchLatestRelease() {
    try {
        const response = await fetch(GITHUB_API_URL);
        
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const release = await response.json();
        
        // Extraire les informations importantes
        const version = release.tag_name.replace('v', ''); // Enlever le 'v' du tag
        const publishedDate = formatDate(release.published_at);
        const releaseNotes = release.body || 'Aucune note de version disponible.';
        
        // Trouver le fichier .exe dans les assets
        const exeAsset = release.assets.find(asset => 
            asset.name.endsWith('.exe') && !asset.name.includes('blockmap')
        );
        
        if (!exeAsset) {
            throw new Error('Fichier .exe introuvable dans la release');
        }
        
        return {
            version,
            publishedDate,
            downloadUrl: exeAsset.browser_download_url,
            downloadCount: exeAsset.download_count,
            fileSize: (exeAsset.size / (1024 * 1024)).toFixed(2), // Convertir en MB
            releaseNotes,
            htmlUrl: release.html_url
        };
        
    } catch (error) {
        console.error('Erreur lors de la récupération de la release:', error);
        return null;
    }
}

// Fonction pour mettre à jour la page avec les informations de la release
async function updateDownloadPage() {
    const releaseInfo = await fetchLatestRelease();
    
    if (!releaseInfo) {
        console.error('Impossible de récupérer les informations de la release');
        return;
    }
    
    // Mettre à jour la version et la date
    const versionInfoElement = document.querySelector('.version-info');
    if (versionInfoElement) {
        versionInfoElement.textContent = `Version ${releaseInfo.version} - Dernière mise à jour : ${releaseInfo.publishedDate}`;
    }
    
    // Mettre à jour le bouton de téléchargement
    const downloadButton = document.querySelector('.download-button');
    if (downloadButton) {
        downloadButton.href = releaseInfo.downloadUrl;
        downloadButton.innerHTML = `
            <img src="Windows.png" alt="Windows" class="windows-icon" />
            Télécharger Infinite Launcher v${releaseInfo.version} (${releaseInfo.fileSize} MB)
        `;
    }
    
    // Mettre à jour les instructions d'installation
    const installationSteps = document.querySelector('.installation-steps ol');
    if (installationSteps) {
        const secondStep = installationSteps.children[1];
        if (secondStep) {
            secondStep.innerHTML = `Exécutez le fichier <code>Infinite Launcher Setup ${releaseInfo.version}.exe</code>`;
        }
    }
    
    // Ajouter les statistiques de téléchargement
    const downloadInfo = document.querySelector('.download-info');
    if (downloadInfo && releaseInfo.downloadCount > 0) {
        const statsDiv = document.createElement('div');
        statsDiv.className = 'download-stats';
        statsDiv.innerHTML = `
            <p class="stats-text">
                <svg class="stats-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                ${releaseInfo.downloadCount.toLocaleString('fr-FR')} téléchargements
            </p>
        `;
        
        // Insérer après le bouton de téléchargement
        const buttonContainer = document.querySelector('.download-button-container');
        if (buttonContainer) {
            buttonContainer.after(statsDiv);
        }
    }
    
    // Ajouter un lien vers les notes de version sur GitHub
    const supportSection = document.querySelector('.support-section');
    if (supportSection) {
        const releaseNotesDiv = document.createElement('div');
        releaseNotesDiv.className = 'release-notes-section';
        releaseNotesDiv.innerHTML = `
            <h3>Notes de version</h3>
            <p>Consultez les nouveautés et corrections de cette version sur GitHub.</p>
            <a href="${releaseInfo.htmlUrl}" target="_blank" rel="noopener noreferrer" class="github-link">
                Voir les notes de version complètes
            </a>
        `;
        supportSection.before(releaseNotesDiv);
    }
    
    console.log('Page mise à jour avec la version:', releaseInfo.version);
}

// Charger les informations au chargement de la page
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateDownloadPage);
} else {
    updateDownloadPage();
}
