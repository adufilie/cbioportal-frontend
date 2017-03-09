import AppConfig from "appConfig";
import {QueryStore} from "../components/query/QueryStore";
import buildUrl from 'build-url';

function url(path:string, queryParams?:{[key:string]: undefined | string | ReadonlyArray<string>}, hash?:string) {
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
export function getSubmitQueryUrl(store:QueryStore)
{
    return url('index.do', {
        cancer_study_list: store.selectedStudyIds,
        cancer_study_id: store.singleSelectedStudyId,
        genetic_profile_ids_PROFILE_MUTATION_EXTENDED: '',
        data_priority: store.dataTypePriorityCode + '',
        case_set_id: store.selectedSampleListId,
        case_ids: store.caseIds,
        patient_case_select: store.caseIdsMode,
        gene_set_choice: 'user-defined-list',
        gene_list: store.geneQuery,
        clinical_param_selection: '',
        tab_index: store.forDownloadTab ? 'tab_download' : 'tab_visualize',
        Action: 'Submit',
    });
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
