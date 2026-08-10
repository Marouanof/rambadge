import { useState, useEffect, useRef } from 'react';
import api from '@/services/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Globe, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

export default function ConsultationGlobale() {
  const [tab, setTab] = useState('demandes');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    direction: '', employe: '', zone: '', dateDebut: '', dateFin: '', statut: '',
  });
  const [directions, setDirections] = useState([]);
  const [zones, setZones] = useState([]);
  const fetchedRef = useRef(null);
  const requestRef = useRef(0);

  useEffect(() => {
    api.get('/directions', { params: { page: 0, size: 100 } })
      .then((res) => setDirections(res.data.data.content))
      .catch(() => {});
    api.get('/zones')
      .then((res) => setZones(res.data.data))
      .catch(() => {});
  }, []);

  const fetchData = async (t, p, f) => {
    const requestId = ++requestRef.current;
    setLoading(true);
    setError('');
    try {
      const params = { page: p, size: 10 };
      if (f.employe) params.search = f.employe;
      if (f.direction) params.direction = f.direction;
      if (f.zone) params.zone = f.zone;
      if (f.statut) params[t === 'passages' ? 'resultat' : 'statut'] = f.statut;
      if (f.dateDebut) params.dateDebut = f.dateDebut;
      if (f.dateFin) params.dateFin = f.dateFin;
      let res;
      if (t === 'demandes') res = await api.get('/demandes/toutes', { params });
      else if (t === 'badges') res = await api.get('/badges', { params });
      else if (t === 'passages') res = await api.get('/passages', { params });
      if (requestId !== requestRef.current) return;
      setData(res.data.data.content);
      setTotalPages(res.data.data.totalPages);
    } catch {
      if (requestId !== requestRef.current) return;
      setError('Erreur lors du chargement');
    } finally {
      if (requestId === requestRef.current) setLoading(false);
    }
  };

  useEffect(() => {
    const key = JSON.stringify({ tab, page, filters });
    if (key !== fetchedRef.current) {
      fetchedRef.current = key;
      fetchData(tab, page, filters);
    }
  }, [tab, page, filters]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(0);
  };

  const handleTabChange = (t) => {
    setTab(t);
    setPage(0);
    setFilters({ direction: '', employe: '', zone: '', dateDebut: '', dateFin: '', statut: '' });
    fetchedRef.current = null;
  };

  const statutStyle = (statut) => {
    const green = ['ACTIF', 'VALIDEE', 'AUTORISE'];
    const red = ['REVOQUE', 'REFUSEE_N1', 'REFUSEE_N2', 'REFUSE'];
    const gold = ['SUSPENDU', 'EN_ATTENTE_N1', 'EN_ATTENTE_N2'];
    if (green.includes(statut)) return { backgroundColor: '#008B60', color: '#fff' };
    if (red.includes(statut)) return { backgroundColor: '#C20831', color: '#fff' };
    if (gold.includes(statut)) return { backgroundColor: '#F1BE5B', color: '#5C4A00' };
    return { backgroundColor: '#674459', color: '#fff' };
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

          <div className="flex flex-wrap items-center gap-2 mb-4">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="UID , EMPLOYE ..."
                value={filters.employe}
                onChange={(e) => handleFilterChange('employe', e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="relative shrink-0">
              <select
                value={filters.direction}
                onChange={(e) => handleFilterChange('direction', e.target.value)}
                className="h-8 appearance-none rounded-md border border-input bg-background pl-3 pr-8 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Toutes les directions</option>
                {directions.map((d) => (<option key={d.id} value={d.nom}>{d.nom}</option>))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            </div>
            {tab === 'passages' && (
              <div className="relative shrink-0">
                <select
                  value={filters.zone}
                  onChange={(e) => handleFilterChange('zone', e.target.value)}
                  className="h-8 appearance-none rounded-md border border-input bg-background pl-3 pr-8 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Toutes les zones</option>
                  {zones.map((z) => (<option key={z.id} value={z.nom}>{z.nom}</option>))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              </div>
            )}
            <div className="relative shrink-0">
              <select
                value={filters.statut}
                onChange={(e) => handleFilterChange('statut', e.target.value)}
                className="h-8 appearance-none rounded-md border border-input bg-background pl-3 pr-8 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Tous les statuts</option>
                {(statutOptions[tab] || []).map((s) => (<option key={s} value={s}>{s}</option>))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            </div>
            <input
              type="date"
              value={filters.dateDebut}
              onChange={(e) => handleFilterChange('dateDebut', e.target.value)}
              className="h-8 rounded-md border border-input bg-background px-3 text-sm"
            />
            <input
              type="date"
              value={filters.dateFin}
              onChange={(e) => handleFilterChange('dateFin', e.target.value)}
              className="h-8 rounded-md border border-input bg-background px-3 text-sm"
            />
          </div>

          {error && <div className="text-destructive bg-destructive/10 p-3 rounded-md mb-4 text-sm">{error}</div>}

          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">Chargement...</div>
          ) : data.length === 0 ? (
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
                      <th className="pb-3 font-medium">Email</th>
                      <th className="pb-3 font-medium">Direction</th>
                      <th className="pb-3 font-medium">Statut</th>
                      <th className="pb-3 font-medium">Motif</th>
                      <th className="pb-3 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((d) => (
                      <tr key={d.id} className="border-b last:border-0">
                        <td className="py-3 text-sm">{d.employePrenom} {d.employeNom}</td>
                        <td className="py-3 text-sm">{d.employeEmail}</td>
                        <td className="py-3 text-sm">{d.directionNom}</td>
                        <td className="py-3"><Badge className="text-xs" style={statutStyle(d.statut)}>{d.statut}</Badge></td>
                        <td className="py-3 text-sm text-muted-foreground">{d.motifRefus || '—'}</td>
                        <td className="py-3 text-sm">{new Date(d.createdAt).toLocaleDateString()}</td>
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
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((b) => (
                      <tr key={b.id} className="border-b last:border-0">
                        <td className="py-3 text-sm font-mono text-xs">{b.uidUnique}</td>
                        <td className="py-3 text-sm">{b.employePrenom} {b.employeNom}</td>
                        <td className="py-3"><Badge className="text-xs" style={statutStyle(b.statut)}>{b.statut}</Badge></td>
                        <td className="py-3 text-sm">{b.dateEmission ? new Date(b.dateEmission).toLocaleDateString() : '-'}</td>
                        <td className="py-3 text-sm">{b.dateExpiration ? new Date(b.dateExpiration).toLocaleDateString() : '-'}</td>
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
                    {data.map((p) => (
                      <tr key={p.id} className="border-b last:border-0">
                        <td className="py-3 text-sm font-mono text-xs">{p.uidBadge}</td>
                        <td className="py-3 text-sm">{p.employeNom}</td>
                        <td className="py-3 text-sm">{p.directionNom}</td>
                        <td className="py-3 text-sm">{p.zoneNom}</td>
                        <td className="py-3"><Badge className="text-xs" style={statutStyle(p.resultat)}>{p.resultat}</Badge></td>
                        <td className="py-3 text-sm text-muted-foreground">{new Date(p.horodatage).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          <div className="flex items-center justify-center gap-3 mt-4">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" disabled={page === 0} onClick={() => setPage(page - 1)} aria-label="Page précédente">
                <ChevronLeft className="size-4" />
              </Button>
              <span className="text-sm text-muted-foreground">{totalPages > 0 ? page + 1 : 0} / {totalPages}</span>
              <Button variant="outline" size="icon" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)} aria-label="Page suivante">
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
