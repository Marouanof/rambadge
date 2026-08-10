import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';
import { useSession } from '@/context/SessionContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCheck, CheckCircle2, Bell, ChevronLeft, ChevronRight, Trash2, RotateCcw } from 'lucide-react';
import { getNotificationConfig, formatRelativeTime, NOTIFICATION_TYPES } from '../notificationConfig';

const DAY_MS = 86400000;

const TYPES_BY_ROLE = {
  EMPLOYE: ['REFUS', 'VALIDATION', 'SUSPENSION', 'REVOCATION', 'REACTIVATION', 'EXPIRATION'],
  MANAGER: ['DEMANDE_N1', 'INCIDENT_DIRECTION', 'INVITATION_ACCEPTEE', 'INVITATION_EXPIREE'],
  AGENT_SURETE: ['DEMANDE_N2', 'INCIDENT_SIGNAL'],
  SUPER_ADMIN: [],
};

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function groupByDate(items) {
  const today = startOfDay(new Date());
  const yesterday = today - DAY_MS;
  const thisWeek = today - 6 * DAY_MS;
  const groups = [];
  let current = null;
  for (const item of items) {
    const t = startOfDay(new Date(item.createdAt));
    let key;
    if (t === today) key = "Aujourd'hui";
    else if (t === yesterday) key = 'Hier';
    else if (t >= thisWeek) key = 'Cette semaine';
    else key = 'Plus ancien';
    if (!current || current.key !== key) {
      current = { key, items: [] };
      groups.push(current);
    }
    current.items.push(item);
  }
  return groups;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [activeTypes, setActiveTypes] = useState([]);
  const [undoState, setUndoState] = useState(null);
  const undoTimerRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useSession();

  const roleTypes = useMemo(() => TYPES_BY_ROLE[user?.role] || [], [user?.role]);

  useEffect(() => {
    setActiveTypes((prev) => prev.filter((t) => roleTypes.includes(t)));
  }, [roleTypes]);

  const fetchNotifications = useCallback(async (p) => {
    setLoading(true);
    try {
      const res = await api.get('/notifications', { params: { page: p, size: 20 } });
      setNotifications(res.data.data?.content ?? []);
      setTotalPages(res.data.data?.totalPages ?? 0);
      setTotalElements(res.data.data?.totalElements ?? 0);
    } catch {
      setError('Erreur lors du chargement des notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications(page);
  }, [page, fetchNotifications]);

  useEffect(() => () => clearTimeout(undoTimerRef.current), []);

  const markRead = useCallback(async (n) => {
    api.patch(`/notifications/${n.id}/read`).catch(() => {});
    setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, lu: true } : x)));
  }, []);

  const handleClick = async (n) => {
    if (!n.lu) await markRead(n);
    if (n.lienElement) navigate(n.lienElement);
  };

  const handleMarkAllRead = async () => {
    api.patch('/notifications/read-all').catch(() => {});
    setNotifications((prev) => prev.map((x) => ({ ...x, lu: true })));
  };

  const restoreNotification = useCallback((n) => {
    setNotifications((prev) =>
      [...prev, n].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    );
    setTotalElements((prev) => prev + 1);
  }, []);

  const handleDelete = async (n) => {
    const remaining = notifications.filter((x) => x.id !== n.id);
    if (remaining.length === 0 && page > 0) {
      setPage(page - 1);
    }
    setNotifications(remaining);
    setTotalElements((prev) => Math.max(0, prev - 1));
    try {
      await api.delete(`/notifications/${n.id}`);
    } catch {
      restoreNotification(n);
      return;
    }
    clearTimeout(undoTimerRef.current);
    setUndoState({ item: n });
    undoTimerRef.current = setTimeout(() => setUndoState(null), 5000);
  };

  const handleUndo = () => {
    if (!undoState) return;
    clearTimeout(undoTimerRef.current);
    restoreNotification(undoState.item);
    setUndoState(null);
  };

  const toggleType = (type) => {
    setActiveTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]));
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('Supprimer toutes les notifications ?')) return;
    try {
      await api.delete('/notifications');
      setNotifications([]);
      setTotalElements(0);
    } catch { /* ignore */ }
  };

  const unreadCount = notifications.filter((n) => !n.lu).length;
  const byUnread = onlyUnread ? notifications.filter((n) => !n.lu) : notifications;
  const filtered = activeTypes.length > 0
    ? byUnread.filter((n) => activeTypes.includes(n.typeNotification))
    : byUnread;
  const groups = groupByDate(filtered);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {totalElements} {totalElements > 1 ? 'notifications' : 'notification'} ·{' '}
            {unreadCount} {unreadCount > 1 ? 'non lues' : 'non lue'}
          </p>
        </div>
        <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
              <CheckCheck className="size-3.5 mr-1" />
              Tout marquer comme lu
            </Button>
          )}
          {notifications.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={handleDeleteAll}
            >
              <Trash2 className="size-3.5 mr-1" />
              Tout effacer
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {roleTypes.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTypes([])}
              className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                activeTypes.length === 0
                  ? 'border-[#C8102E] bg-[#C8102E] text-white'
                  : 'border-border text-muted-foreground hover:bg-muted'
              }`}
            >
              Tous
            </button>
            {Object.entries(NOTIFICATION_TYPES)
              .filter(([type]) => roleTypes.includes(type))
              .map(([type, cfg]) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => toggleType(type)}
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                    activeTypes.includes(type)
                      ? 'border-[#C8102E] bg-[#C8102E] text-white'
                      : 'border-border text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {cfg.label}
                </button>
              ))}
          </div>
        )}
        <label className="ml-auto flex shrink-0 cursor-pointer items-center gap-2 text-sm whitespace-nowrap">
          <input
            type="checkbox"
            checked={onlyUnread}
            onChange={(e) => setOnlyUnread(e.target.checked)}
            className="size-4 accent-[#C8102E]"
          />
          Non lues uniquement
        </label>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-4 sm:p-6">
          {error && <div className="text-destructive bg-destructive/10 p-3 rounded-md mb-4 text-sm">{error}</div>}

          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">Chargement...</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Bell className="size-12 mb-3 text-muted-foreground/50" />
              <p className="text-sm">
                {notifications.length === 0
                  ? (onlyUnread ? 'Aucune notification non lue' : 'Aucune notification')
                  : 'Aucune notification ne correspond à ces filtres'}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {groups.map((group) => (
                <div key={group.key}>
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    {group.key}
                  </h2>
                  <ul className="divide-y">
                    {group.items.map((n) => {
                      const cfg = getNotificationConfig(n.typeNotification);
                      const Icon = cfg.icon;
                      return (
                        <li
                          key={n.id}
                          onClick={() => handleClick(n)}
                          className={`group flex cursor-pointer items-center gap-3 px-2 py-3 rounded-lg ${!n.lu ? 'bg-muted/40 hover:bg-muted/60' : 'hover:bg-muted/40'}`}
                          title={n.lienElement ? 'Cliquer pour ouvrir' : undefined}
                        >
                          <span className={`relative flex size-9 shrink-0 items-center justify-center rounded-full ${cfg.bgClass}`}>
                            <Icon className={`size-4.5 ${cfg.iconClass}`} />
                            {!n.lu && (
                              <span className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-[#C8102E] ring-2 ring-background" />
                            )}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className={`text-sm leading-snug ${!n.lu ? 'font-medium' : 'text-muted-foreground'}`}>
                              {n.message}
                            </p>
                            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                              <span title={n.createdAt ? new Date(n.createdAt).toLocaleString('fr-FR') : undefined}>
                                {formatRelativeTime(n.createdAt)}
                              </span>
                              <Badge variant="outline" className="text-[10px] px-1.5">{cfg.label}</Badge>
                            </div>
                          </div>
                          {!n.lu && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="text-muted-foreground opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100 hover:text-foreground"
                              onClick={(e) => { e.stopPropagation(); markRead(n); }}
                              aria-label="Marquer comme lue"
                              title="Marquer comme lue"
                            >
                              <CheckCircle2 className="size-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-muted-foreground opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100 hover:text-destructive"
                            onClick={(e) => { e.stopPropagation(); handleDelete(n); }}
                            aria-label="Supprimer"
                            title="Supprimer"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-center gap-3 mt-6">
            <Button variant="outline" size="icon" disabled={page === 0} onClick={() => setPage(page - 1)} aria-label="Page précédente">
              <ChevronLeft className="size-4" />
            </Button>
            <span className="text-sm text-muted-foreground">{totalPages > 0 ? page + 1 : 0} / {totalPages}</span>
            <Button variant="outline" size="icon" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)} aria-label="Page suivante">
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {undoState && (
        <div className="fixed bottom-4 left-1/2 z-50 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-3 rounded-lg bg-foreground px-4 py-2.5 text-background shadow-lg">
          <span className="truncate text-sm">Notification supprimée</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-background hover:bg-background/20 hover:text-background"
            onClick={handleUndo}
          >
            <RotateCcw className="size-3.5 mr-1" />
            Annuler
          </Button>
        </div>
      )}
    </div>
  );
}
