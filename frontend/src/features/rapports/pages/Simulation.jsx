import { useState, useEffect } from 'react';
import api from '@/services/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Play, CheckCircle2, XCircle } from 'lucide-react';

export default function Simulation() {
  const [zones, setZones] = useState([]);
  const [uidBadge, setUidBadge] = useState('');
  const [zoneId, setZoneId] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/zones').then((res) => setZones(res.data.data)).catch(() => {});
  }, []);

  const handleSimulate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await api.post('/passages/simulate', {
        uidBadge,
        zoneId: parseInt(zoneId, 10),
      });
      setResult(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la simulation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Simulation de passage</h1>
          <p className="text-sm text-muted-foreground mt-1">Simuler un passage de badge sur une zone</p>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-6">
          <form onSubmit={handleSimulate} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">UID du badge</label>
                <Input
                  value={uidBadge}
                  onChange={(e) => setUidBadge(e.target.value)}
                  placeholder="A1:B2:C3:D4"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Zone</label>
                <select
                  value={zoneId}
                  onChange={(e) => setZoneId(e.target.value)}
                  required
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Selectionner une zone</option>
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>{z.nom}</option>
                  ))}
                </select>
              </div>
            </div>
            <Button type="submit" disabled={loading}>
              <Play className="size-4 mr-2" />
              {loading ? 'Simulation...' : 'Simuler le passage'}
            </Button>
          </form>

          {error && <div className="text-destructive bg-destructive/10 p-3 rounded-md mt-4 text-sm">{error}</div>}

          {result && (
            <Card className={`mt-6 border-2 ${result.autorise ? 'border-[#008B60]/40' : 'border-[#C20831]/40'}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  {result.autorise ? (
                    <CheckCircle2 className="size-8 text-[#008B60]" />
                  ) : (
                    <XCircle className="size-8 text-[#C20831]" />
                  )}
                  <div>
                    <h3 className="text-lg font-semibold">{result.autorise ? 'Autorise' : 'Refuse'}</h3>
                    <p className="text-sm text-muted-foreground">Resultat de la simulation</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-muted-foreground">UID Badge :</span> <span className="font-medium">{result.uidBadge}</span></div>
                  <div><span className="text-muted-foreground">Zone :</span> <span className="font-medium">{result.zoneNom}</span></div>
                  {!result.autorise && result.motif && (
                    <div className="col-span-2"><span className="text-muted-foreground">Motif :</span> <span className="font-medium text-destructive">{result.motif}</span></div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
