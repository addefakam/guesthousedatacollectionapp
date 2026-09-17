'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthProvider';
import { CheckCircle2, XCircle, Loader2, Users, MapPin, Building2 } from 'lucide-react';

interface Meeting {
  id: string;
  title: string;
  date: string;
  status: string;
}

interface GuestHouseRecord {
  id: string;
  guestHouseName: string;
  subCity: string;
  area: string;
  numberOfRooms: number;
  ownerName: string | null;
  licenseType: string;
}

interface AttendanceRecord {
  id: string;
  meetingId: string;
  guestHouseId: string;
  status: string;
  guestHouse: GuestHouseRecord;
}

export default function CollectorAttendance() {
  const { assignedSubCity, assignedArea, userId, userName } = useAuth();
  const { toast } = useToast();
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [guestHouses, setGuestHouses] = useState<GuestHouseRecord[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, string>>({}); // guestHouseId -> status
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null); // guestHouseId being toggled

  // Fetch active meeting
  useEffect(() => {
    async function fetchMeeting() {
      try {
        const res = await fetch('/api/meetings');
        if (!res.ok) throw new Error();
        const data: Meeting[] = await res.json();
        const active = data.find((m) => m.status === 'ACTIVE');
        setMeeting(active || null);
      } catch { /* ignore */ }
    }
    fetchMeeting();
  }, []);

  // Fetch guest houses for assigned area + existing attendance
  const loadData = useCallback(async () => {
    if (!assignedSubCity || !assignedArea) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Fetch guest houses for this area
      const ghRes = await fetch(
        `/api/guesthouses/details?filterBy=subCity&value=${encodeURIComponent(assignedSubCity)}`
      );
      if (!ghRes.ok) throw new Error();
      const ghData = await ghRes.json();
      // Filter to only assigned area/woreda
      const filtered = (ghData.records || []).filter(
        (r: GuestHouseRecord) => r.area === assignedArea
      );
      setGuestHouses(filtered);

      // Fetch existing attendance if meeting exists
      if (meeting?.id) {
        const attRes = await fetch(
          `/api/attendance?meetingId=${meeting.id}&subCity=${encodeURIComponent(assignedSubCity)}&area=${encodeURIComponent(assignedArea)}`
        );
        if (attRes.ok) {
          const attData = await attRes.json();
          const map: Record<string, string> = {};
          for (const rec of attData.records || []) {
            map[rec.guestHouseId] = rec.status;
          }
          setAttendanceMap(map);
        }
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to load data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [assignedSubCity, assignedArea, meeting?.id, toast]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleToggle = async (guestHouseId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'PRESENT' ? 'ABSENT' : 'PRESENT';
    if (!meeting) return;

    setToggling(guestHouseId);
    // Optimistic update
    setAttendanceMap((prev) => ({ ...prev, [guestHouseId]: newStatus }));

    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meetingId: meeting.id,
          guestHouseId,
          status: newStatus,
        }),
      });
      if (!res.ok) throw new Error();
    } catch {
      // Revert on failure
      setAttendanceMap((prev) => ({ ...prev, [guestHouseId]: currentStatus }));
      toast({ title: 'Error', description: 'Failed to update attendance', variant: 'destructive' });
    } finally {
      setToggling(null);
    }
  };

  const presentCount = Object.values(attendanceMap).filter((s) => s === 'PRESENT').length;
  const totalMarked = Object.keys(attendanceMap).length;
  const totalGH = guestHouses.length;

  if (!assignedSubCity || !assignedArea) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <MapPin className="mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm font-medium text-muted-foreground">No Area Assigned</p>
          <p className="mt-1 text-xs text-muted-foreground/70">
            Contact your admin to get assigned to a sub-city and woreda.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!meeting) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Users className="mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm font-medium text-muted-foreground">No Active Meeting</p>
          <p className="mt-1 text-xs text-muted-foreground/70">
            There is no active meeting for attendance right now.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Meeting Info */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-5 w-5 text-emerald-600" />
            {meeting.title}
          </CardTitle>
          <CardDescription>
            {new Date(meeting.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            <span>{assignedSubCity} — {assignedArea}</span>
          </div>
        </CardContent>
      </Card>

      {/* Progress */}
      <Card>
        <CardContent className="p-3">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-muted-foreground">Attendance Progress</span>
            <span className="font-semibold">
              <span className="text-emerald-600">{presentCount}</span>/{totalGH} present
              {totalMarked < totalGH && <span className="text-amber-600 ml-1">({totalGH - totalMarked} unmarked)</span>}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${totalGH > 0 ? (presentCount / totalGH) * 100 : 0}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Guest House List */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
        </div>
      ) : guestHouses.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            No guest houses found in {assignedSubCity} — {assignedArea}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-1.5">
          {guestHouses.map((gh) => {
            const status = attendanceMap[gh.id] || 'ABSENT';
            const isPresent = status === 'PRESENT';
            const isToggling = toggling === gh.id;

            return (
              <Card
                key={gh.id}
                className={`transition-colors ${isPresent ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-200'}`}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-slate-400 shrink-0" />
                        <p className="text-sm font-medium truncate">{gh.guestHouseName}</p>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground ml-6">
                        <span>{gh.licenseType}</span>
                        <span>•</span>
                        <span>{gh.numberOfRooms} rooms</span>
                        {gh.ownerName && (
                          <>
                            <span>•</span>
                            <span className="truncate max-w-[100px]">{gh.ownerName}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggle(gh.id, status)}
                      disabled={isToggling}
                      className={`shrink-0 flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                        isPresent
                          ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {isToggling ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : isPresent ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5" />
                      )}
                      {isPresent ? 'Present' : 'Absent'}
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
