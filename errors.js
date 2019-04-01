// https://rclayton.silvrback.com/custom-errors-in-node-js
class DomainError extends Error {
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

class ValueError extends DomainError {
  constructor( field, badValues ) {
    super( `The following are not valid ${field} types: ${badValues.join( ', ' )}` );
    this.data = { field, badValues };
  }
}

module.exports = {
  ValueError,
};
