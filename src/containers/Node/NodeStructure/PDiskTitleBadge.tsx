import {cn} from '../../../utils/cn';

const b = cn('kv-node-structure');

interface PDiskTitleBadgeProps {
    label?: string;
    value: React.ReactNode;
    className?: string;
}

export function PDiskTitleBadge({label, value, className}: PDiskTitleBadgeProps) {
    return (
        <span className={b('pdisk-title-item', className)}>
            {label && <span className={b('pdisk-title-item-label')}>{label}:</span>}
            <span className={b('pdisk-title-item-value')}>{value}</span>
        </span>
    );
}
