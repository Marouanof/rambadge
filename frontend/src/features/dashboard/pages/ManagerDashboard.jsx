import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ClipboardList, Badge, AlertTriangle, ArrowRightLeft, PackageOpen } from 'lucide-react';

export default function ManagerDashboard() {
  const [stats, setStats] = useState(null);
  const [employes, setEmployes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/manager'),
      api.get('/managers/mes-employes', { params: { page: 0, size: 10 } }),
    ])
      .then(([dashRes, empRes]) => {
        setStats(dashRes.data.data);
        setEmployes(empRes.data.data.content || []);
      })
      .catch(() => setError('Erreur lors du chargement'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center py-12 text-muted-foreground">Chargement...</div>;
  if (error) return <div className="text-destructive bg-destructive/10 p-4 rounded-lg mb-6">{error}</div>;
  if (!stats) return null;

  const kpiCards = [
    { label: 'Demandes en attente (N1)', value: stats.demandesN1EnAttente || 0, icon: ClipboardList, bg: 'bg-orange-100', fg: 'text-orange-600', action: () => navigate('/validations') },
    { label: 'Badges de la direction', value: stats.badgesDirection || 0, icon: Badge, bg: 'bg-blue-100', fg: 'text-blue-600' },
    { label: 'Incidents en cours', value: stats.incidentsDirection || 0, icon: AlertTriangle, bg: 'bg-red-100', fg: 'text-red-600' },
    { label: 'Passages', value: stats.passagesDirection || 0, icon: ArrowRightLeft, bg: 'bg-gray-100', fg: 'text-gray-600' },
  ];

  const getBadgeClass = (statut) => {
    const map = {
      ACTIF: 'bg-green-100 text-green-700',
      SUSPENDU: 'bg-orange-100 text-orange-700',
      REVOQUE: 'bg-red-100 text-red-700',
      EXPIRE: 'bg-gray-100 text-gray-600',
      EN_ATTENTE: 'bg-orange-100 text-orange-700',
    };
    return map[statut] || 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tableau de bord</h1>
        <p className="text-sm text-muted-foreground mt-1">Vue d'ensemble de votre direction</p>
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

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Employés de la direction</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {employes.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[200px] text-muted-foreground">
              <PackageOpen className="size-12 mb-3 text-muted-foreground/50" />
              <p className="text-sm">Aucun employé dans votre direction</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-muted-foreground">
                    <th className="pb-2 font-medium">Nom</th>
                    <th className="pb-2 font-medium">Prénom</th>
                    <th className="pb-2 font-medium">Statut badge</th>
                  </tr>
                </thead>
                <tbody>
                  {employes.map((e) => (
                    <tr key={e.id} className="border-b last:border-0">
                      <td className="py-2.5 text-sm">{e.nom}</td>
                      <td className="py-2.5 text-sm">{e.prenom}</td>
                      <td className="py-2.5">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${getBadgeClass(e.statut)}`}>
                          {e.statut || 'Aucun'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
