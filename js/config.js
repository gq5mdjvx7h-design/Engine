// ===== CONFIG.JS - Configuration globale =====

const APP_CONFIG = {
    version: '1.0.0',
    name: 'Heures Sup Ultimate',
    author: 'Chauvel',
    
    scenarios: {
        total: 600,
        categories: 8
    },
    
    modules: {
        module1: { name: 'Suivi Annuel', enabled: true },
        module2: { name: 'Suivi Mensuel', enabled: true },
        module3: { name: 'RPG Gamifié', enabled: true }
    },
    
    features: {
        ai: true,
        demoMode: true,
        devMode: true,
        export: true,
        import: true
    },
    
    storage: {
        prefix: 'heures_sup_',
        autoSave: true,
        autoSaveInterval: 30000 // 30 secondes
    }
};

// Données globales utilisateur
let globalData = {
    level: 1,
    xp: 0,
    wisdom: 0,
    scenariosRead: [],
    unlockedBadges: [],
    lastPlayed: null
};

// Fonctions sauvegarde/chargement
function saveGlobalData() {
    if (typeof storage !== 'undefined') {
        storage.save('globalData', globalData);
    }
}

function loadGlobalData() {
    if (typeof storage !== 'undefined') {
        const saved = storage.load('globalData');
        if (saved) {
            globalData = {...globalData, ...saved};
            // S'assurer que les nouveaux champs existent
            if (!globalData.unlockedBadges) globalData.unlockedBadges = [];
        }
    }
}

console.log(`🚀 ${APP_CONFIG.name} v${APP_CONFIG.version}`);
