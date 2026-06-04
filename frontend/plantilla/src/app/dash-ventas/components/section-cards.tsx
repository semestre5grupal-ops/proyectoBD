import { TrendingUp, FileText, Receipt, DollarSign } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { KpisResponse } from "../services/reportes-service"

const usd = new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const num = new Intl.NumberFormat("es-EC");

interface SectionCardsProps {
  kpis: KpisResponse | null;
  loading: boolean;
}

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  loading,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ElementType;
  loading: boolean;
}) {
  return (
    <Card className="@container/card">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        {loading ? (
          <Skeleton className="h-8 w-36 mt-1" />
        ) : (
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {value}
          </CardTitle>
        )}
        <CardAction>
          <Badge variant="outline">
            <Icon className="size-3.5" />
          </Badge>
        </CardAction>
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1.5 text-sm">
        <div className="text-muted-foreground">{sub}</div>
      </CardFooter>
    </Card>
  );
}

export function SectionCards({ kpis, loading }: SectionCardsProps) {
  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        label="Ventas del año"
        value={kpis ? usd.format(kpis.ventas_anio) : "—"}
        sub="Total facturado en el año en curso"
        icon={TrendingUp}
        loading={loading && !kpis}
      />
      <KpiCard
        label="Ventas del mes"
        value={kpis ? usd.format(kpis.ventas_mes) : "—"}
        sub="Total facturado en el mes seleccionado"
        icon={DollarSign}
        loading={loading && !kpis}
      />
      <KpiCard
        label="Facturas aprobadas"
        value={kpis ? num.format(kpis.facturas_aprobadas) : "—"}
        sub="Facturas con estado APR en el período"
        icon={FileText}
        loading={loading && !kpis}
      />
      <KpiCard
        label="Notas de crédito"
        value={kpis ? num.format(kpis.notas_credito) : "—"}
        sub="NCR emitidas en el período"
        icon={Receipt}
        loading={loading && !kpis}
      />
    </div>
  );
}
