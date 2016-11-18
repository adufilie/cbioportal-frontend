import * as React from 'react';
import * as _ from 'lodash';

import * as _$ from 'jquery';
import 'jstree';
import './plugins/jstree.actions';

let $ = (_$ as any).default as typeof _$;

interface IReactJstreeProps extends React.HTMLProps<ReactJstree> {
	onSelect?: React.EventHandler<React.SyntheticEvent>;
	onSelectedChange?: Function;
	options?: JSTreeStaticDefaults;
}

class ReactJstree extends React.Component<IReactJstreeProps, any> {

    componentDidMount() {
        this.createTree();
    }

    shouldComponentUpdate (prevProps:IReactJstreeProps) {
        return !_.isEqual(prevProps, this.props);
    }

    componentWillUpdate () {
        this.destroyTree();
    }

    componentDidUpdate () {
        this.createTree();
    }

    componentWillUnmount () {
        this.destroyTree();
    }

    render () {
        return (
            <div className={this.props.className} {...this.props as React.HTMLAttributes}>
                <div ref="tree">
                    {this.props.children}
                </div>
            </div>
        );
    }

    getNode() {
        return $(this.refs['tree']);
    }

    createTree () {
        let props = this.props;
        this.getNode()
            .on('select_node.jstree', (...args:any[])=> {
                props.onSelect && props.onSelect.apply(null, args);
            })
            .on('changed.jstree', (...args:any[])=> {
                props.onSelectedChange && props.onSelectedChange(...args);
            })
            .jstree(props.options);
    }

    destroyTree () {
        this.getNode()
            .off('select_node.jstree')
            .off('changed.jstree')
            .jstree('destroy');
    }

    /**
     * @returns {*}
     */
    getTree () {
        return this.getNode().jstree(true);
    }

    getJsTree () {
        return this.getNode().jstree(true);
    }

    selectAll() {
        this.getTree().select_all();
    }

    deselectAll() {
        this.getTree().deselect_all();
    }

    selectNode(obj:any) {
        this.getTree().select_node(obj);
    }


}

export default ReactJstree;
