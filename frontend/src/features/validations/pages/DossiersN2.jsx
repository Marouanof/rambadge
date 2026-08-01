import { useState, useEffect } from 'react';
import api from '@/services/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { ClipboardList, CheckCircle2, XCircle, FileText, Image } from 'lucide-react';

export default function DossiersN2() {
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [detail, setDetail] = useState(null);
  const [checklist, setChecklist] = useState({
    casierJudiciaire: false,
    attestationFormation: false,
    justificationPoste: false,
    pieceIdentite: false,
  });
  const [zoneDecisions, setZoneDecisions] = useState({});
  const [zoneRefusMotifs, setZoneRefusMotifs] = useState({});
  const [motifRefusGlobal, setMotifRefusGlobal] = useState('');
  const [showMotifRefus, setShowMotifRefus] = useState(false);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDemandes = async (p) => {
    setLoading(true);
    try {
      const res = await api.get('/demandes', { params: { page: p, size: 10 } });
      const all = res.data.data.content;
      setDemandes(all.filter((d) => d.statut === 'EN_ATTENTE_N2'));
      setTotalPages(res.data.data.totalPages);
    } catch {
      setError('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDemandes(page); }, [page]);

  const openDetail = (demande) => {
    setDetail(demande);
    setChecklist({ casierJudiciaire: false, attestationFormation: false, justificationPoste: false, pieceIdentite: false });
    const decisions = {};
    const refusMotifs = {};
    if (demande.zonesDemandees) {
      demande.zonesDemandees.forEach((z) => {
        decisions[z.id] = 'valider';
        refusMotifs[z.id] = '';
      });
    }
    setZoneDecisions(decisions);
    setZoneRefusMotifs(refusMotifs);
    setMotifRefusGlobal('');
    setShowMotifRefus(false);
    setError('');
  };

  const allChecked = checklist.casierJudiciaire && checklist.attestationFormation && checklist.justificationPoste && checklist.pieceIdentite;

  const handleValidate = async () => {
    if (!allChecked) { setError('Tous les elements de la checklist doivent etre verifies'); return; }
    const zones = Object.entries(zoneDecisions).map(([id, decision]) => {
      const zoneDemandeeId = parseInt(id, 10);
      if (decision === 'refuser') return { zoneDemandeeId, validee: false, motifRefus: zoneRefusMotifs[id] || '' };
      return { zoneDemandeeId, validee: true };
    });
    if (zones.length === 0) { setError('Selectionnez au moins une zone'); return; }
    const allRefused = zones.every((z) => !z.validee);
    if (allRefused) { setError('Toutes les zones sont refusées. Utilisez "Refuser la demande" pour un refus global.'); return; }
    const refusedZones = zones.filter((z) => !z.validee && !z.motifRefus.trim());
    if (refusedZones.length > 0) { setError('Le motif de refus est obligatoire pour chaque zone refusee'); return; }
    setActionLoading(true);
    setError('');
    try {
      await api.post(`/demandes/${detail.id}/validate-n2`, { checklistConformite: checklist, zones });
      setDetail(null);
      fetchDemandes(page);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la validation');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRefuseGlobal = async () => {
    if (!showMotifRefus) { setShowMotifRefus(true); return; }
    if (!motifRefusGlobal.trim()) { setError('Le motif de refus est obligatoire'); return; }
    setActionLoading(true);
    setError('');
    try {
      await api.post(`/demandes/${detail.id}/refuse-n2`, { motifRefus: motifRefusGlobal });
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
        <h1 className="text-2xl font-semibold tracking-tight">Dossiers a instruire (N2)</h1>
        <p className="text-sm text-muted-foreground mt-1">Instruction et validation finale des demandes de badge</p>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-6">
          {error && !detail && <div className="text-destructive bg-destructive/10 p-3 rounded-md mb-4 text-sm">{error}</div>}

          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">Chargement...</div>
          ) : demandes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <ClipboardList className="size-12 mb-3 text-muted-foreground/50" />
              <p className="text-sm">Aucun dossier en attente</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-muted-foreground">
                    <th className="pb-3 font-medium">Employe</th>
                    <th className="pb-3 font-medium">Direction</th>
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {demandes.map((d) => (
                    <tr key={d.id} className="border-b last:border-0">
                      <td className="py-3 text-sm">{d.employePrenom} {d.employeNom}</td>
                      <td className="py-3 text-sm">{d.directionNom}</td>
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

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-4">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>Precedent</Button>
              <span className="text-sm text-muted-foreground">{page + 1} / {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>Suivant</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!detail} onOpenChange={(open) => { if (!open) setDetail(null); }}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Instruction — {detail?.employePrenom} {detail?.employeNom}</DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-muted-foreground">Email :</span> <span className="font-medium">{detail.employeEmail}</span></div>
                <div><span className="text-muted-foreground">Direction :</span> <span className="font-medium">{detail.directionNom}</span></div>
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

              {detail.validationN1 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Validation N1</h4>
                  <p className="text-sm"><span className="text-muted-foreground">Manager :</span> <span className="font-medium">{detail.validationN1.managerNom}</span></p>
                </div>
              )}

              <Separator />

              {detail.zonesDemandees && detail.zonesDemandees.length > 0 && !showMotifRefus && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Zones demandees</h4>
                  <div className="space-y-2">
                    {detail.zonesDemandees.map((z) => (
                      <div key={z.id} className="border rounded-md p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <span className="text-sm font-medium">{z.zoneNom}</span>
                            <p className="text-xs text-muted-foreground">{z.justification || 'Pas de justification'}</p>
                          </div>
                          <div className="flex gap-2">
                            <label className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs cursor-pointer ${zoneDecisions[z.id] === 'valider' ? 'bg-green-100 text-green-700 border border-green-300' : 'border'}`}>
                              <input
                                type="radio"
                                name={`zone-${z.id}`}
                                checked={zoneDecisions[z.id] === 'valider'}
                                onChange={() => setZoneDecisions((prev) => ({ ...prev, [z.id]: 'valider' }))}
                                className="sr-only"
                              />
                              Valider
                            </label>
                            <label className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs cursor-pointer ${zoneDecisions[z.id] === 'refuser' ? 'bg-red-100 text-red-700 border border-red-300' : 'border'}`}>
                              <input
                                type="radio"
                                name={`zone-${z.id}`}
                                checked={zoneDecisions[z.id] === 'refuser'}
                                onChange={() => setZoneDecisions((prev) => ({ ...prev, [z.id]: 'refuser' }))}
                                className="sr-only"
                              />
                              Refuser
                            </label>
                          </div>
                        </div>
                        {zoneDecisions[z.id] === 'refuser' && (
                          <Textarea
                            className="text-sm mt-2"
                            value={zoneRefusMotifs[z.id] || ''}
                            onChange={(e) => setZoneRefusMotifs((prev) => ({ ...prev, [z.id]: e.target.value }))}
                            placeholder={`Motif du refus pour ${z.zoneNom}...`}
                            rows={2}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!showMotifRefus && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Checklist de conformite</h4>
                  <div className="space-y-2">
                    {[
                      { key: 'pieceIdentite', label: "Piece d'identite verifiee" },
                      { key: 'attestationFormation', label: 'Attestations de formation conformes' },
                      { key: 'justificationPoste', label: 'Poste justifie' },
                      { key: 'casierJudiciaire', label: 'Casier judiciaire verifie' },
                    ].map((item) => (
                      <label key={item.key} className="flex items-center gap-2 cursor-pointer text-sm">
                        <input
                          type="checkbox"
                          checked={checklist[item.key]}
                          onChange={() => setChecklist((prev) => ({ ...prev, [item.key]: !prev[item.key] }))}
                          className="size-4 rounded border-gray-300"
                        />
                        {item.label}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {showMotifRefus && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Motif du refus de la demande</h4>
                  <Textarea
                    value={motifRefusGlobal}
                    onChange={(e) => setMotifRefusGlobal(e.target.value)}
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
              <Button variant="outline" onClick={() => { setShowMotifRefus(false); setMotifRefusGlobal(''); setError(''); }}>
                Annuler le refus
              </Button>
            )}
            {!showMotifRefus && (
              <Button variant="destructive" onClick={handleRefuseGlobal} disabled={actionLoading}>
                <XCircle className="size-4 mr-1" />
                Refuser la demande
              </Button>
            )}
            {showMotifRefus && (
              <Button variant="destructive" onClick={handleRefuseGlobal} disabled={actionLoading}>
                <XCircle className="size-4 mr-1" />
                Confirmer le refus
              </Button>
            )}
            <Button onClick={handleValidate} disabled={actionLoading || !allChecked || showMotifRefus}>
              <CheckCircle2 className="size-4 mr-1" />
              Enregistrer les decisions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
