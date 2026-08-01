import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge, History, FileText, Clock, CheckCircle2, XCircle, PauseCircle } from 'lucide-react';

export default function EmployeDashboard() {
  const [stats, setStats] = useState(null);
  const [demande, setDemande] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
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

  if (loading) return <div className="flex items-center justify-center py-12 text-muted-foreground">Chargement...</div>;
  if (error) return <div className="text-destructive bg-destructive/10 p-4 rounded-lg mb-6">{error}</div>;
  if (!stats) return null;

  const statutInfo = {
    AUCUNE_DEMANDE: { label: 'Aucune demande', icon: FileText, bg: 'bg-gray-100', fg: 'text-gray-600' },
    EN_ATTENTE_N1: { label: 'En attente N1', icon: Clock, bg: 'bg-orange-100', fg: 'text-orange-600' },
    EN_ATTENTE_N2: { label: 'En attente N2', icon: Clock, bg: 'bg-orange-100', fg: 'text-orange-600' },
    VALIDEE: { label: 'Actif', icon: CheckCircle2, bg: 'bg-green-100', fg: 'text-green-600' },
    REFUSEE_N1: { label: 'Refusée N1', icon: XCircle, bg: 'bg-red-100', fg: 'text-red-600' },
    REFUSEE_N2: { label: 'Refusée N2', icon: XCircle, bg: 'bg-red-100', fg: 'text-red-600' },
    SUSPENDU: { label: 'Suspendu', icon: PauseCircle, bg: 'bg-orange-100', fg: 'text-orange-600' },
    REVOQUE: { label: 'Révoqué', icon: XCircle, bg: 'bg-red-100', fg: 'text-red-600' },
    EXPIRE: { label: 'Expiré', icon: Clock, bg: 'bg-gray-100', fg: 'text-gray-600' },
  };

  const currentStatut = demande?.statut || (stats.aBadgeActif ? 'VALIDEE' : 'AUCUNE_DEMANDE');
  const info = statutInfo[currentStatut] || statutInfo.AUCUNE_DEMANDE;

  const isWaiting = currentStatut === 'EN_ATTENTE_N1' || currentStatut === 'EN_ATTENTE_N2';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Mon espace</h1>
        <p className="text-sm text-muted-foreground mt-1">Récapitulatif de votre badge et de vos passages</p>
      </div>

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

      {currentStatut === 'AUCUNE_DEMANDE' && (
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center min-h-[200px] text-muted-foreground">
              <FileText className="size-12 mb-3 text-muted-foreground/50" />
              <p className="text-sm mb-4">Vous n'avez pas encore de demande de badge en cours.</p>
              <Button onClick={() => navigate('/ma-demande')}>
                Soumettre une demande
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
