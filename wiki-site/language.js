// Gestion du sélecteur de langue avec Google Translate
document.addEventListener('DOMContentLoaded', function() {
    const languageSelect = document.getElementById('languageSelect');
    
    // Charger la langue sauvegardée
    const savedLanguage = localStorage.getItem('selectedLanguage') || 'fr';
    languageSelect.value = savedLanguage;
    
    // Fonction pour changer la langue
    function changeLanguage(langCode) {
        if (langCode === 'fr') {
            // Retour au français - supprimer les cookies et recharger
            document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
            document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=' + window.location.hostname;
            window.location.reload();
            return;
        }
        
        // Mapper les codes de langue pour Google Translate
        let googleLangCode = langCode;
        if (langCode === 'zh') googleLangCode = 'zh-CN';
        
        // Définir le cookie de traduction Google
        const cookieValue = '/fr/' + googleLangCode;
        document.cookie = 'googtrans=' + cookieValue + '; path=/';
        document.cookie = 'googtrans=' + cookieValue + '; path=/; domain=' + window.location.hostname;
        
        // Recharger la page pour appliquer la traduction
        window.location.reload();
    }
    
    // Appliquer la langue sauvegardée au chargement si différente du français
    const currentCookie = document.cookie.split('; ').find(row => row.startsWith('googtrans='));
    if (savedLanguage !== 'fr' && !currentCookie) {
        changeLanguage(savedLanguage);
    }
    
    // Écouter les changements de langue
    languageSelect.addEventListener('change', function() {
        const selectedLanguage = this.value;
        localStorage.setItem('selectedLanguage', selectedLanguage);
        changeLanguage(selectedLanguage);
    });
});
