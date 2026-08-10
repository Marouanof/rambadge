import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Eye, EyeOff, CheckCircle2, ArrowLeft } from 'lucide-react';
import api from '@/services/api';

const passwordInputClasses =
  "h-11 w-full rounded-lg border border-white/10 bg-white/[0.06] pl-4 pr-10 text-sm text-[#f8fafc] placeholder:text-white/40 outline-none transition-all focus:border-white/40 focus:bg-white/10 focus:ring-2 focus:ring-white/10";

export default function SetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/set-password', { token, nouveauMotDePasse: password });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la définition du mot de passe');
    } finally {
      setLoading(false);
    }
  };

  const renderForm = () => (
    <>
      <img
        src="/logo_ram.png"
        alt="Royal Air Maroc"
        className="mx-auto mb-6 w-44 object-contain brightness-0 invert"
      />

      <h1 className="text-center text-xl font-bold tracking-tight text-white">
        Portail Badges – Royal Air Maroc
      </h1>
      <p className="mt-1 text-center text-[13px] text-white/50">Définissez votre mot de passe</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label className="mb-1.5 block text-[13px] font-semibold text-white">Nouveau mot de passe</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className={passwordInputClasses}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/55 transition-colors hover:text-[#f1f5f9]"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-[13px] font-semibold text-white">Confirmer le mot de passe</label>
          <div className="relative">
            <input
              type={showConfirm ? 'text' : 'password'}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className={passwordInputClasses}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              aria-label={showConfirm ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/55 transition-colors hover:text-[#f1f5f9]"
            >
              {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-[rgba(200,16,46,0.4)] bg-[rgba(200,16,46,0.2)] px-3.5 py-2.5 text-sm font-medium text-[#fca5a5]">
            {error}
          </div>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="h-11 w-full rounded-lg bg-[#C8102E] font-semibold text-white shadow-[0_4px_20px_rgba(200,16,46,0.35)] hover:bg-[#A00D24]"
        >
          {loading ? 'Envoi...' : 'Définir le mot de passe'}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <a
          href="/login"
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-white/80 transition-opacity hover:opacity-70"
        >
          <ArrowLeft className="size-4" />
          Retour à la connexion
        </a>
      </div>
    </>
  );

  const renderSuccess = () => (
    <>
      <img
        src="/logo_ram.png"
        alt="Royal Air Maroc"
        className="mx-auto mb-6 w-44 object-contain brightness-0 invert"
      />

      <h1 className="text-center text-xl font-bold tracking-tight text-white">
        Portail Badges – Royal Air Maroc
      </h1>
      <p className="mt-1 text-center text-[13px] text-white/50">Mot de passe défini</p>

      <div className="mt-8 flex flex-col items-center gap-3 rounded-lg border border-[rgba(34,197,94,0.35)] bg-[rgba(34,197,94,0.15)] p-5 text-center">
        <CheckCircle2 className="size-8 text-[#86efac]" />
        <p className="text-sm font-medium text-[#86efac]">
          Votre mot de passe a été défini avec succès. Vous pouvez maintenant vous connecter.
        </p>
      </div>

      <Button
        onClick={() => navigate('/login')}
        className="mt-6 h-11 w-full rounded-lg bg-[#C8102E] font-semibold text-white shadow-[0_4px_20px_rgba(200,16,46,0.35)] hover:bg-[#A00D24]"
      >
        Se connecter
      </Button>
    </>
  );

  const renderInvalid = () => (
    <>
      <img
        src="/logo_ram.png"
        alt="Royal Air Maroc"
        className="mx-auto mb-6 w-44 object-contain brightness-0 invert"
      />

      <h1 className="text-center text-xl font-bold tracking-tight text-white">
        Portail Badges – Royal Air Maroc
      </h1>
      <p className="mt-1 text-center text-[13px] text-white/50">Lien invalide</p>

      <div className="mt-8 rounded-lg border border-[rgba(200,16,46,0.4)] bg-[rgba(200,16,46,0.2)] px-3.5 py-2.5 text-sm font-medium text-[#fca5a5]">
        Lien invalide. Vérifiez l'email que vous avez reçu.
      </div>

      <Button
        onClick={() => navigate('/login')}
        className="mt-6 h-11 w-full rounded-lg bg-[#C8102E] font-semibold text-white shadow-[0_4px_20px_rgba(200,16,46,0.35)] hover:bg-[#A00D24]"
      >
        Retour à la connexion
      </Button>
    </>
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-900">
      <img
        src="/ram_tarmac.png"
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-center opacity-40"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 via-slate-900/75 to-slate-900" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-12">
        <Card className="w-full max-w-[420px] border border-white/10 bg-slate-900/70 shadow-[0_8px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl">
          <CardContent className="px-10 py-10">
            {!token ? renderInvalid() : success ? renderSuccess() : renderForm()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
