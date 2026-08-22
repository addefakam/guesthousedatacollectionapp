'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClipboardList, BarChart3, Database, Shield, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { signOut } from 'next-auth/react';
import SurveyForm from '@/components/guesthouse/SurveyForm';
import DataList from '@/components/guesthouse/DataList';
import Dashboard from '@/components/guesthouse/Dashboard';
import LoginForm from '@/components/LoginForm';
import AdminPanel from '@/components/AdminPanel';
import { useAuth } from '@/components/AuthProvider';

export default function Home() {
  const { status } = useSession();
  const { isAdmin, userName, userId } = useAuth();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return <LoginForm />;
  }

  const tabs = isAdmin
    ? [
        { value: 'survey', label: 'Survey', icon: <ClipboardList className="h-4 w-4" /> },
        { value: 'data', label: 'Records', icon: <Database className="h-4 w-4" /> },
        { value: 'dashboard', label: 'Stats', icon: <BarChart3 className="h-4 w-4" /> },
        { value: 'admin', label: 'Users', icon: <Shield className="h-4 w-4" /> },
      ]
    : [
        { value: 'survey', label: 'Survey', icon: <ClipboardList className="h-4 w-4" /> },
        { value: 'data', label: 'Records', icon: <Database className="h-4 w-4" /> },
        { value: 'dashboard', label: 'Stats', icon: <BarChart3 className="h-4 w-4" /> },
      ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-50 border-b bg-white shadow-sm">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <img src="/icon.png" alt="BGH Survey" className="h-10 w-10 rounded-xl" />
            <div>
              <h1 className="text-lg font-bold leading-tight">Bishoftu Guest House Survey</h1>
              <p className="text-xs text-muted-foreground">
                {isAdmin ? 'Admin' : 'Data Collector'}: {userName}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => signOut({ callbackUrl: '/' })}
            title="Logout"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-4 pb-24">
        <Tabs defaultValue="survey" className="w-full">
          <TabsList className={tabs.length === 4 ? 'mb-4 grid w-full grid-cols-4' : 'mb-4 grid w-full grid-cols-3'}>
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex items-center gap-1.5 text-xs sm:text-sm"
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="survey">
            <SurveyForm
              onSubmit={() => setRefreshTrigger((t) => t + 1)}
              surveyorName={userName || ''}
              surveyorId={userId || ''}
            />
          </TabsContent>

          <TabsContent value="data">
            <DataList refreshTrigger={refreshTrigger} />
          </TabsContent>

          <TabsContent value="dashboard">
            <Dashboard />
          </TabsContent>

          {isAdmin && (
            <TabsContent value="admin">
              <AdminPanel />
            </TabsContent>
          )}
        </Tabs>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 border-t bg-white">
        <div className="mx-auto max-w-2xl px-4 py-2 text-center text-xs text-muted-foreground">
          Bishoftu City Guest House Survey
        </div>
      </footer>
    </div>
  );
}
