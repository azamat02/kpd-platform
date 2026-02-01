import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  kpisApi,
  usersApi,
  Kpi,
  KpiStatus,
  User,
  CreateKpiData,
} from '../services/api';
import Layout from '../components/Layout';

// Icons
const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const EditIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const SendIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

// Status badge component
const StatusBadge: React.FC<{ status: KpiStatus }> = ({ status }) => {
  const config: Record<KpiStatus, { label: string; className: string }> = {
    DRAFT: { label: 'Черновик', className: 'badge-gray' },
    PENDING_APPROVAL: { label: 'На согласовании', className: 'badge-warning' },
    REJECTED: { label: 'Отклонен', className: 'badge-error' },
    APPROVED: { label: 'Утвержден', className: 'badge-success' },
    COMPLETED: { label: 'Завершен', className: 'badge-info' },
  };
  const { label, className } = config[status];
  return <span className={className}>{label}</span>;
};

// Local task interface for form state
interface LocalTask {
  id: string;
  name: string;
  weight: string;
  planValue: string;
  unit: string;
}

// KPI Form Modal
interface KpiFormModalProps {
  kpi: Kpi | null;
  users: User[];
  onSave: (data: CreateKpiData) => Promise<Kpi>;
  onClose: () => void;
  onCreated?: (kpiId: number) => void;
}

const KpiFormModal: React.FC<KpiFormModalProps> = ({ kpi, users, onSave, onClose, onCreated }) => {
  const [title, setTitle] = useState(kpi?.title || '');
  const [description, setDescription] = useState(kpi?.description || '');
  const [deadline, setDeadline] = useState(
    kpi?.deadline ? new Date(kpi.deadline).toISOString().split('T')[0] : ''
  );
  const [approverId, setApproverId] = useState<number | ''>(kpi?.approverId || '');
  const [approverSearch, setApproverSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tasks, setTasks] = useState<LocalTask[]>([]);
  const [error, setError] = useState<string | null>(null);

  const filteredApprovers = useMemo(() => {
    if (!approverSearch) return users.slice(0, 10);
    const search = approverSearch.toLowerCase();
    return users
      .filter(
        (u) =>
          u.fullName.toLowerCase().includes(search) ||
          u.position.toLowerCase().includes(search)
      )
      .slice(0, 10);
  }, [users, approverSearch]);

  const selectedApprover = users.find((u) => u.id === approverId);

  // Task weight calculations
  const totalWeight = useMemo(() => {
    return tasks.reduce((sum, t) => sum + (parseFloat(t.weight) || 0), 0);
  }, [tasks]);
  const weightValid = tasks.length === 0 || Math.abs(totalWeight - 100) < 0.01;

  // Task management functions
  const addTask = () => {
    setTasks([
      ...tasks,
      { id: Date.now().toString(), name: '', weight: '', planValue: '', unit: '' },
    ]);
  };

  const updateTask = (id: string, field: keyof LocalTask, value: string) => {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, [field]: value } : t)));
  };

  const removeTask = (id: string) => {
    setTasks(tasks.filter((t) => t.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !deadline || !approverId) return;

    setIsSubmitting(true);
    setError(null);
    try {
      // 1. Create KPI
      const createdKpi = await onSave({
        title,
        description: description || undefined,
        deadline,
        approverId: approverId as number,
      });

      onClose();
      // Notify parent that KPI was created with tasks
      if (!kpi && onCreated) {
        onCreated(createdKpi.id);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка сохранения');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">
            {kpi ? 'Редактировать KPI' : 'Создать KPI'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <CloseIcon />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Название *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field"
              placeholder="Например: KPI Q1 2024"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Описание
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field min-h-[80px]"
              placeholder="Описание KPI..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Срок выполнения *
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Утверждающий *
            </label>
            {selectedApprover ? (
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {selectedApprover.fullName}
                  </p>
                  <p className="text-xs text-slate-500">{selectedApprover.position}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setApproverId('')}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <CloseIcon />
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  value={approverSearch}
                  onChange={(e) => setApproverSearch(e.target.value)}
                  className="input-field"
                  placeholder="Поиск по имени или должности..."
                />
                {filteredApprovers.length > 0 && (
                  <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-lg">
                    {filteredApprovers.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => {
                          setApproverId(user.id);
                          setApproverSearch('');
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-slate-50 border-b border-slate-100 last:border-b-0"
                      >
                        <p className="text-sm font-medium text-slate-900">{user.fullName}</p>
                        <p className="text-xs text-slate-500">{user.position}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Tasks Section - only for new KPIs */}
          {!kpi && (
            <div className="pt-2">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <label className="block text-sm font-medium text-slate-700">Задачи</label>
                  {tasks.length > 0 && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        weightValid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}
                    >
                      Сумма весов: {totalWeight.toFixed(0)}%
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={addTask}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <PlusIcon /> Добавить показатель
                </button>
              </div>

              {tasks.length > 0 && (
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">
                          Название
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase w-16">
                          Вес %
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase w-20">
                          План
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase w-16">
                          Ед.изм.
                        </th>
                        <th className="px-3 py-2 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {tasks.map((task) => (
                        <tr key={task.id}>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={task.name}
                              onChange={(e) => updateTask(task.id, 'name', e.target.value)}
                              className="input-field text-sm"
                              placeholder="Наименование показателя"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              value={task.weight}
                              onChange={(e) => updateTask(task.id, 'weight', e.target.value)}
                              className="input-field text-sm"
                              placeholder="25"
                              min="0"
                              max="100"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              value={task.planValue}
                              onChange={(e) => updateTask(task.id, 'planValue', e.target.value)}
                              className="input-field text-sm"
                              placeholder="100"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={task.unit}
                              onChange={(e) => updateTask(task.id, 'unit', e.target.value)}
                              className="input-field text-sm"
                              placeholder="шт."
                            />
                          </td>
                          <td className="px-3 py-2">
                            <button
                              type="button"
                              onClick={() => removeTask(task.id)}
                              className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                            >
                              <TrashIcon />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {tasks.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-4 border border-dashed border-slate-200 rounded-lg">
                  Задачи можно добавить сейчас или позже
                </p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary">
              Отмена
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title || !deadline || !approverId}
              className="btn-primary"
            >
              {isSubmitting ? 'Сохранение...' : kpi ? 'Сохранить' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// KPI Detail Modal
interface KpiDetailModalProps {
  kpi: Kpi;
  users: User[];
  onClose: () => void;
  onRefresh: () => void;
  onDelete?: (kpi: Kpi) => void;
}

const KpiDetailModal: React.FC<KpiDetailModalProps> = ({ kpi, users, onClose, onRefresh, onDelete }) => {
  const [localKpi, setLocalKpi] = useState(kpi);
  const [assignSearch, setAssignSearch] = useState('');
  const [showAssignSearch, setShowAssignSearch] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [expandedBlocks, setExpandedBlocks] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  // Состояния для добавления нового блока
  const [showAddBlock, setShowAddBlock] = useState(false);
  const [newBlockName, setNewBlockName] = useState('');
  const [newBlockWeight, setNewBlockWeight] = useState('');

  // Состояния для добавления нового показателя
  const [addingTaskToBlock, setAddingTaskToBlock] = useState<number | null>(null);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskWeight, setNewTaskWeight] = useState('');
  const [newTaskUnit, setNewTaskUnit] = useState('шт');
  const [newTaskPlanValue, setNewTaskPlanValue] = useState('');

  const canEdit = localKpi.status === 'DRAFT' || localKpi.status === 'REJECTED';
  const canDelete = localKpi.status === 'DRAFT' || localKpi.status === 'REJECTED' || localKpi.status === 'APPROVED';

  const totalBlockWeight = (localKpi.blocks || []).reduce((sum, b) => sum + b.weight, 0);
  const weightValid = Math.abs(totalBlockWeight - 100) < 0.01 || (localKpi.blocks || []).length === 0;

  const assignedUserIds = new Set(localKpi.assignments.map((a) => a.userId));
  const filteredUsersForAssign = useMemo(() => {
    if (!assignSearch) return [];
    const search = assignSearch.toLowerCase();
    return users
      .filter(
        (u) =>
          !assignedUserIds.has(u.id) &&
          (u.fullName.toLowerCase().includes(search) ||
            u.position.toLowerCase().includes(search))
      )
      .slice(0, 10);
  }, [users, assignSearch, assignedUserIds]);

  const refreshKpi = async () => {
    try {
      const response = await kpisApi.getOne(localKpi.id);
      setLocalKpi(response.data);
    } catch (err) {
      setError('Ошибка загрузки данных');
    }
  };

  const toggleBlockExpanded = (blockId: number) => {
    setExpandedBlocks((prev) => {
      const next = new Set(prev);
      if (next.has(blockId)) {
        next.delete(blockId);
      } else {
        next.add(blockId);
      }
      return next;
    });
  };

  // === Блоки ===
  const handleAddBlock = async () => {
    if (!newBlockName || !newBlockWeight) return;
    setIsLoading(true);
    try {
      await kpisApi.addBlock(localKpi.id, {
        name: newBlockName,
        weight: parseFloat(newBlockWeight),
      });
      await refreshKpi();
      setNewBlockName('');
      setNewBlockWeight('');
      setShowAddBlock(false);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка добавления блока');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateBlock = async (blockId: number, name: string, weight: number) => {
    setIsLoading(true);
    try {
      await kpisApi.updateBlock(localKpi.id, blockId, { name, weight });
      await refreshKpi();
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка обновления блока');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBlock = async (blockId: number) => {
    if (!confirm('Удалить блок и все его показатели?')) return;
    setIsLoading(true);
    try {
      await kpisApi.deleteBlock(localKpi.id, blockId);
      await refreshKpi();
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка удаления блока');
    } finally {
      setIsLoading(false);
    }
  };

  // === Показатели ===
  const handleAddTask = async (blockId: number) => {
    if (!newTaskName || !newTaskWeight) return;
    setIsLoading(true);
    try {
      await kpisApi.addTask(localKpi.id, blockId, {
        name: newTaskName,
        weight: parseFloat(newTaskWeight),
        unit: newTaskUnit || 'шт',
        planValue: parseFloat(newTaskPlanValue) || 100,
      });
      await refreshKpi();
      setNewTaskName('');
      setNewTaskWeight('');
      setNewTaskUnit('шт');
      setNewTaskPlanValue('');
      setAddingTaskToBlock(null);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка добавления показателя');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateTask = async (
    blockId: number,
    taskId: number,
    data: { name?: string; weight?: number; unit?: string; planValue?: number }
  ) => {
    setIsLoading(true);
    try {
      await kpisApi.updateTask(localKpi.id, blockId, taskId, data);
      await refreshKpi();
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка обновления показателя');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTask = async (blockId: number, taskId: number) => {
    if (!confirm('Удалить показатель?')) return;
    setIsLoading(true);
    try {
      await kpisApi.deleteTask(localKpi.id, blockId, taskId);
      await refreshKpi();
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка удаления показателя');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignUser = async (userId: number) => {
    try {
      await kpisApi.assignUsers(localKpi.id, [userId]);
      await refreshKpi();
      setAssignSearch('');
      setShowAssignSearch(false);
    } catch (err) {
      setError('Ошибка назначения сотрудника');
    }
  };

  const handleRemoveAssignment = async (userId: number) => {
    try {
      await kpisApi.removeAssignment(localKpi.id, userId);
      await refreshKpi();
    } catch (err) {
      setError('Ошибка удаления назначения');
    }
  };

  const handleSubmitForApproval = async () => {
    setError(null);
    setValidationErrors([]);

    try {
      await kpisApi.submitForApproval(localKpi.id);
      await refreshKpi();
      onRefresh();
    } catch (err: any) {
      if (err.response?.data?.errors) {
        setValidationErrors(err.response.data.errors);
      } else {
        setError(err.response?.data?.error || 'Ошибка отправки на согласование');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-slate-900">{localKpi.title}</h2>
              <StatusBadge status={localKpi.status} />
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Срок: {new Date(localKpi.deadline).toLocaleDateString('ru-RU')} | Утверждающий:{' '}
              {localKpi.approver.fullName}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <CloseIcon />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Error */}
          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
          )}

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
              <p className="font-medium mb-2">Ошибки валидации:</p>
              <ul className="list-disc list-inside">
                {validationErrors.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Rejection Reason */}
          {localKpi.status === 'REJECTED' && localKpi.rejectionReason && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <p className="font-medium text-sm">Причина отклонения:</p>
              <p className="text-sm mt-1">{localKpi.rejectionReason}</p>
            </div>
          )}

          {/* Description */}
          {localKpi.description && (
            <div>
              <h3 className="text-sm font-medium text-slate-700 mb-2">Описание</h3>
              <p className="text-sm text-slate-600">{localKpi.description}</p>
            </div>
          )}

          {/* Blocks Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-medium text-slate-700">Блоки и показатели</h3>
                {(localKpi.blocks || []).length > 0 && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      weightValid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}
                  >
                    Сумма весов блоков: {totalBlockWeight.toFixed(0)}%
                  </span>
                )}
              </div>
              {canEdit && (
                <button
                  onClick={() => setShowAddBlock(true)}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <PlusIcon /> Добавить блок
                </button>
              )}
            </div>

            {/* Форма добавления блока */}
            {showAddBlock && canEdit && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-sm font-medium text-slate-700 mb-3">Новый блок</h4>
                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <label className="text-xs text-slate-500 mb-1 block">Название</label>
                    <input
                      type="text"
                      value={newBlockName}
                      onChange={(e) => setNewBlockName(e.target.value)}
                      className="input-field"
                      placeholder="Название блока"
                    />
                  </div>
                  <div className="w-24">
                    <label className="text-xs text-slate-500 mb-1 block">Вес %</label>
                    <input
                      type="number"
                      value={newBlockWeight}
                      onChange={(e) => setNewBlockWeight(e.target.value)}
                      className="input-field"
                      placeholder="25"
                      min="0"
                      max="100"
                    />
                  </div>
                  <button
                    onClick={handleAddBlock}
                    disabled={isLoading || !newBlockName || !newBlockWeight}
                    className="btn-primary"
                  >
                    Добавить
                  </button>
                  <button
                    onClick={() => {
                      setShowAddBlock(false);
                      setNewBlockName('');
                      setNewBlockWeight('');
                    }}
                    className="btn-secondary"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            )}

            {(localKpi.blocks || []).length > 0 ? (
              <div className="space-y-3">
                {localKpi.blocks.map((block, blockIndex) => {
                  const isExpanded = expandedBlocks.has(block.id);
                  const taskWeight = (block.tasks || []).reduce((sum, t) => sum + t.weight, 0);
                  const taskWeightValid = (block.tasks || []).length === 0 || Math.abs(taskWeight - 100) < 0.01;

                  return (
                    <div key={block.id} className="border border-slate-200 rounded-lg overflow-hidden">
                      {/* Block Header */}
                      <div className="bg-slate-50 px-4 py-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => toggleBlockExpanded(block.id)}
                              className="text-slate-500 hover:text-slate-700"
                            >
                              <svg
                                className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                            <span className="text-sm font-medium text-slate-500">{blockIndex + 1}.</span>
                            {canEdit ? (
                              <input
                                type="text"
                                defaultValue={block.name}
                                onBlur={(e) => {
                                  if (e.target.value !== block.name) {
                                    handleUpdateBlock(block.id, e.target.value, block.weight);
                                  }
                                }}
                                className="input-field py-1 text-sm font-medium"
                                style={{ width: Math.max(150, block.name.length * 8) }}
                              />
                            ) : (
                              <span className="font-medium text-slate-900">{block.name}</span>
                            )}
                            <div className="flex items-center gap-1">
                              {canEdit ? (
                                <>
                                  <input
                                    type="number"
                                    defaultValue={block.weight}
                                    onBlur={(e) => {
                                      const newWeight = parseFloat(e.target.value);
                                      if (newWeight !== block.weight) {
                                        handleUpdateBlock(block.id, block.name, newWeight);
                                      }
                                    }}
                                    className="input-field py-1 text-sm w-16 text-center"
                                    min="0"
                                    max="100"
                                  />
                                  <span className="text-xs text-slate-500">%</span>
                                </>
                              ) : (
                                <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                                  {block.weight}%
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500">
                              {block.tasks?.length || 0} показ.
                            </span>
                            {(block.tasks || []).length > 0 && (
                              <span
                                className={`text-xs px-2 py-0.5 rounded ${
                                  taskWeightValid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                }`}
                              >
                                {taskWeight.toFixed(0)}%
                              </span>
                            )}
                            {canEdit && (
                              <button
                                onClick={() => handleDeleteBlock(block.id)}
                                className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                                title="Удалить блок"
                              >
                                <TrashIcon />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Block Tasks */}
                      {isExpanded && (
                        <div className="border-t border-slate-200">
                          {/* Кнопка добавления показателя */}
                          {canEdit && (
                            <div className="px-4 py-2 bg-slate-25 border-b border-slate-100">
                              {addingTaskToBlock === block.id ? (
                                <div className="space-y-3">
                                  <div className="grid grid-cols-12 gap-2 items-end">
                                    <div className="col-span-4">
                                      <label className="text-xs text-slate-500 mb-1 block">Название</label>
                                      <input
                                        type="text"
                                        value={newTaskName}
                                        onChange={(e) => setNewTaskName(e.target.value)}
                                        className="input-field text-sm"
                                        placeholder="Наименование показателя"
                                      />
                                    </div>
                                    <div className="col-span-2">
                                      <label className="text-xs text-slate-500 mb-1 block">Вес %</label>
                                      <input
                                        type="number"
                                        value={newTaskWeight}
                                        onChange={(e) => setNewTaskWeight(e.target.value)}
                                        className="input-field text-sm"
                                        placeholder="25"
                                        min="0"
                                        max="100"
                                      />
                                    </div>
                                    <div className="col-span-2">
                                      <label className="text-xs text-slate-500 mb-1 block">План</label>
                                      <input
                                        type="number"
                                        value={newTaskPlanValue}
                                        onChange={(e) => setNewTaskPlanValue(e.target.value)}
                                        className="input-field text-sm"
                                        placeholder="100"
                                      />
                                    </div>
                                    <div className="col-span-2">
                                      <label className="text-xs text-slate-500 mb-1 block">Ед. изм.</label>
                                      <input
                                        type="text"
                                        value={newTaskUnit}
                                        onChange={(e) => setNewTaskUnit(e.target.value)}
                                        className="input-field text-sm"
                                        placeholder="шт"
                                      />
                                    </div>
                                    <div className="col-span-2 flex gap-1">
                                      <button
                                        onClick={() => handleAddTask(block.id)}
                                        disabled={isLoading || !newTaskName || !newTaskWeight}
                                        className="btn-primary text-sm py-2 px-3"
                                      >
                                        OK
                                      </button>
                                      <button
                                        onClick={() => {
                                          setAddingTaskToBlock(null);
                                          setNewTaskName('');
                                          setNewTaskWeight('');
                                          setNewTaskUnit('шт');
                                          setNewTaskPlanValue('');
                                        }}
                                        className="btn-secondary text-sm py-2 px-3"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setAddingTaskToBlock(block.id)}
                                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                                >
                                  <PlusIcon /> Добавить показатель
                                </button>
                              )}
                            </div>
                          )}

                          {/* Tasks List */}
                          {(block.tasks || []).length > 0 ? (
                            <div className="divide-y divide-slate-100">
                              {block.tasks.map((task, taskIndex) => (
                                <div key={task.id} className="px-4 py-3">
                                  {canEdit ? (
                                    <div className="grid grid-cols-12 gap-2 items-center">
                                      <div className="col-span-1 text-sm text-slate-500 font-medium">
                                        {blockIndex + 1}.{taskIndex + 1}
                                      </div>
                                      <div className="col-span-4">
                                        <input
                                          type="text"
                                          defaultValue={task.name}
                                          onBlur={(e) => {
                                            if (e.target.value !== task.name) {
                                              handleUpdateTask(block.id, task.id, { name: e.target.value });
                                            }
                                          }}
                                          className="input-field text-sm"
                                        />
                                      </div>
                                      <div className="col-span-2">
                                        <div className="flex items-center gap-1">
                                          <input
                                            type="number"
                                            defaultValue={task.weight}
                                            onBlur={(e) => {
                                              const newWeight = parseFloat(e.target.value);
                                              if (newWeight !== task.weight) {
                                                handleUpdateTask(block.id, task.id, { weight: newWeight });
                                              }
                                            }}
                                            className="input-field text-sm w-16"
                                            min="0"
                                            max="100"
                                          />
                                          <span className="text-xs text-slate-500">%</span>
                                        </div>
                                      </div>
                                      <div className="col-span-2">
                                        <div className="flex items-center gap-1">
                                          <input
                                            type="number"
                                            defaultValue={task.planValue}
                                            onBlur={(e) => {
                                              const newPlan = parseFloat(e.target.value);
                                              if (newPlan !== task.planValue) {
                                                handleUpdateTask(block.id, task.id, { planValue: newPlan });
                                              }
                                            }}
                                            className="input-field text-sm w-20"
                                          />
                                        </div>
                                      </div>
                                      <div className="col-span-2">
                                        <input
                                          type="text"
                                          defaultValue={task.unit}
                                          onBlur={(e) => {
                                            if (e.target.value !== task.unit) {
                                              handleUpdateTask(block.id, task.id, { unit: e.target.value });
                                            }
                                          }}
                                          className="input-field text-sm"
                                          placeholder="шт"
                                        />
                                      </div>
                                      <div className="col-span-1 flex justify-end">
                                        <button
                                          onClick={() => handleDeleteTask(block.id, task.id)}
                                          className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                                          title="Удалить"
                                        >
                                          <TrashIcon />
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm text-slate-500 font-medium">
                                          {blockIndex + 1}.{taskIndex + 1}
                                        </span>
                                        <span className="text-sm text-slate-700">{task.name}</span>
                                      </div>
                                      <div className="flex items-center gap-3 text-xs text-slate-500">
                                        <span>Вес: {task.weight}%</span>
                                        <span>План: {task.planValue} {task.unit}</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="px-4 py-6 text-center text-sm text-slate-500">
                              Нет показателей в блоке
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="border border-dashed border-slate-200 rounded-lg p-8 text-center">
                <p className="text-sm text-slate-500 mb-3">Нет блоков и показателей</p>
                {canEdit && (
                  <button
                    onClick={() => setShowAddBlock(true)}
                    className="btn-secondary inline-flex items-center gap-2"
                  >
                    <PlusIcon /> Добавить первый блок
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Assignments Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-slate-700">
                Назначенные сотрудники ({localKpi.assignments.length})
              </h3>
              {canEdit && (
                <button
                  onClick={() => setShowAssignSearch(!showAssignSearch)}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <PlusIcon /> Назначить
                </button>
              )}
            </div>

            {showAssignSearch && canEdit && (
              <div className="mb-4 relative">
                <input
                  type="text"
                  value={assignSearch}
                  onChange={(e) => setAssignSearch(e.target.value)}
                  className="input-field"
                  placeholder="Поиск сотрудника по имени или должности..."
                  autoFocus
                />
                {filteredUsersForAssign.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
                    {filteredUsersForAssign.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => handleAssignUser(user.id)}
                        className="w-full text-left px-4 py-2 hover:bg-slate-50 border-b border-slate-100 last:border-b-0"
                      >
                        <p className="text-sm font-medium text-slate-900">{user.fullName}</p>
                        <p className="text-xs text-slate-500">
                          {user.position} {user.group?.name && `| ${user.group.name}`}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              {localKpi.assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-slate-200 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-slate-600">
                        {assignment.user.fullName
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {assignment.user.fullName}
                      </p>
                      <p className="text-xs text-slate-500">{assignment.user.position}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {assignment.isSubmitted && (
                      <span className="badge-success text-xs">Отправлено</span>
                    )}
                    {canEdit && (
                      <button
                        onClick={() => handleRemoveAssignment(assignment.userId)}
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                      >
                        <CloseIcon />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {localKpi.assignments.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-4">
                  Нет назначенных сотрудников
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        {(canEdit || canDelete) && (
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
            <div className="flex justify-between">
              {canDelete && (
                <button
                  onClick={() => onDelete && onDelete(localKpi)}
                  className="btn-danger flex items-center gap-2"
                >
                  <TrashIcon /> Удалить KPI
                </button>
              )}
              {canEdit && (
                <button
                  onClick={handleSubmitForApproval}
                  disabled={!weightValid || (localKpi.blocks || []).length === 0 || localKpi.assignments.length === 0}
                  className="btn-primary flex items-center gap-2 ml-auto"
                >
                  <SendIcon /> Отправить на согласование
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Main Page Component
const KpiManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const [kpis, setKpis] = useState<Kpi[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<KpiStatus | 'ALL'>('ALL');
  const [editingKpi, setEditingKpi] = useState<Kpi | null>(null);
  const [selectedKpi, setSelectedKpi] = useState<Kpi | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Kpi | null>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [kpisRes, usersRes] = await Promise.all([
        kpisApi.getAll(statusFilter === 'ALL' ? undefined : statusFilter),
        usersApi.getAll(),
      ]);
      setKpis(kpisRes.data);
      setUsers(usersRes.data);
      setError(null);
    } catch (err) {
      setError('Ошибка загрузки данных');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const handleUpdate = async (data: CreateKpiData): Promise<Kpi> => {
    if (!editingKpi) throw new Error('No KPI to update');
    const response = await kpisApi.update(editingKpi.id, data);
    setKpis((prev) => prev.map((k) => (k.id === editingKpi.id ? response.data : k)));
    setEditingKpi(null);
    return response.data;
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await kpisApi.delete(deleteConfirm.id);
      setKpis((prev) => prev.filter((k) => k.id !== deleteConfirm.id));
      setDeleteConfirm(null);
    } catch (err) {
      setError('Ошибка удаления KPI');
    }
  };

  const filteredKpis = useMemo(() => {
    if (statusFilter === 'ALL') return kpis;
    return kpis.filter((k) => k.status === statusFilter);
  }, [kpis, statusFilter]);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
          <p className="mt-4 text-sm text-slate-500">Загрузка...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Управление KPI</h1>
          <p className="text-sm text-slate-500 mt-1">
            Создание и управление KPI для сотрудников
          </p>
        </div>
        <button onClick={() => navigate('/kpis/new')} className="btn-primary flex items-center gap-2">
          <PlusIcon /> Создать KPI
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">{error}</div>
      )}

      {/* Status Filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {(['ALL', 'DRAFT', 'PENDING_APPROVAL', 'REJECTED', 'APPROVED', 'COMPLETED'] as const).map(
          (status) => {
            const labels: Record<string, string> = {
              ALL: 'Все',
              DRAFT: 'Черновики',
              PENDING_APPROVAL: 'На согласовании',
              REJECTED: 'Отклоненные',
              APPROVED: 'Утвержденные',
              COMPLETED: 'Завершенные',
            };
            const count = status === 'ALL' ? kpis.length : kpis.filter(k => k.status === status).length;
            return (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === status
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {labels[status]} ({count})
              </button>
            );
          }
        )}
      </div>

      {/* KPI List */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Название
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Статус
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Срок
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Утверждающий
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Задачи
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Сотрудники
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredKpis.map((kpi) => (
                <tr key={kpi.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <button
                      onClick={() => setSelectedKpi(kpi)}
                      className="text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      {kpi.title}
                    </button>
                    {kpi.description && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                        {kpi.description}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={kpi.status} />
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {new Date(kpi.deadline).toLocaleDateString('ru-RU')}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{kpi.approver.fullName}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{kpi._count?.blocks || kpi.blocks?.length || 0}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {kpi._count?.assignments || kpi.assignments.length}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1">
                      <button
                        onClick={() => setSelectedKpi(kpi)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded"
                        title="Открыть"
                      >
                        <EditIcon />
                      </button>
                      {(kpi.status === 'DRAFT' || kpi.status === 'REJECTED') && (
                        <button
                          onClick={() => setEditingKpi(kpi)}
                          className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                          title="Редактировать"
                        >
                          <EditIcon />
                        </button>
                      )}
                      {(kpi.status === 'DRAFT' || kpi.status === 'REJECTED' || kpi.status === 'APPROVED') && (
                        <button
                          onClick={() => setDeleteConfirm(kpi)}
                          className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                          title="Удалить"
                        >
                          <TrashIcon />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredKpis.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-500">
                    Нет KPI
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingKpi && (
        <KpiFormModal
          kpi={editingKpi}
          users={users}
          onSave={handleUpdate}
          onClose={() => setEditingKpi(null)}
        />
      )}

      {/* Detail Modal */}
      {selectedKpi && (
        <KpiDetailModal
          kpi={selectedKpi}
          users={users}
          onClose={() => setSelectedKpi(null)}
          onRefresh={fetchData}
          onDelete={(kpi) => {
            setSelectedKpi(null);
            setDeleteConfirm(kpi);
          }}
        />
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Удалить KPI?</h3>
            <p className="text-sm text-slate-600 mb-6">
              Вы уверены, что хотите удалить KPI "{deleteConfirm.title}"? Это действие нельзя
              отменить.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary">
                Отмена
              </button>
              <button onClick={handleDelete} className="btn-danger">
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default KpiManagementPage;
