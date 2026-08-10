/**
 * Terms the grammar (`rng/hvml.rng`) types with numeric XSD
 * datatypes. Attribute spellings are the canonical camelCase forms;
 * the XML serializer folds the case-folded variants (`starttime`)
 * into these before emission. The grammar declares no boolean
 * datatypes; when it does, those terms join here.
 */
export const GRAMMAR_NUMERIC_TERMS = new Set( [
  // xs:integer
  'episode',
  // xs:duration | nonNegativeDecimal
  'runtime',
  // xs:nonNegativeInteger
  'bitrate',
  // xs:positiveInteger on `poster` and under `file`; the percentage
  // variants (`overlay`, `goto`) self-exclude lexically
  'width',
  'height',
  // nonNegativeDecimal (timingAttributes)
  'start',
  'end',
  // nonNegativeDecimal (animateTimingAttributes)
  'startTime',
  'endTime',
  // xs:integer (`par`)
  'x',
  'y',
  // xs:integer (`fps`, `sync`)
  'rate',
  'scale',
  // xs:decimal (`sync`)
  'offset',
] );

/**
 * Emits an XML lexical form into JSON, letting the grammar’s XSD
 * datatypes drive the spelling: terms the grammar types numerically
 * emit JSON numbers, everything else emits strings. Conversion also
 * requires the value to survive the round trip
 * (`String( Number( value ) ) === value`), which settles every
 * same-name collision lexically: `width` is `xs:positiveInteger` on
 * `poster` but a percentage on `overlay`, and `runtime` chooses
 * between `xs:duration` and decimal, so “40%” and “PT1H” are left as
 * strings. Lossy respellings (“023” → 23) are likewise left lexical;
 * canonicalization belongs to the RDF layer.
 */
export function emitTypedScalar( term: string, lexicalForm: string ): string | number {
  if ( !GRAMMAR_NUMERIC_TERMS.has( term ) ) {
    return lexicalForm;
  }

  const numeric = Number( lexicalForm );

  if ( !Number.isFinite( numeric ) || ( String( numeric ) !== lexicalForm ) ) {
    return lexicalForm;
  }

  return numeric;
}
