import AppConfig from "appConfig";
import {default as buildUrl, QueryParams} from 'build-url';

function url(path:string, queryParams?:QueryParams, hash?:string) {
    return buildUrl(`${window.location.protocol}//${AppConfig.host}`, {path, queryParams, hash});
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
    genetic_profile_ids_PROFILE_MUTATION_EXTENDED: string,
    genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION: string,
    genetic_profile_ids_PROFILE_MRNA_EXPRESSION: string,
    genetic_profile_ids_PROFILE_METHYLATION: string,
    genetic_profile_ids_PROFILE_PROTEIN_EXPRESSION: string,
    Z_SCORE_THRESHOLD: string,
    RPPA_SCORE_THRESHOLD: string,
    data_priority: '0'|'1'|'2',
    case_set_id: string,
    case_ids: string,
    patient_case_select: 'sample'|'patient',
    gene_set_choice: 'user-defined-list',
    gene_list: string,
    clinical_param_selection: '',
    tab_index: 'tab_download'|'tab_visualize',
    Action: 'Submit',
};
export function getSubmitQueryUrl(params:SubmitQueryUrlParams) {
    if (!params.gene_list)
        params = {...params, gene_list: ' '};

    if (params.cancer_study_list.length > 1)
        return url(
            'cross_cancer.do',
            {
                ...params,
                cancer_study_list: '',
                cancer_study_id: 'all',
            },
            `crosscancer/overview/${
                params.data_priority
            }/${
                encodeURIComponent(params.gene_list)
            }/${
                encodeURIComponent(params.cancer_study_list.join(','))
            }`
        );

    return url('index.do', params);
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
