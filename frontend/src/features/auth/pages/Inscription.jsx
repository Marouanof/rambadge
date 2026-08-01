import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '@/services/api';
import './Login.css';

export default function Inscription() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const code = searchParams.get('code');
  const [form, setForm] = useState({ nom: '', prenom: '', matricule: '', poste: '', motDePasse: '' });
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.motDePasse !== confirm) {
      setError('Les mots de passe ne correspondent pas');
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
      <img src="/logo_ram.png" alt="Royal Air Maroc" className="login-ram-logo" />
      <h1 className="login-main-title">Portail Badges – Royal Air Maroc</h1>
      <p className="login-subtitle">Créez votre compte</p>

      <form onSubmit={handleSubmit}>
        <div className="login-field">
          <label>Nom</label>
          <input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required />
        </div>
        <div className="login-field">
          <label>Prénom</label>
          <input value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} required />
        </div>
        <div className="login-field">
          <label>Matricule</label>
          <input value={form.matricule} onChange={(e) => setForm({ ...form, matricule: e.target.value })} required />
        </div>
        <div className="login-field">
          <label>Poste</label>
          <input value={form.poste} onChange={(e) => setForm({ ...form, poste: e.target.value })} placeholder="Ex. Contrôleur, Hôtesse…" required />
        </div>
        <div className="login-field">
          <label>Mot de passe</label>
          <input type="password" value={form.motDePasse} onChange={(e) => setForm({ ...form, motDePasse: e.target.value })} placeholder="••••••••" required minLength={6} />
        </div>
        <div className="login-field">
          <label>Confirmer le mot de passe</label>
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" required minLength={6} />
        </div>
        {error && <div className="login-error">{error}</div>}
        <button type="submit" className="login-btn" disabled={loading}>
          {loading ? 'Inscription...' : "S'inscrire"}
        </button>
      </form>
      <p className="login-it-support">Déjà un compte ? <a href="/login" style={{ color: '#f8fafc', fontWeight: 600 }}>Se connecter</a></p>
    </>
  );

  const renderSuccess = () => (
    <>
      <img src="/logo_ram.png" alt="Royal Air Maroc" className="login-ram-logo" />
      <h1 className="login-main-title">Portail Badges – Royal Air Maroc</h1>
      <p className="login-subtitle">Compte créé</p>
      <p style={{ color: '#cbd5e1', fontSize: 14, marginBottom: 16 }}>Votre compte a été créé avec succès.</p>
      <div style={{ background: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.35)', color: '#86efac', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 14, fontWeight: 500 }}>
        Vous pouvez maintenant vous connecter.
      </div>
      <button className="login-btn" onClick={() => navigate('/login')}>
        Se connecter
      </button>
    </>
  );

  const renderInvalid = () => (
    <>
      <img src="/logo_ram.png" alt="Royal Air Maroc" className="login-ram-logo" />
      <h1 className="login-main-title">Portail Badges – Royal Air Maroc</h1>
      <div className="login-error" style={{ marginTop: 8 }}>Lien invalide. Vérifiez l'email que vous avez reçu.</div>
    </>
  );

  return (
    <div className="login-split">
      <div className="login-panel-left">
        <div className="login-form-area">
          {!code ? renderInvalid() : success ? renderSuccess() : renderForm()}
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
