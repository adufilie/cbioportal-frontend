import * as _ from 'lodash';
import {Dictionary} from 'lodash';
import {RootState} from "../../../redux/rootReducer";
import CBioPortalAPI, {TypeOfCancer, CancerStudy} from "../../../shared/api/CBioPortalAPI";
import {IDispatch, Connector} from "../../../shared/lib/ConnectorAPI";
import {IQueryContainerProps} from "./QueryContainer";

export const CANCER_TYPE_ROOT = 'tissue';

const FETCH:'query/fetch' = 'query/fetch';
const TREE_EXPAND:'query/treeExpand' = 'query/treeExpand';
export const actionTypes = {FETCH, TREE_EXPAND};

export type ActionTypes = (
    {type: typeof FETCH, status: 'fetching'}
    | {type: typeof FETCH, status: 'complete', payload: QueryData}
    | {type: typeof FETCH, status: 'error', error: Error}
    | {type: typeof TREE_EXPAND, expand: boolean, typeOfCancerId: string }
);

export type QueryData = {
	status?: 'fetching' | 'complete' | 'error',
    cancerTypes?: TypeOfCancer[],
    studies?: CancerStudy[],
};

const client = new CBioPortalAPI(`//${(window as any)['__API_ROOT__']}`);

export default new class QueryConnector extends Connector<RootState, QueryData, ActionTypes, IQueryContainerProps>
{
    initialState:QueryData = {
        status: 'fetching',
    };

    mapDispatchToProps = {
        loadQueryData: () => (dispatch:IDispatch<ActionTypes>) => { // this is a thunk
            dispatch({
                type: FETCH,
                status: 'fetching',
            });

            Promise.all([
				client.getAllCancerTypesUsingGET({}),
				client.getAllStudiesUsingGET({
					projection: "DETAILED"
				})
			]).then(
				([cancerTypes, studies]) => {
					dispatch({
						type: FETCH,
						status: 'complete',
						payload: {
							cancerTypes,
							studies
						}
					});
				},
				reason => dispatch({
					type: FETCH,
					status: 'error',
					error: reason
				})
			);
        }
    };

    mapStateToProps(state:RootState):IQueryContainerProps {
        return {data: state.query};
    }

    reducer(state:QueryData, action:ActionTypes) {
        switch (action.type) {
            case FETCH: {
                switch (action.status) {
                    case 'fetching':
                        return this.mergeState(state, {status: 'fetching'});

                    case 'complete':
                    	state = this.mergeState(state, {status: 'complete'});
                    	state = this.mergeState(state, action.payload);
                    	return state;

                    case 'error':
                        return this.mergeState(state, {status: 'error'});

                    default:
                        return state;
                }
            }
            default: {
                return state;
            }
        }
    }
};
