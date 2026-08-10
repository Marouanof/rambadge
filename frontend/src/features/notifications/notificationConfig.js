import {
  Bell,
  AlertTriangle,
  ClipboardCheck,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  PauseCircle,
  RefreshCw,
  Ban,
  ShieldAlert,
  UserCheck,
} from 'lucide-react';

export const NOTIFICATION_TYPES = {
  INCIDENT_SIGNAL: {
    label: 'Incident signale',
    icon: AlertTriangle,
    iconClass: 'text-[#A67C00]',
    bgClass: 'bg-[#F1BE5B]/15',
  },
  DEMANDE_N1: {
    label: 'Demande N1',
    icon: FileText,
    iconClass: 'text-[#674459]',
    bgClass: 'bg-[#674459]/10',
  },
  DEMANDE_N2: {
    label: 'Demande N2',
    icon: ClipboardCheck,
    iconClass: 'text-[#674459]',
    bgClass: 'bg-[#674459]/10',
  },
  VALIDATION: {
    label: 'Validation',
    icon: CheckCircle2,
    iconClass: 'text-[#008B60]',
    bgClass: 'bg-[#008B60]/10',
  },
  REFUS: {
    label: 'Refus',
    icon: XCircle,
    iconClass: 'text-[#C20831]',
    bgClass: 'bg-[#C20831]/10',
  },
  EXPIRATION: {
    label: 'Expiration',
    icon: Clock,
    iconClass: 'text-[#A67C00]',
    bgClass: 'bg-[#F1BE5B]/15',
  },
  SUSPENSION: {
    label: 'Suspension',
    icon: PauseCircle,
    iconClass: 'text-[#A67C00]',
    bgClass: 'bg-[#F1BE5B]/15',
  },
  REACTIVATION: {
    label: 'Reactivation',
    icon: RefreshCw,
    iconClass: 'text-[#008B60]',
    bgClass: 'bg-[#008B60]/10',
  },
  REVOCATION: {
    label: 'Revocation',
    icon: Ban,
    iconClass: 'text-[#C20831]',
    bgClass: 'bg-[#C20831]/10',
  },
  INCIDENT_DIRECTION: {
    label: 'Incident direction',
    icon: ShieldAlert,
    iconClass: 'text-[#A67C00]',
    bgClass: 'bg-[#F1BE5B]/15',
  },
  INVITATION_ACCEPTEE: {
    label: 'Invitation acceptee',
    icon: UserCheck,
    iconClass: 'text-[#008B60]',
    bgClass: 'bg-[#008B60]/10',
  },
  INVITATION_EXPIREE: {
    label: 'Invitation expiree',
    icon: Clock,
    iconClass: 'text-[#C20831]',
    bgClass: 'bg-[#C20831]/10',
  },
};

export function getNotificationConfig(type) {
  return (
    NOTIFICATION_TYPES[type] || {
      label: 'Notification',
      icon: Bell,
      iconClass: 'text-muted-foreground',
      bgClass: 'bg-muted',
    }
  );
}

export function formatRelativeTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const diffMs = Date.now() - date.getTime();
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return "a l'instant";
  const min = Math.floor(sec / 60);
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 7) return d === 1 ? 'hier' : `il y a ${d} jours`;
  return date.toLocaleDateString('fr-FR');
}
