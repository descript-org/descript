//  Нет смысла заморачиваться на какую-нибудь экзотическую дичь.
//  Object literal определяется таким образом и этого достаточно.
//
export default function isPlainObject(object: any): object is object {
    if (object && typeof object === 'object') {
        const proto = object.__proto__;
        if (!proto || proto === Object.prototype) {
            return true;
        }
    }

    return false;
}
