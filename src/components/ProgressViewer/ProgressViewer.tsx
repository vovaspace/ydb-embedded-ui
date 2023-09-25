import cn from 'bem-cn-lite';

import type {ValueOf} from '../../types/common';

import './ProgressViewer.scss';

const b = cn('progress-viewer');

export const PROGRESS_VIEWER_SIZE_IDS = {
    xs: 'xs',
    s: 's',
    ns: 'ns',
    m: 'm',
    n: 'n',
    l: 'l',
    head: 'head',
} as const;

type ProgressViewerSize = ValueOf<typeof PROGRESS_VIEWER_SIZE_IDS>;

/*

Props description:
1) value - the amount of progress
2) capacity - maximum possible progress value
3) formatValues - function for formatting the value and capacity
4) percents - display progress in percents
5) colorizeProgress - change the color of the progress bar depending on its value
6) inverseColorize - invert the colors of the progress bar
*/

interface ProgressViewerProps {
    value?: number | string;
    capacity?: number | string;
    formatValues?: (value?: number, capacity?: number) => (string | undefined)[];
    percents?: boolean;
    className?: string;
    size?: ProgressViewerSize;
    colorizeProgress?: boolean;
    inverseColorize?: boolean;
}

export function ProgressViewer({
    value,
    capacity = 100,
    formatValues,
    percents,
    className,
    size = PROGRESS_VIEWER_SIZE_IDS.xs,
    colorizeProgress,
    inverseColorize,
}: ProgressViewerProps) {
    let fillWidth = Math.round((parseFloat(String(value)) / parseFloat(String(capacity))) * 100);
    fillWidth = fillWidth > 100 ? 100 : fillWidth;

    let valueText: number | string | undefined = Math.round(Number(value)),
        capacityText: number | string | undefined = capacity,
        divider = '/';
    if (formatValues) {
        [valueText, capacityText] = formatValues(Number(value), Number(capacity));
    } else if (percents) {
        valueText = fillWidth + '%';
        capacityText = '';
        divider = '';
    }

    let bg = inverseColorize ? 'scarlet' : 'apple';
    if (colorizeProgress) {
        if (fillWidth > 60 && fillWidth <= 80) {
            bg = 'saffron';
        } else if (fillWidth > 80) {
            bg = inverseColorize ? 'apple' : 'scarlet';
        }
    }

    const lineStyle = {
        width: fillWidth + '%',
    };

    const text = fillWidth > 60 ? 'contrast0' : 'contrast70';

    if (!isNaN(fillWidth)) {
        return (
            <div className={b({size}, className)}>
                <div className={b('line', {bg})} style={lineStyle}></div>
                <span
                    className={b('text', {text})}
                >{`${valueText} ${divider} ${capacityText}`}</span>
            </div>
        );
    }

    return <div className={`${b({size})} ${className} error`}>no data</div>;
}