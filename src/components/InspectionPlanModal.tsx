import { useState, useEffect } from 'react';
import { X, Plus, Trash2, RotateCcw, ClipboardCheck, MapPin } from 'lucide-react';
import { useAppStore } from '@/store';
import {
  InspectionPlan,
  InspectionCategory,
  InspectionCycle,
  InspectionItemTemplate,
  INSPECTION_CATEGORIES,
  INSPECTION_CYCLES,
  DEFAULT_INSPECTION_ITEMS,
} from '@/types';
import { generateId } from '@/utils';
import { cn } from '@/lib/utils';

interface InspectionPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan?: InspectionPlan | null;
}

export default function InspectionPlanModal({ isOpen, onClose, plan }: InspectionPlanModalProps) {
  const { addInspectionPlan, updateInspectionPlan } = useAppStore();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<InspectionCategory>('电梯');
  const [cycle, setCycle] = useState<InspectionCycle>('daily');
  const [area, setArea] = useState('');
  const [items, setItems] = useState<InspectionItemTemplate[]>([]);

  const isEdit = !!plan;

  useEffect(() => {
    if (!isOpen) return;
    if (plan) {
      setName(plan.name);
      setCategory(plan.category);
      setCycle(plan.cycle);
      setArea(plan.area);
      setItems(plan.items.map((it) => ({ ...it })));
    } else {
      setName('');
      setCategory('电梯');
      setCycle('daily');
      setArea('');
      setItems(
        DEFAULT_INSPECTION_ITEMS['电梯'].map((n) => ({ id: generateId(), name: n }))
      );
    }
  }, [isOpen, plan]);

  if (!isOpen) return null;

  const applyDefaultItems = (cat: InspectionCategory) => {
    setItems(DEFAULT_INSPECTION_ITEMS[cat].map((n) => ({ id: generateId(), name: n })));
  };

  const handleCategoryChange = (cat: InspectionCategory) => {
    setCategory(cat);
    if (!isEdit) applyDefaultItems(cat);
  };

  const handleAddItem = () => {
    setItems((prev) => [...prev, { id: generateId(), name: '' }]);
  };

  const handleItemNameChange = (id: string, value: string) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, name: value } : it)));
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const validItems = items.filter((it) => it.name.trim().length > 0);
  const canSubmit = name.trim().length > 0 && area.trim().length > 0 && validItems.length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    const payload = {
      name: name.trim(),
      category,
      cycle,
      area: area.trim(),
      items: validItems.map((it) => ({ id: it.id, name: it.name.trim() })),
    };
    if (isEdit && plan) {
      updateInspectionPlan(plan.id, payload);
    } else {
      addInspectionPlan(payload);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-fade-in-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-6 h-6 text-primary-700" />
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                {isEdit ? '编辑巡检计划' : '新增巡检计划'}
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                配置公区巡检类别、周期与巡检项，按周期自动推送任务
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">
                计划名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="如：客梯每日巡检"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">
                巡检区域 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="如：1栋-3栋客梯"
                  className="input-field pl-9"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">
                巡检类别 <span className="text-red-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value as InspectionCategory)}
                className="select-field"
              >
                {INSPECTION_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">
                推送周期 <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {INSPECTION_CYCLES.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setCycle(c.value)}
                    className={cn(
                      'py-2 rounded-lg text-sm font-medium border transition-all duration-200',
                      cycle === c.value
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    )}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-600">
                巡检项 ({validItems.length})
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => applyDefaultItems(category)}
                  className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 hover:underline"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  应用默认项
                </button>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" />
                  添加巡检项
                </button>
              </div>
            </div>
            <div className="space-y-2">
              {items.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-6 bg-gray-50 rounded-lg">
                  暂无巡检项，请点击“添加巡检项”或“应用默认项”
                </p>
              )}
              {items.map((it, idx) => (
                <div key={it.id} className="flex items-center gap-2">
                  <span className="w-6 text-sm text-gray-400 text-center">{idx + 1}.</span>
                  <input
                    type="text"
                    value={it.name}
                    onChange={(e) => handleItemNameChange(it.id, e.target.value)}
                    placeholder="请输入巡检项名称"
                    className="input-field"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(it.id)}
                    className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="btn-secondary">
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="btn-primary flex items-center gap-2"
          >
            <ClipboardCheck className="w-4 h-4" />
            {isEdit ? '保存修改' : '创建计划'}
          </button>
        </div>
      </div>
    </div>
  );
}
