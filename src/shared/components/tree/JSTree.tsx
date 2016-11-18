import * as React from 'react';
import TreeNode from "../jstree/TreeNode";
import Tree from "../jstree/Tree";
import 'jstree/dist/themes/default/style.css';
import {ITreeNodeProps} from "../jstree/TreeNode";
import {ITreeDescriptor} from "./DescriptorTreeNode";

interface IJSTreeProps<Node>
{
	root:Node;
	descriptor:ITreeDescriptor<Node>;
	onExpand:(node:Node, value:boolean) => void;
}

interface IJSTreeState
{

}

export default class JSTree extends React.Component<IJSTreeProps<any>, IJSTreeState>
{
	constructor(props: IJSTreeProps<any>)
	{
		super(props);
	}

	componentDidMount()
	{
	}

	render()
	{
		return <Tree>
			{this.renderNode(this.props.root)}
		</Tree>;
	}

	renderNode<Node>(node:Node, index?:number, array?:any[]) {
		let descriptor = this.props.descriptor;
		let ref:TreeNode;
		let children = descriptor.getChildren(node);
		if (children)
			children = children.map(this.renderNode, this);
		let props:ITreeNodeProps = {
			key: index,
			ref: (r:TreeNode) => ref = r,
			opened: descriptor.isExpanded(node),
			last: !array || index == array.length - 1,
			checkbox: true,
			content: descriptor.getContent(node),
			children,
			oclProps: {
				onMouseDown: (event:React.MouseEvent) => {
					this.props.onExpand(node, !descriptor.isExpanded(node));
					this.forceUpdate();
				}
			}
		};
		return <TreeNode {...props}/>;
	}
}