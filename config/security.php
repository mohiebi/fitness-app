<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Content Security Policy
    |--------------------------------------------------------------------------
    |
    | "enforce" blocks anything the policy doesn't allow, "report-only" only
    | lets the browser console tell you what it would have blocked, "off"
    | sends no policy. It is off outside production because the Vite dev
    | server serves scripts from another port.
    |
    */

    'csp' => env('SECURITY_CSP', env('APP_ENV') === 'production' ? 'enforce' : 'off'),

    // Sites the pages may load pictures from, besides this one. The sample
    // screens use these two.
    'image_hosts' => ['https://images.unsplash.com', 'https://i.pravatar.cc'],

    // Behind a load balancer or reverse proxy, trust its forwarded headers
    // (scheme, host, client IP): "*" or a comma-separated list of addresses.
    // Without this, an HTTPS-terminating proxy makes the app think it is on
    // plain HTTP, which breaks secure cookies and generated links.
    'trusted_proxies' => env('TRUSTED_PROXIES'),

    // Tell browsers to only ever use HTTPS for this site (once it is served over it).
    'hsts' => (bool) env('SECURITY_HSTS', env('APP_ENV') === 'production'),

];
