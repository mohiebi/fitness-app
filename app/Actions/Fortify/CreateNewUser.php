<?php

namespace App\Actions\Fortify;

use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use App\Models\CoachProfile;
use App\Models\User;
use App\Services\CoachSubscriptions;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Laravel\Fortify\Contracts\CreatesNewUsers;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules, ProfileValidationRules;

    /**
     * Validate and create a newly registered user.
     *
     * @param  array<string, string>  $input
     */
    public function create(array $input): User
    {
        Validator::make($input, [
            ...$this->profileRules(),
            'password' => $this->passwordRules(),
            'role' => ['required', Rule::in(['coach', 'client'])],
            'coach' => ['nullable', 'string', 'max:60'],
        ])->validate();

        $user = DB::transaction(function () use ($input): User {
            $user = User::create([
                'name' => $input['name'],
                'email' => $input['email'],
                'password' => $input['password'],
                'role' => $input['role'],
            ]);

            if ($user->isCoach()) {
                $user->coachProfile()->create(['slug' => CoachProfile::uniqueSlugFor($user->name)]);
                app(CoachSubscriptions::class)->for($user);
            }

            return $user;
        });

        // A trainee who signed up from a coach's page continues the request there.
        if ($user->isTrainee() && ! empty($input['coach'])) {
            session()->put('fitnessos.intended_coach', $input['coach']);
        }

        return $user;
    }
}
