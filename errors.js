// https://rclayton.silvrback.com/custom-errors-in-node-js
class HVMLDomainError extends Error {
  constructor( message ) {
    super( message );
    // Ensure the name of this error is the same as the class name
    this.name = this.constructor.name;
    // This clips the constructor invocation from the stack trace.
    // It's not absolutely essential, but it does make the stack trace a little nicer.
    //  @see Node.js reference (bottom)
    Error.captureStackTrace( this, this.constructor );
  }
}

class HVMLEnumError extends HVMLDomainError {
  /* className, field, badValues */
  constructor( data ) {
    super( `The following values are invalid for ${data.className}::${data.field}: ${data.badValues.join( ', ' )}` );
    this.data = data;
  }
}

class HVMLTypeError extends HVMLDomainError {
  /* className, field, expected, extraInfo = '' */
  constructor( data ) {
    if ( !data.extraInfo ) {
      data.extraInfo = '';
    }
    super( `${data.className}::${data.field} must be of type ${data.expected}${data.extraInfo}` );
    this.data = data;
  }
}

class HVMLRangeError extends HVMLTypeError {
  /* className, field, expected, lowerBound, upperBound, inclusiveExclusive = 'inclusive' */
  constructor( data ) {
    if ( !data.inclusiveExclusive ) {
      data.inclusiveExclusive = 'inclusive';
    }
    super( {
      ...data,
      "extraInfo": ` with a value between ${data.lowerBound} and ${data.upperBound} (${data.inclusiveExclusive})`,
    } );
    this.data = data;
  }
}

class HVMLNotIntegerError extends HVMLTypeError {
  constructor( data ) {
    super( {
      ...data,
      "expected": "Integer",
    } );
  }
}

module.exports = {
  HVMLEnumError,
  HVMLTypeError,
  HVMLRangeError,
  HVMLNotIntegerError,
};
