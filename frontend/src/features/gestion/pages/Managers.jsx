import { useState, useEffect } from 'react';
import api from '@/services/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Plus, Pencil, ShieldX, ShieldCheck, Search, UserCheck, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Managers() {
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [modal, setModal] = useState({ open: false, manager: null });
  const [form, setForm] = useState({ nom: '', prenom: '', matricule: '', email: '', directionId: '' });
  const [directions, setDirections] = useState([]);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [transferConfirm, setTransferConfirm] = useState(null);
  const [confirmRevoke, setConfirmRevoke] = useState(null);

  const fetchManagers = async (p, s, st) => {
    setLoading(true);
    try {
      const params = { page: p, size: 10 };
      if (s) params.search = s;
      if (st) params.statut = st;
      const res = await api.get('/managers', { params });
      setManagers(res.data.data.content);
      setTotalPages(res.data.data.totalPages);
    } catch {
      setError('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchManagers(page, search, filterStatut);
  }, [page, search, filterStatut]);

  const activeDirections = (list) => (list || []).filter((d) => d.statut !== 'INACTIF');

  useEffect(() => {
      api.get('/directions/disponibles', { params: { page: 0, size: 100 } })
      .then((res) => setDirections(activeDirections(res.data.data.content)))
      .catch(() => {});
  }, []);

  const loadDirectionsForModal = async (currentDirectionId, currentDirectionNom) => {
    try {
      const res = await api.get('/directions/disponibles', { params: { page: 0, size: 100 } });
      const list = activeDirections(res.data.data.content);
      if (currentDirectionId && !list.some((d) => d.id === currentDirectionId)) {
        list.push({ id: currentDirectionId, nom: currentDirectionNom || 'Direction actuelle' });
      }
      setDirections(list);
    } catch {
      // on garde la liste existante ; le backend fera le contrôle final
    }
  };

  const doSubmit = async () => {
    setActionLoading(true);
    setError('');
    try {
      const payload = { ...form, directionId: parseInt(form.directionId, 10) };
      if (modal.manager) {
        await api.put(`/managers/${modal.manager.id}`, payload);
      } else {
        await api.post('/managers', payload);
      }
      setModal({ open: false, manager: null });
      setForm({ nom: '', prenom: '', matricule: '', email: '', directionId: '' });
      fetchManagers(page, search, filterStatut);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (
      modal.manager &&
      modal.manager.directionId &&
      form.directionId &&
      parseInt(form.directionId, 10) !== modal.manager.directionId
    ) {
      try {
        const res = await api.get(`/directions/${modal.manager.directionId}/impacts`);
        const impacts = res.data.data;
        if (impacts.demandesEnAttenteN1 > 0) {
          setTransferConfirm({ impacts, oldNom: modal.manager.directionNom || 'l\'ancienne direction' });
          return;
        }
      } catch {
        // si l'appel échoue, le backend fera le contrôle final
      }
    }
    await doSubmit();
  };

  const handleRevoke = (manager) => {
    setConfirmRevoke(manager);
  };

  const confirmRevokeManager = async () => {
    setError('');
    try {
      await api.patch(`/managers/${confirmRevoke.id}/revoke`);
      setConfirmRevoke(null);
      fetchManagers(page, search, filterStatut);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    }
  };

  const handleEnable = async (id) => {
    try {
      await api.patch(`/managers/${id}/enable`);
      fetchManagers(page, search, filterStatut);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    }
  };

  const handleEdit = (m) => {
    setForm({ nom: m.nom, prenom: m.prenom, matricule: m.matricule, email: m.email, directionId: m.directionId || '' });
    loadDirectionsForModal(m.directionId, m.directionNom);
    setModal({ open: true, manager: m });
  };

  const handleCreate = () => {
    setForm({ nom: '', prenom: '', matricule: '', email: '', directionId: '' });
    loadDirectionsForModal(null, null);
    setModal({ open: true, manager: null });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Managers</h1>
          <p className="text-sm text-muted-foreground mt-1">Gestion des managers de direction</p>
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
          ) : managers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <UserCheck className="size-12 mb-3 text-muted-foreground/50" />
              <p className="text-sm">Aucun manager trouvé</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-muted-foreground">
                    <th className="pb-3 font-medium">Nom</th>
                    <th className="pb-3 font-medium">Prénom</th>
                    <th className="pb-3 font-medium">Matricule</th>
                    <th className="pb-3 font-medium">Email</th>
                    <th className="pb-3 font-medium">Direction</th>
                    <th className="pb-3 font-medium">Statut</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {managers.map((m) => (
                    <tr key={m.id} className="border-b last:border-0">
                      <td className="py-3 text-sm">{m.nom}</td>
                      <td className="py-3 text-sm">{m.prenom}</td>
                      <td className="py-3 text-sm">{m.matricule}</td>
                      <td className="py-3 text-sm text-muted-foreground">{m.email}</td>
                      <td className="py-3 text-sm">{m.directionNom || '-'}</td>
                      <td className="py-3">
                        <span
                          className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium"
                          style={m.statut === 'ACTIF'
                            ? { backgroundColor: '#008B60', color: '#fff' }
                            : { backgroundColor: '#674459', color: '#fff' }}
                        >
                          {m.statut}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="flex gap-1.5">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(m)}>
                            <Pencil className="size-3.5 mr-1" />
                            Modifier
                          </Button>
                          {m.statut === 'ACTIF' ? (
                            <Button variant="destructive" size="sm" onClick={() => handleRevoke(m)}>
                              <ShieldX className="size-3.5 mr-1" />
                              Révoquer
                            </Button>
                          ) : (
                            <Button size="sm" style={{ backgroundColor: '#008B60', color: '#fff' }} onClick={() => handleEnable(m.id)}>
                              <ShieldCheck className="size-3.5 mr-1" />
                              Activer
                            </Button>
                          )}
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

      <Dialog open={modal.open} onOpenChange={(open) => setModal({ open, manager: open ? modal.manager : null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{modal.manager ? 'Modifier' : 'Ajouter'} un manager</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nom</label>
                <Input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Prénom</label>
                <Input value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Matricule</label>
                <Input value={form.matricule} onChange={(e) => setForm({ ...form, matricule: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={modal.manager ? undefined : (e) => setForm({ ...form, email: e.target.value })}
                  readOnly={!!modal.manager}
                  required
                />
                {modal.manager && (
                  <p className="text-xs text-muted-foreground">
                    L'email est l'identifiant de connexion et ne peut pas être modifié.
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Direction</label>
                <div className="relative">
                  <select
                    value={form.directionId}
                    onChange={(e) => setForm({ ...form, directionId: e.target.value })}
                    required
                    className="w-full h-9 appearance-none rounded-md border border-input bg-background px-3 pr-8 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="">Sélectionner une direction</option>
                    {directions.map((d) => (
                      <option key={d.id} value={d.id}>{d.nom}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>
              {error && <div className="text-destructive bg-destructive/10 p-3 rounded-md text-sm">{error}</div>}
            </div>
            <DialogFooter className="mt-4">
              <Button variant="outline" type="button" onClick={() => setModal({ open: false, manager: null })}>
                Annuler
              </Button>
              <Button type="submit" disabled={actionLoading}>
                {actionLoading ? 'Envoi...' : modal.manager ? 'Modifier' : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!transferConfirm} onOpenChange={(open) => { if (!open) setTransferConfirm(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfert impossible</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-sm">
            <p>
              La direction « {transferConfirm?.oldNom} » a encore des demandes en attente de validation N1.
            </p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>{transferConfirm?.impacts.demandesEnAttenteN1} demande(s) en attente de validation N1</li>
              <li>{transferConfirm?.impacts.employesActifs} employé(s) actif(s)</li>
              <li>{transferConfirm?.impacts.demandesEnCours} demande(s) en cours</li>
            </ul>
            <p className="text-muted-foreground">
              Traitez ces demandes (validation ou refus N1) avant de changer la direction du manager,
              sinon les employés concernés resteront bloqués.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => setTransferConfirm(null)}>Compris</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmRevoke} onOpenChange={(open) => { if (!open) setConfirmRevoke(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Révoquer le manager {confirmRevoke?.prenom} {confirmRevoke?.nom}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              Révoquer ce manager détachera la direction « {confirmRevoke?.directionNom || '-'} » et désactivera son compte.
              Il perdra immédiatement l'accès aux validations N1 et à la gestion de ses employés.
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmRevoke(null)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={confirmRevokeManager}>
              <ShieldX className="size-4 mr-1" />
              Confirmer la révocation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
