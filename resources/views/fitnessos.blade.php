<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="fitnessos-authenticated" content="{{ auth()->check() ? '1' : '0' }}">
        <meta name="fitnessos-role" content="{{ auth()->user()?->role ?? 'coach' }}">
        <meta name="fitnessos-user-name" content="{{ auth()->user()?->name ?? '' }}">
        <meta name="fitnessos-user-email" content="{{ auth()->user()?->email ?? '' }}">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <title>FitnessOS</title>
        <link rel="icon" href="/fitnessos-favicon.ico" type="image/x-icon">
        @viteReactRefresh
        @vite(['resources/css/fitnessos.css', 'resources/js/fitnessos/main.tsx'])
    </head>
    <body>
        <div id="fitnessos"></div>
        @auth
            <form id="fitnessos-logout" method="POST" action="{{ route('logout') }}" hidden>
                @csrf
            </form>
        @endauth
    </body>
</html>
