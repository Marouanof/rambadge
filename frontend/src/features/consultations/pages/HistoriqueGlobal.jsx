import { useState, useEffect } from 'react';
import api from '@/services/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Globe, RotateCcw } from 'lucide-react';

export default function HistoriqueGlobal() {
  const [passages, setPassages] = useState([]);
  const [filteredPassages, setFilteredPassages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [filterZone, setFilterZone] = useState('');
  const [filterDirection, setFilterDirection] = useState('');
  const [filterEmploye, setFilterEmploye] = useState('');
  const [filterResultat, setFilterResultat] = useState('');
  const [filterDebut, setFilterDebut] = useState('');
  const [filterFin, setFilterFin] = useState('');
  const [error, setError] = useState('');

  const fetchPassages = async (p) => {
    setLoading(true);
    try {
      const params = { page: p, size: 50 };
      if (filterZone) params.zoneId = filterZone;
      const res = await api.get('/passages', { params });
      const all = res.data.data.content;
      setPassages(all);
      setTotalPages(res.data.data.totalPages);
    } catch {
      setError('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPassages(page); }, [page, filterZone]);

  useEffect(() => {
    let result = [...passages];
    if (filterDirection) result = result.filter((p) => p.directionNom?.toLowerCase().includes(filterDirection.toLowerCase()));
    if (filterEmploye) result = result.filter((p) => p.employeNom?.toLowerCase().includes(filterEmploye.toLowerCase()));
    if (filterResultat) result = result.filter((p) => p.resultat === filterResultat);
    if (filterDebut) result = result.filter((p) => new Date(p.horodatage).getTime() >= new Date(filterDebut).getTime());
    if (filterFin) {
      const fin = new Date(filterFin);
      fin.setHours(23, 59, 59);
      result = result.filter((p) => new Date(p.horodatage).getTime() <= fin.getTime());
    }
    setFilteredPassages(result);
  }, [passages, filterDirection, filterEmploye, filterResultat, filterDebut, filterFin]);

  const resetFilters = () => {
    setFilterDirection('');
    setFilterEmploye('');
    setFilterResultat('');
    setFilterDebut('');
    setFilterFin('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Historique global</h1>
        <p className="text-sm text-muted-foreground mt-1">Consultez l'ensemble des passages</p>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-end gap-3 mb-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Direction</label>
              <input
                type="text"
                placeholder="Filtrer par direction"
                value={filterDirection}
                onChange={(e) => setFilterDirection(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm w-[160px]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Employe</label>
              <input
                type="text"
                placeholder="Filtrer par employe"
                value={filterEmploye}
                onChange={(e) => setFilterEmploye(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm w-[160px]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Resultat</label>
              <select
                value={filterResultat}
                onChange={(e) => setFilterResultat(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Tous</option>
                <option value="AUTORISE">Autorise</option>
                <option value="REFUSE">Refuse</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Date debut</label>
              <input
                type="date"
                value={filterDebut}
                onChange={(e) => setFilterDebut(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Date fin</label>
              <input
                type="date"
                value={filterFin}
                onChange={(e) => setFilterFin(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              />
            </div>
            <Button variant="outline" size="sm" onClick={resetFilters}>
              <RotateCcw className="size-3.5 mr-1" />
              Reinitialiser
            </Button>
          </div>

          {error && <div className="text-destructive bg-destructive/10 p-3 rounded-md mb-4 text-sm">{error}</div>}

          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">Chargement...</div>
          ) : filteredPassages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Globe className="size-12 mb-3 text-muted-foreground/50" />
              <p className="text-sm">Aucun passage trouve</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-3">{filteredPassages.length} passage(s) affiche(s)</p>
              <div className="overflow-x-auto">
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
                    {filteredPassages.map((p) => (
                      <tr key={p.id} className="border-b last:border-0">
                        <td className="py-3 text-sm font-mono text-xs">{p.uidBadge}</td>
                        <td className="py-3 text-sm">{p.employeNom}</td>
                        <td className="py-3 text-sm">{p.directionNom}</td>
                        <td className="py-3 text-sm">{p.zoneNom}</td>
                        <td className="py-3">
                          <Badge variant={p.resultat === 'AUTORISE' ? 'default' : 'destructive'} className="text-xs">
                            {p.resultat}
                          </Badge>
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
    </div>
  );
}
