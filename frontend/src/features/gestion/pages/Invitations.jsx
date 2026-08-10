import { useState, useEffect } from 'react';
import api from '@/services/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Plus, Copy, XCircle, Mail, CheckCircle, Clock, Ban, Briefcase, Trash2, ChevronLeft, ChevronRight, ChevronDown, Search } from 'lucide-react';

const statutConfig = {
  EN_ATTENTE: { cls: 'bg-[#F1BE5B]/15 text-[#A67C00]' },
  ACCEPTEE: { cls: 'bg-[#008B60]/10 text-[#008B60]' },
  EXPIREE: { cls: 'bg-[#674459]/10 text-[#674459]' },
  REVOQUEE: { cls: 'bg-[#C20831]/10 text-[#C20831]' },
};

const statutIcon = {
  EN_ATTENTE: Clock,
  ACCEPTEE: CheckCircle,
  EXPIREE: Ban,
  REVOQUEE: XCircle,
};

export default function Invitations() {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState('');
  const [statut, setStatut] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const [postes, setPostes] = useState([]);
  const [newPoste, setNewPoste] = useState('');
  const [posteError, setPosteError] = useState('');
  const [posteLoading, setPosteLoading] = useState(false);

  const fetchPostes = async () => {
    try {
      const res = await api.get('/postes');
      setPostes(res.data.data);
    } catch {
      setPosteError('Erreur lors du chargement des postes');
    }
  };

  useEffect(() => { fetchPostes(); }, []);

  const handleAddPoste = async (e) => {
    e.preventDefault();
    setPosteLoading(true);
    setPosteError('');
    try {
      await api.post('/postes', { nom: newPoste });
      setNewPoste('');
      fetchPostes();
    } catch (err) {
      setPosteError(err.response?.data?.message || 'Erreur lors de la creation du poste');
    } finally {
      setPosteLoading(false);
    }
  };

  const handleDeletePoste = async (id) => {
    try {
      await api.delete(`/postes/${id}`);
      fetchPostes();
    } catch (err) {
      setPosteError(err.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  const fetchInvitations = async (p, s, st) => {
    setLoading(true);
    try {
      const params = { page: p, size: 10 };
      if (s) params.search = s;
      if (st) params.statut = st;
      const res = await api.get('/invitations', { params });
      setInvitations(res.data.data.content);
      setTotalPages(res.data.data.totalPages);
    } catch {
      setError('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInvitations(page, search, statut); }, [page, search, statut]);

  const handleReinvite = (inv) => {
    setEmail(inv.emailDestinataire);
    setShowCreate(true);
    setError('');
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError('');
    try {
      await api.post('/invitations', { emailDestinataire: email });
      setShowCreate(false);
      setEmail('');
      fetchInvitations(page);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la creation');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevoke = async (id) => {
    try {
      await api.patch(`/invitations/${id}/revoke`);
      fetchInvitations(page);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    }
  };

  const copyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      /* clipboard indisponible */
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Invitations & Postes</h1>
          <p className="text-sm text-muted-foreground mt-1">Gestion des invitations et des postes de votre direction</p>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
                <Briefcase className="size-4" />
                Postes de ma direction
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Ces postes seront proposés à l'employé lors de l'inscription.
              </p>
            </div>
          </div>

          {posteError && (
            <div className="text-destructive bg-destructive/10 p-3 rounded-md my-4 text-sm">{posteError}</div>
          )}

          <form onSubmit={handleAddPoste} className="flex gap-2 mt-4">
            <Input
              value={newPoste}
              onChange={(e) => setNewPoste(e.target.value)}
              placeholder="Ex. Contrôleur, Hôtesse, Agent de sûreté…"
              required
            />
            <Button type="submit" disabled={posteLoading}>
              <Plus className="size-4 mr-2" />
              {posteLoading ? 'Ajout...' : 'Ajouter'}
            </Button>
          </form>

          {postes.length === 0 ? (
            <p className="text-sm text-muted-foreground mt-4">
              Aucun poste configuré. Ajoutez les postes de votre direction.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2 mt-4">
              {postes.map((poste) => (
                <div
                  key={poste.id}
                  className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-1.5 text-sm"
                >
                  {poste.nom}
                  <button
                    type="button"
                    onClick={() => handleDeletePoste(poste.id)}
                    className="text-muted-foreground transition-colors hover:text-destructive"
                    aria-label={`Supprimer ${poste.nom}`}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold tracking-tight flex items-center gap-2">
              <Mail className="size-4" />
              Invitations
            </h3>
            <Button onClick={() => { setEmail(''); setShowCreate(true); setError(''); }}>
              <Plus className="size-4 mr-2" />
              Inviter un employe
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par email ou code..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                className="pl-8"
              />
            </div>
            <div className="relative shrink-0">
              <select
                value={statut}
                onChange={(e) => { setStatut(e.target.value); setPage(0); }}
                className="h-8 appearance-none rounded-md border border-input bg-background pl-3 pr-8 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Tous les statuts</option>
                {Object.keys(statutConfig).map((s) => (<option key={s} value={s}>{s}</option>))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>

          {error && <div className="text-destructive bg-destructive/10 p-3 rounded-md mb-4 text-sm">{error}</div>}

          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">Chargement...</div>
          ) : invitations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Mail className="size-12 mb-3 text-muted-foreground/50" />
              <p className="text-sm">Aucune invitation</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-muted-foreground">
                    <th className="pb-3 font-medium">Email</th>
                    <th className="pb-3 font-medium">Statut</th>
                    <th className="pb-3 font-medium">Code</th>
                    <th className="pb-3 font-medium">Envoyé le</th>
                    <th className="pb-3 font-medium">Expire le</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invitations.map((inv) => {
                    const Icon = statutIcon[inv.statut] || Clock;
                    return (
                      <tr key={inv.id} className="border-b last:border-0">
                        <td className="py-3 text-sm">{inv.emailDestinataire}</td>
                        <td className="py-3">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statutConfig[inv.statut]?.cls || 'bg-[#674459]/10 text-[#674459]'}`}>
                            <Icon className="size-3" />
                            {inv.statut}
                          </span>
                        </td>
                        <td className="py-3">
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{inv.codeUnique}</code>
                        </td>
                        <td className="py-3 text-sm text-muted-foreground">
                          {inv.createdAt ? new Date(inv.createdAt).toLocaleString() : '-'}
                        </td>
                        <td className="py-3 text-sm text-muted-foreground">
                          {inv.dateExpiration ? new Date(inv.dateExpiration).toLocaleString() : '-'}
                        </td>
                        <td className="py-3">
                          {inv.statut === 'EN_ATTENTE' ? (
                            <div className="flex gap-1.5">
                              <Button variant="outline" size="sm" onClick={() => copyCode(inv.codeUnique)}>
                                <Copy className="size-3.5 mr-1" />
                                Copier
                              </Button>
                              <Button variant="destructive" size="sm" onClick={() => handleRevoke(inv.id)}>
                                <XCircle className="size-3.5 mr-1" />
                                Revoquer
                              </Button>
                            </div>
                          ) : inv.statut === 'EXPIREE' || inv.statut === 'REVOQUEE' ? (
                            <Button variant="outline" size="sm" onClick={() => handleReinvite(inv)}>
                              <Mail className="size-3.5 mr-1" />
                              Reinviter
                            </Button>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
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

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Inviter un employe</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate}>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email de l'employe</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="employe@ram.ma"
                  required
                />
              </div>
              {error && <div className="text-destructive bg-destructive/10 p-3 rounded-md text-sm">{error}</div>}
            </div>
            <DialogFooter className="mt-4">
              <Button variant="outline" type="button" onClick={() => setShowCreate(false)}>Annuler</Button>
              <Button type="submit" disabled={actionLoading}>
                {actionLoading ? 'Envoi...' : 'Envoyer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
