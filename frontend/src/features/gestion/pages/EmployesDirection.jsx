import { useState, useEffect, Fragment } from 'react';
import api from '@/services/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Search, Users, ChevronLeft, ChevronRight, ChevronDown, PauseCircle, PlayCircle, UserX } from 'lucide-react';

const statutBadgeClass = (statut) => {
  const map = {
    ACTIF: 'bg-[#008B60]/10 text-[#008B60]',
    EN_ATTENTE: 'bg-[#F1BE5B]/15 text-[#A67C00]',
    SUSPENDU: 'bg-[#C20831]/10 text-[#C20831]',
    INACTIF: 'bg-[#674459]/10 text-[#674459]',
  };
  return map[statut] || 'bg-[#674459]/10 text-[#674459]';
};

export default function EmployesDirection() {
  const [employes, setEmployes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState('');
  const [statutFilter, setStatutFilter] = useState('');
  const [posteFilter, setPosteFilter] = useState('');
  const [postes, setPostes] = useState([]);
  const [error, setError] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [confirmDisable, setConfirmDisable] = useState(null);
  const [disableError, setDisableError] = useState('');

  const fetchEmployes = async (p, s, st, po) => {
    setLoading(true);
    try {
      const params = { page: p, size: 10 };
      if (s) params.search = s;
      if (st) params.statut = st;
      if (po) params.poste = po;
      const res = await api.get('/managers/mes-employes', { params });
      setEmployes(res.data.data.content);
      setTotalPages(res.data.data.totalPages);
    } catch {
      setError('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEmployes(page, search, statutFilter, posteFilter); }, [page, search, statutFilter, posteFilter]);

  useEffect(() => {
    api.get('/managers/mes-employes/postes')
      .then((res) => setPostes(res.data.data || []))
      .catch(() => setPostes([]));
  }, []);

  const handleChangeStatut = async (id, statut) => {
    setActionLoadingId(id);
    setError('');
    try {
      await api.patch(`/managers/mes-employes/${id}/statut`, null, { params: { statut } });
      fetchEmployes(page, search, statutFilter, posteFilter);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors du changement de statut');
    } finally {
      setActionLoadingId(null);
    }
  };

  const confirmDisableEmploye = async () => {
    setActionLoadingId(confirmDisable.id);
    setDisableError('');
    try {
      await api.patch(`/managers/mes-employes/${confirmDisable.id}/statut`, null, { params: { statut: 'INACTIF' } });
      setConfirmDisable(null);
      fetchEmployes(page, search, statutFilter, posteFilter);
    } catch (err) {
      setDisableError(err.response?.data?.message || 'Erreur lors de la désactivation');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Employes de la direction</h1>
          <p className="text-sm text-muted-foreground mt-1">Liste des employes de votre direction</p>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, prenom, email ou matricule..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                className="pl-8"
              />
            </div>
            <div className="relative shrink-0">
              <select
                value={statutFilter}
                onChange={(e) => { setStatutFilter(e.target.value); setPage(0); }}
                className="h-8 appearance-none rounded-md border border-input bg-background pl-3 pr-8 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Tous les statuts</option>
                {['ACTIF', 'SUSPENDU', 'INACTIF'].map((s) => (<option key={s} value={s}>{s}</option>))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            </div>
            <div className="relative shrink-0">
              <select
                value={posteFilter}
                onChange={(e) => { setPosteFilter(e.target.value); setPage(0); }}
                className="h-8 appearance-none rounded-md border border-input bg-background pl-3 pr-8 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Tous les postes</option>
                {postes.map((p) => (<option key={p} value={p}>{p}</option>))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>

          {error && <div className="text-destructive bg-destructive/10 p-3 rounded-md mb-4 text-sm">{error}</div>}

          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">Chargement...</div>
          ) : employes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Users className="size-12 mb-3 text-muted-foreground/50" />
              <p className="text-sm">Aucun employe trouve</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-muted-foreground">
                    <th className="pb-3 font-medium w-6"></th>
                    <th className="pb-3 font-medium">Employe</th>
                    <th className="pb-3 font-medium">Poste</th>
                    <th className="pb-3 font-medium">Zones habilitees</th>
                    <th className="pb-3 font-medium">Statut</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {employes.map((emp) => {
                    const isExpanded = expandedId === emp.id;
                    return (
                      <Fragment key={emp.id}>
                        <tr className="border-b last:border-0 cursor-pointer hover:bg-muted/40" onClick={() => setExpandedId(isExpanded ? null : emp.id)}>
                          <td className="py-3">
                            <ChevronDown className={`size-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                          </td>
                          <td className="py-3 text-sm">{emp.prenom} {emp.nom}</td>
                          <td className="py-3 text-sm">{emp.poste || '-'}</td>
                          <td className="py-3 text-sm">{emp.zonesHabilitees?.map((z) => z.nom || z).join(', ') || '-'}</td>
                          <td className="py-3">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${statutBadgeClass(emp.statut)}`}>
                              {emp.statut}
                            </span>
                          </td>
                          <td className="py-3">
                            <span onClick={(e) => e.stopPropagation()} className="flex flex-wrap gap-2">
                              {emp.statut !== 'ACTIF' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={actionLoadingId === emp.id}
                                  onClick={() => handleChangeStatut(emp.id, 'ACTIF')}
                                >
                                  <PlayCircle className="size-3.5 mr-1" />
                                  Reactiver
                                </Button>
                              )}
                              {emp.statut === 'ACTIF' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={actionLoadingId === emp.id}
                                  onClick={() => handleChangeStatut(emp.id, 'SUSPENDU')}
                                >
                                  <PauseCircle className="size-3.5 mr-1" />
                                  Suspendre
                                </Button>
                              )}
                              {emp.statut !== 'INACTIF' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={actionLoadingId === emp.id}
                                  onClick={() => { setConfirmDisable(emp); setDisableError(''); }}
                                >
                                  <UserX className="size-3.5 mr-1" />
                                  Desactiver
                                </Button>
                              )}
                            </span>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="border-b last:border-0 bg-muted/30">
                            <td colSpan={6} className="py-3 px-6">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <p className="text-muted-foreground">Email</p>
                                  <p className="font-medium break-all">{emp.email || '-'}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Matricule</p>
                                  <p className="font-medium">{emp.matricule || '-'}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">UID badge</p>
                                  <p className="font-medium font-mono text-xs">{emp.badgeUid || '-'}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Expiration badge</p>
                                  <p className="font-medium">{emp.dateExpirationBadge ? new Date(emp.dateExpirationBadge).toLocaleDateString() : '-'}</p>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex items-center justify-center gap-3 mt-4">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" disabled={page === 0} onClick={() => setPage(page - 1)} aria-label="Page précédente">
                <ChevronLeft className="size-4" />
              </Button>
              <span className="text-sm text-muted-foreground">{totalPages > 0 ? page + 1 : 0} / {totalPages}</span>
              <Button variant="outline" size="icon" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)} aria-label="Page suivante">
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={!!confirmDisable}
        onOpenChange={(open) => { if (!open) { setConfirmDisable(null); setDisableError(''); } }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Désactiver définitivement {confirmDisable?.prenom} {confirmDisable?.nom} ?</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {disableError && (
              <div className="text-destructive bg-destructive/10 p-3 rounded-md text-sm">{disableError}</div>
            )}
            <p className="text-sm text-muted-foreground">
              Le badge sera révoqué et le compte bloqué. Cette action est irréversible.
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setConfirmDisable(null); setDisableError(''); }}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={confirmDisableEmploye} disabled={actionLoadingId === confirmDisable?.id}>
              <UserX className="size-4 mr-1" />
              Confirmer la désactivation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
