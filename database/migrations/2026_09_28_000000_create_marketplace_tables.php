<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('coach_profiles', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained('users')->cascadeOnDelete();
            $table->string('slug')->unique();
            $table->string('headline')->nullable();
            $table->text('bio')->nullable();
            $table->json('specialties')->nullable();
            $table->json('certifications')->nullable();
            $table->unsignedTinyInteger('years_experience')->nullable();
            $table->string('city')->nullable()->index();
            $table->json('languages')->nullable();
            $table->boolean('online')->default(true);
            $table->boolean('in_person')->default(false);
            $table->unsignedBigInteger('price_from')->nullable();
            $table->boolean('accepting_clients')->default(true);
            $table->unsignedSmallInteger('max_clients')->nullable();
            $table->string('avatar_path')->nullable();
            $table->boolean('is_published')->default(false)->index();
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();
        });

        Schema::create('trainee_profiles', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained('users')->cascadeOnDelete();
            $table->unsignedSmallInteger('birth_year')->nullable();
            $table->unsignedSmallInteger('height_cm')->nullable();
            $table->decimal('weight_kg', 6, 2)->nullable();
            $table->string('goal')->nullable();
            $table->string('experience')->nullable();
            $table->text('limitations')->nullable();
            $table->timestamp('health_consent_at')->nullable();
            $table->timestamps();
        });

        Schema::create('coachings', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('coach_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('trainee_id')->constrained('users')->cascadeOnDelete();
            $table->string('status')->default('requested');
            $table->text('request_message')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('ended_at')->nullable();
            $table->foreignId('ended_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('end_reason')->nullable();
            $table->timestamps();

            $table->index(['trainee_id', 'status']);
            $table->index(['coach_id', 'status']);
        });

        $now = now();

        DB::table('users')->where('role', '!=', 'client')->orderBy('id')->each(function (object $coach) use ($now): void {
            DB::table('coach_profiles')->insert([
                'user_id' => $coach->id,
                'slug' => (Str::slug($coach->name) ?: 'coach').'-'.$coach->id,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        });

        DB::table('users')->where('role', 'client')->whereNotNull('coach_id')->orderBy('id')->each(function (object $client) use ($now): void {
            DB::table('coachings')->insert([
                'coach_id' => $client->coach_id,
                'trainee_id' => $client->id,
                'status' => 'active',
                'started_at' => $client->created_at ?? $now,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('coachings');
        Schema::dropIfExists('trainee_profiles');
        Schema::dropIfExists('coach_profiles');
    }
};
