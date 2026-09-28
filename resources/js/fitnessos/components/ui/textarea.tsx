import * as React from 'react';

import { cn } from '@fitnessos/lib/utils';

const Textarea = React.forwardRef<
    HTMLTextAreaElement,
    React.ComponentProps<'textarea'>
>(({ className, ...props }, ref) => {
    return (
        <textarea
            className={cn(
                'border-input bg-background placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-ring/30 flex min-h-[96px] w-full rounded-md border px-3.5 py-3 text-base focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
                className,
            )}
            ref={ref}
            {...props}
        />
    );
});
Textarea.displayName = 'Textarea';

export { Textarea };
