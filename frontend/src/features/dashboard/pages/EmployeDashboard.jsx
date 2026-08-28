import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { History, FileText, Clock, CheckCircle2, XCircle, PauseCircle, AlertTriangle, CreditCard, ScanLine } from 'lucide-react';

const badgeStatutInfo = {
  ACTIF: { label: 'Actif', bg: 'bg-[#008B60]/10', fg: 'text-[#008B60]' },
  SUSPENDU: { label: 'Suspendu', bg: 'bg-[#F1BE5B]/15', fg: 'text-[#A67C00]' },
  REVOQUE: { label: 'Révoqué', bg: 'bg-[#C20831]/10', fg: 'text-[#C20831]' },
  EXPIRE: { label: 'Expiré', bg: 'bg-[#674459]/10', fg: 'text-[#674459]' },
};

export default function EmployeDashboard() {
  const [stats, setStats] = useState(null);
  const [demande, setDemande] = useState(null);
  const [zones, setZones] = useState([]);
  const [zoneId, setZoneId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [passageResult, setPassageResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchDashboard = useCallback(() => {
    return Promise.all([
      api.get('/dashboard/employe'),
      api.get('/demandes', { params: { page: 0, size: 1 } }),
    ])
      .then(([dashRes, demRes]) => {
        setStats(dashRes.data.data);
        const content = demRes.data.data.content;
        if (content.length > 0) setDemande(content[0]);
      })
      .catch(() => setError('Erreur lors du chargement'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchDashboard();
    api.get('/zones')
      .then((res) => setZones(res.data.data))
      .catch(() => {});
  }, [fetchDashboard]);

  const enregistrerPassage = async () => {
    if (!stats.badge?.uidUnique || !zoneId) return;
    setSubmitting(true);
    setPassageResult(null);
    try {
      const res = await api.post('/passages', null, {
        params: { uidBadge: stats.badge.uidUnique, zoneId },
      });
      setPassageResult(res.data.data);
      await fetchDashboard();
    } catch (err) {
      setPassageResult({ erreur: err.response?.data?.message || 'Erreur lors de l\'enregistrement du passage' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center py-12 text-muted-foreground">Chargement...</div>;
  if (error) return <div className="text-destructive bg-destructive/10 p-4 rounded-lg mb-6">{error}</div>;
  if (!stats) return null;

  const statutInfo = {
    AUCUNE_DEMANDE: { label: 'Aucune demande', icon: FileText, bg: 'bg-[#674459]/10', fg: 'text-[#674459]' },
    EN_ATTENTE_N1: { label: 'En attente N1', icon: Clock, bg: 'bg-[#F1BE5B]/15', fg: 'text-[#A67C00]' },
    EN_ATTENTE_N2: { label: 'En attente N2', icon: Clock, bg: 'bg-[#F1BE5B]/15', fg: 'text-[#A67C00]' },
    ACTIF: { label: 'Actif', icon: CheckCircle2, bg: 'bg-[#008B60]/10', fg: 'text-[#008B60]' },
    VALIDEE: { label: 'Actif', icon: CheckCircle2, bg: 'bg-[#008B60]/10', fg: 'text-[#008B60]' },
    REFUSEE_N1: { label: 'Refusée N1', icon: XCircle, bg: 'bg-[#C20831]/10', fg: 'text-[#C20831]' },
    REFUSEE_N2: { label: 'Refusée N2', icon: XCircle, bg: 'bg-[#C20831]/10', fg: 'text-[#C20831]' },
    SUSPENDU: { label: 'Suspendu', icon: PauseCircle, bg: 'bg-[#F1BE5B]/15', fg: 'text-[#A67C00]' },
    REVOQUE: { label: 'Révoqué', icon: XCircle, bg: 'bg-[#C20831]/10', fg: 'text-[#C20831]' },
    EXPIRE: { label: 'Expiré', icon: Clock, bg: 'bg-[#674459]/10', fg: 'text-[#674459]' },
  };

  const badge = stats.badge || null;
  const currentStatut = badge?.statut || demande?.statut || (stats.aBadgeActif ? 'VALIDEE' : 'AUCUNE_DEMANDE');
  const info = statutInfo[currentStatut] || statutInfo.AUCUNE_DEMANDE;

  const isWaiting = !badge && (currentStatut === 'EN_ATTENTE_N1' || currentStatut === 'EN_ATTENTE_N2');
  const badgeInfo = badge
    ? badgeStatutInfo[badge.statut] || { label: badge.statut, bg: 'bg-muted', fg: 'text-muted-foreground' }
    : null;
  const isSuspended = badge?.statut === 'SUSPENDU';
  const compteStatut = stats.compteStatut;
  const compteBloque = compteStatut === 'SUSPENDU' || compteStatut === 'INACTIF';
  const passages = stats.derniersPassages || [];

  const formatDate = (value) => (value ? new Date(value).toLocaleDateString('fr-FR') : '-');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Mon espace</h1>
        <p className="text-sm text-muted-foreground mt-1">Récapitulatif de votre badge et de vos passages</p>
      </div>

      {compteBloque && (
        <div className="flex items-start gap-3 rounded-lg border border-[#C20831]/30 bg-[#C20831]/5 p-4">
          <AlertTriangle className="size-5 mt-0.5 shrink-0 text-[#C20831]" />
          <div>
            <p className="text-sm font-medium text-[#C20831]">
              {compteStatut === 'SUSPENDU' ? 'Votre compte est suspendu' : 'Votre compte est désactivé'}
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {compteStatut === 'SUSPENDU'
                ? "Vous ne pouvez plus enregistrer de passages ni soumettre de demande de badge. Contactez votre gestionnaire pour plus d'informations."
                : "Votre compte a été désactivé. Vos accès sont révoqués. Contactez votre gestionnaire pour plus d'informations."}
            </p>
          </div>
        </div>
      )}

      {isSuspended && (
        <div className="flex items-start gap-3 rounded-lg border border-[#F1BE5B]/40 bg-[#F1BE5B]/10 p-4">
          <AlertTriangle className="size-5 mt-0.5 shrink-0 text-[#A67C00]" />
          <div>
            <p className="text-sm font-medium text-[#A67C00]">Votre badge est suspendu</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {badge.dateSuspension
                ? `Depuis le ${formatDate(badge.dateSuspension)}. Contactez votre gestionnaire pour plus d'informations.`
                : "Contactez votre gestionnaire pour plus d'informations."}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-sm cursor-pointer transition-shadow hover:shadow-md" onClick={() => navigate('/ma-demande')}>
          <CardContent className="flex items-center gap-4 p-6">
            <div className={`rounded-lg p-2.5 shrink-0 ${info.bg}`}>
              <info.icon className={`size-5 ${info.fg}`} />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">Statut du badge</p>
              {isWaiting && demande ? (
                <div>
                  <p className={`text-lg font-semibold ${info.fg}`}>{info.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Demandé le {new Date(demande.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ) : (
                <p className={`text-lg font-semibold ${info.fg}`}>{info.label}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm cursor-pointer transition-shadow hover:shadow-md" onClick={() => navigate('/mon-historique')}>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-lg p-2.5 shrink-0 bg-muted">
              <History className="size-5 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">Passages autorisés</p>
              <p className="text-2xl font-bold text-foreground">{stats.passages || 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {badge && badgeInfo && (
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-lg p-2.5 shrink-0 bg-muted">
                <CreditCard className="size-5 text-muted-foreground" />
              </div>
              <div>
                <h2 className="font-semibold">Mon badge</h2>
                <p className="text-xs text-muted-foreground">Informations sur votre badge de ramassage</p>
              </div>
              <span className={`ml-auto inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${badgeInfo.bg} ${badgeInfo.fg}`}>
                {badgeInfo.label}
              </span>
            </div>
            <dl className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <dt className="text-muted-foreground">UID</dt>
                <dd className="font-medium mt-0.5 break-all">{badge.uidUnique}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Date d'émission</dt>
                <dd className="font-medium mt-0.5">{formatDate(badge.dateEmission)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Date d'expiration</dt>
                <dd className="font-medium mt-0.5">{formatDate(badge.dateExpiration)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Suspension</dt>
                <dd className="font-medium mt-0.5">{formatDate(badge.dateSuspension)}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      )}

      {stats.badge?.uidUnique && !compteBloque && (
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-lg p-2.5 shrink-0 bg-muted">
                <ScanLine className="size-5 text-muted-foreground" />
              </div>
              <div>
                <h2 className="font-semibold">Enregistrer un passage</h2>
                <p className="text-xs text-muted-foreground">Simulez votre badge sur une zone (test)</p>
              </div>
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1 min-w-[220px]">
                <label className="text-xs font-medium text-muted-foreground">Zone</label>
                <select
                  value={zoneId}
                  onChange={(e) => setZoneId(e.target.value)}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Choisir une zone</option>
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>{z.nom}</option>
                  ))}
                </select>
              </div>
              <Button onClick={enregistrerPassage} disabled={submitting || !zoneId}>
                {submitting ? 'Enregistrement...' : 'Badger'}
              </Button>
            </div>
            {passageResult && (
              <div className="mt-4 text-sm">
                {passageResult.erreur ? (
                  <div className="text-destructive bg-destructive/10 p-3 rounded-md">{passageResult.erreur}</div>
                ) : (
                  <div className={`rounded-md p-3 flex items-center gap-2 ${passageResult.resultat === 'AUTORISE' ? 'bg-[#008B60]/10 text-[#008B60]' : 'bg-[#C20831]/10 text-[#C20831]'}`}>
                    <CheckCircle2 className="size-4 shrink-0" />
                    <span className="font-medium">
                      {passageResult.resultat === 'AUTORISE' ? 'Accès autorisé' : 'Accès refusé'}
                    </span>
                    <span className="ml-auto text-muted-foreground">
                      {passageResult.zoneNom} · {new Date(passageResult.horodatage).toLocaleString('fr-FR')}
                    </span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-lg p-2.5 shrink-0 bg-muted">
              <History className="size-5 text-muted-foreground" />
            </div>
            <div>
              <h2 className="font-semibold">Derniers passages</h2>
              <p className="text-xs text-muted-foreground">Vos 5 derniers passages enregistrés</p>
            </div>
          </div>

          {passages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <History className="size-12 mb-3 text-muted-foreground/50" />
              <p className="text-sm">Aucun passage enregistré</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-muted-foreground">
                    <th className="pb-3 font-medium">Zone</th>
                    <th className="pb-3 font-medium">Résultat</th>
                    <th className="pb-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {passages.map((p) => (
                    <tr key={p.id} className="border-b last:border-0">
                      <td className="py-3 text-sm">{p.zoneNom}</td>
                      <td className="py-3">
                        <span
                          className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium"
                          style={p.resultat === 'AUTORISE'
                            ? { backgroundColor: '#008B60', color: '#fff' }
                            : { backgroundColor: '#C20831', color: '#fff' }}
                        >
                          {p.resultat}
                        </span>
                      </td>
                      <td className="py-3 text-sm text-muted-foreground">{new Date(p.horodatage).toLocaleString('fr-FR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-4">
            <Button variant="outline" size="sm" onClick={() => navigate('/mon-historique')}>
              Voir tout mon historique
            </Button>
          </div>
        </CardContent>
      </Card>

      {currentStatut === 'AUCUNE_DEMANDE' && (
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center min-h-[200px] text-muted-foreground">
              <FileText className="size-12 mb-3 text-muted-foreground/50" />
              {compteBloque ? (
                <p className="text-sm mb-4 text-center">
                  {compteStatut === 'SUSPENDU'
                    ? 'Vous ne pouvez pas soumettre de demande tant que votre compte est suspendu.'
                    : 'Votre compte est désactivé. Vous ne pouvez pas soumettre de demande.'}
                </p>
              ) : (
                <>
                  <p className="text-sm mb-4">Vous n'avez pas encore de demande de badge en cours.</p>
                  <Button onClick={() => navigate('/ma-demande')}>
                    Soumettre une demande
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
