/**
 * Creates a new object whose [[Prototype]] is `proto`, optionally defining
 * properties from a descriptor map.
 *
 * Classic technique: a throwaway constructor whose `.prototype` is set to
 * `proto`; `new` then produces an object inheriting from it. For `proto ===
 * null` a constructor can't be used (its `.prototype` would fall back to
 * `Object.prototype`), so we create an ordinary object and sever its chain
 * with `Object.setPrototypeOf`.
 *
 * `Object.defineProperties` applies descriptors (value/get/set/flags) so the
 * result matches the native `Object.create(proto, props)`.
 */
export function objectCreate(
  proto: object | null,
  properties?: PropertyDescriptorMap,
): any {
  if (
    proto !== null &&
    typeof proto !== 'object' &&
    typeof proto !== 'function'
  ) {
    throw new TypeError('Object prototype may only be an Object or null');
  }

  let obj: any;

  if (proto === null) {
    obj = {};
    Object.setPrototypeOf(obj, null);
  } else {
    function Temp(this: any) {}
    Temp.prototype = proto;
    obj = new (Temp as any)();
  }

  if (properties !== undefined) {
    Object.defineProperties(obj, properties);
  }

  return obj;
}
