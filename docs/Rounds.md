# Rounds

Each round has a host experience and a player experience. Round logic is stored
in `GameState.round_data` with a per-round key.

## Trivia Buzz

**Phases**
- Question live
- Buzz in
- Answer timer (5 seconds)
- Steal (optional)
- Reveal answer

**Rules**
- Only the first buzz is accepted
- Host marks correct/incorrect
- Incorrect opens a steal window

**Scoring**
- Correct: +100
- Incorrect: -50
- Steal correct: +100
- Steal incorrect: -50

## Lightning Round

**Phases**
- Team turn starts
- Rapid Q/A until time expires or questions exhausted
- Next team, repeat

**Rules**
- 10 questions per team
- Pass moves current question to the back of the queue

**Scoring**
- Correct: +50

## Quick Build

**Phases**
- Host selects win criteria
- Timer runs while teams build
- Host selects winner or tie

**Rules**
- Physical build based on criteria
- All teams build simultaneously

**Scoring**
- Winner: +300
- Tie: +150 each

## Connect 4 Trivia

**Phases**
- Host selects a column and square
- Question shown
- Team answers, steal if wrong

**Rules**
- Column themes are configured in setup
- Difficulty can be set per column

**Scoring**
- Points vary by grid value (e.g., 100/200/300/400)
- Steal uses same points

## Guess the Number

**Phases**
- Prompt shown with timer
- Teams submit answers
- Host picks winner

**Rules**
- Closest answer wins
- Host can pick winner manually in offline mode

**Scoring**
- Winner: +200

## Blind Draw

**Phases**
- Drawer assigned
- Word shown only to drawer
- Timer runs for drawing and guessing

**Rules**
- Word count scales with player count
- Difficulty affects word list

## Dump Charades

**Phases**
- Actor selected
- Word shown only to actor
- Timer runs while team guesses
- Host judges guessed/missed

**Rules**
- Category and difficulty are configurable
- Only the actor sees the word
