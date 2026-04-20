<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class SettingsController extends ApiController
{
    /**
     * Upload application logo
     */
    public function uploadLogo(Request $request)
    {
        try {
            // Check if user is super admin
            if ($request->user()->role->name !== 'super_admin') {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Unauthorized: Only super admins can change settings'
                ], 403);
            }

            // Validate the uploaded file
            $request->validate([
                'logo' => 'required|image|mimes:jpeg,png,jpg,gif|max:5120', // 5MB max
            ]);

            // Delete old logo if it exists
            if (Storage::disk('public')->exists('logo.png')) {
                Storage::disk('public')->delete('logo.png');
            }

            // Store the new logo
            $path = $request->file('logo')->storeAs('', 'logo.' . $request->file('logo')->extension(), 'public');

            return response()->json([
                'status' => 'success',
                'message' => 'Logo uploaded successfully',
                'data' => [
                    'logo_path' => Storage::url($path)
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error uploading logo: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get application logo URL
     */
    public function getLogo()
    {
        try {
            // Check for logo in storage
            $logoPath = null;
            foreach (['png', 'jpg', 'jpeg', 'gif'] as $ext) {
                if (Storage::disk('public')->exists("logo.$ext")) {
                    $logoPath = Storage::url("logo.$ext");
                    break;
                }
            }

            return response()->json([
                'status' => 'success',
                'data' => [
                    'logo_url' => $logoPath ?? 'https://placehold.co/240x64/1f2937/ffffff?text=LOGO'
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error fetching logo: ' . $e->getMessage()
            ], 500);
        }
    }
}
