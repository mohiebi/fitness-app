<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fitnessos_leads', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('email');
            $table->unsignedTinyInteger('age')->nullable();
            $table->string('country')->nullable();
            $table->string('goal')->nullable();
            $table->string('timeline')->nullable();
            $table->text('success')->nullable();
            $table->string('experience')->nullable();
            $table->unsignedSmallInteger('height_cm')->nullable();
            $table->decimal('weight_kg', 6, 2)->nullable();
            $table->text('limitations')->nullable();
            $table->string('package')->nullable();
            $table->string('stage')->default('New');
            $table->timestamps();
        });

        Schema::create('fitnessos_contact_messages', function (Blueprint $table): void {
            $table->id();
            $table->string('first_name');
            $table->string('last_name');
            $table->string('email');
            $table->text('message');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fitnessos_contact_messages');
        Schema::dropIfExists('fitnessos_leads');
    }
};
