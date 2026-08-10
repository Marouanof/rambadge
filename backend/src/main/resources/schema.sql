-- Hibernate (ddl-auto=update) ne met PAS a jour les contraintes CHECK qu'il genere
-- pour les colonnes enum (nommes <table>_<colonne>_check) lorsque l'enum gagne de
-- nouvelles valeurs. Toute valeur nouvelle est alors rejetee a l'insert (SQLState 23514).
-- Ce fichier recree toutes ces contraintes avec la liste complete de chaque enum.
-- spring.sql.init.mode=always => execute a chaque demarrage, apres le ddl Hibernate.

ALTER TABLE notification DROP CONSTRAINT IF EXISTS notification_type_notification_check;
ALTER TABLE notification ADD CONSTRAINT notification_type_notification_check
    CHECK (type_notification IN (
        'INCIDENT_SIGNAL','DEMANDE_N1','DEMANDE_N2','VALIDATION','REFUS','EXPIRATION',
        'SUSPENSION','REACTIVATION','REVOCATION','INCIDENT_DIRECTION',
        'INVITATION_ACCEPTEE','INVITATION_EXPIREE'
    ));

ALTER TABLE incident DROP CONSTRAINT IF EXISTS incident_type_incident_check;
ALTER TABLE incident ADD CONSTRAINT incident_type_incident_check
    CHECK (type_incident IN ('PERTE','VOL','FIN_CONTRAT'));

ALTER TABLE incident DROP CONSTRAINT IF EXISTS incident_statut_check;
ALTER TABLE incident ADD CONSTRAINT incident_statut_check
    CHECK (statut IN ('PROGRAMME','SUSPENDU','REVOQUE','LEVE'));

ALTER TABLE badge DROP CONSTRAINT IF EXISTS badge_statut_check;
ALTER TABLE badge ADD CONSTRAINT badge_statut_check
    CHECK (statut IN ('ACTIF','SUSPENDU','REVOQUE','EXPIRE','EN_ATTENTE'));

ALTER TABLE demande DROP CONSTRAINT IF EXISTS demande_statut_check;
ALTER TABLE demande ADD CONSTRAINT demande_statut_check
    CHECK (statut IN ('EN_ATTENTE_N1','EN_ATTENTE_N2','VALIDEE','REFUSEE_N1','REFUSEE_N2'));

ALTER TABLE habilitation DROP CONSTRAINT IF EXISTS habilitation_statut_check;
ALTER TABLE habilitation ADD CONSTRAINT habilitation_statut_check
    CHECK (statut IN ('ACTIVE','REVOQUEE'));

ALTER TABLE invitation DROP CONSTRAINT IF EXISTS invitation_statut_check;
ALTER TABLE invitation ADD CONSTRAINT invitation_statut_check
    CHECK (statut IN ('EN_ATTENTE','ACCEPTEE','EXPIREE','REVOQUEE'));

ALTER TABLE piece_justificative DROP CONSTRAINT IF EXISTS piece_justificative_type_piece_check;
ALTER TABLE piece_justificative ADD CONSTRAINT piece_justificative_type_piece_check
    CHECK (type_piece IN ('CASIER_JUDICIAIRE','ATTESTATIONFORMATION','JUSTIFICATION_POSTE','PIECE_IDENTITE','PHOTO_IDENTITE'));

ALTER TABLE passage DROP CONSTRAINT IF EXISTS passage_resultat_check;
ALTER TABLE passage ADD CONSTRAINT passage_resultat_check
    CHECK (resultat IN ('AUTORISE','REFUSE'));

ALTER TABLE zone_demandee DROP CONSTRAINT IF EXISTS zone_demandee_statut_n1_check;
ALTER TABLE zone_demandee ADD CONSTRAINT zone_demandee_statut_n1_check
    CHECK (statut_n1 IN ('EN_ATTENTE','VALIDEE','REFUSEE'));

ALTER TABLE zone_demandee DROP CONSTRAINT IF EXISTS zone_demandee_statut_n2_check;
ALTER TABLE zone_demandee ADD CONSTRAINT zone_demandee_statut_n2_check
    CHECK (statut_n2 IN ('EN_ATTENTE','VALIDEE','REFUSEE'));

ALTER TABLE validation_n1 DROP CONSTRAINT IF EXISTS validation_n1_decision_check;
ALTER TABLE validation_n1 ADD CONSTRAINT validation_n1_decision_check
    CHECK (decision IN ('VALIDEE','REFUSEE'));

ALTER TABLE validation_n2 DROP CONSTRAINT IF EXISTS validation_n2_decision_check;
ALTER TABLE validation_n2 ADD CONSTRAINT validation_n2_decision_check
    CHECK (decision IN ('VALIDEE','REFUSEE'));

ALTER TABLE user_preferences DROP CONSTRAINT IF EXISTS user_preferences_theme_check;
ALTER TABLE user_preferences ADD CONSTRAINT user_preferences_theme_check
    CHECK (theme IN ('LIGHT','DARK','SYSTEM'));

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
    CHECK (role IN ('SUPER_ADMIN','MANAGER','EMPLOYE','AGENT_SURETE'));

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_statut_check;
ALTER TABLE users ADD CONSTRAINT users_statut_check
    CHECK (statut IN ('ACTIF','INACTIF','SUSPENDU'));
