import * as ReactDOM from 'react-dom';
import * as _$ from 'jquery';

let $ = _$ as any;

$.jstree.defaults.actions = $.noop;

$.jstree.plugins.actions = function (options:any, parent:any) {
    this.redraw_node = function (node_id:any, deep:any, callback:any, force_draw:any) {
        var node = parent.redraw_node.call(this, node_id, deep, callback, force_draw);
        if (node) {
            var e = options.getElement(this._model.data[node.id]);

            if (e) {
                var el = document.createElement('span');
                el.className = 'jstree-actions';
                var place = node.querySelector('a');
                node.insertBefore(el, place);

                ReactDOM.render(e, el);
            }
        }
        return node;
    };
};
