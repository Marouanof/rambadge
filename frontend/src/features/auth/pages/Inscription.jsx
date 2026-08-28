import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Command, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { Eye, EyeOff, CheckCircle2, ChevronDown } from 'lucide-react';
import api from '@/services/api';
import { cn } from '@/lib/utils';

const inputClasses =
  "h-11 w-full rounded-lg border border-white/10 bg-white/[0.06] pl-4 pr-4 text-sm text-[#f8fafc] placeholder:text-white/40 outline-none transition-all focus:border-white/40 focus:bg-white/10 focus:ring-2 focus:ring-white/10";

const selectClasses =
  "h-11 w-full appearance-none rounded-lg border border-white/10 bg-white/[0.06] pl-4 pr-10 text-sm text-[#f8fafc] outline-none transition-all focus:border-white/40 focus:bg-white/10 focus:ring-2 focus:ring-white/10";

const passwordInputClasses =
  "h-11 w-full rounded-lg border border-white/10 bg-white/[0.06] pl-4 pr-10 text-sm text-[#f8fafc] placeholder:text-white/40 outline-none transition-all focus:border-white/40 focus:bg-white/10 focus:ring-2 focus:ring-white/10";

export default function Inscription() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const code = searchParams.get('code');
  const [invitation, setInvitation] = useState(null);
  const [invalidLink, setInvalidLink] = useState(false);
  const [loadingInvitation, setLoadingInvitation] = useState(true);
  const [form, setForm] = useState({ nom: '', prenom: '', matricule: '', poste: '', motDePasse: '' });
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [posteOpen, setPosteOpen] = useState(false);
  const [posteSearch, setPosteSearch] = useState('');
  const [postePos, setPostePos] = useState(null);
  const posteRef = useRef(null);
  const posteMenuRef = useRef(null);

  const openPoste = () => {
    if (posteOpen) {
      setPosteOpen(false);
      return;
    }
    const el = posteRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const estHeight = 300;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openUp = spaceBelow < estHeight && spaceAbove > spaceBelow;
    setPostePos({
      openUp,
      top: rect.bottom,
      bottom: window.innerHeight - rect.top,
      left: rect.left,
      width: rect.width,
      maxHeight: (openUp ? spaceAbove : spaceBelow) - 8,
    });
    setPosteSearch('');
    setPosteOpen(true);
  };

  useEffect(() => {
    const onClickOutside = (e) => {
      const inside =
        posteRef.current?.contains(e.target) || posteMenuRef.current?.contains(e.target);
      if (!inside) setPosteOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  useEffect(() => {
    if (!posteOpen) return;
    const close = () => setPosteOpen(false);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [posteOpen]);

  useEffect(() => {
    if (!code) {
      setInvalidLink(true);
      setLoadingInvitation(false);
      return;
    }
    api
      .get(`/invitations/${code}`)
      .then((res) => {
        setInvitation(res.data.data);
        setInvalidLink(false);
      })
      .catch(() => {
        setInvalidLink(true);
      })
      .finally(() => setLoadingInvitation(false));
  }, [code]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.motDePasse !== confirm) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (invitation?.postes?.length && !form.poste) {
      setError('Veuillez choisir votre poste');
      return;
    }

    setLoading(true);
    try {
      await api.post(`/invitations/${code}/accept`, form);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'inscription");
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
      <p className="mt-1 text-center text-[13px] text-white/50">Créez votre compte</p>
      {invitation?.directionNom && (
        <p className="mt-2 text-center text-[12px] font-medium text-white/60">
          Direction : {invitation.directionNom}
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label className="mb-1.5 block text-[13px] font-semibold text-white">Nom</label>
          <input
            value={form.nom}
            onChange={(e) => setForm({ ...form, nom: e.target.value })}
            required
            className={inputClasses}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[13px] font-semibold text-white">Prénom</label>
          <input
            value={form.prenom}
            onChange={(e) => setForm({ ...form, prenom: e.target.value })}
            required
            className={inputClasses}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[13px] font-semibold text-white">Matricule</label>
          <input
            value={form.matricule}
            onChange={(e) => setForm({ ...form, matricule: e.target.value })}
            required
            className={inputClasses}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[13px] font-semibold text-white">Poste</label>
          {invitation?.postes?.length ? (
            <div className="relative" ref={posteRef}>
              <button
                type="button"
                onClick={openPoste}
                aria-haspopup="listbox"
                aria-expanded={posteOpen}
                className={cn(
                  selectClasses,
                  'flex cursor-pointer items-center justify-between gap-2 text-left',
                  form.poste ? '' : 'text-white/40'
                )}
              >
                <span className="truncate">{form.poste || 'Choisissez votre poste'}</span>
                <ChevronDown className="size-4 shrink-0 text-white/50" />
              </button>

              {posteOpen &&
                postePos &&
                createPortal(
                  <div
                    ref={posteMenuRef}
                    role="listbox"
                    className="overflow-hidden rounded-lg border border-white/10 bg-slate-900/95 p-1 shadow-[0_8px_32px_rgba(0,0,0,0.6)] backdrop-blur"
                    style={{
                      position: 'fixed',
                      left: postePos.left,
                      width: postePos.width,
                      top: postePos.openUp ? 'auto' : postePos.top + 8,
                      bottom: postePos.openUp ? postePos.bottom + 8 : 'auto',
                      zIndex: 50,
                    }}
                  >
                    <Command className="bg-transparent p-0 text-slate-100">
                      <div className="p-1">
                        <input
                          autoFocus
                          value={posteSearch}
                          onChange={(e) => setPosteSearch(e.target.value)}
                          placeholder="Rechercher un poste..."
                          className="h-9 w-full rounded-md border border-white/10 bg-white/[0.06] px-3 text-sm text-[#f8fafc] placeholder:text-white/40 outline-none transition-all focus:border-white/30 focus:bg-white/10"
                        />
                      </div>
                      <CommandList className="text-slate-100" style={{ maxHeight: postePos.maxHeight }}>
                        <CommandEmpty className="text-white/50">Aucun poste trouvé</CommandEmpty>
                        <CommandGroup>
                          {invitation.postes
                            .filter((p) => p.toLowerCase().includes(posteSearch.toLowerCase()))
                            .map((p) => (
                              <CommandItem
                                key={p}
                                value={p}
                                data-checked={form.poste === p ? 'true' : undefined}
                                onSelect={() => {
                                  setForm({ ...form, poste: p });
                                  setPosteOpen(false);
                                }}
                                className="cursor-pointer text-slate-100 data-selected:bg-white/10 data-selected:text-white"
                              >
                                {p}
                              </CommandItem>
                            ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </div>,
                  document.body
                )}
            </div>
          ) : (
            <>
              <input
                value={form.poste}
                onChange={(e) => setForm({ ...form, poste: e.target.value })}
                placeholder="Ex. Contrôleur, Hôtesse…"
                required
                className={inputClasses}
              />
              <p className="mt-1 text-[11px] text-white/40">
                Aucun poste configuré par votre manager pour le moment.
              </p>
            </>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-[13px] font-semibold text-white">Mot de passe</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={form.motDePasse}
              onChange={(e) => setForm({ ...form, motDePasse: e.target.value })}
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
          {loading ? 'Inscription...' : "S'inscrire"}
        </Button>
      </form>

      <p className="mt-6 text-center text-[13px] text-white/50">
        Déjà un compte ?{' '}
        <a href="/login" className="font-medium text-white/80 transition-opacity hover:opacity-70">
          Se connecter
        </a>
      </p>
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
      <p className="mt-1 text-center text-[13px] text-white/50">Compte créé</p>

      <div className="mt-8 flex flex-col items-center gap-3 rounded-lg border border-[rgba(34,197,94,0.35)] bg-[rgba(34,197,94,0.15)] p-5 text-center">
        <CheckCircle2 className="size-8 text-[#86efac]" />
        <p className="text-sm font-medium text-[#86efac]">
          Votre compte a été créé avec succès. Vous pouvez maintenant vous connecter.
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
        className="absolute inset-0 h-full w-full object-cover object-center opacity-50"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 via-slate-900/60 to-slate-900" />
      <div className="grain-overlay" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-12">
        <Card className="w-full max-w-[420px] border border-white/10 bg-slate-900/70 shadow-[0_8px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl">
          <CardContent className="px-10 py-10">
            {loadingInvitation ? (
              <p className="py-10 text-center text-sm text-white/50">Chargement...</p>
            ) : invalidLink || !invitation ? (
              renderInvalid()
            ) : success ? (
              renderSuccess()
            ) : (
              renderForm()
            )}
          </CardContent>
        </Card>
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
