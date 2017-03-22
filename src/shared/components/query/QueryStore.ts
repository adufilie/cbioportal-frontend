import * as _ from 'lodash';
import client from "../../api/cbioportalClientInstance";
import {ObservableMap, toJS, observable, reaction, action, computed, whyRun, expr} from "mobx";
import {TypeOfCancer as CancerType, GeneticProfile, CancerStudy, SampleList, Gene} from "../../api/generated/CBioPortalAPI";
import CancerStudyTreeData from "./CancerStudyTreeData";
import StudyListLogic from "../StudyList/StudyListLogic";
import {remoteData} from "../../api/remoteData";
import {labelMobxPromises, cached, debounceAsync} from "mobxpromise";
import internalClient from "../../api/cbioportalInternalClientInstance";
import oql_parser from "../../lib/oql/oql-parser";
import {SyntaxError} from "../../lib/oql/oql-parser";
import memoize from "memoize-weak-decorator";
import AppConfig from 'appConfig';
import {getSubmitQueryUrl} from "../../api/urls";
import {gsUploadByGet} from "../../api/genomespace/gsuploadwindow";
import {OQLQuery} from "../../lib/oql/oql-parser";
import {ComponentGetsStoreContext} from "../../lib/ContextUtils";

export type GeneReplacement = {alias: string, genes: Gene[]};

function isInteger(str:string)
{
	return Number.isInteger(Number(str));
}

function normalizeQuery(geneQuery:string)
{
	return geneQuery.replace(/^\s+|\s+$/g, '').replace(/ +/g, ' ').toUpperCase();
}

export type QueryParams = Pick<
	QueryStore,
	'searchText' |
	'selectedStudyIds' |
	'dataTypePriority' |
	'selectedProfileIds' |
	'zScoreThreshold' |
	'rppaScoreThreshold' |
	'selectedSampleListId' |
	'caseIds' |
	'caseIdsMode' |
	'geneQuery'
>;
export const QueryParamsKeys:(keyof QueryParams)[] = [
	'searchText',
	'selectedStudyIds',
	'dataTypePriority',
	'selectedProfileIds',
	'zScoreThreshold',
	'rppaScoreThreshold',
	'selectedSampleListId',
	'caseIds',
	'caseIdsMode',
	'geneQuery',
];

// mobx observable
export class QueryStore
{
	constructor()
	{
		labelMobxPromises(this);
	}

	copyFrom(other:QueryParams)
	{
		// download tab does not appear anywhere except home page
		this.forDownloadTab = false;

		for (let key of QueryParamsKeys)
			this[key] = other[key];
	}

	@computed get stateToSerialize()
	{
		return _.pick(this, QueryParamsKeys);
	}

	////////////////////////////////////////////////////////////////////////////////
	// QUERY PARAMETERS
	////////////////////////////////////////////////////////////////////////////////

	@observable forDownloadTab:boolean = false;

	@observable transposeDataMatrix = false;

	@observable searchText:string = '';

	@observable.ref selectedStudyIds:ReadonlyArray<string> = [];

	@observable dataTypePriority = {mutation: true, cna: true};

	// genetic profile ids
	@observable.ref private _selectedProfileIds?:ReadonlyArray<string> = undefined; // user selection
	@computed get selectedProfileIds():ReadonlyArray<string>
	{
		let selectedIds;

		if (this._selectedProfileIds !== undefined)
		{
			selectedIds = this._selectedProfileIds;
		}
		else
		{
			// compute default selection
			const altTypes:GeneticProfile['geneticAlterationType'][] = [
				'MUTATION_EXTENDED',
				'COPY_NUMBER_ALTERATION',
			];
			selectedIds = [];
			for (let altType of altTypes)
			{
				let profiles = this.getFilteredProfiles(altType);
				if (profiles.length)
					selectedIds.push(profiles[0].geneticProfileId);
			}
		}

		// download tab only allows one selected profile
		if (this.forDownloadTab)
			return selectedIds.slice(0, 1);

		// query tab only allows selecting profiles with showProfileInAnalysisTab=true
		return selectedIds.filter(id => {
			let profile = this.dict_geneticProfileId_geneticProfile[id];
			return profile && profile.showProfileInAnalysisTab;
		});
	}
	set selectedProfileIds(value)
	{
		this._selectedProfileIds = value;
	}

	@observable zScoreThreshold:string = '2.0';

	@observable rppaScoreThreshold:string = '2.0';

	// sample list id
	@observable private _selectedSampleListId?:string = undefined; // user selection
	@computed get selectedSampleListId()
	{
		if (this._selectedSampleListId !== undefined)
			return this._selectedSampleListId;

		// compute default selection
		let studyId = this.singleSelectedStudyId;
		if (!studyId)
			return undefined;

		let mutSelect = this.getSelectedProfileIdFromGeneticAlterationType('MUTATION_EXTENDED');
		let cnaSelect = this.getSelectedProfileIdFromGeneticAlterationType('COPY_NUMBER_ALTERATION');
		let expSelect = this.getSelectedProfileIdFromGeneticAlterationType('MRNA_EXPRESSION');
		let rppaSelect = this.getSelectedProfileIdFromGeneticAlterationType('PROTEIN_LEVEL');
		let sampleListId = studyId + "_all";

		if (mutSelect && cnaSelect && !expSelect && !rppaSelect)
			sampleListId = studyId + "_cnaseq";
		else if (mutSelect && !cnaSelect && !expSelect && !rppaSelect)
			sampleListId = studyId + "_sequenced";
		else if (!mutSelect && cnaSelect && !expSelect && !rppaSelect)
			sampleListId = studyId + "_acgh";
		else if (!mutSelect && !cnaSelect && expSelect && !rppaSelect)
		{
			if (this.isProfileSelected(studyId + '_mrna_median_Zscores'))
				sampleListId = studyId + "_mrna";
			else if (this.isProfileSelected(studyId + '_rna_seq_mrna_median_Zscores'))
				sampleListId = studyId + "_rna_seq_mrna";
			else if (this.isProfileSelected(studyId + '_rna_seq_v2_mrna_median_Zscores'))
				sampleListId = studyId + "_rna_seq_v2_mrna";
		}
		else if ((mutSelect || cnaSelect) && expSelect && !rppaSelect)
			sampleListId = studyId + "_3way_complete";
		else if (!mutSelect && !cnaSelect && !expSelect && rppaSelect)
			sampleListId = studyId + "_rppa";

		// BEGIN HACK if not found
		if (!this.dict_sampleListId_sampleList[sampleListId])
		{
			if (sampleListId === studyId + '_cnaseq')
				sampleListId = studyId + '_cna_seq';
			else if (sampleListId === studyId + "_3way_complete")
				sampleListId = studyId + "_complete";

		}
		// END HACK

		// if still not found
		if (!this.dict_sampleListId_sampleList[sampleListId])
			sampleListId = studyId + '_all';

		return sampleListId;
	}
	set selectedSampleListId(value)
	{
		this._selectedSampleListId = value;
	}

	@observable caseIds = '';

	@observable caseIdsMode:'sample'|'patient' = 'sample';

	@observable _geneQuery = '';
	get geneQuery()
	{
		return this._geneQuery;
	}
	set geneQuery(value:string)
	{
		// clear error when gene query is modified
		this.geneQueryErrorDisplayStatus = 'unfocused';
		this._geneQuery = value;
	}

	////////////////////////////////////////////////////////////////////////////////
	// VISUAL OPTIONS
	////////////////////////////////////////////////////////////////////////////////

	@observable geneQueryErrorDisplayStatus:'unfocused'|'shouldFocus'|'focused' = 'unfocused';
	@observable showMutSigPopup = false;
	@observable showGisticPopup = false;
	@observable.ref searchTextPresets:ReadonlyArray<string> = AppConfig.cancerStudySearchPresets;
	@observable priorityStudies = AppConfig.priorityStudies;
	@observable showSelectedStudiesOnly:boolean = false;
	@observable.shallow selectedCancerTypeIds:string[] = [];
	@observable clickAgainToDeselectSingle:boolean = true;
	@observable submitError = '';

	@observable private _maxTreeDepth:number = 3;
	@computed get maxTreeDepth()
	{
		return this.forDownloadTab ? 1 : this._maxTreeDepth;
	}
	set maxTreeDepth(value)
	{
		this._maxTreeDepth = value;
	}


	////////////////////////////////////////////////////////////////////////////////
	// REMOTE DATA
	////////////////////////////////////////////////////////////////////////////////

	readonly cancerTypes = remoteData(client.getAllCancerTypesUsingGET({}), []);

	readonly cancerStudies = remoteData(client.getAllStudiesUsingGET({}), []);

	readonly geneticProfiles = remoteData<GeneticProfile[]>({
		invoke: async () => {
			if (!this.singleSelectedStudyId)
				return [];
			return await client.getAllGeneticProfilesInStudyUsingGET({
				studyId: this.singleSelectedStudyId
			});
		},
		default: [],
		reaction: () => this._selectedProfileIds = undefined
	});

	readonly sampleLists = remoteData({
		invoke: async () => {
			if (!this.singleSelectedStudyId)
				return [];
			let sampleLists = await client.getAllSampleListsInStudyUsingGET({
				studyId: this.singleSelectedStudyId,
				projection: 'DETAILED'
			});
			return _.sortBy(sampleLists, sampleList => sampleList.name);
		},
		default: [],
		reaction: () => this._selectedSampleListId = undefined
	});

	readonly mutSigForSingleStudy = remoteData({
		invoke: async () => {
			if (!this.singleSelectedStudyId)
				return [];
			return await internalClient.getSignificantlyMutatedGenesUsingGET({
				studyId: this.singleSelectedStudyId
			});
		},
		default: []
	});

	readonly gisticForSingleStudy = remoteData({
		invoke: async () => {
			if (!this.singleSelectedStudyId)
				return [];
			return await internalClient.getSignificantCopyNumberRegionsUsingGET({
				studyId: this.singleSelectedStudyId
			});
		},
		default: []
	});

	readonly genes = remoteData({
		invoke: () => this.invokeGenesLater(this.geneIds),
		default: {found: [], suggestions: []}
	});

	private invokeGenesLater = debounceAsync(
		async (geneIds:string[]):Promise<{found: Gene[], suggestions: GeneReplacement[]}> =>
		{
			let [entrezIds, hugoIds] = _.partition(_.uniq(geneIds), isInteger);

			let getEntrezResults = async () => {
				let found:Gene[];
				if (entrezIds.length)
					found = await client.fetchGenesUsingPOST({geneIdType: "ENTREZ_GENE_ID", geneIds: entrezIds});
				else
					found = [];
				let missingIds = _.difference(entrezIds, found.map(gene => gene.entrezGeneId + ''));
				let removals = missingIds.map(entrezId => ({alias: entrezId, genes: []}));
				let replacements = found.map(gene => ({alias: gene.entrezGeneId + '', genes: [gene]}));
				let suggestions = [...removals, ...replacements];
				return {found, suggestions};
			};

			let getHugoResults = async () => {
				let found:Gene[];
				if (hugoIds.length)
					found = await client.fetchGenesUsingPOST({geneIdType: "HUGO_GENE_SYMBOL", geneIds: hugoIds});
				else
					found = [];
				let missingIds = _.difference(hugoIds, found.map(gene => gene.hugoGeneSymbol));
				let suggestions = await Promise.all(missingIds.map(alias => this.getGeneSuggestions(alias)));
				return {found, suggestions};
			};

			let [entrezResults, hugoResults] = await Promise.all([getEntrezResults(), getHugoResults()]);
			return {
				found: [...entrezResults.found, ...hugoResults.found],
				suggestions: [...entrezResults.suggestions, ...hugoResults.suggestions]
			};
		},
		500
	);

	@memoize
	async getGeneSuggestions(alias:string):Promise<GeneReplacement>
	{
		return {
			alias,
			genes: await client.getAllGenesUsingGET({alias})
		};
	}


	////////////////////////////////////////////////////////////////////////////////
	// DERIVED DATA
	////////////////////////////////////////////////////////////////////////////////

	// CANCER STUDY

	@cached get treeData()
	{
		return new CancerStudyTreeData({
			cancerTypes: this.cancerTypes.result,
			studies: this.cancerStudies.result,
			priorityStudies: this.priorityStudies,
		});
	}

	@cached get studyListLogic()
	{
		// temporary hack - dependencies
		// TODO review StudyListLogic code
		this.treeData;
		this.maxTreeDepth;
		this.searchText;
		this.selectedCancerTypeIds;
		this.selectedStudyIds;
		this.showSelectedStudiesOnly;

		return new StudyListLogic(this);
	}

	@computed get singleSelectedStudyId()
	{
		return this.selectedStudyIds.length == 1 ? this.selectedStudyIds[0] : undefined;
	}

	@computed get selectedStudies()
	{
		return this.selectedStudyIds.map(id => this.treeData.map_studyId_cancerStudy.get(id));
	}

	@computed get selectedStudies_totalSampleCount()
	{
		return this.selectedStudies.reduce((sum:number, study:CancerStudy) => sum + study.allSampleCount, 0);
	}

	// DATA TYPE PRIORITY

	@computed get dataTypePriorityCode():'0'|'1'|'2'
	{
		let {mutation, cna} = this.dataTypePriority;
		if (mutation && cna)
			return '0';
		if (mutation)
			return '1';
		if (cna)
			return '2';

		return '0';
	}

	// GENETIC PROFILE

	@computed get dict_geneticProfileId_geneticProfile():_.Dictionary<GeneticProfile | undefined>
	{
		return _.keyBy(this.geneticProfiles.result, profile => profile.geneticProfileId);
	}

	getFilteredProfiles(geneticAlterationType:GeneticProfile['geneticAlterationType'])
	{
		return this.geneticProfiles.result.filter(profile => {
			if (profile.geneticAlterationType != geneticAlterationType)
				return false;

			return profile.showProfileInAnalysisTab || this.forDownloadTab;
		});
	}

	isProfileSelected(geneticProfileId:string)
	{
		return _.includes(this.selectedProfileIds, geneticProfileId);
	}

	getSelectedProfileIdFromGeneticAlterationType(geneticAlterationType:GeneticProfile['geneticAlterationType']):string
	{
		for (let profileId of this.selectedProfileIds)
		{
			let profile = this.dict_geneticProfileId_geneticProfile[profileId];
			if (profile && profile.geneticAlterationType == geneticAlterationType)
				return profile.geneticProfileId;
		}
		return '';
	}

	// SAMPLE LIST

	@computed get dict_sampleListId_sampleList():_.Dictionary<SampleList | undefined>
	{
		return _.keyBy(this.sampleLists.result, sampleList => sampleList.sampleListId);
	}

	// GENES

	@computed get oql()
	{
		try
		{
			let geneQuery = this.geneQuery;
			return {
				query: geneQuery && oql_parser.parse(geneQuery) || [],
				error: undefined
			};
		}
		catch ({offset})
		{
			let near, start, end;
			if (offset === this.geneQuery.length)
				[near, start, end] = ['after', offset - 1, offset];
			else if (offset === 0)
				[near, start, end] = ['before', offset, offset + 1];
			else
				[near, start, end] = ['at', offset, offset + 1];
			let message = `OQL syntax error ${near} selected character; please fix and submit again.`;
			return {
				query: [] as OQLQuery,
				error: {start, end, message}
			};
		}
	}

	@computed get geneIds():string[]
	{
		try
		{
			return this.oql.query.map(line => line.gene).filter(gene => gene && gene !== 'DATATYPES') as string[];
		}
		catch (e)
		{
			return [];
		}
	}

	// SUBMIT

	@computed get submitQueryUrl()
	{
		let studyIds = this.selectedStudyIds;
		if (!studyIds.length)
			this.cancerStudies.result.map(study => study.studyId);

		return getSubmitQueryUrl({
			cancer_study_list: studyIds,
			cancer_study_id: this.singleSelectedStudyId || 'all',
			genetic_profile_ids_PROFILE_MUTATION_EXTENDED: this.getSelectedProfileIdFromGeneticAlterationType("MUTATION_EXTENDED"),
			genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION: this.getSelectedProfileIdFromGeneticAlterationType("COPY_NUMBER_ALTERATION"),
			genetic_profile_ids_PROFILE_MRNA_EXPRESSION: this.getSelectedProfileIdFromGeneticAlterationType("MRNA_EXPRESSION"),
			genetic_profile_ids_PROFILE_METHYLATION: this.getSelectedProfileIdFromGeneticAlterationType("METHYLATION") || this.getSelectedProfileIdFromGeneticAlterationType("METHYLATION_BINARY"),
			genetic_profile_ids_PROFILE_PROTEIN_EXPRESSION: this.getSelectedProfileIdFromGeneticAlterationType("PROTEIN_LEVEL"),
			Z_SCORE_THRESHOLD: this.zScoreThreshold,
			RPPA_SCORE_THRESHOLD: this.rppaScoreThreshold,
			data_priority: this.dataTypePriorityCode,
			case_set_id: this.selectedSampleListId || '',
			case_ids: this.caseIds,
			patient_case_select: this.caseIdsMode,
			gene_set_choice: 'user-defined-list',
			gene_list: this.geneQuery,
			clinical_param_selection: '',
			tab_index: this.forDownloadTab ? 'tab_download' : 'tab_visualize',
			Action: 'Submit',
		});
	}

	private readonly dict_geneticAlterationType_filenameSuffix:{[K in GeneticProfile['geneticAlterationType']]?: string} = {
		"MUTATION_EXTENDED": 'mutations',
		"COPY_NUMBER_ALTERATION": 'cna',
		"MRNA_EXPRESSION": 'mrna',
		"METHYLATION": 'methylation',
		"METHYLATION_BINARY": 'methylation',
		"PROTEIN_LEVEL": 'rppa',
	};

	@computed get downloadDataFilename()
	{
		let study = this.singleSelectedStudyId && this.treeData.map_studyId_cancerStudy.get(this.singleSelectedStudyId);
		let profile = this.dict_geneticProfileId_geneticProfile[this.selectedProfileIds[0] as string];

		if (!this.forDownloadTab || !study || !profile)
			return 'cbioportal-data.txt';

		let suffix = this.dict_geneticAlterationType_filenameSuffix[profile.geneticAlterationType] || profile.geneticAlterationType.toLowerCase();
		return `cbioportal-${study.studyId}-${suffix}.txt`;
	}

	////////////////////////////////////////////////////////////////////////////////
	// ACTIONS
	////////////////////////////////////////////////////////////////////////////////

	@action selectCancerType(cancerType:CancerType, multiSelect?:boolean)
	{
		let clickedCancerTypeId = cancerType.cancerTypeId;

		if (multiSelect)
		{
			if (_.includes(this.selectedCancerTypeIds, clickedCancerTypeId))
				this.selectedCancerTypeIds = _.difference(this.selectedCancerTypeIds, [clickedCancerTypeId]);
			else
				this.selectedCancerTypeIds = _.union(this.selectedCancerTypeIds, [clickedCancerTypeId]);
		}
		else if (this.clickAgainToDeselectSingle && _.isEqual(toJS(this.selectedCancerTypeIds), [clickedCancerTypeId]))
		{
			this.selectedCancerTypeIds = [];
		}
		else
		{
			this.selectedCancerTypeIds = [clickedCancerTypeId];
		}
	}

	@action selectGeneticProfile(profile:GeneticProfile, checked:boolean)
	{
		let groupProfiles = this.getFilteredProfiles(profile.geneticAlterationType);
		let groupProfileIds = groupProfiles.map(profile => profile.geneticProfileId);
		if (this.forDownloadTab)
		{
			// download tab only allows a single selection
			this._selectedProfileIds = [profile.geneticProfileId];
		}
		else
		{
			let difference = _.difference(this.selectedProfileIds, groupProfileIds);
			if (checked)
				this._selectedProfileIds = _.union(difference, [profile.geneticProfileId]);
			else
				this._selectedProfileIds = difference;
		}
	}

	@action replaceGene(oldSymbol:string, newSymbol:string)
	{
		this.geneQuery = normalizeQuery(this.geneQuery.toUpperCase().replace(new RegExp(`\\b${oldSymbol.toUpperCase()}\\b`, 'g'), () => newSymbol.toUpperCase()));
	}

	@action applyGeneSelection(map_geneSymbol_selected:ObservableMap<boolean>)
	{
		let [toAppend, toRemove] = _.partition(map_geneSymbol_selected.keys(), geneSymbol => map_geneSymbol_selected.get(geneSymbol));
		toAppend = _.difference(toAppend, this.geneIds);
		toRemove = _.intersection(toRemove, this.geneIds);
		for (let geneSymbol of toRemove)
			this.replaceGene(geneSymbol, '');
		this.geneQuery = normalizeQuery([this.geneQuery, ...toAppend].join(' '));
	}

	@action submit()
	{
		if (this.oql.error)
		{
			this.geneQueryErrorDisplayStatus = 'shouldFocus';
			return;
		}

		let haveExpInQuery = this.oql.query.some(result => {
			return (result.alterations || []).some(alt => alt.alteration_type === 'exp');
		});

		if (this.singleSelectedStudyId)
		{
			let expProfileSelected = this.selectedProfileIds.some(id => {
				let profile = this.dict_geneticProfileId_geneticProfile[id];
				return !!profile && profile.geneticAlterationType === 'MRNA_EXPRESSION';
			});
			if (haveExpInQuery && !expProfileSelected)
			{
				this.submitError = "Expression specified in the list of genes, but not selected in the Genetic Profile Checkboxes.";
				return;
			}
		}
		else if (haveExpInQuery)
		{
			this.submitError = "Expression filtering in the gene list is not supported when doing cross cancer queries.";
			return;
		}

		window.location.href = this.submitQueryUrl;
	}

	@action uploadToGenomeSpace()
	{
		// if (!validDownloadDataForm(this))
		// 	return;

		gsUploadByGet({
			url: this.submitQueryUrl,
			filename: this.downloadDataFilename,
			successCallback: savePath => alert('outer Saved to GenomeSpace as ' + savePath),
			errorCallback: savePath => alert('outer ERROR saving to GenomeSpace as ' + savePath),
		});
	}
}

export const QueryStoreComponent = ComponentGetsStoreContext(QueryStore);
