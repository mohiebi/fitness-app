<?php

use App\Models\User;
use App\Notifications\AppNotice;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Notifications\VerifyEmail;

beforeEach(function () {
    app()->setLocale('fa');
    $this->user = User::factory()->create(['name' => 'Sara Ahmadi']);
});

test('the password reset email is Persian and right to left', function () {
    $mail = (new ResetPassword('token'))->toMail($this->user);
    $html = (string) $mail->render();

    expect($mail->subject)->toBe('بازنشانی رمز عبور');
    expect($html)->toContain('dir="rtl"')->toContain('lang="fa"')
        ->toContain('این لینک بازنشانی رمز عبور')
        ->toContain('با احترام')
        ->not->toContain('Regards')->not->toContain('If you did not')->not->toContain('You are receiving');
});

test('the email verification email is Persian', function () {
    $mail = (new VerifyEmail)->toMail($this->user);
    $html = (string) $mail->render();

    expect($mail->subject)->toBe('تأیید نشانی ایمیل');
    expect($html)->toContain('تأیید ایمیل')->not->toContain('Verify Email Address')->not->toContain('If you did not create');
});

test("the app's own notification emails are Persian", function () {
    $mail = (new AppNotice('message', __('New message from :name', ['name' => 'Nima']), __('Open the chat to reply.'), '/dashboard', mail: true))->toMail($this->user);
    $html = (string) $mail->render();

    expect($html)->toContain('dir="rtl"')->toContain('پیام جدید')->not->toContain('Open the chat');
});

test('emails stay left to right in English', function () {
    app()->setLocale('en');
    $html = (string) (new ResetPassword('token'))->toMail($this->user)->render();

    expect($html)->toContain('dir="ltr"')->toContain('Regards');
});

test('text written by other people cannot add links or formatting to an email', function () {
    $notice = new AppNotice('coaching_requested', 'New request', '[Click here](https://evil.example) from **Nima** <b>now</b>', '/dashboard', mail: true);

    $html = (string) $notice->toMail($this->user)->render();

    expect($html)->not->toContain('href="https://evil.example"')
        ->not->toContain('<strong>Nima</strong>')
        ->not->toContain('<b>now</b>')
        ->toContain('Click here');
});
