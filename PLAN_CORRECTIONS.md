# PLAN DE CORRECTIONS — SIGBA

> Analyse d'incohérences de flux par rôle utilisateur par rapport au CDC v1.1
> Royal Air Maroc — Système d'Information Centralisé de Gestion des Badges Aéroportuaires

---

## TABLE DES MATIÈRES

1. [Incohérences transversales (tous rôles)](#1-incohérences-transversales-tous-rôles)
2. [Super-Admin](#2-super-admin)
3. [Manager](#3-manager)
4. [Employé](#4-employé)
5. [Agent de Sûreté](#5-agent-de-sûreté)
6. [Incohérences de nommage / contexte](#6-incohérences-de-nommage--contexte)
7. [Résumé des scores de conformité](#7-résumé-des-scores-de-conformité)
8. [Priorisation recommandée](#8-priorisation-recommandée)

---

## 1. Incohérences transversales (tous rôles)

Ces problèmes affectent **l'ensemble des utilisateurs** et doivent être traités en priorité absolue.

### 1.1 Page « Paramètres » totalement absente

- **Exigence CDC (§9.1)** : Chaque sidebar doit comporter « Paramètres » et « Déconnexion » en bas, fixes et identiques sur les 4 rôles.
- **Implémentation** : Il n'existe aucune page `/parametres`, aucune route dans `App.jsx`, aucun composant `Parametres.jsx`.
- **Impact** : Aucun utilisateur ne peut gérer son profil, changer son mot de passe ou ses préférences.
- **Fichier à créer** : `frontend/src/pages/Parametres.jsx`
- **Fichier à modifier** : `App.jsx` (ajouter route), `Layout.jsx` (ajouter nav item dans les 4 rôles)

### 1.2 Absence de guards de rôle côté front

- **Exigence CDC** : RBAC basé sur les rôles (§4, RF1.0).
- **Implémentation** : `App.jsx` — `ProtectedRoute` vérifie uniquement `localStorage.getItem('token')`. Aucune vérification de rôle.
- **Impact** : Un Manager peut accéder à `/simulation`, `/consultation` ou `/agents` en tapant l'URL directement. Faille de sécurité UX.
- **Fichier à modifier** : `App.jsx` — ajouter un composant `RoleGuard` qui vérifie le rôle de l'utilisateur avant de rendre la route.

### 1.3 Absence de librairie de graphisme

- **Exigence CDC** : Les dashboards Super-Admin (§9.2.1) et Agent de Sûreté (§9.5.1) requièrent des graphiques.
- **Implémentation** : Aucune librairie installée (pas de recharts, chart.js, etc.).
- **Impact** : Tous les graphiques des dashboards sont absents.
- **Action** : Installer `recharts` (ou équivalent) via `npm install recharts`.

### 1.4 Noms de rôles incohérents entre Java/Keycloak/Frontend

- **Enum Java** : `AGENT_SURETE`
- **Keycloak + `@PreAuthorize`** : `AGENT_SECURITE`
- **Frontend** : `AGENT_SURETE`
- **Impact** : Risque de 403 silencieux si un développeur utilise le mauvais nom dans une annotation.
- **Fichiers concernés** :
  - `backend/.../entity/enums/UserRole.java`
  - `backend/.../service/KeycloakService.java` (ligne 65)
  - Tous les `@PreAuthorize` des controllers
  - `frontend/src/components/Layout.jsx`
  - `frontend/src/pages/DashboardRouter.jsx`
- **Action** : Unifier sur un seul nom (recommandé : `AGENT_SURETE` partout).

---

## 2. Super-Admin

### 2.1 Sidebar — Manque « Paramètres », ajoute « Managers »

| Élément CDC | État | Action |
|---|---|---|
| Tableau de bord | ✅ | — |
| Directions RAM | ✅ | — |
| Agents de sûreté | ✅ | — |
| Consultation globale | ✅ | — |
| Rapports | ✅ | — |
| Simulation de passage | ✅ | — |
| **Paramètres** | ✅ Fait | Ajouter nav item + route |
| Déconnexion | ✅ | — |
| **Managers** (non prévu CDC) | ⚠️ Présent | Garder — utile pour RF1.1, mais absente du CDC. À valider. |

### 2.2 Dashboard — Éléments visuels manquants

| Exigence CDC (§9.2.1) | État | Fichier | Action |
|---|---|---|---|
| 4 cartes statistiques badges | ✅ | `Dashboard.jsx` | — |
| **Graphique évolution demandes 30j** | ✅ Fait | `Dashboard.jsx` | Ajouter avec `recharts` (BarChart) |
| **Graphique répartition badges par zone** | ✅ Fait | `Dashboard.jsx` | Ajouter avec `recharts` (PieChart) |
| **Liste alertes récentes (5 dernières)** | ✅ Fait | `Dashboard.jsx` | Ajouter section avec données du backend |
| Cartes extras (employés, incidents, passages) | ⚠️ | `Dashboard.jsx` | Non prévues au CDC — garder ou retirer selon besoin |

### 2.3 Consultation globale — Quasi-vide

| Exigence CDC (§9.2.7) | État | Fichier | Action |
|---|---|---|---|
| **Filtre direction** | ❌ | `ConsultationGlobale.jsx` | Ajouter `<select>` avec appels API |
| **Filtre employé** | ❌ | `ConsultationGlobale.jsx` | Ajouter champ recherche |
| **Filtre zone** | ❌ | `ConsultationGlobale.jsx` | Ajouter `<select>` zones |
| **Filtre période** | ❌ | `ConsultationGlobale.jsx` | Ajouter date range picker |
| **Filtre statut badge** | ❌ | `ConsultationGlobale.jsx` | Ajouter `<select>` statuts |
| Lecture seule | ✅ | — | — |
| Tableau paginé | ✅ | — | — |
| **Vue détail dossier** | ❌ | `ConsultationGlobale.jsx` | Ajouter clic sur ligne → modal ou page détail |

### 2.4 Rapports — Pas d'export

| Exigence CDC (§9.2.8) | État | Fichier | Action |
|---|---|---|---|
| Sélecteurs critères (date) | ✅ | `Rapports.jsx` | — |
| Sélecteurs critères (direction, zone) | ❌ | `Rapports.jsx` | Ajouter filtres supplémentaires |
| **Export PDF** | ✅ Fait | `Rapports.jsx` | Implémenter (jspdf ou appel backend) |
| **Export CSV** | ✅ Fait | `Rapports.jsx` | Implémenter (génération côté client ou backend) |
| **Historique exports** | ❌ | `Rapports.jsx` | Ajouter section historique |

---

## 3. Manager

### 3.1 Sidebar — Manque « Paramètres »

| Élément CDC | État |
|---|---|
| Tableau de bord | ✅ |
| Validations en attente (N1) | ✅ |
| Employés de la direction | ✅ |
| Invitations | ✅ |
| Incidents | ✅ |
| **Paramètres** | ✅ Fait |
| Déconnexion | ✅ |

### 3.2 Dashboard — Absence d'employés et d'alertes

| Exigence CDC (§9.3.1) | État | Fichier | Action |
|---|---|---|---|
| Carte demandes N1 (cliquable) | ✅ | `ManagerDashboard.jsx` | — |
| **Liste employés direction + pastilles 4 couleurs** | ❌ | `ManagerDashboard.jsx` | Ajouter tableau avec vert/orange/rouge/gris |
| **Bloc alertes expiration < 30 jours** | ❌ | `ManagerDashboard.jsx` | Ajouter section avec données backend |
| Badges direction (extras) | ⚠️ | `ManagerDashboard.jsx` | Non prévu CDC |
| Incidents en cours (extras) | ⚠️ | `ManagerDashboard.jsx` | Non prévu CDC |
| Passages (extras) | ⚠️ | `ManagerDashboard.jsx` | Non prévu CDC |

### 3.3 Validation N1 — Visionneuse et justifications manquantes

| Exigence CDC (§9.3.3) | État | Fichier | Action |
|---|---|---|---|
| Bloc identité employé | ✅ | `ValidationsN1.jsx` | — |
| **Visionneuse pièces justificatives (image/PDF)** | ✅ Fait | `ValidationsN1.jsx` | Ajouter viewer (iframe, img, ou modal dédié) |
| Sélecteur zones (cases à cocher) | ✅ | `ValidationsN1.jsx` | — |
| **Justification texte PAR ZONE** | ❌ | `ValidationsN1.jsx` | Remplacer textarea unique par un input par zone cochée |
| Boutons Pré-approuver / Refuser | ✅ | `ValidationsN1.jsx` | — |
| Refus = motif obligatoire | ✅ | `ValidationsN1.jsx` | — |
| Validation impossible si 0 zone cochée | ✅ | `ValidationsN1.jsx` | — |
| **Colonne ancienneté dans le tableau** | ❌ | `ValidationsN1.jsx` | Ajouter colonne calculée (date.now - createdAt) |

### 3.4 Employés direction — Colonnes et détail manquants

| Exigence CDC (§9.3.4) | État | Fichier | Action |
|---|---|---|---|
| Recherche / filtre | ✅ | `EmployesDirection.jsx` | — |
| Colonne nom | ✅ | `EmployesDirection.jsx` | — |
| Colonne statut badge | ✅ | `EmployesDirection.jsx` | — |
| **Colonne zones habilitées** | ❌ | `EmployesDirection.jsx` | Ajouter |
| **Colonne date expiration** | ❌ | `EmployesDirection.jsx` | Ajouter |
| **4 couleurs pastilles** (vert/orange/rouge/gris) | ❌ | `EmployesDirection.jsx` | Remplacer les 2 classes actuelles par 4 |
| **Clic → fiche employé lecture seule** | ❌ | `EmployesDirection.jsx` | Ajouter modal ou route détail |
| Cloisonnement strict par direction | ✅ | Backend | — |

### 3.5 Invitations — Légères divergences

| Exigence CDC (§9.3.5) | État | Fichier | Action |
|---|---|---|---|
| Bouton « Inviter employé » | ✅ | `Invitations.jsx` | — |
| Champ email | ✅ | `Invitations.jsx` | — |
| Génération code unique | ✅ | `Invitations.jsx` | Code affiché dans la table |
| **Afficher le code de manière prominente à la création** | ❌ | `Invitations.jsx` | Ajouter notification/modale avec le code généré |
| Historique invitations | ✅ | `Invitations.jsx` | — |
| Statuts en attente / utilisée / expirée | ✅ | `Invitations.jsx` | — |

### 3.6 Incidents — Sélection employé et confirmation

| Exigence CDC (§9.3.6) | État | Fichier | Action |
|---|---|---|---|
| **Sélection employé par NOM** (pas ID badge) | ❌ | `IncidentsManager.jsx` | Remplacer input ID par un dropdown des employés de la direction |
| Sélecteur motif (Perte/Vol/Fin de contrat) | ✅ | `IncidentsManager.jsx` | — |
| **Champ date** | ❌ | `IncidentsManager.jsx` | Ajouter champ date (ou auto-remplir date du jour) |
| Commentaire | ✅ | `IncidentsManager.jsx` | — |
| **Modale de confirmation** | ❌ | `IncidentsManager.jsx` | Ajouter avant soumission |

---

## 4. Employé

### 4.1 Sidebar — Manque « Paramètres »

| Élément CDC | État |
|---|---|
| Tableau de bord | ✅ |
| Ma demande de badge | ✅ |
| Mon historique | ✅ |
| **Paramètres** | ✅ Fait |
| Déconnexion | ✅ |

### 4.2 Dashboard — Statuts incomplets

| Exigence CDC (§9.4.2) | État | Fichier | Action |
|---|---|---|---|
| **Pastille visuelle avec les 8 statuts** (Aucune demande, En attente N1, En attente N2, Actif, Refusé, Suspendu, Révoqué, Expiré) | ✅ Fait | `EmployeDashboard.jsx` | Ajouter les 6 statuts manquants avec couleurs distinctes |
| **Bouton contextuel « Soumettre demande »** | ✅ Fait | `EmployeDashboard.jsx` | Ajouter bouton conditionnel quand aucune demande en cours |
| Raccourci historique passages | ✅ | `EmployesDirection.jsx` | — |

### 4.3 Soumission de demande — Upload et timeline

| Exigence CDC (§9.4.3, §9.4.4) | État | Fichier | Action |
|---|---|---|---|
| **Upload fichier réel** (pièce identité, attestations, justification) | ✅ Fait | `MaDemande.jsx` | Remplacer les champs URL `<input type="url">` par de vrais `<input type="file">` avec stockage |
| Timeline 4 étapes | ✅ | `MaDemande.jsx` | — |
| Étape courante en évidence | ✅ | `MaDemande.jsx` | — |
| Motif si refus | ✅ | `MaDemande.jsx` | — |
| **Statut `SOUMISE` (code mort)** | ✅ Fait | `MaDemande.jsx` (lignes 77, 88, 96) | Retirer `SOUMISE` du tableau `steps` — ce statut n'existe pas dans l'enum backend |

### 4.4 Déclaration d'incident — Avertissement et UX

| Exigence CDC (§9.4.5) | État | Fichier | Action |
|---|---|---|---|
| Bouton dédié « Signaler une perte ou un vol » | ✅ | `MaDemande.jsx` | — |
| **Modale avec texte d'avertissement** : « Cette action suspendra immédiatement votre badge, confirmez-vous ? » | ✅ Fait | `MaDemande.jsx` | Ajouter ce texte exact dans la modale |
| **ID badge auto-rempli** | ❌ | `MaDemande.jsx` | Pré-remplir avec l'ID du badge actif au lieu de demander une saisie manuelle |
| Confirmation / Annuler | ✅ | `MaDemande.jsx` | — |

### 4.5 Mon historique — Filtre manquant

| Exigence CDC (§9.4.6) | État | Fichier | Action |
|---|---|---|---|
| **Filtre par période** | ❌ | `MonHistorique.jsx` | Ajouter date range picker |
| Tableau (date/heure, zone, résultat) | ✅ | `MonHistorique.jsx` | — |

### 4.6 Inscription — Email non affiché

| Exigence CDC (§9.4.1) | État | Fichier | Action |
|---|---|---|---|
| Code d'invitation | ✅ | `Inscription.jsx` | — |
| Champs nom, prénom, mot de passe | ✅ | `Inscription.jsx` | — |
| **Email pro RAM visible** (lecture seule pour confirmation) | ❌ | `Inscription.jsx` | Afficher l'email lié à l'invitation en lecture seule |

---

## 5. Agent de Sûreté

### 5.1 Sidebar — Manque « Paramètres »

| Élément CDC | État |
|---|---|
| Tableau de bord | ✅ |
| Dossiers RAM à instruire (N2) | ✅ |
| Incidents / Révocations | ✅ |
| Historique global | ✅ |
| Rapports d'audit | ✅ |
| **Paramètres** | ✅ Fait |
| Déconnexion | ✅ |

### 5.2 Dashboard — Graphiques et listes manquants

| Exigence CDC (§9.5.1) | État | Fichier | Action |
|---|---|---|---|
| Compteur dossiers à instruire (lien direct) | ✅ | `SureteDashboard.jsx` | — |
| **Compteur alertes révocation en cours** (distinct des incidents généraux) | ❌ | `SureteDashboard.jsx` | Séparer les incidents en cours des alertes révocation |
| **Graphique badges actifs par zone** | ❌ | `SureteDashboard.jsx` | Ajouter avec `recharts` (BarChart) |
| **Liste dossiers les plus anciens en attente** | ❌ | `SureteDashboard.jsx` | Ajouter tableau trié par ancienneté |
| **Mise en avant si délai dépassé** | ❌ | `SureteDashboard.jsx` | Ajouter logique de SLA + mise en forme rouge |

### 5.3 Dossiers N2 — BUG CRITIQUE + manques

| Exigence CDC (§9.5.3) | État | Fichier | Action |
|---|---|---|---|
| Tableau (employé, direction, date N1, zones demandées) | ⚠️ | `DossiersN2.jsx` | Colonnes manquantes : date pré-approbation N1, zones demandées |
| **Visionneuse pièces justificatives** | ✅ Fait | `DossiersN2.jsx` | Ajouter viewer image/PDF |
| Checklist conformité (3 cases) | ✅ | `DossiersN2.jsx` | — |
| **Choix individuel Valider/Refuser PAR ZONE** | ❌ | `DossiersN2.jsx` | Remplacer checkbox binaire par radio Valider/Refuser par zone |
| Bouton Valider badge (génère UID) | ✅ | `DossiersN2.jsx` | — |
| **Champ motif refus (INPUT)** | ❌ | `DossiersN2.jsx` | **BUG** : `motifRefus` existe en state mais aucun `<input>` n'y est lié → le refus est impossible |
| Checklist incomplète = validation désactivée | ✅ | `DossiersN2.jsx` | — |
| **Modale confirmation avant validation/refus** | ❌ | `DossiersN2.jsx` | Ajouter |

### 5.4 Incidents / Révocations — Colonnes et notifications

| Exigence CDC (§9.5.4) | État | Fichier | Action |
|---|---|---|---|
| Liste signalements | ✅ | `IncidentsSurete.jsx` | — |
| **Colonne employé** (propriétaire du badge) | ❌ | `IncidentsSurete.jsx` | Ajouter (affiche `signalantNom` au lieu du propriétaire) |
| **Colonne direction** | ❌ | `IncidentsSurete.jsx` | Ajouter |
| **Colonne motif détaillé** | ❌ | `IncidentsSurete.jsx` | Ajouter |
| Colonne date | ✅ | `IncidentsSurete.jsx` | — |
| Colonne statut | ✅ | `IncidentsSurete.jsx` | — |
| Bouton Confirmer révocation | ✅ | `IncidentsSurete.jsx` | — |
| Bouton Lever suspension | ✅ | `IncidentsSurete.jsx` | — |
| **Modale confirmation avant action** | ❌ | `IncidentsSurete.jsx` | Ajouter |
| **Système de notifications (RF2.3)** | ❌ | Global | Implémenter (WebSocket ou polling) pour avertir l'agent de nouveaux signalements |

### 5.5 Historique global — Filtres et export absents

| Exigence CDC (§9.5.5) | État | Fichier | Action |
|---|---|---|---|
| **Filtre période** | ❌ | `HistoriqueGlobal.jsx` | Ajouter date range |
| **Filtre direction** | ❌ | `HistoriqueGlobal.jsx` | Ajouter `<select>` directions |
| **Filtre employé** | ❌ | `HistoriqueGlobal.jsx` | Ajouter champ recherche |
| Filtre zone | ⚠️ | `HistoriqueGlobal.jsx` | Existe mais par **ID numérique** — remplacer par `<select>` avec noms |
| **Filtre résultat** (Autorisé/Refusé) | ❌ | `HistoriqueGlobal.jsx` | Ajouter `<select>` |
| Tableau paginé | ✅ | `HistoriqueGlobal.jsx` | — |
| **Export CSV/PDF** | ❌ | `HistoriqueGlobal.jsx` | Implémenter |
| **Vue détail passage** | ❌ | `HistoriqueGlobal.jsx` | Ajouter clic → modal ou page détail |

### 5.6 Rapports d'audit — Export absent (RF3.4)

| Exigence CDC (§9.5.6) | État | Fichier | Action |
|---|---|---|---|
| Sélection critères | ⚠️ | `Rapports.jsx` | Seulement dates — ajouter direction, zone |
| Génération | ✅ | `Rapports.jsx` | — |
| **Export PDF/CSV (RF3.4)** | ❌ | `Rapports.jsx` | Implémenter — exigence critique non satisfaite |
| **Historique exports** | ❌ | `Rapports.jsx` | Ajouter |

---

## 6. Incohérences de nommage / contexte

### 6.1 Rôle `AGENT_SURETE` vs `AGENT_SECURITE` ✅ CORRIGÉ

| Couche | Nom utilisé |
|---|---|
| Enum Java (`UserRole.java`) | `AGENT_SURETE` |
| Keycloak (realm role) | `AGENT_SURETE` (à renommer dans Keycloak admin) |
| Annotations `@PreAuthorize` | `AGENT_SURETE` |
| Frontend (`Layout.jsx`, `DashboardRouter.jsx`) | `AGENT_SURETE` |

**Résolution recommandée** : Unifier sur `AGENT_SURETE` (cohérent avec le CDC et le frontend). ✅ Fait

### 6.2 Statut `SOUMISE` — Code mort

- `MaDemande.jsx` référence `SOUMISE` dans `steps`, `getStatutClass`, `statutLabels`.
- L'enum `DemandeStatut.java` ne contient **pas** `SOUMISE`.
- **Action** : Retirer toutes les références à `SOUMISE` dans `MaDemande.jsx`.

### 6.3 Nommage mixte FR/EN dans les routes API

| Route (FR) | Route (EN) |
|---|---|
| `/api/directions` | `/api/auth` |
| `/api/demandes` | `/api/badges` |
| `/api/employes` | `/api/managers` |
| `/api/agents-surete` | `/api/reports` |
| `/api/passages` | `/api/notifications` |
| `/api/habilitations` | `/api/incidents` |

**Impact** : Incohérent mais fonctionnel. À unifier si le temps le permet.

### 6.4 Nommage mixte FR/EN dans les méthodes Java

| FR | EN |
|---|---|
| `listerManagers()`, `creerManager()`, `envoyerEmailActivation()` | `getCurrentUser()`, `toResponseDTO()` |

**Impact** : Mineur — à harmoniser progressivement.

### 6.5 Redirect URI vs documentation

- **Code** (`KeycloakService.java`) : `http://localhost:5173`
- **Documentation** (`TACHES_BACKEND.md`) : `http://localhost:3000`
- **Action** : Mettre à jour la documentation.

### 6.6 `KeycloakConfig` — clientId contradictoire

- **Défaut Java** : `sigba-backend`
- **`application.properties`** : `sigba-frontend`
- **`KeycloakService`** utilise : `admin-cli` (ignoré les deux)
- **Action** : Nettoyer la configuration morte.

---

## 7. Résumé des scores de conformité

| Rôle | Sidebar | Dashboard | Pages métier | RF spécifiques | **Global** |
|---|---|---|---|---|---|
| Super-Admin | 75% | 25% | ~20% | 100% | **~40%** |
| Manager | 80% | 30% | ~55% | 60% | **~45%** |
| Employé | 80% | 30% | ~50% | 70% | **~45%** |
| Agent Sûreté | 80% | 30% | ~40% | 20% | **~35%** |

---

## 8. Priorisation recommandée

### Priorité 1 — Bloquante (fonctionnalités cassées)

| # | Tâche | Rôle | Fichier(s) |
|---|---|---|---|
| 1 | ✅ **Corriger le bug refus N2** — ajouter `<input>` lié à `motifRefus` | Agent Sûreté | `DossiersN2.jsx` |
| 2 | ✅ **Page Paramètres** — créer le composant + route + nav items | Tous | `Parametres.jsx`, `App.jsx`, `Layout.jsx` |
| 3 | ✅ **Guards de rôle** — empêcher l'accès aux routes non autorisées | Tous | `App.jsx`, `RoleGuard.jsx` |
| 4 | ✅ **Unifier nom de rôle** — `AGENT_SURETE` partout | Transversal | `KeycloakService.java`, tous `@PreAuthorize` |

### Priorité 2 — Haute (exigences CDC non satisfaites)

| # | Tâche | Rôle | Fichier(s) |
|---|---|---|---|
| 5 | ✅ **Upload réel de fichiers** — remplacer champs URL par `<input type="file">` | Employé | `MaDemande.jsx` |
| 6 | ✅ **Visionneuse pièces justificatives** — ajouter viewer N1 ET N2 | Manager, Agent | `ValidationsN1.jsx`, `DossiersN2.jsx` |
| 7 | ✅ **Dashboard Super-Admin** — graphiques + alertes | Super-Admin | `Dashboard.jsx` |
| 8 | ✅ **Dashboard Agent** — graph badges par zone + dossiers anciens | Agent Sûreté | `SureteDashboard.jsx` |
| 9 | ✅ **Dashboard Manager** — liste employés + pastilles 4 couleurs | Manager | `ManagerDashboard.jsx` |
| 10 | ✅ **Dashboard Employé** — 8 statuts + bouton contextuel | Employé | `EmployeDashboard.jsx` |
| 11 | ✅ **Consultation globale** — 5 filtres + vue détail | Super-Admin | `ConsultationGlobale.jsx` |
| 12 | ✅ **Export PDF/CSV** — rapports + historique global | Super-Admin, Agent | `Rapports.jsx`, `HistoriqueGlobal.jsx` |

### Priorité 3 — Moyenne (améliorations UX)

| # | Tâche | Rôle | Fichier(s) |
|---|---|---|---|
| 13 | ✅ **Justification par zone** en N1 — input par zone au lieu d'un seul | Manager | `ValidationsN1.jsx` |
| 14 | ✅ **Valider/Refuser par zone** en N2 — radio par zone au lieu de checkbox | Agent Sûreté | `DossiersN2.jsx` |
| 15 | ✅ **Filtres historique** — période, direction, employé, résultat | Employé, Agent | `MonHistorique.jsx`, `HistoriqueGlobal.jsx` |
| 16 | ✅ **Sélection employé incidents** — dropdown au lieu d'ID badge | Manager | `IncidentsManager.jsx` |
| 17 | ✅ **Texte avert. incident** — « Cette action suspendra... » | Employé | `MaDemande.jsx` |
| 18 | ✅ **Modales de confirmation** — avant révocation, refus, incident | Manager, Agent | `IncidentsManager.jsx`, `IncidentsSurete.jsx`, `DossiersN2.jsx` |
| 19 | **Notifications** (RF2.3) — avertir l'agent de nouveaux signalements | Agent Sûreté | Backend + Frontend |
| 20 | ✅ **Employés direction** — colonnes zones habilitées + date expiration + détail | Manager | `EmployesDirection.jsx` |
| 21 | ✅ **Colonnes incidents** — direction, motif, employé propriétaire | Agent Sûreté | `IncidentsSurete.jsx` |

### Priorité 4 — Basse (nettoyage)

| # | Tâche | Rôle | Fichier(s) |
|---|---|---|---|
| 22 | ✅ Retirer `SOUMISE` (code mort) | Employé | `MaDemande.jsx` |
| 23 | Afficher email en lecture seule à l'inscription | Employé | `Inscription.jsx` |
| 24 | Afficher code invitation de manière prominente | Manager | `Invitations.jsx` |
| 25 | ✅ Nettoyer config morte `KeycloakConfig` | Backend | `KeycloakConfig.java`, `application.properties` |
| 26 | Mettre à jour `TACHES_BACKEND.md` (port 3000 → 5173) | Docs | `TACHES_BACKEND.md` |
| 27 | Harmoniser nommage FR/EN routes + méthodes | Transversal | Controllers + Services |

---

> **Total des tâches** : 27
> **Estimation** : La priorité 1 est estimée à ~2h, la priorité 2 à ~8h, la priorité 3 à ~6h, la priorité 4 à ~2h.
> **Durée totale estimée** : ~18h de développement.
