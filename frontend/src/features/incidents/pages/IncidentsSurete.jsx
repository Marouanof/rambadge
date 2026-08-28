import { useState, useEffect } from 'react';
import api from '@/services/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { ShieldAlert, AlertTriangle, CheckCircle2, XCircle, ChevronLeft, ChevronRight, ChevronDown, Search } from 'lucide-react';

const typeIncidentLabel = (type) => {
  const map = { PERTE: 'Perte', VOL: 'Vol', FIN_CONTRAT: 'Fin de contrat' };
  return map[type] || type;
};

const statutLabel = (statut) => {
  const map = { PROGRAMME: 'Programmé', SUSPENDU: 'Suspendu', REVOQUE: 'Révoqué', LEVE: 'Levée' };
  return map[statut] || statut;
};

const formatDate = (date) => (date ? new Date(date).toLocaleDateString() : '-');

export default function IncidentsSurete() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [statut, setStatut] = useState('');
  const [type, setType] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchIncidents = async (p, statut, type, search) => {
    setLoading(true);
    try {
      const params = { page: p, size: 10 };
      if (statut) params.statut = statut;
      if (type) params.type = type;
      if (search) params.search = search;
      const res = await api.get('/incidents', { params });
      setIncidents(res.data.data.content);
      setTotalPages(res.data.data.totalPages);
    } catch {
      setError('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchIncidents(page, statut, type, search); }, [page, statut, type, search]);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(0);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

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
      fetchIncidents(page, statut, type, search);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    } finally {
      setActionLoading(false);
    }
  };

  const statutConfig = {
    PROGRAMME: { cls: 'bg-[#F1BE5B]/15 text-[#A67C00]' },
    SUSPENDU: { cls: 'bg-[#F1BE5B]/15 text-[#A67C00]' },
    REVOQUE: { cls: 'bg-[#C20831]/10 text-[#C20831]' },
    LEVE: { cls: 'bg-[#008B60]/10 text-[#008B60]' },
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

          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="relative w-full max-w-[260px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Badge UID ou signalant..."
                className="w-full rounded-md border border-input bg-background pl-8 pr-3 h-9 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <label className="text-sm text-muted-foreground shrink-0">Statut :</label>
            <div className="relative w-full max-w-[220px]">
              <select
                value={statut}
                onChange={(e) => { setStatut(e.target.value); setPage(0); }}
                className="w-full appearance-none rounded-md border border-input bg-background px-3 h-9 text-sm pr-8 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Tous</option>
                {Object.keys(statutConfig).map((s) => (
                  <option key={s} value={s}>{statutLabel(s)}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            </div>
            <label className="text-sm text-muted-foreground shrink-0">Type :</label>
            <div className="relative w-full max-w-[220px]">
              <select
                value={type}
                onChange={(e) => { setType(e.target.value); setPage(0); }}
                className="w-full appearance-none rounded-md border border-input bg-background px-3 h-9 text-sm pr-8 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Tous</option>
                {['PERTE', 'VOL', 'FIN_CONTRAT'].map((t) => (
                  <option key={t} value={t}>{typeIncidentLabel(t)}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

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
                      <td className="py-3 text-sm text-muted-foreground max-w-[150px] truncate" title={inc.commentaire}>
                        {inc.typeIncident === 'FIN_CONTRAT' && inc.dateFinContrat
                          ? `Fin de contrat : ${formatDate(inc.dateFinContrat)}`
                          : (inc.commentaire || '-')}
                      </td>
                      <td className="py-3 text-sm">{formatDate(inc.dateIncident)}</td>
                      <td className="py-3">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${statutConfig[inc.statut]?.cls || 'bg-[#674459]/10 text-[#674459]'}`}>
                          {statutLabel(inc.statut)}
                        </span>
                      </td>
                      <td className="py-3">
                        {inc.statut === 'SUSPENDU' && (
                          <div className="flex gap-1.5">
                            <Button variant="destructive" size="sm" onClick={() => openConfirmAction('revoke', inc)}>
                              <XCircle className="size-3.5 mr-1" />
                              Revoquer
                            </Button>
                            {inc.typeIncident !== 'FIN_CONTRAT' && (
                              <Button variant="outline" size="sm" onClick={() => openConfirmAction('lift', inc)}>
                                <CheckCircle2 className="size-3.5 mr-1" />
                                Lever
                              </Button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex items-center justify-center gap-3 mt-4">
            <Button variant="outline" size="icon" disabled={page === 0} onClick={() => setPage(page - 1)} aria-label="Page precedente">
              <ChevronLeft className="size-4" />
            </Button>
            <span className="text-sm text-muted-foreground">{totalPages > 0 ? page + 1 : 0} / {totalPages}</span>
            <Button variant="outline" size="icon" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)} aria-label="Page suivante">
              <ChevronRight className="size-4" />
            </Button>
          </div>
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
            <div className="flex items-start gap-3 p-3 bg-[#F1BE5B]/10 border border-[#F1BE5B]/40 rounded-md">
              <AlertTriangle className="size-5 text-[#A67C00] shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-[#5C4A00]">
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
                {confirmAction.incident.typeIncident === 'FIN_CONTRAT' && (
                  <div><span className="text-muted-foreground">Fin de contrat :</span> <span className="font-medium">{formatDate(confirmAction.incident.dateFinContrat)}</span></div>
                )}
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
