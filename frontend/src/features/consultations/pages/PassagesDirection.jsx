import { useState, useEffect, useRef } from 'react';
import api from '@/services/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, ArrowRightLeft, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

const resultatStyle = (resultat) => {
  if (resultat === 'AUTORISE') return { backgroundColor: '#008B60', color: '#fff' };
  if (resultat === 'REFUSE') return { backgroundColor: '#C20831', color: '#fff' };
  return { backgroundColor: '#674459', color: '#fff' };
};

export default function PassagesDirection() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [error, setError] = useState('');
  const [zones, setZones] = useState([]);
  const [filters, setFilters] = useState({
    employe: '', zoneId: '', resultat: '', dateDebut: '', dateFin: '',
  });
  const fetchedRef = useRef(null);
  const requestRef = useRef(0);

  const fetchData = async (p, f) => {
    const requestId = ++requestRef.current;
    setLoading(true);
    setError('');
    try {
      const params = { page: p, size: 10 };
      if (f.employe) params.search = f.employe;
      if (f.zoneId) params.zoneId = f.zoneId;
      if (f.resultat) params.resultat = f.resultat;
      if (f.dateDebut) params.dateDebut = f.dateDebut;
      if (f.dateFin) params.dateFin = f.dateFin;
      const res = await api.get('/passages', { params });
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
    const key = JSON.stringify({ page, filters });
    if (key !== fetchedRef.current) {
      fetchedRef.current = key;
      fetchData(page, filters);
    }
  }, [page, filters]);

  useEffect(() => {
    api.get('/zones').then((res) => setZones(res.data.data)).catch(() => {});
  }, []);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(0);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Passages de la direction</h1>
        <p className="text-sm text-muted-foreground mt-1">Historique des accès des employés de votre direction</p>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Employé, matricule ou UID..."
                value={filters.employe}
                onChange={(e) => handleFilterChange('employe', e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="relative shrink-0">
              <select
                value={filters.zoneId}
                onChange={(e) => handleFilterChange('zoneId', e.target.value)}
                className="h-8 appearance-none rounded-md border border-input bg-background pl-3 pr-8 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Toutes les zones</option>
                {zones.map((z) => (<option key={z.id} value={z.id}>{z.nom}</option>))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            </div>
            <div className="relative shrink-0">
              <select
                value={filters.resultat}
                onChange={(e) => handleFilterChange('resultat', e.target.value)}
                className="h-8 appearance-none rounded-md border border-input bg-background pl-3 pr-8 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Tous les resultats</option>
                <option value="AUTORISE">AUTORISE</option>
                <option value="REFUSE">REFUSE</option>
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
              <ArrowRightLeft className="size-12 mb-3 text-muted-foreground/50" />
              <p className="text-sm">Aucun passage</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-muted-foreground">
                    <th className="pb-3 font-medium">UID Badge</th>
                    <th className="pb-3 font-medium">Employe</th>
                    <th className="pb-3 font-medium">Matricule</th>
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
                      <td className="py-3 text-sm">{p.employeMatricule || '-'}</td>
                      <td className="py-3 text-sm">{p.zoneNom}</td>
                      <td className="py-3"><Badge className="text-xs" style={resultatStyle(p.resultat)}>{p.resultat}</Badge></td>
                      <td className="py-3 text-sm text-muted-foreground">{new Date(p.horodatage).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
