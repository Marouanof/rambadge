import { useState, useEffect } from 'react';
import api from '@/services/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Search, Users, Eye, X } from 'lucide-react';

const pastilleClass = (statut) => {
  const map = {
    ACTIF: 'bg-green-500',
    EN_ATTENTE: 'bg-orange-400',
    SUSPENDU: 'bg-red-500',
    INACTIF: 'bg-gray-400',
  };
  return map[statut] || 'bg-gray-400';
};

export default function EmployesDirection() {
  const [employes, setEmployes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState('');

  const fetchEmployes = async (p, s) => {
    setLoading(true);
    try {
      const params = { page: p, size: 10 };
      if (s) params.search = s;
      const res = await api.get('/managers/mes-employes', { params });
      setEmployes(res.data.data.content);
      setTotalPages(res.data.data.totalPages);
    } catch {
      setError('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEmployes(page, search); }, [page, search]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Employes de la direction</h1>
          <p className="text-sm text-muted-foreground mt-1">Liste des employes de votre direction</p>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, prenom ou email..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                className="pl-8"
              />
            </div>
          </div>

          {error && <div className="text-destructive bg-destructive/10 p-3 rounded-md mb-4 text-sm">{error}</div>}

          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">Chargement...</div>
          ) : employes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Users className="size-12 mb-3 text-muted-foreground/50" />
              <p className="text-sm">Aucun employe trouve</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-muted-foreground">
                    <th className="pb-3 font-medium w-4"></th>
                    <th className="pb-3 font-medium">Nom</th>
                    <th className="pb-3 font-medium">Prenom</th>
                    <th className="pb-3 font-medium">Email</th>
                    <th className="pb-3 font-medium">Matricule</th>
                    <th className="pb-3 font-medium">Zones habilitees</th>
                    <th className="pb-3 font-medium">Expiration badge</th>
                    <th className="pb-3 font-medium">Statut</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {employes.map((emp) => (
                    <tr key={emp.id} className="border-b last:border-0">
                      <td className="py-3">
                        <span className={`inline-block w-2.5 h-2.5 rounded-full ${pastilleClass(emp.statut)}`} />
                      </td>
                      <td className="py-3 text-sm">{emp.nom}</td>
                      <td className="py-3 text-sm">{emp.prenom}</td>
                      <td className="py-3 text-sm text-muted-foreground">{emp.email}</td>
                      <td className="py-3 text-sm">{emp.matricule}</td>
                      <td className="py-3 text-sm">{emp.zonesHabilitees?.map((z) => z.nom || z).join(', ') || '-'}</td>
                      <td className="py-3 text-sm">{emp.dateExpirationBadge ? new Date(emp.dateExpirationBadge).toLocaleDateString() : '-'}</td>
                      <td className="py-3">
                        <Badge variant={emp.statut === 'ACTIF' ? 'default' : 'secondary'} className="text-xs">
                          {emp.statut}
                        </Badge>
                      </td>
                      <td className="py-3">
                        <Button variant="outline" size="sm" onClick={() => setDetail(emp)}>
                          <Eye className="size-3.5 mr-1" />
                          Detail
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

      <Dialog open={!!detail} onOpenChange={(open) => { if (!open) setDetail(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{detail?.prenom} {detail?.nom}</DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-3 py-2">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Email :</span> <span className="font-medium">{detail.email}</span></div>
                <div><span className="text-muted-foreground">Matricule :</span> <span className="font-medium">{detail.matricule}</span></div>
                <div><span className="text-muted-foreground">Direction :</span> <span className="font-medium">{detail.directionNom || '-'}</span></div>
                <div><span className="text-muted-foreground">Statut :</span> <Badge variant={detail.statut === 'ACTIF' ? 'default' : 'secondary'} className="text-xs">{detail.statut}</Badge></div>
                <div className="col-span-2"><span className="text-muted-foreground">Expiration badge :</span> <span className="font-medium">{detail.dateExpirationBadge ? new Date(detail.dateExpirationBadge).toLocaleDateString() : '-'}</span></div>
              </div>
              {detail.zonesHabilitees && detail.zonesHabilitees.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Zones habilitees</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {detail.zonesHabilitees.map((z, i) => (
                      <Badge key={i} variant="outline" className="text-xs">{z.nom || z}</Badge>
                    ))}
                  </div>
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
