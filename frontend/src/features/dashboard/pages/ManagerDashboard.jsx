import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClipboardList, Badge, AlertTriangle, ArrowRightLeft, ChevronLeft, ChevronRight, ClipboardCheck, CalendarClock, UserX, UserRoundX } from 'lucide-react';

export default function ManagerDashboard() {
  const [stats, setStats] = useState(null);
  const [demandes, setDemandes] = useState([]);
  const [demandePage, setDemandePage] = useState(0);
  const [demandeTotalPages, setDemandeTotalPages] = useState(0);
  const [demandeLoading, setDemandeLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/dashboard/manager')
      .then((res) => setStats(res.data.data))
      .catch(() => setError('Erreur lors du chargement'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setDemandeLoading(true);
    api.get('/demandes/en-attente-n1', { params: { page: demandePage, size: 5 } })
      .then((res) => {
        setDemandes(res.data.data.content || []);
        setDemandeTotalPages(res.data.data.totalPages || 0);
      })
      .catch(() => setError('Erreur lors du chargement'))
      .finally(() => setDemandeLoading(false));
  }, [demandePage]);

  if (loading) return <div className="flex items-center justify-center py-12 text-muted-foreground">Chargement...</div>;
  if (error) return <div className="text-destructive bg-destructive/10 p-4 rounded-lg mb-6">{error}</div>;
  if (!stats) return null;

  const kpiCards = [
    { label: 'Demandes en attente (N1)', value: stats.demandesN1EnAttente || 0, icon: ClipboardList, bg: 'bg-[#F1BE5B]/15', fg: 'text-[#A67C00]', action: () => navigate('/validations') },
    { label: 'Demandes en attente (N2)', value: stats.demandesN2EnAttente || 0, icon: ClipboardCheck, bg: 'bg-[#F1BE5B]/15', fg: 'text-[#A67C00]', action: () => navigate('/dossiers-n2') },
    { label: 'Badges de la direction', value: stats.badgesDirection || 0, icon: Badge, bg: 'bg-[#C20831]/10', fg: 'text-[#C20831]', action: () => navigate('/badges-direction') },
    { label: 'Badges expirant ≤ 30 jours', value: stats.badgesExpirant30J || 0, icon: CalendarClock, bg: 'bg-[#C20831]/10', fg: 'text-[#C20831]', action: () => navigate('/badges-direction') },
    { label: 'Employés sans badge', value: stats.employesSansBadge || 0, icon: UserX, bg: 'bg-[#674459]/10', fg: 'text-[#674459]', action: () => navigate('/employes-direction') },
    { label: 'Employés suspendus', value: stats.employesSuspendus || 0, icon: UserRoundX, bg: 'bg-[#C20831]/10', fg: 'text-[#C20831]', action: () => navigate('/employes-direction') },
    { label: 'Incidents', value: stats.incidentsDirection || 0, icon: AlertTriangle, bg: 'bg-[#C20831]/10', fg: 'text-[#C20831]', action: () => navigate('/incidents'), subtitle: Object.entries(stats.incidentsParType || {}).filter(([, v]) => v > 0).map(([t, v]) => `${v} ${t.toLowerCase()}`).join(' · ') },
    { label: 'Passages', value: stats.passagesDirection || 0, icon: ArrowRightLeft, bg: 'bg-[#674459]/10', fg: 'text-[#674459]', action: () => navigate('/passages-direction') },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tableau de bord</h1>
        <p className="text-sm text-muted-foreground mt-1">Vue d'ensemble de votre direction</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((card) => (
          <Card key={card.label} className={`shadow-sm ${card.action ? 'cursor-pointer transition-shadow hover:shadow-md' : ''}`} onClick={card.action}>
            <CardContent className="flex items-start gap-4 p-6">
              <div className={`rounded-lg p-2.5 shrink-0 ${card.bg}`}>
                <card.icon className={`size-5 ${card.fg}`} />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">{card.label}</p>
                <p className="text-2xl font-bold text-foreground">{card.value}</p>
                {card.subtitle && <p className="text-xs text-muted-foreground mt-1 truncate">{card.subtitle}</p>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Demandes à valider (N1)</CardTitle>
          <Button variant="link" className="h-auto p-0 text-sm" onClick={() => navigate('/validations')}>
            Tout voir
          </Button>
        </CardHeader>
        <CardContent className="p-6">
          {demandeLoading ? (
            <div className="flex items-center justify-center min-h-[200px] text-muted-foreground">Chargement...</div>
          ) : demandes.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[200px] text-muted-foreground">
              <ClipboardList className="size-12 mb-3 text-muted-foreground/50" />
              <p className="text-sm">Aucune demande en attente de validation</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-sm text-muted-foreground">
                      <th className="pb-2 font-medium">Employé</th>
                      <th className="pb-2 font-medium">Date</th>
                      <th className="pb-2 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {demandes.map((d) => (
                      <tr key={d.id} className="border-b last:border-0">
                        <td className="py-2.5 text-sm">{d.employePrenom} {d.employeNom}</td>
                        <td className="py-2.5 text-sm text-muted-foreground">{new Date(d.createdAt).toLocaleDateString()}</td>
                        <td className="py-2.5 text-right">
                          <Button variant="outline" size="sm" onClick={() => navigate('/validations')}>
                            Instruire
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-center gap-3 mt-4">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" disabled={demandePage === 0} onClick={() => setDemandePage(demandePage - 1)} aria-label="Page précédente">
                    <ChevronLeft className="size-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">{demandeTotalPages > 0 ? demandePage + 1 : 0} / {demandeTotalPages}</span>
                  <Button variant="outline" size="icon" disabled={demandePage >= demandeTotalPages - 1} onClick={() => setDemandePage(demandePage + 1)} aria-label="Page suivante">
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
