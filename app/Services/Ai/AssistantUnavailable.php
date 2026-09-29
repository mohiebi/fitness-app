<?php

namespace App\Services\Ai;

use RuntimeException;

/**
 * The assistant could not produce a draft (not configured, refused,
 * rate limited, or the API failed). The message is safe to show a coach.
 */
class AssistantUnavailable extends RuntimeException {}
