import React, { useEffect, useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { User, Group } from '../services/api';
import SearchableSelect from './SearchableSelect';

interface UserFormData {
  fullName: string;
  position: string;
  groupId: number;
  managerId: number | null;
  submitsBasicReport: boolean;
  submitsKpi: boolean;
  canAccessPlatform: boolean;
  isGroupLeader: boolean;
}

interface UserFormProps {
  user: User | null;
  users: User[];
  groups: Group[];
  onSubmit: (data: UserFormData) => void;
  onCancel: () => void;
  generatedPassword?: string | null;
  generatedLogin?: string | null;
}

const CloseIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const UserForm: React.FC<UserFormProps> = ({
  user,
  users,
  groups,
  onSubmit,
  onCancel,
  generatedPassword,
  generatedLogin,
}) => {
  const [showCredentials, setShowCredentials] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
    setValue,
    formState: { errors },
  } = useForm<UserFormData>({
    defaultValues: {
      fullName: '',
      position: '',
      groupId: groups[0]?.id || 0,
      managerId: null,
      submitsBasicReport: false,
      submitsKpi: false,
      canAccessPlatform: false,
      isGroupLeader: false,
    },
  });

  const selectedGroupId = watch('groupId');
  const canAccessPlatform = watch('canAccessPlatform');
  const currentManagerId = watch('managerId');

  // Найти выбранную группу с информацией о начальнике
  const selectedGroup = useMemo(() => {
    return groups.find((g) => g.id === selectedGroupId);
  }, [groups, selectedGroupId]);

  // Проверить, является ли текущий пользователь начальником этой группы
  const isCurrentUserLeaderOfGroup = user?.leadsGroup?.id === selectedGroupId;

  useEffect(() => {
    if (user) {
      reset({
        fullName: user.fullName,
        position: user.position,
        groupId: user.groupId,
        managerId: user.managerId,
        submitsBasicReport: user.submitsBasicReport,
        submitsKpi: user.submitsKpi,
        canAccessPlatform: user.canAccessPlatform,
        isGroupLeader: !!user.leadsGroup,
      });
    } else {
      reset({
        fullName: '',
        position: '',
        groupId: groups[0]?.id || 0,
        managerId: null,
        submitsBasicReport: false,
        submitsKpi: false,
        canAccessPlatform: false,
        isGroupLeader: false,
      });
    }
    setShowCredentials(false);
  }, [user, groups, reset]);

  useEffect(() => {
    if (generatedPassword || generatedLogin) {
      setShowCredentials(true);
    }
  }, [generatedPassword, generatedLogin]);

  // Автоподстановка начальника группы как менеджера при смене группы
  useEffect(() => {
    if (selectedGroup?.leader && !user) {
      // Только для новых пользователей автоматически подставляем начальника
      // Если менеджер еще не выбран или это начальник старой группы
      if (!currentManagerId) {
        setValue('managerId', selectedGroup.leader.id);
      }
    }
    // Сбросить флаг isGroupLeader при смене группы
    if (!isCurrentUserLeaderOfGroup) {
      setValue('isGroupLeader', false);
    }
  }, [selectedGroupId, selectedGroup, user, currentManagerId, setValue, isCurrentUserLeaderOfGroup]);

  // Find recommended managers for selected group
  const { recommendedManagerIds, managerOptions } = useMemo(() => {
    const availableManagers = users.filter((u) => u.id !== user?.id);

    // Find users who are managers of people in the selected group
    // A manager is someone who has subordinates in this group
    const managersOfGroup = new Set<number>();

    availableManagers.forEach((potentialManager) => {
      // Check if this user manages anyone in the selected group
      const hasSubordinatesInGroup = users.some(
        (u) => u.managerId === potentialManager.id && u.groupId === selectedGroupId
      );
      if (hasSubordinatesInGroup) {
        managersOfGroup.add(potentialManager.id);
      }
    });

    // Also consider users in the same group who could be managers
    // (users who have any subordinates)
    const usersInGroupWithSubordinates = availableManagers.filter((u) => {
      const isInSameGroup = u.groupId === selectedGroupId;
      const hasAnySubordinates = users.some((sub) => sub.managerId === u.id);
      return isInSameGroup && hasAnySubordinates;
    });

    usersInGroupWithSubordinates.forEach((u) => managersOfGroup.add(u.id));

    // Build options with recommendations
    const options = availableManagers.map((manager) => {
      const isRecommended = managersOfGroup.has(manager.id);
      const isInSameGroup = manager.groupId === selectedGroupId;
      const subordinatesCount = users.filter((u) => u.managerId === manager.id).length;

      let recommendedText = '';
      if (isRecommended) {
        if (isInSameGroup) {
          recommendedText = `В этой группе · ${subordinatesCount} подчиненных`;
        } else {
          const groupSubordinates = users.filter(
            (u) => u.managerId === manager.id && u.groupId === selectedGroupId
          ).length;
          recommendedText = `Руководит ${groupSubordinates} сотрудниками в этой группе`;
        }
      }

      return {
        value: manager.id,
        label: manager.fullName,
        isRecommended,
        recommendedText,
      };
    });

    return {
      recommendedManagerIds: managersOfGroup,
      managerOptions: options,
    };
  }, [users, user?.id, selectedGroupId]);

  // Group options for searchable select
  const groupOptions = useMemo(() => {
    return groups.map((group) => ({
      value: group.id,
      label: group.name,
    }));
  }, [groups]);

  const onFormSubmit = (data: UserFormData) => {
    onSubmit({
      ...data,
      groupId: Number(data.groupId),
      managerId: data.managerId ? Number(data.managerId) : null,
      isGroupLeader: data.isGroupLeader,
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onCancel} />

      {/* Modal */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-900">
              {user ? 'Редактировать пользователя' : 'Новый пользователь'}
            </h2>
            <button
              onClick={onCancel}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <CloseIcon />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-5 max-h-[calc(100vh-200px)] overflow-y-auto">
            {/* Credentials Alert */}
            {showCredentials && (generatedLogin || generatedPassword) && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                <p className="text-sm font-medium text-emerald-800 mb-3">Учетные данные для входа</p>
                <div className="space-y-2">
                  {generatedLogin && (
                    <div className="flex items-center justify-between bg-white rounded-lg px-3 py-2">
                      <span className="text-xs text-slate-500">Логин</span>
                      <code className="text-sm font-mono font-medium text-emerald-700 select-all">
                        {generatedLogin}
                      </code>
                    </div>
                  )}
                  {generatedPassword && (
                    <div className="flex items-center justify-between bg-white rounded-lg px-3 py-2">
                      <span className="text-xs text-slate-500">Пароль</span>
                      <code className="text-sm font-mono font-medium text-emerald-700 select-all">
                        {generatedPassword}
                      </code>
                    </div>
                  )}
                </div>
                <p className="mt-3 text-xs text-emerald-600">
                  Сохраните данные - они показываются только один раз
                </p>
              </div>
            )}

            <form id="user-form" onSubmit={handleSubmit(onFormSubmit)} className="space-y-5">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">ФИО</label>
                <input
                  type="text"
                  {...register('fullName', { required: 'ФИО обязательно' })}
                  className="input"
                  placeholder="Иванов Иван Иванович"
                />
                {errors.fullName && (
                  <p className="mt-2 text-sm text-red-500">{errors.fullName.message}</p>
                )}
              </div>

              {/* Position */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Должность</label>
                <input
                  type="text"
                  {...register('position', { required: 'Должность обязательна' })}
                  className="input"
                  placeholder="Senior Developer"
                />
                {errors.position && (
                  <p className="mt-2 text-sm text-red-500">{errors.position.message}</p>
                )}
              </div>

              {/* Group */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Группа</label>
                <Controller
                  name="groupId"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <SearchableSelect
                      options={groupOptions}
                      value={field.value}
                      onChange={(val) => {
                        field.onChange(val);
                        // Reset manager when group changes if current manager is not recommended
                        const currentManagerId = watch('managerId');
                        if (currentManagerId && !recommendedManagerIds.has(currentManagerId)) {
                          // Optionally reset, but let's keep the selection
                        }
                      }}
                      placeholder="Выберите группу"
                      searchPlaceholder="Поиск группы..."
                      emptyText="Группы не найдены"
                    />
                  )}
                />
              </div>

              {/* Manager */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Начальник</label>
                <Controller
                  name="managerId"
                  control={control}
                  render={({ field }) => (
                    <SearchableSelect
                      options={managerOptions}
                      value={field.value}
                      onChange={(val) => field.onChange(val)}
                      placeholder="Выберите начальника"
                      searchPlaceholder="Поиск по имени..."
                      emptyText="Сотрудники не найдены"
                      allowEmpty
                      emptyLabel="Нет начальника"
                    />
                  )}
                />
                {selectedGroup?.leader && currentManagerId === selectedGroup.leader.id && (
                  <p className="mt-2 text-xs text-emerald-600">
                    Начальник группы: {selectedGroup.leader.fullName}
                  </p>
                )}
                {recommendedManagerIds.size > 0 && !(selectedGroup?.leader && currentManagerId === selectedGroup.leader.id) && (
                  <p className="mt-2 text-xs text-slate-400">
                    Рекомендации основаны на текущей структуре группы
                  </p>
                )}
              </div>

              {/* Group Leader */}
              <div>
                {/* Если у группы уже есть начальник и это не текущий пользователь - показать информацию */}
                {selectedGroup?.leader && !isCurrentUserLeaderOfGroup && (
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-sm text-slate-600">
                      Начальник группы: <span className="font-medium text-slate-900">{selectedGroup.leader.fullName}</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Сменить начальника можно на странице групп
                    </p>
                  </div>
                )}

                {/* Если текущий пользователь - начальник этой группы */}
                {isCurrentUserLeaderOfGroup && (
                  <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                    <p className="text-sm text-emerald-700 font-medium">
                      Этот сотрудник - начальник группы
                    </p>
                  </div>
                )}

                {/* Если у группы нет начальника - показать чекбокс */}
                {!selectedGroup?.leader && (
                  <label className="flex items-center space-x-3 cursor-pointer group p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <input
                      type="checkbox"
                      {...register('isGroupLeader')}
                      className="checkbox"
                    />
                    <div>
                      <span className="text-sm text-amber-800 font-medium group-hover:text-amber-900">
                        Назначить начальником группы
                      </span>
                      <p className="text-xs text-amber-600 mt-0.5">
                        У группы "{selectedGroup?.name || 'Выберите группу'}" нет начальника
                      </p>
                    </div>
                  </label>
                )}
              </div>

              {/* Access Flags */}
              <div className="pt-4 border-t border-slate-100">
                <p className="text-sm font-medium text-slate-700 mb-4">Настройки доступа</p>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      {...register('submitsBasicReport')}
                      className="checkbox"
                    />
                    <span className="text-sm text-slate-600 group-hover:text-slate-900">
                      Сдает базовый отчет
                    </span>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      {...register('submitsKpi')}
                      className="checkbox"
                    />
                    <span className="text-sm text-slate-600 group-hover:text-slate-900">
                      Сдает KPI
                    </span>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      {...register('canAccessPlatform')}
                      className="checkbox"
                    />
                    <span className="text-sm text-slate-600 group-hover:text-slate-900">
                      Может зайти в платформу
                    </span>
                  </label>

                  {canAccessPlatform && !user?.canAccessPlatform && (
                    <p className="text-xs text-slate-400 ml-7">
                      Логин и пароль будут сгенерированы автоматически
                    </p>
                  )}
                </div>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
            <button type="button" onClick={onCancel} className="btn-secondary">
              Отмена
            </button>
            <button type="submit" form="user-form" className="btn-primary">
              {user ? 'Сохранить' : 'Создать'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserForm;
