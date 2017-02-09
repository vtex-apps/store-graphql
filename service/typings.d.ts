declare module "ramda" {
  import X = require('@vtex/npm-ramda')

  interface Custom {
    call(fn: (...args: any[]) => any, ...args: any[]): any;
    filter<T>(fn: (value: T) => boolean, obj: { [index: string]: T }): { [index: string]: T };
    map<T, U>(fn: (x: T) => U, obj: { [index: string]: T }): { [index: string]: U };
    eqBy<T, U>(fn: (a: T) => U): X.CurriedFunction2<T, T, boolean>;
    eqBy<T, U>(fn: (a: T) => U, a: T, b: T): boolean;
  }

  var R: X.Static & Custom

  export = R
}
