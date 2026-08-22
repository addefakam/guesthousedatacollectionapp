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
  licenseStats: LicenseStat[];
  totalRooms: number;
  avgRating: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

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

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Records by Sub-City</CardTitle>
          <CardDescription>Distribution across Bishoftu sub-cities</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {stats.subCityStats.map((sc) => (
            <div key={sc.subCity} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{sc.subCity}</span>
                <span className="text-muted-foreground">
                  {sc._count} guest house{sc._count > 1 ? 's' : ''}
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{
                    width: `${(sc._count / maxSubCityCount) * 100}%`,
                  }}
                />
              </div>
            </div>
          ))}
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
