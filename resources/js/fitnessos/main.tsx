import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from '@tanstack/react-router';
import { getRouter } from './router';

const element = document.getElementById('fitnessos');

if (!element) {
    throw new Error('FitnessOS mount element is missing.');
}

createRoot(element).render(
    <StrictMode>
        <RouterProvider router={getRouter()} />
    </StrictMode>,
);
