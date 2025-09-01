<?php

namespace App\Http\Middleware;

use Closure;

class CheckPasswordMiddleware
{
    public function handle($request, Closure $next)
    {
        if (!session('auth')) {
            return redirect('/login');
        }
        return $next($request);
    }
}
