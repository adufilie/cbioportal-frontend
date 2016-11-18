import * as SeamlessImmutable from "seamless-immutable";
import {routerReducer, combineReducers} from "redux-seamless-immutable";
import {default as clinicalInformation, ClinicalInformationData} from "../pages/patientView/clinicalInformation/Connector";
import {default as query, QueryData} from "../pages/home/query/Connector";
import {Connector} from "../shared/lib/ConnectorAPI";
import {Reducer} from "redux";
import Action = Redux.Action;
//import customRoutingReducer from './customRouterReducer';

// Require your modules here
const modules:{[name:string]:Connector<any, any, any, any>} = {
    clinicalInformation,
    query,
};

// Add state nodes corresponding to your modules here
export type RootState = {
    clinicalInformation: ClinicalInformationData,
    query: QueryData
}

export const actions = {};

export const reducers:{[actionName:string]:Reducer<any>} = { routing: routerReducer };

for (let key in modules)
{
    let module = modules[key];
    let initialState = SeamlessImmutable.from(module.initialState);
    reducers[key] = function(state = initialState, action?:Action) {
        return action ? module.reducer(state, action) : state;
    };
}

export const rootReducer = combineReducers(reducers);
