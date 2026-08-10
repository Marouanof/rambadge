import { useState, useEffect } from 'react';
import api from '@/services/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Search, ShieldCheck, AlertTriangle, XCircle,
  PauseCircle, RefreshCw, ChevronLeft, ChevronRight, ChevronDown,
} from 'lucide-react';

const statutConfig = {
  ACTIF: { cls: 'bg-[#008B60]/10 text-[#008B60]', label: 'Actif' },
  SUSPENDU: { cls: 'bg-[#F1BE5B]/15 text-[#A67C00]', label: 'Suspendu' },
  REVOQUE: { cls: 'bg-[#C20831]/10 text-[#C20831]', label: 'Revoque' },
  EXPIRE: { cls: 'bg-[#674459]/10 text-[#674459]', label: 'Expire' },
};

const habStatutConfig = {
  ACTIVE: { cls: 'bg-[#008B60]/10 text-[#008B60]' },
  REVOQUEE: { cls: 'bg-[#C20831]/10 text-[#C20831]' },
  EN_ATTENTE: { cls: 'bg-[#F1BE5B]/15 text-[#A67C00]' },
};

const statutPill = (statut, cfg, fallback) => (
  <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg[statut]?.cls || fallback}`}>
    {cfg[statut]?.label || statut}
  </span>
);

const actionLabel = {
  suspend: { title: 'Confirmer la suspension', body: 'Suspendre le badge ? En cas de perte, vol ou incident.' },
  reactivate: { title: 'Confirmer la reactivation', body: 'Reactiviter le badge ? La suspension sera levee.' },
  revoke: { title: 'Confirmer la revocation', body: 'Revoquer definitivement le badge ? Cette action est irreversible et annule toutes ses habilitations.' },
};

const formatDate = (d) => (d ? new Date(d).toLocaleDateString('fr-FR') : '-');

export default function VerificationBadges() {
  const [badges, setBadges] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [statutFilter, setStatutFilter] = useState('');
  const [directionFilter, setDirectionFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [directions, setDirections] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState('');

  const [confirmAction, setConfirmAction] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchBadges = async (p, statut, direction, search) => {
    setListLoading(true);
    try {
      const params = { page: p, size: 10 };
      if (statut) params.statut = statut;
      if (direction) params.direction = direction;
      if (search) params.search = search;
      const res = await api.get('/badges', { params });
      setBadges(res.data.data.content);
      setTotalPages(res.data.data.totalPages);
    } catch {
      setListError('Erreur lors du chargement');
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => { fetchBadges(page, statutFilter, directionFilter, search); }, [page, statutFilter, directionFilter, search]);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(0);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    api.get('/directions', { params: { page: 0, size: 100 } })
      .then((res) => setDirections(res.data.data.content || []))
      .catch(() => {});
  }, []);

  const executeAction = async () => {
    if (!confirmAction) return;
    setActionLoading(true);
    try {
      const { action, badge } = confirmAction;
      const endpoint = { suspend: 'suspend', reactivate: 'reactivate', revoke: 'revoke' }[action];
      await api.patch(`/badges/${badge.id}/${endpoint}`);
      setConfirmAction(null);
      fetchBadges(page, statutFilter, directionFilter, search);
    } catch (err) {
      setListError(err.response?.data?.message || 'Erreur lors de l\'action');
    } finally {
      setActionLoading(false);
    }
  };

  const renderActionButtons = (badge) => (
    <div className="flex gap-1.5">
      {badge.statut === 'ACTIF' && (
        <Button variant="outline" size="sm" onClick={() => setConfirmAction({ action: 'suspend', badge })}>
          <PauseCircle className="size-3.5 mr-1" />
          Suspendre
        </Button>
      )}
      {badge.statut === 'SUSPENDU' && (
        <>
          <Button variant="outline" size="sm" onClick={() => setConfirmAction({ action: 'reactivate', badge })}>
            <RefreshCw className="size-3.5 mr-1" />
            Reactiver
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setConfirmAction({ action: 'revoke', badge })}>
            <XCircle className="size-3.5 mr-1" />
            Revoquer
          </Button>
        </>
      )}
    </div>
  );

  const renderHabilitations = (badge) => (
    <div className="flex flex-wrap gap-2">
      {badge.habilitations?.length > 0 ? badge.habilitations.map((h) => (
        <span key={h.id} className="inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs">
          <span className="font-medium">{h.zoneNom}</span>
          <span className="text-muted-foreground">{h.zoneCode}</span>
          {statutPill(h.statut, habStatutConfig, 'bg-[#674459]/10 text-[#674459]')}
        </span>
      )) : (
        <span className="text-sm text-muted-foreground">Aucune habilitation</span>
      )}
    </div>
  );

  const renderHabilitationPanel = (badge) => (
    <div className="rounded-md border bg-muted/40 p-3">
      <p className="text-xs font-medium text-muted-foreground mb-2">Habilitations</p>
      {renderHabilitations(badge)}
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Verification de badges</h1>
        <p className="text-sm text-muted-foreground mt-1">Verifier un badge et consulter l'etat des habilitations</p>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="size-4" />
            Consultation des badges
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="relative w-full max-w-[260px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="UID, nom, email, matricule..."
                className="w-full rounded-md border border-input bg-background pl-8 pr-3 h-9 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <label className="text-sm text-muted-foreground shrink-0">Statut :</label>
            <select
              value={statutFilter}
              onChange={(e) => { setStatutFilter(e.target.value); setPage(0); }}
              className="flex h-9 w-full max-w-[220px] rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">Tous</option>
              {Object.keys(statutConfig).map((s) => (
                <option key={s} value={s}>{statutConfig[s].label}</option>
              ))}
            </select>
            <label className="text-sm text-muted-foreground shrink-0">Direction :</label>
            <select
              value={directionFilter}
              onChange={(e) => { setDirectionFilter(e.target.value); setPage(0); }}
              className="flex h-9 w-full max-w-[220px] rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">Toutes</option>
              {directions.map((d) => (
                <option key={d.id} value={d.nom}>{d.nom}</option>
              ))}
            </select>
          </div>

          {listError && <div className="text-destructive bg-destructive/10 p-3 rounded-md mb-4 text-sm">{listError}</div>}

          {listLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">Chargement...</div>
          ) : badges.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <ShieldCheck className="size-12 mb-3 text-muted-foreground/50" />
              <p className="text-sm">Aucun badge pour ce filtre</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-muted-foreground">
                    <th className="pb-2 font-medium w-8"></th>
                    <th className="pb-2 font-medium">UID</th>
                    <th className="pb-2 font-medium">Employe</th>
                    <th className="pb-2 font-medium">Direction</th>
                    <th className="pb-2 font-medium">Expiration</th>
                    <th className="pb-2 font-medium">Statut</th>
                    <th className="pb-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {badges.map((b) => (
                    <ExpandedBadgeRow
                      key={b.id}
                      badge={b}
                      expanded={expandedId === b.id}
                      onToggle={() => setExpandedId(expandedId === b.id ? null : b.id)}
                      renderHabilitationPanel={renderHabilitationPanel}
                      renderActionButtons={renderActionButtons}
                      statutPill={statutPill}
                      statutConfig={statutConfig}
                      formatDate={formatDate}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex items-center justify-center gap-3 mt-4">
            <Button variant="outline" size="icon" disabled={page === 0} onClick={() => setPage(page - 1)} aria-label="Page precedente">
              <ChevronLeft className="size-4" />
            </Button>
            <span className="text-sm text-muted-foreground">{totalPages > 0 ? page + 1 : 0} / {totalPages}</span>
            <Button variant="outline" size="icon" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)} aria-label="Page suivante">
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!confirmAction} onOpenChange={(open) => { if (!open) setConfirmAction(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirmAction ? actionLabel[confirmAction.action].title : ''}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-start gap-3 p-3 bg-[#F1BE5B]/10 border border-[#F1BE5B]/40 rounded-md">
              <AlertTriangle className="size-5 text-[#A67C00] shrink-0 mt-0.5" />
              <p className="text-sm text-[#5C4A00]">{confirmAction ? actionLabel[confirmAction.action].body : ''}</p>
            </div>
            {confirmAction && (
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-muted-foreground">Badge UID :</span> <span className="font-medium font-mono">{confirmAction.badge.uidUnique}</span></div>
                <div><span className="text-muted-foreground">Employe :</span> <span className="font-medium">{confirmAction.badge.employePrenom} {confirmAction.badge.employeNom}</span></div>
                <div className="col-span-2"><span className="text-muted-foreground">Statut actuel :</span> <span className="font-medium">{statutConfig[confirmAction.badge.statut]?.label || confirmAction.badge.statut}</span></div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmAction(null)}>Annuler</Button>
            <Button
              variant={confirmAction?.action === 'revoke' ? 'destructive' : 'default'}
              onClick={executeAction}
              disabled={actionLoading}
            >
              {actionLoading ? 'Envoi...' : 'Confirmer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ExpandedBadgeRow({ badge, expanded, onToggle, renderHabilitationPanel, renderActionButtons, statutPill, statutConfig, formatDate }) {
  return (
    <>
      <tr className="border-b last:border-0">
        <td className="py-2.5">
          <button
            type="button"
            onClick={onToggle}
            aria-label={expanded ? 'Replier' : 'Deplier'}
            className="inline-flex items-center justify-center size-6 rounded-md hover:bg-muted text-muted-foreground"
          >
            {expanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
          </button>
        </td>
        <td className="py-2.5 text-xs font-mono">{badge.uidUnique}</td>
        <td className="py-2.5 text-sm">{badge.employePrenom} {badge.employeNom}</td>
        <td className="py-2.5 text-sm">{badge.directionNom || '-'}</td>
        <td className="py-2.5 text-sm">{formatDate(badge.dateExpiration)}</td>
        <td className="py-2.5">
          {statutPill(badge.statut, statutConfig, 'bg-[#674459]/10 text-[#674459]')}
          {badge.statut === 'SUSPENDU' && badge.dateSuspension && (
            <div className="text-xs text-muted-foreground mt-1">Suspension : {formatDate(badge.dateSuspension)}</div>
          )}
          {badge.statut === 'REVOQUE' && badge.dateRevocation && (
            <div className="text-xs text-muted-foreground mt-1">Revocation : {formatDate(badge.dateRevocation)}</div>
          )}
        </td>
        <td className="py-2.5">
          {renderActionButtons(badge)}
        </td>
      </tr>
      {expanded && (
        <tr className="border-b last:border-0 bg-muted/30">
          <td colSpan={7} className="py-3 pl-12 pr-3">
            {renderHabilitationPanel(badge)}
          </td>
        </tr>
      )}
    </>
  );
}
