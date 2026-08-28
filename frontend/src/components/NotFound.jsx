import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plane } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-900">
      <img src="/ram_tarmac.png" alt="" className="absolute inset-0 h-full w-full object-cover object-center opacity-50" />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 via-slate-900/60 to-slate-900" />
      <div className="grain-overlay" />

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-12 text-center">
        <img src="/logo_ram.png" alt="Royal Air Maroc" className="mb-8 w-44 object-contain opacity-90" />

        <span className="text-[10px] font-semibold uppercase tracking-[0.35em] text-white/45">Portail Badges</span>

        <h1 className="mt-3 text-[120px] font-bold leading-none tracking-tight text-[#C20831] drop-shadow-[0_8px_40px_rgba(194,8,49,0.5)]">404</h1>

        <div className="mt-4 flex items-center gap-2 text-lg font-semibold text-white">
          <Plane className="size-5 text-[#C20831]" />
          Cette porte d'embarquement n'existe pas.
        </div>

        <p className="mt-2 max-w-md text-sm text-white/50">
          La page demandée a été déplacée ou n'a jamais atterri ici. Vérifiez l'adresse ou retournez à l'accueil.
        </p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Button
            onClick={() => navigate('/')}
            className="h-10 bg-[#C20831] px-6 font-semibold text-white shadow-[0_4px_20px_rgba(194,8,49,0.35)] hover:bg-[#C20831]/90"
          >
            Retour à l'accueil
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/login')}
            className="h-10 border-white/25 bg-transparent px-6 font-semibold text-white hover:bg-white/10 hover:text-white"
          >
            Se connecter
          </Button>
        </div>
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
