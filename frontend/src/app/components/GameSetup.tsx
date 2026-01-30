import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Team, Difficulty, RoundType, RoundSettings } from '@/app/types/game';
import { Plus, Trash2 } from 'lucide-react';
import { Checkbox } from '@/app/components/ui/checkbox';
import { useGameSync } from '@/hooks/useGameSync';
import { formatGameCode } from '@/app/utils/gameCode';

interface GameSetupProps {
  mode: 'manual' | 'online';
  gameId: string | null;
  gameCode: string | null;
  onModeChange: (mode: 'manual' | 'online') => void;
  onCreateOnlineGame: (
    teams: Team[],
    difficulty: Difficulty,
    rounds: RoundType[],
    hostPin: string
  ) => Promise<void>;
  onStartGame: (
    teams: Team[],
    difficulty: Difficulty,
    rounds: RoundType[],
    roundSettings: RoundSettings
  ) => void | Promise<void>;
}

const TEAM_COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

const CONNECT4_THEME_OPTIONS = [
  { value: 'general', label: '🎲 General' },
  { value: 'science', label: '🔬 Science' },
  { value: 'history', label: '📚 History' },
  { value: 'pop-culture', label: '🎬 Pop Culture' },
  { value: 'sports', label: '⚽ Sports & Athletics' },
  { value: 'geography', label: '🌍 Geography' },
  { value: 'entertainment', label: '🎭 Entertainment' },
  { value: 'music', label: '🎵 Music' },
  { value: 'literature', label: '📖 Literature' },
  { value: 'technology', label: '💻 Technology' },
  { value: 'food-drink', label: '🍕 Food & Drink' },
  { value: 'fashion', label: '👗 Fashion' },
  { value: 'nature-animals', label: '🦁 Nature & Animals' },
  { value: 'space-astronomy', label: '🚀 Space & Astronomy' },
  { value: 'business-economics', label: '💼 Business & Economics' },
  { value: 'current-events', label: '📰 Current Events' },
  { value: 'world-records', label: '🏆 World Records' },
  { value: 'quotes-sayings', label: '💬 Quotes & Sayings' },
  { value: 'inventions', label: '💡 Inventions' },
];

const DEFAULT_CONNECT4_THEMES = ['general', 'science', 'history', 'pop-culture'];

const DUMP_CHARADES_CATEGORIES = [
  { value: 'general', label: '🎲 General' },
  { value: 'animals', label: '🦁 Animals' },
  { value: 'actions', label: '🏃 Actions' },
  { value: 'movies', label: '🎬 Movies' },
  { value: 'sports', label: '⚽ Sports' },
  { value: 'professions', label: '🧰 Professions' },
];

const ALL_ROUNDS: { type: RoundType; name: string; description: string }[] = [
  { type: 'trivia-buzz', name: 'Trivia Buzz', description: 'Buzz-in trivia questions' },
  { type: 'lightning', name: 'Lightning Round', description: '60-second rapid fire' },
  { type: 'quick-build', name: 'Quick Build', description: 'Build the best structure' },
  { type: 'connect-4', name: 'Connect 4', description: 'Strategy board game' },
  { type: 'guess-number', name: 'Guess the Number', description: 'Closest estimate wins' },
  { type: 'blind-draw', name: 'Blind Draw', description: 'Guess the drawing' },
  { type: 'dump-charades', name: 'Dump Charades', description: 'Act it out without words' },
];

export function GameSetup({
  mode,
  gameId,
  gameCode,
  onModeChange,
  onCreateOnlineGame,
  onStartGame,
}: GameSetupProps) {
  const [teams, setTeams] = useState<Team[]>([
    { id: '1', name: 'Blue Team', color: TEAM_COLORS[0], score: 0, players: [''] },
    { id: '2', name: 'Red Team', color: TEAM_COLORS[1], score: 0, players: [''] },
  ]);
  const [selectedRounds, setSelectedRounds] = useState<RoundType[]>(ALL_ROUNDS.map(r => r.type));
  const [roundSettings, setRoundSettings] = useState<RoundSettings>({
    triviaBuzzQuestions: 10,
    triviaBuzzDifficulty: 'medium-hard',
    lightningSeconds: 60,
    lightningDifficulty: 'medium-hard',
    quickBuildSeconds: 60,
    guessNumberSeconds: 30,
    guessNumberQuestions: 10,
    guessNumberDifficulty: 'medium-hard',
    connect4Themes: DEFAULT_CONNECT4_THEMES,
    connect4Difficulty: 'medium-hard',
    blindDrawSeconds: 60,
    blindDrawDifficulty: 'medium-hard',
    dumpCharadesSeconds: 60,
    dumpCharadesDifficulty: 'medium-hard',
    dumpCharadesCategory: 'general',
  });
  const [submitting, setSubmitting] = useState(false);
  const [creatingOnline, setCreatingOnline] = useState(false);
  const [hostPin, setHostPin] = useState('');
  const { teams: syncedTeams, players: syncedPlayers } = useGameSync(gameId);
  const displayTeams = useMemo(
    () => (syncedTeams.length ? syncedTeams : teams),
    [syncedTeams, teams]
  );

  const addTeam = () => {
    if (teams.length < 6) {
      setTeams([
        ...teams,
        {
          id: String(teams.length + 1),
          name: `Team ${teams.length + 1}`,
          color: TEAM_COLORS[teams.length],
          score: 0,
          players: [''],
        },
      ]);
    }
  };

  const removeTeam = (id: string) => {
    if (teams.length > 2) {
      setTeams(teams.filter(t => t.id !== id));
    }
  };

  const updateTeamName = (id: string, name: string) => {
    setTeams(teams.map(t => (t.id === id ? { ...t, name } : t)));
  };

  const addPlayer = (teamId: string) => {
    setTeams(
      teams.map(t =>
        t.id === teamId && t.players.length < 5
          ? { ...t, players: [...t.players, ''] }
          : t
      )
    );
  };

  const updatePlayer = (teamId: string, playerIndex: number, name: string) => {
    setTeams(
      teams.map(t =>
        t.id === teamId
          ? {
              ...t,
              players: t.players.map((p, i) => (i === playerIndex ? name : p)),
            }
          : t
      )
    );
  };

  const removePlayer = (teamId: string, playerIndex: number) => {
    setTeams(
      teams.map(t =>
        t.id === teamId && t.players.length > 1
          ? { ...t, players: t.players.filter((_, i) => i !== playerIndex) }
          : t
      )
    );
  };

  const toggleRound = (roundType: RoundType) => {
    if (selectedRounds.includes(roundType)) {
      setSelectedRounds(selectedRounds.filter(r => r !== roundType));
    } else {
      setSelectedRounds([...selectedRounds, roundType]);
    }
  };

  const handleStartGame = async () => {
    if (selectedRounds.length === 0) {
      alert('Please select at least one round');
      return;
    }
    setSubmitting(true);
    try {
      await onStartGame(teams, 'medium-hard', selectedRounds, roundSettings);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateOnline = async () => {
    if (selectedRounds.length === 0) {
      alert('Please select at least one round');
      return;
    }
    if (!hostPin.trim() || hostPin.trim().length < 4) {
      alert('Please set a host PIN (at least 4 characters).');
      return;
    }
    setCreatingOnline(true);
    try {
      await onCreateOnlineGame(teams, 'medium-hard', selectedRounds, hostPin.trim());
    } finally {
      setCreatingOnline(false);
    }
  };

  useEffect(() => {
    if (mode === 'online' && !gameCode && !creatingOnline && hostPin.trim().length >= 4) {
      handleCreateOnline();
    }
  }, [mode, gameCode, creatingOnline, selectedRounds, teams, hostPin]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-2">Game Show Setup</h1>
          <p className="text-blue-200">Configure your teams and game settings</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Game Mode</CardTitle>
            <CardDescription>Choose manual (local) or online (players join with code)</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Button
              variant={mode === 'manual' ? 'default' : 'outline'}
              className="h-14"
              onClick={() => onModeChange('manual')}
            >
              Manual Mode
            </Button>
            <Button
              variant={mode === 'online' ? 'default' : 'outline'}
              className="h-14"
              onClick={() => onModeChange('online')}
            >
              Online Mode
            </Button>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Teams</CardTitle>
            <CardDescription>
              {mode === 'manual'
                ? 'Add 2-6 teams with 1-5 players each'
                : 'Add 2-6 teams (players will join online)'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {teams.map((team, teamIndex) => (
              <Card key={team.id} style={{ borderLeft: `4px solid ${team.color}` }}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex-1">
                      <Label>Team Name</Label>
                      <Input
                        value={team.name}
                        onChange={e => updateTeamName(team.id, e.target.value)}
                        placeholder="Enter team name"
                        disabled={mode === 'online' && !!gameCode}
                      />
                    </div>
                    {teams.length > 2 && (
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => removeTeam(team.id)}
                        className="mt-6"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {mode === 'manual' && (
                    <div className="space-y-2">
                      <Label>Players</Label>
                      {team.players.map((player, playerIndex) => (
                        <div key={playerIndex} className="flex gap-2">
                          <Input
                            value={player}
                            onChange={e =>
                              updatePlayer(team.id, playerIndex, e.target.value)
                            }
                            placeholder={`Player ${playerIndex + 1}`}
                          />
                          {team.players.length > 1 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removePlayer(team.id, playerIndex)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      {team.players.length < 5 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addPlayer(team.id)}
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Player
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {teams.length < 6 && (
              <Button onClick={addTeam} variant="outline" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Team
              </Button>
            )}
          </CardContent>
        </Card>

        {mode === 'online' && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Host PIN</CardTitle>
              <CardDescription>
                Required to rejoin host mode if the browser disconnects.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Label>Host PIN (4-20 characters)</Label>
              <Input
                type="password"
                value={hostPin}
                onChange={(event) => setHostPin(event.target.value)}
                placeholder="Enter a host PIN"
                disabled={!!gameCode}
              />
              <p className="text-xs text-gray-500">
                Save this PIN. You will need it to resume hosting with the game code.
              </p>
            </CardContent>
          </Card>
        )}

        {mode === 'online' && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Online Lobby</CardTitle>
              <CardDescription>Share this code so players can join</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {gameCode ? (
                <div className="text-center">
                  <div className="text-xs uppercase tracking-wide text-gray-500">Game Code</div>
                  <div className="text-3xl font-bold tracking-widest">{formatGameCode(gameCode)}</div>
                </div>
              ) : (
                <div className="text-sm text-gray-500 text-center">
                  Generate a code to open the lobby for players.
                </div>
              )}
              <div className="grid gap-4 md:grid-cols-2">
                {displayTeams.map(team => {
                  const teamPlayers = syncedPlayers.filter(player => player.team_id === team.id);
                  return (
                    <div
                      key={team.id}
                      className="border rounded-lg p-4"
                      style={{ borderLeft: `4px solid ${team.color}` }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-semibold">{team.name}</div>
                        <div className="text-xs text-gray-500">{teamPlayers.length} joined</div>
                      </div>
                      {teamPlayers.length === 0 ? (
                        <div className="text-sm text-gray-400">No players yet</div>
                      ) : (
                        <div className="space-y-1">
                          {teamPlayers.map(player => (
                            <div key={player.id} className="flex items-center justify-between text-sm">
                              <span>{player.name}</span>
                              <span className={player.connected ? 'text-green-600' : 'text-gray-400'}>
                                {player.connected ? 'Online' : 'Left'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Select Rounds</CardTitle>
            <CardDescription>Choose which rounds to include and configure their settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Trivia Buzz */}
            <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-3 mb-3">
                <Checkbox
                  id="trivia-buzz"
                  checked={selectedRounds.includes('trivia-buzz')}
                  onCheckedChange={() => toggleRound('trivia-buzz')}
                />
                <div className="flex-1">
                  <label
                    htmlFor="trivia-buzz"
                    className="font-medium cursor-pointer text-lg"
                  >
                    ⚡ Trivia Buzz
                  </label>
                  <p className="text-sm text-gray-500">Buzz-in trivia questions</p>
                </div>
              </div>
              {selectedRounds.includes('trivia-buzz') && (
                <div className="ml-8 pt-2 border-t space-y-3">
                  <div>
                    <Label htmlFor="trivia-questions" className="text-sm">Number of Questions</Label>
                    <div className="flex items-center gap-3 mt-1">
                      <Input
                        id="trivia-questions"
                        type="number"
                        min="5"
                        max="20"
                        value={roundSettings.triviaBuzzQuestions}
                        onChange={(e) =>
                          setRoundSettings({
                            ...roundSettings,
                            triviaBuzzQuestions: parseInt(e.target.value) || 10,
                          })
                        }
                        className="w-24"
                      />
                      <span className="text-sm text-gray-500">
                        (5-20 questions, default: 10)
                      </span>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="trivia-difficulty" className="text-sm">Difficulty Level</Label>
                    <Select
                      value={roundSettings.triviaBuzzDifficulty || 'medium-hard'}
                      onValueChange={(value) =>
                        setRoundSettings({
                          ...roundSettings,
                          triviaBuzzDifficulty: value as Difficulty,
                        })
                      }
                    >
                      <SelectTrigger id="trivia-difficulty" className="w-full mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="medium-hard">Mid-Hard (Default)</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>

            {/* Lightning Round */}
            <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-3 mb-3">
                <Checkbox
                  id="lightning"
                  checked={selectedRounds.includes('lightning')}
                  onCheckedChange={() => toggleRound('lightning')}
                />
                <div className="flex-1">
                  <label
                    htmlFor="lightning"
                    className="font-medium cursor-pointer text-lg"
                  >
                    ⚡ Lightning Round
                  </label>
                  <p className="text-sm text-gray-500">60-second rapid fire</p>
                </div>
              </div>
              {selectedRounds.includes('lightning') && (
                <div className="ml-8 pt-2 border-t space-y-3">
                  <div>
                    <Label htmlFor="lightning-seconds" className="text-sm">Time Limit (seconds)</Label>
                    <div className="flex items-center gap-3 mt-1">
                      <Input
                        id="lightning-seconds"
                        type="number"
                        min="1"
                        value={roundSettings.lightningSeconds}
                        onChange={(e) =>
                          setRoundSettings({
                            ...roundSettings,
                            lightningSeconds: parseInt(e.target.value) || 60,
                          })
                        }
                        className="w-24"
                      />
                      <span className="text-sm text-gray-500">
                        (default: 60)
                      </span>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="lightning-difficulty" className="text-sm">Difficulty Level</Label>
                    <Select
                      value={roundSettings.lightningDifficulty || 'medium-hard'}
                      onValueChange={(value) =>
                        setRoundSettings({
                          ...roundSettings,
                          lightningDifficulty: value as Difficulty,
                        })
                      }
                    >
                      <SelectTrigger id="lightning-difficulty" className="w-full mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="medium-hard">Mid-Hard (Default)</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Build */}
            <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-3 mb-3">
                <Checkbox
                  id="quick-build"
                  checked={selectedRounds.includes('quick-build')}
                  onCheckedChange={() => toggleRound('quick-build')}
                />
                <div className="flex-1">
                  <label
                    htmlFor="quick-build"
                    className="font-medium cursor-pointer text-lg"
                  >
                    🏗️ Quick Build
                  </label>
                  <p className="text-sm text-gray-500">Build the best structure</p>
                </div>
              </div>
              {selectedRounds.includes('quick-build') && (
                <div className="ml-8 pt-2 border-t space-y-3">
                  <div>
                    <Label htmlFor="quick-build-seconds" className="text-sm">Time Limit (seconds)</Label>
                    <div className="flex items-center gap-3 mt-1">
                      <Input
                        id="quick-build-seconds"
                        type="number"
                        min="30"
                        max="300"
                        value={roundSettings.quickBuildSeconds}
                        onChange={(e) =>
                          setRoundSettings({
                            ...roundSettings,
                            quickBuildSeconds: parseInt(e.target.value) || 60,
                          })
                        }
                        className="w-24"
                      />
                      <span className="text-sm text-gray-500">
                        (30-300 seconds, default: 60)
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Connect 4 */}
            <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-3 mb-3">
                <Checkbox
                  id="connect-4"
                  checked={selectedRounds.includes('connect-4')}
                  onCheckedChange={() => toggleRound('connect-4')}
                />
                <div className="flex-1">
                  <label
                    htmlFor="connect-4"
                    className="font-medium cursor-pointer text-lg"
                  >
                    🎯 Connect 4
                  </label>
                  <p className="text-sm text-gray-500">Strategy board game</p>
                </div>
              </div>
              {selectedRounds.includes('connect-4') && (
                <div className="ml-8 pt-2 border-t space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Question Themes (one per column)</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[0, 1, 2, 3].map((colIndex) => {
                        const currentTheme =
                          roundSettings.connect4Themes?.[colIndex] || DEFAULT_CONNECT4_THEMES[colIndex];
                        const isPreset = CONNECT4_THEME_OPTIONS.some(option => option.value === currentTheme);
                        const selectValue = isPreset ? currentTheme : 'custom';
                        const customValue = !isPreset ? (currentTheme === 'custom' ? '' : currentTheme) : '';
                        return (
                        <div key={colIndex} className="space-y-2">
                          <Label htmlFor={`connect4-theme-${colIndex}`} className="text-xs text-gray-600">
                            Column {colIndex + 1}
                          </Label>
                          <Select
                            value={selectValue}
                            onValueChange={(value) => {
                              const newThemes = [...(roundSettings.connect4Themes || DEFAULT_CONNECT4_THEMES)];
                              if (value === 'custom') {
                                newThemes[colIndex] = isPreset ? 'custom' : currentTheme;
                              } else {
                                newThemes[colIndex] = value as any;
                              }
                              setRoundSettings({
                                ...roundSettings,
                                connect4Themes: newThemes as any,
                              });
                            }}
                          >
                            <SelectTrigger id={`connect4-theme-${colIndex}`} className="h-9 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {CONNECT4_THEME_OPTIONS.map(option => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                              <SelectItem value="custom">✨ Custom</SelectItem>
                            </SelectContent>
                          </Select>
                          {selectValue === 'custom' && (
                            <Input
                              value={customValue}
                              onChange={(event) => {
                                const nextValue = event.target.value;
                                const newThemes = [...(roundSettings.connect4Themes || DEFAULT_CONNECT4_THEMES)];
                                newThemes[colIndex] = nextValue.trim() ? nextValue : 'custom';
                                setRoundSettings({
                                  ...roundSettings,
                                  connect4Themes: newThemes as any,
                                });
                              }}
                              placeholder="Enter custom theme"
                              className="h-9 text-sm"
                            />
                          )}
                        </div>
                      );
                      })}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="connect4-difficulty" className="text-sm">Difficulty Level</Label>
                    <Select
                      value={roundSettings.connect4Difficulty || 'medium-hard'}
                      onValueChange={(value) =>
                        setRoundSettings({
                          ...roundSettings,
                          connect4Difficulty: value as Difficulty,
                        })
                      }
                    >
                      <SelectTrigger id="connect4-difficulty" className="w-full mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="medium-hard">Mid-Hard (Default)</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>

            {/* Guess the Number */}
            <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-3 mb-3">
                <Checkbox
                  id="guess-number"
                  checked={selectedRounds.includes('guess-number')}
                  onCheckedChange={() => toggleRound('guess-number')}
                />
                <div className="flex-1">
                  <label
                    htmlFor="guess-number"
                    className="font-medium cursor-pointer text-lg"
                  >
                    🔢 Guess the Number
                  </label>
                  <p className="text-sm text-gray-500">Closest estimate wins</p>
                </div>
              </div>
              {selectedRounds.includes('guess-number') && (
                <div className="ml-8 pt-2 border-t space-y-3">
                  <div>
                    <Label htmlFor="guess-number-seconds" className="text-sm">Time Limit (seconds)</Label>
                    <div className="flex items-center gap-3 mt-1">
                      <Input
                        id="guess-number-seconds"
                        type="number"
                        min="1"
                        value={roundSettings.guessNumberSeconds}
                        onChange={(e) =>
                          setRoundSettings({
                            ...roundSettings,
                            guessNumberSeconds: parseInt(e.target.value) || 30,
                          })
                        }
                        className="w-24"
                      />
                      <span className="text-sm text-gray-500">
                        (default: 30)
                      </span>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="guess-questions" className="text-sm">Number of Questions</Label>
                    <div className="flex items-center gap-3 mt-1">
                      <Input
                        id="guess-questions"
                        type="number"
                        min="5"
                        max="20"
                        value={roundSettings.guessNumberQuestions}
                        onChange={(e) =>
                          setRoundSettings({
                            ...roundSettings,
                            guessNumberQuestions: parseInt(e.target.value) || 10,
                          })
                        }
                        className="w-24"
                      />
                      <span className="text-sm text-gray-500">
                        (5-20 questions, default: 10)
                      </span>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="guess-difficulty" className="text-sm">Difficulty Level</Label>
                    <Select
                      value={roundSettings.guessNumberDifficulty || 'medium-hard'}
                      onValueChange={(value) =>
                        setRoundSettings({
                          ...roundSettings,
                          guessNumberDifficulty: value as Difficulty,
                        })
                      }
                    >
                      <SelectTrigger id="guess-difficulty" className="w-full mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="medium-hard">Mid-Hard (Default)</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>

            {/* Blind Draw */}
            <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-3 mb-3">
                <Checkbox
                  id="blind-draw"
                  checked={selectedRounds.includes('blind-draw')}
                  onCheckedChange={() => toggleRound('blind-draw')}
                />
                <div className="flex-1">
                  <label
                    htmlFor="blind-draw"
                    className="font-medium cursor-pointer text-lg"
                  >
                    🎨 Blind Draw
                  </label>
                  <p className="text-sm text-gray-500">Guess the drawing</p>
                </div>
              </div>
              {selectedRounds.includes('blind-draw') && (
                <div className="ml-8 pt-2 border-t space-y-3">
                  <div>
                    <Label htmlFor="blind-draw-seconds" className="text-sm">Time Limit (seconds)</Label>
                    <div className="flex items-center gap-3 mt-1">
                      <Input
                        id="blind-draw-seconds"
                        type="number"
                        min="1"
                        value={roundSettings.blindDrawSeconds}
                        onChange={(e) =>
                          setRoundSettings({
                            ...roundSettings,
                            blindDrawSeconds: parseInt(e.target.value) || 60,
                          })
                        }
                        className="w-24"
                      />
                      <span className="text-sm text-gray-500">
                        (default: 60)
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Dump Charades */}
            <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-3 mb-3">
                <Checkbox
                  id="dump-charades"
                  checked={selectedRounds.includes('dump-charades')}
                  onCheckedChange={() => toggleRound('dump-charades')}
                />
                <div className="flex-1">
                  <label
                    htmlFor="dump-charades"
                    className="font-medium cursor-pointer text-lg"
                  >
                    🎭 Dump Charades
                  </label>
                  <p className="text-sm text-gray-500">Act it out without words</p>
                </div>
              </div>
              {selectedRounds.includes('dump-charades') && (
                <div className="ml-8 pt-2 border-t space-y-3">
                  <div>
                    <Label htmlFor="dump-charades-seconds" className="text-sm">Time Limit (seconds)</Label>
                    <div className="flex items-center gap-3 mt-1">
                      <Input
                        id="dump-charades-seconds"
                        type="number"
                        min="1"
                        value={roundSettings.dumpCharadesSeconds}
                        onChange={(e) =>
                          setRoundSettings({
                            ...roundSettings,
                            dumpCharadesSeconds: parseInt(e.target.value) || 60,
                          })
                        }
                        className="w-24"
                      />
                      <span className="text-sm text-gray-500">
                        (default: 60)
                      </span>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="dump-charades-category" className="text-sm">Category</Label>
                    <Select
                      value={
                        DUMP_CHARADES_CATEGORIES.some(option => option.value === (roundSettings.dumpCharadesCategory || 'general'))
                          ? (roundSettings.dumpCharadesCategory || 'general')
                          : 'custom'
                      }
                      onValueChange={(value) => {
                        if (value === 'custom') {
                          setRoundSettings({
                            ...roundSettings,
                            dumpCharadesCategory: 'custom',
                          });
                          return;
                        }
                        setRoundSettings({
                          ...roundSettings,
                          dumpCharadesCategory: value,
                        });
                      }}
                    >
                      <SelectTrigger id="dump-charades-category" className="w-full mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DUMP_CHARADES_CATEGORIES.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                        <SelectItem value="custom">✨ Custom</SelectItem>
                      </SelectContent>
                    </Select>
                    {!(DUMP_CHARADES_CATEGORIES.some(option => option.value === (roundSettings.dumpCharadesCategory || 'general'))) && (
                      <Input
                        value={roundSettings.dumpCharadesCategory === 'custom' ? '' : (roundSettings.dumpCharadesCategory || '')}
                        onChange={(event) =>
                          setRoundSettings({
                            ...roundSettings,
                            dumpCharadesCategory: event.target.value,
                          })
                        }
                        placeholder="Enter custom category"
                        className="mt-2"
                      />
                    )}
                  </div>
                  <div>
                    <Label htmlFor="dump-charades-difficulty" className="text-sm">Difficulty Level</Label>
                    <Select
                      value={roundSettings.dumpCharadesDifficulty || 'medium-hard'}
                      onValueChange={(value) =>
                        setRoundSettings({
                          ...roundSettings,
                          dumpCharadesDifficulty: value as Difficulty,
                        })
                      }
                    >
                      <SelectTrigger id="dump-charades-difficulty" className="w-full mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="medium-hard">Mid-Hard (Default)</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {mode === 'online' ? (
          <div className="space-y-3">
            <Button
              onClick={handleStartGame}
              size="lg"
              variant="outline"
              className="w-full"
              disabled={submitting || !gameCode || creatingOnline}
            >
              {creatingOnline
                ? 'Generating Game Code...'
                : submitting
                ? 'Generating Questions...'
                : 'Continue to Question Review'}
            </Button>
          </div>
        ) : (
          <Button
            onClick={handleStartGame}
            size="lg"
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            disabled={submitting}
          >
            {submitting ? 'Generating...' : 'Start Game Show'}
          </Button>
        )}
      </div>
    </div>
  );
}