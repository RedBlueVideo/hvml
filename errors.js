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

class HVMLValueError extends HVMLDomainError {
  constructor( className, fieldName, badValues ) {
    super( `The following values are invalid for ${className}::${fieldName}: ${badValues.join( ', ' )}` );
    this.data = {
      "field": fieldName,
      badValues,
    };
  }
}

module.exports = {
  HVMLValueError,
};
