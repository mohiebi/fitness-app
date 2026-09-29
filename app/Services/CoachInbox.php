<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use stdClass;

/**
 * What a coach sends to a current trainee: chat messages and check-in
 * feedback. Shared by the coach screens and approved AI drafts.
 */
class CoachInbox
{
    /**
     * A check-in from a trainee the coach currently coaches.
     */
    public function currentCheckin(User $coach, int $checkinId): ?stdClass
    {
        return DB::table('fitnessos_checkins')
            ->join('users', 'fitnessos_checkins.client_id', '=', 'users.id')
            ->select('fitnessos_checkins.*')
            ->where('fitnessos_checkins.id', $checkinId)
            ->where('fitnessos_checkins.coach_id', $coach->id)
            ->where('users.coach_id', $coach->id)
            ->first();
    }

    /**
     * @return int the new message id
     */
    public function sendMessage(User $coach, int $traineeId, string $body): int
    {
        return DB::table('fitnessos_messages')->insertGetId([
            'coach_id' => $coach->id,
            'client_id' => $traineeId,
            'sender_id' => $coach->id,
            'body' => $body,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Mark the check-in reviewed and send the feedback as a chat message.
     *
     * @return int the feedback message id
     */
    public function reviewCheckin(User $coach, stdClass $checkin, string $feedback): int
    {
        return DB::transaction(function () use ($coach, $checkin, $feedback): int {
            DB::table('fitnessos_checkins')->where('id', $checkin->id)->update([
                'status' => 'Reviewed',
                'updated_at' => now(),
            ]);

            return $this->sendMessage($coach, $checkin->client_id, $feedback);
        });
    }
}
