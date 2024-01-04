let objCache: { [id: string]: { group: string | null; value: any } } = {};

let objId = 1;

export function makeRemoteObject(
  val: any,
  group: string | null
): { type: string; description: string; [key: string]: any } {
  const tp = typeof val;
  const resVal: any = { type: tp };
  let shouldCache = false;

  switch (tp) {
    case "number":
    case "string":
    case "boolean":
    case "symbol":
    case "undefined":
      resVal.description = `${val}`;
      resVal.value = val;
      break;

    case "function":
      shouldCache = true;
      resVal.className = "Function";
      resVal.description = `${val}`;
      break;

    case "object":
      {
        if (val === null) {
          resVal.subtype = resVal.description = "null";
        } else {
          /* when val[Symbol.toStringTag] === "Module", it indicates a module namespace object.
              in this case, its .toString method is undefined
            */
          resVal.description =
            val.toString?.call(val) ||
            `[object ${val[Symbol.toStringTag] || "Object"}]`;

          resVal.className = val.constructor?.name || undefined;
          shouldCache = true;

          if (val instanceof Error) {
            resVal.subtype = "error";
          } else if (Array.isArray(val)) {
            resVal.subtype = "array";
          } else if (val instanceof Promise) {
            resVal.subtype = "promise";
          } else if (val instanceof Date) {
            resVal.subtype = "date";
          } else if (val instanceof ArrayBuffer) {
            resVal.subtype = "arraybuffer";
            //} else if (val instanceof Proxy) {
            //  resVal.subtype = "proxy";
          } else {
            // XXX
          }
        }
      }
      break;

    default:
      throw new Error(`*** unhandled type ${tp} for removeObject`);
  }

  if (shouldCache) {
    // save to cache or find in cache
    const found = Object.entries(objCache).find((entry) => {
      const go = entry[1];
      return go.value === val && go.group === group;
    });
    const oid = found
      ? found[0]
      : (() => {
          let id = `${objId}`;
          objCache[`${id}`] = { group, value: val };
          objId++;
          return id;
        })();

    resVal.objectId = oid;
  }

  return resVal;
}

export function makeExceptionDetails(ex: any): { [key: string]: any } {
  const ed = {
    text: ex.message,
  };
  return ed;
}

export function resetObjCache() {
  objId = 1;
  objCache = {};
}

export { objCache };
