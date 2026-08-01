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
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-6">
          <div className="text-center space-y-4 max-w-md">
            <AlertTriangle className="size-12 mx-auto text-destructive" />
            <h1 className="text-2xl font-semibold tracking-tight">Une erreur est survenue</h1>
            <p className="text-sm text-muted-foreground">
              Un problème inattendu a interrompu l'application. Rechargez la page ou revenez à l'accueil.
            </p>
            <div className="flex justify-center gap-3">
              <Button onClick={this.handleReload}>
                <RotateCcw className="size-4 mr-2" />
                Recharger
              </Button>
              <Button variant="outline" onClick={() => { window.location.href = '/login'; }}>
                Aller à l'accueil
              </Button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
