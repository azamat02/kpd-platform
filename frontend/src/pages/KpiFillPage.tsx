import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MyKpiAssignment, kpisApi, KpiBlock } from '../services/api';

const ArrowLeftIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const SendIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

const SaveIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const KpiFillPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [assignment, setAssignment] = useState<MyKpiAssignment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [factValues, setFactValues] = useState<Record<number, { factValue: number; comment: string }>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [expandedBlocks, setExpandedBlocks] = useState<Set<number>>(new Set());

  const fetchKpiDetails = useCallback(async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const response = await kpisApi.getMyKpiDetails(parseInt(id));
      setAssignment(response.data);

      // Initialize fact values
      const values: Record<number, { factValue: number; comment: string }> = {};
      (response.data.kpi.blocks || []).forEach((block) => {
        (block.tasks || []).forEach((task) => {
          const existingFact = response.data.factValues.find((f) => f.taskId === task.id);
          values[task.id] = {
            factValue: existingFact?.factValue ?? 0,
            comment: existingFact?.comment || '',
          };
        });
      });
      setFactValues(values);

      // Expand all blocks by default
      const blockIds = new Set((response.data.kpi.blocks || []).map((b) => b.id));
      setExpandedBlocks(blockIds);

      setError(null);
    } catch (err) {
      setError('Ошибка загрузки KPI');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchKpiDetails();
  }, [fetchKpiDetails]);

  const handleSliderChange = (taskId: number, value: number) => {
    setFactValues((prev) => ({
      ...prev,
      [taskId]: { ...prev[taskId], factValue: value },
    }));
    setSaveSuccess(false);
  };

  const handleCommentChange = (taskId: number, comment: string) => {
    setFactValues((prev) => ({
      ...prev,
      [taskId]: { ...prev[taskId], comment },
    }));
    setSaveSuccess(false);
  };

  const toggleBlock = (blockId: number) => {
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

  const handleSave = async () => {
    if (!assignment) return;
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const facts = Object.entries(factValues).map(([taskId, data]) => ({
        taskId: parseInt(taskId),
        factValue: data.factValue,
        comment: data.comment || undefined,
      }));
      await kpisApi.saveFactValues(assignment.kpi.id, facts);
      setSaveSuccess(true);
      setError(null);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError('Ошибка сохранения данных');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!assignment) return;
    if (!confirm('Отправить результаты? После отправки изменения будут невозможны.')) return;

    setIsSubmitting(true);
    try {
      const facts = Object.entries(factValues).map(([taskId, data]) => ({
        taskId: parseInt(taskId),
        factValue: data.factValue,
        comment: data.comment || undefined,
      }));
      await kpisApi.saveFactValues(assignment.kpi.id, facts);
      await kpisApi.submitResults(assignment.kpi.id);
      navigate('/portal');
    } catch (err: any) {
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Ошибка отправки результатов');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate block progress
  const getBlockProgress = (block: KpiBlock): number => {
    const tasks = block.tasks || [];
    if (tasks.length === 0) return 0;
    const filledCount = tasks.filter((task) => factValues[task.id]?.factValue > 0).length;
    return Math.round((filledCount / tasks.length) * 100);
  };

  // Calculate task completion percentage (fact / plan * 100)
  const getTaskCompletion = (task: KpiBlock['tasks'][0]): number => {
    const factValue = factValues[task.id]?.factValue || 0;
    const planValue = task.planValue || 100;
    if (planValue === 0) return factValue > 0 ? 100 : 0;
    return Math.round((factValue / planValue) * 100);
  };

  // Calculate block weighted score based on task completion
  const getBlockScore = (block: KpiBlock): number => {
    const tasks = block.tasks || [];
    if (tasks.length === 0) return 0;
    const totalWeight = tasks.reduce((sum, t) => sum + t.weight, 0);
    if (totalWeight === 0) return 0;
    const weightedSum = tasks.reduce((sum, task) => {
      const completion = getTaskCompletion(task);
      return sum + (completion * task.weight / 100);
    }, 0);
    return Math.round(weightedSum / totalWeight * 100);
  };

  // Calculate overall progress
  const getOverallProgress = (): number => {
    if (!assignment) return 0;
    const allTasks = (assignment.kpi.blocks || []).flatMap((b) => b.tasks || []);
    if (allTasks.length === 0) return 0;
    const filledCount = allTasks.filter((task) => factValues[task.id]?.factValue > 0).length;
    return Math.round((filledCount / allTasks.length) * 100);
  };

  // Calculate overall weighted score
  const getOverallScore = (): number => {
    if (!assignment) return 0;
    const blocks = assignment.kpi.blocks || [];
    const totalBlockWeight = blocks.reduce((sum, b) => sum + b.weight, 0);
    if (totalBlockWeight === 0) return 0;

    const weightedSum = blocks.reduce((sum, block) => {
      const blockScore = getBlockScore(block);
      return sum + (blockScore * block.weight / 100);
    }, 0);

    return Math.round(weightedSum / totalBlockWeight * 100);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 mb-4">KPI не найден</p>
          <button onClick={() => navigate('/portal')} className="btn-primary">
            Вернуться
          </button>
        </div>
      </div>
    );
  }

  const overallProgress = getOverallProgress();
  const overallScore = getOverallScore();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/portal')}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeftIcon />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-slate-900">{assignment.kpi.title}</h1>
                <p className="text-sm text-slate-500">
                  Срок: {new Date(assignment.kpi.deadline).toLocaleDateString('ru-RU')}
                  {assignment.isSubmitted && (
                    <span className="ml-2 inline-flex items-center gap-1 text-green-600">
                      <CheckCircleIcon /> Отправлено
                    </span>
                  )}
                </p>
              </div>
            </div>
            {!assignment.isSubmitted && (
              <div className="flex items-center gap-3">
                {saveSuccess && (
                  <span className="text-sm text-green-600 flex items-center gap-1">
                    <CheckCircleIcon /> Сохранено
                  </span>
                )}
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="btn-secondary flex items-center gap-2"
                >
                  <SaveIcon /> Сохранить
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="btn-primary flex items-center gap-2"
                >
                  <SendIcon /> Отправить
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Overall Progress Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Общий прогресс</h2>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-900">{overallProgress}%</p>
                <p className="text-xs text-slate-500">Заполнено</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{overallScore}%</p>
                <p className="text-xs text-slate-500">Итоговый балл</p>
              </div>
            </div>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>

        {/* Blocks */}
        <div className="space-y-6">
          {(assignment.kpi.blocks || []).map((block) => {
            const blockProgress = getBlockProgress(block);
            const blockScore = getBlockScore(block);
            const isExpanded = expandedBlocks.has(block.id);

            return (
              <div key={block.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                {/* Block Header */}
                <button
                  onClick={() => toggleBlock(block.id)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <svg
                      className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <div className="text-left">
                      <h3 className="font-medium text-slate-900">{block.name}</h3>
                      <p className="text-xs text-slate-500">
                        {(block.tasks || []).length} показателей · Вес блока: {block.weight}%
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-900">{blockProgress}%</p>
                      <p className="text-xs text-slate-500">заполнено</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-blue-600">{blockScore}%</p>
                      <p className="text-xs text-slate-500">балл</p>
                    </div>
                    <div className="w-24">
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 transition-all"
                          style={{ width: `${blockProgress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </button>

                {/* Block Tasks (Indicators) */}
                {isExpanded && (
                  <div className="border-t border-slate-100">
                    {(block.tasks || []).map((task, taskIndex) => {
                      const blockIndex = (assignment.kpi.blocks || []).findIndex((b) => b.id === block.id);
                      const taskNumber = `${blockIndex + 1}.${taskIndex + 1}`;
                      const taskCompletion = getTaskCompletion(task);
                      const planValue = task.planValue || 100;
                      const unit = task.unit || 'шт';

                      return (
                        <div
                          key={task.id}
                          className={`px-6 py-5 ${taskIndex > 0 ? 'border-t border-slate-100' : ''}`}
                        >
                          {/* Header: Number, Name, Weight, Plan */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-bold text-slate-500">{taskNumber}</span>
                                <span className="text-sm font-medium text-slate-900">{task.name}</span>
                                <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                                  Вес: {task.weight}%
                                </span>
                                <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded">
                                  План: {planValue} {unit}
                                </span>
                              </div>
                            </div>
                            <div className="text-right ml-4">
                              <span className={`text-2xl font-bold ${
                                taskCompletion >= 100 ? 'text-green-600' :
                                taskCompletion >= 75 ? 'text-blue-600' :
                                taskCompletion >= 50 ? 'text-yellow-600' : 'text-slate-600'
                              }`}>
                                {taskCompletion}%
                              </span>
                              <p className="text-xs text-slate-500">выполнение</p>
                            </div>
                          </div>

                          {/* Fact Input */}
                          <div className="mb-4">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <label className="text-sm text-slate-600">Факт:</label>
                                <input
                                  type="number"
                                  value={factValues[task.id]?.factValue ?? ''}
                                  onChange={(e) => handleSliderChange(task.id, parseFloat(e.target.value) || 0)}
                                  disabled={assignment.isSubmitted}
                                  className="input-field w-28 text-center font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                  placeholder="0"
                                  min="0"
                                  step="0.01"
                                />
                                <span className="text-sm text-slate-500">{unit}</span>
                              </div>
                              <div className="flex-1">
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full transition-all ${
                                      taskCompletion >= 100 ? 'bg-green-500' :
                                      taskCompletion >= 75 ? 'bg-blue-500' :
                                      taskCompletion >= 50 ? 'bg-yellow-500' : 'bg-slate-400'
                                    }`}
                                    style={{ width: `${Math.min(taskCompletion, 100)}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Plan vs Fact Summary */}
                          <div className="flex items-center gap-4 mb-4 text-sm">
                            <span className="text-slate-500">
                              План: <span className="font-medium text-slate-700">{planValue} {unit}</span>
                            </span>
                            <span className="text-slate-300">|</span>
                            <span className="text-slate-500">
                              Факт: <span className="font-medium text-slate-700">{factValues[task.id]?.factValue ?? 0} {unit}</span>
                            </span>
                            <span className="text-slate-300">|</span>
                            <span className="text-slate-500">
                              Выполнение: <span className={`font-medium ${
                                taskCompletion >= 100 ? 'text-green-600' :
                                taskCompletion >= 75 ? 'text-blue-600' :
                                taskCompletion >= 50 ? 'text-yellow-600' : 'text-slate-600'
                              }`}>{taskCompletion}%</span>
                            </span>
                          </div>

                          {/* Comment */}
                          <div>
                            <label className="text-xs text-slate-500 mb-1 block">
                              Комментарий (необязательно)
                            </label>
                            <textarea
                              value={factValues[task.id]?.comment || ''}
                              onChange={(e) => handleCommentChange(task.id, e.target.value)}
                              disabled={assignment.isSubmitted}
                              className="input-field text-sm resize-none"
                              rows={2}
                              placeholder="Опишите выполненную работу..."
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Actions (mobile) */}
        {!assignment.isSubmitted && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 md:hidden">
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="btn-secondary flex-1 flex items-center justify-center gap-2"
              >
                <SaveIcon /> Сохранить
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                <SendIcon /> Отправить
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default KpiFillPage;
