import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api from '@/services/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClipboardCheck, ShieldAlert, BadgeCheck, ArrowRightLeft, BarChart3 } from 'lucide-react';

export default function SureteDashboard() {
  const [stats, setStats] = useState(null);
  const [zones, setZones] = useState([]);
  const [oldestDemandes, setOldestDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/surete'),
      api.get('/zones'),
      api.get('/demandes', { params: { page: 0, size: 5 } }),
    ])
      .then(([dashRes, zonesRes, demRes]) => {
        setStats(dashRes.data.data);
        setZones(zonesRes.data.data || []);
        const n2 = (demRes.data.data.content || []).filter((d) => d.statut === 'EN_ATTENTE_N2');
        setOldestDemandes(n2.slice(0, 5));
      })
      .catch(() => setError('Erreur lors du chargement'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center py-12 text-muted-foreground">Chargement...</div>;
  if (error) return <div className="text-destructive bg-destructive/10 p-4 rounded-lg mb-6">{error}</div>;
  if (!stats) return null;

  const kpiCards = [
    { label: 'Dossiers à instruire (N2)', value: stats.demandesN2EnAttente || 0, icon: ClipboardCheck, bg: 'bg-orange-100', fg: 'text-orange-600', action: () => navigate('/dossiers-n2') },
    { label: 'Incidents en cours', value: stats.incidentsEnCours || 0, icon: ShieldAlert, bg: 'bg-red-100', fg: 'text-red-600', action: () => navigate('/incidents-surete') },
    { label: 'Badges actifs', value: stats.badgesActifs || 0, icon: BadgeCheck, bg: 'bg-green-100', fg: 'text-green-600' },
    { label: 'Total passages', value: stats.totalPassages || 0, icon: ArrowRightLeft, bg: 'bg-blue-100', fg: 'text-blue-600' },
  ];

  const zoneData = zones.map((z) => ({ name: z.nom, value: stats.badgesParZone?.[z.nom] || 0 }));
  const hasZoneData = zoneData.length > 0 && zoneData.some((z) => z.value > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tableau de bord Sûreté</h1>
        <p className="text-sm text-muted-foreground mt-1">Supervision de la sécurité et des accès</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((card) => (
          <Card key={card.label} className={`shadow-sm ${card.action ? 'cursor-pointer transition-shadow hover:shadow-md' : ''}`} onClick={card.action}>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Badges actifs par zone</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {hasZoneData ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={zoneData}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center min-h-[280px] text-muted-foreground">
                <BarChart3 className="size-12 mb-3 text-muted-foreground/50" />
                <p className="text-sm">Aucune donnée de badges par zone</p>
              </div>
            )}
          </CardContent>
        </Card>

        {oldestDemandes.length > 0 && (
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Dossiers les plus anciens en attente</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-sm text-muted-foreground">
                      <th className="pb-2 font-medium">Employé</th>
                      <th className="pb-2 font-medium">Direction</th>
                      <th className="pb-2 font-medium">Date</th>
                      <th className="pb-2 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {oldestDemandes.map((d) => (
                      <tr key={d.id} className="border-b last:border-0">
                        <td className="py-2.5 text-sm">{d.employePrenom} {d.employeNom}</td>
                        <td className="py-2.5 text-sm">{d.directionNom}</td>
                        <td className="py-2.5 text-sm">{new Date(d.createdAt).toLocaleDateString()}</td>
                        <td className="py-2.5">
                          <Button size="sm" variant="outline" onClick={() => navigate('/dossiers-n2')}>
                            Instruire
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
