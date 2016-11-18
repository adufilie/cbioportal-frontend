import * as React from 'react';
import classnames from '../../lib/classNames';

export interface ITreeNodeProps extends React.Props<TreeNode> {
    oclProps?: React.HTMLAttributes;
    content?: React.ReactNode;
    icon?: React.ReactNode;
    opened?: boolean;
    selected?: boolean;
    disabled?: boolean;
    loading?: boolean;
    hovered?: boolean;
    checkbox?: boolean;
    last?: boolean;
    children?: React.ReactNode;
    prefixCls?: string;
}

class TreeNode extends React.Component<ITreeNodeProps, any> {

  static defaultProps = {
    opened: true,
  };

  constructor(props:ITreeNodeProps) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
  }

  renderCheckbox(props:ITreeNodeProps) { // eslint-disable-line

  }

  renderChildren(props:ITreeNodeProps) {
    const children = props.children;

    if (!children) {
      return children;
    }

    return (
      <ul className="jstree-children">
        {this.props.children}
      </ul>
    );
  }

  render() {
    const props = this.props;

    let newChildren:JSX.Element|undefined|null = this.renderChildren(props);
    if (!newChildren || newChildren === props.children) {
      // content = newChildren;
      newChildren = null;
    }

    const liCls = {
      'jstree-node': true,
      'jstree-leaf': !newChildren,
      'jstree-open': !!this.props.opened,
      'jstree-closed': !this.props.opened,
      'jstree-loading': !!this.props.loading,
      'jstree-last': !!this.props.last,
    };

    const aCls = {
      'jstree-anchor': true,
      'jstree-clicked': !!this.props.selected,
      'jstree-disabled': !!this.props.disabled,
      'jstree-hovered': !!this.props.hovered,
    };

    const aiCls = {
      'jstree-icon': true,
      'jstree-checkbox': !!this.props.checkbox,
    };

    return (
      <li className={classnames(liCls)}>
        <i className="jstree-icon jstree-ocl" {...this.props.oclProps}/>
        <a className={classnames(aCls)} href="#" tabIndex={-1}>
          <i className={classnames(aiCls)}/>
          {this.props.content}
        </a>
        {newChildren}
      </li>
    );
  }
}

export default TreeNode;
