import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@fitnessos/lib/utils';

const buttonVariants = cva(
    'focus-visible:ring-ring focus-visible:ring-offset-background inline-flex cursor-pointer items-center justify-center gap-2 rounded-full text-sm font-extrabold whitespace-nowrap transition-all duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
    {
        variants: {
            variant: {
                default:
                    'bg-brand-gradient text-primary-foreground shadow-glow hover:-translate-y-0.5',
                destructive:
                    'bg-destructive text-destructive-foreground hover:bg-destructive/85',
                outline:
                    'border-input bg-card/70 hover:border-primary/70 hover:bg-primary/10 hover:text-primary border',
                secondary:
                    'bg-secondary text-secondary-foreground hover:bg-secondary/70',
                ghost: 'hover:bg-primary/10 hover:text-primary',
                link: 'text-primary underline-offset-4 hover:underline',
            },
            size: {
                default: 'h-10 px-4 py-2',
                sm: 'h-9 px-3.5 text-[13px]',
                lg: 'h-12 px-6 text-base',
                icon: 'h-10 w-10',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    },
);

export interface ButtonProps
    extends
        React.ButtonHTMLAttributes<HTMLButtonElement>,
        VariantProps<typeof buttonVariants> {
    asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : 'button';
        return (
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        );
    },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
