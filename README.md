# FitnessOS

FitnessOS is a Laravel application with a React frontend. The public site and role-based coach and client apps live in `resources/js/fitnessos`; the former standalone frontend folder is no longer needed. Laravel handles authentication, persistence, authorization, and the JSON endpoints used by the frontend.

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
npm install
```

On Windows PowerShell, use `Copy-Item .env.example .env` instead of `cp .env.example .env`. The example environment uses SQLite; Laravel creates `database/database.sqlite` when needed. Set `APP_URL` in `.env` if you use a different local address.

Start the Laravel server and Vite in separate terminals:

```bash
php artisan serve
```

```bash
npm run dev
```

Then open `http://localhost:8000`. For a built frontend, run `npm run build` and serve Laravel without the Vite dev server. `composer run dev` is also available to start Laravel, the queue listener, and Vite together.

## App structure

| Path | Purpose |
| --- | --- |
| `resources/js/fitnessos` | Public site, coach dashboard, and client app (React and TanStack Router) |
| `resources/js/pages/auth` | Registration, login, and other Laravel Fortify screens (Inertia) |
| `resources/views/fitnessos.blade.php` | HTML entry point for the FitnessOS frontend |
| `routes/web.php` | Public pages, role-protected app routes, and FitnessOS endpoints |
| `app/Http/Controllers/FitnessOs*` | Applications, clients, check-ins, messages, and portal routing |
| `database/migrations` | Account roles and FitnessOS data tables |

Public pages include `/`, `/about`, `/coaching`, `/transformations`, `/resources`, `/contact`, and `/apply`. Registration and login are at `/register` and `/login`. After authentication, `/portal` sends coaches to `/dashboard` and clients to `/app`. The corresponding routes and JSON endpoints require authentication and the appropriate account role.

New self-registered accounts default to the `coach` role. Coaches can create client accounts from the dashboard. With the default `MAIL_MAILER=log`, client setup links are written to `storage/logs/laravel.log`; configure a real mailer before sending invitations outside local development.

The public application and contact forms, lead management, client accounts, check-ins, and messages use Laravel endpoints. Some other imported screens still display sample content and need backend integration before launch. See `resources/js/fitnessos/routes/README.md` for routing notes.

## Checks

```bash
php artisan test
npm run types:check
npm run build
```

The generated TanStack route tree at `resources/js/fitnessos/routeTree.gen.ts` is maintained by the router plugin; do not edit it manually.
