// ===== MAIN.JS =====

window.onload = function() {
    try {
        console.log('🦊 Heures Sup Ultimate - Démarrage...');
        checkAndLoadMode();
    } catch(e) { console.error('❌ Erreur démarrage:', e); }
};

function initApp() {
    try {
        loadGlobalData();
        updateSeasonalBackground();
        updateFoxCharacter();
        updateGlobalStats();
        updateDashboard();
        if (typeof scenarioSystemFox !== 'undefined') loadScenarios();
        if (window.dataBridge) {
            dataBridge.startAutoSync(5000);
            dataBridge.addWatcher((data) => {
                updateDashboardFromBridge();
                if (window.rpgSystem) rpgSystem.checkBadges();
                const active = document.querySelector('.module-content.active');
                if (active) {
                    if (active.id === 'module-module1') updateModule1Stats();
                    else if (active.id === 'module-module2') updateModule2Stats();
                    else if (active.id === 'module-module3') { if(typeof updateRPGDisplay==='function') updateRPGDisplay(); }
                }
            });
        }
        console.log('✅ App initialisée | Mode:', currentMode);
    } catch(e) { console.error('❌ Erreur initApp:', e); }
}

// ==========================================
// 🌿 DÉCORS SAISONNIERS (images ou gradient)
// ==========================================

function updateSeasonalBackground() {
    try {
        const season = getCurrentSeason();
        document.querySelectorAll('.background-layer').forEach(el => {
            el.classList.remove('active');
            el.style.backgroundImage = '';
            el.style.background = '';
        });
        const targetEl = document.getElementById('bg-' + season);
        if (!targetEl) return;
        const config = ASSETS_CONFIG.backgrounds[season];
        const img = new Image();
        img.onload = () => {
            targetEl.style.backgroundImage = "url('" + config.path + "')";
            targetEl.style.backgroundSize = 'cover';
            targetEl.style.backgroundPosition = 'center';
            targetEl.classList.add('active');
        };
        img.onerror = () => {
            targetEl.style.background = config.fallbackColor;
            targetEl.classList.add('active');
        };
        img.src = config.path;
    } catch(e) { console.error('❌ Background:', e); }
}

// ==========================================
// 🦊 RENARD SAISONNIER (image ou emoji)
// ==========================================

function updateFoxCharacter() {
    try {
        const season = getCurrentSeason();
        const config = ASSETS_CONFIG.characters[season];
        if (!config) return;

        // Renard sidebar
        const foxSidebar = document.getElementById('fox-character-display');
        if (foxSidebar) foxSidebar.innerHTML = buildFoxImg(config, '80px');

        // Renard bloc RPG
        const foxRPG = document.getElementById('rpg-fox-avatar');
        if (foxRPG) foxRPG.innerHTML = buildFoxImg(config, '60px');

    } catch(e) { console.error('❌ Fox:', e); }
}

function buildFoxImg(config, size) {
    return '<img src="' + config.path + '" alt="' + config.alt + '" ' +
        'style="width:' + size + ';height:auto;object-fit:contain;" ' +
        "onerror=\"this.replaceWith(Object.assign(document.createElement('span'),{textContent:'🦊',style:'font-size:" + size + "'}))\"" +
        '>';
}

// ==========================================
// NAVIGATION
// ==========================================

function switchModule(moduleName) {
    try {
        document.querySelectorAll('.module-content').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.module-btn').forEach(btn => btn.classList.remove('active'));
        const target = document.getElementById('module-' + moduleName);
        if (target) target.classList.add('active');
        if (event && event.target) event.target.classList.add('active');
        if (moduleName === 'module1') updateModule1Stats();
        if (moduleName === 'module2') updateModule2Stats();
        if (moduleName === 'module3') {
            if (typeof loadModule3 === 'function') loadModule3();
            updateFoxCharacter();
        }
        if (moduleName === 'scenarios') { if(typeof loadScenarios==='function') loadScenarios(); }
    } catch(e) { console.error('❌ switchModule:', e); }
}

// ==========================================
// STATS
// ==========================================

function updateModule1Stats() {
    try {
        if (!window.dataBridge) return;
        const data = dataBridge.readModule1Data();
        if (data && data.stats) {
            const s = data.stats;
            const els = {
                'm1-total':     Math.round(s.totalHours || 0) + 'h',
                'm1-overtime':  Math.round(s.totalOvertime || 0) + 'h',
                'm1-weeks':     s.weeksWorked || 0,
                'm1-violations':s.violations || 0
            };
            Object.entries(els).forEach(([id, val]) => {
                const el = document.getElementById(id);
                if (el) el.textContent = val;
            });
        }
    } catch(e) { console.error(e); }
}

function updateModule2Stats() {
    try {
        if (!window.dataBridge) return;
        const data = dataBridge.readModule2Data();
        if (data && data.stats) {
            const s = data.stats;
            const els = {
                'm2-total':     Math.round(s.totalHours || 0) + 'h',
                'm2-snapshots': s.totalSnapshots || 0,
                'm2-months':    s.totalMonths || 0,
                'm2-entries':   s.totalEntries || 0
            };
            Object.entries(els).forEach(([id, val]) => {
                const el = document.getElementById(id);
                if (el) el.textContent = val;
            });
        }
    } catch(e) { console.error(e); }
}

function updateGlobalStats() {
    try {
        const ids = {
            'globalLevel':    globalData.level,
            'globalXP':       globalData.xp.toLocaleString(),
            'globalWisdom':   globalData.wisdom,
            'globalScenarios': globalData.scenariosRead.length + '/600'
        };
        Object.entries(ids).forEach(([id, val]) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val;
        });
    } catch(e) { console.error(e); }
}

function updateDashboard() {
    try {
        const ids = {
            'dash-rpg-level':      globalData.level,
            'dash-rpg-badges':     (globalData.unlockedBadges ? globalData.unlockedBadges.length : 0) + '/50',
            'dash-scenarios-read': globalData.scenariosRead.length + '/600',
            'dash-current-month':  new Date().toLocaleDateString('fr-FR', {month:'long', year:'numeric'})
        };
        Object.entries(ids).forEach(([id, val]) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val;
        });
        updateDashboardFromBridge();
    } catch(e) { console.error(e); }
}

function updateDashboardFromBridge() {
    try {
        if (!window.dataBridge) return;
        const data = dataBridge.getCombinedData();
        if (data && data.module1 && data.module1.stats) {
            const s = data.module1.stats;
            const h = document.getElementById('dash-annual-hours');
            const o = document.getElementById('dash-annual-overtime');
            if (h) h.textContent = Math.round(s.totalHours || 0) + 'h';
            if (o) o.textContent = Math.round(s.totalOvertime || 0) + 'h';
        }
        if (data && data.module2 && data.module2.stats) {
            const m = document.getElementById('dash-monthly-hours');
            if (m) m.textContent = Math.round(data.module2.stats.totalHours || 0) + 'h';
        }
    } catch(e) { console.error(e); }
}

// ==========================================
// DIALOGUE RENARD
// ==========================================

function toggleFoxDialogue() {
    try {
        const dialogue = document.getElementById('foxDialogue');
        if (!dialogue) return;
        dialogue.classList.toggle('active');
        const messages = [
            'Tu as lu ' + globalData.scenariosRead.length + ' scénarios ! Continue ! 🦊',
            'Niveau ' + globalData.level + ' — super progression !',
            'Le droit du travail n\'a plus de secrets pour toi !',
            globalData.wisdom + ' points de sagesse accumulés !',
            'Explore les scénarios pour débloquer des badges !'
        ];
        const el = document.getElementById('foxText');
        if (el) el.textContent = messages[Math.floor(Math.random() * messages.length)];
    } catch(e) { console.error(e); }
}

// ==========================================
// MODE SÉLECTEUR (bouton changer mode)
// ==========================================

function showModeSelector() {
    try {
        localStorage.removeItem('heures_sup_mode');
        const mainApp = document.getElementById('mainApp');
        const selector = document.getElementById('modeSelector');
        if (mainApp) mainApp.style.display = 'none';
        if (selector) selector.classList.add('active');
    } catch(e) { console.error(e); }
}

// ==========================================
// IMPORT / EXPORT / RESET
// ==========================================

function exportData() {
    try {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([JSON.stringify(globalData, null, 2)], {type:'application/json'}));
        a.download = 'heures-sup-' + new Date().toISOString().slice(0,10) + '.json';
        a.click();
        showNotification('📤 Données exportées !', 'success');
    } catch(e) { console.error(e); }
}

function importData() {
    try {
        const input = document.createElement('input');
        input.type = 'file'; input.accept = '.json';
        input.onchange = (e) => {
            const reader = new FileReader();
            reader.onload = (evt) => {
                try {
                    const imported = JSON.parse(evt.target.result);
                    globalData = imported;
                    saveGlobalData();
                    updateGlobalStats();
                    updateDashboard();
                    showNotification('📥 Données importées !', 'success');
                } catch(err) { showNotification('❌ Fichier invalide', 'error'); }
            };
            reader.readAsText(e.target.files[0]);
        };
        input.click();
    } catch(e) { console.error(e); }
}

function resetAll() {
    if (confirm('Réinitialiser TOUTES les données ? (irréversible)')) {
        try {
            localStorage.clear();
            setTimeout(() => location.reload(), 300);
        } catch(e) { console.error(e); }
    }
}

// ==========================================
// NOTIFICATIONS
// ==========================================

function showNotification(message, type) {
    try {
        type = type || 'info';
        const bg = {success:'#00ff88', error:'#ff4444', info:'#4facfe', warning:'#f39c12'}[type] || '#4facfe';
        const tc = {success:'#000', error:'#fff', info:'#fff', warning:'#000'}[type] || '#fff';
        const notif = document.createElement('div');
        notif.style.cssText = 'position:fixed;top:20px;right:20px;background:' + bg + ';color:' + tc +
            ';padding:14px 22px;border-radius:10px;box-shadow:0 8px 30px rgba(0,0,0,0.4);' +
            'z-index:99999;font-weight:600;max-width:350px;transition:opacity 0.5s;';
        notif.textContent = message;
        document.body.appendChild(notif);
        setTimeout(() => { notif.style.opacity = '0'; setTimeout(() => notif.remove(), 500); }, 3500);
    } catch(e) { /* silencieux */ }
}

// AUTO-SAVE
setInterval(() => { try { saveGlobalData(); } catch(e) {} }, 30000);

console.log('✅ main.js chargé');
