'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClipboardList, BarChart3, Database } from 'lucide-react';
import SurveyForm from '@/components/guesthouse/SurveyForm';
import DataList from '@/components/guesthouse/DataList';
import Dashboard from '@/components/guesthouse/Dashboard';

export default function Home() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-50 border-b bg-white shadow-sm">
        <div className="mx-auto max-w-2xl px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">
                Bishoftu Guest House Survey
              </h1>
              <p className="text-xs text-muted-foreground">
                Data Collection System
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-4 pb-24">
        <Tabs defaultValue="survey" className="w-full">
          <TabsList className="mb-4 grid w-full grid-cols-3">
            <TabsTrigger
              value="survey"
              className="flex items-center gap-1.5 text-xs sm:text-sm"
            >
              <ClipboardList className="h-4 w-4" />
              <span className="hidden sm:inline">New Survey</span>
              <span className="sm:hidden">Survey</span>
            </TabsTrigger>
            <TabsTrigger
              value="data"
              className="flex items-center gap-1.5 text-xs sm:text-sm"
            >
              <Database className="h-4 w-4" />
              <span className="hidden sm:inline">Records</span>
              <span className="sm:hidden">Data</span>
            </TabsTrigger>
            <TabsTrigger
              value="dashboard"
              className="flex items-center gap-1.5 text-xs sm:text-sm"
            >
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
              <span className="sm:hidden">Stats</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="survey">
            <SurveyForm
              onSubmit={() => setRefreshTrigger((t) => t + 1)}
            />
          </TabsContent>

          <TabsContent value="data">
            <DataList refreshTrigger={refreshTrigger} />
          </TabsContent>

          <TabsContent value="dashboard">
            <Dashboard />
          </TabsContent>
        </Tabs>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 border-t bg-white">
        <div className="mx-auto max-w-2xl px-4 py-2 text-center text-xs text-muted-foreground">
          Bishoftu City Guest House Survey &middot; Data Collection System
        </div>
      </footer>
    </div>
  );
}
