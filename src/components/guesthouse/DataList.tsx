'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  Search,
  Download,
  Trash2,
  Eye,
  Building2,
  MapPin,
  Bed,
  Star,
  Phone,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Wifi,
  Car,
  Utensils,
  Droplets,
} from 'lucide-react';
import { locationData, getAllSubCities } from '@/lib/location-data';

interface GuestHouse {
  id: string;
  guestHouseName: string;
  subCity: string;
  area: string;
  specificAddress: string;
  maxBeds: number;
  licenseType: string;
  licenseLevel: string;
  licenseNumber: string | null;
  serviceRating: number;
  contactPhone: string | null;
  contactName: string | null;
  ownerName: string | null;
  hasRestaurant: boolean;
  hasParking: boolean;
  hasWiFi: boolean;
  hasHotWater: boolean;
  additionalServices: string | null;
  surveyorName: string | null;
  createdAt: string;
  updatedAt: string;
}

interface DataListProps {
  refreshTrigger: number;
}

export default function DataList({ refreshTrigger }: DataListProps) {
  const { toast } = useToast();
  const [data, setData] = useState<GuestHouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterSubCity, setFilterSubCity] = useState('');
  const [filterArea, setFilterArea] = useState('');
  const [areas, setAreas] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewItem, setViewItem] = useState<GuestHouse | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (filterSubCity) params.set('subCity', filterSubCity);
      if (filterArea) params.set('area', filterArea);
      params.set('page', String(page));
      params.set('limit', '20');

      const res = await fetch(`/api/guesthouses?${params}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      setData(json.data);
      setTotal(json.total);
      setTotalPages(json.totalPages);
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to load data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [search, filterSubCity, filterArea, page, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshTrigger]);

  const handleSubCityFilterChange = (value: string) => {
    setFilterSubCity(value);
    setFilterArea('');
    setPage(1);
    if (value) {
      const sc = locationData.subCities.find((s) => s.name === value);
      setAreas(sc ? sc.areas : []);
    } else {
      setAreas([]);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/guesthouses/${deleteId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Delete failed');
      toast({ title: 'Deleted', description: 'Record removed successfully.' });
      fetchData();
    } catch {
      toast({
        title: 'Delete Failed',
        description: 'Could not delete the record.',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (filterSubCity) params.set('subCity', filterSubCity);
      if (filterArea) params.set('area', filterArea);

      const res = await fetch(`/api/guesthouses/export?${params}`);
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bishoftu_guesthouses_survey_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast({ title: 'Exported', description: 'CSV file downloaded.' });
    } catch {
      toast({
        title: 'Export Failed',
        description: 'Could not export data.',
        variant: 'destructive',
      });
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            className={`h-4 w-4 ${
              s <= rating
                ? 'fill-amber-400 text-amber-400'
                : 'fill-none text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Search & Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5 text-emerald-600" />
              Collected Data
            </span>
            <Badge variant="secondary" className="text-sm">
              {total} records
            </Badge>
          </CardTitle>
          <CardDescription>View and manage all collected survey data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, address, owner..."
              className="pl-9"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Select
              value={filterSubCity}
              onValueChange={handleSubCityFilterChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by sub-city" />
              </SelectTrigger>
              <SelectContent>
                {getAllSubCities().map((sc) => (
                  <SelectItem key={sc} value={sc}>
                    {sc}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filterArea}
              onValueChange={(v) => {
                setFilterArea(v);
                setPage(1);
              }}
              disabled={!filterSubCity}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    filterSubCity ? 'Filter by area' : 'Select sub-city first'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {areas.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
            >
              <RefreshCw className="mr-1 h-4 w-4" />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
            >
              <Download className="mr-1 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="mb-2 h-5 w-3/4" />
                <Skeleton className="mb-1 h-4 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : data.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Building2 className="mb-3 h-12 w-12 text-muted-foreground/40" />
            <p className="text-lg font-medium text-muted-foreground">
              No records found
            </p>
            <p className="text-sm text-muted-foreground/70">
              {search || filterSubCity
                ? 'Try adjusting your filters'
                : 'Submit a survey to see data here'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {data.map((item) => (
            <Card key={item.id} className="transition-shadow hover:shadow-md">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-base font-semibold">
                      {item.guestHouseName}
                    </h3>
                    <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">
                        {item.area}, {item.subCity}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setViewItem(item)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-600"
                      onClick={() => setDeleteId(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                  <span className="flex items-center gap-1">
                    <Bed className="h-3.5 w-3.5 text-emerald-600" />
                    {item.maxBeds} beds
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {item.licenseType}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {item.licenseLevel}
                  </Badge>
                </div>

                <div className="mt-2 flex items-center gap-2">
                  {renderStars(item.serviceRating)}
                </div>

                <div className="mt-2 flex flex-wrap gap-1.5">
                  {item.hasWiFi && (
                    <Badge variant="outline" className="gap-1 text-xs">
                      <Wifi className="h-3 w-3" /> WiFi
                    </Badge>
                  )}
                  {item.hasParking && (
                    <Badge variant="outline" className="gap-1 text-xs">
                      <Car className="h-3 w-3" /> Parking
                    </Badge>
                  )}
                  {item.hasRestaurant && (
                    <Badge variant="outline" className="gap-1 text-xs">
                      <Utensils className="h-3 w-3" /> Restaurant
                    </Badge>
                  )}
                  {item.hasHotWater && (
                    <Badge variant="outline" className="gap-1 text-xs">
                      <Droplets className="h-3 w-3" /> Hot Water
                    </Badge>
                  )}
                </div>

                {item.contactPhone && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    {item.contactPhone}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Record?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              guest house survey record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Detail Dialog */}
      <Dialog open={!!viewItem} onOpenChange={(open) => !open && setViewItem(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          {viewItem && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">
                  {viewItem.guestHouseName}
                </DialogTitle>
                <DialogDescription>
                  {viewItem.area}, {viewItem.subCity}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">Max Beds</p>
                    <p className="text-lg font-semibold text-emerald-600">
                      {viewItem.maxBeds}
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">Service Rating</p>
                    <div className="mt-1">{renderStars(viewItem.serviceRating)}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">License Details</h4>
                  <div className="rounded-lg border p-3 space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Type</span>
                      <span className="font-medium">{viewItem.licenseType}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Level</span>
                      <span className="font-medium">{viewItem.licenseLevel}</span>
                    </div>
                    {viewItem.licenseNumber && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Number</span>
                        <span className="font-medium">{viewItem.licenseNumber}</span>
                      </div>
                    )}
                  </div>
                </div>

                {viewItem.specificAddress && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Address</h4>
                    <p className="text-sm text-muted-foreground">
                      {viewItem.specificAddress}
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Amenities</h4>
                  <div className="flex flex-wrap gap-2">
                    {viewItem.hasWiFi && (
                      <Badge variant="outline" className="gap-1">
                        <Wifi className="h-3 w-3" /> WiFi
                      </Badge>
                    )}
                    {viewItem.hasParking && (
                      <Badge variant="outline" className="gap-1">
                        <Car className="h-3 w-3" /> Parking
                      </Badge>
                    )}
                    {viewItem.hasRestaurant && (
                      <Badge variant="outline" className="gap-1">
                        <Utensils className="h-3 w-3" /> Restaurant
                      </Badge>
                    )}
                    {viewItem.hasHotWater && (
                      <Badge variant="outline" className="gap-1">
                        <Droplets className="h-3 w-3" /> Hot Water
                      </Badge>
                    )}
                    {!viewItem.hasWiFi &&
                      !viewItem.hasParking &&
                      !viewItem.hasRestaurant &&
                      !viewItem.hasHotWater && (
                        <span className="text-sm text-muted-foreground">
                          None specified
                        </span>
                      )}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Contact Details</h4>
                  <div className="rounded-lg border p-3 space-y-1.5">
                    {viewItem.ownerName && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Owner</span>
                        <span className="font-medium">{viewItem.ownerName}</span>
                      </div>
                    )}
                    {viewItem.contactName && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Contact</span>
                        <span className="font-medium">{viewItem.contactName}</span>
                      </div>
                    )}
                    {viewItem.contactPhone && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Phone</span>
                        <span className="font-medium">{viewItem.contactPhone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {viewItem.additionalServices && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Additional Services</h4>
                    <p className="text-sm text-muted-foreground">
                      {viewItem.additionalServices}
                    </p>
                  </div>
                )}

                {viewItem.surveyorName && (
                  <p className="text-xs text-muted-foreground">
                    Surveyed by: {viewItem.surveyorName} on{' '}
                    {new Date(viewItem.createdAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
