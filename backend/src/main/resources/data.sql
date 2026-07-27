-- Zones aéroportuaires de référence (seed data, idempotent)
INSERT INTO zone (nom, code, description, created_at, updated_at)
VALUES
    ('Pistes & Tarmac', 'PISTES_TARMAC', 'Zones de mouvement d''avions : décollage, atterrissage, posé au sol', NOW(), NOW()),
    ('Tri Bagages', 'TRI_BAGAGES', 'Salle de traitement et de tri des bagages arrivées / départs', NOW(), NOW()),
    ('Zones Réservées', 'ZONES_RESERVEES', 'Salles de contrôle, locaux sûreté, zones techniques sensibles', NOW(), NOW()),
    ('Aérogare', 'AEROGARE', 'Hall passagers, zones d''embarquement, comptoirs d''enregistrement', NOW(), NOW()),
    ('Hangars Maintenance', 'MAINTENANCE', 'Zones de maintenance aéronautique, ateliers et hangars', NOW(), NOW()),
    ('Bureaux & Admin', 'ADMIN', 'Espaces administratifs, salles de réunion, back-office', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;
