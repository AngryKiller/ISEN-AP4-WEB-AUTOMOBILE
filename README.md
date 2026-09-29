# 🚗 Mon Garage — Application de Gestion de Véhicules

> **Projet scolaire d'ingénierie logicielle & web avancé (AP4)**  
> Application web monopage (SPA) moderne permettant de gérer une collection complète de véhicules, de suivre leur entretien, d'adapter leurs modes de conduite et d'exploiter les données ouvertes d'homologation automobile (API NHTSA & ADEME Open Data).

---

## 🎯 Objectif du projet

Le projet **Mon Garage** propose une interface fluide, réactive et ergonomique dédiée aux passionnés et gestionnaires de parc automobile.  
Développée en **TypeScript natif (sans framework lourd)** avec **Vite**, l'application met l'accent sur les bonnes pratiques d'architecture logicielle :
- **Architecture modulaire claire** (séparation strict des modèles, de l'état réactif, de l'accès aux API et des composants UI).
- **Gestion d'état réactive par Proxy** synchronisée avec le `localStorage`.
- **Intégration d'APIs tierces officielles** pour l'autocomplétion technique et le décodage VIN international (NHTSA & ADEME).
- **Accessibilité (a11y) et design soigné** : prise en charge complète des thèmes Clair / Sombre, animations CSS natives, et dialog modale HTML5.

---

## ✨ Fonctionnalités principales

### 1. Gestion de la collection (CRUD complet)
- **Ajout & Modification** : formulaire complet avec validation en temps réel des formats (plaque française, code VIN 17 caractères, pressions, années cohérentes).
- **Suppression avec confirmation visuelle**.
- **Gestion des favoris** : mise en avant instantanée avec micro-animation d'interaction.
- **Persistance locale** : sauvegarde automatique dans le `localStorage` du navigateur.

### 2. Décodage VIN intelligent (Double routage US / Europe)
L'application propose un décodage automatique lors de la saisie d'un numéro d'identification du véhicule (**VIN à 17 caractères**) :
- **Véhicules d'Amérique du Nord (VIN commençant par 1 à 5)** :  
  Interrogation directe de l'API officielle américaine **NHTSA VPIC** pour récupérer la marque, le modèle, l'année, le carburant certifié, le type de boîte de vitesses, la motricité (FWD/RWD/AWD) et la taille de jantes.
- **Véhicules Européens (VIN ISO 3779 commençant par S à Z, VF, WBA...)** :  
  Décodage instantané du préfixe **WMI** pour identifier la marque et le pays de fabrication (ex. `SJN` ➔ Nissan Royaume-Uni, `VF3` ➔ Peugeot France, `WBA` ➔ BMW Allemagne).  
  Dès la sélection du modèle, l'application interroge l'API Open Data **ADEME Car Labelling** (`data.gouv.fr`) pour préremplir la **consommation moyenne officielle mixte WLTP**, la motorisation exacte et la boîte de vitesses.
- **Transparence des sources** : pastilles visuelles dans le formulaire (`ADEME WLTP`, `NHTSA`) indiquant l'origine des données homologuées.
- **Badge d'origine géographique** : affichage du drapeau et pays d'assemblage sur chaque fiche véhicule (ex. 🇬🇧 Royaume-Uni, 🇫🇷 France, 🇩🇪 Allemagne).

### 3. Gestion technique & Entretien spécifique
- **Adaptation dynamique selon la motorisation** :
  - Pour les véhicules thermiques et hybrides : suivi de l'échéance de vidange (`nextOilChangeKm`) et de révision.
  - Pour les **véhicules 100% électriques** : suppression automatique de l'échéance de vidange (inutile sur moteur électrique) et masquage des objectifs de consommation en L/100 km au profit d'unités adaptées (kWh/100 km).
- **Surveillance pneumatique** : contrôle de la pression actuelle par rapport à la pression recommandée constructeur.
- **Capacités de chargement** : enregistrement du volume de coffre en litres (L) et motricité (Traction, Propulsion, Transmission intégrale 4x4).

### 4. Modes de conduite personnalisables
Chaque véhicule peut être basculé entre différents modes de conduite :
- 🚗 **Confort** / 🏎️ **Sport** / 🌱 **Éco** / 🌧️ **Pluie** / ❄️ **Hiver**.
- **Conseils dynamiques contextualisés** : les recommandations s'adaptent selon les caractéristiques du véhicule (ex. alertes spécifiques propulsion sur sol glissant, conseils d'éco-conduite et frein régénératif pour les véhicules électriques).
- **Réglages persistants par mode** : pression cible et objectifs de consommation configurables par véhicule.

### 5. Tableau de bord & KPIs
- Statistiques globales du garage calculées dynamiquement :
  - Nombre total de véhicules
  - Nombre de favoris
  - Valeur financière globale (€)
  - Kilométrage moyen (km)
  - **Volume total de chargement de coffre (L)**
- **Recherche plein texte** : filtrage instantané par marque, modèle, plaque d'immatriculation ou code VIN.
- **Filtres par énergie** : Tous, Favoris, Essence, Diesel, Hybride, Électrique.
- **Tris multiples** : par récence d'ajout, année, prix, kilométrage, marque alphabétique et **volume de coffre décroissant**.

---

## 🛠️ Stack technique & Architecture

- **Langage** : TypeScript 5+ (typage strict, interfaces complètes, pas de `any` implicite).
- **Bundler & Serveur de développement** : Vite.
- **Persistance** : `localStorage` avec sérialisation/désérialisation sécurisée.
- **Architecture logicielle** :
  ```
  src/
  ├── core/            # Cœur de l'application
  │   ├── api.ts       # Clients API distants (NHTSA VPIC, ADEME Car Labelling, table WMI)
  │   ├── store.ts     # État global réactif (Proxy pattern) et calculs statistiques
  │   └── storage.ts   # Couche d'accès au localStorage
  ├── models/          # Définitions des types et interfaces TypeScript
  │   ├── api.model.ts     # Modèles de réponses NHTSA et ADEME
  │   ├── store.model.ts   # Modèles du store, tris et filtres
  │   └── vehicle.model.ts # Modèle d'entité Véhicule et constantes métier
  ├── features/        # Modules fonctionnels découplés
  │   ├── driving-mode/# Gestion et recommandations des modes de conduite
  │   ├── form/        # Logique modale, validation et autocomplétion
  │   ├── stats/       # Rendu des compteurs et statistiques du garage
  │   ├── theme/       # Gestion du thème sombre / clair
  │   └── vehicles/    # Cartes véhicules et gestion du DOM
  ├── styles/          # Feuilles de style CSS modernes (variables, grid, transitions)
  ├── utils/           # Fonctions utilitaires pures (formatage devise, debounce, toasts)
  └── main.ts          # Point d'entrée de l'application (orchestrateur d'événements)
  ```

---

## 🚀 Installation et exécution

### Prérequis
- [Node.js](https://nodejs.org/) (version 18 ou supérieure recommandée)
- `npm`

### 1. Cloner le dépôt et installer les dépendances
```bash
git clone <url-du-depot>
cd projet-automobile
npm install
```

### 2. Démarrer le serveur de développement
```bash
npm run dev
```
L'application est accessible par défaut sur `http://localhost:5173`.

### 3. Vérification des types TypeScript
```bash
npm run typecheck
```

### 4. Compiler pour la production
```bash
npm run build
```
Les fichiers statiques optimisés sont générés dans le dossier `dist/`.

---

## 🌐 Données & APIs utilisées

1. **[NHTSA VPIC API](https://vpic.nhtsa.dot.gov/api/)** (National Highway Traffic Safety Administration - USA) :  
   API publique ouverte pour le décodage VIN complet et les modèles internationaux.
2. **[ADEME - Car Labelling Open Data](https://data.ademe.fr/)** (data.gouv.fr - France) :  
   Jeu de données officiel des consommations conventionnelles, motorisations et caractéristiques des véhicules commercialisés en France.
3. **Norme ISO 3779 (WMI)** :  
   Standard international pour la reconnaissance des constructeurs et pays d'origine par le code VIN mondial.