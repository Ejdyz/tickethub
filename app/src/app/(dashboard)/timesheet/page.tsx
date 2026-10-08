import React from 'react';
import Link from 'next/link';
import {
  Clock,
  DollarSign,
  CheckCircle2,
  Calendar,
  User as UserIcon,
  Tag as TagIcon
} from 'lucide-react';
import { getTimesheet, getTickets } from '@/lib/db';
import { AddTimesheetModal } from '@/components/timesheet/add-timesheet-modal';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const instant = false;

export default async function TimesheetPage() {
  const [reports, tickets] = await Promise.all([
    getTimesheet(),
    getTickets()
  ]);

  const totalHours = reports.reduce((acc: number, r: any) => acc + (parseFloat(r.work_hours) || 0), 0);
  const billableReports = reports.filter((r: any) => r.billable);
  const billableHours = billableReports.reduce((acc: number, r: any) => acc + (parseFloat(r.work_hours) || 0), 0);
  const totalCost = reports.reduce((acc: number, r: any) => acc + (parseFloat(r.total_cost) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Výkazy práce (Timesheet)
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Centrální evidence odpracovaného času, sazeb a nákladů na projektech.
          </p>
        </div>

        <AddTimesheetModal tickets={tickets} />
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border shadow-xs space-y-1">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Celkem odpracováno
          </span>
          <div className="text-2xl font-bold font-mono text-foreground flex items-center gap-1.5">
            <Clock className="size-5 text-primary" />
            {totalHours.toFixed(2)} h
          </div>
          <p className="text-[10px] text-muted-foreground">Napříč všemi projekty</p>
        </Card>

        <Card className="p-4 border shadow-xs space-y-1">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Fakturovatelný čas
          </span>
          <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="size-5" />
            {billableHours.toFixed(2)} h
          </div>
          <p className="text-[10px] text-muted-foreground">
            {totalHours > 0 ? Math.round((billableHours / totalHours) * 100) : 0}% z celkového času
          </p>
        </Card>

        <Card className="p-4 border shadow-xs space-y-1">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Vygenerované náklady
          </span>
          <div className="text-2xl font-bold font-mono text-foreground flex items-center gap-1.5">
            <DollarSign className="size-5 text-amber-500" />
            {totalCost.toLocaleString()} Kč
          </div>
          <p className="text-[10px] text-muted-foreground">Podle hodinových sazeb</p>
        </Card>

        <Card className="p-4 border shadow-xs space-y-1">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Počet záznamů
          </span>
          <div className="text-2xl font-bold font-mono text-foreground">
            {reports.length}
          </div>
          <p className="text-[10px] text-muted-foreground">Zapsaných výkazů práce</p>
        </Card>
      </div>

      {/* Timesheet Table */}
      <Card className="border shadow-xs overflow-hidden">
        <CardHeader className="py-3 px-4 bg-muted/20 border-b">
          <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Seznam zapsaných výkazů práce
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-muted/40 text-left font-medium text-muted-foreground text-[11px]">
                  <th className="py-2.5 px-3">Datum</th>
                  <th className="py-2.5 px-3">Uživatel</th>
                  <th className="py-2.5 px-3">Úkol</th>
                  <th className="py-2.5 px-3">Popis práce</th>
                  <th className="py-2.5 px-3 text-right">Čas</th>
                  <th className="py-2.5 px-3 text-right">Sazba</th>
                  <th className="py-2.5 px-3 text-right">Cena</th>
                  <th className="py-2.5 px-3 text-center">Fakturace</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {reports.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-muted-foreground">
                      Zatím nebyly zapsány žádné výkazy práce.
                    </td>
                  </tr>
                ) : (
                  reports.map((r: any) => (
                    <tr key={r.report_id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-3 font-mono text-muted-foreground whitespace-nowrap">
                        {r.work_date}
                      </td>
                      <td className="py-3 px-3 font-medium text-foreground whitespace-nowrap">
                        {r.user_name}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <Link
                          href={`/projects/${r.project_key}/issues/${r.ticket_id}`}
                          className="font-medium text-primary hover:underline flex items-center gap-1.5"
                        >
                          <span className="font-mono text-muted-foreground">[{r.ticket_code}]</span>
                          <span className="truncate max-w-[180px]">{r.ticket_name}</span>
                        </Link>
                      </td>
                      <td className="py-3 px-3 text-muted-foreground max-w-xs truncate">
                        {r.work_description}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-semibold text-foreground whitespace-nowrap">
                        {parseFloat(r.work_hours).toFixed(2)} h
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-muted-foreground whitespace-nowrap">
                        {(r.applied_hourly_rate || 750).toLocaleString()} Kč/h
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-foreground whitespace-nowrap">
                        {(r.total_cost || 0).toLocaleString()} Kč
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {r.billable ? (
                          <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-300">
                            Ano
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-muted-foreground">
                            Ne
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
