import { createFileRoute } from '@tanstack/react-router';
import { PublicNav, Footer } from '@fitnessos/components/public-nav';
import { Card } from '@fitnessos/components/ui/card';
import { Button } from '@fitnessos/components/ui/button';
import { Input } from '@fitnessos/components/ui/input';
import { Label } from '@fitnessos/components/ui/label';
import { Textarea } from '@fitnessos/components/ui/textarea';
import { Mail, MessageCircle } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { postJson } from '@fitnessos/lib/api';
import { t } from '@fitnessos/lib/i18n';

export const Route = createFileRoute('/contact')({
    head: () => ({
        meta: [
            { title: t('Contact — FitnessOS') },
            {
                name: 'description',
                content: t('Get in touch with the FitnessOS team.'),
            },
        ],
    }),
    component: Contact,
});

function Contact() {
    const [form, setForm] = useState({
        first_name: '',
        last_name: '',
        email: '',
        message: '',
    });
    const [busy, setBusy] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const submit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setBusy(true);
        setResult(null);
        try {
            await postJson('/fitnessos/contact', form);
            setForm({ first_name: '', last_name: '', email: '', message: '' });
            setResult(t('Message sent. We will reply by email.'));
        } catch (cause) {
            setResult(
                cause instanceof Error
                    ? cause.message
                    : t('The request failed.'),
            );
        } finally {
            setBusy(false);
        }
    };
    return (
        <div className="bg-background min-h-screen">
            <PublicNav />
            <section className="mx-auto max-w-6xl px-6 py-24">
                <div className="grid gap-12 md:grid-cols-2">
                    <div>
                        <div className="text-primary text-xs font-extrabold tracking-widest uppercase">
                            {t('Contact')}
                        </div>
                        <h1 className="mt-3 text-5xl font-semibold tracking-tight md:text-6xl">
                            {t('Say hi.')}
                        </h1>
                        <p className="text-muted-foreground mt-4 max-w-md">
                            {t(
                                'Questions about finding a coach, joining as a coach, or the platform? We reply within one business day.',
                            )}
                        </p>

                        <div className="mt-10 space-y-4">
                            {[
                                {
                                    i: Mail,
                                    label: t('Email'),
                                    v: 'hello@fitnessos.app',
                                },
                                {
                                    i: MessageCircle,
                                    label: t('Support'),
                                    v: 'support@fitnessos.app',
                                },
                            ].map((c) => (
                                <div
                                    key={c.label}
                                    className="flex items-center gap-4"
                                >
                                    <div className="bg-primary/10 text-primary grid h-10 w-10 place-items-center rounded-xl">
                                        <c.i className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <div className="text-muted-foreground text-xs">
                                            {c.label}
                                        </div>
                                        <div dir="ltr" className="font-medium">
                                            {c.v}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <Card className="border-border/60 bg-card shadow-card-premium p-8">
                        <form className="space-y-5" onSubmit={submit}>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <Label className="mb-2 block">
                                        {t('First name')}
                                    </Label>
                                    <Input
                                        required
                                        value={form.first_name}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                first_name: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                                <div>
                                    <Label className="mb-2 block">
                                        {t('Last name')}
                                    </Label>
                                    <Input
                                        required
                                        value={form.last_name}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                last_name: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                            </div>
                            <div>
                                <Label className="mb-2 block">
                                    {t('Email')}
                                </Label>
                                <Input
                                    required
                                    type="email"
                                    dir="ltr"
                                    placeholder="you@email.com"
                                    value={form.email}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            email: e.target.value,
                                        })
                                    }
                                />
                            </div>
                            <div>
                                <Label className="mb-2 block">
                                    {t('Message')}
                                </Label>
                                <Textarea
                                    required
                                    rows={5}
                                    placeholder={t('How can we help?')}
                                    value={form.message}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            message: e.target.value,
                                        })
                                    }
                                />
                            </div>
                            {result && (
                                <p
                                    role="status"
                                    className="text-primary text-sm"
                                >
                                    {result}
                                </p>
                            )}
                            <Button
                                type="submit"
                                disabled={busy}
                                className="w-full"
                            >
                                {busy ? t('Sending…') : t('Send message')}
                            </Button>
                        </form>
                    </Card>
                </div>
            </section>
            <Footer />
        </div>
    );
}
