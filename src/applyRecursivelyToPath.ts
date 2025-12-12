import { Node, Path, PossibleCanvasStyle, SVG, SVGProps } from "@motion-canvas/2d"

type ModifiableSVGProps = Omit<SVGProps, 'svg'>;

const applyParam = (svgPath: Path, params: ModifiableSVGProps) => {
    const methods = getAllKeysConditionally(svgPath);
    for (const key in params) {
        if (params.hasOwnProperty(key)) {
            const method = key as keyof ModifiableSVGProps;
            if (methods.includes(method)) {
                const paramValue = params[method];
                if (paramValue !== undefined) {
                    (svgPath as any)[method](paramValue);
                }
            }
        }
    }
}

type SVGComponent = SVG | Path;

export const applyRecursivelyToSVGSubPath = (svgNode: SVGComponent, params: ModifiableSVGProps) => {
    if (svgNode instanceof Path) {
        applyParam(svgNode, params);
    }

    for (let svgChild of svgNode.children()) {
        applyRecursivelyToSVGSubPath(svgChild as SVGComponent, params);
    }
}


// Source - https://stackoverflow.com/a
// Posted by DavidT, modified by community. See post 'Timeline' for change history
// Retrieved 2025-12-12, License - CC BY-SA 4.0

function getAllKeysConditionally(obj: any, includeSelf = true, includePrototypeChain = true, includeTop = false, includeEnumerables = true, includeNonenumerables = true, includeStrings = true, includeSymbols = true) {
    
    // Boolean (mini-)functions to determine any given key's eligibility:
    const isEnumerable = (obj, key) => Object.propertyIsEnumerable.call(obj, key);
    const isString = (key) => typeof key === 'string';
    const isSymbol = (key) => typeof key === 'symbol';
    const includeBasedOnEnumerability = (obj, key) => (includeEnumerables && isEnumerable(obj, key)) || (includeNonenumerables && !isEnumerable(obj, key));
    const includeBasedOnKeyType = (key) => (includeStrings && isString(key)) || (includeSymbols && isSymbol(key));
    const include = (obj, key) => includeBasedOnEnumerability(obj, key) && includeBasedOnKeyType(key);
    const notYetRetrieved = (keys, key) => !keys.includes(key);
    
    // filter function putting all the above together:
    const filterFn = key => notYetRetrieved(keys, key) && include(obj, key);
    
    // conditional chooses one of two functions to determine whether to exclude the top level or not:
    const stopFn = includeTop ? (obj => obj === null) : (obj => Object.getPrototypeOf(obj) === null);
    
    // and now the loop to collect and filter everything:
    let keys = [];
    while (!stopFn(obj, includeTop)) {
        if (includeSelf) {
            const ownKeys = Reflect.ownKeys(obj).filter(filterFn);
            keys = keys.concat(ownKeys);
        }
        if (!includePrototypeChain) { break; }
        else {
            includeSelf = true;
            obj = Object.getPrototypeOf(obj);
        }
    }
    return keys;
}
