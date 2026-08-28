import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import api from '@/services/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  BadgeCheck, PauseCircle, XCircle, Clock,
  Users, AlertTriangle, ArrowRightLeft, IdCard,
  PackageOpen, BarChart3, RefreshCw, ClipboardList, ClipboardCheck,
} from 'lucide-react';

const COLORS = ['#008B60', '#F1BE5B', '#C20831', '#674459'];

function getRoleFromToken() {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const realmAccess = payload.realm_access?.roles || [];
    return realmAccess.find((r) =>
      ['SUPER_ADMIN', 'MANAGER', 'EMPLOYE', 'AGENT_SURETE'].includes(r)
    ) || null;
  } catch {
    return null;
  }
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const navigate = useNavigate();
  const role = getRoleFromToken();

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/dashboard/super-admin');
      setStats(res.data.data);
      setLastUpdated(new Date());
      setError('');
    } catch {
      setError('Erreur lors du chargement du tableau de bord');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  if (loading && !stats) return <div className="flex items-center justify-center py-12 text-muted-foreground">Chargement...</div>;
  if (error && !stats) return <div className="text-destructive bg-destructive/10 p-4 rounded-lg mb-6">{error}</div>;
  if (!stats) return null;

  const badgeCards = [
    { label: 'Total badges', value: stats.totalBadges || 0, icon: IdCard, bg: 'bg-[#674459]/10', fg: 'text-[#674459]', action: () => navigate('/verification-badges'), roles: ['AGENT_SURETE'] },
    { label: 'Badges actifs', value: stats.badgesParStatut?.ACTIF || 0, icon: BadgeCheck, bg: 'bg-[#008B60]/10', fg: 'text-[#008B60]', action: () => navigate('/verification-badges'), roles: ['AGENT_SURETE'] },
    { label: 'Suspendus', value: stats.badgesParStatut?.SUSPENDU || 0, icon: PauseCircle, bg: 'bg-[#F1BE5B]/15', fg: 'text-[#A67C00]', action: () => navigate('/verification-badges'), roles: ['AGENT_SURETE'] },
    { label: 'Révoqués', value: stats.badgesParStatut?.REVOQUE || 0, icon: XCircle, bg: 'bg-[#C20831]/10', fg: 'text-[#C20831]', action: () => navigate('/verification-badges'), roles: ['AGENT_SURETE'] },
    { label: 'Expirés', value: stats.badgesParStatut?.EXPIRE || 0, icon: Clock, bg: 'bg-[#674459]/10', fg: 'text-[#674459]', action: () => navigate('/verification-badges'), roles: ['AGENT_SURETE'] },
    { label: 'Expirant sous 30j', value: stats.badgesExpirantSous30J?.length || 0, icon: Clock, bg: 'bg-[#F1BE5B]/15', fg: 'text-[#A67C00]', action: () => navigate('/verification-badges'), roles: ['AGENT_SURETE'] },
  ];

  const demandeBarData = [
    { name: 'En attente N1', value: stats.demandesParStatut?.EN_ATTENTE_N1 || 0 },
    { name: 'En attente N2', value: stats.demandesParStatut?.EN_ATTENTE_N2 || 0 },
    { name: 'Validées', value: stats.demandesParStatut?.VALIDEE || 0 },
    { name: 'Refusées N1', value: stats.demandesParStatut?.REFUSEE_N1 || 0 },
    { name: 'Refusées N2', value: stats.demandesParStatut?.REFUSEE_N2 || 0 },
  ];
  const demandeBarColors = ['#674459', '#F1BE5B', '#008B60', '#C20831', '#C20831'];
  const hasDemandeData = demandeBarData.some((d) => d.value > 0);

  const totalDemandes = demandeBarData.reduce((sum, d) => sum + d.value, 0);
  const validees = stats.demandesParStatut?.VALIDEE || 0;
  const tauxValidation = totalDemandes > 0 ? Math.round((validees / totalDemandes) * 100) : 0;

  const infoCards = [
    { label: 'En attente N1', value: stats.demandesParStatut?.EN_ATTENTE_N1 || 0, icon: ClipboardList, bg: 'bg-[#F1BE5B]/15', fg: 'text-[#A67C00]', action: () => navigate('/validations'), roles: ['MANAGER'] },
    { label: 'En attente N2', value: stats.demandesParStatut?.EN_ATTENTE_N2 || 0, icon: ClipboardCheck, bg: 'bg-[#674459]/10', fg: 'text-[#674459]', action: () => navigate('/dossiers-n2'), roles: ['AGENT_SURETE'] },
    { label: 'Taux de validation', value: `${tauxValidation}%`, icon: BarChart3, bg: 'bg-[#674459]/10', fg: 'text-[#674459]' },
    { label: 'Total employés', value: stats.totalEmployes || 0, icon: Users },
    { label: 'Incidents en cours', value: stats.incidentsEnCours || 0, icon: AlertTriangle },
    { label: 'Total passages', value: stats.totalPassages || 0, icon: ArrowRightLeft, action: () => navigate('/historique'), roles: ['AGENT_SURETE'] },
  ];

  const badgePieData = badgeCards.filter((c) => !['Total badges', 'Expirant sous 30j'].includes(c.label) && c.value > 0).map((c) => ({ name: c.label, value: c.value }));
  const hasBadgeData = badgePieData.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tableau de bord</h1>
          <p className="text-sm text-muted-foreground mt-1">Vue d'ensemble du système de badges</p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-muted-foreground">Mise à jour : {lastUpdated.toLocaleTimeString('fr-FR')}</span>
          )}
          <Button variant="outline" size="sm" onClick={fetchStats} disabled={loading}>
            <RefreshCw className={`size-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Actualisation...' : 'Actualiser'}
          </Button>
        </div>
      </div>

      {error && <div className="text-destructive bg-destructive/10 p-3 rounded-md text-sm">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {badgeCards.map((card) => {
          const clickable = card.action && (!card.roles || card.roles.includes(role));
          return (
            <Card key={card.label} className={`shadow-sm ${clickable ? 'cursor-pointer transition-shadow hover:shadow-md' : ''}`} onClick={clickable ? card.action : undefined}>
              <CardContent className="flex items-center gap-4 p-6">
                <div className={`rounded-lg p-2.5 shrink-0 ${card.bg}`}>
                  <card.icon className={`size-5 ${card.fg}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                  <p className="text-2xl font-bold text-foreground">{card.value}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {infoCards.map((card) => {
          const clickable = card.action && (!card.roles || card.roles.includes(role));
          return (
            <Card key={card.label} className={`shadow-sm ${clickable ? 'cursor-pointer transition-shadow hover:shadow-md' : ''}`} onClick={clickable ? card.action : undefined}>
              <CardContent className="flex items-center gap-4 p-6">
                <div className={`rounded-lg p-2.5 shrink-0 ${clickable ? 'bg-[#674459]/10' : 'bg-muted'}`}>
                  <card.icon className={`size-5 ${clickable ? 'text-[#674459]' : 'text-muted-foreground'}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                  <p className="text-2xl font-bold text-foreground">{card.value}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Répartition des badges</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {hasBadgeData ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={badgePieData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {badgePieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center min-h-[280px] text-muted-foreground">
                <PackageOpen className="size-12 mb-3 text-muted-foreground/50" />
                <p className="text-sm">Aucune donnée de badge</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Demandes par statut</CardTitle>
            {totalDemandes > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                Taux de validation : <span className="font-medium text-[#008B60]">{tauxValidation}%</span> ({validees} validées sur {totalDemandes})
              </p>
            )}
          </CardHeader>
          <CardContent className="p-6">
            {hasDemandeData ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={demandeBarData}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" name="Demandes" radius={[4, 4, 0, 0]}>
                    {demandeBarData.map((_, i) => (
                      <Cell key={i} fill={demandeBarColors[i % demandeBarColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center min-h-[280px] text-muted-foreground">
                <BarChart3 className="size-12 mb-3 text-muted-foreground/50" />
                <p className="text-sm">Aucune demande pour le moment</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Passages (30 derniers jours)</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {stats.passagesParJour?.length ? (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={stats.passagesParJour} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="jour" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="valeur" name="Passages" stroke="#008B60" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center min-h-[240px] text-muted-foreground">
                <ArrowRightLeft className="size-12 mb-3 text-muted-foreground/50" />
                <p className="text-sm">Aucun passage enregistré</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Demandes (30 derniers jours)</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {stats.demandesParJour?.length ? (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={stats.demandesParJour} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="jour" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="valeur" name="Demandes" stroke="#674459" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center min-h-[240px] text-muted-foreground">
                <BarChart3 className="size-12 mb-3 text-muted-foreground/50" />
                <p className="text-sm">Aucune demande pour le moment</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Badges par direction</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {stats.badgesParDirection?.length ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={stats.badgesParDirection} layout="vertical" margin={{ left: 8, right: 12 }}>
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="nom" width={140} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="valeur" name="Badges" fill="#674459" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center min-h-[280px] text-muted-foreground">
                <IdCard className="size-12 mb-3 text-muted-foreground/50" />
                <p className="text-sm">Aucun badge par direction</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Passages par zone</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {stats.passagesParZone?.length ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={stats.passagesParZone} layout="vertical" margin={{ left: 8, right: 12 }}>
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="nom" width={140} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="valeur" name="Passages" fill="#008B60" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center min-h-[280px] text-muted-foreground">
                <ArrowRightLeft className="size-12 mb-3 text-muted-foreground/50" />
                <p className="text-sm">Aucun passage par zone</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Derniers passages</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {stats.derniersPassages?.length ? (
              <ul className="space-y-3">
                {stats.derniersPassages.map((p, i) => (
                  <li key={i} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{p.employeNom}</p>
                      <p className="text-xs text-muted-foreground">{p.zoneNom} · {p.directionNom}</p>
                    </div>
                    <div className="flex flex-col items-end gap-0.5 shrink-0">
                      <span className={`text-xs font-semibold ${p.resultat === 'AUTORISE' ? 'text-[#008B60]' : 'text-[#C20831]'}`}>
                        {p.resultat === 'AUTORISE' ? 'Autorisé' : 'Refusé'}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {p.horodatage ? p.horodatage.slice(0, 16).replace('T', ' ') : ''}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center min-h-[200px] text-muted-foreground">
                <ArrowRightLeft className="size-10 mb-3 text-muted-foreground/50" />
                <p className="text-sm">Aucun passage sur les 7 derniers jours</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Badges expirant sous 30 jours</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {stats.badgesExpirantSous30J?.length ? (
              <ul className="space-y-3">
                {stats.badgesExpirantSous30J.map((b, i) => (
                  <li key={i} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{b.employeNom}</p>
                      <p className="text-xs text-muted-foreground">Badge {b.uidUnique}</p>
                    </div>
                    <span className="text-xs font-medium text-[#A67C00] shrink-0">Expire le {b.dateExpiration}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center min-h-[200px] text-muted-foreground">
                <Clock className="size-10 mb-3 text-muted-foreground/50" />
                <p className="text-sm">Aucun badge n'expire sous 30 jours</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Demandes en attente prioritaires</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {stats.demandesPlusAnciennes?.length ? (
              <ul className="space-y-3">
                {stats.demandesPlusAnciennes.map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{d.employeNom}</p>
                      <p className="text-xs text-muted-foreground">
                        {d.directionNom} · {d.statut === 'EN_ATTENTE_N1' ? 'Attente N1' : 'Attente N2'}
                      </p>
                    </div>
                    <span className={`text-xs font-semibold shrink-0 ${d.ageJours >= 3 ? 'text-[#C20831]' : 'text-[#A67C00]'}`}>
                      {d.ageJours} j
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center min-h-[200px] text-muted-foreground">
                <Clock className="size-10 mb-3 text-muted-foreground/50" />
                <p className="text-sm">Aucune demande en attente</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {stats.incidentsEnCours > 0 && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Alertes récentes</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-destructive">
              <AlertTriangle className="size-5 shrink-0" />
              <p className="font-medium">{stats.incidentsEnCours} incident(s) en cours de traitement</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
