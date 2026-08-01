import { useState, useEffect } from 'react';
import api from '@/services/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Plus, AlertTriangle, ShieldAlert } from 'lucide-react';

export default function IncidentsManager() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [showSignal, setShowSignal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [form, setForm] = useState({ badgeId: '', employeId: '', typeIncident: 'PERTE', commentaire: '' });
  const [employees, setEmployees] = useState([]);
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

  useEffect(() => {
    api.get('/managers/mes-employes', { params: { avecBadge: true, size: 200 } })
      .then((res) => setEmployees(res.data.data.content || res.data.data))
      .catch(() => {});
  }, []);

  const openSignalModal = () => {
    setForm({ badgeId: '', employeId: '', typeIncident: 'PERTE', commentaire: '' });
    setShowSignal(true);
    setError('');
  };

  const handleEmployeeChange = (e) => {
    const employeId = e.target.value;
    const emp = employees.find((em) => String(em.id) === employeId);
    setForm({ ...form, employeId, badgeId: emp?.badgeId || '' });
  };

  const handleSignalSubmit = (e) => {
    e.preventDefault();
    if (!form.employeId) { setError('Selectionnez un employe'); return; }
    setShowConfirm(true);
  };

  const confirmSignal = async () => {
    setActionLoading(true);
    setError('');
    try {
      await api.post('/incidents', {
        badgeId: parseInt(form.badgeId, 10),
        typeIncident: form.typeIncident,
        commentaire: form.commentaire,
      });
      setShowSignal(false);
      setShowConfirm(false);
      fetchIncidents(page);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors du signalement');
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Incidents</h1>
          <p className="text-sm text-muted-foreground mt-1">Signalement des incidents de badge</p>
        </div>
        <Button variant="destructive" onClick={openSignalModal}>
          <Plus className="size-4 mr-2" />
          Signaler un incident
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-6">
          {error && !showSignal && <div className="text-destructive bg-destructive/10 p-3 rounded-md mb-4 text-sm">{error}</div>}

          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">Chargement...</div>
          ) : incidents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <ShieldAlert className="size-12 mb-3 text-muted-foreground/50" />
              <p className="text-sm">Aucun incident</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-muted-foreground">
                    <th className="pb-3 font-medium">Badge UID</th>
                    <th className="pb-3 font-medium">Signalant</th>
                    <th className="pb-3 font-medium">Type</th>
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {incidents.map((inc) => (
                    <tr key={inc.id} className="border-b last:border-0">
                      <td className="py-3 text-sm font-mono text-xs">{inc.badgeUid}</td>
                      <td className="py-3 text-sm">{inc.signalantNom}</td>
                      <td className="py-3 text-sm">{inc.typeIncident}</td>
                      <td className="py-3 text-sm">{new Date(inc.dateIncident).toLocaleDateString()}</td>
                      <td className="py-3">
                        <Badge variant={statutConfig[inc.statut]?.variant || 'secondary'} className="text-xs">
                          {inc.statut}
                        </Badge>
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

      <Dialog open={showSignal} onOpenChange={(open) => { if (!open) setShowSignal(false); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Signaler un incident</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSignalSubmit}>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Employe</label>
                <select
                  value={form.employeId}
                  onChange={handleEmployeeChange}
                  required
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">-- Selectionner un employe --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.prenom} {emp.nom} ({emp.email})</option>
                  ))}
                </select>
              </div>
              {form.badgeId && (
                <p className="text-sm"><span className="text-muted-foreground">Badge ID :</span> <span className="font-medium">{form.badgeId}</span></p>
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium">Type d'incident</label>
                <select
                  value={form.typeIncident}
                  onChange={(e) => setForm({ ...form, typeIncident: e.target.value })}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="PERTE">Perte</option>
                  <option value="VOL">Vol</option>
                  <option value="FIN_CONTRAT">Fin de contrat</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Commentaire</label>
                <Textarea
                  value={form.commentaire}
                  onChange={(e) => setForm({ ...form, commentaire: e.target.value })}
                  placeholder="Details de l'incident..."
                />
              </div>
              {error && <div className="text-destructive bg-destructive/10 p-3 rounded-md text-sm">{error}</div>}
            </div>
            <DialogFooter className="mt-4">
              <Button variant="outline" type="button" onClick={() => setShowSignal(false)}>Annuler</Button>
              <Button type="submit" variant="destructive">Signaler</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showConfirm} onOpenChange={(open) => { if (!open) setShowConfirm(false); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer le signalement</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-md">
              <AlertTriangle className="size-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">Etes-vous sur de vouloir signaler cet incident ?</p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-muted-foreground">Employe :</span> <span className="font-medium">{employees.find((e) => String(e.id) === form.employeId)?.prenom} {employees.find((e) => String(e.id) === form.employeId)?.nom}</span></div>
              <div><span className="text-muted-foreground">Badge ID :</span> <span className="font-medium">{form.badgeId}</span></div>
              <div><span className="text-muted-foreground">Type :</span> <span className="font-medium">{form.typeIncident}</span></div>
              <div><span className="text-muted-foreground">Commentaire :</span> <span className="font-medium">{form.commentaire || '-'}</span></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)}>Annuler</Button>
            <Button variant="destructive" onClick={confirmSignal} disabled={actionLoading}>
              {actionLoading ? 'Envoi...' : 'Confirmer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
