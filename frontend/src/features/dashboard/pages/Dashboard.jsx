import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import api from '@/services/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  BadgeCheck, PauseCircle, XCircle, Clock,
  Users, AlertTriangle, ArrowRightLeft,
  PackageOpen, BarChart3,
} from 'lucide-react';

const COLORS = ['#22c55e', '#f59e0b', '#ef4444', '#6b7280', '#3b82f6'];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/dashboard/super-admin')
      .then((res) => setStats(res.data.data))
      .catch(() => setError('Erreur lors du chargement du tableau de bord'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center py-12 text-muted-foreground">Chargement...</div>;
  if (error) return <div className="text-destructive bg-destructive/10 p-4 rounded-lg mb-6">{error}</div>;
  if (!stats) return null;

  const badgeCards = [
    { label: 'Badges actifs', value: stats.badgesParStatut?.ACTIF || 0, icon: BadgeCheck, bg: 'bg-green-100', fg: 'text-green-600' },
    { label: 'Suspendus', value: stats.badgesParStatut?.SUSPENDU || 0, icon: PauseCircle, bg: 'bg-orange-100', fg: 'text-orange-600' },
    { label: 'Révoqués', value: stats.badgesParStatut?.REVOQUE || 0, icon: XCircle, bg: 'bg-red-100', fg: 'text-red-600' },
    { label: 'Expirés', value: stats.badgesParStatut?.EXPIRE || 0, icon: Clock, bg: 'bg-gray-100', fg: 'text-gray-600' },
  ];

  const infoCards = [
    { label: 'Total employés', value: stats.totalEmployes || 0, icon: Users },
    { label: 'Incidents en cours', value: stats.incidentsEnCours || 0, icon: AlertTriangle },
    { label: 'Total passages', value: stats.totalPassages || 0, icon: ArrowRightLeft },
  ];

  const badgePieData = badgeCards.filter((c) => c.value > 0).map((c) => ({ name: c.label, value: c.value }));
  const hasBadgeData = badgePieData.length > 0;

  const demandeBarData = [
    { name: 'En attente N1', value: stats.demandesParStatut?.EN_ATTENTE_N1 || 0 },
    { name: 'En attente N2', value: stats.demandesParStatut?.EN_ATTENTE_N2 || 0 },
    { name: 'Validées', value: stats.demandesParStatut?.VALIDEE || 0 },
    { name: 'Refusées', value: (stats.demandesParStatut?.REFUSEE_N1 || 0) + (stats.demandesParStatut?.REFUSEE_N2 || 0) },
  ];
  const hasDemandeData = demandeBarData.some((d) => d.value > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tableau de bord</h1>
        <p className="text-sm text-muted-foreground mt-1">Vue d'ensemble du système de badges</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {badgeCards.map((card) => (
          <Card key={card.label} className="shadow-sm">
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
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {infoCards.map((card) => (
          <Card key={card.label} className="shadow-sm">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-lg p-2.5 shrink-0 bg-muted">
                <card.icon className="size-5 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">{card.label}</p>
                <p className="text-2xl font-bold text-foreground">{card.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
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
          </CardHeader>
          <CardContent className="p-6">
            {hasDemandeData ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={demandeBarData}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
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
