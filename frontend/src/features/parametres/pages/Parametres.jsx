import { useState, useEffect } from 'react';
import api from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Save, KeyRound, User, Globe, Bell, Eye, EyeOff } from 'lucide-react';

export default function Parametres() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [langue, setLangue] = useState('fr');
  const [notifEmail, setNotifEmail] = useState(true);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwSuccess, setPwSuccess] = useState('');

  useEffect(() => {
    api.get('/auth/me')
      .then((res) => setUser(res.data.data))
      .catch(() => setError('Erreur lors du chargement du profil'))
      .finally(() => setLoading(false));
  }, []);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');
    if (newPassword !== confirmPassword) {
      setPwError('Les mots de passe ne correspondent pas');
      return;
    }
    if (newPassword.length < 6) {
      setPwError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    setPwLoading(true);
    try {
      await api.post('/auth/reset-password', { email: user.email, nouveauMotDePasse: newPassword });
      setPwSuccess('Mot de passe modifié avec succès');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => { setPasswordOpen(false); setPwSuccess(''); }, 1500);
    } catch (err) {
      setPwError(err.response?.data?.message || 'Erreur lors du changement de mot de passe');
    } finally {
      setPwLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    setSuccess('');
    setError('');
    try {
      await api.put('/auth/preferences', { langue, notifEmail });
      setSuccess('Preferences sauvegardees');
    } catch {
      setError('Erreur lors de la sauvegarde');
    }
  };

  if (loading) return <div className="flex items-center justify-center py-12 text-muted-foreground">Chargement...</div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Parametres</h1>
        <p className="text-sm text-muted-foreground mt-1">Vos parametres et preferences</p>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="size-4" />
            Informations du profil
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <div><span className="text-muted-foreground">Nom :</span> <span className="font-medium">{user?.prenom} {user?.nom}</span></div>
            <div><span className="text-muted-foreground">Email :</span> <span className="font-medium">{user?.email}</span></div>
            <div><span className="text-muted-foreground">Role :</span> <span className="font-medium">{user?.role?.replace('_', ' ')}</span></div>
            {user?.poste && <div><span className="text-muted-foreground">Poste :</span> <span className="font-medium">{user.poste}</span></div>}
            {user?.directionNom && <div><span className="text-muted-foreground">Direction :</span> <span className="font-medium">{user.directionNom}</span></div>}
          </div>
          <Separator className="my-3" />
          <Dialog open={passwordOpen} onOpenChange={(o) => { setPasswordOpen(o); if (!o) { setPwError(''); setPwSuccess(''); setNewPassword(''); setConfirmPassword(''); } }}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <KeyRound className="size-4 mr-2" />
                Changer le mot de passe
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px]">
              <DialogHeader>
                <DialogTitle>Changer le mot de passe</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">Nouveau mot de passe</Label>
                  <div className="relative">
                    <Input id="new-password" type={showNew ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
                    <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                      {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
                  <div className="relative">
                    <Input id="confirm-password" type={showConfirm ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                      {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>
                {pwError && <div className="text-destructive bg-destructive/10 p-3 rounded-md text-sm">{pwError}</div>}
                {pwSuccess && <div className="text-green-700 bg-green-100 p-3 rounded-md text-sm">{pwSuccess}</div>}
                <Button type="submit" className="w-full" disabled={pwLoading}>
                  {pwLoading ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Globe className="size-4" />
            Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Langue</Label>
            <select
              value={langue}
              onChange={(e) => setLangue(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="fr">Francais</option>
              <option value="en">English</option>
            </select>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={notifEmail}
              onChange={(e) => setNotifEmail(e.target.checked)}
              className="size-4 rounded border-gray-300"
            />
            <span className="text-sm flex items-center gap-1.5">
              <Bell className="size-3.5 text-muted-foreground" />
              Recevoir les notifications par email
            </span>
          </label>

          {success && <div className="text-green-700 bg-green-100 p-3 rounded-md text-sm">{success}</div>}
          {error && <div className="text-destructive bg-destructive/10 p-3 rounded-md text-sm">{error}</div>}

          <Button onClick={handleSavePreferences}>
            <Save className="size-4 mr-2" />
            Enregistrer
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
