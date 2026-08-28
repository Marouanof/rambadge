import { useState, useEffect } from 'react';
import api from '@/services/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Plus, Pencil, ShieldX, ShieldCheck, Search, Shield, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

export default function AgentsSurete() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [modal, setModal] = useState({ open: false, agent: null });
  const [form, setForm] = useState({ nom: '', prenom: '', matricule: '', email: '' });
  const [error, setError] = useState('');
  const [confirmRevoke, setConfirmRevoke] = useState(null);

  const fetchAgents = async (p, s, st) => {
    setLoading(true);
    try {
      const params = { page: p, size: 10 };
      if (s) params.search = s;
      if (st) params.statut = st;
      const res = await api.get('/agents-surete', { params });
      setAgents(res.data.data.content);
      setTotalPages(res.data.data.totalPages);
    } catch {
      setError('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents(page, search, filterStatut);
  }, [page, search, filterStatut]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (modal.agent) {
        await api.put(`/agents-surete/${modal.agent.id}`, form);
      } else {
        await api.post('/agents-surete', form);
      }
      setModal({ open: false, agent: null });
      setForm({ nom: '', prenom: '', matricule: '', email: '' });
      fetchAgents(page, search, filterStatut);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    }
  };

  const handleRevoke = async (agent) => {
    setConfirmRevoke(agent);
  };

  const confirmRevokeAgent = async () => {
    setError('');
    try {
      await api.patch(`/agents-surete/${confirmRevoke.id}/revoke`);
      setConfirmRevoke(null);
      fetchAgents(page, search, filterStatut);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    }
  };

  const handleEnable = async (agent) => {
    try {
      await api.patch(`/agents-surete/${agent.id}/enable`);
      fetchAgents(page, search, filterStatut);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    }
  };

  const handleEdit = (agent) => {
    setForm({ nom: agent.nom, prenom: agent.prenom, matricule: agent.matricule, email: agent.email });
    setModal({ open: true, agent });
  };

  const handleCreate = () => {
    setForm({ nom: '', prenom: '', matricule: '', email: '' });
    setModal({ open: true, agent: null });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Agents de sûreté</h1>
          <p className="text-sm text-muted-foreground mt-1">Gestion des agents de sécurité</p>
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
          ) : agents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Shield className="size-12 mb-3 text-muted-foreground/50" />
              <p className="text-sm">Aucun agent trouvé</p>
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
                    <th className="pb-3 font-medium">Statut</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {agents.map((a) => (
                    <tr key={a.id} className="border-b last:border-0">
                      <td className="py-3 text-sm">{a.nom}</td>
                      <td className="py-3 text-sm">{a.prenom}</td>
                      <td className="py-3 text-sm">{a.matricule}</td>
                      <td className="py-3 text-sm text-muted-foreground">{a.email}</td>
                      <td className="py-3">
                        <span
                          className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium"
                          style={a.statut === 'ACTIF'
                            ? { backgroundColor: '#008B60', color: '#fff' }
                            : { backgroundColor: '#674459', color: '#fff' }}
                        >
                          {a.statut}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="flex gap-1.5">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(a)}>
                            <Pencil className="size-3.5 mr-1" />
                            Modifier
                          </Button>
                          {a.statut === 'ACTIF' ? (
                            <Button variant="destructive" size="sm" onClick={() => handleRevoke(a)}>
                              <ShieldX className="size-3.5 mr-1" />
                              Révoquer
                            </Button>
                          ) : (
                            <Button size="sm" style={{ backgroundColor: '#008B60', color: '#fff' }} onClick={() => handleEnable(a)}>
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

      <Dialog open={modal.open} onOpenChange={(open) => setModal({ open, agent: open ? modal.agent : null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{modal.agent ? 'Modifier' : 'Ajouter'} un agent</DialogTitle>
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
                  onChange={modal.agent ? undefined : (e) => setForm({ ...form, email: e.target.value })}
                  readOnly={!!modal.agent}
                  required
                />
                {modal.agent && (
                  <p className="text-xs text-muted-foreground">
                    L'email est l'identifiant de connexion et ne peut pas être modifié.
                  </p>
                )}
              </div>
            </div>
            {error && <div className="text-destructive bg-destructive/10 p-3 rounded-md text-sm">{error}</div>}
            <DialogFooter className="mt-4">
              <Button variant="outline" type="button" onClick={() => setModal({ open: false, agent: null })}>
                Annuler
              </Button>
              <Button type="submit">{modal.agent ? 'Modifier' : 'Créer'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmRevoke} onOpenChange={(open) => { if (!open) setConfirmRevoke(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Révoquer l'agent {confirmRevoke?.prenom} {confirmRevoke?.nom}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              Révoquer cet agent de sûreté désactivera son compte et son accès au système. L'agent perdra immédiatement ses droits de vérification et de traitement.
            </p>
          </div>
          <DialogFooter className="gap-2">
            {error && <div className="w-full text-destructive bg-destructive/10 p-3 rounded-md text-sm">{error}</div>}
            <Button variant="outline" onClick={() => setConfirmRevoke(null)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={confirmRevokeAgent}>
              <ShieldX className="size-4 mr-1" />
              Confirmer la révocation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
