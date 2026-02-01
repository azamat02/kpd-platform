import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface User {
  id: number;
  fullName: string;
  position: string;
  groupId: number;
  managerId: number | null;
  group: Group;
  manager?: { id: number; fullName: string; position: string } | null;
  subordinates?: { id: number; fullName: string; position: string }[];
  leadsGroup?: { id: number; name: string } | null;  // Группа, которой руководит
  // Новые флаги
  submitsBasicReport: boolean;
  submitsKpi: boolean;
  canAccessPlatform: boolean;
  // Логин для входа
  login?: string | null;
  // Для user portal
  subordinatesTree?: User[];
  // Сгенерированные данные (только при создании/обновлении)
  generatedPassword?: string | null;
  generatedLogin?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Group {
  id: number;
  name: string;
  leaderId: number | null;
  leader?: { id: number; fullName: string; position: string } | null;
  createdAt: string;
  _count?: { users: number };
}

export interface Admin {
  id: number;
  username: string;
  createdAt: string;
}

// Ответ на логин
export interface LoginResponse {
  token: string;
  role: 'admin' | 'user';
  admin?: Admin;
  user?: User;
}

// Ответ на /me
export interface MeResponse {
  role: 'admin' | 'user';
  admin?: Admin;
  user?: User;
}

export const authApi = {
  login: (username: string, password: string) =>
    api.post<LoginResponse>('/auth/login', { username, password }),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get<MeResponse>('/auth/me'),
};

export interface CreateUserData {
  fullName: string;
  position: string;
  groupId: number;
  managerId?: number | null;
  submitsBasicReport?: boolean;
  submitsKpi?: boolean;
  canAccessPlatform?: boolean;
  isGroupLeader?: boolean;
}

export interface UpdateUserData {
  fullName?: string;
  position?: string;
  groupId?: number;
  managerId?: number | null;
  submitsBasicReport?: boolean;
  submitsKpi?: boolean;
  canAccessPlatform?: boolean;
  isGroupLeader?: boolean;
}

export const usersApi = {
  getAll: () => api.get<User[]>('/users'),
  getOne: (id: number) => api.get<User>(`/users/${id}`),
  create: (data: CreateUserData) => api.post<User>('/users', data),
  update: (id: number, data: UpdateUserData) => api.put<User>(`/users/${id}`, data),
  delete: (id: number) => api.delete(`/users/${id}`),
  regeneratePassword: (id: number) =>
    api.post<{ generatedPassword: string }>(`/users/${id}/regenerate-password`),
};

export interface UpdateGroupData {
  name?: string;
  leaderId?: number | null;
}

export const groupsApi = {
  getAll: () => api.get<Group[]>('/groups'),
  getOne: (id: number) => api.get<Group>(`/groups/${id}`),
  create: (name: string) => api.post<Group>('/groups', { name }),
  update: (id: number, data: UpdateGroupData) => api.put<Group>(`/groups/${id}`, data),
  delete: (id: number) => api.delete(`/groups/${id}`),
};

// Evaluation Period types
export interface EvaluationPeriod {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  _count?: { evaluations: number };
}

export interface CreatePeriodData {
  name: string;
  startDate: string;
  endDate: string;
  isActive?: boolean;
}

export interface UpdatePeriodData {
  name?: string;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
}

// Evaluation types
export type FormType = 'manager' | 'employee';

export interface EvaluationScores {
  quality: number;
  deadlines: number;
  leadership?: number; // Только для manager
  initiative?: number; // Только для employee
  discipline: number;
  noViolations: number;
}

export interface EvaluationComments {
  quality?: string;
  deadlines?: string;
  leadership?: string;
  initiative?: string;
  discipline?: string;
  noViolations?: string;
}

export interface Evaluation {
  id: number;
  periodId: number;
  period: EvaluationPeriod;
  evaluatorId: number;
  evaluator?: {
    id: number;
    fullName: string;
    position: string;
    group: { id: number; name: string };
  };
  evaluateeId: number;
  evaluatee: {
    id: number;
    fullName: string;
    position: string;
    group: { id: number; name: string };
  };
  formType: FormType;
  scores: EvaluationScores;
  comments: EvaluationComments | null;
  averageScore: number;
  result: string;
  createdAt: string;
  updatedAt: string;
}

export interface PendingSubordinate {
  id: number;
  fullName: string;
  position: string;
  group: { id: number; name: string };
  canAccessPlatform: boolean;
  hasSubordinates: boolean;
  formType: FormType;
  evaluation: {
    id: number;
    averageScore: number;
    result: string;
    formType: FormType;
  } | null;
}

export interface PendingEvaluationsResponse {
  period: EvaluationPeriod | null;
  subordinates: PendingSubordinate[];
}

export interface CreateEvaluationData {
  periodId: number;
  evaluateeId: number;
  scores: EvaluationScores;
  comments?: EvaluationComments;
}

export const evaluationPeriodsApi = {
  getAll: () => api.get<EvaluationPeriod[]>('/evaluation-periods'),
  getOne: (id: number) => api.get<EvaluationPeriod>(`/evaluation-periods/${id}`),
  create: (data: CreatePeriodData) => api.post<EvaluationPeriod>('/evaluation-periods', data),
  update: (id: number, data: UpdatePeriodData) => api.put<EvaluationPeriod>(`/evaluation-periods/${id}`, data),
  delete: (id: number) => api.delete(`/evaluation-periods/${id}`),
};

export const evaluationsApi = {
  getAll: (periodId?: number) => api.get<Evaluation[]>('/evaluations', { params: periodId ? { periodId } : {} }),
  getMy: () => api.get<Evaluation[]>('/evaluations/my'),
  getOne: (id: number) => api.get<Evaluation>(`/evaluations/${id}`),
  getPending: () => api.get<PendingEvaluationsResponse>('/evaluations/subordinates/pending'),
  create: (data: CreateEvaluationData) => api.post<Evaluation>('/evaluations', data),
};

// Group Scores types
export interface GroupScoreResult {
  groupId: number;
  groupName: string;
  leaderId: number | null;
  leaderName: string | null;
  score: number | null;
  userCount: number;
  isLeaf: boolean;
  children: GroupScoreResult[];
}

export interface GroupScoresResponse {
  period: EvaluationPeriod | null;
  groups: GroupScoreResult[];
}

export interface GroupScoreEmployee {
  id: number;
  fullName: string;
  position: string;
  evaluation: {
    id: number;
    averageScore: number;
    result: string;
    formType: FormType;
    scores: EvaluationScores;
  } | null;
}

export interface GroupScoreDetailsResponse {
  period: EvaluationPeriod | null;
  group: {
    id: number;
    name: string;
    leader: { id: number; fullName: string; position: string } | null;
    score: number | null;
    evaluatedCount: number;
    totalCount: number;
  } | null;
  employees: GroupScoreEmployee[];
}

export interface CalculateGroupScoresResponse {
  message: string;
  count: number;
  scores: Array<{
    id: number;
    groupId: number;
    periodId: number;
    score: number;
    userCount: number;
    isLeaf: boolean;
  }>;
}

export interface GroupSummaryItem {
  id: number;
  name: string;
  leader: string | null;
  userCount: number;
  evaluatedCount: number;
  score: number | null;
}

export interface ScoreDistribution {
  excellent: number;
  good: number;
  satisfactory: number;
  poor: number;
}

export interface GroupScoresSummaryResponse {
  period: EvaluationPeriod | null;
  overallScore: number | null;
  groupsEvaluated: number;
  employeesEvaluated: number;
  managerFormAvg: number | null;
  employeeFormAvg: number | null;
  groups: GroupSummaryItem[];
  distribution: ScoreDistribution;
}

export const groupScoresApi = {
  getAll: (periodId?: number) =>
    api.get<GroupScoresResponse>('/group-scores', { params: periodId ? { periodId } : {} }),
  getDetails: (groupId: number, periodId?: number) =>
    api.get<GroupScoreDetailsResponse>(`/group-scores/${groupId}`, { params: periodId ? { periodId } : {} }),
  calculate: (periodId: number) =>
    api.post<CalculateGroupScoresResponse>('/group-scores/calculate', { periodId }),
  getSummary: (periodId?: number) =>
    api.get<GroupScoresSummaryResponse>('/group-scores/summary', { params: periodId ? { periodId } : {} }),
};

// ==================== KPI Types ====================

export type KpiStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'REJECTED' | 'APPROVED' | 'COMPLETED';

export interface KpiTask {
  id: number;
  blockId: number;
  name: string;
  weight: number;
  unit: string;        // Единица измерения: "шт", "%", или кастомный текст
  planValue: number;   // Плановое значение
  isOptional: boolean; // Опциональный показатель (не влияет на процент блока)
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface KpiBlock {
  id: number;
  kpiId: number;
  name: string;
  weight: number;
  order: number;
  tasks: KpiTask[];
  createdAt: string;
  updatedAt: string;
}

export interface KpiTaskFact {
  id: number;
  taskId: number;
  assignmentId: number;
  factValue: number | null;
  comment?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface KpiAssignment {
  id: number;
  kpiId: number;
  userId: number;
  user: {
    id: number;
    fullName: string;
    position: string;
    group?: { id: number; name: string };
  };
  isSubmitted: boolean;
  submittedAt?: string | null;
  factValues?: KpiTaskFact[];
  createdAt: string;
  updatedAt: string;
}

export interface Kpi {
  id: number;
  title: string;
  description?: string | null;
  deadline: string;
  status: KpiStatus;
  createdById: number;
  createdByAdmin: {
    id: number;
    username: string;
  };
  approverId: number;
  approver: {
    id: number;
    fullName: string;
    position: string;
  };
  rejectionReason?: string | null;
  approvedAt?: string | null;
  submittedAt?: string | null;
  blocks: KpiBlock[];
  assignments: KpiAssignment[];
  _count?: {
    blocks: number;
    assignments: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface MyKpiAssignment {
  id: number;
  kpiId: number;
  userId: number;
  isSubmitted: boolean;
  submittedAt?: string | null;
  kpi: {
    id: number;
    title: string;
    description?: string | null;
    deadline: string;
    status: KpiStatus;
    blocks: KpiBlock[];
    approver: {
      id: number;
      fullName: string;
      position: string;
    };
  };
  factValues: KpiTaskFact[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateKpiData {
  title: string;
  description?: string;
  deadline: string;
  approverId: number;
}

export interface UpdateKpiData {
  title?: string;
  description?: string;
  deadline?: string;
  approverId?: number;
}

export interface CreateKpiBlockData {
  name: string;
  weight: number;
}

export interface UpdateKpiBlockData {
  name?: string;
  weight?: number;
  order?: number;
}

export interface CreateKpiTaskData {
  name: string;
  weight: number;
  unit: string;        // Единица измерения
  planValue: number;   // Плановое значение
  isOptional?: boolean; // Опциональный показатель
}

export interface UpdateKpiTaskData {
  name?: string;
  weight?: number;
  order?: number;
  unit?: string;        // Единица измерения
  planValue?: number;   // Плановое значение
  isOptional?: boolean; // Опциональный показатель
}

export interface SaveFactData {
  taskId: number;
  factValue: number | null;
  comment?: string;
}

export const kpisApi = {
  // Admin endpoints
  getAll: (status?: KpiStatus) =>
    api.get<Kpi[]>('/kpis', { params: status ? { status } : {} }),
  getOne: (id: number) => api.get<Kpi>(`/kpis/${id}`),
  create: (data: CreateKpiData) => api.post<Kpi>('/kpis', data),
  update: (id: number, data: UpdateKpiData) => api.put<Kpi>(`/kpis/${id}`, data),
  delete: (id: number) => api.delete(`/kpis/${id}`),

  // Block endpoints
  addBlock: (kpiId: number, data: CreateKpiBlockData) =>
    api.post<KpiBlock>(`/kpis/${kpiId}/blocks`, data),
  updateBlock: (kpiId: number, blockId: number, data: UpdateKpiBlockData) =>
    api.put<KpiBlock>(`/kpis/${kpiId}/blocks/${blockId}`, data),
  deleteBlock: (kpiId: number, blockId: number) =>
    api.delete(`/kpis/${kpiId}/blocks/${blockId}`),

  // Task endpoints (inside blocks)
  addTask: (kpiId: number, blockId: number, data: CreateKpiTaskData) =>
    api.post<KpiTask>(`/kpis/${kpiId}/blocks/${blockId}/tasks`, data),
  updateTask: (kpiId: number, blockId: number, taskId: number, data: UpdateKpiTaskData) =>
    api.put<KpiTask>(`/kpis/${kpiId}/blocks/${blockId}/tasks/${taskId}`, data),
  deleteTask: (kpiId: number, blockId: number, taskId: number) =>
    api.delete(`/kpis/${kpiId}/blocks/${blockId}/tasks/${taskId}`),

  // Assignment endpoints
  assignUsers: (kpiId: number, userIds: number[]) =>
    api.post<KpiAssignment[]>(`/kpis/${kpiId}/assign`, { userIds }),
  removeAssignment: (kpiId: number, userId: number) =>
    api.delete(`/kpis/${kpiId}/assign/${userId}`),

  // Submit for approval
  submitForApproval: (kpiId: number) => api.post<Kpi>(`/kpis/${kpiId}/submit`),

  // Approver endpoints
  getPendingApproval: () => api.get<Kpi[]>('/kpis/pending-approval'),
  approve: (kpiId: number) => api.post<Kpi>(`/kpis/${kpiId}/approve`),
  reject: (kpiId: number, reason: string) =>
    api.post<Kpi>(`/kpis/${kpiId}/reject`, { reason }),

  // Employee endpoints
  getMyKpis: () => api.get<MyKpiAssignment[]>('/kpis/my'),
  getMyKpiDetails: (kpiId: number) => api.get<MyKpiAssignment>(`/kpis/my/${kpiId}`),
  saveFactValues: (kpiId: number, facts: SaveFactData[]) =>
    api.put<KpiTaskFact[]>(`/kpis/my/${kpiId}/facts`, { facts }),
  submitResults: (kpiId: number) => api.post<MyKpiAssignment>(`/kpis/my/${kpiId}/submit`),
};

export default api;
