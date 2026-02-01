import { Request, Response } from 'express';
import prisma from '../config/database';

export const getGroups = async (req: Request, res: Response) => {
  try {
    const groups = await prisma.group.findMany({
      include: {
        leader: {
          select: {
            id: true,
            fullName: true,
            position: true,
          },
        },
        _count: {
          select: { users: true },
        },
      },
      orderBy: { name: 'asc' },
    });
    res.json(groups);
  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getGroup = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const group = await prisma.group.findUnique({
      where: { id: parseInt(id) },
      include: {
        leader: {
          select: {
            id: true,
            fullName: true,
            position: true,
          },
        },
        users: {
          select: {
            id: true,
            fullName: true,
            position: true,
          },
        },
      },
    });

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    res.json(group);
  } catch (error) {
    console.error('Get group error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createGroup = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Group name is required' });
    }

    const existingGroup = await prisma.group.findUnique({
      where: { name },
    });

    if (existingGroup) {
      return res.status(400).json({ error: 'Group with this name already exists' });
    }

    const group = await prisma.group.create({
      data: { name },
    });

    res.status(201).json(group);
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateGroup = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, leaderId } = req.body;

    const existingGroup = await prisma.group.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingGroup) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Validate name if provided
    if (name) {
      const duplicateGroup = await prisma.group.findFirst({
        where: {
          name,
          NOT: { id: parseInt(id) },
        },
      });

      if (duplicateGroup) {
        return res.status(400).json({ error: 'Group with this name already exists' });
      }
    }

    // Validate leader if provided (and not null)
    if (leaderId !== undefined && leaderId !== null) {
      const leader = await prisma.user.findUnique({
        where: { id: leaderId },
      });

      if (!leader) {
        return res.status(400).json({ error: 'Leader not found' });
      }

      // Leader must be in this group
      if (leader.groupId !== parseInt(id)) {
        return res.status(400).json({ error: 'Leader must be a member of this group' });
      }
    }

    const group = await prisma.group.update({
      where: { id: parseInt(id) },
      data: {
        name: name || existingGroup.name,
        leaderId: leaderId === null ? null : (leaderId ?? existingGroup.leaderId),
      },
      include: {
        leader: {
          select: {
            id: true,
            fullName: true,
            position: true,
          },
        },
        _count: {
          select: { users: true },
        },
      },
    });

    res.json(group);
  } catch (error) {
    console.error('Update group error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteGroup = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existingGroup = await prisma.group.findUnique({
      where: { id: parseInt(id) },
      include: { _count: { select: { users: true } } },
    });

    if (!existingGroup) {
      return res.status(404).json({ error: 'Group not found' });
    }

    if (existingGroup._count.users > 0) {
      return res.status(400).json({
        error: 'Cannot delete group with existing users. Please reassign users first.'
      });
    }

    await prisma.group.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: 'Group deleted successfully' });
  } catch (error) {
    console.error('Delete group error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
