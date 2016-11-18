import * as React from 'react';

interface ITreeProps extends React.Props<Tree> {
	prefixCls?: string;
	multiple?: boolean;
	selected?: any[];
}

class Tree extends React.Component<ITreeProps, any> {

  static propTypes = {
    prefixCls: React.PropTypes.string,

    children: React.PropTypes.node,
    multiple: React.PropTypes.bool,
    selected: React.PropTypes.array,
  };

  static defaultProps = {
    multiple: true,
  };

  constructor(props:ITreeProps) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
  }

  renderTreeNode<T>(child:T) {
    return child;
  }

  render() {
    return (
      <div className="jstree jstree-default">
        <ul className="jstree-container-ul jstree-children">
          {this.props.children}
        </ul>
      </div>
    );
  }
}

export default Tree;
