const HVMLElement = require( './hvml-element' );
const Video = require( './video' );

describe( 'HVMLElement', () => {
  it( 'appends children', () => {
    const hvml = new HVMLElement();
    const channel = new Video();
    const secondChannel = new Video();

    hvml.appendChild( channel );
    hvml.appendChild( secondChannel );

    expect( hvml.children.length ).toBe( 2 );
    expect( Object.keys( hvml.children ).length ).toBe( 2 );
    expect( hvml.children[0] ).toStrictEqual( channel );
    expect( hvml.children[1] ).toStrictEqual( secondChannel );
  } );

  it( 'registers named indices when appending children with IDs', () => {
    const hvml = new HVMLElement();
    const channel = new Video( {
      "id": "welcome-to-my-channel",
    } );
    const secondChannel = new Video( {
      "id": "welcome-to-my-second-channel",
    } );

    hvml.appendChild( channel );
    hvml.appendChild( secondChannel );

    expect( hvml.children['welcome-to-my-channel'] ).toStrictEqual( channel );
    expect( hvml.children['welcome-to-my-second-channel'] ).toStrictEqual( secondChannel );
  } );

  it( 'removes children', () => {
    const hvml = new HVMLElement();
    const channel = new Video();
    const secondChannel = new Video();

    hvml.appendChild( channel );
    hvml.appendChild( secondChannel );
    hvml.removeChild( channel );

    expect( hvml.children.length ).toBe( 1 );
    expect( Object.keys( hvml.children ).length ).toBe( 1 );
  } );

  it( 'deregisters named indices when removing children with IDs', () => {
    const hvml = new HVMLElement();
    const channel = new Video( {
      "id": "welcome-to-my-channel",
    } );
    const secondChannel = new Video( {
      "id": "welcome-to-my-second-channel",
    } );

    hvml.appendChild( channel );
    hvml.appendChild( secondChannel );
    hvml.removeChild( channel );

    expect( hvml.children.length ).toBe( 1 );
    expect( Object.keys( hvml.children ).length ).toBe( 2 );
    expect( hvml.children['welcome-to-my-channel'] ).toBeUndefined();
    expect( hvml.children['welcome-to-my-second-channel'] ).toStrictEqual( secondChannel );
  } );
} );
