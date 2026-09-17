'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Plus, CheckCircle2, Clock, XCircle, Loader2, Trash2 } from 'lucide-react';

interface Meeting {
  id: string;
  title: string;
  date: string;
  status: string;
  createdAt: string;
  _count?: { attendances: number };
}

export default function MeetingManager() {
  const { toast } = useToast();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');

  const fetchMeetings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/meetings');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMeetings(data);
    } catch {
      toast({ title: 'Error', description: 'Failed to load meetings', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchMeetings(); }, [fetchMeetings]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date) return;
    setCreating(true);
    try {
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, date, status: 'ACTIVE' }),
      });
      if (!res.ok) throw new Error();
      setTitle('');
      setDate('');
      fetchMeetings();
      toast({ title: 'Meeting Created', description: 'Meeting is now active for attendance.' });
    } catch {
      toast({ title: 'Error', description: 'Failed to create meeting', variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/meetings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      fetchMeetings();
      toast({ title: 'Meeting Updated', description: `Status changed to ${status}` });
    } catch {
      toast({ title: 'Error', description: 'Failed to update', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/meetings/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      fetchMeetings();
      toast({ title: 'Deleted', description: 'Meeting removed.' });
    } catch {
      toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' });
    }
  };

  const statusBadge = (s: string) => {
    if (s === 'ACTIVE') return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Active</Badge>;
    if (s === 'COMPLETED') return <Badge className="bg-slate-100 text-slate-700 border-slate-200">Completed</Badge>;
    return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Upcoming</Badge>;
  };

  const statusIcon = (s: string) => {
    if (s === 'ACTIVE') return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    if (s === 'COMPLETED') return <XCircle className="h-4 w-4 text-slate-400" />;
    return <Clock className="h-4 w-4 text-amber-500" />;
  };

  return (
    <div className="space-y-4">
      {/* Create Meeting */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Plus className="h-5 w-5 text-emerald-600" />
            Create Meeting
          </CardTitle>
          <CardDescription>Start a new meeting for attendance tracking</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="meetingTitle">Meeting Title</Label>
              <Input
                id="meetingTitle"
                placeholder="e.g., Hotel Owners Meeting - Sep 2026"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meetingDate">Meeting Date</Label>
              <Input
                id="meetingDate"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={creating}>
              {creating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</> : 'Create Meeting'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Meetings List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5 text-emerald-600" />
            All Meetings
            <Badge variant="secondary" className="ml-auto">{meetings.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : meetings.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">No meetings yet</p>
          ) : (
            <div className="space-y-2">
              {meetings.map((m) => (
                <div key={m.id} className="rounded-lg border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {statusIcon(m.status)}
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{m.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(m.date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {statusBadge(m.status)}
                    </div>
                  </div>
                  {m._count !== undefined && (
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      {m._count.attendances} attendance record{m._count.attendances !== 1 ? 's' : ''}
                    </p>
                  )}
                  <div className="mt-2 flex items-center gap-2">
                    {m.status === 'ACTIVE' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-7"
                        onClick={() => handleStatusChange(m.id, 'COMPLETED')}
                      >
                        <CheckCircle2 className="mr-1 h-3 w-3" /> Close Meeting
                      </Button>
                    )}
                    {m.status === 'UPCOMING' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-7"
                        onClick={() => handleStatusChange(m.id, 'ACTIVE')}
                      >
                        <CheckCircle2 className="mr-1 h-3 w-3" /> Activate
                      </Button>
                    )}
                    {m.status === 'COMPLETED' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-7"
                        onClick={() => handleStatusChange(m.id, 'ACTIVE')}
                      >
                        Reopen
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7 text-red-500 hover:text-red-600"
                      onClick={() => handleDelete(m.id)}
                    >
                      <Trash2 className="mr-1 h-3 w-3" /> Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
