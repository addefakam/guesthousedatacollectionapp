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
  Calendar,
  Plus,
  X,
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { locationData } from '@/lib/location-data';

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

interface MeetingData {
  id: string;
  title: string;
  date: string;
  status: string;
}

interface AssignmentData {
  id: string;
  collectorId: string;
  meetingId: string;
  subCity: string;
  area: string;
}

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

  // Edit state (general assignment)
  const [editSubCity, setEditSubCity] = useState('');
  const [editArea, setEditArea] = useState('');

  // Meeting assignment state
  const [meetings, setMeetings] = useState<MeetingData[]>([]);
  const [assignments, setAssignments] = useState<AssignmentData[]>([]);
  const [assigningCollectorId, setAssigningCollectorId] = useState<string | null>(null);
  const [assignMeetingId, setAssignMeetingId] = useState('');
  const [selectedAreas, setSelectedAreas] = useState<Record<string, boolean>>({}); // "subCity|area" -> checked
  const [savingAssignments, setSavingAssignments] = useState(false);

  // Use the same location data as SurveyForm (source of truth)
  const subCities = locationData.subCities.map((sc) => sc.name);
  const areasBySubCity: Record<string, string[]> = {};
  for (const sc of locationData.subCities) {
    areasBySubCity[sc.name] = sc.areas;
  }

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

  const fetchMeetings = useCallback(async () => {
    try {
      const res = await fetch('/api/meetings');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMeetings(data);
    } catch { /* ignore */ }
  }, []);

  const fetchAssignments = useCallback(async () => {
    try {
      const res = await fetch('/api/assignments');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setAssignments(data);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => { fetchMeetings(); }, [fetchMeetings]);
  useEffect(() => { fetchAssignments(); }, [fetchAssignments]);

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

  // Open meeting assignment panel for a collector
  const openMeetingAssignment = (collectorId: string) => {
    setAssigningCollectorId(collectorId);
    setAssignMeetingId('');
    setSelectedAreas({});
  };

  // When meeting changes, load existing assignments for this collector+meeting
  const handleMeetingSelect = (meetingId: string) => {
    setAssignMeetingId(meetingId);
    if (!meetingId || !assigningCollectorId) {
      setSelectedAreas({});
      return;
    }
    // Pre-check areas that are already assigned
    const existing = assignments.filter(
      (a) => a.collectorId === assigningCollectorId && a.meetingId === meetingId
    );
    const checked: Record<string, boolean> = {};
    for (const a of existing) {
      checked[`${a.subCity}|${a.area}`] = true;
    }
    setSelectedAreas(checked);
  };

  const toggleArea = (key: string) => {
    setSelectedAreas((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Select/deselect all areas in a sub-city
  const toggleSubCityAll = (sc: string, checked: boolean) => {
    setSelectedAreas((prev) => {
      const next = { ...prev };
      for (const area of areasBySubCity[sc] || []) {
        next[`${sc}|${area}`] = checked;
      }
      return next;
    });
  };

  // Save meeting assignments
  const handleSaveMeetingAssignments = async () => {
    if (!assigningCollectorId || !assignMeetingId) return;
    setSavingAssignments(true);
    try {
      // First, remove all existing assignments for this collector+meeting
      const existing = assignments.filter(
        (a) => a.collectorId === assigningCollectorId && a.meetingId === assignMeetingId
      );
      for (const a of existing) {
        await fetch('/api/assignments', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: a.id }),
        });
      }

      // Then create new ones
      const newAssignments = Object.entries(selectedAreas)
        .filter(([, checked]) => checked)
        .map(([key]) => {
          const [subCity, area] = key.split('|');
          return { subCity, area };
        });

      if (newAssignments.length > 0) {
        const res = await fetch('/api/assignments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            collectorId: assigningCollectorId,
            meetingId: assignMeetingId,
            assignments: newAssignments,
          }),
        });
        if (!res.ok) throw new Error();
      }

      await fetchAssignments();
      toast({
        title: 'Meeting Assignments Saved',
        description: `${newAssignments.length} woreda(s) assigned for this meeting.`,
      });
    } catch {
      toast({ title: 'Error', description: 'Failed to save assignments', variant: 'destructive' });
    } finally {
      setSavingAssignments(false);
    }
  };

  // Remove a single meeting assignment
  const handleRemoveAssignment = async (assignmentId: string) => {
    try {
      const res = await fetch('/api/assignments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: assignmentId }),
      });
      if (!res.ok) throw new Error();
      fetchAssignments();
      toast({ title: 'Removed', description: 'Assignment removed.' });
    } catch {
      toast({ title: 'Error', description: 'Failed to remove', variant: 'destructive' });
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

  // Shared select renderer
  const renderAreaSelects = (
    scValue: string,
    areaValue: string,
    onScChange: (v: string) => void,
    onAreaChange: (v: string) => void,
    className: string,
  ) => (
    <>
      <div className="space-y-2">
        <Label>Assigned Sub-City</Label>
        <select
          className={className}
          value={scValue}
          onChange={(e) => { onScChange(e.target.value); onAreaChange(''); }}
        >
          <option value="">— Select —</option>
          {subCities.map((sc) => <option key={sc} value={sc}>{sc}</option>)}
        </select>
      </div>
      <div className="space-y-2">
        <Label>Assigned Woreda</Label>
        <select
          className={className}
          value={areaValue}
          onChange={(e) => onAreaChange(e.target.value)}
          disabled={!scValue}
        >
          <option value="">— Select —</option>
          {(areasBySubCity[scValue] || []).map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>
    </>
  );

  // Get assignments for a collector grouped by meeting
  const getCollectorMeetingAssignments = (collectorId: string) => {
    const collectorAssignments = assignments.filter((a) => a.collectorId === collectorId);
    const byMeeting: Record<string, { meeting: MeetingData | undefined; areas: AssignmentData[] }> = {};
    for (const a of collectorAssignments) {
      if (!byMeeting[a.meetingId]) {
        const meeting = meetings.find((m) => m.id === a.meetingId);
        byMeeting[a.meetingId] = { meeting, areas: [] };
      }
      byMeeting[a.meetingId].areas.push(a);
    }
    return byMeeting;
  };

  const activeMeetings = meetings.filter((m) => m.status === 'ACTIVE');
  const allMeetings = meetings.filter((m) => m.status === 'ACTIVE' || m.status === 'COMPLETED');

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

      {/* Create User Card */}
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
              {renderAreaSelects(newSubCity, newArea, setNewSubCity, setNewArea, 'w-full rounded-md border bg-background px-3 py-2 text-sm')}
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

      {/* Users List */}
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
              {users.map((u) => {
                const meetingAssignments = getCollectorMeetingAssignments(u.id);
                const isAssigningMeeting = assigningCollectorId === u.id;

                return (
                  <div key={u.id} className="rounded-lg border p-3">
                    {/* User header */}
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
                              <span className="text-amber-500">No default assignment</span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {u.role !== 'ADMIN' && (
                          <>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:text-blue-600" onClick={() => startEdit(u)} title="Edit default area">
                              <MapPin className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-violet-500 hover:text-violet-600" onClick={() => openMeetingAssignment(u.id)} title="Assign woreda for meeting">
                              <Calendar className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => setDeleteId(u.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Inline edit default assignment */}
                    {editingId === u.id && (
                      <div className="mt-3 pt-3 border-t space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">Default Sub-City & Woreda (for survey):</p>
                        <div className="grid grid-cols-2 gap-2">
                          {renderAreaSelects(editSubCity, editArea, setEditSubCity, setEditArea, 'rounded-md border bg-background px-2 py-1.5 text-xs')}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" className="text-xs h-7 bg-emerald-600 hover:bg-emerald-700" onClick={() => handleAssign(u.id)}>Save</Button>
                          <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => setEditingId(null)}>Cancel</Button>
                        </div>
                      </div>
                    )}

                    {/* Meeting-specific assignment panel */}
                    {isAssigningMeeting && (
                      <div className="mt-3 pt-3 border-t space-y-3">
                        <p className="text-xs font-medium text-muted-foreground">
                          Assign woreda for meeting (attendance):
                        </p>

                        {/* Meeting selector */}
                        <div className="space-y-1.5">
                          <Label className="text-xs">Select Meeting</Label>
                          <select
                            className="w-full rounded-md border bg-background px-2 py-1.5 text-xs"
                            value={assignMeetingId}
                            onChange={(e) => handleMeetingSelect(e.target.value)}
                          >
                            <option value="">— Select Meeting —</option>
                            {allMeetings.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.title} ({m.status})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Area checkboxes */}
                        {assignMeetingId && (
                          <div className="space-y-2">
                            <p className="text-xs text-muted-foreground">
                              Select woreda to assign for this meeting:
                            </p>
                            {subCities.map((sc) => {
                              const areas = areasBySubCity[sc] || [];
                              const allChecked = areas.every((a) => selectedAreas[`${sc}|${a}`]);
                              const someChecked = areas.some((a) => selectedAreas[`${sc}|${a}`]);

                              return (
                                <div key={sc} className="rounded-md border p-2">
                                  <label className="flex items-center gap-2 text-xs font-medium mb-1.5 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={allChecked}
                                      ref={(el) => {
                                        if (el) el.indeterminate = someChecked && !allChecked;
                                      }}
                                      onChange={() => toggleSubCityAll(sc, !allChecked)}
                                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                    />
                                    {sc}
                                    {someChecked && (
                                      <Badge variant="secondary" className="text-[10px] ml-auto">
                                        {areas.filter((a) => selectedAreas[`${sc}|${a}`]).length}/{areas.length}
                                      </Badge>
                                    )}
                                  </label>
                                  <div className="grid grid-cols-2 gap-1 ml-5">
                                    {areas.map((area) => {
                                      const key = `${sc}|${area}`;
                                      return (
                                        <label key={key} className="flex items-center gap-1.5 text-[11px] cursor-pointer">
                                          <input
                                            type="checkbox"
                                            checked={!!selectedAreas[key]}
                                            onChange={() => toggleArea(key)}
                                            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                          />
                                          {area}
                                        </label>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}

                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                className="text-xs h-7 bg-emerald-600 hover:bg-emerald-700"
                                disabled={savingAssignments}
                                onClick={handleSaveMeetingAssignments}
                              >
                                {savingAssignments ? (
                                  <><Loader2 className="mr-1 h-3 w-3 animate-spin" /> Saving...</>
                                ) : (
                                  <><Check className="mr-1 h-3 w-3" /> Save Assignments</>
                                )}
                              </Button>
                              <span className="text-[10px] text-muted-foreground">
                                {Object.values(selectedAreas).filter(Boolean).length} woreda selected
                              </span>
                            </div>
                          </div>
                        )}

                        <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => setAssigningCollectorId(null)}>
                          Close
                        </Button>
                      </div>
                    )}

                    {/* Show existing meeting assignments */}
                    {u.role !== 'ADMIN' && Object.keys(meetingAssignments).length > 0 && !isAssigningMeeting && (
                      <div className="mt-2 pt-2 border-t">
                        <p className="text-[10px] font-medium text-muted-foreground mb-1">Meeting assignments:</p>
                        <div className="space-y-1">
                          {Object.entries(meetingAssignments).map(([meetingId, data]) => (
                            <div key={meetingId} className="text-[10px]">
                              <span className="font-medium text-violet-600">
                                {data.meeting?.title || 'Meeting'}:
                              </span>{' '}
                              {data.areas.map((a, i) => (
                                <span key={a.id}>
                                  {i > 0 && ', '}
                                  <span className="text-emerald-600">{a.subCity} — {a.area}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveAssignment(a.id)}
                                    className="ml-0.5 inline-flex text-red-400 hover:text-red-600"
                                    title="Remove"
                                  >
                                    <X className="h-2.5 w-2.5" />
                                  </button>
                                </span>
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
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
