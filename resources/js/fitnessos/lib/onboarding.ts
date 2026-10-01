import {
    Camera,
    ClipboardList,
    type LucideIcon,
    Rocket,
    Send,
    UserPlus,
    UserRound,
} from 'lucide-react';

export type OnboardingKey =
    | 'profile'
    | 'photo'
    | 'publish'
    | 'telegram'
    | 'plan'
    | 'trainee';

export type OnboardingStep = {
    key: OnboardingKey;
    done: boolean;
    optional: boolean;
    blocked: boolean;
};

export type Onboarding = {
    steps: OnboardingStep[];
    done: number;
    total: number;
    complete: boolean;
    dismissed: boolean;
    slug: string;
    public_url: string | null;
    missing_profile: string[];
};

/** What each step is, in English (translated where shown). */
export const stepInfo: Record<
    OnboardingKey,
    { title: string; description: string; icon: LucideIcon }
> = {
    profile: {
        title: 'Set up your profile',
        description:
            'Add a headline, a short bio and your specialties so trainees know who you are.',
        icon: UserRound,
    },
    photo: {
        title: 'Add a photo',
        description: 'Profiles with a real photo get more requests.',
        icon: Camera,
    },
    publish: {
        title: 'Publish your profile',
        description:
            'Make your page visible in the coach directory so trainees can find and request you.',
        icon: Rocket,
    },
    telegram: {
        title: 'Connect Telegram',
        description:
            'Get requests, messages and check-ins on your phone and answer them there.',
        icon: Send,
    },
    plan: {
        title: 'Build your first plan',
        description:
            'Create a training plan or a template you can reuse for new trainees.',
        icon: ClipboardList,
    },
    trainee: {
        title: 'Get your first trainee',
        description:
            'Share your profile link, or add a trainee you already coach.',
        icon: UserPlus,
    },
};

/** The first step the coach still has to do (essentials before extras). */
export function nextStep(onboarding: Onboarding): OnboardingStep | undefined {
    const pending = onboarding.steps.filter(
        (step) => !step.done && !step.blocked,
    );

    return pending.find((step) => !step.optional) ?? pending[0];
}
