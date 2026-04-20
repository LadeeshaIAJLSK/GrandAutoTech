<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CheckPermission
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): (\Illuminate\Http\Response|\Illuminate\Http\RedirectResponse)  $next
     * @param  string  $permission
     * @return \Illuminate\Http\Response|\Illuminate\Http\RedirectResponse
     */
    public function handle(Request $request, Closure $next, $permission = null)
    {
        $user = $request->user();

        // If no permission specified, just check authentication
        if (!$permission) {
            return $next($request);
        }

        // Super admin always has access
        $role = DB::table('roles')->where('id', $user->role_id)->first();
        if ($role->name === 'super_admin') {
            return $next($request);
        }

        // Check if user has the permission
        $hasPermission = DB::table('permissions')
            ->join('role_permissions', 'permissions.id', '=', 'role_permissions.permission_id')
            ->where('role_permissions.role_id', $user->role_id)
            ->where('permissions.name', $permission)
            ->where(function($query) use ($user) {
                $query->whereNull('role_permissions.branch_id')
                      ->orWhere('role_permissions.branch_id', $user->branch_id);
            })
            ->where(function($query) use ($user) {
                $query->whereNull('role_permissions.technician_type')
                      ->orWhere('role_permissions.technician_type', $user->technician_type?->value);
            })
            ->exists();

        if (!$hasPermission) {
            return response()->json(['message' => 'Unauthorized: Permission denied'], 403);
        }

        return $next($request);
    }
}
