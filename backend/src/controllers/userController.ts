import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/authMiddleware';

// Генерация пароля (12 символов: буквы + цифры + спецсимволы)
function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$%!';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// Транслитерация кириллицы в латиницу
function transliterate(text: string): string {
  const map: { [key: string]: string } = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e',
    'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
    'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
    'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch',
    'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
    // Казахские буквы
    'ә': 'a', 'ғ': 'g', 'қ': 'q', 'ң': 'n', 'ө': 'o', 'ұ': 'u', 'ү': 'u', 'һ': 'h', 'і': 'i',
  };

  return text
    .toLowerCase()
    .split('')
    .map(char => map[char] || char)
    .join('')
    .replace(/[^a-z0-9]/g, '');
}

// Генерация логина из ФИО (фамилия + первая буква имени)
async function generateLogin(fullName: string): Promise<string> {
  const parts = fullName.trim().split(/\s+/);
  let baseLogin = '';

  if (parts.length >= 2) {
    // Фамилия + первая буква имени
    const surname = transliterate(parts[0]);
    const firstNameInitial = transliterate(parts[1].charAt(0));
    baseLogin = surname + firstNameInitial;
  } else {
    baseLogin = transliterate(parts[0]);
  }

  // Проверка уникальности и добавление номера если нужно
  let login = baseLogin;
  let counter = 1;

  while (await prisma.user.findUnique({ where: { login } })) {
    login = `${baseLogin}${counter}`;
    counter++;
  }

  return login;
}

// Рекурсивное получение всех подчиненных
async function getSubordinatesTree(userId: number): Promise<any[]> {
  const direct = await prisma.user.findMany({
    where: { managerId: userId },
    include: {
      group: true,
    },
  });
  const all: any[] = [...direct];
  for (const sub of direct) {
    const nested = await getSubordinatesTree(sub.id);
    all.push(...nested);
  }
  return all;
}

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        group: {
          include: {
            leader: {
              select: {
                id: true,
                fullName: true,
                position: true,
              },
            },
          },
        },
        manager: {
          select: {
            id: true,
            fullName: true,
            position: true,
          },
        },
        subordinates: {
          select: {
            id: true,
            fullName: true,
            position: true,
          },
        },
        leadsGroup: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      include: {
        group: {
          include: {
            leader: {
              select: {
                id: true,
                fullName: true,
                position: true,
              },
            },
          },
        },
        manager: {
          select: {
            id: true,
            fullName: true,
            position: true,
          },
        },
        subordinates: {
          select: {
            id: true,
            fullName: true,
            position: true,
          },
        },
        leadsGroup: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const {
      fullName,
      position,
      groupId,
      managerId,
      submitsBasicReport = false,
      submitsKpi = false,
      canAccessPlatform = false,
      isGroupLeader = false,
    } = req.body;

    if (!fullName || !position || !groupId) {
      return res.status(400).json({ error: 'Full name, position, and group are required' });
    }

    const group = await prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      return res.status(400).json({ error: 'Group not found' });
    }

    if (managerId) {
      const manager = await prisma.user.findUnique({
        where: { id: managerId },
      });
      if (!manager) {
        return res.status(400).json({ error: 'Manager not found' });
      }
    }

    // Генерация логина и пароля если пользователь может зайти в платформу
    let plainPassword: string | null = null;
    let passwordHash: string | null = null;
    let login: string | null = null;

    if (canAccessPlatform) {
      login = await generateLogin(fullName);
      plainPassword = generatePassword();
      passwordHash = await bcrypt.hash(plainPassword, 10);
    }

    const user = await prisma.user.create({
      data: {
        fullName,
        position,
        groupId,
        managerId: managerId || null,
        submitsBasicReport,
        submitsKpi,
        canAccessPlatform,
        login,
        passwordHash,
      },
      include: {
        group: true,
        manager: true,
      },
    });

    // Если пользователь должен быть начальником группы - назначаем его
    if (isGroupLeader) {
      await prisma.group.update({
        where: { id: groupId },
        data: { leaderId: user.id },
      });
    }

    // Возвращаем пользователя с сгенерированным логином и паролем (только при создании)
    res.status(201).json({
      ...user,
      generatedPassword: plainPassword,
      generatedLogin: login,
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      fullName,
      position,
      groupId,
      managerId,
      submitsBasicReport,
      submitsKpi,
      canAccessPlatform,
      isGroupLeader,
    } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      include: { leadsGroup: true },
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const newGroupId = groupId || existingUser.groupId;

    if (groupId) {
      const group = await prisma.group.findUnique({
        where: { id: groupId },
      });
      if (!group) {
        return res.status(400).json({ error: 'Group not found' });
      }
    }

    // Если пользователь меняет группу и был начальником старой группы - очищаем leaderId
    if (groupId && groupId !== existingUser.groupId && existingUser.leadsGroup) {
      await prisma.group.update({
        where: { id: existingUser.groupId },
        data: { leaderId: null },
      });
    }

    if (managerId) {
      if (managerId === parseInt(id)) {
        return res.status(400).json({ error: 'User cannot be their own manager' });
      }
      const manager = await prisma.user.findUnique({
        where: { id: managerId },
      });
      if (!manager) {
        return res.status(400).json({ error: 'Manager not found' });
      }
    }

    // Если включен доступ к платформе, но логина/пароля нет - генерируем
    let plainPassword: string | null = null;
    let passwordHash = existingUser.passwordHash;
    let login = existingUser.login;

    if (canAccessPlatform && !existingUser.canAccessPlatform) {
      // Генерируем логин если его нет
      if (!login) {
        login = await generateLogin(fullName || existingUser.fullName);
      }
      // Генерируем пароль если его нет
      if (!passwordHash) {
        plainPassword = generatePassword();
        passwordHash = await bcrypt.hash(plainPassword, 10);
      }
    }

    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: {
        fullName: fullName || existingUser.fullName,
        position: position || existingUser.position,
        groupId: newGroupId,
        managerId: managerId === null ? null : (managerId || existingUser.managerId),
        submitsBasicReport: submitsBasicReport ?? existingUser.submitsBasicReport,
        submitsKpi: submitsKpi ?? existingUser.submitsKpi,
        canAccessPlatform: canAccessPlatform ?? existingUser.canAccessPlatform,
        login,
        passwordHash,
      },
      include: {
        group: true,
        manager: true,
      },
    });

    // Если флаг isGroupLeader установлен - назначаем пользователя начальником новой группы
    if (isGroupLeader) {
      await prisma.group.update({
        where: { id: newGroupId },
        data: { leaderId: user.id },
      });
    }

    // Возвращаем пользователя с сгенерированным логином и паролем (если были созданы)
    res.json({
      ...user,
      generatedPassword: plainPassword,
      generatedLogin: login !== existingUser.login ? login : null,
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existingUser = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      include: { subordinates: true, leadsGroup: true },
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Если пользователь был начальником группы - очищаем leaderId
    if (existingUser.leadsGroup) {
      await prisma.group.update({
        where: { id: existingUser.leadsGroup.id },
        data: { leaderId: null },
      });
    }

    if (existingUser.subordinates.length > 0) {
      await prisma.user.updateMany({
        where: { managerId: parseInt(id) },
        data: { managerId: null },
      });
    }

    await prisma.user.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Пересоздание пароля пользователя (только для админов)
export const regeneratePassword = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const existingUser = await prisma.user.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!existingUser.canAccessPlatform) {
      return res.status(400).json({ error: 'User does not have platform access' });
    }

    const plainPassword = generatePassword();
    const passwordHash = await bcrypt.hash(plainPassword, 10);

    await prisma.user.update({
      where: { id: parseInt(id) },
      data: { passwordHash },
    });

    res.json({ generatedPassword: plainPassword });
  } catch (error) {
    console.error('Regenerate password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Получение дерева подчиненных для пользователя
export const getUserSubordinatesTree = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const subordinates = await getSubordinatesTree(userId);
    res.json(subordinates);
  } catch (error) {
    console.error('Get subordinates tree error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
