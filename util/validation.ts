import { ucFirst } from './strings.js';

// https://rclayton.silvrback.com/custom-errors-in-node-js
export class HVMLDomainError extends Error {
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

export type JavaScriptTypeName = 
  | 'Array'
  | 'Integer'
  | 'Null'
  | 'Object'
  | 'String'
;

export type HvmlTypeName =
  | 'Video'
  | 'Group'
  | 'Series'
;

export type TypeName = JavaScriptTypeName | HvmlTypeName;

export type ExpectedGot = TypeName | TypeName[];

export interface HVMLRangeErrorData {
  className?: string;
  exclusivity?: 'inclusive' | 'exclusive';
  expected?: ExpectedGot;
  fieldName?: string;
  lowerBound?: number;
  upperBound?: number;
}

export interface HVMLTypeErrorData {
  className: string;
  expected: ExpectedGot;
  fieldName: string;
  input?: unknown,
  methodName?: string;
}

export interface HVMLEnumErrorData {
  badValues: any[];
  className?: string;
  expected?: ExpectedGot;
  fieldName?: string;
  methodName?: string;
}

export interface HVMLOptionalDependencyNotInstalledData {
  className: string;
  dependency: string;
  fieldName: string;
}

export class HVMLTypeError extends HVMLDomainError {
  data: HVMLTypeErrorData;

  /* className, field, expected, extraInfo = '' */
  static getGot( data: HVMLTypeErrorData ) {
    let gotType: TypeName;
    const inputTypeIsNull = ( data.input === null );
    const inputTypeIsNotNull = !inputTypeIsNull;

    if ( data.input && inputTypeIsNotNull ) {
      gotType = data.input.constructor.name as TypeName;
    } else if ( inputTypeIsNull ) {
      gotType = 'Null';
    } else {
      gotType = ucFirst( typeof data.input ) as TypeName;
    }

    return gotType;
  }

  static getExpected( data: HVMLTypeErrorData ) {
    let expected: ExpectedGot;

    if ( Array.isArray( data.expected ) ) {
      expected = data.expected.join( '|' ) as ExpectedGot;
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

export class HVMLEnumError extends HVMLDomainError {
  data: HVMLEnumErrorData;

  /* className, field, badValues */
  constructor( data?: HVMLEnumErrorData ) {
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

export class HVMLRangeError extends HVMLTypeError {
  constructor( data: HVMLRangeErrorData ) {
    const lowerBoundDefault = Number.NEGATIVE_INFINITY;
    const upperBoundDefault = Number.POSITIVE_INFINITY;
    let lowerBoundDefined = false;
    let upperBoundDefined = false;
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
      // @ts-ignore
      data = {};
      data!.lowerBound = lowerBoundDefault;
      data!.upperBound = upperBoundDefault;
    }

    data!.expected = ( data!.expected || 'Number' );
    data!.exclusivity = ( data!.exclusivity || 'inclusive' );

    if ( lowerBoundDefined && !upperBoundDefined ) {
      extraInfo = ` with a value greater than or equal to ${data!.lowerBound}`;
    } else if ( !lowerBoundDefined && upperBoundDefined ) {
      extraInfo = ` with a value less than or equal to ${data!.upperBound}`;
    } else {
      extraInfo = ` with a value between ${data!.lowerBound} and ${data!.upperBound} (${data.exclusivity})`;
    }

    super( {
      ...data,
      extraInfo,
    } );

    this.data = data;
  }
}

export class HVMLNotIntegerError extends HVMLTypeError {
  constructor( data ) {
    super( {
      ...data,
      "expected": "Integer",
    } );
  }
}

export class HVMLOptionalDependencyNotInstalled extends HVMLDomainError {
  data: HVMLOptionalDependencyNotInstalledData;

  constructor( data: HVMLOptionalDependencyNotInstalledData ) {
    super( `Optional dependency ${data.dependency} is not installed, so ${HVMLTypeError.getFieldOrParameter( data )} can not be used` );
    this.data = data;
  }
}

export default {
  "DomainError": HVMLDomainError,
  "EnumError": HVMLEnumError,
  "TypeError": HVMLTypeError,
  "RangeError": HVMLRangeError,
  "NotIntegerError": HVMLNotIntegerError,
  "OptionalDependencyNotInstalled": HVMLOptionalDependencyNotInstalled,
}
