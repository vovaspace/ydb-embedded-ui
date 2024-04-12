import React from 'react';

import {Icon} from '@gravity-ui/uikit';
import {Helmet} from 'react-helmet-async';
import {StringParam, useQueryParams} from 'use-query-params';

import {ButtonWithConfirmDialog} from '../../components/ButtonWithConfirmDialog/ButtonWithConfirmDialog';
import {DiskPageTitle} from '../../components/DiskPageTitle/DiskPageTitle';
import {GroupInfo} from '../../components/GroupInfo/GroupInfo';
import {InfoViewerSkeleton} from '../../components/InfoViewerSkeleton/InfoViewerSkeleton';
import {PageMeta} from '../../components/PageMeta/PageMeta';
import {VDiskWithDonorsStack} from '../../components/VDisk/VDiskWithDonorsStack';
import {VDiskInfo} from '../../components/VDiskInfo/VDiskInfo';
import {setHeaderBreadcrumbs} from '../../store/reducers/header/header';
import {selectNodesMap} from '../../store/reducers/nodesList';
import {getVDiskData, setVDiskDataWasNotLoaded} from '../../store/reducers/vdisk/vdisk';
import {valueIsDefined} from '../../utils';
import {cn} from '../../utils/cn';
import {stringifyVdiskId} from '../../utils/dataFormatters/dataFormatters';
import {getSeverityColor} from '../../utils/disks/helpers';
import {useAutofetcher, useTypedDispatch, useTypedSelector} from '../../utils/hooks';

import {vDiskPageKeyset} from './i18n';

import ArrowsOppositeToDotsIcon from '@gravity-ui/icons/svgs/arrows-opposite-to-dots.svg';

import './VDiskPage.scss';

const vDiskPageCn = cn('ydb-vdisk-page');

export function VDiskPage() {
    const dispatch = useTypedDispatch();

    const nodesMap = useTypedSelector(selectNodesMap);
    const {vDiskData, groupData, loading, wasLoaded} = useTypedSelector((state) => state.vDisk);
    const {NodeHost, NodeId, NodeType, NodeDC, PDiskId, PDiskType, Severity, VDiskId} = vDiskData;

    const [{nodeId, pDiskId, vDiskSlotId}] = useQueryParams({
        nodeId: StringParam,
        pDiskId: StringParam,
        vDiskSlotId: StringParam,
    });

    React.useEffect(() => {
        dispatch(setHeaderBreadcrumbs('vDisk', {nodeId, pDiskId, vDiskSlotId}));
    }, [dispatch, nodeId, pDiskId, vDiskSlotId]);

    const fetchData = React.useCallback(
        async (isBackground?: boolean) => {
            if (!isBackground) {
                dispatch(setVDiskDataWasNotLoaded());
            }
            if (valueIsDefined(nodeId) && valueIsDefined(pDiskId) && valueIsDefined(vDiskSlotId)) {
                return dispatch(getVDiskData({nodeId, pDiskId, vDiskSlotId}));
            }
            return undefined;
        },
        [dispatch, nodeId, pDiskId, vDiskSlotId],
    );

    useAutofetcher(fetchData, [fetchData], true);

    const handleEvictVDisk = async () => {
        const {GroupID, GroupGeneration, Ring, Domain, VDisk} = VDiskId || {};

        if (
            valueIsDefined(GroupID) &&
            valueIsDefined(GroupGeneration) &&
            valueIsDefined(Ring) &&
            valueIsDefined(Domain) &&
            valueIsDefined(VDisk)
        ) {
            return window.api.evictVDisk({
                groupId: GroupID,
                groupGeneration: GroupGeneration,
                failRealmIdx: Ring,
                failDomainIdx: Domain,
                vDiskIdx: VDisk,
            });
        }

        return undefined;
    };

    const handleAfterEvictVDisk = async () => {
        return fetchData(true);
    };

    const renderHelmet = () => {
        const vDiskPagePart = vDiskSlotId
            ? `${vDiskPageKeyset('vdisk')} ${vDiskSlotId}`
            : vDiskPageKeyset('vdisk');

        const pDiskPagePart = pDiskId
            ? `${vDiskPageKeyset('pdisk')} ${pDiskId}`
            : vDiskPageKeyset('pdisk');

        const nodePagePart = NodeHost ? NodeHost : vDiskPageKeyset('node');

        return (
            <Helmet
                titleTemplate={`%s - ${vDiskPagePart} - ${pDiskPagePart} — ${nodePagePart} — YDB Monitoring`}
                defaultTitle={`${vDiskPagePart} - ${pDiskPagePart} — ${nodePagePart} — YDB Monitoring`}
            />
        );
    };

    const renderPageMeta = () => {
        const hostItem = NodeHost ? `${vDiskPageKeyset('fqdn')}: ${NodeHost}` : undefined;
        const nodeIdItem = NodeId ? `${vDiskPageKeyset('node')}: ${NodeId}` : undefined;
        const pDiskIdItem = NodeId ? `${vDiskPageKeyset('pdisk')}: ${PDiskId}` : undefined;

        return (
            <PageMeta
                loading={loading && !wasLoaded}
                items={[hostItem, nodeIdItem, NodeType, NodeDC, pDiskIdItem, PDiskType]}
            />
        );
    };

    const renderPageTitle = () => {
        return (
            <DiskPageTitle
                entityName={vDiskPageKeyset('vdisk')}
                status={getSeverityColor(Severity)}
                id={stringifyVdiskId(vDiskData?.VDiskId)}
            />
        );
    };

    const renderControls = () => {
        return (
            <div>
                <ButtonWithConfirmDialog
                    onConfirmAction={handleEvictVDisk}
                    onConfirmActionSuccess={handleAfterEvictVDisk}
                    buttonDisabled={!VDiskId}
                    buttonView="normal"
                    dialogContent={vDiskPageKeyset('evict-vdisk-dialog')}
                >
                    <Icon data={ArrowsOppositeToDotsIcon} />
                    {vDiskPageKeyset('evict-vdisk-button')}
                </ButtonWithConfirmDialog>
            </div>
        );
    };

    const renderInfo = () => {
        return <VDiskInfo data={vDiskData} isVDiskPage />;
    };

    const renderGroupInfo = () => {
        if (groupData) {
            return (
                <React.Fragment>
                    <div className={vDiskPageCn('group-title')}>{vDiskPageKeyset('group')}</div>
                    <GroupInfo data={groupData} />
                    <div className={vDiskPageCn('group-disks')}>
                        {groupData.VDisks?.map((vDisk) => {
                            return (
                                <VDiskWithDonorsStack
                                    key={stringifyVdiskId(vDisk.VDiskId)}
                                    data={vDisk}
                                    nodes={nodesMap}
                                    className={vDiskPageCn('group-disk')}
                                />
                            );
                        })}
                    </div>
                </React.Fragment>
            );
        }

        return null;
    };

    const renderContent = () => {
        if (loading && !wasLoaded) {
            return <InfoViewerSkeleton rows={20} />;
        }

        return (
            <React.Fragment>
                {renderInfo()}
                {renderGroupInfo()}
            </React.Fragment>
        );
    };

    return (
        <div className={vDiskPageCn(null)}>
            {renderHelmet()}
            {renderPageMeta()}
            {renderPageTitle()}
            {renderControls()}
            {renderContent()}
        </div>
    );
}