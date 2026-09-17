<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class FitnessOsPortalController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $destination = ($request->user()->role ?? 'coach') === 'client' ? '/app' : '/dashboard';

        return Inertia::location($destination);
    }
}
