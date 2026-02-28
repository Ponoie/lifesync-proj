import { Request, Response } from 'express';
import { User } from '../models/User';
import { Goal } from '../models/Goal';
import mongoose from 'mongoose';

// GET /api/ranking - Get leaderboard with aggregation
export const getRanking = async (req: Request, res: Response) => {
  try {
    const { limit = '10', timeframe = 'all' } = req.query;

    const limitNum = parseInt(limit as string, 10);
    const limitCount = Math.min(Math.max(limitNum, 1), 100); // Between 1-100

    // Aggregation pipeline for ranking
    const rankingPipeline = [
      // Match only non-deleted users
      {
        $match: {
          deletedAt: null,
        },
      },
      // Lookup goals
      {
        $lookup: {
          from: 'goals',
          as: 'goals',
          let: { userId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$userId', '$$userId'] },
                    { $eq: ['$deletedAt', null] },
                  ],
                },
              },
            },
          ],
        },
      },
      // Calculate statistics
      {
        $addFields: {
          totalGoals: { $size: '$goals' },
          completedGoals: {
            $size: {
              $filter: {
                input: '$goals',
                as: 'goal',
                cond: { $eq: ['$$goal.completed', true] },
              },
            },
          },
          totalProgress: {
            $sum: '$goals.progress',
          },
        },
      },
      // Calculate average progress
      {
        $addFields: {
          avgProgress: {
            $cond: [
              { $gt: ['$totalGoals', 0] },
              { $divide: ['$totalProgress', '$totalGoals'] },
              0,
            ],
          },
        },
      },
      // Calculate score (weighted)
      {
        $addFields: {
          score: {
            $add: [
              { $multiply: ['$totalCoins', 1] }, // Coins: 1x
              { $multiply: ['$completedGoals', 50] }, // Completed goals: 50x
              { $multiply: ['$avgProgress', 10] }, // Avg progress: 10x
            ],
          },
        },
      },
      // Sort by score (descending)
      {
        $sort: {
          score: -1,
          totalCoins: -1,
          _id: 1,
        },
      },
      // Limit results
      {
        $limit: limitCount,
      },
      // Add rank
      {
        $addFields: {
          rank: {
            $add: [{ $indexOfArray: [['$_id'], '$_id'] }, 1],
          },
        },
      },
      // Project final output
      {
        $project: {
          _id: 1,
          rank: 1,
          username: 1,
          avatar: 1,
          totalCoins: 1,
          totalGoals: 1,
          completedGoals: 1,
          avgProgress: { $round: ['$avgProgress', 2] },
          score: { $round: ['$score', 2] },
          role: 1,
          joinedAt: 1,
        },
      },
    ];

    const rankings = await User.aggregate(rankingPipeline);

    res.json({
      success: true,
      count: rankings.length,
      data: rankings,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET /api/ranking/user/:userId - Get user's rank and position
export const getUserRank = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID',
      });
    }

    // Aggregation to find user's rank
    const rankPipeline = [
      {
        $match: {
          deletedAt: null,
        },
      },
      {
        $lookup: {
          from: 'goals',
          as: 'goals',
          let: { userId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$userId', '$$userId'] },
                    { $eq: ['$deletedAt', null] },
                  ],
                },
              },
            },
          ],
        },
      },
      {
        $addFields: {
          totalGoals: { $size: '$goals' },
          completedGoals: {
            $size: {
              $filter: {
                input: '$goals',
                as: 'goal',
                cond: { $eq: ['$$goal.completed', true] },
              },
            },
          },
          totalProgress: {
            $sum: '$goals.progress',
          },
        },
      },
      {
        $addFields: {
          avgProgress: {
            $cond: [
              { $gt: ['$totalGoals', 0] },
              { $divide: ['$totalProgress', '$totalGoals'] },
              0,
            ],
          },
          score: {
            $add: [
              { $multiply: ['$totalCoins', 1] },
              { $multiply: ['$completedGoals', 50] },
              { $multiply: ['$avgProgress', 10] },
            ],
          },
        },
      },
      {
        $sort: {
          score: -1,
          totalCoins: -1,
          _id: 1,
        },
      },
      // Group to get rank
      {
        $group: {
          _id: null,
          users: { $push: '$$ROOT' },
        },
      },
      {
        $project: {
          userRank: {
            $indexOfArray: [
              '$users._id',
              new mongoose.Types.ObjectId(userId),
            ],
          },
          totalUsers: { $size: '$users' },
        },
      },
    ];

    const result = await User.aggregate(rankPipeline);

    if (!result || result.length === 0 || result[0].userRank === -1) {
      return res.status(404).json({
        success: false,
        message: 'User not found in ranking',
      });
    }

    const { userRank, totalUsers } = result[0];

    res.json({
      success: true,
      data: {
        rank: userRank + 1,
        totalUsers,
        percentile: Math.round(((totalUsers - userRank) / totalUsers) * 100),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET /api/stats/overview - Get platform statistics
export const getPlatformStats = async (req: Request, res: Response) => {
  try {
    const statsPipeline = [
      {
        $match: {
          deletedAt: null,
        },
      },
      {
        $facet: {
          users: [
            {
              $count: 'total',
            },
          ],
          coins: [
            {
              $group: {
                _id: null,
                total: { $sum: '$totalCoins' },
                avg: { $avg: '$totalCoins' },
                max: { $max: '$totalCoins' },
              },
            },
          ],
        },
      },
    ];

    const userStats = await User.aggregate(statsPipeline);

    const goalStatsPipeline = [
      {
        $match: {
          deletedAt: null,
        },
      },
      {
        $facet: {
          total: [
            {
              $count: 'count',
            },
          ],
          completed: [
            {
              $match: {
                completed: true,
              },
            },
            {
              $count: 'count',
            },
          ],
          avgProgress: [
            {
              $group: {
                _id: null,
                avg: { $avg: '$progress' },
              },
            },
          ],
        },
      },
    ];

    const goalStats = await Goal.aggregate(goalStatsPipeline);

    res.json({
      success: true,
      data: {
        users: userStats[0]?.users[0] || { total: 0 },
        coins: userStats[0]?.coins[0] || { total: 0, avg: 0, max: 0 },
        goals: goalStats[0] || {
          total: [{ count: 0 }],
          completed: [{ count: 0 }],
          avgProgress: [{ avg: 0 }],
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
