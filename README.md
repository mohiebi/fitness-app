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

The seeded accounts and their shared development password are listed at the top of `database/seeders/MarketplaceDemoSeeder.php`.

Start the Laravel server and Vite in separate terminals:

```bash
php artisan serve
```

```bash
npm run dev
```

Then open `http://localhost:8000`. For a built frontend, run `npm run build` and serve Laravel without the Vite dev server. `composer run dev` is also available to start Laravel, the queue listener, and Vite together.

## App structure

| Path                                   | Purpose                                                                                          |
| -------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `resources/js/fitnessos`               | Public site, coach directory, coach dashboard, and trainee app (React and TanStack Router)       |
| `resources/js/fitnessos/locales/fa.ts` | Persian translations, keyed by the English text passed to `t()`                                  |
| `resources/js/pages/auth`              | Registration, login, and other Laravel Fortify screens (Inertia)                                 |
| `resources/views/fitnessos.blade.php`  | HTML entry point for the FitnessOS frontend                                                      |
| `routes/web.php`                       | Public pages, role-protected app routes, and FitnessOS endpoints                                 |
| `app/Services/CoachingLifecycle.php`   | The only place coachings change state (request, accept, decline, withdraw, end)                  |
| `app/Http/Controllers`                 | Coach directory and profiles, coachings, trainee intake, check-ins, messages, and portal routing |
| `database/migrations`                  | Account roles, coach and trainee profiles, coachings, and FitnessOS data tables                  |
| `lang/fa`, `lang/fa.json`              | Persian validation and server messages                                                           |

Public pages include `/`, `/coaches`, `/coaches/{slug}`, `/about`, `/resources`, and `/contact`. The old single-coach pages `/apply`, `/coaching`, and `/transformations` redirect to `/coaches`. Registration and login are at `/register` and `/login`. After authentication, `/portal` sends coaches to `/dashboard` and trainees to `/app`. The corresponding routes and JSON endpoints require authentication and the appropriate account role.

### Coaches and trainees

- People choose an account type when they register. Trainees are stored with the `client` role. A visitor who starts from a coach's page (`/register?role=client&coach={slug}`) returns to that coach after signing up, with the request dialog open.
- Coaches edit their public profile at `/dashboard/profile` and publish it to appear in the directory. They can close their waitlist or set a maximum number of trainees.
- A trainee has at most one active coaching and one pending request. When a coach accepts a request from a trainee who already has a coach, the previous coaching ends with the reason `switched`. Either side can end a coaching with a reason.
- `users.coach_id` always points to the trainee's current coach. Coaches only see current trainees. Trainees keep their intake profile and their full check-in history across coaches.
- Coaches can still add a trainee they already work with from the dashboard; that starts an active coaching directly. With the default `MAIL_MAILER=log`, account setup links are written to `storage/logs/laravel.log`; configure a real mailer before sending invitations outside local development.
- After checking a coach's certifications, mark the profile as verified with `php artisan fitnessos:verify-coach coach@example.com` (add `--revoke` to remove the badge).
- Platform contact messages at `/fitnessos/contact-messages` are only available to the `admin` role.

### Language

`APP_LOCALE=fa` renders pages right-to-left with the self-hosted Vazirmatn font, Jalali dates, and Persian digits. Set `APP_LOCALE=en` for English. New interface text should go through `t('English text')` with a Persian entry in `resources/js/fitnessos/locales/fa.ts`, and should use logical Tailwind classes (`ms-`, `pe-`, `start-`, `end-`) so it mirrors correctly. Some older screens (workouts, nutrition, payments, reports, and the AI assistant) still show English sample content and need backend integration before launch. See `resources/js/fitnessos/routes/README.md` for routing notes.

## Checks

```bash
php artisan test
npm run types:check
npm run build
```

The generated TanStack route tree at `resources/js/fitnessos/routeTree.gen.ts` is maintained by the router plugin; do not edit it manually.
