/**
 * The mint rule (hvml-spec
 * docs/2026-08-03-identity-versions-presentations.md §2.2): an
 * `xml:id` resolved against the document base names the subject its
 * element describes. The primary child of `hvml` mints the base IRI
 * itself; every other `xml:id` mints a fragment, `base#id`.
 *
 * Plain string assembly rather than the URL parser: the WHATWG URL
 * API percent-encodes non-ASCII paths, and registry IRIs use native
 * precomposed Unicode (§2.8), which a mint must preserve character
 * for character. A fragment already on the base is replaced, as
 * RFC 3986 §5.2 resolution would.
 */
export function mintIri( base: string, xmlId: string, isPrimary = false ): string {
  const fragmentless = base.replace( /#.*$/, '' );

  return isPrimary ? fragmentless : `${fragmentless}#${xmlId}`;
}

/**
 * The document base declared by a JSON-LD `@context`, in any of the
 * shapes the twin serialization writes or accepts: a bare context
 * URL declares none; an embedded object or an array of contexts may
 * carry `@base`.
 */
export function getBaseFromContext( context: unknown ): string | null {
  const entries = Array.isArray( context ) ? context : [context];

  for ( const entry of entries ) {
    if ( ( typeof entry === 'object' ) && ( entry !== null ) ) {
      const base = ( entry as Record<string, unknown> )['@base'];

      if ( typeof base === 'string' ) {
        return base;
      }
    }
  }

  return null;
}
