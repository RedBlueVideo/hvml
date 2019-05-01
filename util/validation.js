const { ucFirst } = require( './strings' );

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
    let forField = '';

    if ( !data ) {
      const error = new HVMLTypeError( {
        "className": "HVMLEnumError",
        "expected": "Object",
        "input": data,
        "methodName": "constructor",
        "fieldName": "data",
      } );

      throw new TypeError( error.message );
    } else if ( !( 'badValues' in data ) ) {
      const error = new HVMLTypeError( {
        "className": "HVMLEnumError",
        "expected": "Array",
        "input": data.badValues,
        "methodName": "constructor",
        "fieldName": "data.badValues",
      } );

      throw new TypeError( error.message );
    }

    if ( data.className || data.methodName || data.fieldName ) {
      try {
        forField = ` for ${HVMLTypeError.getFieldOrParameter( data )}`;
      // Only time getFieldOrParameter throws is if className is present but fieldName is missing.
      } catch ( error ) {
        forField = ` for ${data.className}.${data.methodName || 'constructor'}`;
      }
    }

    super( `The following values are invalid${forField}: ${data.badValues.join( ', ' )}` );

    this.data = data;
  }
}

class HVMLTypeError extends HVMLDomainError {
  /* className, field, expected, extraInfo = '' */
  static getGot( data ) {
    let gotType;
    const inputTypeIsNull = ( data.input === null );
    const inputTypeIsNotNull = !inputTypeIsNull;

    if ( data.input && inputTypeIsNotNull ) {
      gotType = data.input.constructor.name;
    } else if ( inputTypeIsNull ) {
      gotType = 'Null';
    } else {
      gotType = ucFirst( typeof data.input );
    }

    return gotType;
  }

  static getExpected( data ) {
    let expected;

    if ( Array.isArray( data.expected ) ) {
      expected = data.expected.join( '|' );
    } else {
      ( { expected } = data );
    }

    if ( !expected ) {
      const error = new HVMLTypeError( {
        "className": "HVMLTypeError",
        "expected": "String",
        "input": expected,
        "methodName": "constructor",
        "fieldName": "data.expected",
      } );

      throw new TypeError( error.message );
    }

    return expected;
  }

  static getFieldOrParameter( data ) {
    const hasClassName = ( 'className' in data );
    const hasMethodName = ( 'methodName' in data );
    const hasFieldName = ( 'fieldName' in data );
    let fieldOrParameter = '';

    if ( hasClassName ) {
      fieldOrParameter += data.className;

      if ( hasMethodName ) {
        fieldOrParameter += `.${data.methodName}`;
      }

      if ( hasFieldName ) {
        fieldOrParameter += `::${data.fieldName}`;
      } else {
        const error = new HVMLTypeError( {
          "className": "HVMLTypeError",
          "expected": "String",
          "input": data.fieldName,
          "methodName": "constructor",
          "fieldName": "data.fieldName",
        } );

        throw new TypeError( error.message );
      }
    } else if ( hasMethodName ) {
      fieldOrParameter += data.methodName;

      /* istanbul ignore else */
      if ( hasFieldName ) {
        fieldOrParameter += `::${data.fieldName}`;
      }
    } else if ( hasFieldName ) {
      fieldOrParameter += data.fieldName;
    } else {
      fieldOrParameter = 'Field or parameter';
    }

    return fieldOrParameter;
  }

  constructor( data ) {
    if ( !data ) {
      const error = new HVMLTypeError( {
        "className": "HVMLTypeError",
        "expected": "Object",
        "input": data,
        "methodName": "constructor",
        "fieldName": "data",
      } );

      throw new TypeError( error.message );
    }

    const fieldOrParameter = HVMLTypeError.getFieldOrParameter( data );
    const expected = HVMLTypeError.getExpected( data );

    data.extraInfo = ( data.extraInfo || null );
    data.got = ( data.got || HVMLTypeError.getGot( data ) );

    super( `${fieldOrParameter} must be of type ${expected}${data.extraInfo || ''}; got ${data.got}` );

    this.data = data;
  }
}

class HVMLRangeError extends HVMLTypeError {
  /* className, field, expected, lowerBound, upperBound, exclusivity = 'inclusive' */
  constructor( data ) {
    const lowerBoundDefault = Number.NEGATIVE_INFINITY;
    const upperBoundDefault = Number.POSITIVE_INFINITY;
    let lowerBoundDefined;
    let upperBoundDefined;
    let extraInfo;

    if ( data ) {
      if ( typeof data.lowerBound !== 'undefined' ) {
        lowerBoundDefined = true;
      } else {
        data.lowerBound = lowerBoundDefault;
      }

      if ( typeof data.upperBound !== 'undefined' ) {
        upperBoundDefined = true;
      } else {
        data.upperBound = upperBoundDefault;
      }
    } else {
      data = {};
      data.lowerBound = lowerBoundDefault;
      data.upperBound = upperBoundDefault;
    }

    data.expected = ( data.expected || 'Number' );
    data.exclusivity = ( data.exclusivity || 'inclusive' );

    if ( lowerBoundDefined && !upperBoundDefined ) {
      extraInfo = ` with a value greater than or equal to ${data.lowerBound}`;
    } else if ( !lowerBoundDefined && upperBoundDefined ) {
      extraInfo = ` with a value less than or equal to ${data.upperBound}`;
    } else {
      extraInfo = ` with a value between ${data.lowerBound} and ${data.upperBound} (${data.exclusivity})`;
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

class HVMLOptionalDependencyNotInstalled extends HVMLDomainError {
  constructor( data ) {
    super( `Optional dependency ${data.dependency} is not installed, so ${HVMLTypeError.getFieldOrParameter( data )} can not be used` );
    this.data = data;
  }
}

module.exports = {
  "DomainError": HVMLDomainError,
  "EnumError": HVMLEnumError,
  "TypeError": HVMLTypeError,
  "RangeError": HVMLRangeError,
  "NotIntegerError": HVMLNotIntegerError,
  "OptionalDependencyNotInstalled": HVMLOptionalDependencyNotInstalled,
};
