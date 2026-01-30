# Overview

Game Show is a multi-round party game with a host screen and player phones. The
host controls timing, scoring, and round flow, while players interact via buzz
or round-specific actions. The app is optimized for live, in-room play with a
single host display.

## Personas

- **Host**: Creates and runs the game, selects winners, manages scoring.
- **Player**: Joins via game code, participates in rounds, buzzes in.

## Goals

- Provide a polished, easy-to-run game night experience.
- Make rounds quick to configure, understand, and play.
- Keep the UI usable on mobile devices.

## Key Features

- Host + player modes for in-room play
- Round-based gameplay with configurable settings
- Real-time synchronization with fallback polling
- Team scoring with round-specific rules
- LLM or local question generation

## Core Game Flow

1. Host creates a game and configures teams, rounds, and settings.
2. Players join with a short game code and pick a team.
3. Questions/words are generated or loaded from local pools.
4. Each round is played in order with host controls.
5. Final screen shows winner, handles ties, and shows a round breakdown.

## Primary User Actions

Host:
- Create game and configure rounds
- Start each round and control timing
- Mark answers correct/incorrect
- Choose winners where applicable

Player:
- Join a game and select a team
- Buzz in on trivia rounds
- Follow round-specific prompts
