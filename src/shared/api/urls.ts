import AppConfig from "appConfig";
import {buildUrl, QueryParams} from 'build-url';

export type BuildUrlParams = {path:string, queryParams?:QueryParams, hash?:string};

export function buildCBioPortalUrl(params:BuildUrlParams):string;
export function buildCBioPortalUrl(path:string, queryParams?:QueryParams, hash?:string):string;
export function buildCBioPortalUrl(pathOrParams:string | BuildUrlParams, queryParams?:QueryParams, hash?:string) {
    let params = typeof pathOrParams === 'string' ? {path: pathOrParams, queryParams, hash} : pathOrParams;
    return buildUrl(`${window.location.protocol}//${AppConfig.host}`, params);
}

const url = buildCBioPortalUrl;

export function getCbioPortalApiUrl() {
    return url('api');
}
export function getStudyViewUrl(studyId:string) {
    return url('study', {id: studyId});
}
export function getStudySummaryUrl(studyId:string) {
    return url('study', {id: studyId}, 'summary');
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
