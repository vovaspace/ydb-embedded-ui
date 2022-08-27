import type {TVDiskStateInfo, TVSlotId} from '../types/api/storage';
import type {IStoragePoolGroup} from '../types/store/storage';

export const isFullDonorData = (donor: TVDiskStateInfo | TVSlotId): donor is TVDiskStateInfo =>
    'VDiskId' in donor;

export const getUsage = (data: IStoragePoolGroup, step = 1) => {
    // if limit is 0, display 0
    const usage = Math.round((data.Used * 100) / data.Limit) || 0;

    return Math.floor(usage / step) * step;
};