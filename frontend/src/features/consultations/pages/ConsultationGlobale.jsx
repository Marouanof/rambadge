import { useState, useEffect } from 'react';
import api from '@/services/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Search, Globe, Eye, X } from 'lucide-react';

export default function ConsultationGlobale() {
  const [tab, setTab] = useState('demandes');
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [error, setError] = useState('');
  const [detail, setDetail] = useState(null);
  const [filters, setFilters] = useState({
    direction: '', employe: '', zone: '', dateDebut: '', dateFin: '', statut: '',
  });
  const [directions, setDirections] = useState([]);
  const [zones, setZones] = useState([]);

  useEffect(() => {
    Promise.all([
      api.get('/directions', { params: { page: 0, size: 100 } }),
      api.get('/zones'),
    ]).then(([dirRes, zoneRes]) => {
      setDirections(dirRes.data.data.content || []);
      setZones(zoneRes.data.data || []);
    }).catch(() => {});
  }, []);

  const fetchData = async (t, p) => {
    setLoading(true);
    setError('');
    try {
      let res;
      if (t === 'demandes') res = await api.get('/demandes/toutes', { params: { page: p, size: 50 } });
      else if (t === 'badges') res = await api.get('/badges', { params: { page: p, size: 50 } });
      else if (t === 'passages') res = await api.get('/passages', { params: { page: p, size: 50 } });
      setData(res.data.data.content);
      setTotalPages(res.data.data.totalPages);
    } catch {
      setError('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(tab, page); }, [tab, page]);

  useEffect(() => {
    let result = [...data];
    if (filters.direction) result = result.filter((d) => (d.directionNom || '').toLowerCase().includes(filters.direction.toLowerCase()));
    if (filters.employe) result = result.filter((d) => `${d.employePrenom || ''} ${d.employeNom || ''} ${d.employeEmail || ''}`.toLowerCase().includes(filters.employe.toLowerCase()));
    if (filters.zone && tab === 'passages') result = result.filter((d) => (d.zoneNom || '').toLowerCase().includes(filters.zone.toLowerCase()));
    if (filters.statut) result = result.filter((d) => {
      const field = tab === 'passages' ? 'resultat' : 'statut';
      return d[field] === filters.statut;
    });
    if (filters.dateDebut) {
      const debut = new Date(filters.dateDebut).getTime();
      result = result.filter((d) => {
        const date = new Date(d.createdAt || d.horodatage || d.dateEmission).getTime();
        return date >= debut;
      });
    }
    if (filters.dateFin) {
      const fin = new Date(filters.dateFin);
      fin.setHours(23, 59, 59);
      result = result.filter((d) => {
        const date = new Date(d.createdAt || d.horodatage || d.dateEmission).getTime();
        return date <= fin.getTime();
      });
    }
    setFilteredData(result);
  }, [data, filters, tab]);

  const handleTabChange = (t) => {
    setTab(t);
    setPage(0);
    setFilters({ direction: '', employe: '', zone: '', dateDebut: '', dateFin: '', statut: '' });
  };

  const statutBadge = (statut) => {
    const active = ['ACTIF', 'VALIDEE', 'AUTORISE'];
    const danger = ['REVOQUE', 'REFUSEE_N1', 'REFUSEE_N2', 'REFUSE', 'SUSPENDU'];
    return active.includes(statut) ? 'default' : danger.includes(statut) ? 'destructive' : 'secondary';
  };

  const statutOptions = {
    demandes: ['EN_ATTENTE_N1', 'EN_ATTENTE_N2', 'VALIDEE', 'REFUSEE_N1', 'REFUSEE_N2'],
    badges: ['ACTIF', 'SUSPENDU', 'REVOQUE', 'EXPIRE'],
    passages: ['AUTORISE', 'REFUSE'],
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Consultation globale</h1>
        <p className="text-sm text-muted-foreground mt-1">Consultez l'ensemble des donnees du systeme</p>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className="flex border-b mb-4">
            {['demandes', 'badges', 'passages'].map((t) => (
              <button
                key={t}
                onClick={() => handleTabChange(t)}
                className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  tab === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {t === 'demandes' ? 'Demandes' : t === 'badges' ? 'Badges' : 'Passages'}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            <div className="relative flex-1 min-w-[140px]">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Direction..."
                value={filters.direction}
                onChange={(e) => setFilters({ ...filters, direction: e.target.value })}
                className="pl-8 text-sm h-9"
              />
            </div>
            <Input
              placeholder="Employe..."
              value={filters.employe}
              onChange={(e) => setFilters({ ...filters, employe: e.target.value })}
              className="w-[160px] text-sm h-9"
            />
            {tab === 'passages' && (
              <Input
                placeholder="Zone..."
                value={filters.zone}
                onChange={(e) => setFilters({ ...filters, zone: e.target.value })}
                className="w-[140px] text-sm h-9"
              />
            )}
            <select
              value={filters.statut}
              onChange={(e) => setFilters({ ...filters, statut: e.target.value })}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Tous les statuts</option>
              {(statutOptions[tab] || []).map((s) => (<option key={s} value={s}>{s}</option>))}
            </select>
            <input
              type="date"
              value={filters.dateDebut}
              onChange={(e) => setFilters({ ...filters, dateDebut: e.target.value })}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            />
            <input
              type="date"
              value={filters.dateFin}
              onChange={(e) => setFilters({ ...filters, dateFin: e.target.value })}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            />
          </div>

          {error && <div className="text-destructive bg-destructive/10 p-3 rounded-md mb-4 text-sm">{error}</div>}

          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">Chargement...</div>
          ) : filteredData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Globe className="size-12 mb-3 text-muted-foreground/50" />
              <p className="text-sm">Aucune donnee</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {tab === 'demandes' && (
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-sm text-muted-foreground">
                      <th className="pb-3 font-medium">Employe</th>
                      <th className="pb-3 font-medium">Direction</th>
                      <th className="pb-3 font-medium">Statut</th>
                      <th className="pb-3 font-medium">Date</th>
                      <th className="pb-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((d) => (
                      <tr key={d.id} className="border-b last:border-0">
                        <td className="py-3 text-sm">{d.employePrenom} {d.employeNom}</td>
                        <td className="py-3 text-sm">{d.directionNom}</td>
                        <td className="py-3"><Badge variant={statutBadge(d.statut)} className="text-xs">{d.statut}</Badge></td>
                        <td className="py-3 text-sm">{new Date(d.createdAt).toLocaleDateString()}</td>
                        <td className="py-3">
                          <Button variant="outline" size="sm" onClick={() => setDetail({ type: 'demande', data: d })}>
                            <Eye className="size-3.5 mr-1" />Voir
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {tab === 'badges' && (
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-sm text-muted-foreground">
                      <th className="pb-3 font-medium">UID</th>
                      <th className="pb-3 font-medium">Employe</th>
                      <th className="pb-3 font-medium">Statut</th>
                      <th className="pb-3 font-medium">Emission</th>
                      <th className="pb-3 font-medium">Expiration</th>
                      <th className="pb-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((b) => (
                      <tr key={b.id} className="border-b last:border-0">
                        <td className="py-3 text-sm font-mono text-xs">{b.uidUnique}</td>
                        <td className="py-3 text-sm">{b.employePrenom} {b.employeNom}</td>
                        <td className="py-3"><Badge variant={statutBadge(b.statut)} className="text-xs">{b.statut}</Badge></td>
                        <td className="py-3 text-sm">{b.dateEmission ? new Date(b.dateEmission).toLocaleDateString() : '-'}</td>
                        <td className="py-3 text-sm">{b.dateExpiration ? new Date(b.dateExpiration).toLocaleDateString() : '-'}</td>
                        <td className="py-3">
                          <Button variant="outline" size="sm" onClick={() => setDetail({ type: 'badge', data: b })}>
                            <Eye className="size-3.5 mr-1" />Voir
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {tab === 'passages' && (
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-sm text-muted-foreground">
                      <th className="pb-3 font-medium">UID Badge</th>
                      <th className="pb-3 font-medium">Employe</th>
                      <th className="pb-3 font-medium">Direction</th>
                      <th className="pb-3 font-medium">Zone</th>
                      <th className="pb-3 font-medium">Resultat</th>
                      <th className="pb-3 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((p) => (
                      <tr key={p.id} className="border-b last:border-0">
                        <td className="py-3 text-sm font-mono text-xs">{p.uidBadge}</td>
                        <td className="py-3 text-sm">{p.employeNom}</td>
                        <td className="py-3 text-sm">{p.directionNom}</td>
                        <td className="py-3 text-sm">{p.zoneNom}</td>
                        <td className="py-3"><Badge variant={statutBadge(p.resultat)} className="text-xs">{p.resultat}</Badge></td>
                        <td className="py-3 text-sm text-muted-foreground">{new Date(p.horodatage).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {detail?.type === 'demande' && `Demande #${detail.data.id}`}
              {detail?.type === 'badge' && `Badge #${detail.data.id}`}
              {detail?.type === 'passage' && `Passage #${detail.data.id}`}
            </DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-3 py-2">
              {detail.type === 'demande' && (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="col-span-2"><span className="text-muted-foreground">Employe :</span> <span className="font-medium">{detail.data.employePrenom} {detail.data.employeNom}</span></div>
                  <div className="col-span-2"><span className="text-muted-foreground">Email :</span> <span className="font-medium">{detail.data.employeEmail}</span></div>
                  <div><span className="text-muted-foreground">Direction :</span> <span className="font-medium">{detail.data.directionNom}</span></div>
                  <div><span className="text-muted-foreground">Statut :</span> <Badge variant={statutBadge(detail.data.statut)} className="text-xs">{detail.data.statut}</Badge></div>
                  <div className="col-span-2"><span className="text-muted-foreground">Date :</span> <span className="font-medium">{new Date(detail.data.createdAt).toLocaleString()}</span></div>
                  {detail.data.motifRefus && <div className="col-span-2"><span className="text-muted-foreground">Motif refus :</span> <span className="font-medium">{detail.data.motifRefus}</span></div>}
                </div>
              )}
              {detail.type === 'badge' && (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-muted-foreground">UID :</span> <span className="font-medium font-mono text-xs">{detail.data.uidUnique}</span></div>
                  <div><span className="text-muted-foreground">Statut :</span> <Badge variant={statutBadge(detail.data.statut)} className="text-xs">{detail.data.statut}</Badge></div>
                  <div className="col-span-2"><span className="text-muted-foreground">Employe :</span> <span className="font-medium">{detail.data.employePrenom} {detail.data.employeNom}</span></div>
                  <div><span className="text-muted-foreground">Emission :</span> <span className="font-medium">{detail.data.dateEmission ? new Date(detail.data.dateEmission).toLocaleDateString() : '-'}</span></div>
                  <div><span className="text-muted-foreground">Expiration :</span> <span className="font-medium">{detail.data.dateExpiration ? new Date(detail.data.dateExpiration).toLocaleDateString() : '-'}</span></div>
                </div>
              )}
              {detail.type === 'passage' && (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="col-span-2"><span className="text-muted-foreground">UID Badge :</span> <span className="font-medium font-mono text-xs">{detail.data.uidBadge}</span></div>
                  <div><span className="text-muted-foreground">Employe :</span> <span className="font-medium">{detail.data.employeNom}</span></div>
                  <div><span className="text-muted-foreground">Direction :</span> <span className="font-medium">{detail.data.directionNom}</span></div>
                  <div><span className="text-muted-foreground">Zone :</span> <span className="font-medium">{detail.data.zoneNom}</span></div>
                  <div><span className="text-muted-foreground">Resultat :</span> <Badge variant={statutBadge(detail.data.resultat)} className="text-xs">{detail.data.resultat}</Badge></div>
                  <div className="col-span-2"><span className="text-muted-foreground">Date :</span> <span className="font-medium">{new Date(detail.data.horodatage).toLocaleString()}</span></div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetail(null)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
