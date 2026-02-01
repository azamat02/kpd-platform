import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/authMiddleware';

interface GroupNode {
  id: number;
  name: string;
  leaderId: number | null;
  leader: {
    id: number;
    fullName: string;
    position: string;
    managerId: number | null;
  } | null;
  parentGroupId: number | null;
  children: GroupNode[];
}

interface GroupScoreResult {
  groupId: number;
  groupName: string;
  leaderId: number | null;
  leaderName: string | null;
  score: number | null;
  userCount: number;
  isLeaf: boolean;
  children: GroupScoreResult[];
}

// Build group hierarchy based on manager relationships
async function buildGroupHierarchy(): Promise<Map<number, GroupNode>> {
  const groups = await prisma.group.findMany({
    include: {
      leader: {
        select: {
          id: true,
          fullName: true,
          position: true,
          managerId: true,
        },
      },
    },
  });

  const groupMap = new Map<number, GroupNode>();

  // Initialize all groups
  for (const group of groups) {
    groupMap.set(group.id, {
      id: group.id,
      name: group.name,
      leaderId: group.leaderId,
      leader: group.leader,
      parentGroupId: null,
      children: [],
    });
  }

  // Build parent-child relationships based on manager hierarchy
  for (const group of groups) {
    if (group.leader?.managerId) {
      // Find the group whose leader is the manager of this group's leader
      const parentGroup = groups.find((g) => g.leaderId === group.leader!.managerId);
      if (parentGroup) {
        const node = groupMap.get(group.id)!;
        node.parentGroupId = parentGroup.id;
        groupMap.get(parentGroup.id)!.children.push(node);
      }
    }
  }

  return groupMap;
}

// Get root groups (groups without parent)
function getRootGroups(groupMap: Map<number, GroupNode>): GroupNode[] {
  const roots: GroupNode[] = [];
  for (const group of groupMap.values()) {
    if (!group.parentGroupId) {
      roots.push(group);
    }
  }
  return roots;
}

// Calculate score for a leaf group (average of employee evaluations)
async function calculateLeafGroupScore(
  groupId: number,
  periodId: number
): Promise<{ score: number | null; userCount: number }> {
  const evaluations = await prisma.evaluation.findMany({
    where: {
      periodId,
      evaluatee: {
        groupId,
      },
    },
    select: {
      averageScore: true,
    },
  });

  if (evaluations.length === 0) {
    return { score: null, userCount: 0 };
  }

  const totalScore = evaluations.reduce((sum, e) => sum + e.averageScore, 0);
  const averageScore = Math.round((totalScore / evaluations.length) * 100) / 100;

  return { score: averageScore, userCount: evaluations.length };
}

// Recursively calculate scores for a group and its children
async function calculateGroupScoreRecursive(
  groupNode: GroupNode,
  periodId: number,
  scoresCache: Map<number, { score: number | null; userCount: number; isLeaf: boolean }>
): Promise<{ score: number | null; userCount: number; isLeaf: boolean }> {
  // If this group has no children, it's a leaf group
  if (groupNode.children.length === 0) {
    const leafScore = await calculateLeafGroupScore(groupNode.id, periodId);
    scoresCache.set(groupNode.id, { ...leafScore, isLeaf: true });
    return { ...leafScore, isLeaf: true };
  }

  // Calculate scores for all children first
  const childScores: { score: number | null; userCount: number }[] = [];
  for (const child of groupNode.children) {
    const childScore = await calculateGroupScoreRecursive(child, periodId, scoresCache);
    childScores.push(childScore);
  }

  // Filter out null scores
  const validScores = childScores.filter((cs) => cs.score !== null);

  if (validScores.length === 0) {
    scoresCache.set(groupNode.id, { score: null, userCount: 0, isLeaf: false });
    return { score: null, userCount: 0, isLeaf: false };
  }

  // Parent group score = average of child group scores
  const totalScore = validScores.reduce((sum, cs) => sum + cs.score!, 0);
  const averageScore = Math.round((totalScore / validScores.length) * 100) / 100;
  const totalUsers = childScores.reduce((sum, cs) => sum + cs.userCount, 0);

  scoresCache.set(groupNode.id, { score: averageScore, userCount: totalUsers, isLeaf: false });
  return { score: averageScore, userCount: totalUsers, isLeaf: false };
}

// Build result tree from group hierarchy
function buildResultTree(
  groupNode: GroupNode,
  scoresCache: Map<number, { score: number | null; userCount: number; isLeaf: boolean }>
): GroupScoreResult {
  const scoreData = scoresCache.get(groupNode.id) || { score: null, userCount: 0, isLeaf: true };

  return {
    groupId: groupNode.id,
    groupName: groupNode.name,
    leaderId: groupNode.leaderId,
    leaderName: groupNode.leader?.fullName || null,
    score: scoreData.score,
    userCount: scoreData.userCount,
    isLeaf: scoreData.isLeaf,
    children: groupNode.children.map((child) => buildResultTree(child, scoresCache)),
  };
}

// GET /api/group-scores - Get group scores with hierarchy for a period
export const getGroupScores = async (req: AuthRequest, res: Response) => {
  try {
    const { periodId } = req.query;

    let targetPeriodId: number;

    if (periodId) {
      targetPeriodId = parseInt(periodId as string);
    } else {
      // Get the active period
      const activePeriod = await prisma.evaluationPeriod.findFirst({
        where: { isActive: true },
        orderBy: { startDate: 'desc' },
      });

      if (!activePeriod) {
        return res.json({ period: null, groups: [] });
      }
      targetPeriodId = activePeriod.id;
    }

    const period = await prisma.evaluationPeriod.findUnique({
      where: { id: targetPeriodId },
    });

    if (!period) {
      return res.status(404).json({ error: 'Period not found' });
    }

    // Build group hierarchy
    const groupMap = await buildGroupHierarchy();
    const rootGroups = getRootGroups(groupMap);

    // Calculate scores for all groups
    const scoresCache = new Map<number, { score: number | null; userCount: number; isLeaf: boolean }>();

    for (const root of rootGroups) {
      await calculateGroupScoreRecursive(root, targetPeriodId, scoresCache);
    }

    // Build result tree
    const resultTree = rootGroups.map((root) => buildResultTree(root, scoresCache));

    res.json({ period, groups: resultTree });
  } catch (error) {
    console.error('Get group scores error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/group-scores/:groupId - Get detailed info for a group
export const getGroupScoreDetails = async (req: AuthRequest, res: Response) => {
  try {
    const { groupId } = req.params;
    const { periodId } = req.query;

    let targetPeriodId: number;

    if (periodId) {
      targetPeriodId = parseInt(periodId as string);
    } else {
      const activePeriod = await prisma.evaluationPeriod.findFirst({
        where: { isActive: true },
        orderBy: { startDate: 'desc' },
      });

      if (!activePeriod) {
        return res.json({ period: null, group: null, employees: [] });
      }
      targetPeriodId = activePeriod.id;
    }

    const group = await prisma.group.findUnique({
      where: { id: parseInt(groupId) },
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
            evaluationsReceived: {
              where: { periodId: targetPeriodId },
              select: {
                id: true,
                averageScore: true,
                result: true,
                formType: true,
                scores: true,
              },
            },
          },
          orderBy: { fullName: 'asc' },
        },
      },
    });

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const period = await prisma.evaluationPeriod.findUnique({
      where: { id: targetPeriodId },
    });

    // Format employees with their evaluations
    const employees = group.users.map((user) => ({
      id: user.id,
      fullName: user.fullName,
      position: user.position,
      evaluation: user.evaluationsReceived[0] || null,
    }));

    // Calculate group average
    const evaluatedEmployees = employees.filter((e) => e.evaluation !== null);
    const groupScore =
      evaluatedEmployees.length > 0
        ? Math.round(
            (evaluatedEmployees.reduce((sum, e) => sum + e.evaluation!.averageScore, 0) /
              evaluatedEmployees.length) *
              100
          ) / 100
        : null;

    res.json({
      period,
      group: {
        id: group.id,
        name: group.name,
        leader: group.leader,
        score: groupScore,
        evaluatedCount: evaluatedEmployees.length,
        totalCount: employees.length,
      },
      employees,
    });
  } catch (error) {
    console.error('Get group score details error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/group-scores/calculate - Recalculate and save all group scores
export const calculateGroupScores = async (req: AuthRequest, res: Response) => {
  try {
    const { periodId } = req.body;

    if (!periodId) {
      return res.status(400).json({ error: 'Period ID is required' });
    }

    const period = await prisma.evaluationPeriod.findUnique({
      where: { id: periodId },
    });

    if (!period) {
      return res.status(404).json({ error: 'Period not found' });
    }

    // Build group hierarchy
    const groupMap = await buildGroupHierarchy();
    const rootGroups = getRootGroups(groupMap);

    // Calculate scores for all groups
    const scoresCache = new Map<number, { score: number | null; userCount: number; isLeaf: boolean }>();

    for (const root of rootGroups) {
      await calculateGroupScoreRecursive(root, periodId, scoresCache);
    }

    // Save scores to database
    const savedScores = [];
    for (const [groupId, scoreData] of scoresCache.entries()) {
      if (scoreData.score !== null) {
        const saved = await prisma.groupScore.upsert({
          where: {
            groupId_periodId: {
              groupId,
              periodId,
            },
          },
          update: {
            score: scoreData.score,
            userCount: scoreData.userCount,
            isLeaf: scoreData.isLeaf,
          },
          create: {
            groupId,
            periodId,
            score: scoreData.score,
            userCount: scoreData.userCount,
            isLeaf: scoreData.isLeaf,
          },
        });
        savedScores.push(saved);
      }
    }

    res.json({
      message: 'Group scores calculated successfully',
      count: savedScores.length,
      scores: savedScores,
    });
  } catch (error) {
    console.error('Calculate group scores error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
