# BB Scope Watcher

Watches Bugcrowd and YesWeHack program scopes for changes (new programs, new
or removed in-scope targets) and sends a Telegram alert when something
changes. Runs on a schedule via GitHub Actions, no server needed.

## Setup

1. Create a Telegram bot:
   - Message [@BotFather](https://t.me/BotFather) on Telegram, run `/newbot`,
     follow the prompts. You'll get a bot token like `123456:ABC-DEF...`.
   - Message your new bot anything (so it can message you back), then visit
     `https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates` in a browser to
     find your `chat.id`.

2. In this repo, go to Settings → Secrets and variables → Actions, and add:
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_CHAT_ID`

3. The workflow (`.github/workflows/bb-scope-watcher.yml`) runs every 30
   minutes automatically. You can also trigger it manually from the Actions
   tab ("Run workflow").

## How it works

- Pulls daily-refreshed public scope data from
  [bounty-targets-data](https://github.com/arkadiyt/bounty-targets-data),
  a community mirror of Bugcrowd and YesWeHack program scopes.
- Compares against the last saved snapshot (`data/snapshot.json`, committed
  back to the repo each run).
- On the first run there's nothing to diff against, so it just saves a
  baseline silently.
- Every run after that sends a Telegram message listing new programs, and
  added/removed in-scope targets on existing programs.

## Notes

- `bounty-targets-data` itself refreshes roughly daily, so this won't catch
  changes faster than that upstream source does — the 30 min schedule here
  just means you see it soon after it lands, not that you're polling the
  platforms directly.
- No credentials needed for Bugcrowd/YesWeHack since this only reads public
  scope data.
