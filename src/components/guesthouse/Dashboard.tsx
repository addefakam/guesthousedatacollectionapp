'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Building2,
  Bed,
  Star,
  FileCheck,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  MapPin,
} from 'lucide-react';

interface SubCityStat {
  subCity: string;
  _count: number;
}

interface LicenseStat {
  licenseType: string;
  _count: number;
}

interface Stats {
  total: number;
  subCityStats: SubCityStat[];
  woredaBySubCity: Record<string, { area: string; count: number }[]>;
  licenseStats: LicenseStat[];
  totalRooms: number;
  avgRating: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSubCities, setExpandedSubCities] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/guesthouses/stats');
        if (!res.ok) throw new Error();
        const data = await res.json();
        setStats(data);
      } catch {
        // stats will remain null
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const toggleSubCity = (subCity: string) => {
    setExpandedSubCities((prev) => {
      const next = new Set(prev);
      if (next.has(subCity)) next.delete(subCity);
      else next.add(subCity);
      return next;
    });
  };

  const expandAll = () => {
    if (!stats) return;
    setExpandedSubCities(new Set(stats.subCityStats.map((s) => s.subCity)));
  };

  const collapseAll = () => {
    setExpandedSubCities(new Set());
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="mb-2 h-4 w-20" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-4">
            <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!stats || stats.total === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <TrendingUp className="mb-3 h-12 w-12 text-muted-foreground/40" />
          <p className="text-lg font-medium text-muted-foreground">
            No Data Yet
          </p>
          <p className="mt-1 text-sm text-muted-foreground/70">
            Submit your first survey to see statistics here.
          </p>
        </CardContent>
      </Card>
    );
  }

  const maxSubCityCount = Math.max(
    ...stats.subCityStats.map((s) => s._count),
    1
  );

  const ratingLabel = (r: number) => {
    if (r >= 4.5) return 'Excellent';
    if (r >= 3.5) return 'Very Good';
    if (r >= 2.5) return 'Good';
    if (r >= 1.5) return 'Fair';
    return 'Poor';
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-emerald-100 p-2">
                <Building2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-blue-100 p-2">
                <Bed className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Rooms</p>
                <p className="text-2xl font-bold">
                  {stats.totalRooms.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-amber-100 p-2">
                <Star className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Avg Rating</p>
                <p className="text-2xl font-bold">{stats.avgRating}</p>
                <p className="text-xs text-muted-foreground">
                  {ratingLabel(stats.avgRating)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-purple-100 p-2">
                <FileCheck className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Licensed</p>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">records</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Records by Sub-City with Woreda breakdown */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Records by Sub-City / Kuttaa Maggalaa</CardTitle>
              <CardDescription>Distribution across Bishoftu sub-cities with woreda breakdown</CardDescription>
            </div>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={expandAll}
                className="text-[10px] text-emerald-600 hover:text-emerald-800 font-medium px-1.5 py-0.5 rounded hover:bg-emerald-50"
              >
                Expand All
              </button>
              <button
                type="button"
                onClick={collapseAll}
                className="text-[10px] text-muted-foreground hover:text-foreground font-medium px-1.5 py-0.5 rounded hover:bg-muted"
              >
                Collapse All
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {stats.subCityStats.map((sc) => {
            const isExpanded = expandedSubCities.has(sc.subCity);
            const woredas = stats.woredaBySubCity[sc.subCity] || [];
            const maxWoredaCount = Math.max(...woredas.map((w) => w.count), 1);

            return (
              <div key={sc.subCity} className="rounded-lg border bg-white">
                {/* Sub-city header row - clickable */}
                <button
                  type="button"
                  onClick={() => toggleSubCity(sc.subCity)}
                  className="w-full px-3 py-2.5 flex items-center gap-2 text-left hover:bg-muted/30 transition-colors rounded-lg"
                >
                  <div className={`shrink-0 transition-transform ${isExpanded ? 'rotate-0' : '-rotate-90'}`}>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-sm">{sc.subCity}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {woredas.length} wereda{woredas.length !== 1 ? 's' : ''}
                        </span>
                        <span className="inline-flex items-center justify-center h-5 min-w-[20px] rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-bold px-1.5">
                          {sc._count}
                        </span>
                      </div>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all"
                        style={{ width: `${(sc._count / maxSubCityCount) * 100}%` }}
                      />
                    </div>
                  </div>
                </button>

                {/* Woreda breakdown - expandable */}
                {isExpanded && woredas.length > 0 && (
                  <div className="px-3 pb-2.5 pt-0.5 space-y-1.5 border-t ml-6">
                    {woredas
                      .sort((a, b) => b.count - a.count)
                      .map((w) => (
                      <div key={w.area} className="flex items-center gap-2">
                        <MapPin className="h-3 w-3 text-blue-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground truncate">{w.area}</span>
                            <span className="font-semibold text-blue-600 shrink-0 ml-2">{w.count}</span>
                          </div>
                          <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-blue-50">
                            <div
                              className="h-full rounded-full bg-blue-400 transition-all"
                              style={{ width: `${(w.count / maxWoredaCount) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">License Type Distribution</CardTitle>
          <CardDescription>Types of licenses registered</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {stats.licenseStats.map((ls) => {
              const pct = Math.round((ls._count / stats.total) * 100);
              return (
                <div
                  key={ls.licenseType}
                  className="rounded-lg border p-3 text-center"
                >
                  <p className="text-2xl font-bold text-emerald-600">
                    {ls._count}
                  </p>
                  <p className="text-xs font-medium">{ls.licenseType}</p>
                  <p className="text-xs text-muted-foreground">{pct}%</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
