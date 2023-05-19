import {combineReducers} from 'redux';

import nodes from './nodes';
import cluster from './cluster/cluster';
import tenant from './tenant';
import storage from './storage';
import node from './node';
import tooltip from './tooltip';
import tablets from './tablets';
import heatmap from './heatmap';
import schema from './schema';
import host from './host';
import network from './network';
import tenants from './tenants/tenants';
import tablet from './tablet';
import topic from './topic';
import partitions from './partitions/partitions';
import executeQuery from './executeQuery';
import explainQuery from './explainQuery';
import tabletsFilters from './tabletsFilters';
import settings from './settings';
import preview from './preview';
import nodesList from './nodesList';
import describe from './describe';
import schemaAcl from './schemaAcl';
import executeTopQueries from './executeTopQueries';
import healthcheckInfo from './healthcheckInfo';
import shardsWorkload from './shardsWorkload';
import hotKeys from './hotKeys';
import olapStats from './olapStats';
import authentication from './authentication';
import header from './header';
import saveQuery from './saveQuery';
import fullscreen from './fullscreen';
import singleClusterMode from './singleClusterMode';

export const rootReducer = {
    singleClusterMode,
    nodes,
    cluster,
    tenant,
    storage,
    node,
    tooltip,
    tablets,
    schema,
    olapStats,
    host,
    network,
    tenants,
    tablet,
    topic,
    partitions,
    executeQuery,
    explainQuery,
    tabletsFilters,
    heatmap,
    settings,
    preview,
    nodesList,
    describe,
    schemaAcl,
    executeTopQueries,
    healthcheckInfo,
    shardsWorkload,
    hotKeys,
    authentication,
    header,
    saveQuery,
    fullscreen,
};

const combinedReducer = combineReducers({
    ...rootReducer,
});

export type RootReducer = typeof combinedReducer;
export type RootState = ReturnType<RootReducer>;
export type GetState = () => RootState;

export default combinedReducer;
