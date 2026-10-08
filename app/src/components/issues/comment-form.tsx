'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Send, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface CommentFormProps {
  ticketId: number;
}

export function CommentForm({ ticketId }: CommentFormProps) {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });
      if (res.ok) {
        setContent('');
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 pt-2">
      <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
        <MessageSquare className="size-3.5 text-primary" />
        <span>Přidat komentář do diskuze</span>
      </div>
      <Textarea
        rows={3}
        placeholder="Napište komentář... (podporuje Markdown)"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="text-xs"
        required
      />
      <div className="flex justify-end">
        <Button
          type="submit"
          size="sm"
          className="text-xs gap-1.5"
          disabled={submitting || !content.trim()}
        >
          <Send className="size-3.5" />
          {submitting ? 'Odesílám...' : 'Odeslat komentář'}
        </Button>
      </div>
    </form>
  );
}

