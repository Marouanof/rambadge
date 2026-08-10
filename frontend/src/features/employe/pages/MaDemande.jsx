import { useState, useEffect } from 'react';
import api from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import BadgeCard from '@/features/employe/components/BadgeCard';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Plus, Send, AlertTriangle, BadgeCheck,
  Clock, CheckCircle2, XCircle, ShieldAlert,
} from 'lucide-react';

const statutLabels = {
  EN_ATTENTE_N1: 'En attente N1', EN_ATTENTE_N2: 'En attente N2',
  VALIDEE: 'Validee', REFUSEE_N1: 'Refusee N1', REFUSEE_N2: 'Refusee N2',
};

const steps = ['EN_ATTENTE_N1', 'EN_ATTENTE_N2', 'VALIDEE'];
const statutStyle = (statut) => {
  if (statut === 'VALIDEE') return { backgroundColor: '#008B60', color: '#fff' };
  if (statut === 'REFUSEE_N1' || statut === 'REFUSEE_N2' || statut === 'REFUSEE') return { backgroundColor: '#C20831', color: '#fff' };
  return { backgroundColor: '#F1BE5B', color: '#4A3B05' };
};
const statutIcons = {
  EN_ATTENTE_N1: Clock, EN_ATTENTE_N2: Clock,
  VALIDEE: CheckCircle2, REFUSEE_N1: XCircle, REFUSEE_N2: XCircle,
};
const badStatuts = ['REFUSEE_N1', 'REFUSEE_N2'];

const referenceDemande = (demande) => {
  const annee = new Date(demande.createdAt).getFullYear();
  return `DEM-${annee}-${String(demande.id).padStart(4, '0')}`;
};

export default function MaDemande() {
  const [demande, setDemande] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [zones, setZones] = useState([]);
  const [selectedZoneIds, setSelectedZoneIds] = useState([]);
  const requiredPieces = [
    { key: 'PIECE_IDENTITE', label: "Piece d'identite" },
    { key: 'ATTESTATIONFORMATION', label: 'Attestation de formation' },
    { key: 'JUSTIFICATION_POSTE', label: 'Justificatif de poste' },
    { key: 'CASIER_JUDICIAIRE', label: 'Casier judiciaire' },
  ];
  const [pieces, setPieces] = useState(
    requiredPieces.map((p) => ({ typePiece: p.key, file: null, fileName: '' }))
  );
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [showIncident, setShowIncident] = useState(false);
  const [incidentForm, setIncidentForm] = useState({ badgeId: '', typeIncident: 'PERTE', commentaire: '' });
  const [monBadge, setMonBadge] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [compteStatut, setCompteStatut] = useState('ACTIF');
  const compteBloque = compteStatut === 'SUSPENDU' || compteStatut === 'INACTIF';
  const MAX_FILE_SIZE = 5 * 1024 * 1024;

  useEffect(() => {
    api.get('/dashboard/employe')
      .then((res) => setCompteStatut(res.data.data?.compteStatut || 'ACTIF'))
      .catch(() => {});
    api.get('/demandes', { params: { page: 0, size: 1 } })
      .then((res) => {
        const content = res.data.data.content;
        if (content.length > 0) setDemande(content[0]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    api.get('/badges/mine')
      .then((res) => { if (res.data.data) setMonBadge(res.data.data); })
      .catch(() => {});
    api.get('/zones')
      .then((res) => setZones(res.data.data))
      .catch(() => {});
  }, []);

  const toggleZone = (zoneId) => {
    setSelectedZoneIds((prev) => (prev.includes(zoneId) ? prev.filter((id) => id !== zoneId) : [...prev, zoneId]));
  };

  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/files/upload', formData);
    return res.data.data;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError('');
    try {
      if (!photoFile) {
        setError('La photo d\'identite est obligatoire pour le badge');
        setActionLoading(false);
        return;
      }
      if (photoFile.size > MAX_FILE_SIZE) {
        setError('La photo ne doit pas depasser 5 Mo');
        setActionLoading(false);
        return;
      }
      if (selectedZoneIds.length === 0) {
        setError('Selectionnez au moins une zone d\'acces');
        setActionLoading(false);
        return;
      }
      const piecesWithUrls = [];
      const photoUrl = await uploadFile(photoFile);
      piecesWithUrls.push({ typePiece: 'PHOTO_IDENTITE', fichierUrl: photoUrl });
      for (const piece of pieces) {
        if (!piece.file) { setError('Veuillez selectionner un fichier pour chaque piece'); setActionLoading(false); return; }
        if (piece.file.size > MAX_FILE_SIZE) {
          setError('Chaque fichier ne doit pas depasser 5 Mo');
          setActionLoading(false);
          return;
        }
        const fileUrl = await uploadFile(piece.file);
        piecesWithUrls.push({ typePiece: piece.typePiece, fichierUrl: fileUrl });
      }
      await api.post('/demandes', { pieces: piecesWithUrls, zoneIds: selectedZoneIds });
      setShowForm(false);
      setPhotoFile(null);
      setPhotoPreview('');
      setSelectedZoneIds([]);
      setPieces(requiredPieces.map((p) => ({ typePiece: p.key, file: null, fileName: '' })));
      const res = await api.get('/demandes', { params: { page: 0, size: 1 } });
      const content = res.data.data.content;
      if (content.length > 0) setDemande(content[0]);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la soumission');
    } finally {
      setActionLoading(false);
    }
  };

  const openIncidentModal = () => {
    setIncidentForm({ badgeId: monBadge?.id ? String(monBadge.id) : '', typeIncident: 'PERTE', commentaire: '' });
    setError('');
    setShowIncident(true);
  };

  const handleSignalIncident = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError('');
    try {
      await api.post('/incidents', { badgeId: parseInt(incidentForm.badgeId, 10), typeIncident: incidentForm.typeIncident, commentaire: incidentForm.commentaire });
      setShowIncident(false);
      setIncidentForm({ badgeId: '', typeIncident: 'PERTE', commentaire: '' });
      api.get('/badges/mine').then((res) => { if (res.data.data) setMonBadge(res.data.data); }).catch(() => {});
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    } finally {
      setActionLoading(false);
    }
  };

  const Icon = demande ? (statutIcons[demande.statut] || Clock) : null;

  if (loading) return <div className="flex items-center justify-center py-12 text-muted-foreground">Chargement...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Ma demande de badge</h1>
          <p className="text-sm text-muted-foreground mt-1">Suivez votre demande ou soumettez-en une nouvelle</p>
        </div>
        {(!demande || badStatuts.includes(demande.statut)) && !compteBloque && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="size-4 mr-2" />
            Soumettre une demande
          </Button>
        )}
      </div>

      {compteBloque && (
        <div className="flex items-start gap-3 rounded-lg border border-[#C20831]/30 bg-[#C20831]/5 p-4">
          <AlertTriangle className="size-5 mt-0.5 shrink-0 text-[#C20831]" />
          <div>
            <p className="text-sm font-medium text-[#C20831]">
              {compteStatut === 'SUSPENDU' ? 'Votre compte est suspendu' : 'Votre compte est désactivé'}
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {compteStatut === 'SUSPENDU'
                ? "Vous ne pouvez pas soumettre de nouvelle demande de badge tant que votre compte est suspendu."
                : "Votre compte a été désactivé. Vous ne pouvez plus soumettre de demande de badge."}
            </p>
          </div>
        </div>
      )}

      {error && !showForm && !showIncident && (
        <div className="text-destructive bg-destructive/10 p-3 rounded-md text-sm">{error}</div>
      )}

      {demande ? (
        <Card className="shadow-sm">
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">{referenceDemande(demande)}</h3>
                <p className="text-sm text-muted-foreground">Soumise le {new Date(demande.createdAt).toLocaleDateString()}</p>
              </div>
              <Badge className="text-sm gap-1.5 px-3 py-1.5" style={statutStyle(demande.statut)}>
                {Icon && <Icon className="size-4" />}
                {statutLabels[demande.statut] || demande.statut}
              </Badge>
            </div>

            <div className="flex items-center justify-between px-4 py-3 bg-muted/50 rounded-lg">
              {steps.map((step, i) => {
                const currentIndex = steps.indexOf(demande.statut);
                const isCompleted = i <= currentIndex;
                const isCurrent = i === currentIndex;
                const isRefused = badStatuts.includes(demande.statut) && i === currentIndex;
                return (
                  <div key={step} className="flex flex-col items-center gap-1 flex-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      isRefused ? 'bg-[#C20831] text-white' :
                      isCompleted ? 'bg-[#008B60] text-white' : 'bg-muted text-muted-foreground'
                    }`}>
                      {isRefused ? <XCircle className="size-4" /> : isCompleted ? <CheckCircle2 className="size-4" /> : i + 1}
                    </div>
                    <span className={`text-xs text-center ${isCurrent ? 'font-semibold' : isCompleted ? 'text-muted-foreground' : 'text-muted-foreground/50'}`}>
                      {statutLabels[step]}
                    </span>
                  </div>
                );
              })}
            </div>

            {(demande.statut === 'REFUSEE_N1' || demande.statut === 'REFUSEE_N2') && demande.motifRefus && (
              <div className="flex items-start gap-3 p-3 bg-[#C20831]/10 border border-[#C20831]/20 rounded-md">
                <XCircle className="size-5 text-[#C20831] shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-[#C20831]">Motif du refus</p>
                  <p className="text-sm text-[#C20831]/80">{demande.motifRefus}</p>
                </div>
              </div>
            )}

            {demande.zonesDemandees && demande.zonesDemandees.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Zones demandees</h4>
                <div className="space-y-2">
                  {demande.zonesDemandees.map((z) => (
                    <div key={z.id} className="flex items-center justify-between border rounded-md p-3">
                      <span className="text-sm font-medium">{z.zoneNom}</span>
                      <Badge className="text-xs" style={statutStyle(z.statutN2 || 'EN_ATTENTE_N1')}>
                        {z.statutN2 || 'En attente'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {demande.statut === 'VALIDEE' && monBadge && (
              <>
                <BadgeCard
                  badge={monBadge}
                  photoUrl={demande.pieces?.find(p => p.typePiece === 'PHOTO_IDENTITE')?.fichierUrl}
                  employe={{ prenom: demande.employePrenom, nom: demande.employeNom }}
                  direction={demande.directionNom}
                />
                <Button variant="destructive" onClick={openIncidentModal}>
                  <ShieldAlert className="size-4 mr-2" />
                  Signaler une perte ou un vol
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      ) : !showForm ? (
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <BadgeCheck className="size-12 mb-3 text-muted-foreground/50" />
            <p className="text-sm">Aucune demande en cours. Soumettez une demande de badge.</p>
          </CardContent>
        </Card>
      ) : null}

      {showForm && !compteBloque && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Nouvelle demande de badge</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="border rounded-md p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Photo d'identite pour le badge</span>
                </div>
                <p className="text-xs text-muted-foreground">JPEG ou PNG, max 5 Mo</p>
                {photoPreview ? (
                  <div className="flex flex-col items-center gap-2">
                    <img src={photoPreview} alt="Photo" className="w-32 h-32 object-cover rounded-lg border" />
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => {
                        setPhotoFile(null);
                        setPhotoPreview('');
                      }}>
                        Supprimer
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Input
                    type="file"
                    accept="image/jpeg,image/png"
                    required
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > MAX_FILE_SIZE) {
                        setError('La photo ne doit pas depasser 5 Mo');
                        return;
                      }
                      setError('');
                      setPhotoFile(file);
                      const reader = new FileReader();
                      reader.onload = (ev) => setPhotoPreview(ev.target?.result || '');
                      reader.readAsDataURL(file);
                    }}
                    className="text-sm"
                  />
                )}
              </div>

              {pieces.map((piece, i) => (
                <div key={piece.typePiece} className="border rounded-md p-4 space-y-3">
                  <span className="text-sm font-medium">{requiredPieces[i].label}</span>
                  <p className="text-xs text-muted-foreground">Formats acceptes : PDF, JPEG, PNG</p>
                  <div className="space-y-1">
                    <Input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const p = [...pieces];
                        if (e.target.files[0]) {
                          if (e.target.files[0].size > MAX_FILE_SIZE) {
                            setError('Chaque fichier ne doit pas depasser 5 Mo');
                            return;
                          }
                          setError('');
                          p[i].file = e.target.files[0];
                          p[i].fileName = e.target.files[0].name;
                        }
                        setPieces(p);
                      }}
                      required
                      className="text-sm"
                    />
                  </div>
                  {piece.fileName && <p className="text-xs text-muted-foreground">{piece.fileName}</p>}
                </div>
              ))}

              <div className="border rounded-md p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Zones d'acces demande</span>
                  <span className="text-xs text-muted-foreground">{selectedZoneIds.length} selectionnee(s)</span>
                </div>
                <p className="text-xs text-muted-foreground">Selectionnez au moins une zone a laquelle vous devez acceder</p>
                <div className="space-y-2">
                  {zones.map((z) => (
                    <label key={z.id} className="flex items-center gap-2 cursor-pointer border rounded-md p-3">
                      <input
                        type="checkbox"
                        checked={selectedZoneIds.includes(z.id)}
                        onChange={() => toggleZone(z.id)}
                        className="size-4 rounded border-gray-300"
                      />
                      <span className="text-sm font-medium">{z.nom}</span>
                    </label>
                  ))}
                </div>
              </div>

              {error && <div className="text-destructive bg-destructive/10 p-3 rounded-md text-sm">{error}</div>}

              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Annuler</Button>
                <Button type="submit" disabled={actionLoading}>
                  <Send className="size-4 mr-2" />
                  {actionLoading ? 'Envoi...' : 'Soumettre la demande'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Dialog open={showIncident} onOpenChange={setShowIncident}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Signaler une perte ou un vol</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSignalIncident}>
            <div className="space-y-4 py-2">
              <div className="flex items-start gap-3 p-3 bg-[#F1BE5B]/15 border border-[#F1BE5B]/40 rounded-md">
                <AlertTriangle className="size-5 text-[#A67C00] shrink-0 mt-0.5" />
                <p className="text-sm text-[#5C4A00]">Cette action suspendra immediatement votre badge.</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Badge</label>
                <Input value={monBadge ? `${monBadge.id} — UID: ${monBadge.uidUnique}` : 'Aucun badge'} disabled className="text-sm" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <select
                  value={incidentForm.typeIncident}
                  onChange={(e) => setIncidentForm({ ...incidentForm, typeIncident: e.target.value })}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="PERTE">Perte</option>
                  <option value="VOL">Vol</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Commentaire</label>
                <Textarea
                  value={incidentForm.commentaire}
                  onChange={(e) => setIncidentForm({ ...incidentForm, commentaire: e.target.value })}
                  placeholder="Details..."
                />
              </div>
              {error && <div className="text-destructive bg-destructive/10 p-3 rounded-md text-sm">{error}</div>}
            </div>
            <DialogFooter className="mt-4">
              <Button variant="outline" type="button" onClick={() => setShowIncident(false)}>Annuler</Button>
              <Button variant="destructive" type="submit" disabled={actionLoading || !monBadge}>
                {actionLoading ? 'Envoi...' : 'Confirmer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
