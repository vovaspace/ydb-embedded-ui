import {RadioButton} from '@gravity-ui/uikit';

import {STORAGE_TYPES} from '../../../store/reducers/storage/constants';
import type {StorageType} from '../../../store/reducers/storage/types';

const StorageTypesTitles = {
    [STORAGE_TYPES.groups]: 'Groups',
    [STORAGE_TYPES.nodes]: 'Nodes',
};

interface StorageTypeFilterProps {
    value: StorageType;
    onChange: (value: StorageType) => void;
}

const storageTypeFilterQa = 'storage-type-filter';

export const StorageTypeFilter = ({value, onChange}: StorageTypeFilterProps) => {
    return (
        <RadioButton value={value} onUpdate={onChange} qa={storageTypeFilterQa}>
            <RadioButton.Option value={STORAGE_TYPES.groups}>
                {StorageTypesTitles[STORAGE_TYPES.groups]}
            </RadioButton.Option>
            <RadioButton.Option value={STORAGE_TYPES.nodes}>
                {StorageTypesTitles[STORAGE_TYPES.nodes]}
            </RadioButton.Option>
        </RadioButton>
    );
};
