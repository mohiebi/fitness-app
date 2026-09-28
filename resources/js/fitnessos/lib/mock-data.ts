// Realistic mock data for FitnessOS

export const coach = {
    name: 'Alex Rivera',
    handle: '@coachalex',
    avatar: 'https://i.pravatar.cc/160?img=12',
    title: 'Head Coach — FitnessOS',
    bio: '10+ years transforming physiques and mindsets. Former D1 athlete, certified by NASM & PN1.',
};

export const stats = [
    {
        label: 'Active clients',
        value: '248',
        delta: '+12%',
        trend: 'up' as const,
    },
    {
        label: 'Monthly revenue',
        value: '$42,180',
        delta: '+18%',
        trend: 'up' as const,
    },
    {
        label: 'Pending check-ins',
        value: '17',
        delta: '-4',
        trend: 'down' as const,
    },
    {
        label: 'Missed workouts',
        value: '9',
        delta: '+2',
        trend: 'down' as const,
    },
    {
        label: 'Expiring packages',
        value: '6',
        delta: 'this week',
        trend: 'flat' as const,
    },
    { label: 'New leads', value: '34', delta: '+9', trend: 'up' as const },
    {
        label: 'Upcoming calls',
        value: '5',
        delta: 'today',
        trend: 'flat' as const,
    },
];

export const revenueSeries = [
    { m: 'Jan', revenue: 24800, clients: 180 },
    { m: 'Feb', revenue: 27200, clients: 192 },
    { m: 'Mar', revenue: 30100, clients: 205 },
    { m: 'Apr', revenue: 33400, clients: 214 },
    { m: 'May', revenue: 36900, clients: 225 },
    { m: 'Jun', revenue: 39200, clients: 233 },
    { m: 'Jul', revenue: 42180, clients: 248 },
];

export const adherenceSeries = [
    { d: 'Mon', workout: 92, nutrition: 84 },
    { d: 'Tue', workout: 88, nutrition: 81 },
    { d: 'Wed', workout: 94, nutrition: 86 },
    { d: 'Thu', workout: 90, nutrition: 88 },
    { d: 'Fri', workout: 82, nutrition: 79 },
    { d: 'Sat', workout: 76, nutrition: 74 },
    { d: 'Sun', workout: 85, nutrition: 82 },
];

export const weightSeries = [
    { w: 'W1', weight: 92.4 },
    { w: 'W2', weight: 91.8 },
    { w: 'W3', weight: 91.1 },
    { w: 'W4', weight: 90.5 },
    { w: 'W5', weight: 89.9 },
    { w: 'W6', weight: 89.2 },
    { w: 'W7', weight: 88.6 },
    { w: 'W8', weight: 88.0 },
    { w: 'W9', weight: 87.3 },
    { w: 'W10', weight: 86.7 },
    { w: 'W11', weight: 86.1 },
    { w: 'W12', weight: 85.4 },
];

export const strengthSeries = [
    { w: 'W1', squat: 100, bench: 80, deadlift: 140 },
    { w: 'W3', squat: 110, bench: 85, deadlift: 150 },
    { w: 'W5', squat: 120, bench: 90, deadlift: 160 },
    { w: 'W7', squat: 130, bench: 92.5, deadlift: 170 },
    { w: 'W9', squat: 135, bench: 95, deadlift: 180 },
    { w: 'W12', squat: 145, bench: 100, deadlift: 190 },
];

export const clients = [
    {
        id: 'c1',
        name: 'Sarah Chen',
        avatar: 'https://i.pravatar.cc/120?img=47',
        goal: 'Fat loss',
        status: 'Active',
        package: 'Elite / 12wk',
        progress: 78,
        lastCheckin: '2d ago',
        notes: 'Consistent, sleep improving.',
    },
    {
        id: 'c2',
        name: 'Marcus Johnson',
        avatar: 'https://i.pravatar.cc/120?img=13',
        goal: 'Muscle gain',
        status: 'Active',
        package: 'Pro / 24wk',
        progress: 62,
        lastCheckin: '5d ago',
        notes: 'Bump protein to 190g.',
    },
    {
        id: 'c3',
        name: 'Priya Patel',
        avatar: 'https://i.pravatar.cc/120?img=44',
        goal: 'Recomp',
        status: 'Active',
        package: 'Elite / 12wk',
        progress: 45,
        lastCheckin: '1d ago',
        notes: 'Great form on deadlifts.',
    },
    {
        id: 'c4',
        name: 'David Kim',
        avatar: 'https://i.pravatar.cc/120?img=33',
        goal: 'Fat loss',
        status: 'At risk',
        package: 'Starter / 8wk',
        progress: 22,
        lastCheckin: '9d ago',
        notes: 'Missed 3 sessions.',
    },
    {
        id: 'c5',
        name: 'Emma Wilson',
        avatar: 'https://i.pravatar.cc/120?img=45',
        goal: 'Strength',
        status: 'Active',
        package: 'Pro / 24wk',
        progress: 91,
        lastCheckin: '1d ago',
        notes: 'PR week — hit 3 lifts.',
    },
    {
        id: 'c6',
        name: 'Noah Bennett',
        avatar: 'https://i.pravatar.cc/120?img=15',
        goal: 'Endurance',
        status: 'Paused',
        package: 'Starter / 8wk',
        progress: 55,
        lastCheckin: '14d ago',
        notes: 'Traveling, resumes Mon.',
    },
    {
        id: 'c7',
        name: 'Ana Rodríguez',
        avatar: 'https://i.pravatar.cc/120?img=48',
        goal: 'Postpartum',
        status: 'Active',
        package: 'Elite / 16wk',
        progress: 68,
        lastCheckin: '3d ago',
        notes: 'Loving new program.',
    },
    {
        id: 'c8',
        name: "James O'Connor",
        avatar: 'https://i.pravatar.cc/120?img=52',
        goal: 'Fat loss',
        status: 'Active',
        package: 'Pro / 24wk',
        progress: 34,
        lastCheckin: '2d ago',
        notes: 'Reduce calories 100kcal.',
    },
];

export const leads = [
    {
        id: 'l1',
        name: 'Jordan Miller',
        email: 'jordan@ex.com',
        source: 'Instagram',
        stage: 'New',
        score: 82,
        date: 'Today',
    },
    {
        id: 'l2',
        name: 'Aisha Rahman',
        email: 'aisha@ex.com',
        source: 'Referral',
        stage: 'Qualified',
        score: 91,
        date: 'Today',
    },
    {
        id: 'l3',
        name: 'Tom Baker',
        email: 'tom@ex.com',
        source: 'Website',
        stage: 'Call booked',
        score: 88,
        date: 'Yesterday',
    },
    {
        id: 'l4',
        name: 'Lena Vogel',
        email: 'lena@ex.com',
        source: 'TikTok',
        stage: 'New',
        score: 74,
        date: '2d ago',
    },
    {
        id: 'l5',
        name: 'Ravi Shah',
        email: 'ravi@ex.com',
        source: 'Instagram',
        stage: 'Nurturing',
        score: 66,
        date: '3d ago',
    },
    {
        id: 'l6',
        name: 'Chloé Martin',
        email: 'chloe@ex.com',
        source: 'Ads',
        stage: 'Qualified',
        score: 84,
        date: '3d ago',
    },
];

export const transformations = [
    {
        id: 't1',
        name: 'Sarah C.',
        before: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?w=600&auto=format&fit=crop',
        after: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&auto=format&fit=crop',
        weeks: 16,
        lost: '-14kg',
        goal: 'Fat loss',
        quote: 'Alex changed how I see food and training.',
    },
    {
        id: 't2',
        name: 'Marcus J.',
        before: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&auto=format&fit=crop',
        after: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=600&auto=format&fit=crop',
        weeks: 24,
        lost: '+9kg lean',
        goal: 'Muscle gain',
        quote: "First time I've stuck with a program past week 4.",
    },
    {
        id: 't3',
        name: 'Priya P.',
        before: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&auto=format&fit=crop',
        after: 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=600&auto=format&fit=crop',
        weeks: 12,
        lost: '-8% BF',
        goal: 'Recomp',
        quote: 'The check-ins keep me accountable weekly.',
    },
    {
        id: 't4',
        name: 'Emma W.',
        before: 'https://images.unsplash.com/photo-1550345332-09e3ac987658?w=600&auto=format&fit=crop',
        after: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&auto=format&fit=crop',
        weeks: 20,
        lost: '3 PRs',
        goal: 'Strength',
        quote: 'Went from bodyweight squats to 140kg.',
    },
    {
        id: 't5',
        name: 'David K.',
        before: 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=600&auto=format&fit=crop',
        after: 'https://images.unsplash.com/photo-1571731956672-f2b94d7dd0cb?w=600&auto=format&fit=crop',
        weeks: 12,
        lost: '-11kg',
        goal: 'Fat loss',
        quote: 'I actually enjoy training now.',
    },
    {
        id: 't6',
        name: 'Ana R.',
        before: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=600&auto=format&fit=crop',
        after: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&auto=format&fit=crop',
        weeks: 18,
        lost: 'Postpartum',
        goal: 'Postpartum',
        quote: 'Rebuilt my strength safely and gradually.',
    },
];

export const testimonials = [
    {
        name: 'Sarah Chen',
        role: 'Client, 16 weeks',
        quote: "FitnessOS makes my coach feel like she's right there with me every day. The check-ins, the plan updates — it's a different level.",
        avatar: 'https://i.pravatar.cc/80?img=47',
    },
    {
        name: 'Marcus Johnson',
        role: 'Client, 24 weeks',
        quote: "The app is beautiful and everything I need is one tap away. First program I've ever finished.",
        avatar: 'https://i.pravatar.cc/80?img=13',
    },
    {
        name: 'Coach Priya',
        role: 'Nutrition coach',
        quote: 'I run my whole business here now. Cut my admin time in half and doubled my client roster.',
        avatar: 'https://i.pravatar.cc/80?img=44',
    },
];

export const pricing = [
    {
        name: 'Starter',
        price: 99,
        period: '/mo',
        desc: 'Solo coaches getting started.',
        features: [
            'Up to 15 clients',
            'Workout & nutrition builder',
            'Weekly check-ins',
            'Client mobile app',
        ],
        cta: 'Start free trial',
    },
    {
        name: 'Pro',
        price: 199,
        period: '/mo',
        desc: 'Growing coaching businesses.',
        features: [
            'Up to 75 clients',
            'AI Assistant',
            'Payments & invoicing',
            'Content Studio',
            'Priority support',
        ],
        cta: 'Start free trial',
        featured: true,
    },
    {
        name: 'Elite',
        price: 399,
        period: '/mo',
        desc: 'Teams and coaching agencies.',
        features: [
            'Unlimited clients',
            'Team seats & roles',
            'Custom branding',
            'API access',
            'Dedicated success manager',
        ],
        cta: 'Talk to sales',
    },
];

export const faqs = [
    {
        q: 'How long does onboarding take?',
        a: 'Most coaches are fully migrated within 3 days. We import clients, plans and payments for you.',
    },
    {
        q: 'Do my clients get a branded app?',
        a: 'Yes. On Pro and Elite you get your logo, colors and custom domain on both web and mobile.',
    },
    {
        q: 'Which payment providers are supported?',
        a: 'Stripe, Paddle and manual bank transfer. Recurring subscriptions and one-off packages are built in.',
    },
    {
        q: 'Is there a free trial?',
        a: '14 days on any plan, no card required. Cancel anytime.',
    },
    {
        q: 'Can I use my own workout content?',
        a: 'Absolutely — upload your own videos or use our library of 2,000+ demonstrations.',
    },
];

export const services = [
    {
        title: '1:1 Coaching',
        desc: 'Custom plans, weekly check-ins and unlimited chat with your coach.',
        icon: 'target',
    },
    {
        title: 'Group Programs',
        desc: '12-week transformation cohorts with community accountability.',
        icon: 'users',
    },
    {
        title: 'Nutrition Coaching',
        desc: 'Macro-based plans, meal cards and shopping lists tailored to you.',
        icon: 'utensils',
    },
    {
        title: 'Habit Coaching',
        desc: 'Build sleep, stress and mindset habits that stick.',
        icon: 'moon',
    },
];

export const process = [
    {
        n: '01',
        title: 'Apply',
        desc: 'Tell us your goals, history and lifestyle in a 5-minute application.',
    },
    {
        n: '02',
        title: 'Discovery call',
        desc: "We map your program and confirm we're the right fit.",
    },
    {
        n: '03',
        title: 'Build your plan',
        desc: 'Custom training and nutrition delivered inside your app.',
    },
    {
        n: '04',
        title: 'Weekly optimisation',
        desc: 'Check-ins, video feedback and plan adjustments every week.',
    },
];

export const resources = [
    {
        id: 'r1',
        title: 'The Complete Guide to Fat Loss',
        cat: 'Nutrition',
        read: '12 min',
        img: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&auto=format&fit=crop',
        excerpt:
            'Everything you need to know about creating a sustainable deficit.',
    },
    {
        id: 'r2',
        title: 'Progressive Overload, Explained',
        cat: 'Training',
        read: '8 min',
        img: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop',
        excerpt: 'The one principle that drives 90% of your progress.',
    },
    {
        id: 'r3',
        title: 'Sleep is the New Steroid',
        cat: 'Recovery',
        read: '6 min',
        img: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=800&auto=format&fit=crop',
        excerpt: 'How 8 hours can outperform a pre-workout.',
    },
    {
        id: 'r4',
        title: 'Building a Sustainable Physique',
        cat: 'Mindset',
        read: '10 min',
        img: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop',
        excerpt: 'Why lifestyle beats motivation every time.',
    },
    {
        id: 'r5',
        title: 'How to Track Macros Without Losing Your Mind',
        cat: 'Nutrition',
        read: '7 min',
        img: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&auto=format&fit=crop',
        excerpt: 'A calm, non-obsessive framework.',
    },
    {
        id: 'r6',
        title: 'The 5x5 Renaissance',
        cat: 'Training',
        read: '9 min',
        img: 'https://images.unsplash.com/photo-1534368420009-621bfab424a8?w=800&auto=format&fit=crop',
        excerpt: 'Why the classic 5x5 still works in 2026.',
    },
];

export const tools = [
    {
        title: 'TDEE Calculator',
        desc: 'Estimate your daily calorie needs.',
        icon: 'flame',
    },
    {
        title: '1RM Calculator',
        desc: 'Calculate your one-rep max.',
        icon: 'dumbbell',
    },
    {
        title: 'Macro Planner',
        desc: 'Split protein, carbs and fats.',
        icon: 'pie-chart',
    },
    {
        title: 'Body Fat Estimator',
        desc: 'Navy method calculator.',
        icon: 'activity',
    },
];

export const exercises = [
    { name: 'Back Squat', muscle: 'Legs', equipment: 'Barbell' },
    { name: 'Romanian Deadlift', muscle: 'Hamstrings', equipment: 'Barbell' },
    { name: 'Bench Press', muscle: 'Chest', equipment: 'Barbell' },
    { name: 'Pull-up', muscle: 'Back', equipment: 'Bodyweight' },
    { name: 'Overhead Press', muscle: 'Shoulders', equipment: 'Barbell' },
    { name: 'Bulgarian Split Squat', muscle: 'Legs', equipment: 'Dumbbell' },
    { name: 'Barbell Row', muscle: 'Back', equipment: 'Barbell' },
    { name: 'Incline DB Press', muscle: 'Chest', equipment: 'Dumbbell' },
    { name: 'Face Pull', muscle: 'Rear delts', equipment: 'Cable' },
    { name: 'Hanging Leg Raise', muscle: 'Core', equipment: 'Bodyweight' },
];

export const workoutWeek = {
    week: 3,
    days: [
        {
            name: 'Monday — Push',
            exercises: [
                {
                    name: 'Bench Press',
                    sets: 4,
                    reps: '6-8',
                    weight: '90kg',
                    rest: '180s',
                    notes: 'RPE 8',
                },
                {
                    name: 'Incline DB Press',
                    sets: 3,
                    reps: '10-12',
                    weight: '32kg',
                    rest: '120s',
                    notes: 'Full ROM',
                },
                {
                    name: 'Overhead Press',
                    sets: 3,
                    reps: '8',
                    weight: '50kg',
                    rest: '150s',
                    notes: '',
                },
                {
                    name: 'Lateral Raise',
                    sets: 4,
                    reps: '15',
                    weight: '10kg',
                    rest: '60s',
                    notes: 'Slow eccentric',
                },
                {
                    name: 'Tricep Pushdown',
                    sets: 3,
                    reps: '12',
                    weight: '35kg',
                    rest: '60s',
                    notes: '',
                },
            ],
        },
        {
            name: 'Tuesday — Pull',
            exercises: [
                {
                    name: 'Deadlift',
                    sets: 4,
                    reps: '5',
                    weight: '160kg',
                    rest: '180s',
                    notes: 'Belt on top set',
                },
                {
                    name: 'Pull-up',
                    sets: 4,
                    reps: '8-10',
                    weight: 'BW',
                    rest: '120s',
                    notes: 'Add weight if easy',
                },
                {
                    name: 'Barbell Row',
                    sets: 3,
                    reps: '10',
                    weight: '70kg',
                    rest: '120s',
                    notes: '',
                },
                {
                    name: 'Face Pull',
                    sets: 3,
                    reps: '15',
                    weight: '25kg',
                    rest: '60s',
                    notes: '',
                },
            ],
        },
        { name: 'Wednesday — Rest', exercises: [] },
        {
            name: 'Thursday — Legs',
            exercises: [
                {
                    name: 'Back Squat',
                    sets: 5,
                    reps: '5',
                    weight: '130kg',
                    rest: '180s',
                    notes: 'Depth',
                },
                {
                    name: 'Romanian Deadlift',
                    sets: 3,
                    reps: '8',
                    weight: '100kg',
                    rest: '120s',
                    notes: '',
                },
                {
                    name: 'Bulgarian Split Squat',
                    sets: 3,
                    reps: '10/leg',
                    weight: '22kg',
                    rest: '90s',
                    notes: '',
                },
                {
                    name: 'Leg Curl',
                    sets: 3,
                    reps: '12',
                    weight: '40kg',
                    rest: '60s',
                    notes: '',
                },
            ],
        },
        {
            name: 'Friday — Upper',
            exercises: [
                {
                    name: 'Incline DB Press',
                    sets: 4,
                    reps: '8',
                    weight: '34kg',
                    rest: '120s',
                    notes: '',
                },
                {
                    name: 'Weighted Pull-up',
                    sets: 4,
                    reps: '6',
                    weight: '+15kg',
                    rest: '150s',
                    notes: '',
                },
                {
                    name: 'DB Shoulder Press',
                    sets: 3,
                    reps: '10',
                    weight: '24kg',
                    rest: '90s',
                    notes: '',
                },
            ],
        },
        {
            name: 'Saturday — Conditioning',
            exercises: [
                {
                    name: 'Assault Bike Intervals',
                    sets: 6,
                    reps: '30s on / 90s off',
                    weight: '—',
                    rest: '90s',
                    notes: 'Zone 4',
                },
            ],
        },
        { name: 'Sunday — Rest', exercises: [] },
    ],
};

export const meals = [
    {
        name: 'Breakfast',
        time: '8:00',
        kcal: 640,
        p: 45,
        c: 62,
        f: 20,
        items: [
            '3 whole eggs + 3 whites',
            '80g oats',
            '1 banana',
            '20g almond butter',
        ],
    },
    {
        name: 'Lunch',
        time: '13:00',
        kcal: 720,
        p: 55,
        c: 75,
        f: 22,
        items: [
            '180g chicken breast',
            '220g jasmine rice',
            'Mixed greens',
            '1 tbsp olive oil',
        ],
    },
    {
        name: 'Pre-workout',
        time: '17:00',
        kcal: 320,
        p: 30,
        c: 45,
        f: 4,
        items: ['1 scoop whey', '1 rice cake', '1 apple'],
    },
    {
        name: 'Dinner',
        time: '20:00',
        kcal: 780,
        p: 60,
        c: 70,
        f: 26,
        items: ['200g salmon', '300g sweet potato', 'Roasted broccoli'],
    },
    {
        name: 'Snack',
        time: '22:00',
        kcal: 240,
        p: 30,
        c: 10,
        f: 8,
        items: ['1 scoop casein', '20g walnuts'],
    },
];

export const checkins = [
    {
        week: 12,
        date: 'This week',
        weight: 85.4,
        sleep: 7.8,
        energy: 8,
        adherence: 94,
        status: 'On track',
    },
    {
        week: 11,
        date: 'Last week',
        weight: 86.1,
        sleep: 7.4,
        energy: 7,
        adherence: 88,
        status: 'On track',
    },
    {
        week: 10,
        date: '2 weeks ago',
        weight: 86.7,
        sleep: 7.1,
        energy: 6,
        adherence: 82,
        status: 'Adjust',
    },
];

export const conversations = [
    {
        id: 'm1',
        name: 'Sarah Chen',
        avatar: 'https://i.pravatar.cc/80?img=47',
        last: 'Legs felt amazing today 💪',
        unread: 2,
        time: '2m',
    },
    {
        id: 'm2',
        name: 'Marcus Johnson',
        avatar: 'https://i.pravatar.cc/80?img=13',
        last: 'Should I go heavier on RDLs?',
        unread: 0,
        time: '1h',
    },
    {
        id: 'm3',
        name: 'Priya Patel',
        avatar: 'https://i.pravatar.cc/80?img=44',
        last: 'Sent check-in photos',
        unread: 1,
        time: '3h',
    },
    {
        id: 'm4',
        name: 'Emma Wilson',
        avatar: 'https://i.pravatar.cc/80?img=45',
        last: 'PR!! 145kg squat 🔥',
        unread: 0,
        time: '1d',
    },
    {
        id: 'm5',
        name: 'David Kim',
        avatar: 'https://i.pravatar.cc/80?img=33',
        last: 'Missed session, sick',
        unread: 0,
        time: '2d',
    },
];

export const messages = [
    {
        from: 'client',
        text: "Just finished today's session. Legs felt amazing 💪",
        time: '10:24',
    },
    { from: 'coach', text: 'Love that! How was the RDL depth?', time: '10:26' },
    {
        from: 'client',
        text: 'Way better. I filmed it — sending now.',
        time: '10:27',
    },
    { from: 'client', text: '🎥 rdl_wk3.mp4', time: '10:27', attachment: true },
    {
        from: 'coach',
        text: "Form is clean. Add 5kg next week — you're ready.",
        time: '10:31',
    },
    { from: 'client', text: 'Amazing, thank you 🙏', time: '10:32' },
];

export const aiPrompts = [
    {
        title: 'Generate Workout Plan',
        desc: 'Build a 12-week program from a client goal.',
        icon: 'dumbbell',
    },
    {
        title: 'Generate Meal Plan',
        desc: 'Macro-based nutrition tailored to a client.',
        icon: 'utensils',
    },
    {
        title: 'Analyze Client Progress',
        desc: 'Summarize 4 weeks of check-in data.',
        icon: 'trending-up',
    },
    {
        title: 'Create Instagram Content',
        desc: 'Draft a week of posts and captions.',
        icon: 'instagram',
    },
    {
        title: 'Write Client Response',
        desc: 'Reply to a check-in with empathy.',
        icon: 'message-square',
    },
    {
        title: 'Summarize Check-ins',
        desc: 'One-line summary per client.',
        icon: 'clipboard',
    },
];

export const habits = [
    { name: 'Water 3L', done: true },
    { name: '10k steps', done: true },
    { name: 'Sleep 8h', done: false },
    { name: 'Read 20 min', done: true },
    { name: 'Meditate', done: false },
];
