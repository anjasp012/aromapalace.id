<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class LocaleController extends Controller
{
    /**
     * Switch application locale between Indonesian and English.
     */
    public function setLocale(Request $request, ?string $lang = null): RedirectResponse
    {
        $locale = $lang ?? $request->input('locale', 'id');

        if (! in_array($locale, ['id', 'en'], true)) {
            $locale = 'id';
        }

        $request->session()->put('locale', $locale);
        cookie()->queue(cookie()->forever('locale', $locale));

        return back();
    }
}
