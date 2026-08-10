import { Component } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Erreur non gérée :', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="relative min-h-screen overflow-hidden bg-slate-900">
          <img src="/ram_tarmac.png" alt="" className="absolute inset-0 h-full w-full object-cover object-center opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 via-slate-900/85 to-slate-900" />

          <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-12 text-center">
            <img src="/logo_ram.png" alt="Royal Air Maroc" className="mb-8 w-44 object-contain opacity-90" />

            <span className="text-[10px] font-semibold uppercase tracking-[0.35em] text-white/45">Portail Badges</span>

            <AlertTriangle className="mt-6 size-12 text-[#C20831]" />

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-white">Une erreur est survenue</h1>

            <p className="mt-3 max-w-md text-sm text-white/50">
              Un problème inattendu a interrompu l'application. Rechargez la page ou revenez à l'accueil.
            </p>

            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Button
                onClick={this.handleReload}
                className="h-10 bg-[#C20831] px-6 font-semibold text-white shadow-[0_4px_20px_rgba(194,8,49,0.35)] hover:bg-[#C20831]/90"
              >
                <RotateCcw className="size-4 mr-2" />
                Recharger
              </Button>
              <Button
                variant="outline"
                onClick={() => { window.location.href = '/login'; }}
                className="h-10 border-white/25 bg-transparent px-6 font-semibold text-white hover:bg-white/10 hover:text-white"
              >
                Se connecter
              </Button>
            </div>
          </div>

          <div className="absolute bottom-5 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap text-[11px] text-white/35">
            Portail Badges — Royal Air Maroc
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
