import { useState, useEffect } from 'react';
import api from '@/services/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Combobox } from '@/components/ui/combobox';
import { DatePicker } from '@/components/ui/date-picker';
import { Plus, AlertTriangle, ShieldAlert, Search, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';

const typeIncidentLabel = (type) => {
  const map = { PERTE: 'Perte', VOL: 'Vol', FIN_CONTRAT: 'Fin de contrat' };
  return map[type] || type;
};

const statutLabel = (statut) => {
  const map = { PROGRAMME: 'Programmé', SUSPENDU: 'Suspendu', REVOQUE: 'Révoqué', LEVE: 'Levée' };
  return map[statut] || statut;
};

const todayLocal = () => {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
};

export default function IncidentsManager() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [statut, setStatut] = useState('');
  const [type, setType] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [showSignal, setShowSignal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [form, setForm] = useState({ badgeId: '', employeId: '', typeIncident: 'FIN_CONTRAT', dateFinContrat: '', commentaire: '' });
  const [employees, setEmployees] = useState([]);
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

  useEffect(() => {
    api.get('/managers/mes-employes', { params: { avecBadge: true, size: 200 } })
      .then((res) => setEmployees(res.data.data.content || res.data.data))
      .catch(() => {});
  }, []);

  const openSignalModal = () => {
    setForm({ badgeId: '', employeId: '', typeIncident: 'FIN_CONTRAT', dateFinContrat: '', commentaire: '' });
    setShowSignal(true);
    setError('');
  };

  const handleEmployeeSelect = (employeId) => {
    const emp = employees.find((em) => String(em.id) === String(employeId));
    setForm({ ...form, employeId, badgeId: emp?.badgeId || '' });
  };

  const handleSignalSubmit = (e) => {
    e.preventDefault();
    if (!form.employeId) { setError('Selectionnez un employe'); return; }
    if (form.typeIncident === 'FIN_CONTRAT' && !form.dateFinContrat) { setError('Renseignez la date de fin de contrat'); return; }
    setShowConfirm(true);
  };

  const confirmSignal = async () => {
    setActionLoading(true);
    setError('');
    try {
      await api.post('/incidents', {
        badgeId: parseInt(form.badgeId, 10),
        typeIncident: form.typeIncident,
        dateFinContrat: form.dateFinContrat || null,
        commentaire: form.commentaire,
      });
      setShowSignal(false);
      setShowConfirm(false);
      fetchIncidents(page, statut, type, search);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la declaration');
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

  const isProgrammed = form.dateFinContrat && form.dateFinContrat > todayLocal();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Incidents</h1>
          <p className="text-sm text-muted-foreground mt-1">Suivi des incidents et fins de contrat de votre direction</p>
        </div>
        <Button variant="destructive" onClick={openSignalModal}>
          <Plus className="size-4 mr-2" />
          Declarer une fin de contrat
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="relative w-full max-w-[260px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Badge UID ou employe..."
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
                    <th className="pb-3 font-medium">Employe</th>
                    <th className="pb-3 font-medium">Type</th>
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {incidents.map((inc) => (
                    <tr key={inc.id} className="border-b last:border-0">
                      <td className="py-3 text-sm font-mono text-xs">{inc.badgeUid}</td>
                      <td className="py-3 text-sm">{inc.employeNom || '-'}</td>
                      <td className="py-3 text-sm">{typeIncidentLabel(inc.typeIncident)}</td>
                      <td className="py-3 text-sm">
                        {new Date(inc.dateIncident).toLocaleDateString()}
                        {inc.typeIncident === 'FIN_CONTRAT' && inc.dateFinContrat && (
                          <div className="text-xs text-muted-foreground">Fin : {new Date(inc.dateFinContrat).toLocaleDateString()}</div>
                        )}
                      </td>
                      <td className="py-3">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${statutConfig[inc.statut]?.cls || 'bg-[#674459]/10 text-[#674459]'}`}>
                          {statutLabel(inc.statut)}
                        </span>
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

      <Dialog open={showSignal} onOpenChange={(open) => { if (!open) setShowSignal(false); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Declarer une fin de contrat</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSignalSubmit}>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Employe</label>
                <Combobox
                  items={employees.map((emp) => ({ value: emp.id, label: `${emp.prenom} ${emp.nom} (${emp.email})` }))}
                  value={form.employeId}
                  onChange={handleEmployeeSelect}
                  placeholder="Rechercher un employe..."
                  emptyText="Aucun employe"
                />
              </div>
              {form.badgeId && (
                <p className="text-sm"><span className="text-muted-foreground">Badge UID :</span> <span className="font-medium">{employees.find((e) => String(e.id) === form.employeId)?.badgeUid}</span></p>
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium">Date de fin de contrat</label>
                <DatePicker
                  value={form.dateFinContrat}
                  onChange={(d) => setForm({ ...form, dateFinContrat: d })}
                  placeholder="Selectionner une date"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Commentaire (optionnel)</label>
                <Textarea
                  value={form.commentaire}
                  onChange={(e) => setForm({ ...form, commentaire: e.target.value })}
                  placeholder="Details complementaires..."
                />
              </div>
              {error && <div className="text-destructive bg-destructive/10 p-3 rounded-md text-sm">{error}</div>}
            </div>
            <DialogFooter className="mt-4">
              <Button variant="outline" type="button" onClick={() => setShowSignal(false)}>Annuler</Button>
              <Button type="submit" variant="destructive">Suivant</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showConfirm} onOpenChange={(open) => { if (!open) setShowConfirm(false); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la declaration</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="flex items-start gap-3 p-3 bg-[#F1BE5B]/10 border border-[#F1BE5B]/40 rounded-md">
              <AlertTriangle className="size-5 text-[#A67C00] shrink-0 mt-0.5" />
              <p className="text-sm text-[#5C4A00]">
                {isProgrammed
                  ? `Etes-vous sur de vouloir declarer la fin de contrat de cet employe ? Le badge restera actif jusqu'au ${form.dateFinContrat} puis sera suspendu automatiquement ; l'agent de surete confirmera ensuite la revocation.`
                  : 'Etes-vous sur de vouloir declarer la fin de contrat de cet employe ? Son badge sera suspendu immediatement et l\'agent de surete devra confirmer la revocation.'}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-muted-foreground">Employe :</span> <span className="font-medium">{employees.find((e) => String(e.id) === form.employeId)?.prenom} {employees.find((e) => String(e.id) === form.employeId)?.nom}</span></div>
              <div><span className="text-muted-foreground">Badge UID :</span> <span className="font-medium">{employees.find((e) => String(e.id) === form.employeId)?.badgeUid}</span></div>
              <div><span className="text-muted-foreground">Date de fin :</span> <span className="font-medium">{form.dateFinContrat}</span></div>
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
