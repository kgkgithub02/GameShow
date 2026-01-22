import { Team } from '@/app/types/game';
import { Trophy } from 'lucide-react';

interface ScoreboardProps {
  teams: Team[];
  compact?: boolean;
}

export function Scoreboard({ teams, compact = false }: ScoreboardProps) {
  const sortedTeams = [...teams].sort((a, b) => b.score - a.score);
  const maxScore = Math.max(...teams.map(t => t.score), 1);

  if (compact) {
    return (
      <div className="flex gap-4 justify-center">
        {sortedTeams.map((team, index) => (
          <div
            key={team.id}
            className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2"
          >
            {index === 0 && <Trophy className="h-4 w-4 text-yellow-400" />}
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: team.color }}
            />
            <span className="text-white font-medium">{team.name}</span>
            <span className="text-white font-bold">{team.score}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
      <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
        <Trophy className="h-6 w-6 text-yellow-400" />
        Scoreboard
      </h2>
      <div className="space-y-3">
        {sortedTeams.map((team, index) => (
          <div key={team.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-white/50 w-8">
                  #{index + 1}
                </span>
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: team.color }}
                />
                <span className="text-white font-semibold text-lg">
                  {team.name}
                </span>
              </div>
              <span className="text-3xl font-bold text-white">{team.score}</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-500 rounded-full"
                style={{
                  width: `${(team.score / maxScore) * 100}%`,
                  backgroundColor: team.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
