'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthProvider';
import {
  UserPlus,
  Trash2,
  Copy,
  Check,
  Users,
  Shield,
  Loader2,
  LogOut,
  MapPin,
} from 'lucide-react';
import { signOut } from 'next-auth/react';

interface UserData {
  id: string;
  username: string;
  name: string;
  role: string;
  assignedSubCity?: string | null;
  assignedArea?: string | null;
  createdAt: string;
}

interface NewUserResponse {
  id: string;
  username: string;
  name: string;
  role: string;
  plainPassword: string;
  createdAt: string;
}

// Available sub-cities and areas in Bishoftu
const SUB_CITIES = ['Daka', 'Burka', 'Bekelcha', 'Kore'];
const AREAS_BY_SUBCITY: Record<string, string[]> = {
  Daka: ['01', '02', '03', '04', '05', '06'],
  Burka: ['01', '02', '03', '04', '05'],
  Bekelcha: ['01', '02', '03', '04'],
  Kore: ['01', '02', '03', '04', '05'],
};

export default function AdminPanel() {
  const { userName } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [newName, setNewName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newSubCity, setNewSubCity] = useState('');
  const [newArea, setNewArea] = useState('');
  const [createdUser, setCreatedUser] = useState<NewUserResponse | null>(null);

  // Edit state
  const [editSubCity, setEditSubCity] = useState('');
  const [editArea, setEditArea] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setUsers(data);
    } catch {
      toast({ title: 'Error', description: 'Failed to load users', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newUsername || !newPassword) return;

    setCreating(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          username: newUsername,
          password: newPassword,
          assignedSubCity: newSubCity || null,
          assignedArea: newArea || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create user');
      }

      const user = await res.json();
      setCreatedUser(user);
      setNewName('');
      setNewUsername('');
      setNewPassword('');
      setNewSubCity('');
      setNewArea('');
      fetchUsers();
      toast({ title: 'Walitti Qabaa Daataa', description: `Credentials for ${user.name} are ready to share.` });
    } catch (error) {
      toast({
        title: 'Creation Failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/users/${deleteId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast({ title: 'Deleted', description: 'User removed.' });
      fetchUsers();
    } catch {
      toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' });
    }
    setDeleteId(null);
  };

  const handleAssign = async (userId: string) => {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignedSubCity: editSubCity || null,
          assignedArea: editArea || null,
        }),
      });
      if (!res.ok) throw new Error();
      setEditingId(null);
      fetchUsers();
      toast({ title: 'Assignment Updated', description: 'Area assignment saved.' });
    } catch {
      toast({ title: 'Error', description: 'Failed to update assignment', variant: 'destructive' });
    }
  };

  const copyCredentials = (user: NewUserResponse) => {
    const text = `Username: ${user.username}\nPassword: ${user.plainPassword || '(hashed, cannot show original)'}`;
    navigator.clipboard.writeText(text);
    setCopiedId(user.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let pass = '';
    for (let i = 0; i < 8; i++) pass += chars[Math.floor(Math.random() * chars.length)];
    setNewPassword(pass);
  };

  const startEdit = (u: UserData) => {
    setEditingId(u.id);
    setEditSubCity(u.assignedSubCity || '');
    setEditArea(u.assignedArea || '');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-emerald-600" />
          <span className="text-sm font-medium text-muted-foreground">
            Logged in as <span className="font-semibold text-foreground">{userName}</span>
          </span>
        </div>
        <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: '/' })}>
          <LogOut className="mr-1 h-4 w-4" />
          Logout
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <UserPlus className="h-5 w-5 text-emerald-600" />
            Walitti Qabaa Daataa
          </CardTitle>
          <CardDescription>
            Create accounts and assign sub-city/woreda to data collectors
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="newName">Full Name</Label>
              <Input id="newName" placeholder="e.g., Abebe Kebede" value={newName} onChange={(e) => setNewName(e.target.value)} required />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="newUsername">Username</Label>
                <Input id="newUsername" placeholder="e.g., abebe01" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">Password</Label>
                <div className="flex gap-2">
                  <Input id="newPassword" placeholder="Set password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                  <Button type="button" variant="outline" size="icon" className="shrink-0" onClick={generatePassword} title="Auto-generate password">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Assigned Sub-City</Label>
                <select
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  value={newSubCity}
                  onChange={(e) => { setNewSubCity(e.target.value); setNewArea(''); }}
                >
                  <option value="">— Select —</option>
                  {SUB_CITIES.map((sc) => <option key={sc} value={sc}>{sc}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Assigned Woreda</Label>
                <select
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  value={newArea}
                  onChange={(e) => setNewArea(e.target.value)}
                  disabled={!newSubCity}
                >
                  <option value="">— Select —</option>
                  {(AREAS_BY_SUBCITY[newSubCity] || []).map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            </div>
            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={creating}>
              {creating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</> : 'Walitti Qabaa Daataa'}
            </Button>
          </form>

          {createdUser && (
            <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <p className="mb-2 text-sm font-semibold text-emerald-800">Share these credentials with {createdUser.name}:</p>
              <div className="space-y-1 rounded bg-white p-3 font-mono text-sm">
                <p><span className="text-muted-foreground">Username:</span> {createdUser.username}</p>
                <p><span className="text-muted-foreground">Password:</span> {createdUser.plainPassword}</p>
              </div>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => copyCredentials(createdUser)}>
                {copiedId === createdUser.id ? <><Check className="mr-1 h-3 w-3" /> Copied!</> : <><Copy className="mr-1 h-3 w-3" /> Copy Credentials</>}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-emerald-600" />
            Fayyadamtoota Hundaa
            <Badge variant="secondary" className="ml-auto">{users.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : (
            <div className="space-y-2">
              {users.map((u) => (
                <div key={u.id} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-medium">{u.name}</p>
                        <Badge variant={u.role === 'ADMIN' ? 'default' : 'outline'} className="text-xs">{u.role}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">@{u.username}</p>
                      {u.role !== 'ADMIN' && (
                        <div className="flex items-center gap-1.5 mt-1 text-[10px]">
                          <MapPin className="h-3 w-3 text-slate-400" />
                          {u.assignedSubCity && u.assignedArea ? (
                            <span className="text-emerald-600 font-medium">{u.assignedSubCity} — {u.assignedArea}</span>
                          ) : (
                            <span className="text-amber-500">Not assigned</span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {u.role !== 'ADMIN' && (
                        <>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:text-blue-600" onClick={() => startEdit(u)} title="Assign area">
                            <MapPin className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => setDeleteId(u.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Inline edit assignment */}
                  {editingId === u.id && (
                    <div className="mt-3 pt-3 border-t space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Assign Sub-City & Woreda:</p>
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          className="rounded-md border bg-background px-2 py-1.5 text-xs"
                          value={editSubCity}
                          onChange={(e) => { setEditSubCity(e.target.value); setEditArea(''); }}
                        >
                          <option value="">— Sub-City —</option>
                          {SUB_CITIES.map((sc) => <option key={sc} value={sc}>{sc}</option>)}
                        </select>
                        <select
                          className="rounded-md border bg-background px-2 py-1.5 text-xs"
                          value={editArea}
                          onChange={(e) => setEditArea(e.target.value)}
                          disabled={!editSubCity}
                        >
                          <option value="">— Woreda —</option>
                          {(AREAS_BY_SUBCITY[editSubCity] || []).map((a) => <option key={a} value={a}>{a}</option>)}
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" className="text-xs h-7 bg-emerald-600 hover:bg-emerald-700" onClick={() => handleAssign(u.id)}>Save</Button>
                        <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => setEditingId(null)}>Cancel</Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Haqa Walitti Qabaa Daataa?</AlertDialogTitle>
            <AlertDialogDescription>This will remove the user and they will no longer be able to log in.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
