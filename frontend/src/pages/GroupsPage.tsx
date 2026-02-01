import React, { useState, useEffect } from 'react';
import { groupsApi, usersApi, Group, User } from '../services/api';
import Layout from '../components/Layout';

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

const EditIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const GroupsPage: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [groupName, setGroupName] = useState('');
  const [groupLeaderId, setGroupLeaderId] = useState<number | null>(null);
  const [groupMembers, setGroupMembers] = useState<User[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<Group | null>(null);

  const fetchGroups = async () => {
    try {
      setIsLoading(true);
      const response = await groupsApi.getAll();
      setGroups(response.data);
      setError(null);
    } catch (err) {
      setError('Ошибка загрузки групп');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleCreate = () => {
    setEditingGroup(null);
    setGroupName('');
    setGroupLeaderId(null);
    setGroupMembers([]);
    setShowForm(true);
  };

  const handleEdit = async (group: Group) => {
    setEditingGroup(group);
    setGroupName(group.name);
    setGroupLeaderId(group.leaderId);
    setShowForm(true);

    // Загрузить членов группы для выбора начальника
    try {
      const response = await usersApi.getAll();
      const members = response.data.filter((u) => u.groupId === group.id);
      setGroupMembers(members);
    } catch (err) {
      setGroupMembers([]);
    }
  };

  const handleDelete = (group: Group) => {
    setDeleteConfirm(group);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await groupsApi.delete(deleteConfirm.id);
      await fetchGroups();
      setDeleteConfirm(null);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error && 'response' in err
        ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
        : 'Ошибка удаления группы';
      setError(errorMessage || 'Ошибка удаления группы');
      setDeleteConfirm(null);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    try {
      if (editingGroup) {
        await groupsApi.update(editingGroup.id, { name: groupName, leaderId: groupLeaderId });
      } else {
        await groupsApi.create(groupName);
      }
      await fetchGroups();
      setShowForm(false);
      setEditingGroup(null);
      setGroupName('');
      setGroupLeaderId(null);
      setGroupMembers([]);
    } catch (err) {
      setError('Ошибка сохранения группы');
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingGroup(null);
    setGroupName('');
    setGroupLeaderId(null);
    setGroupMembers([]);
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Группы</h1>
          <p className="mt-1 text-sm text-slate-500">Управление группами сотрудников</p>
        </div>
        <button onClick={handleCreate} className="btn-primary">
          <PlusIcon />
          <span className="ml-2">Добавить</span>
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center justify-between">
          <p className="text-sm text-red-600">{error}</p>
          <button
            onClick={() => setError(null)}
            className="p-1 text-red-400 hover:text-red-600 transition-colors"
          >
            <CloseIcon />
          </button>
        </div>
      )}

      {/* Groups Grid */}
      {groups.length === 0 ? (
        <div className="card">
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <p className="text-slate-500 text-sm">Нет групп</p>
            <p className="text-slate-400 text-xs mt-1">Создайте первую группу</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group) => (
            <div key={group.id} className="card p-5 group hover:border-slate-300 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                    <span className="text-sm font-semibold text-slate-600">
                      {group.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900">{group.name}</h3>
                    <p className="text-sm text-slate-500">
                      {group._count?.users || 0} пользователей
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEdit(group)}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <EditIcon />
                  </button>
                  <button
                    onClick={() => handleDelete(group)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>
              {/* Начальник группы */}
              {group.leader ? (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <p className="text-xs text-slate-400 mb-1">Начальник</p>
                  <p className="text-sm font-medium text-slate-700">{group.leader.fullName}</p>
                  <p className="text-xs text-slate-500">{group.leader.position}</p>
                </div>
              ) : (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <p className="text-xs text-amber-600">Начальник не назначен</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={handleFormCancel} />
          <div className="relative min-h-screen flex items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <h2 className="text-lg font-semibold text-slate-900">
                  {editingGroup ? 'Редактировать группу' : 'Новая группа'}
                </h2>
                <button
                  onClick={handleFormCancel}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <CloseIcon />
                </button>
              </div>
              <form onSubmit={handleFormSubmit}>
                <div className="px-6 py-5 space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Название группы
                    </label>
                    <input
                      type="text"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      className="input"
                      placeholder="Введите название"
                      autoFocus
                    />
                  </div>

                  {/* Выбор начальника - только при редактировании */}
                  {editingGroup && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Начальник группы
                      </label>
                      {groupMembers.length > 0 ? (
                        <select
                          value={groupLeaderId ?? ''}
                          onChange={(e) => setGroupLeaderId(e.target.value ? parseInt(e.target.value) : null)}
                          className="input"
                        >
                          <option value="">Не назначен</option>
                          {groupMembers.map((member) => (
                            <option key={member.id} value={member.id}>
                              {member.fullName} — {member.position}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <p className="text-sm text-slate-500 p-3 bg-slate-50 rounded-lg">
                          В группе нет пользователей. Добавьте пользователей, чтобы назначить начальника.
                        </p>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
                  <button type="button" onClick={handleFormCancel} className="btn-secondary">
                    Отмена
                  </button>
                  <button type="submit" className="btn-primary">
                    {editingGroup ? 'Сохранить' : 'Создать'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative min-h-screen flex items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 text-center mb-2">
                Удалить группу?
              </h3>
              <p className="text-sm text-slate-500 text-center mb-6">
                Группа "{deleteConfirm.name}" будет удалена
              </p>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="btn-secondary flex-1"
                >
                  Отмена
                </button>
                <button onClick={confirmDelete} className="btn-danger flex-1">
                  Удалить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default GroupsPage;
