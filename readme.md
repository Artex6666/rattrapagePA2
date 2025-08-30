CAHIER DES CHARGES - DRIV'N COOK
Missions 1 & 2 - Système d'Information
1. CONTEXTE ET OBJECTIFS
Contexte :
Driv'n Cook est une entreprise de food trucks basée à Paris (12ème arrondissement) qui propose des plats de qualité à base de produits frais et locaux. L'entreprise fonctionne en franchise et souhaite moderniser son système d'information.
Objectifs :
Gérer les franchisés et leurs activités
Améliorer l'expérience client
Automatiser les processus de gestion
2. ARCHITECTURE TECHNIQUE
Stack Technologique :
Front Office (Port 4000) : EJS + MVC Architecture
Back Office (Port 5000) : 
API (Port 3000) : Express.js + Node.js
Base de données : SQLITE 
Documentation API : Swagger
Architecture :
Architecture MVC (Model-View-Controller)
API RESTful
Séparation claire des responsabilités
Communication inter-services via HTTP
3. MISSION 1 : GESTION DES SERVICES FRANCHISÉS
3.1 Back-Office Driv'n Cook (Port 5000 - VueJS)
Gestion des Franchisés :
Enregistrement des nouveaux franchisés
Visualisation des informations personnelles et professionnelles
Suivi des documents fournis (preuve de virement, fichier PDF)
Gestion des franchisés
Tableau de bord des franchisés
Gestion du Parc de Camions :
Attribution des camions aux franchisés
Gestion des emplacements et déploiements
Suivi des pannes et maintenance
Carnet d'entretien des véhicules
Historique des interventions
Gestion des Entrepôts :
Suivi des stocks (80% obligatoire vs 20% libre)
Gestion des commandes d'approvisionnement
Contrôle des fournitures
Interface de gestion des 4 entrepôts d'Île-de-France
Gestion Financière :
Suivi des 4% du chiffre d'affaires
Historique des ventes par franchisé
Génération automatique de rapports PDF
Tableaux de bord financiers
3.2 Front-Office Franchisés (Port 4000 - EJS)
Espace Personnel :
Connexion sécurisée
Gestion du profil personnel
Tableau de bord des performances
Historique des ventes
Gestion des Commandes :
Interface de commande des stocks
Suivi des commandes en cours
Historique des approvisionnements
Respect du ratio 80/20
Gestion des Camions :
Consultation du carnet d'entretien
Signalement de pannes
Demande de maintenance
Suivi des interventions
Rapports et Statistiques :
Consultation des chiffres de vente
Téléchargement des rapports PDF
Analyses de performance
4. MISSION 2 : GESTION DES SERVICES CLIENTS
4.1 Front-Office Clients (Port 4000 - EJS)
Gestion des Menus :
Consultation des plats disponibles
Interface multilingue (français + anglais minimum)
Photos et descriptions des plats
Filtres par catégories et préférences
Système de Commandes :
Panier d'achat en ligne
Réservation à l'avance
Simulation de paiement
Confirmation de commande
Suivi du statut de la commande
Gestion des Comptes Clients :
Inscription et connexion
Profil personnel
Historique des commandes
Préférences alimentaires
4.2 Gestion des Cartes de Fidélité (Java)
Fonctionnalités :
Génération de cartes numériques imprimables
Système de points et récompenses
Réductions automatiques
Invitations aux dégustations
Prix réduits sur produits spéciaux
Interface de Gestion :
Dashboard des avantages
Historique des gains
Consultation des offres disponibles
4.3 Gestion des Événements
Types d'Événements :
Dégustations
Ventes de produits spéciaux
Événements promotionnels
Inscriptions et gestion des participants
Newsletter Mensuelle :
Envoi automatique des avantages
Personnalisation selon le profil client
Gestion des préférences de communication
5. FONCTIONNALITÉS TRANSVERSALES
5.1 Sécurité
Authentification JWT
Gestion des rôles et permissions
Chiffrement des données sensibles
Protection CSRF et XSS
5.2 Gestion des Erreurs
Codes d'erreur HTTP appropriés
Pages d'erreur personnalisées
Logs d'erreurs détaillés
Gestion des exceptions
5.3 Performance
Mise en cache des données
Optimisation des requêtes
Compression des réponses
Monitoring des performances
6. SPÉCIFICATIONS TECHNIQUES
6.1 Configuration Serveur
Réécriture d'URL (URL rewriting)
Gestion des codes d'erreur
Configuration HTTPS
Optimisation serveur web
6.2 Base de Données
Schéma normalisé
Indexation optimisée
Sauvegarde automatique
Gestion des transactions
6.3 API REST
Endpoints documentés avec Swagger
Validation des données
Gestion des versions
Rate limiting
7. LIVRABLES ATTENDUS
7.1 Code Source
Application Front-Office (EJS)
Application Back-Office (VueJS )
API Express.js
Scripts de déploiement
7.2 Documentation
Documentation technique complète
Guide d'utilisation
Guide de déploiement
Documentation API Swagger
7.3 Tests
Tests unitaires
Tests d'intégration
Tests de charge
Tests de sécurité
8. CONTRAINTES ET EXIGENCES
8.1 Contraintes Techniques
Respect de l'architecture MVC
Utilisation des ports spécifiés
Mise en place de Swagger
8.2 Contraintes Fonctionnelles
Gestion multilingue obligatoire
Génération automatique de rapports PDF
Contrôle du ratio 80/20 pour les stocks
Système de fidélité en Java
8.3 Contraintes de Performance
Temps de réponse < 2 secondes
Disponibilité 99.9%
Support de 1000 utilisateurs simultanés
9. PLAN DE DÉVELOPPEMENT
9.1 Phase 1 : Infrastructure
Configuration des serveurs
Mise en place de l'architecture
Configuration des bases de données
9.2 Phase 2 : API et Backend
Développement de l'API Express.js
Intégration de Swagger
9.3 Phase 3 : Frontend
Développement du Front-Office (EJS)
Développement du Back-Office (VueJS)
Intégration des composants
9.4 Phase 4 : Tests et Déploiement
Tests complets
Optimisation des performances
Déploiement en production
10. CRITÈRES DE VALIDATION
Respect de l'architecture MVC
Fonctionnement sur les ports spécifiés
Documentation Swagger fonctionnelle
Tests automatisés passants
Performance conforme aux exigences
Sécurité validée
Interface multilingue opérationnelle