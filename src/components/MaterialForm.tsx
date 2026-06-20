import { useState, useMemo } from 'react';
import { Plus, Trash2, Package, Calculator, ChevronDown, AlertTriangle, Warehouse } from 'lucide-react';
import { MaterialItem, MATERIAL_CATEGORIES, type MaterialCategory } from '@/types';
import { formatCurrency } from '@/utils';
import { useAppStore } from '@/store';
import { cn } from '@/lib/utils';

interface MaterialFormProps {
  materials: MaterialItem[];
  onAdd: (material: Omit<MaterialItem, 'id' | 'totalPrice'>) => void;
  onRemove: (materialId: string) => void;
  readonly?: boolean;
}

interface NewMaterial {
  name: string;
  quantity: string;
  unitPrice: string;
  inventoryItemId?: string;
}

export default function MaterialForm({
  materials,
  onAdd,
  onRemove,
  readonly = false,
}: MaterialFormProps) {
  const inventoryItems = useAppStore((s) => s.inventoryItems);
  const [newMaterial, setNewMaterial] = useState<NewMaterial>({
    name: '',
    quantity: '',
    unitPrice: '',
    inventoryItemId: undefined,
  });
  const [selectedCategory, setSelectedCategory] = useState<MaterialCategory | 'all'>('all');
  const [errors, setErrors] = useState<Partial<NewMaterial>>({});

  const filteredInventoryItems = useMemo(() => {
    if (selectedCategory === 'all') return inventoryItems;
    return inventoryItems.filter((i) => i.category === selectedCategory);
  }, [inventoryItems, selectedCategory]);

  const selectedInventoryItem = useMemo(() => {
    if (!newMaterial.inventoryItemId) return null;
    return inventoryItems.find((i) => i.id === newMaterial.inventoryItemId) || null;
  }, [inventoryItems, newMaterial.inventoryItemId]);

  const handleSelectInventoryItem = (inventoryItemId: string) => {
    const item = inventoryItems.find((i) => i.id === inventoryItemId);
    if (item) {
      setNewMaterial({
        name: item.name,
        quantity: '',
        unitPrice: String(item.unitPrice),
        inventoryItemId: item.id,
      });
      setErrors({});
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<NewMaterial> = {};

    if (!newMaterial.name.trim()) {
      newErrors.name = '请输入耗材名称';
    }
    if (!newMaterial.quantity || Number(newMaterial.quantity) <= 0) {
      newErrors.quantity = '请输入有效数量';
    }
    if (!newMaterial.unitPrice || Number(newMaterial.unitPrice) < 0) {
      newErrors.unitPrice = '请输入有效单价';
    }
    if (selectedInventoryItem && Number(newMaterial.quantity) > selectedInventoryItem.stock) {
      newErrors.quantity = `库存不足，当前可用：${selectedInventoryItem.stock}${selectedInventoryItem.unit}`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAdd = () => {
    if (!validate()) return;

    onAdd({
      name: newMaterial.name.trim(),
      quantity: Number(newMaterial.quantity),
      unitPrice: Number(newMaterial.unitPrice),
      inventoryItemId: newMaterial.inventoryItemId,
    });

    setNewMaterial({ name: '', quantity: '', unitPrice: '', inventoryItemId: undefined });
    setSelectedCategory('all');
    setErrors({});
  };

  const totalAmount = materials.reduce((sum, m) => sum + m.totalPrice, 0);

  return (
    <div className="card p-6">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-semibold text-primary-900 flex items-center gap-2">
            <Package className="w-5 h-5" />
            耗材登记
          </h2>
          <p className="text-sm text-gray-500 mt-1">记录维修过程中使用的耗材</p>
        </div>
        {materials.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-primary-50 rounded-lg">
            <Calculator className="w-4 h-4 text-primary-600" />
            <span className="text-sm text-gray-600">合计：</span>
            <span className="text-lg font-bold text-primary-800">{formatCurrency(totalAmount)}</span>
          </div>
        )}
      </div>

      {!readonly && (
        <div className="bg-primary-50/50 rounded-xl p-4 mb-6">
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <div className="flex items-center gap-1.5">
                <Warehouse className="w-4 h-4 text-primary-600" />
                从库存选择
                <span className="text-xs text-gray-400 font-normal">（选择后自动填充信息并扣减库存）</span>
              </div>
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors',
                  selectedCategory === 'all'
                    ? 'bg-primary-600 border-primary-600 text-white'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                )}
              >
                全部
              </button>
              {MATERIAL_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors',
                    selectedCategory === cat
                      ? 'bg-primary-600 border-primary-600 text-white'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
            {filteredInventoryItems.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center border-2 border-dashed border-gray-200 rounded-lg">
                该分类暂无库存物品
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 max-h-40 overflow-y-auto p-1">
                {filteredInventoryItems.map((item) => {
                  const isLow = item.stock < item.safeStock;
                  const isSelected = newMaterial.inventoryItemId === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectInventoryItem(item.id)}
                      disabled={item.stock <= 0}
                      className={cn(
                        'p-2.5 rounded-lg border text-left transition-all text-xs',
                        isSelected
                          ? 'border-primary-500 bg-primary-100 ring-2 ring-primary-200'
                          : item.stock <= 0
                          ? 'border-gray-200 bg-gray-100 opacity-50 cursor-not-allowed'
                          : 'border-gray-200 bg-white hover:border-primary-300 hover:bg-primary-50'
                      )}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 truncate">{item.name}</p>
                          <p className="text-gray-500 text-[10px] mt-0.5 truncate">{item.spec}</p>
                        </div>
                        {isLow && item.stock > 0 && (
                          <AlertTriangle className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-1.5">
                        <span
                          className={cn(
                            'font-semibold',
                            item.stock <= 0
                              ? 'text-red-500'
                              : isLow
                              ? 'text-orange-600'
                              : 'text-primary-700'
                          )}
                        >
                          {item.stock}{item.unit}
                        </span>
                        <span className="text-gray-500">{formatCurrency(item.unitPrice)}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {selectedInventoryItem && (
            <div className="mb-3 p-3 bg-primary-100/60 rounded-lg border border-primary-200">
              <div className="flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-primary-700">
                  <Warehouse className="w-3.5 h-3.5" />
                  <span className="font-medium">已选库存物品：{selectedInventoryItem.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setNewMaterial({ name: '', quantity: '', unitPrice: '', inventoryItemId: undefined })
                  }
                  className="text-primary-600 hover:text-primary-800 underline underline-offset-2"
                >
                  取消选择
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-5">
              <label className="block text-sm font-medium text-gray-700 mb-1">耗材名称</label>
              <input
                type="text"
                value={newMaterial.name}
                onChange={(e) => {
                  setNewMaterial({
                    ...newMaterial,
                    name: e.target.value,
                    inventoryItemId: selectedInventoryItem ? undefined : newMaterial.inventoryItemId,
                  });
                  if (errors.name) setErrors({ ...errors, name: undefined });
                }}
                placeholder="如：LED灯管"
                className={cn(
                  'input-field',
                  errors.name && 'border-red-300 focus:ring-red-500',
                  selectedInventoryItem && 'bg-gray-100 text-gray-600'
                )}
                readOnly={!!selectedInventoryItem}
              />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>
            <div className="sm:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                数量
                {selectedInventoryItem && (
                  <span className="text-xs text-gray-400 ml-1">
                    (库存:{selectedInventoryItem.stock}{selectedInventoryItem.unit})
                  </span>
                )}
              </label>
              <input
                type="number"
                value={newMaterial.quantity}
                onChange={(e) => {
                  setNewMaterial({ ...newMaterial, quantity: e.target.value });
                  if (errors.quantity) setErrors({ ...errors, quantity: undefined });
                }}
                placeholder="0"
                min="1"
                className={cn(
                  'input-field',
                  errors.quantity && 'border-red-300 focus:ring-red-500'
                )}
              />
              {errors.quantity && <p className="text-xs text-red-500 mt-1">{errors.quantity}</p>}
            </div>
            <div className="sm:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">单价 (元)</label>
              <input
                type="number"
                value={newMaterial.unitPrice}
                onChange={(e) => {
                  setNewMaterial({ ...newMaterial, unitPrice: e.target.value });
                  if (errors.unitPrice) setErrors({ ...errors, unitPrice: undefined });
                }}
                placeholder="0.00"
                min="0"
                step="0.01"
                className={cn(
                  'input-field',
                  errors.unitPrice && 'border-red-300 focus:ring-red-500',
                  selectedInventoryItem && 'bg-gray-100 text-gray-600'
                )}
                readOnly={!!selectedInventoryItem}
              />
              {errors.unitPrice && <p className="text-xs text-red-500 mt-1">{errors.unitPrice}</p>}
            </div>
            <div className="sm:col-span-1 flex items-end">
              <button
                type="button"
                onClick={handleAdd}
                className="w-full sm:w-auto btn-primary flex items-center justify-center gap-1"
              >
                <Plus className="w-4 h-4" />
                <span className="sm:hidden">添加</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {materials.length === 0 ? (
        <div className="py-8 text-center text-gray-400">
          <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>{readonly ? '暂无耗材记录' : '暂无耗材，点击上方添加'}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  耗材名称
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">
                  来源
                </th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  数量
                </th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  单价
                </th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  小计
                </th>
                {!readonly && (
                  <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-16">
                    操作
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {materials.map((material) => (
                <tr key={material.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-sm text-gray-900">{material.name}</td>
                  <td className="py-3 px-4">
                    {material.inventoryItemId ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium bg-primary-50 text-primary-700 rounded-full">
                        <Warehouse className="w-3 h-3" />
                        库存领用
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-500 rounded-full">
                        外购
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-700 text-right">{material.quantity}</td>
                  <td className="py-3 px-4 text-sm text-gray-700 text-right">
                    {formatCurrency(material.unitPrice)}
                  </td>
                  <td className="py-3 px-4 text-sm font-medium text-primary-700 text-right">
                    {formatCurrency(material.totalPrice)}
                  </td>
                  {!readonly && (
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => onRemove(material.id)}
                        className={cn(
                          'p-1.5 rounded-lg transition-colors',
                          material.inventoryItemId
                            ? 'text-orange-500 hover:text-orange-700 hover:bg-orange-50'
                            : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                        )}
                        title={material.inventoryItemId ? '删除并退回库存' : '删除'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
            {materials.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-primary-200 bg-primary-50/50">
                  <td className="py-3 px-4 text-sm font-semibold text-gray-700" colSpan={readonly ? 3 : 4}>
                    合计
                  </td>
                  <td className="py-3 px-4 text-lg font-bold text-primary-800 text-right">
                    {formatCurrency(totalAmount)}
                  </td>
                  {!readonly && <td />}
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}
    </div>
  );
}
