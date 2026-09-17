'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Users, CheckCircle2, XCircle, BarChart3, ChevronDown, MapPin } from 'lucide-react';

interface Meeting {
  id: string;
  title: string;
  date: string;
  status: string;
}

interface SummaryData {
  meetingId: string;
  totalGuestHouses: number;
  totalMarked: number;
  totalPresent: number;
  totalAbsent: number;
  summary: Record<string, {
    total: number;
    present: number;
    areas: Record<string, { total: number; present: number }>;
  }>;
}

export default function AttendanceDashboard() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<string>('');
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedSubCities, setExpandedSubCities] = useState<Set<string>>(new Set());

  const fetchMeetings = useCallback(async () => {
    try {
      const res = await fetch('/api/meetings');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMeetings(data);
      // Auto-select the first active meeting
      const active = data.find((m: Meeting) => m.status === 'ACTIVE');
      if (active) setSelectedMeeting(active.id);
      else if (data.length > 0) setSelectedMeeting(data[0].id);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchMeetings(); }, [fetchMeetings]);

  useEffect(() => {
    if (!selectedMeeting) return;
    setLoading(true);
    fetch(`/api/attendance/summary?meetingId=${selectedMeeting}`)
      .then((res) => res.json())
      .then((data) => setSummary(data))
      .catch(() => setSummary(null))
      .finally(() => setLoading(false));
  }, [selectedMeeting]);

  const toggleExpand = (sc: string) => {
    setExpandedSubCities((prev) => {
      const next = new Set(prev);
      if (next.has(sc)) next.delete(sc);
      else next.add(sc);
      return next;
    });
  };

  const meetingOptions = meetings.filter((m) => m.status === 'ACTIVE' || m.status === 'COMPLETED');

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="h-5 w-5 text-emerald-600" />
            Attendance Summary
          </CardTitle>
          <CardDescription>View attendance rate by sub-city and woreda</CardDescription>
        </CardHeader>
        <CardContent>
          {meetingOptions.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-6">
              No active or completed meetings. Create a meeting first.
            </p>
          ) : (
            <>
              <Select value={selectedMeeting} onValueChange={setSelectedMeeting}>
                <SelectTrigger className="w-full text-sm mb-3">
                  <SelectValue placeholder="Select a meeting" />
                </SelectTrigger>
                <SelectContent>
                  {meetingOptions.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.title} ({m.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
                </div>
              ) : summary ? (
                <div className="space-y-3">
                  {/* Overall stats */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-lg border p-2 text-center">
                      <p className="text-lg font-bold text-emerald-600">{summary.totalPresent}</p>
                      <p className="text-[10px] text-muted-foreground">Present</p>
                    </div>
                    <div className="rounded-lg border p-2 text-center">
                      <p className="text-lg font-bold text-red-500">{summary.totalAbsent}</p>
                      <p className="text-[10px] text-muted-foreground">Absent</p>
                    </div>
                    <div className="rounded-lg border p-2 text-center">
                      <p className="text-lg font-bold text-sky-600">
                        {summary.totalMarked > 0 ? Math.round((summary.totalPresent / summary.totalMarked) * 100) : 0}%
                      </p>
                      <p className="text-[10px] text-muted-foreground">Rate</p>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground text-center">
                    {summary.totalMarked} of {summary.totalGuestHouses} guest houses marked
                  </div>

                  {/* Sub-city breakdown */}
                  {Object.entries(summary.summary).sort().map(([subCity, data]) => {
                    const rate = data.total > 0 ? Math.round((data.present / data.total) * 100) : 0;
                    const rateColor = rate >= 80 ? 'text-emerald-600' : rate >= 50 ? 'text-amber-600' : 'text-red-500';
                    const barColor = rate >= 80 ? 'bg-emerald-500' : rate >= 50 ? 'bg-amber-500' : 'bg-red-500';
                    const isExpanded = expandedSubCities.has(subCity);

                    return (
                      <div key={subCity} className="rounded-lg border">
                        <button
                          type="button"
                          onClick={() => toggleExpand(subCity)}
                          className="w-full px-3 py-2.5 flex items-center gap-2 text-left hover:bg-muted/30 rounded-lg"
                        >
                          <div className={`shrink-0 transition-transform ${isExpanded ? 'rotate-0' : '-rotate-90'}`}>
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-semibold text-sm">{subCity}</span>
                              <div className="flex items-center gap-2 shrink-0">
                                <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">{data.present}/{data.total}</Badge>
                                <span className={`text-xs font-bold ${rateColor}`}>{rate}%</span>
                              </div>
                            </div>
                            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                              <div className={`h-full rounded-full ${barColor} transition-all`} style={{ width: `${rate}%` }} />
                            </div>
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="px-3 pb-2.5 pt-0.5 space-y-1.5 border-t ml-6">
                            {Object.entries(data.areas).sort().map(([area, ad]) => {
                              const ar = ad.total > 0 ? Math.round((ad.present / ad.total) * 100) : 0;
                              const ac = ar >= 80 ? 'text-emerald-600' : ar >= 50 ? 'text-amber-600' : 'text-red-500';
                              const abc = ar >= 80 ? 'bg-emerald-500' : ar >= 50 ? 'bg-amber-500' : 'bg-red-500';
                              return (
                                <div key={area} className="flex items-center gap-2">
                                  <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between text-xs mb-0.5">
                                      <span className="text-muted-foreground truncate">{area}</span>
                                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                        <span className="text-[10px] text-muted-foreground">{ad.present}/{ad.total}</span>
                                        <span className={`text-[10px] font-bold ${ac}`}>{ar}%</span>
                                      </div>
                                    </div>
                                    <div className="h-1 overflow-hidden rounded-full bg-muted">
                                      <div className={`h-full rounded-full ${abc} transition-all`} style={{ width: `${ar}%` }} />
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-sm text-muted-foreground py-6">No data available</p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
