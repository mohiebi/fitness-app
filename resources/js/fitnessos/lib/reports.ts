export type ReportSummary = {
    active_trainees: number;
    new_trainees: number;
    retention: number | null;
    acceptance: number | null;
    workout_completion: number | null;
    checkin_response: number | null;
    avg_review_hours: number | null;
    rating: number | null;
    review_count: number;
};

export type Reports = {
    summary: ReportSummary;
    growth: {
        week_start: string;
        active: number;
        started: number;
        ended: number;
    }[];
    sessions: { week_start: string; done: number; planned: number }[];
    checkins: { week_start: string; submitted: number; reviewed: number }[];
    trainees: {
        id: number;
        name: string;
        done: number;
        planned: number;
        percent: number | null;
    }[];
};
