import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

const KEYCLOAK_URL = import.meta.env.VITE_KEYCLOAK_URL;
const REALM = import.meta.env.VITE_KEYCLOAK_REALM;
const CLIENT_ID = import.meta.env.VITE_KEYCLOAK_CLIENT_ID;
const CLIENT_SECRET = import.meta.env.VITE_KEYCLOAK_CLIENT_SECRET;

export default function LoginShadcn() {
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
    <div className="flex fixed inset-0 font-[Inter,'Segoe_UI',system-ui,sans-serif]">
      <div className="flex-1 flex items-center justify-center bg-[#0f172a] relative z-10 shadow-[4px_0_12px_rgba(0,0,0,0.3)] after:absolute after:right-0 after:top-0 after:bottom-0 after:w-px after:bg-white/[0.06] after:pointer-events-none">
        <div className="w-full max-w-[380px] pt-5 pb-8 px-10 animate-[loginFade_0.5s_ease-out_0.2s_both]">
          <img
            src="/logo_ram.png"
            alt="Royal Air Maroc"
            className="w-[310px] h-auto block mb-6 object-contain object-left brightness-0 invert"
          />

          <h1 className="text-2xl font-bold text-white mb-1 tracking-tight">
            Portail Aéroportuaire RAM
          </h1>
          <p className="text-[13px] text-white/50 mb-7 font-normal">
            Espace Authentification
          </p>

          <form onSubmit={handleLogin} className="flex flex-col gap-[22px]">
            <div>
              <Label htmlFor="email" className="text-sm font-semibold text-white block mb-[7px]">
                Matricule ou Email
              </Label>
              <div className="relative group">
                <svg
                  className="absolute left-[14px] top-1/2 -translate-y-1/2 text-white/50 pointer-events-none z-10 transition-colors duration-300 group-focus-within:text-white"
                  width="18" height="18" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round"
                >
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M22 4L12 13 2 4" />
                </svg>
                <input
                  id="email"
                  type="email"
                  placeholder="matricule@ram.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full pl-[52px] pr-4 py-[14px] rounded-xl border border-white/10 bg-white/[0.06] text-[#f8fafc] text-[15px] placeholder:text-white/40 outline-none transition-all hover:border-white/25 focus:border-white/40 focus:bg-white/10 focus:shadow-[0_0_0_3px_rgba(255,255,255,0.1)]"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password" className="text-sm font-semibold text-white block mb-[7px]">
                Mot de passe
              </Label>
              <div className="relative group">
                <svg
                  className="absolute left-[14px] top-1/2 -translate-y-1/2 text-white/50 pointer-events-none z-10 transition-colors duration-300 group-focus-within:text-white"
                  width="18" height="18" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full pl-[52px] pr-[52px] py-[14px] rounded-xl border border-white/10 bg-white/[0.06] text-[#f8fafc] text-[15px] placeholder:text-white/40 outline-none transition-all hover:border-white/25 focus:border-white/40 focus:bg-white/10 focus:shadow-[0_0_0_3px_rgba(255,255,255,0.1)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/55 hover:text-[#f1f5f9] bg-transparent border-none cursor-pointer p-1 flex items-center justify-center z-20 transition-colors"
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                      <path d="M14.12 14.12a3 3 0 11-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-[#fca5a5] bg-[rgba(200,16,46,0.2)] border border-[rgba(200,16,46,0.4)] px-3.5 py-2.5 rounded-lg text-sm font-medium">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full py-[15px] px-[13px] h-auto rounded-xl bg-[#C8102E] text-white text-[15px] font-bold tracking-wide border-0 shadow-[0_4px_20px_rgba(200,16,46,0.25)] hover:bg-[#A00D24] hover:shadow-[0_8px_28px_rgba(200,16,46,0.5)] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100 transition-all"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </Button>
          </form>

          <div className="mt-6">
            <a href="#" className="text-[13px] text-white font-medium hover:opacity-80 transition-opacity whitespace-nowrap">
              Mot de passe oublié ?
            </a>
          </div>

          <p className="mt-7 text-xs text-white/40 hover:text-white/60 transition-colors">
            Problème d'accès ? Contactez le support IT RAM
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative bg-black">
        <img
          src="/ram_tarmac.png"
          alt="Tarmac Royal Air Maroc"
          className="absolute inset-0 w-full h-full object-cover object-[35%_center]"
        />
        <div className="absolute bottom-9 left-[30px] right-[30px] z-10">
          <Card className="bg-black/40 backdrop-blur-[16px] rounded-xl border border-white/10 shadow-none p-0">
            <CardContent className="p-5">
              <span className="text-[10px] font-semibold text-white/45 tracking-[1.5px] uppercase">
                SYSTÈME D'INFORMATION
              </span>
              <p className="text-base font-semibold text-[#f1f5f9] mt-1.5 mb-1">
                Bienvenue sur le portail interne RAM
              </p>
              <span className="text-[11px] text-white/40">
                Version 2.4
              </span>
            </CardContent>
          </Card>
        </div>
      </div>

      <style>{`
        @keyframes loginFade {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
