import { useState } from 'react';
import api from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Printer, History, TrendingUp } from 'lucide-react';

export default function Rapports() {
  const [debut, setDebut] = useState('');
  const [fin, setFin] = useState('');
  const [rapport, setRapport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setRapport(null);
    try {
      const params = {};
      if (debut) params.debut = debut;
      if (fin) params.fin = fin;
      const res = await api.get('/reports/audit', { params });
      setRapport(res.data.data);
      setHistory((prev) => [
        { date: new Date().toLocaleString(), debut, fin },
        ...prev.slice(0, 9),
      ]);
    } catch {
      setError('Erreur lors de la generation du rapport');
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (!rapport) return;
    const rows = [
      ['Metrique', 'Valeur'],
      ['Total badges', rapport.badges?.total || 0],
      ['Badges actifs', rapport.badges?.actifs || 0],
      ['Badges suspendus', rapport.badges?.suspendus || 0],
      ['Badges revoques', rapport.badges?.revoques || 0],
      ['Incidents en cours', rapport.incidentsEnCours || 0],
      ['Total passages', rapport.totalPassages || 0],
      ['Periode debut', rapport.periode?.debut || ''],
      ['Periode fin', rapport.periode?.fin || ''],
      ['Auteur', rapport.auteur || ''],
      ['Date generation', rapport.dateGeneration ? new Date(rapport.dateGeneration).toLocaleString() : ''],
    ];
    const csv = rows.map((r) => r.join(';')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    if (!rapport) return;
    const content = `
      <html><head><title>Rapport Audit – Royal Air Maroc</title>
      <style>body{font-family:Arial;padding:20px}h1{color:#1e40af}table{border-collapse:collapse;width:100%}td,th{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f3f4f6}</style>
      </head><body>
      <h1>Rapport d'audit – Royal Air Maroc</h1>
      <p><strong>Periode :</strong> ${rapport.periode?.debut || 'debut'} — ${rapport.periode?.fin || 'fin'}</p>
      <p><strong>Auteur :</strong> ${rapport.auteur || ''}</p>
      <p><strong>Genere le :</strong> ${rapport.dateGeneration ? new Date(rapport.dateGeneration).toLocaleString() : ''}</p>
      <table>
        <tr><th>Metrique</th><th>Valeur</th></tr>
        <tr><td>Total badges</td><td>${rapport.badges?.total || 0}</td></tr>
        <tr><td>Badges actifs</td><td>${rapport.badges?.actifs || 0}</td></tr>
        <tr><td>Badges suspendus</td><td>${rapport.badges?.suspendus || 0}</td></tr>
        <tr><td>Badges revoques</td><td>${rapport.badges?.revoques || 0}</td></tr>
        <tr><td>Incidents en cours</td><td>${rapport.incidentsEnCours || 0}</td></tr>
        <tr><td>Total passages</td><td>${rapport.totalPassages || 0}</td></tr>
      </table>
      </body></html>
    `;
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(content);
      win.document.close();
      win.print();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Rapports d'audit</h1>
        <p className="text-sm text-muted-foreground mt-1">Generation et export de rapports d'audit</p>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="size-4" />
            Generer un rapport
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Date debut</label>
                <input
                  type="datetime-local"
                  value={debut}
                  onChange={(e) => setDebut(e.target.value)}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Date fin</label>
                <input
                  type="datetime-local"
                  value={fin}
                  onChange={(e) => setFin(e.target.value)}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                />
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? 'Generation...' : 'Generer le rapport'}
              </Button>
            </div>
          </form>

          {error && <div className="text-destructive bg-destructive/10 p-3 rounded-md mt-4 text-sm">{error}</div>}

          {rapport && (
            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <Card className="border">
                  <CardContent className="p-3 text-center">
                    <p className="text-xs text-muted-foreground">Total badges</p>
                    <p className="text-2xl font-semibold">{rapport.badges?.total || 0}</p>
                  </CardContent>
                </Card>
                <Card className="border">
                  <CardContent className="p-3 text-center">
                    <p className="text-xs text-muted-foreground">Actifs</p>
                    <p className="text-2xl font-semibold text-green-600">{rapport.badges?.actifs || 0}</p>
                  </CardContent>
                </Card>
                <Card className="border">
                  <CardContent className="p-3 text-center">
                    <p className="text-xs text-muted-foreground">Suspendus</p>
                    <p className="text-2xl font-semibold text-amber-600">{rapport.badges?.suspendus || 0}</p>
                  </CardContent>
                </Card>
                <Card className="border">
                  <CardContent className="p-3 text-center">
                    <p className="text-xs text-muted-foreground">Revoques</p>
                    <p className="text-2xl font-semibold text-red-600">{rapport.badges?.revoques || 0}</p>
                  </CardContent>
                </Card>
                <Card className="border">
                  <CardContent className="p-3 text-center">
                    <p className="text-xs text-muted-foreground">Incidents</p>
                    <p className="text-2xl font-semibold text-amber-600">{rapport.incidentsEnCours || 0}</p>
                  </CardContent>
                </Card>
                <Card className="border">
                  <CardContent className="p-3 text-center">
                    <p className="text-xs text-muted-foreground">Passages</p>
                    <p className="text-2xl font-semibold">{rapport.totalPassages || 0}</p>
                  </CardContent>
                </Card>
              </div>

              <div className="text-sm text-muted-foreground space-y-1">
                <p><span className="font-medium text-foreground">Periode :</span> {rapport.periode?.debut || 'debut'} — {rapport.periode?.fin || 'fin'}</p>
                <p><span className="font-medium text-foreground">Auteur :</span> {rapport.auteur}</p>
                <p><span className="font-medium text-foreground">Genere le :</span> {rapport.dateGeneration ? new Date(rapport.dateGeneration).toLocaleString() : '-'}</p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={exportCSV}>
                  <Download className="size-4 mr-2" />
                  Exporter CSV
                </Button>
                <Button variant="outline" onClick={exportPDF}>
                  <Printer className="size-4 mr-2" />
                  Exporter PDF
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {history.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <History className="size-4" />
              Historique des exports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-muted-foreground">
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Periode debut</th>
                    <th className="pb-3 font-medium">Periode fin</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-3 text-sm">{h.date}</td>
                      <td className="py-3 text-sm">{h.debut || '-'}</td>
                      <td className="py-3 text-sm">{h.fin || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
