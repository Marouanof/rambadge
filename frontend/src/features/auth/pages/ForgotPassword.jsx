import { useState } from 'react';
import api from '@/services/api';
import './Login.css';

export default function ForgotPassword() {
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

  const renderForm = () => (
    <>
      <img src="/logo_ram.png" alt="Royal Air Maroc" className="login-ram-logo" />
      <h1 className="login-main-title">Portail Badges – Royal Air Maroc</h1>
      <p className="login-subtitle">Mot de passe oublié</p>
      <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 14, lineHeight: 1.5 }}>
        Saisissez votre adresse email professionnelle RAM. Vous recevrez un lien pour réinitialiser votre mot de passe.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="login-field login-field--icon">
          <label htmlFor="email">Matricule ou Email</label>
          <div className="login-input-wrapper">
            <svg className="login-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="M22 4L12 13 2 4" />
            </svg>
            <input id="email" type="email" placeholder="matricule@ram.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
        </div>
        {error && <div className="login-error">{error}</div>}
        <button type="submit" className="login-btn" disabled={loading}>
          {loading ? 'Envoi...' : 'Envoyer le lien'}
        </button>
      </form>
      <p className="login-it-support" style={{ marginTop: 12 }}>
        <a href="/login" style={{ color: '#f8fafc', fontWeight: 600, textDecoration: 'none' }}>Retour à la connexion</a>
      </p>
    </>
  );

  const renderSent = () => (
    <>
      <img src="/logo_ram.png" alt="Royal Air Maroc" className="login-ram-logo" />
      <h1 className="login-main-title">Portail Badges – Royal Air Maroc</h1>
      <p className="login-subtitle">Email envoyé</p>
      <div style={{ background: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.35)', color: '#86efac', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 14, fontWeight: 500 }}>
        Si un compte existe avec cette adresse, vous recevrez un email de réinitialisation sous quelques minutes.
      </div>
      <a href="/login" className="login-btn" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
        Retour à la connexion
      </a>
    </>
  );

  return (
    <div className="login-split">
      <div className="login-panel-left">
        <div className="login-form-area">
          {sent ? renderSent() : renderForm()}
        </div>
      </div>
      <div className="login-panel-right">
        <img src="/ram_tarmac.png" alt="Tarmac Royal Air Maroc" className="login-tarmac-img" />
        <div className="login-overlay-content">
          <div className="login-overlay-card">
            <span className="login-overlay-label">PORTAIL BADGES</span>
            <p className="login-overlay-text">Bienvenue sur le portail badges RAM</p>
            <span className="login-overlay-version">Version 2.4</span>
          </div>
        </div>
      </div>
    </div>
  );
}
