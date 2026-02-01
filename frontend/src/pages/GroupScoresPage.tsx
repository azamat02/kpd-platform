import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import {
  groupScoresApi,
  evaluationPeriodsApi,
  GroupScoreResult,
  GroupScoreEmployee,
  EvaluationPeriod,
} from '../services/api';

const ChevronDownIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const UsersIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const RefreshIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// Get score color class based on score value
const getScoreColorClass = (score: number | null): string => {
  if (score === null) return 'bg-slate-100 text-slate-500';
  if (score >= 4.5) return 'bg-green-100 text-green-700';
  if (score >= 3.5) return 'bg-blue-100 text-blue-700';
  if (score >= 2.5) return 'bg-yellow-100 text-yellow-700';
  return 'bg-red-100 text-red-700';
};

interface GroupTreeNodeProps {
  group: GroupScoreResult;
  level: number;
  periodId: number | null;
  onShowDetails: (groupId: number) => void;
}

const GroupTreeNode: React.FC<GroupTreeNodeProps> = ({ group, level, onShowDetails }) => {
  const [isExpanded, setIsExpanded] = useState(level === 0);
  const hasChildren = group.children.length > 0;

  return (
    <div>
      <div
        className={`flex items-center justify-between py-3 px-4 hover:bg-slate-50 cursor-pointer border-b border-slate-100 ${
          level === 0 ? 'bg-slate-50' : ''
        }`}
        style={{ paddingLeft: `${1 + level * 1.5}rem` }}
        onClick={() => hasChildren ? setIsExpanded(!isExpanded) : onShowDetails(group.groupId)}
      >
        <div className="flex items-center space-x-3">
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="p-1 hover:bg-slate-200 rounded transition-colors"
            >
              {isExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
            </button>
          ) : (
            <div className="w-6" />
          )}
          <div>
            <div className="font-medium text-slate-900">{group.groupName}</div>
            {group.leaderName && (
              <div className="text-sm text-slate-500">Руководитель: {group.leaderName}</div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-sm text-slate-500">
            {group.userCount} чел.
          </div>
          <div
            className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColorClass(group.score)}`}
          >
            {group.score !== null ? group.score.toFixed(2) : '—'}
          </div>
          {group.isLeaf && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onShowDetails(group.groupId);
              }}
              className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-500"
              title="Показать сотрудников"
            >
              <UsersIcon />
            </button>
          )}
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div>
          {group.children.map((child) => (
            <GroupTreeNode
              key={child.groupId}
              group={child}
              level={level + 1}
              periodId={null}
              onShowDetails={onShowDetails}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface EmployeeDetailsModalProps {
  groupId: number;
  periodId: number | null;
  onClose: () => void;
}

const EmployeeDetailsModal: React.FC<EmployeeDetailsModalProps> = ({ groupId, periodId, onClose }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [groupInfo, setGroupInfo] = useState<{
    id: number;
    name: string;
    leader: { id: number; fullName: string; position: string } | null;
    score: number | null;
    evaluatedCount: number;
    totalCount: number;
  } | null>(null);
  const [employees, setEmployees] = useState<GroupScoreEmployee[]>([]);

  useEffect(() => {
    const loadDetails = async () => {
      try {
        const response = await groupScoresApi.getDetails(groupId, periodId || undefined);
        setGroupInfo(response.data.group);
        setEmployees(response.data.employees);
      } catch (error) {
        console.error('Failed to load group details:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadDetails();
  }, [groupId, periodId]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              {groupInfo?.name || 'Загрузка...'}
            </h3>
            {groupInfo?.leader && (
              <p className="text-sm text-slate-500 mt-1">
                Руководитель: {groupInfo.leader.fullName}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-4">
            {groupInfo && (
              <div className="text-right">
                <div className={`px-3 py-1 rounded-full text-sm font-medium inline-block ${getScoreColorClass(groupInfo.score)}`}>
                  {groupInfo.score !== null ? groupInfo.score.toFixed(2) : '—'}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {groupInfo.evaluatedCount} из {groupInfo.totalCount} оценено
                </div>
              </div>
            )}
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <CloseIcon />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
            </div>
          ) : employees.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              Нет сотрудников в этой группе
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">
                    Сотрудник
                  </th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">
                    Должность
                  </th>
                  <th className="text-center text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">
                    Оценка
                  </th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">
                    Результат
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {emp.fullName}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {emp.position}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {emp.evaluation ? (
                        <span className={`px-2 py-1 rounded-full text-sm font-medium ${getScoreColorClass(emp.evaluation.averageScore)}`}>
                          {emp.evaluation.averageScore.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {emp.evaluation?.result || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

const GroupScoresPage: React.FC = () => {
  const [periods, setPeriods] = useState<EvaluationPeriod[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<number | null>(null);
  const [groups, setGroups] = useState<GroupScoreResult[]>([]);
  const [currentPeriod, setCurrentPeriod] = useState<EvaluationPeriod | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCalculating, setIsCalculating] = useState(false);
  const [detailsGroupId, setDetailsGroupId] = useState<number | null>(null);

  // Load periods
  useEffect(() => {
    const loadPeriods = async () => {
      try {
        const response = await evaluationPeriodsApi.getAll();
        setPeriods(response.data);
        // Select active period by default
        const activePeriod = response.data.find((p) => p.isActive);
        if (activePeriod) {
          setSelectedPeriodId(activePeriod.id);
        } else if (response.data.length > 0) {
          setSelectedPeriodId(response.data[0].id);
        }
      } catch (error) {
        console.error('Failed to load periods:', error);
      }
    };
    loadPeriods();
  }, []);

  // Load group scores when period changes
  useEffect(() => {
    const loadGroupScores = async () => {
      setIsLoading(true);
      try {
        const response = await groupScoresApi.getAll(selectedPeriodId || undefined);
        setGroups(response.data.groups);
        setCurrentPeriod(response.data.period);
      } catch (error) {
        console.error('Failed to load group scores:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadGroupScores();
  }, [selectedPeriodId]);

  const handleRecalculate = async () => {
    if (!selectedPeriodId) return;

    setIsCalculating(true);
    try {
      await groupScoresApi.calculate(selectedPeriodId);
      // Reload scores after calculation
      const response = await groupScoresApi.getAll(selectedPeriodId);
      setGroups(response.data.groups);
    } catch (error) {
      console.error('Failed to recalculate scores:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Оценки по группам</h1>
            <p className="text-slate-500 mt-1">
              Агрегированные оценки сотрудников по структурным подразделениям
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={selectedPeriodId || ''}
              onChange={(e) => setSelectedPeriodId(e.target.value ? parseInt(e.target.value) : null)}
              className="input w-48"
            >
              {periods.map((period) => (
                <option key={period.id} value={period.id}>
                  {period.name} {period.isActive && '(активен)'}
                </option>
              ))}
            </select>
            <button
              onClick={handleRecalculate}
              disabled={isCalculating || !selectedPeriodId}
              className="btn-secondary flex items-center space-x-2"
            >
              <RefreshIcon />
              <span>{isCalculating ? 'Расчет...' : 'Пересчитать'}</span>
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center space-x-6 text-sm">
          <span className="text-slate-500">Уровни оценки:</span>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-slate-600">4.5+ Эффективно</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-slate-600">3.5-4.5 Надлежаще</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span className="text-slate-600">2.5-3.5 Удовл.</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-slate-600">&lt;2.5 Неудовл.</span>
            </div>
          </div>
        </div>

        {/* Groups Tree */}
        <div className="card">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
            </div>
          ) : groups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <UsersIcon />
              </div>
              <p className="text-slate-500">Нет данных по группам</p>
              {currentPeriod && (
                <p className="text-sm text-slate-400 mt-2">
                  Период: {currentPeriod.name}
                </p>
              )}
            </div>
          ) : (
            <div>
              {currentPeriod && (
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 text-sm text-slate-600">
                  Период: <span className="font-medium">{currentPeriod.name}</span>
                </div>
              )}
              {groups.map((group) => (
                <GroupTreeNode
                  key={group.groupId}
                  group={group}
                  level={0}
                  periodId={selectedPeriodId}
                  onShowDetails={setDetailsGroupId}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Employee Details Modal */}
      {detailsGroupId !== null && (
        <EmployeeDetailsModal
          groupId={detailsGroupId}
          periodId={selectedPeriodId}
          onClose={() => setDetailsGroupId(null)}
        />
      )}
    </Layout>
  );
};

export default GroupScoresPage;
