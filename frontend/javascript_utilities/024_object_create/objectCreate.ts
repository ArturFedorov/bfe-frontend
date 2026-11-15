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
