import * as _ from "lodash";
import * as React from "react";
import Connector, {QueryData, CANCER_TYPE_ROOT} from "./Connector";
import {TypeOfCancer, CancerStudy} from "../../../shared/api/CBioPortalAPI";
import Spinner from "react-spinkit";
import Dictionary = _.Dictionary;
import {memoize} from "../../../shared/api/DataCache";
import JSTree from "../../../shared/components/tree/JSTree";
import {ITreeDescriptor} from "../../../shared/components/tree/DescriptorTreeNode";

let _QueryData:QueryData = null as any;

export interface IQueryContainerProps {
    data?: QueryData,

    loadQueryData?: () => void,
}

type Node = TypeOfCancer|CancerStudy;

@Connector.decorator
export default class QueryContainer extends React.Component<IQueryContainerProps, {}>
{
    componentDidMount(){
        if (this.props.loadQueryData)
            this.props.loadQueryData();
    }

	@memoize
    getTreeDescriptor<T>(cancerTypes:TypeOfCancer[], studies:CancerStudy[]):ITreeDescriptor<TypeOfCancer|CancerStudy> & {rootNode: TypeOfCancer, setExpanded: (node:Node, value:boolean) => void} {
    	let dict_cancerTypeId_cancerType:Dictionary<TypeOfCancer|undefined> = _.keyBy(cancerTypes, cancerType => cancerType.typeOfCancerId);
    	let dict_cancerTypeId_childCancerTypes:Dictionary<TypeOfCancer[]|undefined> = _.groupBy(cancerTypes, cancerType => cancerType.parent);
    	let dict_cancerTypeId_childStudies:Dictionary<CancerStudy[]|undefined> = _.groupBy(studies, study => study.typeOfCancerId);
    	let dict_studyId_study:Dictionary<CancerStudy|undefined> = _.keyBy(studies, study => study.cancerStudyIdentifier);
    	let dict_cancerTypeId_expanded:Dictionary<boolean> = _.mapValues(dict_cancerTypeId_cancerType, cancerType => true);

    	let rootNode:TypeOfCancer = {
    		clinicalTrialKeywords: '',
    		dedicatedColor: '',
    		name: 'All',
    		parent: '',
    		shortName: 'All',
    		typeOfCancerId: CANCER_TYPE_ROOT
    	};
    	dict_cancerTypeId_cancerType[CANCER_TYPE_ROOT] = rootNode;

    	function isCancerType(node:TypeOfCancer|CancerStudy) {
    		return !(node as CancerStudy).cancerStudyIdentifier;
    	}

    	function filter(node:TypeOfCancer|CancerStudy):boolean {
    		let children = getChildren(node);
    		return !isCancerType(node) || (!!children && children.length > 0);
		}

		function isExpanded(node:Node) {
			return dict_cancerTypeId_expanded[node.typeOfCancerId];
		}

		function setExpanded(node:Node, value:boolean):void {
			dict_cancerTypeId_expanded[node.typeOfCancerId] = value;
		}

		function getChildren(node:Node):Node[]|undefined {
			if (!isCancerType(node))
				return undefined;

			let children:Node[] = dict_cancerTypeId_childCancerTypes[node.typeOfCancerId] || [];
			if (!children.length)
				children = dict_cancerTypeId_childStudies[node.typeOfCancerId] || [];
			return _.filter(children, filter);
		}

		function getContent(node:Node) {
			if (isCancerType(node)) {
				let cancerType = node as TypeOfCancer;
				return (
					cancerType.name
				);
			}
			else {
				let study = node as CancerStudy;
				return (
					<span style={{whiteSpace: 'nowrap'}}>
						{study.name} (<a href={`http://www.ncbi.nlm.nih.gov/pubmed/${study.pmid}`}>PubMed</a>)
					</span>
				);
			}
		}

    	return {
    		rootNode: rootNode,
    		isExpanded,
    		setExpanded,
    		getChildren,
    		getContent,
    	};
    }

    render() {
    	if (this.props.data && this.props.data.status == 'fetching')
    		return <Spinner/>;

		if (this.props.data && this.props.data.cancerTypes && this.props.data.studies) {
    		let treeDesc = this.getTreeDescriptor(this.props.data.cancerTypes, this.props.data.studies);
    		return <JSTree root={treeDesc.rootNode} descriptor={treeDesc} onExpand={treeDesc.setExpanded}/>;
		}

		return <span>No data</span>;
    }
}
