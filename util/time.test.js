const Time = require( './time.cjs' ).default;

describe( 'Time', () => {
  it( 'parses ISO 8601 durations', () => {
    expect.assertions( 30 );
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
    // 1 year, 6 months, 3 weeks, 1 hour, 15 minutes, 8 seconds
    const testOne = 'P1Y6M3WT1H15M8S'.match( Time.isoDurationRegex );

    expect( testOne ).not.toBe( null );
    expect( testOne[0] ).toBe( 'P1Y6M3WT1H15M8S' ); // Input
    expect( testOne[1] ).toBe( '' ); // Negative indicator
    expect( testOne[2] ).toBe( '1' ); // Years
    expect( testOne[3] ).toBe( '6' ); // Months
    expect( testOne[4] ).toBe( '3' ); // Days/Weeks
    expect( testOne[5] ).toBe( 'W' ); // Days/Weeks indicator
    expect( testOne[6] ).toBe( '1' ); // Hours
    expect( testOne[7] ).toBe( '15' ); // Minutes
    expect( testOne[8] ).toBe( '8' ); // Seconds

    // 1 year, 6 months, 21 days, 1 hour, 15 minutes, 8 seconds
    const testTwo = 'P1Y6M21DT1H15M8S'.match( Time.isoDurationRegex );

    expect( testTwo ).not.toBe( null );
    expect( testTwo[0] ).toBe( 'P1Y6M21DT1H15M8S' ); // Input
    expect( testTwo[1] ).toBe( '' ); // Negative indicator
    expect( testTwo[2] ).toBe( '1' ); // Years
    expect( testTwo[3] ).toBe( '6' ); // Months
    expect( testTwo[4] ).toBe( '21' ); // Days/Weeks
    expect( testTwo[5] ).toBe( 'D' ); // Days/Weeks indicator
    expect( testTwo[6] ).toBe( '1' ); // Hours
    expect( testTwo[7] ).toBe( '15' ); // Minutes
    expect( testTwo[8] ).toBe( '8' ); // Seconds

    // 3 minutes
    const testThree = 'PT3M'.match( Time.isoDurationRegex );

    expect( testThree ).not.toBe( null );
    expect( testThree[0] ).toBe( 'PT3M' ); // Input
    expect( testThree[1] ).toBe( '' ); // Negative indicator
    expect( testThree[2] ).toBeUndefined(); // Years
    expect( testThree[3] ).toBeUndefined(); // Months
    expect( testThree[4] ).toBeUndefined(); // Days/Weeks
    expect( testThree[5] ).toBeUndefined(); // Days/Weeks indicator
    expect( testThree[6] ).toBeUndefined(); // Hours
    expect( testThree[7] ).toBe( '3' ); // Minutes
    expect( testThree[8] ).toBeUndefined(); // Seconds
  } );

  describe( 'converts time formats', () => {
    test( 'ISO 8601 duration → hours', () => {
      const oneYearTwoDays = ( 8760 + 48 );
      const oneYearTwoDaysThreeMinutes = ( 8760 + 48 + 0.05 );
      const oneYearSixMonthsTwentyoneDaysOneHourFifteenMinutesEightSeconds = ( 8760 + ( 6 * 730.001 ) + 504 + 1 + 0.25 + ( 8 / 3600 ) );

      expect.assertions( 6 );

      expect( Time.isoDurationToHours( 'P1Y2D' ) ).toBe( oneYearTwoDays );
      expect( Time.isoDurationToHours( 'P1Y2DT0H3M' ) ).toBe( oneYearTwoDaysThreeMinutes );
      expect( Time.isoDurationToHours( 'PT3M' ) ).toBe( 0.05 );
      expect( Time.isoDurationToHours( 'PT90M' ) ).toBe( 1.5 );
      expect( Time.isoDurationToHours( 'P1Y6M3WT1H15M8S' ) ).toBe( oneYearSixMonthsTwentyoneDaysOneHourFifteenMinutesEightSeconds );
      expect( Time.isoDurationToHours( 'P1Y6M21DT1H15M8S' ) ).toBe( oneYearSixMonthsTwentyoneDaysOneHourFifteenMinutesEightSeconds );
    } );

    test( 'ISO 8601 duration → minutes', () => {
      const oneYearTwoDays = ( 525600 + 2880 );
      const oneYearTwoDaysThreeMinutes = ( 525600 + 2880 + 3 );
      const oneYearSixMonthsTwentyoneDaysOneHourFifteenMinutesEightSeconds = ( 525600 + ( 6 * 43800.048 ) + 30240 + 60 + 15 + ( 8 / 60 ) );

      expect.assertions( 6 );

      expect( Time.isoDurationToMinutes( 'P1Y2D' ) ).toBe( oneYearTwoDays );
      expect( Time.isoDurationToMinutes( 'P1Y2DT0H3M' ) ).toBe( oneYearTwoDaysThreeMinutes );
      expect( Time.isoDurationToMinutes( 'PT3M' ) ).toBe( 3 );
      expect( Time.isoDurationToMinutes( 'PT90M' ) ).toBe( 90 );
      expect( Time.isoDurationToMinutes( 'P1Y6M3WT1H15M8S' ) ).toBe( oneYearSixMonthsTwentyoneDaysOneHourFifteenMinutesEightSeconds );
      expect( Time.isoDurationToMinutes( 'P1Y6M21DT1H15M8S' ) ).toBe( oneYearSixMonthsTwentyoneDaysOneHourFifteenMinutesEightSeconds );
    } );

    it( 'throws an error for bad inputs', () => {
      let thrownErrorOne;
      let thrownErrorTwo;

      expect.assertions( 2 );

      try {
        Time.isoDurationToHours( '' );
      } catch ( error ) {
        thrownErrorOne = error;
      }

      expect( thrownErrorOne.message ).toBe( 'Invalid duration' );

      try {
        Time.isoDurationToMinutes( '' );
      } catch ( error ) {
        thrownErrorTwo = error;
      }

      expect( thrownErrorTwo.message ).toBe( 'Invalid duration' );
    } );
  } );
} );
