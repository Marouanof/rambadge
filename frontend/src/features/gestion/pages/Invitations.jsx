import { useState, useEffect } from 'react';
import api from '@/services/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Plus, Copy, XCircle, Mail, CheckCircle, Clock, Ban } from 'lucide-react';

const statutConfig = {
  EN_ATTENTE: { variant: 'secondary' },
  ACCEPTEE: { variant: 'default' },
  EXPIREE: { variant: 'outline' },
  REVOQUEE: { variant: 'destructive' },
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
  const [showCreate, setShowCreate] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchInvitations = async (p) => {
    setLoading(true);
    try {
      const res = await api.get('/invitations', { params: { page: p, size: 10 } });
      setInvitations(res.data.data.content);
      setTotalPages(res.data.data.totalPages);
    } catch {
      setError('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInvitations(page); }, [page]);

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
    } catch {}
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Invitations</h1>
          <p className="text-sm text-muted-foreground mt-1">Gestion des invitations</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="size-4 mr-2" />
          Inviter un employe
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-6">
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
                    <th className="pb-3 font-medium">Direction</th>
                    <th className="pb-3 font-medium">Statut</th>
                    <th className="pb-3 font-medium">Code</th>
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
                        <td className="py-3 text-sm">{inv.directionNom}</td>
                        <td className="py-3">
                          <Badge variant={statutConfig[inv.statut]?.variant || 'secondary'} className="text-xs gap-1">
                            <Icon className="size-3" />
                            {inv.statut}
                          </Badge>
                        </td>
                        <td className="py-3">
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{inv.codeUnique}</code>
                        </td>
                        <td className="py-3 text-sm text-muted-foreground">
                          {inv.dateExpiration ? new Date(inv.dateExpiration).toLocaleDateString() : '-'}
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
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-4">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
                Precedent
              </Button>
              <span className="text-sm text-muted-foreground">{page + 1} / {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
                Suivant
              </Button>
            </div>
          )}
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
