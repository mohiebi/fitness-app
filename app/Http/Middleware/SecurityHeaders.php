<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Vite;
use Symfony\Component\HttpFoundation\Response;

/**
 * Browser-side protections sent with every page: no framing (clickjacking),
 * no content-type guessing, a limited referrer, locked-down device
 * permissions, HTTPS-only once on HTTPS, and a Content Security Policy so
 * an injected script wouldn't run. Scripts are allowed only from this site
 * and from tags carrying this response's nonce.
 */
class SecurityHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        $csp = (string) config('security.csp');

        // Vite adds the nonce to the script tags it prints, so it has to be
        // chosen before the view renders.
        $nonce = $csp === 'off' ? null : Vite::useCspNonce();

        $response = $next($request);

        $response->headers->add([
            'X-Content-Type-Options' => 'nosniff',
            'X-Frame-Options' => 'DENY',
            'Referrer-Policy' => 'strict-origin-when-cross-origin',
            // Passkeys need these two for this site; nothing else is allowed.
            'Permissions-Policy' => 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), publickey-credentials-get=(self), publickey-credentials-create=(self)',
            'Cross-Origin-Opener-Policy' => 'same-origin',
        ]);

        if ((bool) config('security.hsts') && $request->isSecure()) {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        }

        if ($nonce !== null) {
            $response->headers->set(
                $csp === 'report-only' ? 'Content-Security-Policy-Report-Only' : 'Content-Security-Policy',
                $this->policy($nonce),
            );
        }

        return $response;
    }

    private function policy(string $nonce): string
    {
        $images = implode(' ', (array) config('security.image_hosts'));

        return implode('; ', [
            "default-src 'self'",
            "script-src 'self' 'nonce-{$nonce}'",
            // React and the chart library set inline styles; English pages load Google Fonts.
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' data: https://fonts.gstatic.com",
            "img-src 'self' data: blob: {$images}",
            "connect-src 'self'",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "frame-ancestors 'none'",
        ]);
    }
}
