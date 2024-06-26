import React from 'react';

import {DEFAULT_INTERSECTION_OBSERVER_MARGIN} from './constants';
import type {OnEntry, OnLeave} from './types';

interface UseIntersectionObserverProps {
    onEntry: OnEntry;
    onLeave: OnLeave;
    /** Intersection observer calculate margins based on container element properties */
    parentContainer?: Element | null;
}

export const useIntersectionObserver = ({
    onEntry,
    onLeave,
    parentContainer,
}: UseIntersectionObserverProps) => {
    const observer = React.useRef<IntersectionObserver>();

    React.useEffect(() => {
        const callback = (entries: IntersectionObserverEntry[]) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    onEntry(entry.target.id);
                } else {
                    onLeave(entry.target.id);
                }
            });
        };

        observer.current = new IntersectionObserver(callback, {
            root: parentContainer,
            rootMargin: DEFAULT_INTERSECTION_OBSERVER_MARGIN,
        });

        return () => {
            observer.current?.disconnect();
            observer.current = undefined;
        };
    }, [parentContainer, onEntry, onLeave]);

    return observer.current;
};
