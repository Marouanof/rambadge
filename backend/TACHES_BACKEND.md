# Tâches Backend — SIGBA (Royal Air Maroc)

## 1. Infrastructure & Setup

- [x] Initialiser le projet backend (Spring Boot 4.1.0, Java 21, package `ma.ram.sigba`)
- [x] Dépendances configurées (Spring Data JPA, Security, OAuth2 Resource Server, PostgreSQL, Lombok, Validation, WebMVC, Mail)
- [x] Configurer la base de données relationnelle (SQL) et les connexions
- [ ] Mettre en place les outils de migration de base de données (ex: Flyway, Alembic, Liquibase)
- [x] Configurer l'intégration avec Keycloak pour l'authentification
- [x] Configurer l'admin API Keycloak (création de comptes + envoi email d'activation)
- [x] Configurer Mailtrap SMTP pour l'envoi d'emails (invitations, reset password)
- [x] Corriger execute-actions-email : PUT au lieu de POST (Keycloak 26) + client_id=sigba-frontend
- [x] Mettre en place le système de logging (journalisation des actions admin - RF3.5)
- [x] Configurer la gestion des erreurs et les réponses API standardisées
- [x] Mettre en place les hooks de validation et les middlewares de sécurité
- [x] Service Keycloak Admin (création utilisateur, email d'activation, suppression)
- [x] Service Email (EmailService — envoi d'emails via JavaMailSender/Mailtrap)

---

## 1b. Configuration Keycloak (Identity Provider)

### Realm `sigba-realm`
- [x] Créer le realm `sigba-realm`
- [x] Configurer le provider SMTP (Mailtrap) pour l'envoi d'emails
- [ ] Configurer la durée de vie des access tokens (Access Token Lifespan)
- [ ] Configurer la durée de session SSO (SSO Session Idle / Max)

### Clients
- [x] Client `sigba-frontend` (public, Authorization Code Flow + Direct Access Grants)
  - Redirect URIs : `http://localhost:3000/*`
  - Direct Access Grants enabled (pour les tests)
- [x] Client `sigba-backend` (confidential, service account)
  - Utilisé par le backend pour la JWT validation (issuer-uri)

### Rôles Realm
- [x] Créer les rôles : `SUPER_ADMIN`, `MANAGER`, `EMPLOYE`, `AGENT_SECURITE`
- [x] Mapper les rôles Keycloak → Spring Security `ROLE_*` (SecurityConfig : `realm_access.roles` + `resource_access`)

### Utilisateurs de test
- [x] Compte Super-Admin : `admin@ram.ma` (SUPER_ADMIN)
- [x] Comptes Manager : créés via `POST /api/managers` (MANAGER)
- [x] Comptes Agent de Sûreté : créés via `POST /api/agents-surete` (AGENT_SECURITE)
- [x] Comptes Employé : créés via invitation + `POST /api/invitations/:code/accept` (EMPLOYE)

### Flow d'authentification
- [x] Login : `POST /realms/sigba-realm/protocol/openid-connect/token` (Resource Owner Password Credentials)
- [x] Token refresh : `POST /realms/sigba-realm/protocol/openid-connect/token` (grant_type=refresh_token)
- [x] Logout : `POST /realms/sigba-realm/protocol/openid-connect/logout`
- [x] JWT validation : Spring Security via `issuer-uri` (JWKS endpoint)

---

### 2.1 Utilisateurs & Authentification
- [x] Entité `User` (id, email, nom, prénom, matricule, rôle, statut, direction_id, created_at, updated_at)
- [x] Entité `Direction` (id, nom, code_direction, manager_id, statut, created_at, updated_at)
- [x] Entité `Invitation` (id, code_unique, email_destinataire, direction_id, manager_id, statut, date_expiration, created_at)
- [x] Mapper les rôles Keycloak (Super-Admin, Manager, Employé, Agent de Sûreté) aux rôles backend

### 2.2 Workflow de Demande
- [x] Entité `Demande` (id, employe_id, statut, motif_refus, created_at, updated_at)
  - Statuts : `EN_ATTENTE_N1`, `EN_ATTENTE_N2`, `VALIDEE`, `REFUSEE_N1`, `REFUSEE_N2`
- [x] Entité `PieceJustificative` (id, demande_id, type_piece, fichier_url, created_at)
  - Types : `CASIER_JUDICIAIRE`, `ATTESTATIONFORMATION`, `JUSTIFICATION_POSTE`, `PIECE_IDENTITE`
- [x] Entité `ValidationN1` (id, demande_id, manager_id, decision, zones_demandees, justifications, date_validation, motif_refus)
- [x] Entité `ValidationN2` (id, demande_id, agent_id, decision, checklist_conformite, date_validation, motif_refus)
- [x] Entité `ZoneDemandee` (id, demande_id, zone_id, justification, statut_n1, statut_n2)

### 2.3 Gestion des Badges
- [x] Entité `Badge` (id, uid_unique, employe_id, demande_id, statut, date_emission, date_expiration, date_suspension, date_revocation, created_at, updated_at)
  - Statuts : `ACTIF`, `SUSPENDU`, `REVOQUE`, `EXPIRE`, `EN_ATTENTE`
- [x] Entité `Zone` (id, nom, code, description)
  - Zones : `PISTES`, `TRI_BAGAGES`, `ZONES_RESERVEES`
- [x] Entité `Habilitation` (id, badge_id, zone_id, date_attribution, date_revocation, statut)
  - Statuts : `ACTIVE`, `REVOQUEE`

### 2.4 Gestion des Incidents
- [x] Entité `Incident` (id, badge_id, signalant_id, type_incident, date_incident, commentaire, statut, date_traitement, agent_id)
  - Types : `PERTE`, `VOL`, `FIN_CONTRAT`
  - Statuts : `SUSPENDU`, `REVOQUE`, `LEVE`
- [x] Entité `Notification` (id, destinataire_id, type_notification, message, lu, lien_element, created_at)
  - Types : `INCIDENT_SIGNAL`, `DEMANDE_N1`, `DEMANDE_N2`, `VALIDATION`, `REFUS`, `EXPIRATION`

### 2.5 Traçabilité & Historique
- [x] Entité `Passage` (id, uid_badge, zone_id, employe_id, direction_id, horodatage, resultat)
  - Résultats : `AUTORISE`, `REFUSE`
- [x] Entité `JournalAdmin` (id, auteur_id, action, cible_type, cible_id, details, horodatage)

---

## 3. Endpoints API REST

### 3.1 Authentification
- [ ] `POST /api/auth/login` — Connexion via Keycloak (géré côté frontend)
- [ ] `POST /api/auth/refresh` — Rafraîchir le token (géré côté frontend)
- [ ] `POST /api/auth/logout` — Déconnexion (géré côté frontend)
- [x] `GET /api/auth/me` — Profil utilisateur connecté
- [x] `POST /api/auth/forgot-password` — Envoyer un email de réinitialisation mot de passe (Keycloak)
- [x] `POST /api/auth/reset-password` — Réinitialiser le mot de passe avec le token reçu

### 3.2 Gestion des Directions (Super-Admin)
- [x] `GET /api/directions` — Lister les directions (avec filtres, pagination)
- [x] `GET /api/directions/:id` — Détail d'une direction
- [x] `POST /api/directions` — Créer une direction
- [x] `PUT /api/directions/:id` — Modifier une direction
- [x] `PATCH /api/directions/:id/disable` — Désactiver une direction
- [x] `PATCH /api/directions/:id/enable` — Activer une direction
- [x] `GET /api/directions/:id/employes` — Employés d'une direction

### 3.3 Gestion des Agents de Sûreté (Super-Admin)
- [x] `GET /api/agents-surete` — Lister les agents
- [x] `GET /api/agents-surete/:id` — Détail d'un agent
- [x] `POST /api/agents-surete` — Créer un agent (création Keycloak)
- [x] `PUT /api/agents-surete/:id` — Modifier un agent
- [x] `PATCH /api/agents-surete/:id/revoke` — Révoquer l'accès d'un agent
- [x] `PATCH /api/agents-surete/:id/enable` — Réactiver un agent

### 3.3b Gestion des Managers (Super-Admin)
- [x] `GET /api/managers` — Lister les managers (search, statut, pagination)
- [x] `GET /api/managers/:id` — Détail d'un manager
- [x] `POST /api/managers` — Créer un manager (+ assigner direction + email activation Keycloak)
- [x] `PUT /api/managers/:id` — Modifier un manager (+ réaffectation direction)
- [x] `PATCH /api/managers/:id/revoke` — Révoquer un manager (détache direction)
- [x] `PATCH /api/managers/:id/enable` — Réactiver un manager
- [x] `GET /api/managers/mes-employes` — Lister les employés de sa direction (Manager)

### 3.4 Gestion des Invitations (Manager)
- [x] `POST /api/invitations` — Générer un code d'invitation (+ envoi email Mailtrap)
- [x] `GET /api/invitations` — Lister les invitations de la direction
- [x] `GET /api/invitations/:code` — Récupérer une invitation par code (publique)
- [x] `POST /api/invitations/:code/accept` — Accepter une invitation (inscription employé, création compte Keycloak + BDD)
- [x] `PATCH /api/invitations/:id/revoke` — Révoquer une invitation

### 3.5 Inscription Employé
- [x] `POST /api/employes/register` — Créer un compte via code d'invitation (intégré dans POST /api/invitations/:code/accept)
- [x] `GET /api/employes` — Lister tous les employés (Super-Admin, filtres + pagination)
- [x] `GET /api/employes/:id` — Détail d'un employé (Super-Admin, Manager)
- [x] `PUT /api/employes/profile` — Modifier son profil

### 3.6 Workflow de Demande de Badge
- [x] `POST /api/demandes` — Soumettre une demande de badge (avec upload pièces)
- [x] `GET /api/demandes` — Lister les demandes (selon rôle : employé=les siennes, manager=sa direction, surete=toutes en attente N2)
- [x] `GET /api/demandes/:id` — Détail d'une demande
- [x] `GET /api/demandes/:id/pieces` — Télécharger les pièces justificatives
- [x] `POST /api/demandes/:id/validate-n1` — Validation N1 (Manager) — inclut sélection des zones
- [x] `POST /api/demandes/:id/refuse-n1` — Refus N1 (Manager) — motif obligatoire
- [x] `POST /api/demandes/:id/validate-n2` — Validation N2 (Agent Sûreté) — génère le badge + UID
- [x] `POST /api/demandes/:id/refuse-n2` — Refus N2 (Agent Sûreté) — motif obligatoire

### 3.7 Gestion des Badges
- [x] `GET /api/badges` — Lister les badges (selon rôle et cloisonnement)
- [x] `GET /api/badges/:id` — Détail d'un badge
- [x] `GET /api/badges/uid/:uid` — Rechercher par UID
- [x] `GET /api/badges/employe/:employeId` — Badge d'un employé
- [x] `PATCH /api/badges/:id/suspend` — Suspendre un badge (incident)
- [x] `PATCH /api/badges/:id/revoke` — Révoquer définitivement (Agent Sûreté)
- [x] `PATCH /api/badges/:id/reactivate` — Lever la suspension (Agent Sûreté)
- [x] Expiration automatique (via BadgeService.expirerBadges)

### 3.8 Gestion des Habilitations
- [x] `GET /api/habilitations/badge/:badgeId` — Habilitations d'un badge
- [x] `PATCH /api/habilitations/:id/revoke` — Révoquer une habilitation
- [x] `GET /api/zones` — Lister les zones disponibles

### 3.9 Incidents & Révocations
- [x] `POST /api/incidents` — Signaler un incident (employé ou manager) → suspend badge auto
- [x] `GET /api/incidents` — Lister les incidents (selon rôle)
- [x] `GET /api/incidents/:id` — Détail d'un incident
- [x] `PATCH /api/incidents/:id/confirm-revoke` — Confirmer la révocation (Agent Sûreté)
- [x] `PATCH /api/incidents/:id/lift-suspension` — Lever la suspension (Agent Sûreté)

### 3.10 Notifications
- [x] `GET /api/notifications` — Lister les notifications de l'utilisateur
- [x] `PATCH /api/notifications/:id/read` — Marquer comme lue
- [x] `PATCH /api/notifications/read-all` — Tout marquer comme lu
- [x] `GET /api/notifications/unread-count` — Nombre de non-lues

### 3.11 Historique & Passages
- [x] `POST /api/passages?uidBadge=X&zoneId=Y` — Enregistrer un passage
- [x] `GET /api/passages` — Consulter l'historique (filtrage : zone, employé)
- [x] `GET /api/passages/:id` — Détail d'un passage
- [x] `GET /api/passages/personal` — Historique personnel (Employé)
- [x] `POST /api/passages/simulate` — Simuler un passage (UID + zone → Autorisé/Refusé avec motif)

### 3.12 Tableau de bord & Statistiques
- [x] `GET /api/dashboard/super-admin` — Stats globales (badges par statut, alertes, évolution demandes)
- [x] `GET /api/dashboard/manager` — Stats de la direction (demandes en attente, employés, expirations)
- [x] `GET /api/dashboard/surete` — Stats sûreté (dossiers à instruire, alertes, badges par zone)
- [x] `GET /api/dashboard/employe` — Stats personnelles (statut badge, historique)

### 3.13 Rapports & Audit
- [x] `GET /api/reports/audit` — Générer un rapport d'audit (filtrable par période, direction, zone)
- [x] `GET /api/reports/export` — Exporter en PDF/CSV (stub à compléter)
- [x] `GET /api/reports/history` — Historique des exports précédents (stub à compléter)

---

## 4. Logique Métier

### 4.1 Workflow de Validation Deux Niveaux
- [x] Implémenter la machine à états du workflow (Soumis → N1 → N2 → Actif / Refusé)
- [x] Empêcher la validation N2 sans validation N1 préalable
- [x] Empêcher la création d'un badge sans validation N2
- [x] Permettre une nouvelle demande après refus (N1 ou N2)
- [x] Sélection des zones par le Manager lors de N1 (RF1.5)
- [x] Validation/refus individuel des zones par l'Agent de Sûreté lors de N2

### 4.2 Cycle de Vie du Badge
- [x] Génération de l'UID unique (format "XX:XX:XX:XX" — UUID hex) — RF3.3
- [x] Activation automatique après validation N2
- [x] Gestion de l'expiration automatique (BadgeService.expirerBadges) — RF2.4
- [x] Suspendre le badge lors d'un signalement d'incident — RF2.2
- [x] Révocation définitive par l'Agent de Sûreté — RF2.3
- [x] Levée de suspension si badge retrouvé — RF2.3

### 4.3 Gestion des Incidents
- [x] Signalement par l'Employé (perte/vol) — RF2.1
- [x] Signalement par le Manager (perte/vol/fin de contrat) — RF2.5
- [x] Suspension immédiate du badge + révocation des habilitations — RF2.2
- [ ] Notification automatique à l'Agent de Sûreté — RF2.3 (service dispo, à appeler dans le workflow)
- [x] Confirmation de révocation ou levée de suspension par l'Agent de Sûreté

### 4.4 Cloisonnement par Direction
- [x] Filtrer automatiquement les données selon la direction de l'utilisateur — RF1.2
- [x] Empêcher l'accès aux données d'une autre direction pour les Managers
- [x] Le Super-Admin et l'Agent de Sûreté accèdent à toutes les données

### 4.5 Gestion des Invitations
- [x] Génération de code unique par le Manager — RF1.6
- [x] Validation du code lors de l'inscription de l'Employé
- [x] Envoi d'email d'invitation avec lien d'inscription (Mailtrap)
- [x] Création du compte Keycloak + enregistrement BDD lors de l'acceptation
- [ ] Expiration automatique des invitations non utilisées (cron job)
- [x] Rattachement de l'Employé à la direction via le code

### 4.6 Simulation de Lecteur
- [x] Endpoint de simulation (UID badge + zone → résultat Autorisé/Refusé) — RF3.1
- [x] Vérification du statut du badge (actif, non suspendu, non expiré)
- [x] Vérification des habilitations de zone
- [x] Enregistrement du passage dans l'historique

### 4.7 Traçabilité & Audit
- [x] Journalisation de chaque tentative d'accès (UID, zone, horodatage, résultat) — RF3.1
- [ ] Journalisation de toutes les actions admin (auteur, horodatage) — RF3.5 (JournalAdmin entity + repository dispo, à intégrer)
- [x] Filtres de consultation de l'historique (période, zone, direction, employé) — RF3.2
- [x] Export de rapports d'audit (PDF/CSV) — RF3.4 (endpoint dispo, format stub)

---

## 5. Sécurité & Contrôle d'Accès

- [x] Implémenter le RBAC (Role-Based Access Control) pour les 4 rôles
- [x] Valider les permissions sur chaque endpoint (@PreAuthorize sur tous les controllers)
- [x] Empêcher la modification/suspension de badges sans validation N2 — RF1.4
- [x] Protéger les endpoints selon les rôles (Super-Admin, Manager, Employé, Agent Sûreté)
- [x] Implémenter le cloisonnement direction pour les Managers — RF1.2
- [x] Vérifier que seuls les employés RAM sont enregistrés — RF1.0 (RamEmailValidator : @ram.ma / @ram.com)
- [x] Empêcher la création de comptes entreprise externe (RamEmailValidator)
- [x] Handler AccessDeniedException → 403 propre (GlobalExceptionHandler)

---

## 6. Tâches Transversales

- [x] Rédiger la documentation API (OpenAPI/Swagger) — springdoc-openapi + annotations @Tag/@Operation sur tous les controllers
- [x] Seed data zones (data.sql — PISTES, TRI_BAGAGES, ZONES_RESERVEES) + idempotent ON CONFLICT
- [ ] Écrire les tests unitaires pour la logique métier
- [ ] Écrire les tests d'intégration pour les endpoints API
- [ ] Mettre en place les migrations de base de données (Flyway)
- [ ] Configurer les variables d'environnement (Keycloak, DB, etc.)
- [ ] Implémenter la gestion des fichiers uploadés (pièces justificatives — stockage réel)
- [ ] Configurer le scheduling des tâches automatiques (expiration badges, invitations)
- [ ] Mettre en place le monitoring et les health checks

---

## Priorités Recommandées

| Phase | Tâches | Statut |
|-------|--------|--------|
| **Phase 1** | Infrastructure, modèles de données, authentification Keycloak, CRUD Directions, Managers & Agents de Sûreté | ✅ Terminée |
| **Phase 2** | Workflow de demande (N1/N2), gestion des badges, invitations | ✅ Terminée |
| **Phase 3** | Incidents, notifications, habilitations par zone | ✅ Terminée |
| **Phase 4** | Historique, passages, simulation, rapports d'audit | ✅ Terminée |
| **Phase 5** | Dashboard, tests, documentation, optimisations | ✅ Terminée (endpoints), 🔄 restants : tests unitaires, scheduling, uploads |

---

## 7. Résultats des Tests (2026-07-20)

### Tokens Keycloak (tous OK)
| Rôle | Email | Token |
|------|-------|-------|
| SUPER_ADMIN | admin@ram.ma | ✅ 1347 chars |
| MANAGER | yass.rahimi@ram.com | ✅ 1377 chars |
| AGENT_SECURITE | agent.test@ram.com | ✅ 1370 chars |
| EMPLOYE | e1@ram.com / e2@ram.com | ✅ 1350 chars |

### Endpoints testés — tous OK
| Phase | Endpoint | Test | Résultat |
|---|---|---|---|
| 3.5 | `GET /api/zones` | MANAGER | ✅ 3 zones |
| 3.6 | `POST /api/demandes` | EMPLOYE e2 | ✅ id=2, EN_ATTENTE_N1 |
| 3.6 | `GET /api/demandes/:id` | MANAGER | ✅ détails |
| 3.6 | `GET /api/demandes/:id/pieces` | MANAGER | ✅ 2 pièces |
| 3.6 | `POST /api/demandes/:id/validate-n1` | MANAGER | ✅ → EN_ATTENTE_N2 + 2 zones |
| 3.6 | `POST /api/demandes/:id/validate-n2` | AGENT | ✅ → VALIDEE, badge généré |
| 3.6 | `POST /api/demandes/:id/refuse-n1` | MANAGER | ✅ → REFUSEE_N1 |
| 3.6 | `POST /api/demandes/:id/refuse-n2` | AGENT | ✅ → REFUSEE_N2 |
| 3.7 | `GET /api/badges` | SUPER_ADMIN | ✅ 1 badge (F7:80:DA:D2) |
| 3.7 | `GET /api/badges/:id` | SUPER_ADMIN | ✅ détail + 2 habilitations |
| 3.7 | `GET /api/badges/uid/:uid` | SUPER_ADMIN | ✅ trouvé |
| 3.7 | `PATCH /api/badges/:id/suspend` | SUPER_ADMIN | ✅ → SUSPENDU |
| 3.7 | `PATCH /api/badges/:id/reactivate` | AGENT | ✅ → ACTIF |
| 3.7 | `PATCH /api/badges/:id/revoke` | SUPER_ADMIN | ✅ → REVOQUE + habilitations REVOQUEE |
| 3.7 | `GET /api/badges?statut=REVOQUE` | SUPER_ADMIN | ✅ filtre |
| 3.8 | `GET /api/habilitations/badge/:id` | MANAGER | ✅ 2 habilitations |
| 3.8 | `PATCH /api/habilitations/:id/revoke` | AGENT | ✅ déjà révoquée → erreur métier |
| 3.9 | `POST /api/incidents` | EMPLOYE | ✅ PERTE → badge suspendu auto |
| 3.9 | `GET /api/incidents` | SUPER_ADMIN | ✅ 1 incident |
| 3.9 | `PATCH /api/incidents/:id/lift-suspension` | AGENT | ✅ → LEVE, badge réactivé |
| 3.10 | `GET /api/notifications` | MANAGER | ✅ 0 |
| 3.10 | `GET /api/notifications/unread-count` | MANAGER | ✅ 0 |
| 3.11 | `POST /api/passages/simulate` | AGENT | ✅ AUTORISE / REFUSE |
| 3.11 | `POST /api/passages` | AGENT | ✅ enregistré (AUTORISE + REFUSE) |
| 3.11 | `GET /api/passages` | SUPER_ADMIN | ✅ 2 passages |
| 3.11 | `GET /api/passages/personal` | EMPLOYE | ✅ 2 passages |
| 3.12 | `GET /api/dashboard/super-admin` | SUPER_ADMIN | ✅ badges, demandes, passages |
| 3.12 | `GET /api/dashboard/manager` | MANAGER | ✅ direction stats |
| 3.12 | `GET /api/dashboard/surete` | AGENT | ✅ N2 en attente |
| 3.12 | `GET /api/dashboard/employe` | EMPLOYE | ✅ badge actif |
| 3.13 | `GET /api/reports/audit` | SUPER_ADMIN | ✅ rapport complet |
| 3.13 | `GET /api/reports/export` | SUPER_ADMIN | ✅ stub |
| Erreurs | Badge inexistant 999 | EMPLOYE | ✅ 404 |
| Erreurs | Double demande | EMPLOYE | ✅ rejetée |
| Erreurs | Hab déjà révoquée | AGENT | ✅ erreur métier |
| RBAC | EMPLOYE suspend badge | EMPLOYE | ✅ 403 (après fix handler) |
