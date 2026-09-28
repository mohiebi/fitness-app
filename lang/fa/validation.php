<?php

// Persian validation messages for the rules FitnessOS uses. Anything
// missing falls back to the framework's English messages.

return [
    'accepted' => ':attribute باید پذیرفته شود.',
    'array' => ':attribute باید یک فهرست باشد.',
    'between' => [
        'array' => ':attribute باید بین :min و :max مورد داشته باشد.',
        'file' => 'حجم :attribute باید بین :min و :max کیلوبایت باشد.',
        'numeric' => ':attribute باید بین :min و :max باشد.',
        'string' => ':attribute باید بین :min و :max کاراکتر باشد.',
    ],
    'boolean' => ':attribute باید درست یا نادرست باشد.',
    'confirmed' => 'تکرار :attribute مطابقت ندارد.',
    'current_password' => 'رمز عبور نادرست است.',
    'email' => ':attribute باید یک ایمیل معتبر باشد.',
    'image' => ':attribute باید یک تصویر باشد.',
    'in' => ':attribute انتخاب‌شده معتبر نیست.',
    'integer' => ':attribute باید عدد صحیح باشد.',
    'lowercase' => ':attribute باید با حروف کوچک باشد.',
    'max' => [
        'array' => ':attribute نباید بیشتر از :max مورد داشته باشد.',
        'file' => 'حجم :attribute نباید بیشتر از :max کیلوبایت باشد.',
        'numeric' => ':attribute نباید بیشتر از :max باشد.',
        'string' => ':attribute نباید بیشتر از :max کاراکتر باشد.',
    ],
    'min' => [
        'array' => ':attribute باید دست‌کم :min مورد داشته باشد.',
        'file' => 'حجم :attribute باید دست‌کم :min کیلوبایت باشد.',
        'numeric' => ':attribute باید دست‌کم :min باشد.',
        'string' => ':attribute باید دست‌کم :min کاراکتر باشد.',
    ],
    'numeric' => ':attribute باید عدد باشد.',
    'password' => [
        'letters' => ':attribute باید دست‌کم یک حرف داشته باشد.',
        'mixed' => ':attribute باید دست‌کم یک حرف بزرگ و یک حرف کوچک داشته باشد.',
        'numbers' => ':attribute باید دست‌کم یک عدد داشته باشد.',
        'symbols' => ':attribute باید دست‌کم یک نماد داشته باشد.',
        'uncompromised' => 'این :attribute در نشت اطلاعات دیده شده است. لطفاً :attribute دیگری انتخاب کنید.',
    ],
    'regex' => 'قالب :attribute معتبر نیست.',
    'required' => ':attribute الزامی است.',
    'required_if' => 'وقتی :other برابر :value است، :attribute الزامی است.',
    'string' => ':attribute باید متن باشد.',
    'unique' => 'این :attribute قبلاً استفاده شده است.',
    'uploaded' => 'بارگذاری :attribute انجام نشد.',

    'values' => [
        'is_published' => [
            'true' => 'منتشرشده',
        ],
    ],

    'attributes' => [
        'name' => 'نام',
        'email' => 'ایمیل',
        'password' => 'رمز عبور',
        'role' => 'نوع حساب',
        'slug' => 'نشانی صفحه',
        'headline' => 'عنوان',
        'bio' => 'درباره‌ی من',
        'specialties' => 'تخصص‌ها',
        'certifications' => 'مدارک',
        'years_experience' => 'سال‌های تجربه',
        'city' => 'شهر',
        'languages' => 'زبان‌ها',
        'price_from' => 'شروع قیمت',
        'max_clients' => 'حداکثر شاگرد',
        'is_published' => 'انتشار پروفایل',
        'avatar' => 'عکس پروفایل',
        'birth_year' => 'سال تولد',
        'height_cm' => 'قد',
        'weight_kg' => 'وزن',
        'goal' => 'هدف',
        'experience' => 'سابقه‌ی تمرین',
        'limitations' => 'آسیب‌ها و محدودیت‌ها',
        'health_consent' => 'تأیید سلامت',
        'message' => 'پیام',
        'reason' => 'دلیل',
        'body' => 'پیام',
    ],
];
