import React from 'react';

import type {Column, Settings, SortOrder} from '@gravity-ui/react-data-table';
import DataTable from '@gravity-ui/react-data-table';
import {useLocation} from 'react-router';

import {ResizeableDataTable} from '../../../../components/ResizeableDataTable/ResizeableDataTable';
import {TableWithControlsLayout} from '../../../../components/TableWithControlsLayout/TableWithControlsLayout';
import {
    setShardsQueryFilters,
    shardApi,
} from '../../../../store/reducers/shardsWorkload/shardsWorkload';
import {EShardsWorkloadMode} from '../../../../store/reducers/shardsWorkload/types';
import type {ShardsWorkloadFilters} from '../../../../store/reducers/shardsWorkload/types';
import type {CellValue, KeyValueRow} from '../../../../types/api/query';
import type {EPathType} from '../../../../types/api/schema';
import {cn} from '../../../../utils/cn';
import {DEFAULT_TABLE_SETTINGS, HOUR_IN_SECONDS} from '../../../../utils/constants';
import {formatDateTime} from '../../../../utils/dataFormatters/dataFormatters';
import {isSortableTopShardsProperty} from '../../../../utils/diagnostics';
import {useTypedDispatch, useTypedSelector} from '../../../../utils/hooks';
import {prepareQueryError} from '../../../../utils/query';
import {isColumnEntityType} from '../../utils/schema';

import {Filters} from './Filters';
import {TOP_SHARDS_COLUMNS_WIDTH_LS_KEY, getShardsWorkloadColumns} from './getTopShardsColumns';
import i18n from './i18n';

import './TopShards.scss';

const b = cn('top-shards');

const TABLE_SETTINGS: Settings = {
    ...DEFAULT_TABLE_SETTINGS,
    dynamicRender: false, // no more than 20 rows
    externalSort: true,
    disableSortReset: true,
    defaultOrder: DataTable.DESCENDING,
};

const tableColumnsNames = {
    TabletId: 'TabletId',
    CPUCores: 'CPUCores',
    DataSize: 'DataSize',
    Path: 'Path',
    NodeId: 'NodeId',
    PeakTime: 'PeakTime',
    InFlightTxCount: 'InFlightTxCount',
    IntervalEnd: 'IntervalEnd',
};

function prepareDateTimeValue(value: CellValue) {
    if (!value) {
        return '–';
    }
    return formatDateTime(new Date(value).getTime());
}

function stringToDataTableSortOrder(value: string): SortOrder[] | undefined {
    return value
        ? value.split(',').map((columnId) => ({
              columnId,
              order: DataTable.DESCENDING,
          }))
        : undefined;
}

function stringToQuerySortOrder(value: string) {
    return value
        ? value.split(',').map((columnId) => ({
              columnId,
              order: 'DESC',
          }))
        : undefined;
}

function dataTableToStringSortOrder(value: SortOrder | SortOrder[] = []) {
    const sortOrders = Array.isArray(value) ? value : [value];
    return sortOrders.map(({columnId}) => columnId).join(',');
}

function fillDateRangeFor(value: ShardsWorkloadFilters) {
    value.to = Date.now();
    value.from = value.to - HOUR_IN_SECONDS * 1000;
    return value;
}

interface TopShardsProps {
    tenantPath: string;
    type?: EPathType;
}

export const TopShards = ({tenantPath, type}: TopShardsProps) => {
    const dispatch = useTypedDispatch();
    const location = useLocation();

    const {autorefresh, currentSchemaPath} = useTypedSelector((state) => state.schema);

    const storeFilters = useTypedSelector((state) => state.shardsWorkload);

    // default filters shouldn't propagate into URL until user interacts with the control
    // redux initial value can't be used, as it synchronizes with URL
    const [filters, setFilters] = React.useState<ShardsWorkloadFilters>(() => {
        const defaultValue = {...storeFilters};

        if (!defaultValue.mode) {
            defaultValue.mode = EShardsWorkloadMode.Immediate;
        }

        if (!defaultValue.from && !defaultValue.to) {
            fillDateRangeFor(defaultValue);
        }

        return defaultValue;
    });

    const [sortOrder, setSortOrder] = React.useState(tableColumnsNames.CPUCores);
    const {
        data: result,
        isFetching,
        error,
    } = shardApi.useSendShardQueryQuery(
        {
            database: tenantPath,
            path: currentSchemaPath,
            sortOrder: stringToQuerySortOrder(sortOrder),
            filters,
        },
        {pollingInterval: autorefresh},
    );
    const loading = isFetching && result === undefined;
    const {result: data} = result ?? {};

    const onSort = (newSortOrder?: SortOrder | SortOrder[]) => {
        // omit information about sort order to disable ASC order, only DESC makes sense for top shards
        // use a string (and not the DataTable default format) to prevent reference change,
        // which would cause an excess state change, to avoid repeating requests
        setSortOrder(dataTableToStringSortOrder(newSortOrder));
    };

    const handleFiltersChange = (value: Partial<ShardsWorkloadFilters>) => {
        const newStateValue = {...value};
        const isDateRangePristine =
            !storeFilters.from && !storeFilters.to && !value.from && !value.to;

        if (isDateRangePristine) {
            switch (value.mode) {
                case EShardsWorkloadMode.Immediate:
                    newStateValue.from = newStateValue.to = undefined;
                    break;
                case EShardsWorkloadMode.History:
                    // should default to the current datetime every time history mode activates
                    fillDateRangeFor(newStateValue);
                    break;
            }
        }

        dispatch(setShardsQueryFilters(value));
        setFilters((state) => ({...state, ...newStateValue}));
    };

    const tableColumns = React.useMemo(() => {
        const rawColumns: Column<KeyValueRow>[] = getShardsWorkloadColumns(tenantPath, location);

        const columns: Column<KeyValueRow>[] = rawColumns.map((column) => ({
            ...column,
            sortable: isSortableTopShardsProperty(column.name),
        }));

        if (filters.mode === EShardsWorkloadMode.History) {
            // after NodeId
            columns.splice(5, 0, {
                name: tableColumnsNames.PeakTime,
                render: ({row}) => {
                    return prepareDateTimeValue(row.PeakTime);
                },
                sortable: false,
            });
            columns.push({
                name: tableColumnsNames.IntervalEnd,
                render: ({row}) => {
                    return prepareDateTimeValue(row.IntervalEnd);
                },
            });
        }

        return columns;
    }, [filters.mode, tenantPath, location]);

    const renderControls = () => {
        return <Filters value={filters} onChange={handleFiltersChange} />;
    };

    const renderContent = () => {
        if (error && typeof error === 'object' && !(error as any).isCancelled) {
            return <div className="error">{prepareQueryError(error)}</div>;
        }

        if (!data || isColumnEntityType(type)) {
            return i18n('no-data');
        }

        return (
            <ResizeableDataTable
                columnsWidthLSKey={TOP_SHARDS_COLUMNS_WIDTH_LS_KEY}
                columns={tableColumns}
                data={data}
                settings={TABLE_SETTINGS}
                onSort={onSort}
                sortOrder={stringToDataTableSortOrder(sortOrder)}
            />
        );
    };

    return (
        <TableWithControlsLayout>
            <TableWithControlsLayout.Controls>{renderControls()}</TableWithControlsLayout.Controls>

            {filters.mode === EShardsWorkloadMode.History && (
                <div className={b('hint')}>{i18n('description')}</div>
            )}

            <TableWithControlsLayout.Table loading={loading}>
                {renderContent()}
            </TableWithControlsLayout.Table>
        </TableWithControlsLayout>
    );
};
