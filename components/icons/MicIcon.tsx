
import React from 'react';

export const MicIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5a6 6 0 00-12 0v1.5a6 6 0 006 6z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 12.75V18.75m0 0A3.375 3.375 0 0015.375 15.375M12 18.75A3.375 3.375 0 018.625 15.375M12 12.75V5.25A3.375 3.375 0 0115.375 8.625m-3.375 4.125A3.375 3.375 0 008.625 8.625" />
    </svg>
);
