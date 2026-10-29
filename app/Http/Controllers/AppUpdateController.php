<?php

namespace App\Http\Controllers;

use App\Support\AppUpdatePolicy;
use Illuminate\Http\JsonResponse;

class AppUpdateController extends Controller
{
    /**
     * Check current mobile app version requirements and update policy.
     */
    public function check(): JsonResponse
    {
        return response()->json(AppUpdatePolicy::toArray());
    }
}
