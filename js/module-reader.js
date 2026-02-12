// ===== MODULE READER SYSTEM =====
// Lecteur read-only pour les Modules 1 (Mensuel) et 2 (Annuel)

class ModuleReaderSystem {
    constructor() {
        this.module1Data = this.loadModule1Data();
        this.module2Data = this.loadModule2Data();
    }

    // ===== MODULE 1 - SUIVI MENSUEL =====
    
    loadModule1Data() {
        const saved = localStorage.getItem('rpg_module1_data');
        return saved ? JSON.parse(saved) : {
            currentMonth: new Date().getMonth(),
            currentYear: new Date().getFullYear(),
            monthlyHours: 0,
            history: []
        };
    }

    saveModule1Data() {
        localStorage.setItem('rpg_module1_data', JSON.stringify(this.module1Data));
    }

    // Obtenir le résumé du mois en cours
    getModule1Summary() {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        return {
            month: currentMonth,
            year: currentYear,
            monthName: this.getMonthName(currentMonth),
            totalHours: this.module1Data.monthlyHours,
            weeklyAverage: this.calculateWeeklyAverage(this.module1Data.monthlyHours),
            overtimeHours: Math.max(0, this.module1Data.monthlyHours - this.getExpectedHours(currentMonth, currentYear)),
            isCompliant: this.checkMonthlyCompliance(this.module1Data.monthlyHours),
            alerts: this.getMonthlyAlerts(this.module1Data.monthlyHours)
        };
    }

    // Calculer les heures attendues pour un mois
    getExpectedHours(month, year) {
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const workingDays = this.getWorkingDays(month, year);
        return workingDays * 7; // 35h/semaine = 7h/jour
    }

    // Obtenir le nombre de jours ouvrés
    getWorkingDays(month, year) {
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        let workingDays = 0;

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dayOfWeek = date.getDay();
            // 1-5 = Lundi à Vendredi
            if (dayOfWeek >= 1 && dayOfWeek <= 5) {
                workingDays++;
            }
        }

        return workingDays;
    }

    // Moyenne hebdomadaire
    calculateWeeklyAverage(monthlyHours) {
        const weeksInMonth = 4.33; // Moyenne
        return (monthlyHours / weeksInMonth).toFixed(1);
    }

    // Vérifier la conformité mensuelle
    checkMonthlyCompliance(monthlyHours) {
        const weeklyAvg = monthlyHours / 4.33;
        return weeklyAvg <= 48; // Limite hebdomadaire
    }

    // Obtenir les alertes mensuelles
    getMonthlyAlerts(monthlyHours) {
        const alerts = [];
        const weeklyAvg = monthlyHours / 4.33;

        if (weeklyAvg > 48) {
            alerts.push({
                level: 'danger',
                message: `Moyenne hebdomadaire de ${weeklyAvg.toFixed(1)}h dépasse la limite de 48h`
            });
        } else if (weeklyAvg > 44) {
            alerts.push({
                level: 'warning',
                message: `Moyenne hebdomadaire de ${weeklyAvg.toFixed(1)}h proche de la limite`
            });
        }

        if (monthlyHours > 220) {
            alerts.push({
                level: 'danger',
                message: 'Contingent annuel potentiellement dépassé'
            });
        }

        return alerts;
    }

    // ===== MODULE 2 - SUIVI ANNUEL =====
    
    loadModule2Data() {
        const saved = localStorage.getItem('rpg_module2_data');
        return saved ? JSON.parse(saved) : {
            currentYear: new Date().getFullYear(),
            annualHours: 0,
            contingent: 220,
            history: []
        };
    }

    saveModule2Data() {
        localStorage.setItem('rpg_module2_data', JSON.stringify(this.module2Data));
    }

    // Obtenir le résumé annuel
    getModule2Summary() {
        const currentYear = new Date().getFullYear();
        const contingentUsed = Math.min(this.module2Data.annualHours, 220);
        const contingentRemaining = Math.max(0, 220 - this.module2Data.annualHours);
        const overtimeRate = (this.module2Data.annualHours / 220) * 100;

        return {
            year: currentYear,
            totalHours: this.module2Data.annualHours,
            contingent: {
                total: 220,
                used: contingentUsed,
                remaining: contingentRemaining,
                percentage: Math.min(100, overtimeRate)
            },
            monthlyAverage: (this.module2Data.annualHours / (new Date().getMonth() + 1)).toFixed(1),
            projectedAnnual: this.projectAnnualHours(),
            isCompliant: this.checkAnnualCompliance(this.module2Data.annualHours),
            alerts: this.getAnnualAlerts(this.module2Data.annualHours),
            breakdown: this.getOvertimeBreakdown(this.module2Data.annualHours)
        };
    }

    // Projeter les heures annuelles
    projectAnnualHours() {
        const currentMonth = new Date().getMonth() + 1; // 1-12
        if (currentMonth === 0) return 0;
        
        const monthlyAverage = this.module2Data.annualHours / currentMonth;
        const projected = monthlyAverage * 12;
        
        return {
            value: projected.toFixed(1),
            exceedsContingent: projected > 220,
            monthlyNeeded: ((220 - this.module2Data.annualHours) / (12 - currentMonth)).toFixed(1)
        };
    }

    // Vérifier la conformité annuelle
    checkAnnualCompliance(annualHours) {
        return annualHours <= 220;
    }

    // Obtenir les alertes annuelles
    getAnnualAlerts(annualHours) {
        const alerts = [];
        const percentage = (annualHours / 220) * 100;

        if (annualHours > 220) {
            alerts.push({
                level: 'danger',
                message: `Contingent annuel dépassé de ${(annualHours - 220).toFixed(1)}h`
            });
        } else if (percentage > 90) {
            alerts.push({
                level: 'warning',
                message: `${percentage.toFixed(0)}% du contingent utilisé`
            });
        } else if (percentage > 75) {
            alerts.push({
                level: 'info',
                message: `${percentage.toFixed(0)}% du contingent utilisé`
            });
        }

        return alerts;
    }

    // Calculer la répartition des heures sup
    getOvertimeBreakdown(totalHours) {
        // Calcul simplifié basé sur la moyenne hebdomadaire
        const weeklyAverage = totalHours / 52; // Sur l'année
        const overtimePerWeek = Math.max(0, weeklyAverage - 35);
        
        const at25 = Math.min(overtimePerWeek, 8) * 52;
        const at50 = Math.max(0, overtimePerWeek - 8) * 52;

        return {
            at25: at25.toFixed(1),
            at50: at50.toFixed(1),
            totalOvertime: (at25 + at50).toFixed(1)
        };
    }

    // ===== FONCTIONS COMMUNES =====

    // Importer des données depuis un fichier JSON
    async importModuleData(file, moduleNumber) {
        try {
            const text = await file.text();
            const data = JSON.parse(text);

            if (moduleNumber === 1) {
                this.module1Data = data;
                this.saveModule1Data();
            } else if (moduleNumber === 2) {
                this.module2Data = data;
                this.saveModule2Data();
            }

            return {
                success: true,
                message: `Module ${moduleNumber} importé avec succès`
            };

        } catch (error) {
            return {
                success: false,
                error: 'Erreur lors de l\'import'
            };
        }
    }

    // Exporter les données d'un module
    exportModuleData(moduleNumber) {
        let data, filename;

        if (moduleNumber === 1) {
            data = this.module1Data;
            filename = `module1_mensuel_${new Date().toISOString().split('T')[0]}.json`;
        } else if (moduleNumber === 2) {
            data = this.module2Data;
            filename = `module2_annuel_${new Date().toISOString().split('T')[0]}.json`;
        } else {
            return { success: false, error: 'Numéro de module invalide' };
        }

        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);

        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();

        return {
            success: true,
            message: `Module ${moduleNumber} exporté`
        };
    }

    // Obtenir le nom du mois
    getMonthName(month) {
        const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                       'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
        return months[month];
    }

    // Synchroniser avec gameState
    syncWithGameState() {
        this.module1Data.monthlyHours = gameState.hours.monthly;
        this.module2Data.annualHours = gameState.hours.annual;
        this.saveModule1Data();
        this.saveModule2Data();
    }

    // Obtenir un rapport complet
    getFullReport() {
        return {
            module1: this.getModule1Summary(),
            module2: this.getModule2Summary(),
            combined: {
                totalHours: gameState.hours.total,
                currentWeek: gameState.hours.weekly,
                compliance: this.getOverallCompliance()
            }
        };
    }

    // Vérifier la conformité globale
    getOverallCompliance() {
        const m1 = this.checkMonthlyCompliance(this.module1Data.monthlyHours);
        const m2 = this.checkAnnualCompliance(this.module2Data.annualHours);
        
        return {
            isFullyCompliant: m1 && m2,
            monthly: m1,
            annual: m2,
            status: m1 && m2 ? 'compliant' : 'non-compliant'
        };
    }

    // Réinitialiser les données
    reset() {
        this.module1Data = {
            currentMonth: new Date().getMonth(),
            currentYear: new Date().getFullYear(),
            monthlyHours: 0,
            history: []
        };
        this.module2Data = {
            currentYear: new Date().getFullYear(),
            annualHours: 0,
            contingent: 220,
            history: []
        };
        this.saveModule1Data();
        this.saveModule2Data();
    }
}

// Export global
const moduleReader = new ModuleReaderSystem();
