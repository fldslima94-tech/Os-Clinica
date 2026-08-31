import React from 'react';
import { TabType } from '../types';
import { Cloud, Loader2, Database, Users, Calendar, Package, DollarSign } from 'lucide-react';

interface AppContentSkeletonProps {
  activeTab: TabType;
  loadedCount?: number;
  totalCount?: number;
}

export const AppContentSkeleton: React.FC<AppContentSkeletonProps> = ({
  activeTab,
  loadedCount = 0,
  totalCount = 7,
}) => {
  return (
    <div className="w-full space-y-6 animate-pulse" id="app-content-skeleton">
      {/* Top Subtle Sync Status Banner */}
      <div className="flex items-center justify-between bg-white/60 backdrop-blur-sm border border-slate-200/80 rounded-2xl px-4 py-2.5 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="relative flex items-center justify-center">
            <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
            <div className="absolute w-2 h-2 bg-indigo-500 rounded-full animate-ping opacity-60" />
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-700">
              Sincronizando dados em tempo real...
            </span>
            <span className="text-[11px] font-mono font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {loadedCount}/{totalCount} coleções
            </span>
          </div>
        </div>
        <div className="hidden sm:flex items-center space-x-2">
          <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(15, (loadedCount / totalCount) * 100))}%` }}
            />
          </div>
          <Cloud className="w-3.5 h-3.5 text-slate-400" />
        </div>
      </div>

      {/* Tab Specific Skeletons */}
      {activeTab === 'dashboard' && <DashboardSkeleton />}
      {activeTab === 'banco_dados' && <DatabaseMasterSkeleton />}
      {activeTab === 'agendamentos' && <AppointmentsSkeleton />}
      {activeTab === 'pacientes' && <PatientsSkeleton />}
      {activeTab === 'estoque' && <InventorySkeleton />}
      {activeTab === 'financeiro' && <FinancialSkeleton />}
      {activeTab !== 'dashboard' &&
        activeTab !== 'banco_dados' &&
        activeTab !== 'agendamentos' &&
        activeTab !== 'pacientes' &&
        activeTab !== 'estoque' &&
        activeTab !== 'financeiro' && <GenericViewSkeleton tab={activeTab} />}
    </div>
  );
};

/* --- Dashboard Skeleton Layout --- */
const DashboardSkeleton: React.FC = () => (
  <div className="space-y-6">
    {/* Greeting & Action Header */}
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
      <div className="space-y-2.5">
        <div className="h-6 w-48 bg-slate-200 rounded-lg" />
        <div className="h-4 w-72 bg-slate-100 rounded-md" />
      </div>
      <div className="flex items-center gap-3">
        <div className="h-10 w-28 bg-slate-200 rounded-xl" />
        <div className="h-10 w-32 bg-indigo-100 rounded-xl" />
      </div>
    </div>

    {/* Metric Cards Grid */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-slate-100" />
            <div className="w-12 h-5 rounded-full bg-slate-100" />
          </div>
          <div className="space-y-1.5 pt-1">
            <div className="h-4 w-24 bg-slate-100 rounded" />
            <div className="h-7 w-32 bg-slate-200 rounded-md" />
          </div>
        </div>
      ))}
    </div>

    {/* Split Panels */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="h-5 w-40 bg-slate-200 rounded-md" />
          <div className="h-4 w-20 bg-slate-100 rounded" />
        </div>
        <div className="space-y-3 pt-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100/80">
              <div className="flex items-center space-x-3.5">
                <div className="w-10 h-10 rounded-full bg-slate-200" />
                <div className="space-y-1.5">
                  <div className="h-4 w-36 bg-slate-200 rounded" />
                  <div className="h-3 w-24 bg-slate-100 rounded" />
                </div>
              </div>
              <div className="h-7 w-20 bg-slate-200 rounded-lg" />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="h-5 w-32 bg-slate-200 rounded-md" />
        <div className="h-44 w-full bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center">
          <div className="w-28 h-28 rounded-full border-4 border-slate-200 border-t-indigo-300" />
        </div>
        <div className="space-y-2 pt-2">
          <div className="h-3 w-full bg-slate-100 rounded" />
          <div className="h-3 w-4/5 bg-slate-100 rounded" />
        </div>
      </div>
    </div>
  </div>
);

/* --- DatabaseMasterView Skeleton Layout --- */
const DatabaseMasterSkeleton: React.FC = () => (
  <div className="space-y-6">
    {/* Master Header */}
    <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center">
            <Database className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="space-y-1.5">
            <div className="h-5 w-48 bg-slate-700 rounded-md" />
            <div className="h-3 w-64 bg-slate-800 rounded" />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="h-9 w-24 bg-slate-800 rounded-xl" />
          <div className="h-9 w-28 bg-indigo-600/40 rounded-xl" />
        </div>
      </div>

      {/* Collection Badges Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pt-2 pb-1 border-t border-slate-800">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="h-7 w-24 bg-slate-800 rounded-lg flex-shrink-0" />
        ))}
      </div>
    </div>

    {/* Toolbar */}
    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
      <div className="h-10 w-full sm:w-80 bg-slate-100 rounded-xl" />
      <div className="flex items-center space-x-2 w-full sm:w-auto">
        <div className="h-10 w-28 bg-slate-100 rounded-xl" />
        <div className="h-10 w-32 bg-slate-100 rounded-xl" />
      </div>
    </div>

    {/* Master Table Grid */}
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div className="h-4 w-32 bg-slate-200 rounded" />
        <div className="h-4 w-20 bg-slate-200 rounded" />
      </div>
      <div className="divide-y divide-slate-100">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center space-x-3 w-1/4">
              <div className="w-8 h-8 rounded-full bg-slate-200 flex-shrink-0" />
              <div className="h-4 w-28 bg-slate-200 rounded" />
            </div>
            <div className="h-4 w-24 bg-slate-100 rounded hidden md:block" />
            <div className="h-5 w-20 bg-slate-100 rounded-full" />
            <div className="h-4 w-20 bg-slate-200 rounded" />
            <div className="h-8 w-16 bg-slate-100 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

/* --- Appointments View Skeleton Layout --- */
const AppointmentsSkeleton: React.FC = () => (
  <div className="space-y-6">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
      <div className="space-y-2">
        <div className="h-6 w-44 bg-slate-200 rounded-lg" />
        <div className="h-4 w-60 bg-slate-100 rounded" />
      </div>
      <div className="h-11 w-40 bg-indigo-100 rounded-2xl" />
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50" />
              <div className="space-y-1">
                <div className="h-4 w-28 bg-slate-200 rounded" />
                <div className="h-3 w-20 bg-slate-100 rounded" />
              </div>
            </div>
            <div className="w-16 h-6 rounded-full bg-slate-100" />
          </div>
          <div className="h-10 bg-slate-50 rounded-2xl border border-slate-100" />
          <div className="flex items-center justify-between pt-1">
            <div className="h-4 w-24 bg-slate-200 rounded" />
            <div className="h-8 w-20 bg-slate-100 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

/* --- Patients View Skeleton Layout --- */
const PatientsSkeleton: React.FC = () => (
  <div className="space-y-6">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
      <div className="space-y-2">
        <div className="h-6 w-40 bg-slate-200 rounded-lg" />
        <div className="h-4 w-52 bg-slate-100 rounded" />
      </div>
      <div className="flex items-center space-x-3">
        <div className="h-10 w-32 bg-slate-100 rounded-xl" />
        <div className="h-10 w-36 bg-indigo-100 rounded-xl" />
      </div>
    </div>

    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
      <div className="h-10 w-full bg-slate-100 rounded-xl" />
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-full bg-slate-200" />
            <div className="space-y-1.5 flex-1">
              <div className="h-4 w-32 bg-slate-200 rounded" />
              <div className="h-3 w-24 bg-slate-100 rounded" />
            </div>
          </div>
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="h-3 w-3/4 bg-slate-100 rounded" />
            <div className="h-3 w-1/2 bg-slate-100 rounded" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

/* --- Inventory View Skeleton Layout --- */
const InventorySkeleton: React.FC = () => (
  <div className="space-y-6">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
      <div className="space-y-2">
        <div className="h-6 w-44 bg-slate-200 rounded-lg" />
        <div className="h-4 w-60 bg-slate-100 rounded" />
      </div>
      <div className="h-10 w-36 bg-indigo-100 rounded-xl" />
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="h-3 w-20 bg-slate-100 rounded" />
          <div className="h-6 w-28 bg-slate-200 rounded-md" />
        </div>
      ))}
    </div>

    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs divide-y divide-slate-100">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="p-4 flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-slate-100" />
            <div className="space-y-1">
              <div className="h-4 w-36 bg-slate-200 rounded" />
              <div className="h-3 w-20 bg-slate-100 rounded" />
            </div>
          </div>
          <div className="h-6 w-20 bg-slate-100 rounded-full" />
          <div className="h-8 w-16 bg-slate-100 rounded-lg" />
        </div>
      ))}
    </div>
  </div>
);

/* --- Financial View Skeleton Layout --- */
const FinancialSkeleton: React.FC = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="h-4 w-24 bg-slate-100 rounded" />
          <div className="h-8 w-36 bg-slate-200 rounded-lg" />
        </div>
      ))}
    </div>

    <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-5 w-40 bg-slate-200 rounded-md" />
        <div className="h-9 w-28 bg-indigo-100 rounded-xl" />
      </div>
      <div className="space-y-3 pt-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
            <div className="space-y-1.5">
              <div className="h-4 w-44 bg-slate-200 rounded" />
              <div className="h-3 w-28 bg-slate-100 rounded" />
            </div>
            <div className="h-5 w-24 bg-slate-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

/* --- Generic Fallback Skeleton Layout --- */
const GenericViewSkeleton: React.FC<{ tab: string }> = ({ tab }) => (
  <div className="space-y-6">
    <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="space-y-2">
        <div className="h-6 w-48 bg-slate-200 rounded-lg" />
        <div className="h-4 w-64 bg-slate-100 rounded" />
      </div>
      <div className="h-10 w-32 bg-indigo-100 rounded-xl" />
    </div>

    <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
      <div className="h-5 w-36 bg-slate-200 rounded-md" />
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
            <div className="space-y-1.5">
              <div className="h-4 w-40 bg-slate-200 rounded" />
              <div className="h-3 w-24 bg-slate-100 rounded" />
            </div>
            <div className="h-7 w-20 bg-slate-100 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  </div>
);
