import AppConfig from "appConfig";
import {QueryStore} from "../components/query/QueryStore";
import {default as buildUrl, QueryParams} from 'build-url';

function url(path:string, queryParams?:QueryParams, hash?:string) {
    return buildUrl(`//${AppConfig.host}`, {path, queryParams, hash});
}

export function getCbioPortalApiUrl() {
    return url('api');
}
export function getStudyViewUrl(studyId:string) {
    return url('study', {id: studyId});
}
export function getStudySummaryUrl(studyId:string) {
    return url('study', {id: studyId}, 'summary');
}

type SubmitQueryUrlParams = {
    cancer_study_list: ReadonlyArray<string>,
    cancer_study_id: string,
    genetic_profile_ids_PROFILE_MUTATION_EXTENDED: '',
    data_priority: '0'|'1'|'2',
    case_set_id: string,
    case_ids: string,
    patient_case_select: 'sample' | 'patient',
    gene_set_choice: 'user-defined-list',
    gene_list: string,
    clinical_param_selection: '',
    tab_index: 'tab_download' | 'tab_visualize',
    Action: 'Submit',
};
export function getSubmitQueryUrl(path:'index.do' | 'crosscancer.do', params:SubmitQueryUrlParams) {
    return url(path, params);
}

export function getPubMedUrl(pmid:string) {
    return `http://www.ncbi.nlm.nih.gov/pubmed/${pmid}`;
}
export function getOncoQueryDocUrl() {
    return url('onco_query_lang_desc.jsp');
}
export function getHotspotsApiUrl() {
    return url('proxy/cancerhotspots.org');
}
export function getHotspots3DApiUrl() {
    return url('proxy/3dhotspots.org/3d');
}
export function getOncoKbApiUrl() {
    return url('proxy/oncokb.org/api/v1');
}
export function getTissueImageCheckUrl(filter:string) {
    return url('proxy/cancer.digitalslidearchive.net/local_php/get_slide_list_from_db_groupid_not_needed.php', {
        slide_name_filter: filter
    });
}
