<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureFitnessRole
{
    public function handle(Request $request, Closure $next, string $role): Response
    {
        $currentRole = $request->user()?->role ?? 'coach';
        $allowed = $role === 'coach'
            ? in_array($currentRole, ['coach', 'admin'], true)
            : $currentRole === $role;

        abort_unless($allowed, 403);

        return $next($request);
    }
}
