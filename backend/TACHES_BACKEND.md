# Tâches Backend — SIGBA (Royal Air Maroc)

## 1. Infrastructure & Setup

- [x] Initialiser le projet backend (Spring Boot 4.1.0, Java 21, package `ma.ram.sigba`)
- [x] Dépendances configurées (Spring Data JPA, Security, OAuth2 Resource Server, PostgreSQL, Lombok, Validation, WebMVC)
- [ ] Configurer la base de données relationnelle (SQL) et les connexions
- [ ] Mettre en place les outils de migration de base de données (ex: Flyway, Alembic, Liquibase)
- [ ] Configurer l'intégration avec Keycloak pour l'authentification
- [ ] Mettre en place le système de logging (journalisation des actions admin - RF3.5)
- [ ] Configurer la gestion des erreurs et les réponses API standardisées
- [ ] Mettre en place les hooks de validation et les middlewares de sécurité

---

## 2. Modèles de Données (Entités)

### 2.1 Utilisateurs & Authentification
- [ ] Entité `User` (id, email, nom, prénom, matricule, rôle, statut, direction_id, created_at, updated_at)
- [ ] Entité `Direction` (id, nom, code_direction, manager_id, statut, created_at, updated_at)
- [ ] Entité `Invitation` (id, code_unique, email_destinataire, direction_id, manager_id, statut, date_expiration, created_at)
- [ ] Mapper les rôles Keycloak (Super-Admin, Manager, Employé, Agent de Sûreté) aux rôles backend

### 2.2 Workflow de Demande
- [ ] Entité `Demande` (id, employe_id, statut, motif_refus, created_at, updated_at)
  - Statuts : `EN_ATTENTE_N1`, `EN_ATTENTE_N2`, `VALIDEE`, `REFUSEE_N1`, `REFUSEE_N2`
- [ ] Entité `PieceJustificative` (id, demande_id, type_piece, fichier_url, created_at)
  - Types : `CASIER_JUDICIAIRE`, `ATTESTATIONFORMATION`, `JUSTIFICATION_POSTE`, `PIECE_IDENTITE`
- [ ] Entité `ValidationN1` (id, demande_id, manager_id, decision, zones_demandees, justifications, date_validation, motif_refus)
- [ ] Entité `ValidationN2` (id, demande_id, agent_id, decision, checklist_conformite, date_validation, motif_refus)
- [ ] Entité `ZoneDemandee` (id, demande_id, zone_id, justification, statut_n1, statut_n2)

### 2.3 Gestion des Badges
- [ ] Entité `Badge` (id, uid_unique, employe_id, demande_id, statut, date_emission, date_expiration, date_suspension, date_revocation, created_at, updated_at)
  - Statuts : `ACTIF`, `SUSPENDU`, `REVOQUE`, `EXPIRE`, `EN_ATTENTE`
- [ ] Entité `Zone` (id, nom, code, description)
  - Zones : `PISTES`, `TRI_BAGAGES`, `ZONES_RESERVEES`
- [ ] Entité `Habilitation` (id, badge_id, zone_id, date_attribution, date_revocation, statut)
  - Statuts : `ACTIVE`, `REVOQUEE`

### 2.4 Gestion des Incidents
- [ ] Entité `Incident` (id, badge_id, signalant_id, type_incident, date_incident, commentaire, statut, date_traitement, agent_id)
  - Types : `PERTE`, `VOL`, `FIN_CONTRAT`
  - Statuts : `SUSPENDU`, `REVOQUE`, `LEVE`
- [ ] Entité `Notification` (id, destinataire_id, type_notification, message, lu, lien_element, created_at)
  - Types : `INCIDENT_SIGNAL`, `DEMANDE_N1`, `DEMANDE_N2`, `VALIDATION`, `REFUS`, `EXPIRATION`

### 2.5 Traçabilité & Historique
- [ ] Entité `Passage` (id, uid_badge, zone_id, employe_id, direction_id, horodatage, resultat)
  - Résultats : `AUTORISE`, `REFUSE`
- [ ] Entité `JournalAdmin` (id, auteur_id, action, cible_type, cible_id, details, horodatage)

---

## 3. Endpoints API REST

### 3.1 Authentification
- [ ] `POST /api/auth/login` — Connexion via Keycloak
- [ ] `POST /api/auth/refresh` — Rafraîchir le token
- [ ] `POST /api/auth/logout` — Déconnexion
- [ ] `GET /api/auth/me` — Profil utilisateur connecté

### 3.2 Gestion des Directions (Super-Admin)
- [ ] `GET /api/directions` — Lister les directions (avec filtres, pagination)
- [ ] `POST /api/directions` — Créer une direction
- [ ] `PUT /api/directions/:id` — Modifier une direction
- [ ] `PATCH /api/directions/:id/disable` — Désactiver une direction
- [ ] `GET /api/directions/:id/employes` — Employés d'une direction

### 3.3 Gestion des Agents de Sûreté (Super-Admin)
- [ ] `GET /api/agents-surete` — Lister les agents
- [ ] `POST /api/agents-surete` — Créer un agent (création Keycloak)
- [ ] `PUT /api/agents-surete/:id` — Modifier un agent
- [ ] `PATCH /api/agents-surete/:id/revoke` — Révoquer l'accès d'un agent

### 3.4 Gestion des Invitations (Manager)
- [ ] `POST /api/invitations` — Générer un code d'invitation
- [ ] `GET /api/invitations` — Lister les invitations de la direction
- [ ] `POST /api/invitations/:code/accept` — Accepter une invitation (inscription employé)
- [ ] `PATCH /api/invitations/:id/revoke` — Révoquer une invitation

### 3.5 Inscription Employé
- [ ] `POST /api/employes/register` — Créer un compte via code d'invitation
- [ ] `GET /api/employes/profile` — Profil de l'employé connecté
- [ ] `PUT /api/employes/profile` — Modifier son profil

### 3.6 Workflow de Demande de Badge
- [ ] `POST /api/demandes` — Soumettre une demande de badge (avec upload pièces)
- [ ] `GET /api/demandes` — Lister les demandes (selon rôle : employé=les siennes, manager=sa direction, surete=toutes en attente N2)
- [ ] `GET /api/demandes/:id` — Détail d'une demande
- [ ] `GET /api/demandes/:id/pieces` — Télécharger les pièces justificatives
- [ ] `POST /api/demandes/:id/validate-n1` — Validation N1 (Manager) — inclut sélection des zones
- [ ] `POST /api/demandes/:id/refuse-n1` — Refus N1 (Manager) — motif obligatoire
- [ ] `POST /api/demandes/:id/validate-n2` — Validation N2 (Agent Sûreté) — génère le badge + UID
- [ ] `POST /api/demandes/:id/refuse-n2` — Refus N2 (Agent Sûreté) — motif obligatoire

### 3.7 Gestion des Badges
- [ ] `GET /api/badges` — Lister les badges (selon rôle et cloisonnement)
- [ ] `GET /api/badges/:id` — Détail d'un badge
- [ ] `GET /api/badges/:id/habilitations` — Habilitations d'un badge
- [ ] `PATCH /api/badges/:id/suspend` — Suspendre un badge (incident)
- [ ] `PATCH /api/badges/:id/revoke` — Révoquer définitivement (Agent Sûreté)
- [ ] `PATCH /api/badges/:id/reactivate` — Lever la suspension (Agent Sûreté)
- [ ] `PATCH /api/badges/:id/expire` — Expiration automatique (cron/job)

### 3.8 Gestion des Habilitations
- [ ] `PUT /api/badges/:id/habilitations` — Attribuer les zones (lors de validation N2)
- [ ] `PATCH /api/habilitations/:id/revoke` — Révoquer une habilitation
- [ ] `GET /api/zones` — Lister les zones disponibles

### 3.9 Incidents & Révocations
- [ ] `POST /api/incidents` — Signaler un incident (employé ou manager)
- [ ] `GET /api/incidents` — Lister les incidents (selon rôle)
- [ ] `GET /api/incidents/:id` — Détail d'un incident
- [ ] `PATCH /api/incidents/:id/confirm-revoke` — Confirmer la révocation (Agent Sûreté)
- [ ] `PATCH /api/incidents/:id/lift-suspension` — Lever la suspension (Agent Sûreté)

### 3.10 Notifications
- [ ] `GET /api/notifications` — Lister les notifications de l'utilisateur
- [ ] `PATCH /api/notifications/:id/read` — Marquer comme lue
- [ ] `PATCH /api/notifications/read-all` — Tout marquer comme lu
- [ ] `GET /api/notifications/unread-count` — Nombre de non-lues

### 3.11 Historique & Passages
- [ ] `POST /api/passages` — Enregistrer un passage (simulation ou vrai passage)
- [ ] `GET /api/passages` — Consulter l'historique (filtrage : période, zone, direction, employé, résultat)
- [ ] `GET /api/passages/:id` — Détail d'un passage
- [ ] `GET /api/passages/personal` — Historique personnel (Employé)
- [ ] `GET /api/simulate` — Simuler un passage (UID + zone → Autorisé/Refusé avec motif)

### 3.12 Tableau de bord & Statistiques
- [ ] `GET /api/dashboard/super-admin` — Stats globales (badges par statut, alertes, évolution demandes)
- [ ] `GET /api/dashboard/manager` — Stats de la direction (demandes en attente, employés, expirations)
- [ ] `GET /api/dashboard/surete` — Stats sûreté (dossiers à instruire, alertes, badges par zone)
- [ ] `GET /api/dashboard/employe` — Stats personnelles (statut badge, historique)

### 3.13 Rapports & Audit
- [ ] `GET /api/reports/audit` — Générer un rapport d'audit (filtrable par période, direction, zone)
- [ ] `GET /api/reports/export` — Exporter en PDF/CSV
- [ ] `GET /api/reports/history` — Historique des exports précédents

---

## 4. Logique Métier

### 4.1 Workflow de Validation Deux Niveaux
- [ ] Implémenter la machine à états du workflow (Soumis → N1 → N2 → Actif / Refusé)
- [ ] Empêcher la validation N2 sans validation N1 préalable
- [ ] Empêcher la création d'un badge sans validation N2
- [ ] Permettre une nouvelle demande après refus (N1 ou N2)
- [ ] Sélection des zones par le Manager lors de N1 (RF1.5)
- [ ] Validation/refus individuel des zones par l'Agent de Sûreté lors de N2

### 4.2 Cycle de Vie du Badge
- [ ] Génération de l'UID unique (format "A1:B2:C3:D4") — RF3.3
- [ ] Activation automatique après validation N2
- [ ] Gestion de l'expiration automatique (cron job / scheduled task) — RF2.4
- [ ] Suspendre le badge lors d'un signalement d'incident — RF2.2
- [ ] Révocation définitive par l'Agent de Sûreté — RF2.3
- [ ] Levée de suspension si badge retrouvé — RF2.3

### 4.3 Gestion des Incidents
- [ ] Signalement par l'Employé (perte/vol) — RF2.1
- [ ] Signalement par le Manager (perte/vol/fin de contrat) — RF2.5
- [ ] Suspension immédiate du badge + révocation des habilitations — RF2.2
- [ ] Notification automatique à l'Agent de Sûreté — RF2.3
- [ ] Confirmation de révocation ou levée de suspension par l'Agent de Sûreté

### 4.4 Cloisonnement par Direction
- [ ] Filtrer automatiquement les données selon la direction de l'utilisateur — RF1.2
- [ ] Empêcher l'accès aux données d'une autre direction pour les Managers
- [ ] Le Super-Admin et l'Agent de Sûreté accèdent à toutes les données

### 4.5 Gestion des Invitations
- [ ] Génération de code unique par le Manager — RF1.6
- [ ] Validation du code lors de l'inscription de l'Employé
- [ ] Expiration automatique des invitations non utilisées
- [ ] Rattachement de l'Employé à la direction via le code

### 4.6 Simulation de Lecteur
- [ ] Endpoint de simulation (UID badge + zone → résultat Autorisé/Refusé) — RF3.1
- [ ] Vérification du statut du badge (actif, non suspendu, non expiré)
- [ ] Vérification des habilitations de zone
- [ ] Enregistrement du passage dans l'historique

### 4.7 Traçabilité & Audit
- [ ] Journalisation de chaque tentative d'accès (UID, zone, horodatage, résultat) — RF3.1
- [ ] Journalisation de toutes les actions admin (auteur, horodatage) — RF3.5
- [ ] Filtres de consultation de l'historique (période, zone, direction, employé) — RF3.2
- [ ] Export de rapports d'audit (PDF/CSV) — RF3.4

---

## 5. Sécurité & Contrôle d'Accès

- [ ] Implémenter le RBAC (Role-Based Access Control) pour les 4 rôles
- [ ] Valider les permissions sur chaque endpoint (middleware d'autorisation)
- [ ] Empêcher la modification/suspension de badges sans validation N2 — RF1.4
- [ ] Protéger les endpoints selon les rôles (Super-Admin, Manager, Employé, Agent Sûreté)
- [ ] Implémenter le cloisonnement direction pour les Managers — RF1.2
- [ ] Vérifier que seuls les employés RAM sont enregistrés — RF1.0
- [ ] Empêcher la création de comptes entreprise externe

---

## 6. Tâches Transversales

- [ ] Rédiger la documentation API (OpenAPI/Swagger)
- [ ] Écrire les tests unitaires pour la logique métier
- [ ] Écrire les tests d'intégration pour les endpoints API
- [ ] Mettre en place les migrations de base de données
- [ ] Configurer les variables d'environnement (Keycloak, DB, etc.)
- [ ] Implémenter la gestion des fichiers uploadés (pièces justificatives)
- [ ] Configurer le scheduling des tâches automatiques (expiration badges)
- [ ] Mettre en place le monitoring et les health checks

---

## Priorités Recommandées

| Phase | Tâches |
|-------|--------|
| **Phase 1** | Infrastructure, modèles de données, authentification Keycloak, CRUD Directions & Agents |
| **Phase 2** | Workflow de demande (N1/N2), gestion des badges, invitations |
| **Phase 3** | Incidents, notifications, habilitations par zone |
| **Phase 4** | Historique, passages, simulation, rapports d'audit |
| **Phase 5** | Dashboard, tests, documentation, optimisations |
