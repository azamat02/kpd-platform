import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Kpi, MyKpiAssignment, kpisApi, KpiStatus } from '../services/api';

type ViewMode = 'hierarchy' | 'groups';

// Интерфейс для узла дерева групп
interface GroupNode {
  groupId: number;
  groupName: string;
  users: User[];
  childGroups: GroupNode[];
}

const LogoutIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

const ClipboardIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
  </svg>
);

// Структурирование плоского списка в дерево
const buildTree = (subordinates: User[], parentId: number): User[] => {
  return subordinates
    .filter((s) => s.managerId === parentId)
    .map((s) => ({
      ...s,
      subordinatesTree: buildTree(subordinates, s.id),
    }));
};

// Рекурсивный компонент для отображения дерева подчиненных
const SubordinateTree: React.FC<{ subordinates: User[]; level?: number }> = ({
  subordinates,
  level = 0,
}) => {
  if (subordinates.length === 0) return null;

  return (
    <div className={`${level > 0 ? 'ml-8 pl-4 border-l border-slate-200' : ''}`}>
      {subordinates.map((sub) => (
        <div key={sub.id} className="py-3">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-medium text-slate-600">
                {sub.fullName.split(' ').map(n => n[0]).slice(0, 2).join('')}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-900">{sub.fullName}</p>
              <p className="text-xs text-slate-500">
                {sub.position} {sub.group?.name && `· ${sub.group.name}`}
              </p>
            </div>
          </div>
          {sub.subordinatesTree && sub.subordinatesTree.length > 0 && (
            <SubordinateTree subordinates={sub.subordinatesTree} level={level + 1} />
          )}
        </div>
      ))}
    </div>
  );
};

// Функция построения иерархии групп из дерева подчиненных
const buildGroupTree = (
  subordinates: User[],
  parentGroupName: string | null = null
): { groups: GroupNode[]; sameGroupUsers: User[] } => {
  const groupMap = new Map<string, GroupNode>();
  const sameGroupUsers: User[] = [];

  const getOrCreateGroup = (user: User): GroupNode => {
    const groupName = user.group?.name || 'Без группы';
    if (!groupMap.has(groupName)) {
      groupMap.set(groupName, {
        groupId: user.group?.id || 0,
        groupName,
        users: [],
        childGroups: [],
      });
    }
    return groupMap.get(groupName)!;
  };

  const mergeChildGroups = (target: GroupNode, childGroups: GroupNode[]) => {
    for (const child of childGroups) {
      const existing = target.childGroups.find(g => g.groupName === child.groupName);
      if (existing) {
        existing.users.push(...child.users);
        mergeChildGroups(existing, child.childGroups);
      } else {
        target.childGroups.push(child);
      }
    }
  };

  for (const user of subordinates) {
    const userGroupName = user.group?.name || 'Без группы';

    if (userGroupName === parentGroupName) {
      // Пользователь в той же группе что и родитель - добавляем в sameGroupUsers
      sameGroupUsers.push(user);

      // Но его подчиненных обрабатываем рекурсивно
      if (user.subordinatesTree && user.subordinatesTree.length > 0) {
        const result = buildGroupTree(user.subordinatesTree, userGroupName);

        // Подчиненные той же группы тоже добавляются в sameGroupUsers
        sameGroupUsers.push(...result.sameGroupUsers);

        // Дочерние группы мержим в groupMap
        for (const childGroup of result.groups) {
          const existing = groupMap.get(childGroup.groupName);
          if (existing) {
            existing.users.push(...childGroup.users);
            mergeChildGroups(existing, childGroup.childGroups);
          } else {
            groupMap.set(childGroup.groupName, childGroup);
          }
        }
      }
    } else {
      // Пользователь в другой группе - создаем/получаем узел группы
      const node = getOrCreateGroup(user);
      node.users.push(user);

      // Рекурсивно обрабатываем подчиненных
      if (user.subordinatesTree && user.subordinatesTree.length > 0) {
        const result = buildGroupTree(user.subordinatesTree, userGroupName);

        // Подчиненные той же группы добавляются в эту группу
        node.users.push(...result.sameGroupUsers);

        // Дочерние группы мержим
        mergeChildGroups(node, result.groups);
      }
    }
  }

  return { groups: Array.from(groupMap.values()), sameGroupUsers };
};

// Обертка для вызова из компонента
const buildGroupTreeRoot = (subordinates: User[]): GroupNode[] => {
  const result = buildGroupTree(subordinates, null);
  return result.groups;
};

// Рекурсивный подсчет пользователей в группе (включая вложенные)
const countUsersInGroup = (group: GroupNode): number => {
  let count = group.users.length;
  for (const child of group.childGroups) {
    count += countUsersInGroup(child);
  }
  return count;
};

// Рекурсивный компонент для отображения узла дерева групп
const GroupTreeNode: React.FC<{
  group: GroupNode;
  level?: number;
}> = ({ group, level = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const totalCount = countUsersInGroup(group);
  const hasChildren = group.childGroups.length > 0;

  return (
    <div className={level > 0 ? 'ml-6 pl-4 border-l border-slate-200' : ''}>
      <div className="py-2">
        <button
          onClick={() => hasChildren && setIsExpanded(!isExpanded)}
          className={`flex items-center space-x-2 w-full text-left group ${!hasChildren ? 'cursor-default' : ''}`}
        >
          {hasChildren ? (
            <svg
              className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          ) : (
            <div className="w-4 h-4 flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
            </div>
          )}
          <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">
            {group.groupName}
          </span>
          <span className="text-xs text-slate-400">({totalCount})</span>
        </button>
        {isExpanded && hasChildren && (
          <div className="ml-6 pl-4 border-l border-slate-200 mt-1">
            {group.childGroups.map((child) => (
              <GroupTreeNode key={child.groupName} group={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Компонент для отображения подчиненных по группам с иерархией
const SubordinatesByGroup: React.FC<{ subordinatesTree: User[] }> = ({ subordinatesTree }) => {
  const groupTree = buildGroupTreeRoot(subordinatesTree);

  if (groupTree.length === 0) return null;

  return (
    <div>
      {groupTree.map((group) => (
        <GroupTreeNode key={group.groupName} group={group} />
      ))}
    </div>
  );
};

// Icons for KPI sections
const CheckIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
  </svg>
);

const XIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const EyeIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
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

// KPI Approval Section (for approvers)
const KpiApprovalSection: React.FC = () => {
  const [pendingKpis, setPendingKpis] = useState<Kpi[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedKpi, setSelectedKpi] = useState<Kpi | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPendingKpis = async () => {
    try {
      setIsLoading(true);
      const response = await kpisApi.getPendingApproval();
      setPendingKpis(response.data);
      setError(null);
    } catch (err) {
      setError('Ошибка загрузки KPI');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingKpis();
  }, []);

  const handleApprove = async (kpiId: number) => {
    if (!confirm('Утвердить этот KPI?')) return;
    setIsSubmitting(true);
    try {
      await kpisApi.approve(kpiId);
      await fetchPendingKpis();
      setSelectedKpi(null);
    } catch (err) {
      setError('Ошибка утверждения KPI');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async (kpiId: number) => {
    if (!rejectReason.trim()) {
      setError('Укажите причину отклонения');
      return;
    }
    setIsSubmitting(true);
    try {
      await kpisApi.reject(kpiId, rejectReason);
      await fetchPendingKpis();
      setSelectedKpi(null);
      setShowRejectModal(false);
      setRejectReason('');
    } catch (err) {
      setError('Ошибка отклонения KPI');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="card mb-6">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">KPI на утверждение</h2>
        </div>
        <div className="p-6 flex justify-center">
          <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (pendingKpis.length === 0) {
    return null;
  }

  return (
    <div className="card mb-6">
      <div className="px-6 py-4 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">KPI на утверждение</h2>
          <span className="badge-warning">{pendingKpis.length}</span>
        </div>
      </div>

      {error && (
        <div className="px-6 py-3 bg-red-50 text-red-700 text-sm">{error}</div>
      )}

      <div className="divide-y divide-slate-100">
        {pendingKpis.map((kpi) => (
          <div key={kpi.id} className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <button
                  onClick={() => setSelectedKpi(kpi)}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  {kpi.title}
                </button>
                {kpi.description && (
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{kpi.description}</p>
                )}
                <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                  <span>Срок: {new Date(kpi.deadline).toLocaleDateString('ru-RU')}</span>
                  <span>Блоков: {(kpi.blocks || []).length}</span>
                  <span>Сотрудников: {kpi.assignments.length}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedKpi(kpi)}
                  className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Просмотреть"
                >
                  <EyeIcon />
                </button>
                <button
                  onClick={() => handleApprove(kpi.id)}
                  disabled={isSubmitting}
                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  title="Утвердить"
                >
                  <CheckIcon />
                </button>
                <button
                  onClick={() => {
                    setSelectedKpi(kpi);
                    setShowRejectModal(true);
                  }}
                  disabled={isSubmitting}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Отклонить"
                >
                  <XIcon />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* KPI Detail Modal */}
      {selectedKpi && !showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{selectedKpi.title}</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Срок: {new Date(selectedKpi.deadline).toLocaleDateString('ru-RU')}
                </p>
              </div>
              <button onClick={() => setSelectedKpi(null)} className="text-slate-400 hover:text-slate-600">
                <CloseIcon />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {selectedKpi.description && (
                <div>
                  <h3 className="text-sm font-medium text-slate-700 mb-2">Описание</h3>
                  <p className="text-sm text-slate-600">{selectedKpi.description}</p>
                </div>
              )}

              <div>
                <h3 className="text-sm font-medium text-slate-700 mb-2">
                  Блоки и показатели ({(selectedKpi.blocks || []).length})
                </h3>
                {(selectedKpi.blocks || []).length > 0 ? (
                  <div className="space-y-3">
                    {selectedKpi.blocks.map((block, blockIndex) => (
                      <div key={block.id} className="border border-slate-200 rounded-lg overflow-hidden">
                        <div className="bg-slate-50 px-4 py-2 flex items-center justify-between">
                          <span className="font-medium text-sm text-slate-900">
                            {blockIndex + 1}. {block.name}
                          </span>
                          <span className="text-xs text-slate-500">Вес: {block.weight}%</span>
                        </div>
                        {(block.tasks || []).length > 0 && (
                          <div className="divide-y divide-slate-100">
                            {block.tasks.map((task, taskIndex) => (
                              <div key={task.id} className="px-4 py-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-slate-700">
                                    <span className="font-medium text-slate-500">{blockIndex + 1}.{taskIndex + 1}</span>{' '}
                                    {task.name}
                                  </span>
                                  <span className="text-xs text-slate-500">Вес: {task.weight}%</span>
                                </div>
                                <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                  <span>План: {task.planValue || 100} {task.unit || 'шт'}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">Нет блоков</p>
                )}
              </div>

              <div>
                <h3 className="text-sm font-medium text-slate-700 mb-2">
                  Назначенные сотрудники ({selectedKpi.assignments.length})
                </h3>
                <div className="space-y-2">
                  {selectedKpi.assignments.map((assignment) => (
                    <div key={assignment.id} className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg">
                      <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-slate-600">
                          {assignment.user.fullName.split(' ').map(n => n[0]).slice(0, 2).join('')}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{assignment.user.fullName}</p>
                        <p className="text-xs text-slate-500">{assignment.user.position}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(true);
                }}
                disabled={isSubmitting}
                className="btn-secondary flex items-center gap-2"
              >
                <XIcon /> Отклонить
              </button>
              <button
                onClick={() => handleApprove(selectedKpi.id)}
                disabled={isSubmitting}
                className="btn-primary flex items-center gap-2"
              >
                <CheckIcon /> Утвердить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedKpi && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Отклонить KPI</h3>
            <p className="text-sm text-slate-600 mb-4">
              Укажите причину отклонения KPI "{selectedKpi.title}"
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="input-field min-h-[100px] mb-4"
              placeholder="Причина отклонения..."
              autoFocus
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                }}
                className="btn-secondary"
              >
                Отмена
              </button>
              <button
                onClick={() => handleReject(selectedKpi.id)}
                disabled={isSubmitting || !rejectReason.trim()}
                className="btn-danger"
              >
                Отклонить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// My KPIs Section (for employees)
const MyKpisSection: React.FC = () => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<MyKpiAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMyKpis = async () => {
    try {
      setIsLoading(true);
      const response = await kpisApi.getMyKpis();
      setAssignments(response.data);
      setError(null);
    } catch (err) {
      setError('Ошибка загрузки KPI');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMyKpis();
  }, []);

  // Helper to get all tasks from blocks
  const getAllTasks = (blocks: MyKpiAssignment['kpi']['blocks']) => {
    return (blocks || []).flatMap((block) => block.tasks || []);
  };

  if (isLoading) {
    return (
      <div className="card mb-6">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">Мои KPI</h2>
        </div>
        <div className="p-6 flex justify-center">
          <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (assignments.length === 0) {
    return null;
  }

  return (
    <div className="card mb-6">
      <div className="px-6 py-4 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Мои KPI</h2>
          <span className="badge-info">{assignments.length}</span>
        </div>
      </div>

      {error && (
        <div className="px-6 py-3 bg-red-50 text-red-700 text-sm">{error}</div>
      )}

      <div className="divide-y divide-slate-100">
        {assignments.map((assignment) => {
          const filledCount = assignment.factValues.filter((f) => f.factValue !== null).length;
          const totalTasks = getAllTasks(assignment.kpi.blocks).length;
          const progress = totalTasks > 0 ? Math.round((filledCount / totalTasks) * 100) : 0;

          return (
            <div key={assignment.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/my-kpis/${assignment.kpi.id}`)}
                      className="text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      {assignment.kpi.title}
                    </button>
                    {assignment.isSubmitted ? (
                      <span className="badge-success text-xs">Отправлено</span>
                    ) : (
                      <StatusBadge status={assignment.kpi.status} />
                    )}
                  </div>
                  {assignment.kpi.description && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {assignment.kpi.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                    <span>Срок: {new Date(assignment.kpi.deadline).toLocaleDateString('ru-RU')}</span>
                    <span>
                      Заполнено: {filledCount}/{totalTasks}
                    </span>
                  </div>
                  {!assignment.isSubmitted && (
                    <div className="mt-3 w-full max-w-xs">
                      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => navigate(`/my-kpis/${assignment.kpi.id}`)}
                  className="btn-secondary text-sm"
                >
                  {assignment.isSubmitted ? 'Просмотреть' : 'Заполнить'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const UserPortalPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('hierarchy');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
          <p className="mt-4 text-sm text-slate-500">Загрузка...</p>
        </div>
      </div>
    );
  }

  const subordinatesTree = user.subordinatesTree
    ? buildTree(user.subordinatesTree, user.id)
    : [];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">K</span>
              </div>
              <span className="text-lg font-semibold text-slate-900">KPD Platform</span>
            </div>
            <div className="flex items-center space-x-2">
              {user.subordinatesTree && user.subordinatesTree.length > 0 && (
                <button
                  onClick={() => navigate('/evaluations')}
                  className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  <ClipboardIcon />
                  <span>Оценка сотрудников</span>
                </button>
              )}
              <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
            >
              <LogoutIcon />
              <span>Выход</span>
            </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-16">
        <div className="max-w-4xl mx-auto px-6 py-8">
          {/* Profile Card */}
          <div className="card p-6 mb-6">
            <div className="flex items-start space-x-4">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xl font-semibold text-slate-600">
                  {user.fullName.split(' ').map(n => n[0]).slice(0, 2).join('')}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-semibold text-slate-900">{user.fullName}</h1>
                <p className="text-slate-500 mt-1">{user.position}</p>
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <span className="badge-info">{user.group?.name}</span>
                  {user.submitsBasicReport && (
                    <span className="badge-success">Базовый отчет</span>
                  )}
                  {user.submitsKpi && (
                    <span className="badge-warning">KPI</span>
                  )}
                </div>
              </div>
            </div>

            {user.manager && (
              <div className="mt-6 pt-6 border-t border-slate-100">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
                  Руководитель
                </p>
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-medium text-slate-600">
                      {user.manager.fullName.split(' ').map(n => n[0]).slice(0, 2).join('')}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{user.manager.fullName}</p>
                    <p className="text-xs text-slate-500">{user.manager.position}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* KPI Approval Section (for approvers) */}
          <KpiApprovalSection />

          {/* My KPIs Section (for employees) */}
          <MyKpisSection />

          {/* Subordinates Card */}
          <div className="card">
            <div className="px-6 py-4 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Подчиненные</h2>
                {user.subordinatesTree && user.subordinatesTree.length > 0 && (
                  <span className="badge-gray">
                    {user.subordinatesTree.length}
                  </span>
                )}
              </div>
              {user.subordinatesTree && user.subordinatesTree.length > 0 && (
                <div className="flex mt-3">
                  <div className="inline-flex rounded-lg bg-slate-100 p-1">
                    <button
                      onClick={() => setViewMode('hierarchy')}
                      className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                        viewMode === 'hierarchy'
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Иерархия
                    </button>
                    <button
                      onClick={() => setViewMode('groups')}
                      className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                        viewMode === 'groups'
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      По группам
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="p-6">
              {subordinatesTree.length > 0 ? (
                viewMode === 'hierarchy' ? (
                  <SubordinateTree subordinates={subordinatesTree} />
                ) : (
                  <SubordinatesByGroup subordinatesTree={subordinatesTree} />
                )
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <p className="text-slate-500 text-sm">Нет подчиненных</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserPortalPage;
