import { useState, useEffect } from 'react';
import api from '@/services/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Plus, Pencil, ShieldX, ShieldCheck, Search, Shield } from 'lucide-react';

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
    try {
      await api.patch(`/agents-surete/${agent.id}/revoke`);
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
                        <Badge variant={a.statut === 'ACTIF' ? 'default' : 'secondary'} className="text-xs">
                          {a.statut}
                        </Badge>
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
                            <Button size="sm" onClick={() => handleEnable(a)}>
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
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button variant="outline" type="button" onClick={() => setModal({ open: false, agent: null })}>
                Annuler
              </Button>
              <Button type="submit">{modal.agent ? 'Modifier' : 'Créer'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
