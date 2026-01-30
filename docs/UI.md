# UI Documentation

## Global Concepts

- **Host UI**: Large display view with controls and round flow.
- **Player UI**: Mobile-first view with limited controls.
- **Rules screen**: Shown at start of each round for host and players.
- **Settings overlay**: Host menu for game code, copy, skip, reset, and players list.

## Entry Screens

### Home

- Title, branding icon, and mode selection cards
- Two primary options: Host Mode, Player Mode

### Host Mode

- Options: start new game, rejoin host
- Leads to setup and question review

### Player Mode

- Enter game code
- Enter player name
- Select team

## Host Flow Screens

### Game Setup

- Choose rounds (checkbox list)
- Configure per-round settings (timers, categories, difficulty)
- Connect 4 has themed column configuration
- Dump Charades has category + difficulty settings

### Question Review

- Lists generated questions per round
- Per-question difficulty dropdown for Trivia Buzz, Lightning, Connect 4
- Regenerate button per question
- Start Game button to launch host view

### Host In-Game Header

- Title and round info
- Scoreboard
- Settings icon opens overlay:
  - Game code (small)
  - Copy code
  - Skip round
  - Reset game
  - Show players list with online status

### Round Rules (Host)

- Round title, icon, and rules list
- Start Round button
- Skip Round (optional)

### Final Screen

- Winner or tie display
- Final scoreboard
- Round-by-round score breakdown

## Player Flow Screens

### Lobby

- Displays team and waiting status
- Rules shown before rounds begin

### Round View

- Compact layout with round icon and question content
- Timers in a compact badge
- Buzz button pinned to bottom on mobile for Trivia Buzz

## Round-Specific UI (Host + Player)

### Trivia Buzz

Host:
- Question display, answer control, buzz status
- Shows first buzzed player
- Correct / Wrong / Steal controls

Player:
- Buzz button (fixed to bottom on mobile)
- Status card when a team has buzzed
- “Too late” toast when buzz rejected

### Lightning Round

Host:
- Timer, question, correct/wrong/pass buttons
- Team turn pill and progress indicators

Player:
- Shows question and time remaining
- Progress counter uses total questions before start, then 1/X

### Quick Build

Host:
- Win criteria select, start build, active timer
- Post-time winner selection buttons

Player:
- Build instructions and timer
- Winner display when complete

### Connect 4

Host:
- Grid board, categories, and selected squares
- “Pick new theme” for steals

Player:
- Current question and board state
- Team turn indicator

### Guess the Number

Host:
- Prompt, answer reveal, manual winner selection (offline)
- Winner controls even when timer is running

Player:
- Prompt display and countdown

### Blind Draw

Host:
- Timer, current drawer
- Word hidden from host (shown only to drawer)

Player:
- Drawer sees word, others see a waiting state

### Dump Charades

Host:
- Actor selection, timer, judge controls
- Word shown only to actor

Player:
- Actor sees word and timer
- Non-actor sees “actor is performing”
