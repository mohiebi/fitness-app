import { t } from './i18n';

export type CoachSummary = {
    slug: string;
    name: string;
    headline: string | null;
    bio: string | null;
    specialties: string[];
    certifications: string[];
    years_experience: number | null;
    city: string | null;
    languages: string[];
    online: boolean;
    in_person: boolean;
    price_from: number | null;
    accepting_clients: boolean;
    avatar_url: string | null;
    verified: boolean;
};

export type CoachOwnProfile = CoachSummary & {
    max_clients: number | null;
    is_published: boolean;
    active_clients: number;
    pending_requests: number;
};

export type TraineeProfileData = {
    birth_year: number | null;
    height_cm: number | null;
    weight_kg: number | null;
    goal: string | null;
    experience: string | null;
    limitations: string | null;
    health_consent: boolean;
};

export type CoachingStatus = 'requested' | 'active' | 'declined' | 'withdrawn' | 'ended';

export type CoachingSummary = {
    id: number;
    status: CoachingStatus;
    request_message: string | null;
    requested_at: string | null;
    started_at: string | null;
    ended_at: string | null;
    end_reason: string | null;
};

export type CoachRequest = CoachingSummary & {
    trainee: { id: number; name: string; email: string; profile: TraineeProfileData | null };
};

export type TraineeCoaching = CoachingSummary & { coach: CoachSummary };

export type MyCoaching = {
    active: TraineeCoaching | null;
    pending: TraineeCoaching | null;
    history: TraineeCoaching[];
};

// Specialties are stored as stable keys and shown with translated labels.
export const specialties: Record<string, string> = {
    strength: 'Strength',
    'fat-loss': 'Fat loss',
    'muscle-gain': 'Muscle gain',
    bodybuilding: 'Bodybuilding',
    powerlifting: 'Powerlifting',
    calisthenics: 'Calisthenics',
    crossfit: 'CrossFit',
    running: 'Running',
    yoga: 'Yoga',
    pilates: 'Pilates',
    rehab: 'Injury rehab',
    nutrition: 'Nutrition',
    'womens-fitness': "Women's fitness",
    'sports-performance': 'Sports performance',
};

export function specialtyLabel(key: string): string {
    return t(specialties[key] ?? key);
}

export const goals: Record<string, string> = {
    'fat-loss': 'Lose fat',
    'muscle-gain': 'Build muscle',
    strength: 'Get stronger',
    health: 'General health',
    performance: 'Sports performance',
    rehab: 'Recover from injury',
};

export const experienceLevels: Record<string, string> = {
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced',
};

export function labelFrom(map: Record<string, string>, key: string | null): string {
    if (!key) return '—';
    return t(map[key] ?? key);
}

export const endReasons = [
    'Reached my goal',
    'Too expensive',
    'Not the right fit',
    'Not enough time',
    'Other',
];

export function initials(name: string): string {
    return name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase();
}
