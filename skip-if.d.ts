declare module 'skip-if' {
  type SkipIfCondition = boolean | ( () => boolean );
  type SkippableTestCallback = ( done: ( error?: unknown ) => void ) => unknown;

  /**
   * Auto-curried upstream; this package only ever uses the
   * one-argument form, which returns an `it`-alike.
   */
  export default function skipIf(
    condition: SkipIfCondition,
  ): ( name: string, test: SkippableTestCallback ) => void;
}
