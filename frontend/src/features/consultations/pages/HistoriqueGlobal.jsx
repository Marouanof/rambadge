import { useState, useEffect } from 'react';
import api from '@/services/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Globe, Search, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

const resultatLabel = (r) => (r === 'AUTORISE' ? 'Autorisé' : r === 'REFUSE' ? 'Refusé' : r);

export default function HistoriqueGlobal() {
  const [passages, setPassages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [zoneId, setZoneId] = useState('');
  const [direction, setDirection] = useState('');
  const [resultat, setResultat] = useState('');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [zones, setZones] = useState([]);
  const [directions, setDirections] = useState([]);
  const [error, setError] = useState('');

  const fetchPassages = async (p) => {
    setLoading(true);
    try {
      const params = { page: p, size: 10 };
      if (search) params.search = search;
      if (zoneId) params.zoneId = zoneId;
      if (direction) params.direction = direction;
      if (resultat) params.resultat = resultat;
      if (dateDebut) params.dateDebut = dateDebut;
      if (dateFin) params.dateFin = dateFin;
      const res = await api.get('/passages', { params });
      setPassages(res.data.data.content);
      setTotalPages(res.data.data.totalPages);
      setTotalElements(res.data.data.totalElements);
    } catch {
      setError('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPassages(page); }, [page, search, zoneId, direction, resultat, dateDebut, dateFin]);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(0);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    api.get('/zones')
      .then((res) => setZones(res.data.data || []))
      .catch(() => {});
    api.get('/directions', { params: { page: 0, size: 100 } })
      .then((res) => setDirections(res.data.data.content || []))
      .catch(() => {});
  }, []);

  const resetFilters = () => {
    setSearchInput('');
    setSearch('');
    setZoneId('');
    setDirection('');
    setResultat('');
    setDateDebut('');
    setDateFin('');
    setPage(0);
  };

  const selectCls = 'h-9 rounded-md border border-input bg-background px-3 text-sm';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Historique global</h1>
        <p className="text-sm text-muted-foreground mt-1">Consultez l'ensemble des passages</p>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-end gap-3 mb-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">Recherche</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="UID badge, nom, email..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="h-9 rounded-md border border-input bg-background pl-8 pr-3 text-sm w-[200px]"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">Direction</label>
              <div className="relative">
                <select value={direction} onChange={(e) => { setDirection(e.target.value); setPage(0); }} className={`${selectCls} appearance-none pr-8 w-[160px]`}>
                  <option value="">Toutes</option>
                  {directions.map((d) => (
                    <option key={d.id} value={d.nom}>{d.nom}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">Zone</label>
              <div className="relative">
                <select value={zoneId} onChange={(e) => { setZoneId(e.target.value); setPage(0); }} className={`${selectCls} appearance-none pr-8 w-[160px]`}>
                  <option value="">Toutes</option>
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>{z.nom}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">Résultat</label>
              <div className="relative">
                <select value={resultat} onChange={(e) => { setResultat(e.target.value); setPage(0); }} className={`${selectCls} appearance-none pr-8 w-[160px]`}>
                  <option value="">Tous</option>
                  <option value="AUTORISE">Autorisé</option>
                  <option value="REFUSE">Refusé</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">Date de début</label>
              <input type="date" value={dateDebut} onChange={(e) => { setDateDebut(e.target.value); setPage(0); }} className="h-9 rounded-md border border-input bg-background px-3 text-sm w-[160px]" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">Date de fin</label>
              <input type="date" value={dateFin} onChange={(e) => { setDateFin(e.target.value); setPage(0); }} className="h-9 rounded-md border border-input bg-background px-3 text-sm w-[160px]" />
            </div>
          </div>

          {error && <div className="text-destructive bg-destructive/10 p-3 rounded-md mb-4 text-sm">{error}</div>}

          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">Chargement...</div>
          ) : passages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Globe className="size-12 mb-3 text-muted-foreground/50" />
              <p className="text-sm">Aucun passage trouvé</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-3">{totalElements} passage(s) au total</p>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-sm text-muted-foreground">
                      <th className="pb-3 font-medium">UID Badge</th>
                      <th className="pb-3 font-medium">Employé</th>
                      <th className="pb-3 font-medium">Direction</th>
                      <th className="pb-3 font-medium">Zone</th>
                      <th className="pb-3 font-medium">Résultat</th>
                      <th className="pb-3 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {passages.map((p) => (
                      <tr key={p.id} className="border-b last:border-0">
                        <td className="py-3 text-sm font-mono text-xs">{p.uidBadge}</td>
                        <td className="py-3 text-sm">{p.employeNom}</td>
                        <td className="py-3 text-sm">{p.directionNom}</td>
                        <td className="py-3 text-sm">{p.zoneNom}</td>
                        <td className="py-3">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${p.resultat === 'AUTORISE' ? 'bg-[#008B60]/10 text-[#008B60]' : 'bg-[#C20831]/10 text-[#C20831]'}`}>
                            {resultatLabel(p.resultat)}
                          </span>
                        </td>
                        <td className="py-3 text-sm text-muted-foreground">{new Date(p.horodatage).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-4">
              <Button variant="outline" size="icon" disabled={page === 0} onClick={() => setPage(page - 1)} aria-label="Page precedente">
                <ChevronLeft className="size-4" />
              </Button>
              <span className="text-sm text-muted-foreground">{page + 1} / {totalPages}</span>
              <Button variant="outline" size="icon" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)} aria-label="Page suivante">
                <ChevronRight className="size-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
