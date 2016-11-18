import * as _ from 'lodash';
import * as React from 'react';
import CBioPortalAPI from "../../shared/api/CBioPortalAPI";
import {CancerStudy} from "../../shared/api/CBioPortalAPI";
import {TypeOfCancer} from "../../shared/api/CBioPortalAPI";
import {Dictionary} from "lodash";
import QueryContainer from "./query/QueryContainer";

interface IHomePageProps
{
}

interface IHomePageState
{
	cancerTypes?:TypeOfCancer[];
	studies?:CancerStudy[];
}

export default class HomePage extends React.Component<IHomePageProps, {}>
{
	constructor(props:IHomePageProps)
	{
		super(props);
	}

	componentDidMount()
	{
		// Promise.all([
		// 	this.client.getAllCancerTypesUsingGET({}),
		// 	this.client.getAllStudiesUsingGET({
		// 		projection: "DETAILED"
		// 	})
		// ]).then(([cancerTypes, studies]) => {
		// 	this.typeOfCancerData = new TypeOfCancerData(cancerTypes);
		// 	this.setState({cancerTypes, studies});
		// });
	}

	public render()
	{
		return <QueryContainer/>;

		{/*if (!this.typeOfCancerData)*/}
			{/*return <div/>;*/}
		{/*return <TypeOfCancerNode data={this.typeOfCancerData} id={'All'}/>;*/}
	}
}
/*
class TypeOfCancerData
{
	dataLookup:Dictionary<TypeOfCancer>;
	childDataLookup:Dictionary<TypeOfCancer[]>;

	constructor(cancerTypes:TypeOfCancer[])
	{
		this.dataLookup = _.keyBy(cancerTypes, (toc:TypeOfCancer) => toc.typeOfCancerId);
		this.childDataLookup = _.groupBy(cancerTypes, (toc:TypeOfCancer) => toc.parent);
		this.dataLookup['All'] = {
			'clinicalTrialKeywords': '',
			'dedicatedColor': '',
			'name': 'All',
			'parent': '',
			'shortName': 'All',
			'typeOfCancerId': 'tissue'
		};
	}
}

function TypeOfCancerNode(props:{data:TypeOfCancerData, id:string}):JSX.Element
{
	let children = props.data.childDataLookup[props.id];
	return <TreeView nodeLabel={props.data.dataLookup[props.id].name}>
		{children.map(child => <TypeOfCancerNode data={props.data} id={child.typeOfCancerId}/>)}
	</TreeView>
}

interface ProxyNodeData<T>
{
	getId:(data:T) => string;
	dataLookup:Dictionary<T>;
	childDataLookup:Dictionary<T[]>;
}

class ProxyNode<T>
{
	id:string;
	data:ProxyNodeData<T>;

	constructor(id:string, root:ProxyNodeData<T>)
	{
		this.id = id;
		this.data = root;
	}

	get children():ProxyNode<T>[]
	{
		let children = this.data.childDataLookup[this.id] || [];
		return children.map(child => new ProxyNode(this.data.getId(child), this.data));
	}
}
*/