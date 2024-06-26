import type {TACE, TMetaInfo} from '../../../types/api/acl';
import type {IResponseError} from '../../../types/api/error';
import type {ApiRequestAction} from '../../utils';

import type {FETCH_SCHEMA_ACL, setAclWasNotLoaded} from './schemaAcl';

export interface SchemaAclState {
    loading: boolean;
    wasLoaded: boolean;
    acl?: TACE[];
    owner?: string;
    error?: IResponseError;
}

export type SchemaAclAction =
    | ApiRequestAction<typeof FETCH_SCHEMA_ACL, TMetaInfo, IResponseError>
    | ReturnType<typeof setAclWasNotLoaded>;
