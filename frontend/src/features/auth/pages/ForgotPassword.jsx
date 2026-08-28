import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';

const inputClasses =
  "h-11 w-full rounded-lg border border-white/10 bg-white/[0.06] px-4 text-sm text-[#f8fafc] placeholder:text-white/40 outline-none transition-all focus:border-white/40 focus:bg-white/10 focus:ring-2 focus:ring-white/10";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l\'envoi de l\'email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-900">
      <img
        src="/ram_tarmac.png"
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-center opacity-50"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 via-slate-900/60 to-slate-900" />
      <div className="grain-overlay" />

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
            <p className="mt-1 text-center text-[13px] text-white/50">
              {sent ? 'Email envoyé' : 'Mot de passe oublié'}
            </p>

            {sent ? (
              <div className="mt-8 space-y-6">
                <div className="flex flex-col items-center gap-3 rounded-lg border border-[rgba(34,197,94,0.35)] bg-[rgba(34,197,94,0.15)] p-5 text-center">
                  <CheckCircle2 className="size-8 text-[#86efac]" />
                  <p className="text-sm font-medium text-[#86efac]">
                    Si un compte existe avec cette adresse, vous recevrez un email de réinitialisation sous quelques minutes.
                  </p>
                </div>
                <Button
                  onClick={() => navigate('/login')}
                  className="h-11 w-full rounded-lg bg-[#C8102E] font-semibold text-white shadow-[0_4px_20px_rgba(200,16,46,0.35)] hover:bg-[#A00D24]"
                >
                  Retour à la connexion
                </Button>
              </div>
            ) : (
              <>
                <p className="mt-4 text-center text-[13px] leading-relaxed text-white/50">
                  Saisissez votre adresse email professionnelle RAM. Vous recevrez un lien pour réinitialiser votre mot de passe.
                </p>

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  <div>
                    <label htmlFor="forgot-email" className="mb-1.5 block text-[13px] font-semibold text-white">
                      Email
                    </label>
                    <input
                      id="forgot-email"
                      type="email"
                      placeholder="exemple@ram.ma"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className={inputClasses}
                    />
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
                    {loading ? 'Envoi...' : 'Envoyer le lien'}
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
            )}
          </CardContent>
        </Card>
      </div>

      <div className="absolute bottom-5 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap text-[11px] text-white/35">
        Portail Badges — Royal Air Maroc
      </div>

      <style>{`
        .grain-overlay {
          position: absolute;
          inset: 0;
          z-index: 1;
          pointer-events: none;
          opacity: 0.35;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E");
          background-repeat: repeat;
          background-size: 180px 180px;
          mix-blend-mode: overlay;
        }
      `}</style>
    </div>
  );
}
