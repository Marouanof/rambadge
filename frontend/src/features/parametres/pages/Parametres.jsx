import { useState, useEffect } from 'react';
import api from '@/services/api';
import { useSession } from '@/context/SessionContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Save, KeyRound, User, Globe, Eye, EyeOff, Camera, Loader2 } from 'lucide-react';

const THEME_OPTIONS = [
  { value: 'LIGHT', label: 'Clair' },
  { value: 'DARK', label: 'Sombre' },
  { value: 'SYSTEM', label: 'Système' },
];

export default function Parametres() {
  const { user, preferences, updatePreferences, updateProfile } = useSession();

  const [form, setForm] = useState({ nom: '', prenom: '', poste: '' });
  const [theme, setTheme] = useState('LIGHT');

  const [savingProfile, setSavingProfile] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);

  const [profileMsg, setProfileMsg] = useState('');
  const [profileError, setProfileError] = useState('');
  const [prefsMsg, setPrefsMsg] = useState('');
  const [prefsError, setPrefsError] = useState('');

  const [passwordOpen, setPasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwSuccess, setPwSuccess] = useState('');

  useEffect(() => {
    if (user) setForm({ nom: user.nom ?? '', prenom: user.prenom ?? '', poste: user.poste ?? '' });
  }, [user]);

  useEffect(() => {
    if (preferences) {
      setTheme(preferences.theme ?? 'LIGHT');
    }
  }, [preferences]);

  const initials = user ? `${user.prenom?.charAt(0) || ''}${user.nom?.charAt(0) || ''}`.toUpperCase() : '?';

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setProfileMsg('');
    setProfileError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.post('/files/upload', fd);
      await updateProfile({ ...form, photoUrl: res.data.data });
      setProfileMsg('Photo de profil mise à jour');
    } catch {
      setProfileError("Erreur lors de l'envoi de la photo");
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg('');
    setProfileError('');
    try {
      await updateProfile(form);
      setProfileMsg('Profil mis à jour');
    } catch (err) {
      setProfileError(err.response?.data?.message || 'Erreur lors de la mise à jour du profil');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSavePreferences = async () => {
    setSavingPrefs(true);
    setPrefsMsg('');
    setPrefsError('');
    try {
      await updatePreferences({ theme });
      setPrefsMsg('Préférences enregistrées');
    } catch {
      setPrefsError('Erreur lors de la sauvegarde');
    } finally {
      setSavingPrefs(false);
    }
  };

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Paramètres</h1>
        <p className="text-sm text-muted-foreground mt-1">Vos informations et préférences</p>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="size-4" />
            Informations du profil
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="size-16 rounded-full">
              <Avatar className="size-full">
                {user?.photoUrl ? (
                  <AvatarImage src={user.photoUrl} alt="Photo de profil" />
                ) : (
                  <AvatarFallback className="text-lg">{initials}</AvatarFallback>
                )}
              </Avatar>
            </div>
            <div>
              <input id="avatar-upload" type="file" accept="image/jpeg,image/png" className="hidden" onChange={handleAvatarUpload} />
              <label
                htmlFor="avatar-upload"
                className="inline-flex h-9 cursor-pointer items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
              >
                <Camera className="size-4 mr-2" />
                {uploading ? 'Envoi...' : 'Changer la photo'}
              </label>
              <p className="mt-1 text-xs text-muted-foreground">JPEG ou PNG, 10 Mo max</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div><span className="text-muted-foreground">Email :</span> <span className="font-medium break-all">{user?.email}</span></div>
            <div><span className="text-muted-foreground">Matricule :</span> <span className="font-medium">{user?.matricule}</span></div>
            <div><span className="text-muted-foreground">Rôle :</span> <span className="font-medium">{user?.role?.replace('_', ' ')}</span></div>
            {user?.directionNom && <div><span className="text-muted-foreground">Direction :</span> <span className="font-medium">{user.directionNom}</span></div>}
          </div>

          <Separator className="my-1" />

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="profile-nom">Nom</Label>
                <Input id="profile-nom" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-prenom">Prénom</Label>
                <Input id="profile-prenom" value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-poste">Poste</Label>
                <Input id="profile-poste" value={form.poste} onChange={(e) => setForm({ ...form, poste: e.target.value })} placeholder="Votre poste" />
              </div>
            </div>

            {profileMsg && <div className="text-[#008B60] bg-[#008B60]/10 p-3 rounded-md text-sm">{profileMsg}</div>}
            {profileError && <div className="text-destructive bg-destructive/10 p-3 rounded-md text-sm">{profileError}</div>}

            <div className="flex items-center gap-2">
              <Button type="submit" disabled={savingProfile || uploading}>
                {savingProfile ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Save className="size-4 mr-2" />}
                Enregistrer
              </Button>
              <Dialog open={passwordOpen} onOpenChange={(o) => { setPasswordOpen(o); if (!o) { setPwError(''); setPwSuccess(''); setNewPassword(''); setConfirmPassword(''); } }}>
                <DialogTrigger asChild>
                  <Button type="button" variant="outline">
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
                    {pwSuccess && <div className="text-[#008B60] bg-[#008B60]/10 p-3 rounded-md text-sm">{pwSuccess}</div>}
                    <Button type="submit" className="w-full" disabled={pwLoading}>
                      {pwLoading ? 'Enregistrement...' : 'Enregistrer'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Globe className="size-4" />
            Préférences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 max-w-lg">
          <div className="space-y-2">
            <Label htmlFor="pref-theme">Thème</Label>
            <select
              id="pref-theme"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              {THEME_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {prefsMsg && <div className="text-[#008B60] bg-[#008B60]/10 p-3 rounded-md text-sm">{prefsMsg}</div>}
          {prefsError && <div className="text-destructive bg-destructive/10 p-3 rounded-md text-sm">{prefsError}</div>}

          <Button onClick={handleSavePreferences} disabled={savingPrefs}>
            {savingPrefs ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Save className="size-4 mr-2" />}
            Enregistrer
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
