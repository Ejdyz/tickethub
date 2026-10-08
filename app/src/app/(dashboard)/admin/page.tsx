import React from 'react';
import {
  Shield,
  Users,
  Database,
  CheckCircle2,
  UserCheck
} from 'lucide-react';
import { getUsers } from '@/lib/db';
import { RunProcedureButton } from '@/components/admin/run-procedure-button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const instant = false;

export default async function AdminPage() {
  const users = await getUsers();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-2 border-b">
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Shield className="size-6 text-primary" />
          Administrace systému
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Správa uživatelů, sazeb za hodinu a spouštění procedur údržby na úrovni PostgreSQL.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Management Table */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border shadow-xs overflow-hidden">
            <CardHeader className="py-3 px-4 bg-muted/20 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <Users className="size-3.5" />
                  Uživatelé a hodinové sazby ({users.length})
                </CardTitle>
                <CardDescription className="text-[11px] mt-0.5">
                  Sazby použité v hierarchickém výpočtu nákladů tiketů.
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b bg-muted/40 text-left font-medium text-muted-foreground text-[11px]">
                      <th className="py-2.5 px-3">Jméno a email</th>
                      <th className="py-2.5 px-3">Role</th>
                      <th className="py-2.5 px-3 text-right">Sazba</th>
                      <th className="py-2.5 px-3 text-center">Admin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {users.map((u: any) => (
                      <tr key={u.user_id} className="hover:bg-muted/20 transition-colors">
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-foreground">{u.name}</div>
                          <div className="text-[10px] text-muted-foreground">{u.email}</div>
                        </td>
                        <td className="py-2.5 px-3">
                          <Badge variant="outline" className="text-[10px]">
                            {u.role}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-foreground">
                          {(u.hourly_rate || 750).toLocaleString()} Kč/h
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {u.is_admin ? (
                            <Badge variant="default" className="text-[10px] bg-primary text-primary-foreground">
                              Správce
                            </Badge>
                          ) : (
                            <span className="text-[10px] text-muted-foreground">Uživatel</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Database Procedures & Maintenance */}
        <div className="space-y-6">
          <Card className="border shadow-xs">
            <CardHeader className="py-3 px-4 bg-muted/20 border-b">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Database className="size-3.5 text-primary" />
                Databázové procedury (PL/pgSQL)
              </CardTitle>
              <CardDescription className="text-[11px]">
                Spouštění auditovaných rutin na úrovni PostgreSQL.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4 space-y-4 text-xs">
              <div className="p-3 rounded-lg border bg-muted/20 space-y-2">
                <div className="font-semibold text-foreground font-mono">
                  pr_close_resolved_tickets
                </div>
                <p className="text-muted-foreground text-[11px] leading-relaxed">
                  Automaticky uzavře všechny tikety ve stavu <code>Resolved</code>, které byly vyřešeny před více než 7 dny, a zapíše systémový komentář s ID administrátora.
                </p>

                <div className="pt-2 border-t">
                  <RunProcedureButton />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
