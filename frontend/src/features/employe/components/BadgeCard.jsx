import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { IdCard } from 'lucide-react';

export default function BadgeCard({ badge, photoUrl, employe, direction }) {
  return (
    <Card className="shadow-sm overflow-hidden">
      <div className="bg-primary p-3 flex items-center gap-2 text-primary-foreground">
        <IdCard className="size-5" />
        <span className="text-sm font-semibold">Badge d'accès aéroportuaire</span>
      </div>
      <CardContent className="p-4 space-y-4">
        <div className="flex gap-4">
          {photoUrl ? (
            <img src={photoUrl} alt="Photo" className="w-24 h-24 object-cover rounded-lg border shrink-0" />
          ) : (
            <div className="w-24 h-24 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <IdCard className="size-8 text-muted-foreground" />
            </div>
          )}
          <div className="space-y-1 min-w-0">
            <p className="text-lg font-bold leading-tight">{employe.prenom} {employe.nom}</p>
            <p className="text-sm text-muted-foreground">{direction}</p>
            <Badge variant={badge.statut === 'ACTIF' ? 'default' : 'destructive'} className="text-xs">
              {badge.statut}
            </Badge>
            <p className="text-xs text-muted-foreground pt-1">
              <span className="font-mono font-medium text-foreground">{badge.uidUnique}</span>
            </p>
          </div>
        </div>

        <div className="flex gap-4 items-center">
          <div className="bg-white p-2 rounded-lg border shrink-0">
            <QRCodeSVG value={badge.uidUnique} size={80} level="M" />
          </div>
          <div className="text-xs text-muted-foreground space-y-0.5">
            <p>Émis le : <span className="font-medium text-foreground">{new Date(badge.dateEmission).toLocaleDateString()}</span></p>
            {badge.dateExpiration && (
              <p>Expire le : <span className="font-medium text-foreground">{new Date(badge.dateExpiration).toLocaleDateString()}</span></p>
            )}
          </div>
        </div>

        {badge.habilitations?.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">Zones autorisées :</p>
            <div className="flex flex-wrap gap-1.5">
              {badge.habilitations.map((h, i) => (
                <Badge key={i} variant="secondary" className="text-xs">{h.zoneNom}</Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
