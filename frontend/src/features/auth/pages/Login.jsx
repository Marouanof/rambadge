import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Eye, EyeOff } from 'lucide-react';

const KEYCLOAK_URL = import.meta.env.VITE_KEYCLOAK_URL;
const REALM = import.meta.env.VITE_KEYCLOAK_REALM;
const CLIENT_ID = import.meta.env.VITE_KEYCLOAK_CLIENT_ID;
const CLIENT_SECRET = import.meta.env.VITE_KEYCLOAK_CLIENT_SECRET;

const inputClasses =
  "h-11 w-full rounded-lg border border-white/10 bg-white/[0.06] pl-4 pr-4 text-sm text-[#f8fafc] placeholder:text-white/40 outline-none transition-all focus:border-white/40 focus:bg-white/10 focus:ring-2 focus:ring-white/10";

const passwordInputClasses =
  "h-11 w-full rounded-lg border border-white/10 bg-white/[0.06] pl-4 pr-10 text-sm text-[#f8fafc] placeholder:text-white/40 outline-none transition-all focus:border-white/40 focus:bg-white/10 focus:ring-2 focus:ring-white/10";

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const params = new URLSearchParams();
      params.append('grant_type', 'password');
      params.append('client_id', CLIENT_ID);
      params.append('client_secret', CLIENT_SECRET);
      params.append('username', email);
      params.append('password', password);

      const res = await fetch(
        `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/token`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params,
        }
      );

      if (!res.ok) {
        setError('Email ou mot de passe incorrect');
        return;
      }

      const data = await res.json();
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('refreshToken', data.refresh_token);
      navigate('/');
    } catch {
      setError('Impossible de contacter le serveur');
    } finally {
      setLoading(false);
    }
  };

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
            <img
              src="/logo_ram.png"
              alt="Royal Air Maroc"
              className="mx-auto mb-6 w-44 object-contain brightness-0 invert"
            />

            <h1 className="text-center text-xl font-bold tracking-tight text-white">
              Portail Badges – Royal Air Maroc
            </h1>
            <p className="mt-1 text-center text-[13px] text-white/50">Espace Authentification</p>

            <form onSubmit={handleLogin} className="mt-8 space-y-4">
              <div>
                <label htmlFor="login-email" className="mb-1.5 block text-[13px] font-semibold text-white">
                  Email
                </label>
                <input
                  id="login-email"
                  type="email"
                  placeholder="example@ram.ma"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={inputClasses}
                />
              </div>

              <div>
                <label htmlFor="login-password" className="mb-1.5 block text-[13px] font-semibold text-white">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
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
                {loading ? 'Connexion...' : 'Se connecter'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <a href="/forgot-password" className="text-[13px] font-medium text-white/80 transition-opacity hover:opacity-70">
                Mot de passe oublié ?
              </a>
            </div>

            <p className="mt-7 text-center text-xs text-white/40">
              Problème d'accès ? Contactez le support IT RAM
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
