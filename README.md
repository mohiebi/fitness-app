# FitnessOS

FitnessOS is a coaching platform built with Laravel and React. Trainees browse public coach profiles, request a coach, and then follow their plan, send weekly check-ins, and chat with that coach. Coaches manage requests, trainees, check-ins, and messages from a dashboard. Trainees can switch or stop coaching at any time.

The public site, coach dashboard, and trainee app live in `resources/js/fitnessos`. Laravel handles authentication, persistence, authorization, and the JSON endpoints used by the frontend. The interface is Persian and right-to-left by default.

## Requirements

- PHP 8.3 or newer and Composer
- Node.js and npm
- SQLite (the default) or another database supported by Laravel

PHP must be available on your command line when running the Vite build because the Laravel Wayfinder plugin generates route helpers from the Laravel application.

## Local setup

Run these commands from the project root:

```bash
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan storage:link
npm install
```

On Windows PowerShell, use `Copy-Item .env.example .env` instead of `cp .env.example .env`. The example environment uses SQLite; Laravel creates `database/database.sqlite` when needed. Set `APP_URL` in `.env` if you use a different local address. `storage:link` makes uploaded coach photos public.

To try the marketplace with sample Persian coaches and trainees, run:

```bash
php artisan db:seed --class=MarketplaceDemoSeeder
```

The seeded accounts and their shared development password are listed at the top of `database/seeders/MarketplaceDemoSeeder.php`. The seeder also gives one trainee an active plan with two logged sessions.

Start the Laravel server and Vite in separate terminals:

```bash
php artisan serve
```

```bash
npm run dev
```

Then open `http://localhost:8000`. For a built frontend, run `npm run build` and serve Laravel without the Vite dev server. `composer run dev` is also available to start Laravel, the queue listener, and Vite together.

## App structure

| Path                                   | Purpose                                                                                                                                  |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `resources/js/fitnessos`               | Public site, coach directory, coach dashboard, and trainee app (React and TanStack Router)                                               |
| `resources/js/fitnessos/locales/fa.ts` | Persian translations, keyed by the English text passed to `t()`                                                                          |
| `resources/js/pages/auth`              | Registration, login, and other Laravel Fortify screens (Inertia)                                                                         |
| `resources/views/fitnessos.blade.php`  | HTML entry point for the FitnessOS frontend                                                                                              |
| `routes/web.php`                       | Public pages, role-protected app routes, and FitnessOS endpoints                                                                         |
| `app/Services/CoachingLifecycle.php`   | The only place coachings change state (request, accept, decline, withdraw, end)                                                          |
| `app/Services/TrainingPlans.php`       | Plan creation, copying from templates, saving, activation, and adherence                                                                 |
| `app/Http/Controllers`                 | Coach directory and profiles, coachings, trainee intake, workout plans, exercises, workout logs, check-ins, messages, and portal routing |
| `database/migrations`                  | Account roles, coach and trainee profiles, coachings, exercises, plans, workout logs, and FitnessOS data tables                          |
| `lang/fa`, `lang/fa.json`              | Persian validation and server messages                                                                                                   |

Public pages include `/`, `/coaches`, `/coaches/{slug}`, `/about`, `/resources`, and `/contact`. The old single-coach pages `/apply`, `/coaching`, and `/transformations` redirect to `/coaches`. Registration and login are at `/register` and `/login`. After authentication, `/portal` sends coaches to `/dashboard` and trainees to `/app`. The corresponding routes and JSON endpoints require authentication and the appropriate account role.

### Coaches and trainees

- People choose an account type when they register. Trainees are stored with the `client` role. A visitor who starts from a coach's page (`/register?role=client&coach={slug}`) returns to that coach after signing up, with the request dialog open.
- Coaches edit their public profile at `/dashboard/profile` and publish it to appear in the directory. They can close their waitlist or set a maximum number of trainees.
- A trainee has at most one active coaching and one pending request. When a coach accepts a request from a trainee who already has a coach, the previous coaching ends with the reason `switched`. Either side can end a coaching with a reason.
- `users.coach_id` always points to the trainee's current coach. Coaches only see current trainees. Trainees keep their intake profile and their full check-in history across coaches.
- Coaches can still add a trainee they already work with from the dashboard; that starts an active coaching directly. With the default `MAIL_MAILER=log`, account setup links are written to `storage/logs/laravel.log`; configure a real mailer before sending invitations outside local development.
- After checking a coach's certifications, mark the profile as verified with `php artisan fitnessos:verify-coach coach@example.com` (add `--revoke` to remove the badge).
- Platform contact messages at `/fitnessos/contact-messages` are only available to the `admin` role.

### Training plans

- The migration ships a shared exercise library with Persian and English names. Coaches can add their own exercises, which only they see.
- A plan belongs to a coach and, optionally, a trainee. A plan without a trainee is a template. Coaches build plans at `/dashboard/workouts`, can start a trainee's plan from a template, and activate it. A trainee has one active plan; activating a new one archives the previous one.
- Saving a plan updates days and exercises in place when they keep their ids, so logged sessions stay linked to them.
- Trainees follow the active plan at `/app/workout` and log each set. Sessions store a copy of the exercise names, so history survives plan edits and deletion, and sessions stay with the trainee after coaching ends.
- Adherence compares sessions logged in each rolling 7-day window with the number of training days in the active plan. Coaches see it, with recent sessions, in the Training tab of a trainee's page.

### AI assistant (coaches only)

The assistant drafts chat replies, check-in feedback and training plans for a coach's current trainees. Trainees never interact with it, and nothing it writes reaches a trainee until the coach approves it.

- It talks to any **OpenAI-compatible endpoint** (the default, `AI_PROVIDER=openai`). Set `OPENAI_API_KEY` to turn it on, `OPENAI_MODEL` (default `gpt-4o`), and `OPENAI_BASE_URL` (default `https://api.openai.com/v1`) or `AI_BASE_URL` to point at a gateway, for example when the server can't reach OpenAI directly. Replies are constrained with a JSON schema (structured outputs). For a gateway that only supports plain JSON mode set `OPENAI_RESPONSE_FORMAT=json_object`. Without a key the assistant is hidden and the rest of the app works as usual.
- `AI_PROVIDER=anthropic` with `ANTHROPIC_API_KEY` uses Claude through the official Anthropic PHP SDK instead (`AI_MODEL`, default `claude-opus-5`).
- `AI_DAILY_DRAFTS_PER_COACH` (default 60) caps how many drafts each coach can request per day.
- Coaches review drafts at `/dashboard/ai`, or use **Draft with AI** in chat, on the check-in review page and on a trainee's Training tab. An inline draft is sent only when the coach presses send, with their edits.
- An approved plan draft becomes a draft plan the coach still edits and activates. Plan drafts only use exercises from the coach's library.
- The model sees a briefing with the trainee's first name, intake, active plan, and recent check-ins, workouts and chat, and nothing else (no email or account details). Every draft, including failures, is stored in `ai_drafts` with the model and token counts.
- The code lives in `app/Services/Ai`: `CoachAssistant` handles drafting, approval and limits, `TraineeBriefing` builds the context, and `OpenAiDraftModel` (or `ClaudeDraftModel`) makes the API call. Tests replace the `DraftModel` binding with a fake, so they never call the API.

### Coach subscriptions and Telegram payments

- Coaches pay FitnessOS for 30-day periods. Plans, prices (toman) and limits live in `config/fitnessos.php`: Starter (up to 10 active trainees) and Pro (unlimited), with prices set by `FITNESSOS_STARTER_PRICE` and `FITNESSOS_PRO_PRICE`. New coaches get a trial (`FITNESSOS_TRIAL_DAYS`, default 14) on Pro.
- A coach whose trial or paid period has ended is hidden from the directory and can't accept or add new trainees. Their current trainees keep working with them. Coaches manage this at `/dashboard/billing`, and the dashboard warns five days before the end.
- Payments go through a Telegram bot, with this app as the bot's backend:
    1. The coach taps **Pay with Telegram**, and the app creates a pending payment and opens `t.me/<bot>?start=pay_<reference>`.
    2. The bot replies with the amount and the card to transfer to (`PAYMENT_CARD_NUMBER`, `PAYMENT_CARD_HOLDER`).
    3. The coach sends a photo or PDF of the receipt, and the bot forwards it to the admin chat (`TELEGRAM_ADMIN_CHAT_ID`) with **Approve** and **Reject** buttons.
    4. Approving extends the subscription once and tells the coach in Telegram and in the app.
- Setup: create a bot with @BotFather. Set `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME`, a random `TELEGRAM_WEBHOOK_SECRET` and the admin chat id. Then run `php artisan migrate` and `php artisan fitnessos:telegram:webhook`, which needs a public HTTPS `APP_URL` (or pass the site address, or set `TELEGRAM_WEBHOOK_DOMAIN`). The bot runs on [defstudio/telegraph](https://docs.defstudio.it/telegraph), which owns the webhook at `/telegraph/{bot token}/webhook`, the Bot API client and the keyboards; the handler in `app/Telegram/CoachWebhookHandler.php` passes each update to the app's own bot. The webhook only accepts requests carrying the secret token (Telegraph doesn't check it, so `VerifyTelegramSecret` does).
- Without the bot, billing tells coaches to contact support. `php artisan fitnessos:payments:confirm <reference>` confirms a payment checked by hand, and `php artisan fitnessos:subscription:grant <email> <plan> --days=30` records a manual payment.

### The Telegram coach bot

The same bot that takes payments is a full assistant for coaches, so they can run their coaching from a phone. Trainees never use it; they use the web app.

- **Connecting:** a coach opens Settings → Integrations and taps **Connect Telegram**. That opens `t.me/<bot>?start=link_<token>`; pressing Start stores the chat against their account. The token is random, stored hashed, works once and expires after 15 minutes. `/unlink` in the bot, or **Disconnect** in the dashboard, undoes it.
- **Menu and commands:** a pinned menu (and matching slash commands) opens `/today`, `/requests`, `/messages`, `/trainees`, `/checkins`, `/drafts`, `/billing` and `/settings`.
    - **Requests:** the trainee's intake and message, with Accept and Decline on the message. It uses the same `CoachingLifecycle` as the dashboard, so limits and subscription checks apply.
    - **Messages and check-ins:** who is waiting for an answer, the recent conversation, and replying by typing. Check-in feedback is sent as a chat message and marks the check-in reviewed. A pending reply is dropped by `/cancel`, any menu command or after 30 minutes.
    - **Trainees:** a card with goal, plan, sessions this week, latest check-in and message, and the active plan day by day.
    - **AI drafts:** replies, check-in feedback and plans can be drafted from buttons. The coach sees the draft with **Send**, **Edit**, **Redo with a note** and **Discard** (plans: **Save as draft plan** or **Save and activate**). Nothing reaches a trainee before that tap. Drafting runs after the webhook has answered, so Telegram never retries it.
    - **Subscription:** plan, trial or paid period and trainee count, and renewing through the card-transfer flow in the same chat.
    - **Settings:** switch messages, requests, check-ins, billing, reviews and the morning summary on or off, and pick the summary hour. The same switches are in the dashboard.
- **Push:** notices go to the coach's chat with action buttons: an accept/decline pair on a request, reply and AI-draft buttons on a message (every message is pushed even though the app keeps one unread notice per conversation), read and AI-feedback buttons on a check-in, and the subscription screen on payment and renewal notices.
- **Morning summary:** `php artisan fitnessos:telegram:digest` runs hourly from the scheduler and messages each coach at the hour they chose, only when something needs them. `TELEGRAM_TIMEZONE` (default `Asia/Tehran`) is the clock those hours mean; `--force` sends to everyone now.
- **Safety:** every button carries only an id, and each action re-checks that the record belongs to the linked coach, so made-up data reaches nothing. The webhook drops an update Telegram delivers twice, ignores group chats, and users who have not connected are only told how to connect (or to pay).
- **Setup:** after the payment-bot setup above, run `php artisan fitnessos:telegram:webhook` again to also register the command list. The bot always speaks Persian (`TELEGRAM_LOCALE`, default `fa`), whatever language the website is set to; notices the website pushes to Telegram use the website's language, so keep `APP_LOCALE=fa`. Telegram buttons that open dashboard pages only appear on an HTTPS `APP_URL`.
- The code lives in `app/Services/Telegram`: `TelegramBot` routes updates, `CoachBot` routes coach messages and button taps to one class per part in `Screens/`, `TelegramLinks` handles connecting, `TelegramPush` and `Notifications/Channels/TelegramChannel` send notices, and `TelegramDigest` sends the summary. `CoachDesk` counts what is waiting.

### Reviews

Trainees can rate a coach from 1 to 5 stars and leave a comment after training together for at least 14 days (`review_min_days`), one review per coaching. Reviews show the reviewer's first name only. Coaches can reply from their public profile editor, and `php artisan fitnessos:reviews:hide <id>` (with `--restore` to undo) hides a review.

### Notifications

People get in-app notifications, via the bell in the dashboard and app, for coaching requests and decisions, ended coachings, new messages, check-ins, new plans, payments, reviews and subscription reminders. Requests, acceptances, new plans, payment results and subscription reminders are also emailed, and coaches who connected Telegram get them there too. The reminder runs from the scheduler (`php artisan schedule:work` locally, or a cron entry for `php artisan schedule:run` in production).

### Language

`APP_LOCALE=fa` renders pages right-to-left with the self-hosted Vazirmatn font, Jalali dates, and Persian digits. Set `APP_LOCALE=en` for English. New interface text should go through `t('English text')` with a Persian entry in `resources/js/fitnessos/locales/fa.ts`, and should use logical Tailwind classes (`ms-`, `pe-`, `start-`, `end-`) so it mirrors correctly. Some older screens (nutrition, payments and reports) still show English sample content and need backend integration before launch. See `resources/js/fitnessos/routes/README.md` for routing notes.

## Checks

```bash
php artisan test
npm run types:check
npm run build
```

The generated TanStack route tree at `resources/js/fitnessos/routeTree.gen.ts` is maintained by the router plugin; do not edit it manually.
