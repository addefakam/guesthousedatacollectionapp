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

interface MeetingAssignment {
  id: string;
  collectorId: string;
  meetingId: string;
  subCity: string;
  area: string;
}

export default function CollectorAttendance() {
  const { userId, userName } = useAuth();
  const { toast } = useToast();
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [guestHouses, setGuestHouses] = useState<GuestHouseRecord[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, string>>({}); // guestHouseId -> status
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null); // guestHouseId being toggled

  // Assignment state: meeting-specific assignments + general fallback
  const [meetingAssignments, setMeetingAssignments] = useState<MeetingAssignment[]>([]);
  const [generalSubCity, setGeneralSubCity] = useState<string | null>(null);
  const [generalArea, setGeneralArea] = useState<string | null>(null);

  // Fetch general assignment from /api/users/me
  useEffect(() => {
    async function fetchGeneralAssignment() {
      try {
        const res = await fetch('/api/users/me');
        if (res.ok) {
          const data = await res.json();
          setGeneralSubCity(data.assignedSubCity || null);
          setGeneralArea(data.assignedArea || null);
        }
      } catch { /* ignore */ }
    }
    fetchGeneralAssignment();
  }, []);

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

  // Fetch meeting-specific assignments for this collector
  useEffect(() => {
    async function fetchMeetingAssignments() {
      try {
        const res = await fetch('/api/assignments');
        if (res.ok) {
          const data: MeetingAssignment[] = await res.json();
          setMeetingAssignments(data);
        }
      } catch { /* ignore */ }
    }
    fetchMeetingAssignments();
  }, []);

  // Determine which areas this collector should see for this meeting
  const assignedAreasForMeeting = useCallback((): { subCity: string; area: string }[] => {
    if (!meeting) return [];

    // Priority 1: meeting-specific assignments
    const meetingSpecific = meetingAssignments.filter(
      (a) => a.meetingId === meeting.id
    );
    if (meetingSpecific.length > 0) {
      return meetingSpecific.map((a) => ({ subCity: a.subCity, area: a.area }));
    }

    // Priority 2: general assignment (fallback)
    if (generalSubCity && generalArea) {
      return [{ subCity: generalSubCity, area: generalArea }];
    }

    return [];
  }, [meeting, meetingAssignments, generalSubCity, generalArea]);

  // Fetch guest houses for assigned areas + existing attendance
  const loadData = useCallback(async () => {
    const areas = assignedAreasForMeeting();
    if (areas.length === 0) {
      setGuestHouses([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Fetch guest houses for each assigned sub-city, then filter by area
      const subCitiesToFetch = [...new Set(areas.map((a) => a.subCity))];
      const allGH: GuestHouseRecord[] = [];

      for (const sc of subCitiesToFetch) {
        const ghRes = await fetch(
          `/api/guesthouses/details?filterBy=subCity&value=${encodeURIComponent(sc)}`
        );
        if (!ghRes.ok) continue;
        const ghData = await ghRes.json();
        const assignedAreasInSC = areas.filter((a) => a.subCity === sc).map((a) => a.area);
        const filtered = (ghData.records || []).filter(
          (r: GuestHouseRecord) => assignedAreasInSC.includes(r.area)
        );
        allGH.push(...filtered);
      }

      // Sort by sub-city, then area, then name
      allGH.sort((a, b) => {
        if (a.subCity !== b.subCity) return a.subCity.localeCompare(b.subCity);
        if (a.area !== b.area) return a.area.localeCompare(b.area);
        return a.guestHouseName.localeCompare(b.guestHouseName);
      });
      setGuestHouses(allGH);

      // Fetch existing attendance if meeting exists
      if (meeting?.id) {
        // Fetch attendance for all assigned sub-cities
        const attMap: Record<string, string> = {};
        for (const sc of subCitiesToFetch) {
          const attRes = await fetch(
            `/api/attendance?meetingId=${meeting.id}&subCity=${encodeURIComponent(sc)}`
          );
          if (attRes.ok) {
            const attData = await attRes.json();
            for (const rec of attData.records || []) {
              attMap[rec.guestHouseId] = rec.status;
            }
          }
        }
        setAttendanceMap(attMap);
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to load data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [assignedAreasForMeeting, meeting?.id, toast]);

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
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Failed (${res.status})`);
      }
    } catch (error) {
      // Revert on failure
      setAttendanceMap((prev) => ({ ...prev, [guestHouseId]: currentStatus }));
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update attendance',
        variant: 'destructive',
      });
    } finally {
      setToggling(null);
    }
  };

  const presentCount = Object.values(attendanceMap).filter((s) => s === 'PRESENT').length;
  const totalMarked = Object.keys(attendanceMap).length;
  const totalGH = guestHouses.length;
  const areas = assignedAreasForMeeting();
  const hasAssignments = areas.length > 0;

  if (!hasAssignments) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <MapPin className="mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm font-medium text-muted-foreground">No Area Assigned</p>
          <p className="mt-1 text-xs text-muted-foreground/70">
            Contact your admin to get assigned to woreda for this meeting.
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

  // Group guest houses by sub-city, then area
  const groupedBySubCity: Record<string, Record<string, GuestHouseRecord[]>> = {};
  for (const gh of guestHouses) {
    if (!groupedBySubCity[gh.subCity]) groupedBySubCity[gh.subCity] = {};
    if (!groupedBySubCity[gh.subCity][gh.area]) groupedBySubCity[gh.subCity][gh.area] = [];
    groupedBySubCity[gh.subCity][gh.area].push(gh);
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
          <div className="flex flex-wrap gap-1.5">
            {areas.map((a) => (
              <Badge key={`${a.subCity}|${a.area}`} variant="outline" className="text-[10px]">
                <MapPin className="mr-1 h-2.5 w-2.5" />
                {a.subCity} — {a.area}
              </Badge>
            ))}
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

      {/* Guest House List - grouped by sub-city and area */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
        </div>
      ) : guestHouses.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            No guest houses found in your assigned areas
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedBySubCity).sort().map(([subCity, areasInSC]) => (
            <div key={subCity}>
              {Object.entries(areasInSC).sort().map(([area, ghList]) => {
                const areaPresent = ghList.filter((gh) => attendanceMap[gh.id] === 'PRESENT').length;
                return (
                  <div key={`${subCity}|${area}`} className="mb-3">
                    {/* Area header */}
                    <div className="flex items-center justify-between mb-1.5 px-1">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{subCity} — {area}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        <span className="text-emerald-600 font-semibold">{areaPresent}</span>/{ghList.length} present
                      </span>
                    </div>

                    {/* Guest houses in this area */}
                    <div className="space-y-1.5">
                      {ghList.map((gh) => {
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
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
