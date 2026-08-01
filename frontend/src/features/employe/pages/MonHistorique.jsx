import { useState, useEffect } from 'react';
import api from '@/services/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { History, RotateCcw } from 'lucide-react';

export default function MonHistorique() {
  const [passages, setPassages] = useState([]);
  const [filteredPassages, setFilteredPassages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [filterResultat, setFilterResultat] = useState('');
  const [filterDebut, setFilterDebut] = useState('');
  const [filterFin, setFilterFin] = useState('');
  const [error, setError] = useState('');

  const fetchPassages = async (p) => {
    setLoading(true);
    try {
      const res = await api.get('/passages/personal', { params: { page: p, size: 50 } });
      setPassages(res.data.data.content);
      setTotalPages(res.data.data.totalPages);
    } catch {
      setError('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPassages(page); }, [page]);

  useEffect(() => {
    let result = [...passages];
    if (filterResultat) result = result.filter((p) => p.resultat === filterResultat);
    if (filterDebut) result = result.filter((p) => new Date(p.horodatage).getTime() >= new Date(filterDebut).getTime());
    if (filterFin) {
      const fin = new Date(filterFin);
      fin.setHours(23, 59, 59);
      result = result.filter((p) => new Date(p.horodatage).getTime() <= fin.getTime());
    }
    setFilteredPassages(result);
  }, [passages, filterResultat, filterDebut, filterFin]);

  const resetFilters = () => {
    setFilterResultat('');
    setFilterDebut('');
    setFilterFin('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Mon historique de passages</h1>
        <p className="text-sm text-muted-foreground mt-1">Consultez vos passages enregistres</p>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-end gap-3 mb-4">
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
              <History className="size-12 mb-3 text-muted-foreground/50" />
              <p className="text-sm">Aucun passage enregistre</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-3">{filteredPassages.length} passage(s) affiche(s)</p>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-sm text-muted-foreground">
                      <th className="pb-3 font-medium">Zone</th>
                      <th className="pb-3 font-medium">Resultat</th>
                      <th className="pb-3 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPassages.map((p) => (
                      <tr key={p.id} className="border-b last:border-0">
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
