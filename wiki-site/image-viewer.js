// Fonctions pour la visionneuse d'image
function openImageViewer(src) {
    document.getElementById('imageViewer').style.display = 'flex';
    document.getElementById('viewerImage').src = src;
    document.body.style.overflow = 'hidden';
}

function closeImageViewer() {
    document.getElementById('imageViewer').style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Fermer avec la touche Échap
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeImageViewer();
    }
});
