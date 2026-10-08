'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { LocaleToggle } from '@/components/layout/locale-toggle';
import { useI18n } from '@/components/providers/locale-provider';

export default function LoginPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [email, setEmail] = useState('admin@tickethub.local');
  const [password, setPassword] = useState('Heslo1234!');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Přihlášení se nezdařilo');
        return;
      }

      router.push('/');
      router.refresh();
    } catch {
      setError('Chyba při komunikaci se serverem');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-muted/20 relative">
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <LocaleToggle />
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-bold text-xl shadow-lg">
            TH
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{t.app.title}</h1>
          <p className="text-xs text-muted-foreground">{t.app.tagline}</p>
        </div>

        <Card className="border shadow-md">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-lg">{t.app.login}</CardTitle>
            <CardDescription className="text-xs">{t.app.welcome}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive" className="py-2 text-xs">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vas.email@tickethub.local"
                    className="pl-9 text-xs"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Heslo</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-9 text-xs"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full text-xs" disabled={loading}>
                {loading ? t.common.loading : t.app.login}
                <ArrowRight className="ml-1.5 size-3.5" />
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col gap-2 pt-0 border-t mt-2 pt-3 bg-muted/10 text-center">
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <ShieldCheck className="size-3.5 text-emerald-500" />
              <span>Demo účet správce: <strong>admin@tickethub.local</strong> / <strong>Heslo1234!</strong></span>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

