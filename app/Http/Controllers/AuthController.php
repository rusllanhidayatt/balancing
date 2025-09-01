<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class AuthController extends Controller
{
    public function showLogin()
    {
        return view('login');
    }

    public function login(Request $request)
    {
        $request->validate([
            'password' => 'required',
        ]);

        if ($request->password === env('APP_KEYWORD')) {
            session(['auth' => true]);
            return redirect('/');
        }

        return back()->withErrors(['password' => 'Kata kunci salah!']);
    }

    public function logout()
    {
        session()->forget('auth');
        return redirect('/login');
    }
}
