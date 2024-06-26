import React from 'react';

import {useThemeValue} from '@gravity-ui/uikit';

import {cn} from '../../utils/cn';

export interface IllustrationProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    name: string;
    className?: string;
}

type IllustrationStore = Record<string, Record<string, () => Promise<{default: any}>>>;

const store: IllustrationStore = {
    light: {
        403: () => import('../../assets/illustrations/light/403.svg'),
        thumbsUp: () => import('../../assets/illustrations/light/thumbsUp.svg'),
        error: () => import('../../assets/illustrations/light/error.svg'),
    },
    dark: {
        403: () => import('../../assets/illustrations/dark/403.svg'),
        thumbsUp: () => import('../../assets/illustrations/dark/thumbsUp.svg'),
        error: () => import('../../assets/illustrations/dark/error.svg'),
    },
};

const b = cn('kv-illustration');

export const Illustration = ({name, className, ...props}: IllustrationProps) => {
    const theme = useThemeValue();
    const [src, setSrc] = React.useState('');
    const srcGetter = store[theme] && store[theme][name];

    React.useEffect(() => {
        if (typeof srcGetter === 'function') {
            srcGetter()
                .then((svg) => setSrc(svg.default))
                .catch((e) => {
                    console.error(e);
                    setSrc('');
                });
        }
    }, [srcGetter]);

    return src ? <img alt={name} src={src} className={b(null, className)} {...props} /> : null;
};
