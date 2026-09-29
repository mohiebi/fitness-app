<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'unread_count' => $user->unreadNotifications()->count(),
            'items' => $user->notifications()->latest()->limit(30)->get()->map(fn (DatabaseNotification $notification) => [
                'id' => $notification->id,
                'kind' => $notification->data['kind'] ?? null,
                'title' => $notification->data['title'] ?? '',
                'body' => $notification->data['body'] ?? '',
                'url' => $notification->data['url'] ?? null,
                'read' => $notification->read_at !== null,
                'created_at' => $notification->created_at?->toIso8601String(),
            ]),
        ]);
    }

    /**
     * Mark one notification (by id) or all of them as read.
     */
    public function read(Request $request): JsonResponse
    {
        $data = $request->validate(['id' => ['nullable', 'string', 'max:64']]);
        $unread = $request->user()->unreadNotifications();

        if (isset($data['id'])) {
            $unread->whereKey($data['id']);
        }
        $unread->update(['read_at' => now()]);

        return response()->json(['unread_count' => $request->user()->unreadNotifications()->count()]);
    }
}
