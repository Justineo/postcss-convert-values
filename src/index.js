'use strict';

import postcss from 'postcss';
import convert from './lib/convert';
import valueParser, {unit} from 'postcss-value-parser';

function parseWord (node, opts, stripZeroUnit) {
    let pair = unit(node.value);
    if (pair) {
        let num = Number(pair.number);
        let u = pair.unit.toLowerCase();
        if (num === 0) {
            node.value = (
                stripZeroUnit ||
                u === 'ms' ||
                u === 's' ||
                u === 'deg'||
                u === 'rad' ||
                u === 'grad' ||
                u === 'turn') ? 0 + u : 0;
        } else {
            node.value = convert(num, u, opts);
        }
    }
}

function transform (opts) {
    return decl => {
        if (~decl.prop.indexOf('flex')) {
            return;
        }

        decl.value = valueParser(decl.value).walk(function (node) {
            if (node.type === 'word') {
                parseWord(node, opts);
            } else if (node.type === 'function') {
                if (node.value === 'calc' ||
                    node.value === 'hsl' ||
                    node.value === 'hsla') {
                    node.nodes.forEach(function walkNodes (node) {
                        if (node.type === 'word') {
                            parseWord(node, opts, true);
                        }
                        if (node.type === 'function') {
                            node.nodes.forEach(walkNodes);
                        }
                    });
                    return false;
                } else if (node.value === 'url') {
                    return false;
                }
            }
        }).toString();
    };
}


export default postcss.plugin('postcss-convert-values', (opts) => {
    opts = opts || {};
    if (opts.length === undefined && opts.convertLength !== undefined) {
        console.warn('postcss-convert-values: `convertLength` option is deprecated. Use `length`');
        opts.length = opts.convertLength;
    }
    if (opts.length === undefined && opts.convertTime !== undefined) {
        console.warn('postcss-convert-values: `convertTime` option is deprecated. Use `time`');
        opts.time = opts.convertTime;
    }
    return css => {
        css.walkDecls(transform(opts));
    };
});
