import { useEffect, useState, useCallback } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useSession } from '@/context/SessionContext';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
  SidebarRail,
} from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import api from '@/services/api';
import { getNotificationConfig, formatRelativeTime } from '@/features/notifications/notificationConfig';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  LayoutDashboard,
  Building2,
  ShieldCheck,
  Users,
  Search,
  Play,
  Settings,
  CheckCircle2,
  UserCheck,
  Mail,
  AlertTriangle,
  LogOut,
  ChevronDown,
  ClipboardCheck,
  History,
  ShieldAlert,
  ArrowRightLeft,
  Badge,
  Bell,
  User,
  ScanLine,
  Trash2,
} from 'lucide-react';

const navByRole = {
  SUPER_ADMIN: [
    { to: '/', label: 'Tableau de bord', icon: LayoutDashboard },
    { to: '/directions', label: 'Directions RAM', icon: Building2 },
    { to: '/managers', label: 'Managers', icon: Users },
    { to: '/agents', label: 'Agents de surete', icon: ShieldCheck },
    { to: '/consultation', label: 'Consultation globale', icon: Search },
    { to: '/simulation', label: 'Simulation de passage', icon: Play },
    { to: '/parametres', label: 'Parametres', icon: Settings },
  ],
  MANAGER: [
    { to: '/', label: 'Tableau de bord', icon: LayoutDashboard },
    { to: '/validations', label: 'Validations en attente', icon: ClipboardCheck },
    { to: '/invitations', label: 'Invitations & Postes', icon: Mail },
    { to: '/employes-direction', label: 'Employes de la direction', icon: UserCheck },
    { to: '/badges-direction', label: 'Badges de la direction', icon: Badge },
    { to: '/passages-direction', label: 'Passages de la direction', icon: ArrowRightLeft },
    { to: '/incidents', label: 'Incidents', icon: AlertTriangle },
    { to: '/parametres', label: 'Parametres', icon: Settings },
  ],
  EMPLOYE: [
    { to: '/', label: 'Tableau de bord', icon: LayoutDashboard },
    { to: '/ma-demande', label: 'Ma demande de badge', icon: Badge },
    { to: '/mon-historique', label: 'Mon historique', icon: History },
    { to: '/parametres', label: 'Parametres', icon: Settings },
  ],
  AGENT_SURETE: [
    { to: '/', label: 'Tableau de bord', icon: LayoutDashboard },
    { to: '/dossiers-n2', label: 'Dossiers a instruire', icon: ClipboardCheck },
    { to: '/incidents-surete', label: 'Incidents / Revocations', icon: ShieldAlert },
    { to: '/verification-badges', label: 'Verification badges', icon: ScanLine },
    { to: '/historique', label: 'Historique global', icon: History },
    { to: '/parametres', label: 'Parametres', icon: Settings },
  ],
};

export default function Layout() {
  const { user } = useSession();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  const fetchNotifications = useCallback(() => {
    api.get('/notifications/unread-count')
      .then((res) => setUnreadCount(res.data.data ?? 0))
      .catch(() => {});
    api.get('/notifications', { params: { size: 5 } })
      .then((res) => setNotifications(res.data.data?.content ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user, fetchNotifications]);

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, lu: true })));
    } catch {}
  };

  const handleNotificationClick = async (notif) => {
    try { await api.patch(`/notifications/${notif.id}/read`); } catch {}
    if (notif.lienElement) navigate(notif.lienElement);
  };

  const handleMarkRead = async (notif) => {
    try { await api.patch(`/notifications/${notif.id}/read`); } catch {}
    setUnreadCount((prev) => Math.max(0, prev - 1));
    setNotifications((prev) => prev.map((n) => (n.id === notif.id ? { ...n, lu: true } : n)));
  };

  const handleDeleteNotification = async (notif) => {
    try {
      await api.delete(`/notifications/${notif.id}`);
      if (!notif.lu) setUnreadCount((prev) => Math.max(0, prev - 1));
      setNotifications((prev) => prev.filter((n) => n.id !== notif.id));
    } catch { /* ignore */ }
  };

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      await fetch(`${import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8080'}/realms/${import.meta.env.VITE_KEYCLOAK_REALM || 'sigba-realm'}/protocol/openid-connect/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'sigba-frontend',
          refresh_token: refreshToken
        })
      }).catch(() => {});
    }
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    navigate('/login');
  };

  const navItems = navByRole[user?.role] || navByRole.SUPER_ADMIN;

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const currentPage = navItems.find((item) => isActive(item.to))?.label || 'Portail Badges';

  const initials = user ? `${user.prenom?.charAt(0) || ''}${user.nom?.charAt(0) || ''}`.toUpperCase() : '?';

  const showNotifications = user?.role && user.role !== 'SUPER_ADMIN';

  const navigateTo = useCallback((path) => {
    navigate(path);
  }, [navigate]);

  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center gap-2 px-1 py-1 group-data-[collapsible=icon]:justify-center">
            <img src="/logo_ram.png" alt="RAM" className="size-8 shrink-0 object-contain" />
            <span className="truncate text-base font-semibold group-data-[collapsible=icon]:hidden">
              RAM Badges
            </span>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton
                      isActive={isActive(item.to)}
                      tooltip={item.label}
                      onClick={() => navigateTo(item.to)}
                      className={isActive(item.to) ? "bg-[#C20831]! text-white! hover:bg-[#C20831]! hover:text-white! data-active:bg-[#C20831]! data-active:text-white! data-active:hover:bg-[#C20831]! data-active:hover:text-white!" : undefined}
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t p-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={handleLogout} tooltip="Se déconnecter">
                <LogOut className="size-4" />
                <span>Se déconnecter</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-3 border-b bg-background px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-6" />
          <span className="text-sm font-semibold tracking-tight hidden sm:block whitespace-nowrap">
            {currentPage}
          </span>
          <div className="flex-1" />
          {user && (
            <>
              {showNotifications && (
                <DropdownMenu onOpenChange={(open) => { if (open) fetchNotifications(); }}>
                  <DropdownMenuTrigger
                    render={
                      <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
                        <Bell className="size-5" />
                        {unreadCount > 0 && (
                          <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </span>
                        )}
                      </Button>
                    }
                  >
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80">
                    <div className="p-2 text-sm font-medium border-b">Notifications</div>
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-xs text-muted-foreground">Aucune notification</div>
                    ) : (
                      notifications.map((n) => {
                        const cfg = getNotificationConfig(n.typeNotification);
                        const Icon = cfg.icon;
                        return (
                          <DropdownMenuItem
                            key={n.id}
                            onClick={() => handleNotificationClick(n)}
                            className={`group/item cursor-pointer items-start gap-3 py-2 pr-2 ${!n.lu ? 'bg-muted/50' : ''}`}
                          >
                            <span className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full ${cfg.bgClass}`}>
                              <Icon className={`size-4 ${cfg.iconClass}`} />
                            </span>
                            <span className="min-w-0 flex-1">
                              <p className="text-sm font-medium leading-snug">{n.message}</p>
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                {cfg.label} · {formatRelativeTime(n.createdAt)}
                              </p>
                            </span>
                            {!n.lu && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-6 shrink-0 text-muted-foreground opacity-0 group-hover/item:opacity-100"
                                onClick={(e) => { e.stopPropagation(); handleMarkRead(n); }}
                                aria-label="Marquer comme lue"
                                title="Marquer comme lue"
                              >
                                <CheckCircle2 className="size-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-6 shrink-0 text-muted-foreground opacity-0 group-hover/item:opacity-100 hover:text-destructive"
                              onClick={(e) => { e.stopPropagation(); handleDeleteNotification(n); }}
                              aria-label="Supprimer"
                              title="Supprimer"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </DropdownMenuItem>
                        );
                      })
                    )}
                    {unreadCount > 0 && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleMarkAllRead} className="cursor-pointer justify-center text-xs text-muted-foreground">
                          Tout marquer comme lu ({unreadCount})
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/notifications')} className="cursor-pointer justify-center text-xs font-medium">
                      Voir toutes les notifications
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant="ghost" className="flex items-center gap-2 h-9 px-2">
                      <Avatar className="size-7">
                        {user.photoUrl ? (
                          <AvatarImage src={user.photoUrl} alt="Avatar" />
                        ) : (
                          <AvatarFallback className="text-xs font-medium">{initials}</AvatarFallback>
                        )}
                      </Avatar>
                      <span className="text-sm font-medium hidden md:block">{user.prenom} {user.nom}</span>
                      <ChevronDown className="size-3 text-muted-foreground hidden md:block" />
                    </Button>
                  }
                >
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center gap-2 px-2 py-1.5">
                    <Avatar className="size-8">
                      {user.photoUrl ? (
                        <AvatarImage src={user.photoUrl} alt="Avatar" />
                      ) : (
                        <AvatarFallback className="text-xs font-medium">{initials}</AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{user.prenom} {user.nom}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/parametres')} className="cursor-pointer">
                    <User className="size-4" />
                    Profil
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive cursor-pointer">
                    <LogOut className="size-4" />
                    Se déconnecter
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </header>
        <main className="flex-1 p-4 sm:p-6 bg-muted">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
