import { useState } from 'react';
import { calculateLevel } from '../utils/levelLogic';

interface CoinBadgeProps {
  totalCoins: number;
  showDetails?: boolean;
}

export function CoinBadge({ totalCoins, showDetails = false }: CoinBadgeProps) {
  const [isHovered, setIsHovered] = useState(false);
  const levelInfo = calculateLevel(totalCoins);

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center gap-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-lg shadow-md">
        <span className="text-2xl">🪙</span>
        <div>
          <p className="text-lg font-bold">{totalCoins} Coins</p>
          <p className="text-xs opacity-90">Level {levelInfo.level} {levelInfo.title}</p>
        </div>
      </div>

      {(isHovered || showDetails) && (
        <div className="absolute top-full mt-2 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-[200px] z-10">
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Level Progress</span>
                <span className="font-medium">{levelInfo.currentXP}/100 XP</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
                  style={{ width: `${levelInfo.progressPercent}%` }}
                />
              </div>
            </div>

            <div className="border-t pt-3">
              <p className="text-sm text-gray-600">
                <span className="font-medium">{levelInfo.xpToNextLevel} XP</span> to next level
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
              <p className="text-xs text-yellow-800">
                💡 Tip: Complete habits and goals to earn more coins!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
