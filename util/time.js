class Time {
  static get isoDurationRegex() {
    // https://rgxdb.com/r/MD2234J
    /*
      1. negative ('-' == negative, empty == positive)
      2. years
      3. months
      4. days/weeks
      5. W or D (W == weeks, D == days)
      6. hours
      7. minutes
      8. seconds
    */
    return /^(-?)P(?=\d|T\d)(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)([DW]))?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?$/;
  }

  static isoDurationToHours( duration ) {
    const matches = duration.match( Time.isoDurationRegex );

    if ( matches ) {
      let hours = 0;

      // Years
      if ( matches[2] ) {
        hours += ( parseInt( matches[2], 10 ) * 8760 );
      }

      // Months
      if ( matches[3] ) {
        hours += ( parseInt( matches[3], 10 ) * 730.001 );
      }

      // Days/Weeks
      if ( matches[4] ) {
        switch ( matches[5] ) {
          case 'W':
            hours += ( parseInt( matches[4], 10 ) * 168 );
            break;
          case 'D':
            hours += ( parseInt( matches[4], 10 ) * 24 );
            break;
          // no default
        }
      }

      // Hours
      if ( matches[6] ) {
        hours += parseInt( matches[6], 10 );
      }

      // Minutes
      if ( matches[7] ) {
        hours += ( parseInt( matches[7], 10 ) / 60 );
      }

      // Seconds
      if ( matches[8] ) {
        hours += ( parseInt( matches[8], 10 ) / 3600 );
      }

      return hours;
    }

    throw new Error( `Invalid duration` );
  }

  static isoDurationToMinutes( duration ) {
    const matches = duration.match( Time.isoDurationRegex );

    if ( matches ) {
      let minutes = 0;

      // Years
      if ( matches[2] ) {
        minutes += ( parseInt( matches[2], 10 ) * 525600 );
      }

      // Months
      if ( matches[3] ) {
        minutes += ( parseInt( matches[3], 10 ) * 43800.048 );
      }

      // Days/Weeks
      if ( matches[4] ) {
        switch ( matches[5] ) {
          case 'W':
            minutes += ( parseInt( matches[4], 10 ) * 10080 );
            break;
          case 'D':
            minutes += ( parseInt( matches[4], 10 ) * 1440 );
            break;
          // no default
        }
      }

      // Hours
      if ( matches[6] ) {
        minutes += ( parseInt( matches[6], 10 ) * 60 );
      }

      // Minutes
      if ( matches[7] ) {
        minutes += parseInt( matches[7], 10 );
      }

      // Seconds
      if ( matches[8] ) {
        minutes += ( parseInt( matches[8], 10 ) / 60 );
      }

      return minutes;
    }

    throw new Error( `Invalid duration` );
  }
}

export default Time;
