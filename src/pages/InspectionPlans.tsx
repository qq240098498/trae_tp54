import { useState, useMemo } from 'react';
import {
  ClipboardCheck,
  Plus,
  RefreshCw,
  Pencil,
  Trash2,
  Building2,
  Flame,
  Trees,
  Lightbulb,
  DoorOpen,
  MapPin,
  Calendar,
  ListChecks,
  Power,
} from 'lucide-react';
import { useAppStore } from '@/store';
import {
  InspectionPlan,
  InspectionCategory,
  INSPECTION_CATEGORIES,
} from '@/types';
import { getCycleLabel, isInspectionDue } from '@/utils';
import { cn } from '@/lib/utils';
import InspectionPlanModal from '@/components/InspectionPlanModal';

const CATEGORY_ICON: Record<InspectionCategory, React.ComponentType<{ className?: string }>> = {
  '电梯': Building2,
  '消防': Flame,
  '绿化': Trees,
  '照明': Lightbulb,
  '门禁': DoorOpen,
};

const CATEGORY_COLOR: Record<InspectionCategory, string> = {
  '电梯': 'bg-blue-100 text-blue-700',
  '消防': 'bg-red-100 text-red-700',
  '绿化': 'bg-green-100 text-green-700',
  '照明': 'bg-amber-100 text-amber-700',
  '门禁': 'bg-purple-100 text-purple-700',
};

const CYCLE_BADGE: Record<string, string> = {
  daily: 'bg-sky-100 text-sky-700',
  weekly: 'bg-indigo-100 text-indigo-700',
  monthly: 'bg-violet-100 text-violet-700',
};

export default function InspectionPlans() {
  const {
    inspectionPlans,
    inspectionTasks,
    toggleInspectionPlanEnabled,
    deleteInspectionPlan,
    generateDueInspectionTasks,
  } = useAppStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<InspectionPlan | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<InspectionCategory | ''>('');

  const filteredPlans = useMemo(() => {
    if (!categoryFilter) return inspectionPlans;
    return inspectionPlans.filter((p) => p.category === categoryFilter);
  }, [inspectionPlans, categoryFilter]);

  const stats = useMemo(() => {
    const enabled = inspectionPlans.filter((p) => p.enabled).length;
    const dueToday = inspectionPlans.filter((p) => isInspectionDue(p)).length;
    const todayTasks = inspectionTasks.filter(
      (t) => t.status !== 'completed'
    ).length;
    return { total: inspectionPlans.length, enabled, dueToday, todayTasks };
  }, [inspectionPlans, inspectionTasks]);

  const handleCreate = () => {
    setEditingPlan(null);
    setModalOpen(true);
  };

  const handleEdit = (plan: InspectionPlan) => {
    setEditingPlan(plan);
    setModalOpen(true);
  };

  const handleGenerate = () => {
    const count = generateDueInspectionTasks();
    if (count === 0) {
      useAppStore.getState().addToast('info', '当前没有需要生成的巡检任务');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 font-serif flex items-center gap-2">
              <ClipboardCheck className="w-7 h-7 text-primary-700" />
              公区巡检计划
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              配置电梯/消防/绿化/照明/门禁巡检计划，按天/周/月周期自动推送巡检任务
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleGenerate}
              className="btn-secondary flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              生成今日巡检任务
            </button>
            <button onClick={handleCreate} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" />
              新增巡检计划
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">巡检计划</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{stats.total}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-primary-100">
                <ClipboardCheck className="w-5 h-5 text-primary-700" />
              </div>
            </div>
          </div>
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">启用中</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{stats.enabled}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-green-100">
                <Power className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">今日待生成</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{stats.dueToday}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-100">
                <Calendar className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </div>
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">未完成巡检</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{stats.todayTasks}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-blue-100">
                <ListChecks className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setCategoryFilter('')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              categoryFilter === '' ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            )}
          >
            全部
          </button>
          {INSPECTION_CATEGORIES.map((c) => {
            const Icon = CATEGORY_ICON[c];
            return (
              <button
                key={c}
                onClick={() => setCategoryFilter(c)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-1',
                  categoryFilter === c ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                )}
              >
                <Icon className="w-4 h-4" />
                {c}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPlans.map((plan) => {
            const CatIcon = CATEGORY_ICON[plan.category];
            const due = isInspectionDue(plan);
            return (
              <div
                key={plan.id}
                className={cn(
                  'card overflow-hidden transition-all duration-300',
                  !plan.enabled && 'opacity-70'
                )}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center', CATEGORY_COLOR[plan.category])}>
                        <CatIcon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{plan.name}</h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={cn('badge', CYCLE_BADGE[plan.cycle])}>
                            {getCycleLabel(plan.cycle)}
                          </span>
                          <span className="badge bg-gray-100 text-gray-600">{plan.category}</span>
                        </div>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={plan.enabled}
                        onChange={() => toggleInspectionPlanEnabled(plan.id)}
                      />
                      <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-green-500 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-transform peer-checked:after:translate-x-5" />
                    </label>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span>{plan.area}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <ListChecks className="w-4 h-4 text-gray-400" />
                      <span>{plan.items.length} 项巡检内容</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>
                        上次生成：{plan.lastGeneratedDate || '尚未生成'}
                      </span>
                    </div>
                  </div>

                  {plan.enabled && due && (
                    <div className="mt-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-1.5 text-xs text-amber-700">
                      <RefreshCw className="w-3.5 h-3.5" />
                      当前周期待生成巡检任务
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => handleEdit(plan)}
                      className="flex-1 inline-flex items-center justify-center gap-1 py-2 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                      编辑
                    </button>
                    <button
                      onClick={() => deleteInspectionPlan(plan.id)}
                      className="flex-1 inline-flex items-center justify-center gap-1 py-2 rounded-lg text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      删除
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredPlans.length === 0 && (
          <div className="card p-12 text-center">
            <ClipboardCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">暂无巡检计划，点击“新增巡检计划”开始配置</p>
          </div>
        )}
      </div>

      <InspectionPlanModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingPlan(null);
        }}
        plan={editingPlan}
      />
    </div>
  );
}
