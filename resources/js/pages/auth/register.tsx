import { Form, Head } from '@inertiajs/react';
import { Dumbbell, Megaphone } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { login } from '@/routes';
import { store } from '@/routes/register';
import { t } from '@fitnessos/lib/i18n';

type Props = {
    passwordRules: string;
};

type Role = 'client' | 'coach';

// /register?role=client&coach=slug comes from a coach's public page.
function initialChoice(): { role: Role | null; coach: string } {
    const params = new URLSearchParams(window.location.search);
    const role = params.get('role');

    return {
        role: role === 'client' || role === 'coach' ? role : null,
        coach: params.get('coach') ?? '',
    };
}

const roles: { value: Role; title: string; detail: string; icon: typeof Dumbbell }[] = [
    { value: 'client', title: 'I want a coach', detail: 'Find a coach, follow your plan and chat with them.', icon: Dumbbell },
    { value: 'coach', title: 'I am a coach', detail: 'Get a public profile and manage your trainees.', icon: Megaphone },
];

export default function Register({ passwordRules }: Props) {
    const [{ role: initialRole, coach }] = useState(initialChoice);
    const [role, setRole] = useState<Role | null>(initialRole);

    return (
        <>
            <Head title={t('Register')} />
            <Form
                {...store.form()}
                resetOnSuccess={['password', 'password_confirmation']}
                disableWhileProcessing
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-6">
                            <fieldset className="grid gap-2">
                                <legend className="mb-2 text-sm font-medium">{t('Account type')}</legend>
                                <div className="grid gap-2 sm:grid-cols-2" role="radiogroup">
                                    {roles.map((option) => {
                                        const Icon = option.icon;
                                        return (
                                            <label
                                                key={option.value}
                                                className={cn(
                                                    'flex cursor-pointer flex-col gap-1 rounded-lg border p-3 text-sm transition-colors',
                                                    role === option.value ? 'border-primary bg-primary/5' : 'border-input hover:bg-accent',
                                                )}
                                            >
                                                <input
                                                    type="radio"
                                                    name="role"
                                                    value={option.value}
                                                    checked={role === option.value}
                                                    onChange={() => setRole(option.value)}
                                                    className="sr-only"
                                                    required
                                                />
                                                <span className="flex items-center gap-2 font-semibold"><Icon className="size-4" />{t(option.title)}</span>
                                                <span className="text-muted-foreground text-xs">{t(option.detail)}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                                <InputError message={errors.role} />
                            </fieldset>

                            {coach && role === 'client' && <input type="hidden" name="coach" value={coach} />}

                            <div className="grid gap-2">
                                <Label htmlFor="name">{t('Name')}</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="name"
                                    name="name"
                                    placeholder={t('Full name')}
                                />
                                <InputError
                                    message={errors.name}
                                    className="mt-2"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">{t('Email address')}</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    dir="ltr"
                                    required
                                    tabIndex={2}
                                    autoComplete="email"
                                    name="email"
                                    placeholder="email@example.com"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password">{t('Password')}</Label>
                                <PasswordInput
                                    id="password"
                                    required
                                    tabIndex={3}
                                    autoComplete="new-password"
                                    name="password"
                                    placeholder={t('Password')}
                                    passwordrules={passwordRules}
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password_confirmation">
                                    {t('Confirm password')}
                                </Label>
                                <PasswordInput
                                    id="password_confirmation"
                                    required
                                    tabIndex={4}
                                    autoComplete="new-password"
                                    name="password_confirmation"
                                    placeholder={t('Confirm password')}
                                    passwordrules={passwordRules}
                                />
                                <InputError
                                    message={errors.password_confirmation}
                                />
                            </div>

                            <Button
                                type="submit"
                                className="mt-2 w-full"
                                tabIndex={5}
                                data-test="register-user-button"
                            >
                                {processing && <Spinner />}
                                {t('Create account')}
                            </Button>
                        </div>

                        <div className="text-muted-foreground text-center text-sm">
                            {t('Already have an account?')}{' '}
                            <TextLink href={login()} tabIndex={6}>
                                {t('Log in')}
                            </TextLink>
                        </div>
                    </>
                )}
            </Form>
        </>
    );
}

Register.layout = {
    title: t('Create an account'),
    description: t('Choose your account type and enter your details'),
};
