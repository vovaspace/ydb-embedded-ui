import type {Dispatch, Reducer, Selector} from '@reduxjs/toolkit';
import {createSelector} from '@reduxjs/toolkit';

import {isEntityWithMergedImplementation} from '../../../containers/Tenant/utils/schema';
import {settingsManager} from '../../../services/settings';
import type {EPathType} from '../../../types/api/schema';
import {AUTO_REFRESH_INTERVAL} from '../../../utils/constants';
import {createApiRequest, createRequestActionTypes} from '../../utils';

import type {
    SchemaAction,
    SchemaData,
    SchemaHandledResponse,
    SchemaState,
    SchemaStateSlice,
} from './types';

export const FETCH_SCHEMA = createRequestActionTypes('schema', 'FETCH_SCHEMA');
const PRELOAD_SCHEMAS = 'schema/PRELOAD_SCHEMAS';
const SET_SCHEMA = 'schema/SET_SCHEMA';
const SET_SHOW_PREVIEW = 'schema/SET_SHOW_PREVIEW';
export const SET_AUTOREFRESH_INTERVAL = 'schema/SET_AUTOREFRESH_INTERVAL';
const RESET_LOADING_STATE = 'schema/RESET_LOADING_STATE';

const autoRefreshLS = Number(settingsManager.readUserSettingsValue(AUTO_REFRESH_INTERVAL, 0));

export const initialState = {
    loading: true,
    wasLoaded: false,
    data: {},
    currentSchemaPath: undefined,
    autorefresh: isNaN(autoRefreshLS) ? 0 : autoRefreshLS,
    showPreview: false,
};

const schema: Reducer<SchemaState, SchemaAction> = (state = initialState, action) => {
    switch (action.type) {
        case FETCH_SCHEMA.REQUEST: {
            return {
                ...state,
                loading: true,
            };
        }
        case FETCH_SCHEMA.SUCCESS: {
            const isCurrentSchema =
                !state.currentSchemaPath || state.currentSchemaPath === action.data.path;

            const newData = {...state.data, ...action.data.data};

            if (!isCurrentSchema) {
                return {
                    ...state,
                    data: newData,
                };
            }

            return {
                ...state,
                error: undefined,
                data: newData,
                currentSchema: action.data.currentSchema,
                currentSchemaPath: action.data.path,
                loading: false,
                wasLoaded: true,
            };
        }
        case FETCH_SCHEMA.FAILURE: {
            if (action.error?.isCancelled) {
                return state;
            }

            return {
                ...state,
                error: action.error,
                loading: false,
            };
        }
        case PRELOAD_SCHEMAS: {
            return {
                ...state,
                data: {
                    // we don't want to overwrite existing paths
                    ...action.data,
                    ...state.data,
                },
            };
        }
        case SET_SCHEMA: {
            return {
                ...state,
                currentSchemaPath: action.data,
            };
        }
        case SET_AUTOREFRESH_INTERVAL: {
            return {
                ...state,
                autorefresh: action.data,
            };
        }
        case SET_SHOW_PREVIEW: {
            return {
                ...state,
                showPreview: action.data,
            };
        }
        case RESET_LOADING_STATE: {
            return {
                ...state,
                wasLoaded: initialState.wasLoaded,
            };
        }
        default:
            return state;
    }
};

export function getSchema({path}: {path: string}) {
    const request = window.api.getSchema({path});
    return createApiRequest({
        request,
        actions: FETCH_SCHEMA,
        dataHandler: (data): SchemaHandledResponse => {
            const newData: SchemaData = {};
            if (data?.Path) {
                newData[data.Path] = data;
            }
            return {
                path: data?.Path,
                currentSchema: data ?? undefined,
                data: newData,
            };
        },
    });
}

export function setCurrentSchemaPath(currentSchemaPath: string) {
    return {
        type: SET_SCHEMA,
        data: currentSchemaPath,
    } as const;
}
export function setAutorefreshInterval(interval: number) {
    return (dispatch: Dispatch) => {
        settingsManager.setUserSettingsValue(AUTO_REFRESH_INTERVAL, interval);
        dispatch({
            type: SET_AUTOREFRESH_INTERVAL,
            data: interval,
        } as const);
    };
}
export function setShowPreview(value: boolean) {
    return {
        type: SET_SHOW_PREVIEW,
        data: value,
    } as const;
}

// only stores data for paths that are not in the store yet
// existing paths are ignored
export function preloadSchemas(data: SchemaData) {
    return {
        type: PRELOAD_SCHEMAS,
        data,
    } as const;
}

export function resetLoadingState() {
    return {
        type: RESET_LOADING_STATE,
    } as const;
}

const selectSchemaChildren = (state: SchemaStateSlice, path?: string) =>
    path ? state.schema.data[path]?.PathDescription?.Children : undefined;

export const selectSchemaData = (state: SchemaStateSlice, path?: string) =>
    path ? state.schema.data[path] : undefined;

export const selectSchemaMergedChildrenPaths: Selector<
    SchemaStateSlice,
    string[] | undefined,
    [string | undefined, EPathType | undefined]
> = createSelector(
    [
        (_, path?: string) => path,
        (_, _path, type: EPathType | undefined) => type,
        selectSchemaChildren,
    ],
    (path, type, children) => {
        return isEntityWithMergedImplementation(type)
            ? children?.map(({Name}) => path + '/' + Name)
            : undefined;
    },
);

export default schema;
