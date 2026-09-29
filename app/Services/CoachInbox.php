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
    public function __construct(private Notifier $notifier) {}

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
        $id = $this->insertMessage($coach, $traineeId, $body);

        $trainee = User::query()->find($traineeId);
        if ($trainee !== null) {
            $this->notifier->messageReceived($trainee, $coach);
        }

        return $id;
    }

    private function insertMessage(User $coach, int $traineeId, string $body): int
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
        $messageId = DB::transaction(function () use ($coach, $checkin, $feedback): int {
            DB::table('fitnessos_checkins')->where('id', $checkin->id)->update([
                'status' => 'Reviewed',
                'updated_at' => now(),
            ]);

            return $this->insertMessage($coach, $checkin->client_id, $feedback);
        });

        $trainee = User::query()->whereKey((int) $checkin->client_id)->first();
        if ($trainee !== null) {
            $this->notifier->checkinReviewed($trainee, $coach);
        }

        return $messageId;
    }
}
