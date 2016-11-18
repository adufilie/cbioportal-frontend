import * as _ from 'lodash';
import * as React from 'react';
import * as styles from './styles.module.scss';
import classNames from '../../lib/classNames';

export interface ITreeDescriptor<Node> {
	isExpanded(node:Node):boolean;
	getContent(node:Node):React.ReactChild;
	getChildren(node:Node):Node[]|undefined;
}

export interface IDescriptorTreeNodeProps<Node> extends React.HTMLProps<DescriptorTreeNode> {
	treeDescriptor:ITreeDescriptor<Node>;
	tree:Node;
}

export default class DescriptorTreeNode extends React.Component<IDescriptorTreeNodeProps<any>, void> {
    render():JSX.Element {
        let attrs:React.HTMLAttributes = _.omit(this.props, 'tree', 'treeDescriptor');
        let style:React.CSSProperties = _.merge(
            {
                display: 'flex',
                flexDirection: 'row',
            },
            attrs.style
        );

        let expand = this.props.treeDescriptor.isExpanded(this.props.tree);
        let content = this.props.treeDescriptor.getContent(this.props.tree);
        let children = this.props.treeDescriptor.getChildren(this.props.tree);

        let showArrow = !!children && children.length > 0;

        return (
			<div {...attrs} style={style}>
				<div
					className={classNames({
						[styles.indent]: true,
						[styles.arrow]: showArrow,
						[styles.collapsed]: showArrow && !expand,
					})}
				>
					{/* arrow */}
				</div>
				<div style={{display: 'flex', flexDirection: 'column'}}>
					{content}
					{
						expand && children
						?   children.map((child, i) => (
								<DescriptorTreeNode key={i} treeDescriptor={this.props.treeDescriptor} tree={child}/>
							))
						:   null
					}
				</div>
            </div>
		);
    }
}

