'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  DialogFooter,
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
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  FileSpreadsheet,
  Pencil,
  Loader2,
  Save,
} from 'lucide-react';
import { locationData, getAllSubCities, getAreasForSubCity, LICENSE_TYPES, LICENSE_LEVELS } from '@/lib/location-data';

interface GuestHouse {
  id: string;
  guestHouseName: string;
  organizationName: string | null;
  subCity: string;
  area: string;
  specificAddress: string;
  numberOfRooms: number;
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

interface EditForm {
  organizationName: string;
  subCity: string;
  area: string;
  specificAddress: string;
  numberOfRooms: string;
  licenseType: string;
  licenseLevel: string;
  licenseNumber: string;
  ownerName: string;
  contactName: string;
  contactPhone: string;
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
  const [editItem, setEditItem] = useState<GuestHouse | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [editAreas, setEditAreas] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (filterSubCity) params.set('subCity', filterSubCity);
      if (filterArea) params.set('area', filterArea);
      params.set('page', String(page));
      params.set('limit', '50');

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

  const openEdit = (item: GuestHouse) => {
    setEditItem(item);
    setEditForm({
      organizationName: item.organizationName || '',
      subCity: item.subCity,
      area: item.area,
      specificAddress: item.specificAddress,
      numberOfRooms: String(item.numberOfRooms),
      licenseType: item.licenseType,
      licenseLevel: item.licenseLevel,
      licenseNumber: item.licenseNumber || '',
      ownerName: item.ownerName || '',
      contactName: item.contactName || '',
      contactPhone: item.contactPhone || '',
    });
    setEditAreas(getAreasForSubCity(item.subCity));
  };

  const handleEditSubCityChange = (value: string) => {
    if (!editForm) return;
 setEditAreas(getAreasForSubCity(value));
    setEditForm({ ...editForm, subCity: value, area: '' });
  };

  const handleSave = async () => {
    if (!editItem || !editForm) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/guesthouses/${editItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) throw new Error('Update failed');
      toast({ title: 'Updated', description: 'Record updated successfully.' });
      setEditItem(null);
      setEditForm(null);
      fetchData();
    } catch {
      toast({
        title: 'Update Failed',
        description: 'Could not update the record.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleExportCSV = async () => {
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

  const handleExportExcel = async () => {
    try {
      const params = new URLSearchParams();
      if (filterSubCity) params.set('subCity', filterSubCity);
      if (filterArea) params.set('area', filterArea);

      const res = await fetch(`/api/guesthouses/export/excel?${params}`);
      if (!res.ok) throw new Error('Excel export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bishoftu_guesthouses_survey_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast({ title: 'Exported', description: 'Excel file downloaded.' });
    } catch {
      toast({
        title: 'Export Failed',
        description: 'Could not export Excel file.',
        variant: 'destructive',
      });
    }
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
                  <SelectItem key={sc} value={sc}>{sc}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filterArea}
              onValueChange={(v) => { setFilterArea(v); setPage(1); }}
              disabled={!filterSubCity}
            >
              <SelectTrigger>
                <SelectValue placeholder={filterSubCity ? 'Filter by area' : 'Select sub-city first'} />
              </SelectTrigger>
              <SelectContent>
                {areas.map((a) => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={fetchData}>
              <RefreshCw className="mr-1 h-4 w-4" /> Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="mr-1 h-4 w-4" /> CSV
            </Button>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={handleExportExcel}>
              <FileSpreadsheet className="mr-1 h-4 w-4" /> Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      {loading ? (
        <Card>
          <CardContent className="p-4 space-y-3">
            <Skeleton className="h-10 w-full" />
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </CardContent>
        </Card>
      ) : data.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Building2 className="mb-3 h-12 w-12 text-muted-foreground/40" />
            <p className="text-lg font-medium text-muted-foreground">No records found</p>
            <p className="text-sm text-muted-foreground/70">
              {search || filterSubCity ? 'Try adjusting your filters' : 'Submit a survey to see data here'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-3 py-3 text-left font-semibold text-muted-foreground whitespace-nowrap">#</th>
                    <th className="px-3 py-3 text-left font-semibold text-muted-foreground whitespace-nowrap">Organization / Dhaabbataa</th>
                    <th className="px-3 py-3 text-left font-semibold text-muted-foreground whitespace-nowrap">Sub-City</th>
                    <th className="px-3 py-3 text-left font-semibold text-muted-foreground whitespace-nowrap">Area</th>
                    <th className="px-3 py-3 text-left font-semibold text-muted-foreground whitespace-nowrap">Address</th>
                    <th className="px-3 py-3 text-center font-semibold text-muted-foreground whitespace-nowrap">Rooms</th>
                    <th className="px-3 py-3 text-left font-semibold text-muted-foreground whitespace-nowrap">License Type</th>
                    <th className="px-3 py-3 text-left font-semibold text-muted-foreground whitespace-nowrap">License Level</th>
                    <th className="px-3 py-3 text-left font-semibold text-muted-foreground whitespace-nowrap">License No.</th>
                    <th className="px-3 py-3 text-left font-semibold text-muted-foreground whitespace-nowrap">Owner</th>
                    <th className="px-3 py-3 text-left font-semibold text-muted-foreground whitespace-nowrap">Contact</th>
                    <th className="px-3 py-3 text-left font-semibold text-muted-foreground whitespace-nowrap">Phone</th>
                    <th className="px-3 py-3 text-left font-semibold text-muted-foreground whitespace-nowrap">Surveyor</th>
                    <th className="px-3 py-3 text-left font-semibold text-muted-foreground whitespace-nowrap">Date</th>
                    <th className="px-3 py-3 text-center font-semibold text-muted-foreground whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((item, idx) => (
                    <tr key={item.id} className="border-b last:border-b-0 hover:bg-muted/30 transition-colors">
                      <td className="px-3 py-2.5 text-muted-foreground text-xs">{(page - 1) * 50 + idx + 1}</td>
                      <td className="px-3 py-2.5 font-medium max-w-[160px] truncate" title={item.organizationName || item.guestHouseName}>
                        {item.organizationName || item.guestHouseName}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">{item.subCity}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap">{item.area}</td>
                      <td className="px-3 py-2.5 max-w-[140px] truncate" title={item.specificAddress}>{item.specificAddress}</td>
                      <td className="px-3 py-2.5 text-center">
                        <span className="inline-flex items-center justify-center h-6 min-w-[24px] rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold px-1.5">
                          {item.numberOfRooms}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap"><Badge variant="outline" className="text-xs font-normal">{item.licenseType}</Badge></td>
                      <td className="px-3 py-2.5 whitespace-nowrap"><Badge variant="secondary" className="text-xs font-normal">{item.licenseLevel}</Badge></td>
                      <td className="px-3 py-2.5 whitespace-nowrap font-mono text-xs">{item.licenseNumber || '-'}</td>
                      <td className="px-3 py-2.5 max-w-[120px] truncate" title={item.ownerName || undefined}>{item.ownerName || '-'}</td>
                      <td className="px-3 py-2.5 max-w-[120px] truncate" title={item.contactName || undefined}>{item.contactName || '-'}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <a href={`tel:${item.contactPhone || ''}`} className="text-emerald-600 hover:underline text-xs">{item.contactPhone || '-'}</a>
                      </td>
                      <td className="px-3 py-2.5 max-w-[100px] truncate text-xs text-muted-foreground" title={item.surveyorName || undefined}>{item.surveyorName || '-'}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleDateString('en-GB')}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center justify-center gap-0.5">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(item)}>
                            <Pencil className="h-3.5 w-3.5 text-blue-600" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewItem(item)}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => setDeleteId(item.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y">
              {data.map((item, idx) => (
                <div key={item.id} className="p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground">#{(page - 1) * 50 + idx + 1}</p>
                      <p className="font-semibold text-sm truncate">{item.organizationName || item.guestHouseName}</p>
                      <p className="text-xs text-muted-foreground">{item.area}, {item.subCity}</p>
                    </div>
                    <div className="flex gap-0.5 shrink-0">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(item)}>
                        <Pencil className="h-3.5 w-3.5 text-blue-600" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewItem(item)}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => setDeleteId(item.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    <div><span className="text-muted-foreground">Rooms:</span> <span className="font-medium">{item.numberOfRooms}</span></div>
                    <div><span className="text-muted-foreground">License:</span> <span className="font-medium">{item.licenseType}</span></div>
                    <div><span className="text-muted-foreground">Level:</span> <span className="font-medium">{item.licenseLevel}</span></div>
                    <div><span className="text-muted-foreground">Owner:</span> <span className="font-medium truncate">{item.ownerName || '-'}</span></div>
                    <div><span className="text-muted-foreground">Contact:</span> <span className="font-medium truncate">{item.contactName || '-'}</span></div>
                    <div><span className="text-muted-foreground">Phone:</span> <a href={`tel:${item.contactPhone || ''}`} className="font-medium text-emerald-600">{item.contactPhone || '-'}</a></div>
                  </div>
                  <p className="text-[10px] text-muted-foreground text-right">
                    {item.surveyorName && <span>{item.surveyorName} - </span>}
                    {new Date(item.createdAt).toLocaleDateString('en-GB')}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
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
              This action cannot be undone. This will permanently delete the guest house survey record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-red-600 hover:bg-red-700">
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
                <DialogTitle className="text-xl">{viewItem.organizationName || viewItem.guestHouseName}</DialogTitle>
                <DialogDescription>{viewItem.area}, {viewItem.subCity}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">Rooms / Qubeettii</p>
                    <p className="text-lg font-semibold text-emerald-600">{viewItem.numberOfRooms}</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">License No. / Lakofsaa Eyyema</p>
                    <p className="text-lg font-semibold text-emerald-600">{viewItem.licenseNumber || '-'}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">License Details / Odeeffannoo Eyyemaa</h4>
                  <div className="rounded-lg border p-3 space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Type / Goossa Eyyema</span>
                      <span className="font-medium">{viewItem.licenseType}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Level / Saddarkaa Eyyema</span>
                      <span className="font-medium">{viewItem.licenseLevel}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Address / Teessoo</h4>
                  <p className="text-sm text-muted-foreground rounded-lg border p-3">{viewItem.specificAddress}</p>
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Contact Details / Odeeffannoo Quunnamtii</h4>
                  <div className="rounded-lg border p-3 space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Owner / Abbaa Qaabeyee</span>
                      <span className="font-medium">{viewItem.ownerName || '-'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Contact / Nama Adadura Qunnamnu</span>
                      <span className="font-medium">{viewItem.contactName || '-'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Phone / Bilbila</span>
                      <span className="font-medium"><a href={`tel:${viewItem.contactPhone || ''}`} className="text-emerald-600 hover:underline">{viewItem.contactPhone || '-'}</a></span>
                    </div>
                  </div>
                </div>
                {viewItem.surveyorName && (
                  <p className="text-xs text-muted-foreground">
                    Surveyed by: {viewItem.surveyorName} on {new Date(viewItem.createdAt).toLocaleDateString('en-GB')}
                  </p>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editItem} onOpenChange={(open) => { if (!open) { setEditItem(null); setEditForm(null); } }}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-blue-600" />
              Edit Record
            </DialogTitle>
            <DialogDescription>
              {editItem?.organizationName || editItem?.guestHouseName}
            </DialogDescription>
          </DialogHeader>

          {editForm && (
            <div className="space-y-4 pt-2">
              {/* Establishment */}
              <div className="space-y-3 rounded-lg border p-3">
                <h4 className="text-sm font-semibold text-emerald-700">Establishment / Qophiin</h4>
                <div className="space-y-2">
                  <Label className="text-xs">Organization Name / Maqaa Dhaabbataa <span className="text-red-500">*</span></Label>
                  <Input value={editForm.organizationName} onChange={(e) => setEditForm({ ...editForm, organizationName: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs">Sub-City / Kuttaa Maggalaa <span className="text-red-500">*</span></Label>
                    <Select value={editForm.subCity} onValueChange={handleEditSubCityChange}>
                      <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {getAllSubCities().map((sc) => (<SelectItem key={sc} value={sc}>{sc}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Area / Ganda <span className="text-red-500">*</span></Label>
                    <Select value={editForm.area} onValueChange={(v) => setEditForm({ ...editForm, area: v })} disabled={!editForm.subCity}>
                      <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {editAreas.map((a) => (<SelectItem key={a} value={a}>{a}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Specific Address / Teessoo Qaamaa <span className="text-red-500">*</span></Label>
                  <Input value={editForm.specificAddress} onChange={(e) => setEditForm({ ...editForm, specificAddress: e.target.value })} />
                </div>
              </div>

              {/* License */}
              <div className="space-y-3 rounded-lg border p-3">
                <h4 className="text-sm font-semibold text-blue-700">License & Capacity / Bayyinnafee fi Eyyemma</h4>
                <div className="space-y-2">
                  <Label className="text-xs">Number of Rooms / Lakkoofsa Qubeettii <span className="text-red-500">*</span></Label>
                  <Input type="number" min="1" value={editForm.numberOfRooms} onChange={(e) => setEditForm({ ...editForm, numberOfRooms: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs">License Type / Goossa Eyyema <span className="text-red-500">*</span></Label>
                    <Select value={editForm.licenseType} onValueChange={(v) => setEditForm({ ...editForm, licenseType: v })}>
                      <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {LICENSE_TYPES.map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">License Level / Saddarkaa Eyyema <span className="text-red-500">*</span></Label>
                    <Select value={editForm.licenseLevel} onValueChange={(v) => setEditForm({ ...editForm, licenseLevel: v })}>
                      <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {LICENSE_LEVELS.map((l) => (<SelectItem key={l} value={l}>{l}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">License Number / Lakofsaa Eyyema <span className="text-red-500">*</span></Label>
                  <Input value={editForm.licenseNumber} onChange={(e) => setEditForm({ ...editForm, licenseNumber: e.target.value })} />
                </div>
              </div>

              {/* Contact */}
              <div className="space-y-3 rounded-lg border p-3">
                <h4 className="text-sm font-semibold text-purple-700">Contact / Quunnamtii</h4>
                <div className="space-y-2">
                  <Label className="text-xs">Owner Name / Maqaa Abbaa Qaabeyee <span className="text-red-500">*</span></Label>
                  <Input value={editForm.ownerName} onChange={(e) => setEditForm({ ...editForm, ownerName: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Contact Person / Nama Adadura Qunnamnu <span className="text-red-500">*</span></Label>
                  <Input value={editForm.contactName} onChange={(e) => setEditForm({ ...editForm, contactName: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Phone Number / Lakkoofsa Bilbila <span className="text-red-500">*</span></Label>
                  <Input type="tel" value={editForm.contactPhone} onChange={(e) => setEditForm({ ...editForm, contactPhone: e.target.value })} />
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => { setEditItem(null); setEditForm(null); }}>Cancel</Button>
                <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />}
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
