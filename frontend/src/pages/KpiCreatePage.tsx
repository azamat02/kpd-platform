import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  kpisApi,
  usersApi,
  User,
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

const ArrowLeftIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
  </svg>
);

const ChevronUpIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 15l7-7 7 7" />
  </svg>
);

// Предопределенные единицы измерения
const UNIT_OPTIONS = ['%', 'Шт.', 'Ед.', 'Кол-во', 'Справочник', 'Семинар', 'Стратегия развития', 'Система', 'Анализ', 'другое'];

// Local interfaces for form state
interface LocalTask {
  id: string;
  name: string;
  weight: string;
  unit: string;
  planValue: string;
  isOptional: boolean;
}

interface LocalBlock {
  id: string;
  name: string;
  weight: string;
  tasks: LocalTask[];
  isExpanded: boolean;
}

const KpiCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [approverId, setApproverId] = useState<number | ''>('');
  const [approverSearch, setApproverSearch] = useState('');
  const [assigneeId, setAssigneeId] = useState<number | ''>('');
  const [assigneeSearch, setAssigneeSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [blocks, setBlocks] = useState<LocalBlock[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await usersApi.getAll();
        setUsers(response.data);
      } catch (err) {
        setError('Ошибка загрузки пользователей');
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, []);

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

  const filteredAssignees = useMemo(() => {
    if (!assigneeSearch) return users.slice(0, 10);
    const search = assigneeSearch.toLowerCase();
    return users
      .filter(
        (u) =>
          u.fullName.toLowerCase().includes(search) ||
          u.position.toLowerCase().includes(search)
      )
      .slice(0, 10);
  }, [users, assigneeSearch]);

  const selectedAssignee = users.find((u) => u.id === assigneeId);

  // Block weight calculations
  const totalBlockWeight = useMemo(() => {
    return blocks.reduce((sum, b) => sum + (parseFloat(b.weight) || 0), 0);
  }, [blocks]);
  const blockWeightValid = blocks.length === 0 || Math.abs(totalBlockWeight - 100) < 0.01;

  // Check if all blocks have valid task weights (excluding optional tasks)
  const allTaskWeightsValid = useMemo(() => {
    return blocks.every((block) => {
      const requiredTasks = block.tasks.filter((t) => !t.isOptional);
      if (requiredTasks.length === 0) return true;
      const totalTaskWeight = requiredTasks.reduce((sum, t) => sum + (parseFloat(t.weight) || 0), 0);
      return Math.abs(totalTaskWeight - 100) < 0.01;
    });
  }, [blocks]);

  // Block management functions
  const addBlock = () => {
    setBlocks([
      ...blocks,
      { id: Date.now().toString(), name: '', weight: '', tasks: [], isExpanded: true },
    ]);
  };

  const updateBlock = (id: string, field: keyof LocalBlock, value: any) => {
    setBlocks(blocks.map((b) => (b.id === id ? { ...b, [field]: value } : b)));
  };

  const removeBlock = (id: string) => {
    setBlocks(blocks.filter((b) => b.id !== id));
  };

  const toggleBlockExpanded = (id: string) => {
    setBlocks(blocks.map((b) => (b.id === id ? { ...b, isExpanded: !b.isExpanded } : b)));
  };

  // Task management functions
  const addTask = (blockId: string) => {
    setBlocks(
      blocks.map((b) =>
        b.id === blockId
          ? { ...b, tasks: [...b.tasks, { id: Date.now().toString(), name: '', weight: '', unit: '%', planValue: '', isOptional: false }] }
          : b
      )
    );
  };

  const updateTask = (blockId: string, taskId: string, field: keyof LocalTask, value: string | boolean) => {
    setBlocks(
      blocks.map((b) =>
        b.id === blockId
          ? { ...b, tasks: b.tasks.map((t) => (t.id === taskId ? { ...t, [field]: value } : t)) }
          : b
      )
    );
  };

  const removeTask = (blockId: string, taskId: string) => {
    setBlocks(
      blocks.map((b) =>
        b.id === blockId ? { ...b, tasks: b.tasks.filter((t) => t.id !== taskId) } : b
      )
    );
  };

  const getBlockTaskWeight = (block: LocalBlock) => {
    // Считаем только обязательные (не опциональные) показатели
    return block.tasks.filter((t) => !t.isOptional).reduce((sum, t) => sum + (parseFloat(t.weight) || 0), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !deadline || !approverId || !assigneeId) return;

    setIsSubmitting(true);
    setError(null);
    try {
      // 1. Create KPI
      const response = await kpisApi.create({
        title,
        description: description || undefined,
        deadline,
        approverId: approverId as number,
      });

      const createdKpi = response.data;

      // 2. Assign employee
      await kpisApi.assignUsers(createdKpi.id, [assigneeId as number]);

      // 3. Add blocks and tasks
      for (const block of blocks) {
        if (block.name && block.weight) {
          const blockResponse = await kpisApi.addBlock(createdKpi.id, {
            name: block.name,
            weight: parseFloat(block.weight),
          });

          // Add tasks to this block
          for (const task of block.tasks) {
            if (task.name && task.weight) {
              await kpisApi.addTask(createdKpi.id, blockResponse.data.id, {
                name: task.name,
                weight: parseFloat(task.weight),
                unit: task.unit || 'шт',
                planValue: parseFloat(task.planValue) || 100,
                isOptional: task.isOptional,
              });
            }
          }
        }
      }

      // Navigate back to KPI list
      navigate('/kpis');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка сохранения');
    } finally {
      setIsSubmitting(false);
    }
  };

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
      <div className="mb-6">
        <button
          onClick={() => navigate('/kpis')}
          className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-4"
        >
          <ArrowLeftIcon /> Назад к списку KPI
        </button>
        <h1 className="text-2xl font-bold text-slate-900">Создать KPI</h1>
        <p className="text-sm text-slate-500 mt-1">
          Заполните информацию о KPI, добавьте блоки и показатели
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-1 space-y-6">
            <div className="card p-6 space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">Основная информация</h2>

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
                  Сотрудник *
                </label>
                {selectedAssignee ? (
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {selectedAssignee.fullName}
                      </p>
                      <p className="text-xs text-slate-500">{selectedAssignee.position}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAssigneeId('')}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <CloseIcon />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={assigneeSearch}
                      onChange={(e) => setAssigneeSearch(e.target.value)}
                      className="input-field"
                      placeholder="Поиск по имени или должности..."
                    />
                    {filteredAssignees.length > 0 && (
                      <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-lg">
                        {filteredAssignees.map((user) => (
                          <button
                            key={user.id}
                            type="button"
                            onClick={() => {
                              setAssigneeId(user.id);
                              setAssigneeSearch('');
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
            </div>
          </div>

          {/* Right Column - Blocks and Tasks */}
          <div className="lg:col-span-2">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold text-slate-900">Блоки и показатели</h2>
                  {blocks.length > 0 && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        blockWeightValid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}
                    >
                      Сумма весов блоков: {totalBlockWeight.toFixed(0)}%
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={addBlock}
                  className="btn-secondary flex items-center gap-2"
                >
                  <PlusIcon /> Добавить блок
                </button>
              </div>

              {blocks.length > 0 ? (
                <div className="space-y-4">
                  {blocks.map((block) => {
                    const taskWeight = getBlockTaskWeight(block);
                    const taskWeightValid = block.tasks.length === 0 || Math.abs(taskWeight - 100) < 0.01;

                    return (
                      <div key={block.id} className="border border-slate-200 rounded-lg overflow-hidden">
                        {/* Block Header */}
                        <div className="bg-slate-50 px-4 py-3 flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => toggleBlockExpanded(block.id)}
                            className="text-slate-500 hover:text-slate-700"
                          >
                            {block.isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                          </button>
                          <div className="flex-1 grid grid-cols-2 gap-3">
                            <input
                              type="text"
                              value={block.name}
                              onChange={(e) => updateBlock(block.id, 'name', e.target.value)}
                              className="input-field"
                              placeholder="Название блока"
                            />
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                value={block.weight}
                                onChange={(e) => updateBlock(block.id, 'weight', e.target.value)}
                                className="input-field w-24"
                                placeholder="Вес %"
                                min="0"
                                max="100"
                              />
                              <span className="text-sm text-slate-500">%</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeBlock(block.id)}
                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                          >
                            <TrashIcon />
                          </button>
                        </div>

                        {/* Block Tasks */}
                        {block.isExpanded && (
                          <div className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-slate-700">Показатели</span>
                                {block.tasks.length > 0 && (
                                  <span
                                    className={`text-xs px-2 py-0.5 rounded ${
                                      taskWeightValid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                    }`}
                                  >
                                    {taskWeight.toFixed(0)}%
                                  </span>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => addTask(block.id)}
                                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                              >
                                <PlusIcon /> Добавить показатель
                              </button>
                            </div>

                            {block.tasks.length > 0 ? (
                              <div className="space-y-2">
                                {block.tasks.map((task, taskIndex) => {
                                  const blockIndex = blocks.findIndex((b) => b.id === block.id);
                                  const taskNumber = `${blockIndex + 1}.${taskIndex + 1}`;
                                  const isCustomUnit = !['%', 'Шт.', 'Ед.', 'Кол-во', 'Справочник', 'Семинар', 'Стратегия развития', 'Система', 'Анализ'].includes(task.unit);

                                  return (
                                    <div key={task.id} className="bg-slate-50 p-3 rounded-lg space-y-3">
                                      {/* Row 1: Number, Name, Weight */}
                                      <div className="flex items-center gap-3">
                                        <span className="text-sm font-medium text-slate-500 w-8">{taskNumber}</span>
                                        <input
                                          type="text"
                                          value={task.name}
                                          onChange={(e) => updateTask(block.id, task.id, 'name', e.target.value)}
                                          className="input-field flex-1"
                                          placeholder="Наименование показателя"
                                        />
                                        <div className="flex items-center gap-2">
                                          <input
                                            type="number"
                                            value={task.weight}
                                            onChange={(e) => updateTask(block.id, task.id, 'weight', e.target.value)}
                                            className="input-field w-20"
                                            placeholder="Вес"
                                            min="0"
                                            max="100"
                                          />
                                          <span className="text-sm text-slate-500">%</span>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => removeTask(block.id, task.id)}
                                          className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                                        >
                                          <TrashIcon />
                                        </button>
                                      </div>

                                      {/* Row 2: Unit and Plan Value */}
                                      <div className="flex items-center gap-3 ml-11">
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs text-slate-500">Ед. изм.:</span>
                                          <select
                                            value={isCustomUnit ? 'другое' : task.unit}
                                            onChange={(e) => {
                                              if (e.target.value === 'другое') {
                                                updateTask(block.id, task.id, 'unit', '');
                                              } else {
                                                updateTask(block.id, task.id, 'unit', e.target.value);
                                              }
                                            }}
                                            className="input-field w-24 text-sm"
                                          >
                                            {UNIT_OPTIONS.map((opt) => (
                                              <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                          </select>
                                          {(isCustomUnit || task.unit === '') && (
                                            <input
                                              type="text"
                                              value={isCustomUnit ? task.unit : ''}
                                              onChange={(e) => updateTask(block.id, task.id, 'unit', e.target.value)}
                                              className="input-field w-24 text-sm"
                                              placeholder="Своя ед."
                                            />
                                          )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs text-slate-500">План:</span>
                                          <input
                                            type="number"
                                            value={task.planValue}
                                            onChange={(e) => updateTask(block.id, task.id, 'planValue', e.target.value)}
                                            className="input-field w-24 text-sm"
                                            placeholder="План"
                                            min="0"
                                            step="0.01"
                                          />
                                          <span className="text-xs text-slate-500">{task.unit || 'ед.'}</span>
                                        </div>
                                        <label className="flex items-center gap-2 ml-4 cursor-pointer">
                                          <input
                                            type="checkbox"
                                            checked={task.isOptional}
                                            onChange={(e) => updateTask(block.id, task.id, 'isOptional', e.target.checked)}
                                            className="w-4 h-4 text-blue-600 rounded border-slate-300"
                                          />
                                          <span className="text-xs text-slate-500">Опционально</span>
                                        </label>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <p className="text-sm text-slate-500 text-center py-4 border border-dashed border-slate-200 rounded-lg">
                                Нет показателей в этом блоке
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 border border-dashed border-slate-200 rounded-lg">
                  <p className="text-sm text-slate-500 mb-4">
                    Добавьте блоки с показателями для KPI
                  </p>
                  <button
                    type="button"
                    onClick={addBlock}
                    className="btn-secondary inline-flex items-center gap-2"
                  >
                    <PlusIcon /> Добавить первый блок
                  </button>
                </div>
              )}

              {!blockWeightValid && blocks.length > 0 && (
                <p className="mt-3 text-sm text-red-600">
                  Сумма весов всех блоков должна быть равна 100%
                </p>
              )}

              {!allTaskWeightsValid && blocks.length > 0 && (
                <p className="mt-3 text-sm text-red-600">
                  Сумма весов показателей в каждом блоке должна быть равна 100%
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={() => navigate('/kpis')}
            className="btn-secondary"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !title || !deadline || !approverId || !assigneeId}
            className="btn-primary"
          >
            {isSubmitting ? 'Сохранение...' : 'Создать KPI'}
          </button>
        </div>
      </form>
    </Layout>
  );
};

export default KpiCreatePage;
