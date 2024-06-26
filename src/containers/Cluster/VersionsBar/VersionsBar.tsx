import {Progress} from '@gravity-ui/uikit';

import type {VersionValue} from '../../../types/versions';
import {cn} from '../../../utils/cn';

import './VersionsBar.scss';

const b = cn('ydb-cluster-versions-bar');

interface VersionsBarProps {
    versionsValues?: VersionValue[];
}

export const VersionsBar = ({versionsValues = []}: VersionsBarProps) => {
    return (
        <div className={b()}>
            <Progress value={100} stack={versionsValues} size="s" />
            <div className={b('versions')}>
                {versionsValues.map((item, index) => (
                    <div
                        className={b('version-title')}
                        style={{color: item.color}}
                        key={item.version}
                        title={item.version}
                    >
                        {`${item.version}${index === versionsValues.length - 1 ? '' : ','}`}
                    </div>
                ))}
            </div>
        </div>
    );
};
