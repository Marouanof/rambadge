import { useState, useEffect } from 'react';
import api from '@/services/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { ShieldAlert, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

const typeIncidentLabel = (type) => {
  const map = { PERTE: 'Perte', VOL: 'Vol', FIN_CONTRAT: 'Fin de contrat' };
  return map[type] || type;
};

export default function IncidentsSurete() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [confirmAction, setConfirmAction] = useState(null);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchIncidents = async (p) => {
    setLoading(true);
    try {
      const res = await api.get('/incidents', { params: { page: p, size: 10 } });
      setIncidents(res.data.data.content);
      setTotalPages(res.data.data.totalPages);
    } catch {
      setError('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchIncidents(page); }, [page]);

  const openConfirmAction = (action, incident) => {
    setConfirmAction({ action, incident });
  };

  const executeAction = async () => {
    if (!confirmAction) return;
    setActionLoading(true);
    try {
      if (confirmAction.action === 'revoke') {
        await api.patch(`/incidents/${confirmAction.incident.id}/confirm-revoke`);
      } else if (confirmAction.action === 'lift') {
        await api.patch(`/incidents/${confirmAction.incident.id}/lift-suspension`);
      }
      setConfirmAction(null);
      fetchIncidents(page);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    } finally {
      setActionLoading(false);
    }
  };

  const statutConfig = {
    SUSPENDU: { variant: 'secondary' },
    REVOQUE: { variant: 'destructive' },
    LEVE: { variant: 'default' },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Incidents / Revocations</h1>
        <p className="text-sm text-muted-foreground mt-1">Gestion des incidents de securite</p>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-6">
          {error && <div className="text-destructive bg-destructive/10 p-3 rounded-md mb-4 text-sm">{error}</div>}

          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">Chargement...</div>
          ) : incidents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <ShieldAlert className="size-12 mb-3 text-muted-foreground/50" />
              <p className="text-sm">Aucun incident en cours</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-muted-foreground">
                    <th className="pb-3 font-medium">Badge UID</th>
                    <th className="pb-3 font-medium">Signalant</th>
                    <th className="pb-3 font-medium">Direction</th>
                    <th className="pb-3 font-medium">Type</th>
                    <th className="pb-3 font-medium">Motif</th>
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Statut</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {incidents.map((inc) => (
                    <tr key={inc.id} className="border-b last:border-0">
                      <td className="py-3 text-sm font-mono text-xs">{inc.badgeUid}</td>
                      <td className="py-3 text-sm">{inc.signalantNom}</td>
                      <td className="py-3 text-sm">{inc.directionNom || '-'}</td>
                      <td className="py-3 text-sm">{typeIncidentLabel(inc.typeIncident)}</td>
                      <td className="py-3 text-sm text-muted-foreground max-w-[150px] truncate" title={inc.commentaire}>{inc.commentaire || '-'}</td>
                      <td className="py-3 text-sm">{new Date(inc.dateIncident).toLocaleDateString()}</td>
                      <td className="py-3">
                        <Badge variant={statutConfig[inc.statut]?.variant || 'secondary'} className="text-xs">
                          {inc.statut}
                        </Badge>
                      </td>
                      <td className="py-3">
                        {inc.statut === 'SUSPENDU' && (
                          <div className="flex gap-1.5">
                            <Button variant="destructive" size="sm" onClick={() => openConfirmAction('revoke', inc)}>
                              <XCircle className="size-3.5 mr-1" />
                              Revoquer
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => openConfirmAction('lift', inc)}>
                              <CheckCircle2 className="size-3.5 mr-1" />
                              Lever
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-4">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>Precedent</Button>
              <span className="text-sm text-muted-foreground">{page + 1} / {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>Suivant</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!confirmAction} onOpenChange={(open) => { if (!open) setConfirmAction(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmAction?.action === 'revoke' ? 'Confirmer la revocation' : 'Confirmer la levée de suspension'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-md">
              <AlertTriangle className="size-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-amber-800">
                  {confirmAction?.action === 'revoke'
                    ? 'Etes-vous sur de vouloir <strong>revoquer</strong> le badge ? Cette action est irreversible.'
                    : 'Etes-vous sur de vouloir <strong>lever la suspension</strong> du badge ?'}
                </p>
              </div>
            </div>
            {confirmAction && (
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-muted-foreground">Badge UID :</span> <span className="font-medium">{confirmAction.incident.badgeUid}</span></div>
                <div><span className="text-muted-foreground">Signalant :</span> <span className="font-medium">{confirmAction.incident.signalantNom}</span></div>
                <div><span className="text-muted-foreground">Direction :</span> <span className="font-medium">{confirmAction.incident.directionNom || '-'}</span></div>
                <div><span className="text-muted-foreground">Type :</span> <span className="font-medium">{typeIncidentLabel(confirmAction.incident.typeIncident)}</span></div>
                <div className="col-span-2"><span className="text-muted-foreground">Motif :</span> <span className="font-medium">{confirmAction.incident.commentaire || '-'}</span></div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmAction(null)}>Annuler</Button>
            <Button
              variant={confirmAction?.action === 'revoke' ? 'destructive' : 'default'}
              onClick={executeAction}
              disabled={actionLoading}
            >
              {actionLoading ? 'Envoi...' : 'Confirmer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
