import Validation from './validation';

const { DomainError, EnumError, RangeError, TypeError } = Validation;

describe( 'Validation', () => {
  describe( 'HVMLDomainError', () => {
    it( 'takes a message as input which is reflected in the returned object', () => {
      let thrownError;

      try {
        throw new DomainError( 'Hello' );
      } catch ( error ) {
        thrownError = error;
      }

      expect( thrownError.message ).toBe( 'Hello' );
    } );
  } );

  describe( 'HVMLEnumError', () => {
    it( 'returns an object with the correct class', () => {
      let thrownError;

      try {
        throw new EnumError( {
          "badValues": ["Hello", "Goodbye"],
        } );
      } catch ( error ) {
        thrownError = error;
      }

      expect( thrownError.constructor.name ).toBe( 'HVMLEnumError' );
    } );

    it( 'reports bad values', () => {
      let thrownError;

      try {
        throw new EnumError( {
          "badValues": ["Hello", "Goodbye"],
        } );
      } catch ( error ) {
        thrownError = error;
      }

      expect( thrownError.message ).toBe( 'The following values are invalid: Hello, Goodbye' );
    } );

    it( 'returns a more specific message if `className`/`fieldName` are specified in the constructor', () => {
      let thrownErrorOne;
      let thrownErrorTwo;

      try {
        throw new EnumError( {
          "className": "Foo",
          "badValues": ["Hello", "Goodbye"],
        } );
      } catch ( error ) {
        thrownErrorOne = error;
      }

      try {
        throw new EnumError( {
          "className": "Foo",
          "fieldName": "bar",
          "badValues": ["Hello", "Goodbye"],
        } );
      } catch ( error ) {
        thrownErrorTwo = error;
      }

      expect( thrownErrorOne.message ).toBe( 'The following values are invalid for Foo.constructor: Hello, Goodbye' );
      expect( thrownErrorTwo.message ).toBe( 'The following values are invalid for Foo::bar: Hello, Goodbye' );
    } );

    /* --- Errors --- */

    describe( 'throws a native TypeError', () => {
      test( 'if bad values are not specified in the constructor', () => {
        let thrownError;

        try {
          throw new EnumError( {} );
        } catch ( error ) {
          thrownError = error;
        }

        expect( thrownError.constructor.name ).toBe( 'TypeError' );
        expect( thrownError.message ).toBe( 'HVMLEnumError.constructor::data.badValues must be of type Array; got Undefined' );
      } );

      test( 'if no config object is passed to the constructor', () => {
        let thrownError;

        try {
          throw new EnumError();
        } catch ( error ) {
          thrownError = error;
        }

        expect( thrownError.constructor.name ).toBe( 'TypeError' );
        expect( thrownError.message ).toBe( 'HVMLEnumError.constructor::data must be of type Object; got Undefined' );
      } );
    } );
  } );

  describe( 'HVMLRangeError', () => {
    it( 'returns an object with the correct class', () => {
      let thrownError;

      try {
        throw new RangeError();
      } catch ( error ) {
        thrownError = error;
      }

      expect( thrownError.constructor.name ).toBe( 'HVMLRangeError' );
    } );

    describe( 'returns a human-readable message', () => {
      it( 'labeled with a vague default if no config object is passed to the constructor', () => {
        let thrownError;

        try {
          throw new RangeError();
        } catch ( error ) {
          thrownError = error;
        }

        expect( thrownError.message ).toBe( 'Field or parameter must be of type Number with a value between -Infinity and Infinity (inclusive); got Undefined' );
      } );

      test( 'labeled specifically if `className` & `fieldName` are passed to the constructor', () => {
        let thrownError;

        try {
          throw new RangeError( {
            "className": "Foo",
            "fieldName": "bar",
          } );
        } catch ( error ) {
          thrownError = error;
        }

        expect( thrownError.message ).toBe( 'Foo::bar must be of type Number with a value between -Infinity and Infinity (inclusive); got Undefined' );
      } );

      test( 'for ranges with no lower bound', () => {
        let thrownError;

        try {
          throw new RangeError( {
            "upperBound": 100,
          } );
        } catch ( error ) {
          thrownError = error;
        }

        expect( thrownError.message ).toBe( 'Field or parameter must be of type Number with a value less than or equal to 100; got Undefined' );
      } );

      test( 'for ranges with no upper bound', () => {
        let thrownError;

        try {
          throw new RangeError( {
            "lowerBound": 0,
          } );
        } catch ( error ) {
          thrownError = error;
        }

        expect( thrownError.message ).toBe( 'Field or parameter must be of type Number with a value greater than or equal to 0; got Undefined' );
      } );

      test( 'for ranges with both lower and upper bounds', () => {
        let thrownError;

        try {
          throw new RangeError( {
            "lowerBound": 0,
            "upperBound": 100,
          } );
        } catch ( error ) {
          thrownError = error;
        }

        expect( thrownError.message ).toBe( 'Field or parameter must be of type Number with a value between 0 and 100 (inclusive); got Undefined' );
      } );
    } );
  } );

  describe( 'HVMLTypeError', () => {
    it( 'returns an object with the correct class', () => {
      let thrownError;

      try {
        throw new TypeError( {
          "className": "Foo",
          "methodName": "bar",
          "fieldName": "baz",
          "expected": "Number",
          "input": "hello",
        } );
      } catch ( error ) {
        thrownError = error;
      }

      expect( thrownError.constructor.name ).toBe( 'HVMLTypeError' );
    } );

    describe( 'returns a human-readable message', () => {
      test( '- className, - methodName, - fieldName', () => {
        let thrownError;

        try {
          throw new TypeError( {
            // "className": "Foo",
            // "methodName": "bar",
            // "fieldName": "baz",
            "expected": "Number",
            "input": "hello",
          } );
        } catch ( error ) {
          thrownError = error;
        }

        expect( thrownError.message ).toBe( 'Field or parameter must be of type Number; got String' );
      } );

      test( '- className, - methodName, + fieldName', () => {
        let thrownError;

        try {
          throw new TypeError( {
            // "className": "Foo",
            // "methodName": "bar",
            "fieldName": "baz",
            "expected": "Number",
            "input": "hello",
          } );
        } catch ( error ) {
          thrownError = error;
        }

        expect( thrownError.message ).toBe( 'baz must be of type Number; got String' );
      } );

      // '+ className, - methodName, - fieldName' not supported; see Errors

      test( '+ className, - methodName, + fieldName', () => {
        let thrownError;

        try {
          throw new TypeError( {
            "className": "Foo",
            // "methodName": "bar",
            "fieldName": "baz",
            "expected": "Number",
            "input": "hello",
          } );
        } catch ( error ) {
          thrownError = error;
        }

        expect( thrownError.message ).toBe( 'Foo::baz must be of type Number; got String' );
      } );

      test( '+ className, + methodName, + fieldName', () => {
        let thrownError;

        try {
          throw new TypeError( {
            "className": "Foo",
            "methodName": "bar",
            "fieldName": "baz",
            "expected": "Number",
            "input": "hello",
          } );
        } catch ( error ) {
          thrownError = error;
        }

        expect( thrownError.message ).toBe( 'Foo.bar::baz must be of type Number; got String' );
      } );

      test( '- className, + methodName, + fieldName', () => {
        let thrownError;

        try {
          throw new TypeError( {
            // "className": "Foo",
            "methodName": "bar",
            "fieldName": "baz",
            "expected": "Number",
            "input": "hello",
          } );
        } catch ( error ) {
          thrownError = error;
        }

        expect( thrownError.message ).toBe( 'bar::baz must be of type Number; got String' );
      } );

      // '- className, + methodName, - fieldName' not supported; see Errors
    } );

    /* --- Errors --- */

    describe( 'throws a native TypeError', () => {
      test( 'if no config object is passed', () => {
        let thrownError;

        try {
          throw new TypeError();
        } catch ( error ) {
          thrownError = error;
        }

        expect( thrownError.constructor.name ).toBe( 'TypeError' );
        expect( thrownError.message ).toBe( 'HVMLTypeError.constructor::data must be of type Object; got Undefined' );
      } );

      test( 'if `expected` is not specified in the constructor', () => {
        let thrownError;

        try {
          throw new TypeError( {
            "className": "Foo",
            // "methodName": "bar",
            "fieldName": "baz",
            // "input": 'hello',
            // "expected": "Number",
          } );
        } catch ( error ) {
          thrownError = error;
        }

        expect( thrownError.constructor.name ).toBe( 'TypeError' );
        expect( thrownError.message ).toBe( 'HVMLTypeError.constructor::data.expected must be of type String; got Undefined' );
      } );

      test( 'if `className` is specified without `fieldName` in the constructor', () => {
        let thrownError;

        try {
          throw new TypeError( {
            "className": "Foo",
            // "methodName": "bar",
            // "fieldName": "baz",
            // "input": 'hello',
            "expected": "Number",
          } );
        } catch ( error ) {
          thrownError = error;
        }

        // console.error( thrownError.message );

        // expect( thrownError.constructor.name ).toBe( 'TypeError' );
        expect( thrownError.message ).toBe( 'HVMLTypeError.constructor::data.fieldName must be of type String; got Undefined' );
      } );
    } );
  } );

  describe( 'HVMLNotIntegerError', () => {

  } );
} );
