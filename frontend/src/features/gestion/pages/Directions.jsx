import { useState, useEffect, useRef } from 'react';
import api from '@/services/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Plus, Pencil, Ban, CheckCircle, Search, Users, Building2, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Directions() {
  const [directions, setDirections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [modal, setModal] = useState({ open: false, direction: null });
  const [form, setForm] = useState({ nom: '', codeDirection: '' });
  const [error, setError] = useState('');
  const [employes, setEmployes] = useState(null);
  const [employePage, setEmployePage] = useState(0);
  const [employesDirectionId, setEmployesDirectionId] = useState(null);
  const [confirmDisable, setConfirmDisable] = useState(null);
  const [impacts, setImpacts] = useState(null);
  const [loadingImpact, setLoadingImpact] = useState(false);
  const [disableError, setDisableError] = useState('');
  const fetchedRef = useRef(null);

  const fetchDirections = async (p, s, st) => {
    setLoading(true);
    try {
      const params = { page: p, size: 10 };
      if (s) params.search = s;
      if (st) params.statut = st;
      const res = await api.get('/directions', { params });
      setDirections(res.data.data.content);
      setTotalPages(res.data.data.totalPages);
    } catch {
      setError('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const key = JSON.stringify({ page, search, statut: filterStatut });
    if (key !== fetchedRef.current) {
      fetchedRef.current = key;
      fetchDirections(page, search, filterStatut);
    }
  }, [page, search, filterStatut]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (modal.direction) {
        await api.put(`/directions/${modal.direction.id}`, form);
      } else {
        await api.post('/directions', form);
      }
      setModal({ open: false, direction: null });
      setForm({ nom: '', codeDirection: '' });
      fetchDirections(page, search, filterStatut);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    }
  };

  const handleToggle = async (direction) => {
    if (direction.statut === 'ACTIF') {
      setError('');
      setImpacts(null);
      setConfirmDisable(direction);
      setDisableError('');
      setLoadingImpact(true);
      try {
        const res = await api.get(`/directions/${direction.id}/impacts`);
        setImpacts(res.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Erreur lors du calcul des impacts');
        setConfirmDisable(null);
      } finally {
        setLoadingImpact(false);
      }
    } else {
      try {
        await api.patch(`/directions/${direction.id}/enable`);
        fetchDirections(page, search, filterStatut);
      } catch (err) {
        setError(err.response?.data?.message || 'Erreur');
      }
    }
  };

  const confirmDisableDirection = async () => {
    setError('');
    setDisableError('');
    try {
      await api.patch(`/directions/${confirmDisable.id}/disable`);
      setConfirmDisable(null);
      setImpacts(null);
      fetchDirections(page, search, filterStatut);
    } catch (err) {
      setDisableError(err.response?.data?.message || 'Erreur lors de la désactivation');
    }
  };

  const handleEdit = (direction) => {
    setForm({ nom: direction.nom, codeDirection: direction.codeDirection });
    setModal({ open: true, direction });
  };

  const handleCreate = () => {
    setForm({ nom: '', codeDirection: '' });
    setModal({ open: true, direction: null });
  };

  const showEmployes = async (directionId, p) => {
    try {
      const res = await api.get(`/directions/${directionId}/employes`, { params: { page: p, size: 10 } });
      setEmployes(res.data.data);
      setEmployePage(p);
      setEmployesDirectionId(directionId);
    } catch {
      setError('Erreur lors du chargement des employes');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Directions</h1>
          <p className="text-sm text-muted-foreground mt-1">Gestion des directions RAM</p>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                className="pl-8"
              />
            </div>
            <div className="relative shrink-0">
              <select
                value={filterStatut}
                onChange={(e) => { setFilterStatut(e.target.value); setPage(0); }}
                className="h-8 appearance-none rounded-md border border-input bg-background pl-3 pr-8 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Tous les statuts</option>
                <option value="ACTIF">Actif</option>
                <option value="INACTIF">Inactif</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            </div>
            <Button onClick={handleCreate} className="ml-auto">
              <Plus className="size-4 mr-2" />
              Ajouter
            </Button>
          </div>

          {error && <div className="text-destructive bg-destructive/10 p-3 rounded-md mb-4 text-sm">{error}</div>}

          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">Chargement...</div>
          ) : directions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Building2 className="size-12 mb-3 text-muted-foreground/50" />
              <p className="text-sm">Aucune direction trouvée</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-muted-foreground">
                    <th className="pb-3 font-medium">Nom</th>
                    <th className="pb-3 font-medium">Code</th>
                    <th className="pb-3 font-medium">Manager</th>
                    <th className="pb-3 font-medium">Employés</th>
                    <th className="pb-3 font-medium">Statut</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {directions.map((d) => (
                    <tr key={d.id} className="border-b last:border-0">
                      <td className="py-3 text-sm">{d.nom}</td>
                      <td className="py-3 text-sm">{d.codeDirection}</td>
                      <td className="py-3 text-sm text-muted-foreground">{d.managerNom || '-'}</td>
                      <td className="py-3">
                        <Button variant="link" className="h-auto p-0 text-sm" onClick={() => showEmployes(d.id, 0)}>
                          <Users className="size-3.5 mr-1" />
                          {d.nombreEmployes}
                        </Button>
                      </td>
                      <td className="py-3">
                        <span
                          className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium"
                          style={d.statut === 'ACTIF'
                            ? { backgroundColor: '#008B60', color: '#fff' }
                            : { backgroundColor: '#674459', color: '#fff' }}
                        >
                          {d.statut}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="flex gap-1.5">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(d)}>
                            <Pencil className="size-3.5 mr-1" />
                            Modifier
                          </Button>
                          <Button
                            variant={d.statut === 'ACTIF' ? 'destructive' : 'default'}
                            size="sm"
                            style={d.statut === 'ACTIF' ? undefined : { backgroundColor: '#008B60', color: '#fff' }}
                            onClick={() => handleToggle(d)}
                          >
                            {d.statut === 'ACTIF' ? (
                              <><Ban className="size-3.5 mr-1" /> Désactiver</>
                            ) : (
                              <><CheckCircle className="size-3.5 mr-1" /> Activer</>
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex items-center justify-center gap-3 mt-4">
            <Button variant="outline" size="icon" disabled={page === 0} onClick={() => setPage(page - 1)} aria-label="Page précédente">
              <ChevronLeft className="size-4" />
            </Button>
            <span className="text-sm text-muted-foreground">{totalPages > 0 ? page + 1 : 0} / {totalPages}</span>
            <Button variant="outline" size="icon" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)} aria-label="Page suivante">
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={modal.open} onOpenChange={(open) => setModal({ open, direction: open ? modal.direction : null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{modal.direction ? 'Modifier' : 'Ajouter'} une direction</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nom</label>
                <Input
                  value={form.nom}
                  onChange={(e) => setForm({ ...form, nom: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Code Direction</label>
                <Input
                  value={form.codeDirection}
                  onChange={(e) => setForm({ ...form, codeDirection: e.target.value })}
                  required
                />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button variant="outline" type="button" onClick={() => setModal({ open: false, direction: null })}>
                Annuler
              </Button>
              <Button type="submit">{modal.direction ? 'Modifier' : 'Créer'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!employes} onOpenChange={(open) => { if (!open) { setEmployes(null); setEmployesDirectionId(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Employés de la direction</DialogTitle>
          </DialogHeader>
          {employes?.content?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Users className="size-10 mb-2 text-muted-foreground/50" />
              <p className="text-sm">Aucun employé</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {employes?.totalElements || 0} employé(s) — page {employePage + 1} / {Math.max(employes?.totalPages || 1, 1)}
                </p>
              </div>
              <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-sm text-muted-foreground">
                      <th className="pb-2 font-medium">Nom</th>
                      <th className="pb-2 font-medium">Prénom</th>
                      <th className="pb-2 font-medium">Email</th>
                      <th className="pb-2 font-medium">Matricule</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employes?.content?.map((e) => (
                      <tr key={e.id} className="border-b last:border-0">
                        <td className="py-2.5 text-sm">{e.nom}</td>
                        <td className="py-2.5 text-sm">{e.prenom}</td>
                        <td className="py-2.5 text-sm text-muted-foreground">{e.email}</td>
                        <td className="py-2.5 text-sm">{e.matricule}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={employePage === 0}
              onClick={() => showEmployes(employesDirectionId, employePage - 1)}
              aria-label="Page précédente"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={employePage >= (employes?.totalPages || 1) - 1}
              onClick={() => showEmployes(employesDirectionId, employePage + 1)}
              aria-label="Page suivante"
            >
              <ChevronRight className="size-4" />
            </Button>
            <div className="flex-1" />
            <Button variant="outline" onClick={() => setEmployes(null)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!confirmDisable}
        onOpenChange={(open) => { if (!open) { setConfirmDisable(null); setImpacts(null); setDisableError(''); } }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Désactiver la direction {confirmDisable?.nom}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {disableError && (
              <div className="text-destructive bg-destructive/10 p-3 rounded-md text-sm">{disableError}</div>
            )}
            <p className="text-sm text-muted-foreground">
              Désactiver cette direction bloquera les nouvelles invitations, demandes de badge et affectations de manager. Les badges déjà émis resteront actifs.
            </p>
            {loadingImpact ? (
              <div className="text-sm text-muted-foreground">Calcul des impacts...</div>
            ) : impacts ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between border rounded-md p-3">
                  <span className="text-sm font-medium">Employés actifs</span>
                  <Badge className="text-xs" style={{ backgroundColor: '#008B60', color: '#fff' }}>{impacts.employesActifs}</Badge>
                </div>
                <div className="flex items-center justify-between border rounded-md p-3">
                  <span className="text-sm font-medium">Badges actifs</span>
                  <Badge className="text-xs" style={{ backgroundColor: '#008B60', color: '#fff' }}>{impacts.badgesActifs}</Badge>
                </div>
                <div className="flex items-center justify-between border rounded-md p-3">
                  <span className="text-sm font-medium">Demandes en cours (N1/N2)</span>
                  <Badge className="text-xs" style={{ backgroundColor: '#F1BE5B', color: '#5C4A00' }}>{impacts.demandesEnCours}</Badge>
                </div>
              </div>
            ) : null}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setConfirmDisable(null); setImpacts(null); setDisableError(''); }}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={confirmDisableDirection} disabled={loadingImpact || !impacts}>
              <Ban className="size-4 mr-1" />
              Confirmer la désactivation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
