import { useState, useEffect, useRef } from 'react';
import api from '@/services/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Plus, Pencil, Ban, CheckCircle, Search, Users, Building2 } from 'lucide-react';

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
  const [confirmDisable, setConfirmDisable] = useState(null);
  const [impacts, setImpacts] = useState(null);
  const [loadingImpact, setLoadingImpact] = useState(false);
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
    try {
      await api.patch(`/directions/${confirmDisable.id}/disable`);
      setConfirmDisable(null);
      setImpacts(null);
      fetchDirections(page, search, filterStatut);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la désactivation');
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

  const showEmployes = async (directionId) => {
    try {
      const res = await api.get(`/directions/${directionId}/employes`, { params: { page: 0, size: 50 } });
      setEmployes(res.data.data);
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
        <Button onClick={handleCreate}>
          <Plus className="size-4 mr-2" />
          Ajouter
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                className="pl-8"
              />
            </div>
            <select
              value={filterStatut}
              onChange={(e) => { setFilterStatut(e.target.value); setPage(0); }}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Tous les statuts</option>
              <option value="ACTIF">Actif</option>
              <option value="INACTIF">Inactif</option>
            </select>
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
                        <Button variant="link" className="h-auto p-0 text-sm" onClick={() => showEmployes(d.id)}>
                          <Users className="size-3.5 mr-1" />
                          {d.nombreEmployes}
                        </Button>
                      </td>
                      <td className="py-3">
                        <Badge variant={d.statut === 'ACTIF' ? 'default' : 'secondary'} className="text-xs">
                          {d.statut}
                        </Badge>
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

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-4">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
                Précédent
              </Button>
              <span className="text-sm text-muted-foreground">{page + 1} / {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
                Suivant
              </Button>
            </div>
          )}
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

      <Dialog open={!!employes} onOpenChange={(open) => { if (!open) setEmployes(null); }}>
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
            <div className="overflow-x-auto">
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
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmployes(null)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!confirmDisable}
        onOpenChange={(open) => { if (!open) { setConfirmDisable(null); setImpacts(null); } }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Désactiver la direction {confirmDisable?.nom}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              Désactiver cette direction bloquera les nouvelles invitations, demandes de badge et affectations de manager. Les badges déjà émis resteront actifs.
            </p>
            {loadingImpact ? (
              <div className="text-sm text-muted-foreground">Calcul des impacts...</div>
            ) : impacts ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between border rounded-md p-3">
                  <span className="text-sm font-medium">Employés actifs</span>
                  <Badge variant="secondary" className="text-xs">{impacts.employesActifs}</Badge>
                </div>
                <div className="flex items-center justify-between border rounded-md p-3">
                  <span className="text-sm font-medium">Badges actifs</span>
                  <Badge variant="secondary" className="text-xs">{impacts.badgesActifs}</Badge>
                </div>
                <div className="flex items-center justify-between border rounded-md p-3">
                  <span className="text-sm font-medium">Demandes en cours (N1/N2)</span>
                  <Badge variant="secondary" className="text-xs">{impacts.demandesEnCours}</Badge>
                </div>
              </div>
            ) : null}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setConfirmDisable(null); setImpacts(null); }}>
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
