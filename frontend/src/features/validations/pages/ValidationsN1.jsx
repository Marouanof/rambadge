import { useState, useEffect } from 'react';
import api from '@/services/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { ClipboardList, CheckCircle2, XCircle, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { DatePicker } from '@/components/ui/date-picker';

const todayLocal = () => {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
};

export default function ValidationsN1() {
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [detail, setDetail] = useState(null);
  const [zones, setZones] = useState([]);
  const [selectedZones, setSelectedZones] = useState({});
  const [dateFinContrat, setDateFinContrat] = useState('');
  const [motifRefus, setMotifRefus] = useState('');
  const [showMotifRefus, setShowMotifRefus] = useState(false);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDemandes = async (p) => {
    setLoading(true);
    try {
      const res = await api.get('/demandes', { params: { page: p, size: 10, statut: 'EN_ATTENTE_N1' } });
      setDemandes(res.data.data.content);
      setTotalPages(res.data.data.totalPages);
    } catch {
      setError('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDemandes(page); }, [page]);

  useEffect(() => {
    api.get('/zones').then((res) => setZones(res.data.data)).catch(() => {});
  }, []);

  const openDetail = (demande) => {
    setDetail(demande);
    const initial = {};
    if (demande.zonesDemandees) {
      demande.zonesDemandees.forEach((z) => { initial[z.zoneId] = true; });
    }
    setSelectedZones(initial);
    setDateFinContrat('');
    setMotifRefus('');
    setShowMotifRefus(false);
    setError('');
  };

  const toggleZone = (zoneId) => {
    setSelectedZones((prev) => ({ ...prev, [zoneId]: !prev[zoneId] }));
  };

  const handleValidate = async () => {
    const selected = Object.entries(selectedZones)
      .filter(([, v]) => v)
      .map(([id]) => parseInt(id, 10));
    if (selected.length === 0) {
      setError('Selectionnez au moins une zone');
      return;
    }
    if (!dateFinContrat) {
      setError('Renseignez la date de fin de contrat');
      return;
    }
    if (dateFinContrat <= todayLocal()) {
      setError('La date de fin de contrat doit être dans le futur');
      return;
    }
    setActionLoading(true);
    setError('');
    try {
      await api.post(`/demandes/${detail.id}/validate-n1`, { zoneIds: selected, dateFinContrat });
      setDetail(null);
      fetchDemandes(page);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la validation');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRefuse = async () => {
    if (!showMotifRefus) { setShowMotifRefus(true); return; }
    if (!motifRefus.trim()) { setError('Le motif de refus est obligatoire'); return; }
    setActionLoading(true);
    setError('');
    try {
      await api.post(`/demandes/${detail.id}/refuse-n1`, { motifRefus });
      setDetail(null);
      fetchDemandes(page);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors du refus');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Validations en attente (N1)</h1>
        <p className="text-sm text-muted-foreground mt-1">Instruire les demandes de badge en attente de votre validation</p>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-6">
          {error && !detail && <div className="text-destructive bg-destructive/10 p-3 rounded-md mb-4 text-sm">{error}</div>}

          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">Chargement...</div>
          ) : demandes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <ClipboardList className="size-12 mb-3 text-muted-foreground/50" />
              <p className="text-sm">Aucune demande en attente</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-muted-foreground">
                    <th className="pb-3 font-medium">Employe</th>
                    <th className="pb-3 font-medium">Poste</th>
                    <th className="pb-3 font-medium">Zones demandees</th>
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {demandes.map((d) => (
                    <tr key={d.id} className="border-b last:border-0">
                      <td className="py-3 text-sm">{d.employePrenom} {d.employeNom}</td>
                      <td className="py-3 text-sm">{d.employePoste || '-'}</td>
                      <td className="py-3 text-sm">
                        {d.zonesDemandees?.length
                          ? d.zonesDemandees.map((z) => z.zoneNom).join(', ')
                          : '-'}
                      </td>
                      <td className="py-3 text-sm">{new Date(d.createdAt).toLocaleDateString()}</td>
                      <td className="py-3">
                        <Button variant="outline" size="sm" onClick={() => openDetail(d)}>
                          <ClipboardList className="size-3.5 mr-1" />
                          Instruire
                        </Button>
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

      <Dialog open={!!detail} onOpenChange={(open) => { if (!open) setDetail(null); }}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Demande de {detail?.employePrenom} {detail?.employeNom}</DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-muted-foreground">Email :</span> <span className="font-medium">{detail.employeEmail}</span></div>
                <div><span className="text-muted-foreground">Direction :</span> <span className="font-medium">{detail.directionNom}</span></div>
                <div><span className="text-muted-foreground">Poste :</span> <span className="font-medium">{detail.employePoste || '—'}</span></div>
                <div className="col-span-2"><span className="text-muted-foreground">Date :</span> <span className="font-medium">{new Date(detail.createdAt).toLocaleString()}</span></div>
              </div>

              {(() => {
                const photo = detail.pieces?.find(p => p.typePiece === 'PHOTO_IDENTITE');
                return photo ? (
                  <div className="flex justify-center">
                    <img src={photo.fichierUrl} alt="Photo" className="w-28 h-28 object-cover rounded-full border-2 border-primary" />
                  </div>
                ) : null;
              })()}

              <Separator />

              {detail.pieces && detail.pieces.filter(p => p.typePiece !== 'PHOTO_IDENTITE').length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Pieces justificatives</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {detail.pieces.filter(p => p.typePiece !== 'PHOTO_IDENTITE').map((p, i) => (
                      <div key={i} className="border rounded-md p-3">
                        <p className="text-xs font-medium text-muted-foreground mb-2">{p.typePiece.replace('_', ' ')}</p>
                        {p.fichierUrl?.startsWith('data:image') ? (
                          <img src={p.fichierUrl} alt={p.typePiece} className="max-h-[120px] rounded object-contain mx-auto" />
                        ) : p.fichierUrl?.startsWith('data:application/pdf') ? (
                          <div className="flex items-center justify-center h-[80px] bg-muted rounded">
                            <FileText className="size-8 text-muted-foreground" />
                          </div>
                        ) : (
                          <a href={p.fichierUrl} target="_blank" rel="noreferrer" className="text-xs text-primary underline">Voir le fichier</a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!showMotifRefus && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Zones d'acces a autoriser</h4>
                  <p className="text-xs text-muted-foreground mb-2">Zones demandees pre-cochées — cochez ou decochez pour ajuster avant la validation</p>
                  <div className="space-y-2">
                    {zones.map((z) => (
                      <div key={z.id} className="border rounded-md p-3">
                        <label className="flex items-start gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!selectedZones[z.id]}
                            onChange={() => toggleZone(z.id)}
                            className="mt-0.5 size-4 rounded border-gray-300"
                          />
                          <div className="flex-1">
                            <span className="text-sm font-medium">{z.nom}</span>
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="border rounded-md p-3">
                <label className="text-sm font-medium">Date de fin de contrat</label>
                <p className="text-xs text-muted-foreground mb-2">Le badge expirera à cette date (remplace la durée par défaut d'un an)</p>
                <DatePicker
                  value={dateFinContrat}
                  onChange={setDateFinContrat}
                  disabled={{ before: new Date() }}
                  placeholder="Selectionner une date"
                />
              </div>

              {showMotifRefus && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Motif de refus</h4>
                  <Textarea
                    value={motifRefus}
                    onChange={(e) => setMotifRefus(e.target.value)}
                    placeholder="Motif du refus..."
                    rows={3}
                  />
                </div>
              )}

              {error && <div className="text-destructive bg-destructive/10 p-3 rounded-md text-sm">{error}</div>}
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDetail(null)}>Annuler</Button>
            {showMotifRefus && (
              <Button variant="outline" onClick={() => { setShowMotifRefus(false); setMotifRefus(''); setError(''); }}>
                Annuler le refus
              </Button>
            )}
            <Button variant="destructive" onClick={handleRefuse} disabled={actionLoading}>
              <XCircle className="size-4 mr-1" />
              {showMotifRefus ? 'Confirmer le refus' : 'Refuser'}
            </Button>
            <Button onClick={handleValidate} disabled={actionLoading || showMotifRefus}>
              <CheckCircle2 className="size-4 mr-1" />
              Pre-approuver
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
