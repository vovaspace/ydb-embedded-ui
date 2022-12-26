import {useCallback, useEffect, useRef, useState} from 'react';
import {useDispatch} from 'react-redux';
import cn from 'bem-cn-lite';

import DataTable, {Column} from '@yandex-cloud/react-data-table';
import {Loader} from '@gravity-ui/uikit';

import {DateRange, DateRangeValues} from '../../../../components/DateRange';
import TruncatedQuery from '../../../../components/TruncatedQuery/TruncatedQuery';

import {changeUserInput} from '../../../../store/reducers/executeQuery';
import {
    fetchTopQueries,
    setTopQueriesFilters,
    setTopQueriesState,
} from '../../../../store/reducers/executeTopQueries';

import type {KeyValueRow} from '../../../../types/api/query';
import type {EPathType} from '../../../../types/api/schema';
import type {ITopQueriesFilters} from '../../../../types/store/executeTopQueries';
import type {IQueryResult} from '../../../../types/store/query';

import {DEFAULT_TABLE_SETTINGS, HOUR_IN_SECONDS} from '../../../../utils/constants';
import {useAutofetcher, useTypedSelector} from '../../../../utils/hooks';
import {prepareQueryError} from '../../../../utils/query';

import {isColumnEntityType} from '../../utils/schema';
import {TenantGeneralTabsIds} from '../../TenantPages';

import i18n from './i18n';
import './TopQueries.scss';

const b = cn('kv-top-queries');

const MAX_QUERY_HEIGHT = 10;
const COLUMNS: Column<KeyValueRow>[] = [
    {
        name: 'CPUTimeUs',
        width: 140,
        sortAccessor: (row) => Number(row['CPUTimeUs']),
    },
    {
        name: 'QueryText',
        width: 500,
        sortable: false,
        render: ({value}) => <TruncatedQuery value={value} maxQueryHeight={MAX_QUERY_HEIGHT} />,
    },
];

interface TopQueriesProps {
    path: string;
    changeSchemaTab: (tab: TenantGeneralTabsIds) => void;
    type?: EPathType;
}

export const TopQueries = ({path, type, changeSchemaTab}: TopQueriesProps) => {
    const dispatch = useDispatch();

    const {autorefresh} = useTypedSelector((state) => state.schema);

    const {
        loading,
        wasLoaded,
        error,
        data: {result: data = undefined} = {},
        filters: storeFilters,
    } = useTypedSelector((state) => state.executeTopQueries);

    const preventFetch = useRef(false);

    // filters sync between redux state and URL
    // component state is for default values,
    // default values are determined from the query response, and should not propagate to URL
    const [dateRangeFilters, setDateRangeFilters] = useState<ITopQueriesFilters>(storeFilters);

    useEffect(() => {
        dispatch(setTopQueriesFilters(dateRangeFilters));
    }, [dispatch, dateRangeFilters]);

    const setDefaultFiltersFromResponse = (responseData?: IQueryResult) => {
        const intervalEnd = responseData?.result?.[0]?.IntervalEnd;

        if (intervalEnd) {
            const to = new Date(intervalEnd).getTime();
            const from = new Date(to - HOUR_IN_SECONDS * 1000).getTime();

            setDateRangeFilters((currentFilters) => {
                // request without filters returns the latest interval with data
                // only in this case should update filters in ui
                // also don't update if user already interacted with controls
                const shouldUpdateFilters = !currentFilters.from && !currentFilters.to;

                if (!shouldUpdateFilters) {
                    return currentFilters;
                }

                preventFetch.current = true;

                return {...currentFilters, from, to};
            });
        }
    };

    useAutofetcher(
        (isBackground) => {
            if (preventFetch.current) {
                preventFetch.current = false;
                return;
            }

            if (!isBackground) {
                dispatch(
                    setTopQueriesState({
                        wasLoaded: false,
                        data: undefined,
                    }),
                );
            }

            // @ts-expect-error
            // typed dispatch required, remove error expectation after adding it
            dispatch(fetchTopQueries({database: path, filters: dateRangeFilters})).then(
                setDefaultFiltersFromResponse,
            );
        },
        [dispatch, dateRangeFilters, path],
        autorefresh,
    );

    const handleRowClick = useCallback(
        (row) => {
            const {QueryText: input} = row;

            dispatch(changeUserInput({input}));
            changeSchemaTab(TenantGeneralTabsIds.query);
        },
        [changeSchemaTab, dispatch],
    );

    const handleDateRangeChange = (value: DateRangeValues) => {
        setDateRangeFilters((currentFilters) => ({...currentFilters, ...value}));
    };

    const renderLoader = () => {
        return (
            <div className={b('loader')}>
                <Loader size="m" />
            </div>
        );
    };

    const renderContent = () => {
        if (loading && !wasLoaded) {
            return renderLoader();
        }

        if (error && !error.isCancelled) {
            return <div className="error">{prepareQueryError(error)}</div>;
        }

        if (!data || isColumnEntityType(type)) {
            return i18n('no-data');
        }

        return (
            <div className={b('result')}>
                <DataTable
                    columns={COLUMNS}
                    data={data}
                    settings={DEFAULT_TABLE_SETTINGS}
                    onRowClick={handleRowClick}
                    theme="yandex-cloud"
                />
            </div>
        );
    };

    return (
        <div className={b()}>
            <div className={b('controls')}>
                <DateRange
                    from={dateRangeFilters.from}
                    to={dateRangeFilters.to}
                    onChange={handleDateRangeChange}
                />
            </div>
            {renderContent()}
        </div>
    );
};