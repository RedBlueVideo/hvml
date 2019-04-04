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
      data.extraInfo = null;
    }

    if ( !data.got && ( 'input' in data ) ) {
      let gotType;
      const gotTypeIsNull = ( data.input === null );

      if ( data.input || !gotTypeIsNull ) {
        gotType = data.input.constructor.name;
      } else if ( gotTypeIsNull ) {
        gotType = 'Null';
      } else {
        gotType = ( typeof data.input );
        gotType = `${gotType.charAt( 0 ).toUpperCase()}${gotType.slice( 1 )}`;
      }

      data.got = gotType;
    }

    let expected;
    if ( Array.isArray( data.expected ) ) {
      expected = data.expected.join( '|' );
    } else {
      ( { expected } = data );
    }

    let fieldOrParameter = '';
    const hasClassName = ( 'className' in data );
    const hasMethodName = ( 'methodName' in data );
    const hasField = ( 'field' in data );

    if ( hasClassName && hasMethodName ) {
      fieldOrParameter += `${data.className}.${data.methodName}`;
    } else if ( hasClassName && !hasMethodName ) {
      fieldOrParameter += data.className;
    } else if ( !hasClassName && hasMethodName ) {
      fieldOrParameter += data.methodName;
    }

    if ( hasField ) {
      fieldOrParameter += `::${data.field}`;
    } else {
      fieldOrParameter += `()`;
    }

    super( `${fieldOrParameter} must be of type ${expected}; got ${data.got}${data.extraInfo || ''}` );
    this.data = data;
  }
}

class HVMLParamError extends HVMLTypeError {}

class HVMLRangeError extends HVMLTypeError {
  /* className, field, expected, lowerBound, upperBound, exclusivity = 'inclusive' */
  constructor( data ) {
    let lowerBoundDefined;
    let upperBoundDefined;
    let extraInfo;

    if ( typeof data.lowerBound !== 'undefined' ) {
      lowerBoundDefined = true;
    } else {
      data.lowerBound = Number.NEGATIVE_INFINITY;
    }

    if ( typeof data.upperBound !== 'undefined' ) {
      upperBoundDefined = true;
    } else {
      data.upperBound = Number.POSITIVE_INFINITY;
    }

    if ( !data.exclusivity ) {
      data.exclusivity = 'inclusive';
    }

    if ( lowerBoundDefined && !upperBoundDefined ) {
      extraInfo = ` with a value greater than or equal to ${data.lowerBound}`;
    } else if ( !lowerBoundDefined && upperBoundDefined ) {
      extraInfo = ` with a value less than or equal to ${data.upperBound}`;
    } else if ( lowerBoundDefined && upperBoundDefined ) {
      extraInfo = ` with a value between ${data.lowerBound} and ${data.upperBound} (${data.exclusivity})`;
    } else {
      extraInfo = ``;
    }

    super( {
      ...data,
      extraInfo,
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
  "EnumError": HVMLEnumError,
  "TypeError": HVMLTypeError,
  "ParamError": HVMLParamError,
  "RangeError": HVMLRangeError,
  "NotIntegerError": HVMLNotIntegerError,
};
