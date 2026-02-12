// ===== AI INTEGRATION SYSTEM =====
// Système d'IA utilisant l'API Anthropic pour générer du contenu dynamique

class AIIntegration {
    constructor() {
        this.conversationHistory = [];
        this.scenarioCache = new Map();
        this.isProcessing = false;
        this.maxTokens = 1000;
    }

    // Générer un scénario personnalisé avec l'IA
    async generateScenario(type, difficulty, customContext = '') {
        if (this.isProcessing) {
            return { error: 'Une génération est déjà en cours...' };
        }

        this.isProcessing = true;
        showAILoading(true);

        try {
            const prompt = this.buildScenarioPrompt(type, difficulty, customContext);
            
            const response = await fetch("https://api.anthropic.com/v1/messages", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: "claude-sonnet-4-20250514",
                    max_tokens: this.maxTokens,
                    messages: [
                        {
                            role: "user",
                            content: prompt
                        }
                    ],
                })
            });

            if (!response.ok) {
                throw new Error(`Erreur API: ${response.status}`);
            }

            const data = await response.json();
            const scenario = this.parseScenarioResponse(data);
            
            // Sauvegarder dans le cache
            const cacheKey = `${type}_${difficulty}_${Date.now()}`;
            this.scenarioCache.set(cacheKey, scenario);
            
            this.isProcessing = false;
            showAILoading(false);
            
            return scenario;

        } catch (error) {
            console.error('Erreur génération scénario:', error);
            this.isProcessing = false;
            showAILoading(false);
            
            return {
                error: 'Impossible de générer le scénario. Veuillez réessayer.',
                fallback: this.getFallbackScenario(type, difficulty)
            };
        }
    }

    // Construire le prompt pour générer un scénario
    buildScenarioPrompt(type, difficulty, customContext) {
        const typeDescriptions = {
            'overtime': 'heures supplémentaires',
            'night': 'travail de nuit',
            'weekend': 'travail le weekend',
            'rest': 'repos et congés',
            'health': 'santé et sécurité au travail',
            'family': 'conciliation vie familiale et professionnelle',
            'termination': 'rupture de contrat',
            'harassment': 'harcèlement au travail',
            'discrimination': 'discrimination',
            'custom': customContext || 'situation générale'
        };

        const difficultyLevels = {
            'beginner': 'débutant (situation simple et claire)',
            'intermediate': 'intermédiaire (situation avec quelques nuances)',
            'advanced': 'avancé (situation complexe)',
            'expert': 'expert (situation très complexe avec multiples aspects juridiques)'
        };

        return `Tu es un expert en droit du travail français. Génère un scénario réaliste et pédagogique sur le thème : "${typeDescriptions[type]}".

Niveau de difficulté : ${difficultyLevels[difficulty]}

${customContext ? `Contexte spécifique : ${customContext}` : ''}

Le scénario doit contenir :
1. Un titre accrocheur (max 50 caractères)
2. Le nom d'un personnage (prénom)
3. Sa profession
4. Une situation concrète (2-3 phrases)
5. Un conseil juridique NEUTRE et FACTUEL basé sur le Code du travail français
6. Une référence légale précise (article du Code du travail)

IMPORTANT :
- Rester NEUTRE : donner des INFORMATIONS, pas des conseils d'action
- NE PAS être intrusif ou prescriptif
- NE PAS encourager à faire ou ne pas faire quelque chose
- SE LIMITER aux FAITS et à la LOI
- Utiliser des noms français réalistes et variés (pas toujours les mêmes)

Format de réponse (RESPECTE EXACTEMENT ce format JSON) :
{
  "title": "titre du scénario",
  "character": "prénom du personnage",
  "profession": "profession",
  "situation": "description de la situation",
  "advice": "conseil juridique neutre et factuel",
  "legalReference": "Article précis du Code du travail",
  "difficulty": "${difficulty}",
  "category": "${type}"
}`;
    }

    // Parser la réponse de l'IA
    parseScenarioResponse(data) {
        try {
            // Extraire le texte de la réponse
            const content = data.content
                .map(item => item.type === 'text' ? item.text : '')
                .join('\n');

            // Nettoyer le JSON (enlever les balises markdown si présentes)
            const cleanContent = content
                .replace(/```json\n?/g, '')
                .replace(/```\n?/g, '')
                .trim();

            // Parser le JSON
            const scenario = JSON.parse(cleanContent);

            // Valider les champs requis
            if (!scenario.title || !scenario.situation || !scenario.advice) {
                throw new Error('Scénario incomplet');
            }

            // Ajouter un ID unique
            scenario.id = `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            scenario.isAIGenerated = true;
            scenario.generatedAt = new Date().toISOString();

            return scenario;

        } catch (error) {
            console.error('Erreur parsing réponse:', error);
            throw new Error('Format de réponse invalide');
        }
    }

    // Dialogue interactif avec Kitsune
    async chatWithKitsune(userMessage) {
        if (this.isProcessing) {
            return { error: 'Kitsune est en train de réfléchir...' };
        }

        this.isProcessing = true;
        
        // Ajouter le message de l'utilisateur à l'historique
        this.conversationHistory.push({
            role: "user",
            content: userMessage
        });

        try {
            const response = await fetch("https://api.anthropic.com/v1/messages", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: "claude-sonnet-4-20250514",
                    max_tokens: 800,
                    system: this.getKitsuneSystemPrompt(),
                    messages: this.conversationHistory.slice(-10) // Garder les 10 derniers messages
                })
            });

            if (!response.ok) {
                throw new Error(`Erreur API: ${response.status}`);
            }

            const data = await response.json();
            const assistantMessage = data.content
                .map(item => item.type === 'text' ? item.text : '')
                .join('\n');

            // Ajouter la réponse à l'historique
            this.conversationHistory.push({
                role: "assistant",
                content: assistantMessage
            });

            this.isProcessing = false;
            
            return {
                message: assistantMessage,
                success: true
            };

        } catch (error) {
            console.error('Erreur dialogue Kitsune:', error);
            this.isProcessing = false;
            
            return {
                error: 'Désolé, je ne peux pas répondre pour le moment.',
                message: this.getFallbackResponse(userMessage)
            };
        }
    }

    // Prompt système pour Kitsune
    getKitsuneSystemPrompt() {
        return `Tu es Kitsune, un renard sage et bienveillant qui guide le joueur dans un RPG éducatif sur le droit du travail français.

PERSONNALITÉ :
- Sage mais accessible
- Encourageant et positif
- Pédagogue mais jamais condescendant
- Utilise occasionnellement des émojis (🦊, ⚖️, 📚, etc.)
- Ton chaleureux et amical

RÔLE :
- Expliquer le droit du travail français de manière simple
- Donner des informations NEUTRES et FACTUELLES
- Encourager l'apprentissage
- Féliciter les progrès
- Répondre aux questions sur le jeu

LIMITES :
- NE JAMAIS donner de conseil juridique personnalisé
- NE PAS être prescriptif ("tu dois faire ceci...")
- NE PAS remplacer un avocat
- Toujours rappeler de consulter un professionnel pour des cas spécifiques
- Rester dans le contexte du jeu et du droit du travail français

STYLE :
- Phrases courtes et claires
- Exemples concrets quand utile
- Références aux articles du Code du travail si pertinent
- Garde un ton RPG/aventure quand approprié

Réponds toujours en français.`;
    }

    // Réponse de secours si l'API échoue
    getFallbackResponse(userMessage) {
        const fallbacks = [
            "Hmm, ma sagesse de renard me fait défaut pour le moment... Peux-tu reformuler ta question ? 🦊",
            "Je suis désolé, je dois méditer un instant. Réessaye dans quelques instants ! ✨",
            "Mon lien avec la sagesse ancienne est perturbé... Peux-tu me reposer ta question ? 📚",
            "Oups ! Même les renards sages ont parfois besoin d'une pause. Réessayons ! 🌟"
        ];
        
        return fallbacks[Math.floor(Math.random() * fallbacks.length)];
    }

    // Scénario de secours si la génération échoue
    getFallbackScenario(type, difficulty) {
        return {
            title: "Scénario de secours",
            character: "Alex",
            profession: "Employé de bureau",
            situation: "Une situation standard nécessitant l'analyse du droit du travail.",
            advice: "Consultez le Code du travail pour plus d'informations sur votre situation spécifique.",
            legalReference: "Code du travail - Partie législative",
            difficulty: difficulty,
            category: type,
            isFallback: true
        };
    }

    // Analyser des heures avec l'IA
    async analyzeLegalCompliance(hours, weeklyHours, context = {}) {
        const prompt = `Analyse cette situation au regard du droit du travail français :

Heures cette semaine : ${weeklyHours}h
Heures supplémentaires déclarées : ${hours}h
Type : ${context.type || 'normales'}
${context.additional ? `Contexte : ${context.additional}` : ''}

Réponds au format JSON avec :
{
  "isCompliant": true/false,
  "alerts": ["liste des alertes"],
  "overtimeBreakdown": {
    "at25": nombre d'heures à +25%,
    "at50": nombre d'heures à +50%
  },
  "recommendations": ["liste de recommandations NEUTRES"],
  "legalReferences": ["articles du Code du travail"]
}`;

        try {
            const response = await fetch("https://api.anthropic.com/v1/messages", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: "claude-sonnet-4-20250514",
                    max_tokens: 600,
                    messages: [{ role: "user", content: prompt }]
                })
            });

            const data = await response.json();
            const content = data.content[0].text
                .replace(/```json\n?/g, '')
                .replace(/```\n?/g, '')
                .trim();
            
            return JSON.parse(content);

        } catch (error) {
            console.error('Erreur analyse légale:', error);
            return this.getFallbackLegalAnalysis(hours, weeklyHours);
        }
    }

    // Analyse légale de secours
    getFallbackLegalAnalysis(hours, weeklyHours) {
        const isCompliant = weeklyHours <= 48;
        const overtimeHours = Math.max(0, weeklyHours - 35);
        
        return {
            isCompliant: isCompliant,
            alerts: isCompliant ? [] : ['Limite hebdomadaire de 48h potentiellement dépassée'],
            overtimeBreakdown: {
                at25: Math.min(overtimeHours, 8),
                at50: Math.max(0, overtimeHours - 8)
            },
            recommendations: [
                'Vérifiez votre convention collective',
                'Consultez votre service RH si nécessaire'
            ],
            legalReferences: ['Article L3121-20 du Code du travail']
        };
    }

    // Réinitialiser l'historique de conversation
    resetConversation() {
        this.conversationHistory = [];
    }

    // Obtenir les statistiques d'utilisation de l'IA
    getAIStats() {
        return {
            scenariosGenerated: this.scenarioCache.size,
            conversationLength: this.conversationHistory.length,
            cacheSize: this.scenarioCache.size
        };
    }
}

// Fonctions utilitaires UI
function showAILoading(show) {
    const loader = document.getElementById('ai-loading');
    if (loader) {
        loader.style.display = show ? 'block' : 'none';
    }
}

// Export global
const aiIntegration = new AIIntegration();
