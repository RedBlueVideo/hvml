import {
  HVML,
  HVMLUnknownElement,
  Presentation,
} from './hvml.js';

/**
 * A `presentation` with one `file` child. `file` has no dedicated
 * class, so ingest materializes it as an `HVMLUnknownElement`; this
 * helper builds the same shape.
 */
function createFileBearingPresentation( id: string ): Presentation {
  const presentation = new Presentation( { id } );
  presentation.children.push( new HVMLUnknownElement( 'file' ) );
  return presentation;
}

describe( 'Presentation', () => {
  let hvml: HVML | undefined;

  beforeEach( () => {
    hvml = undefined;
  } );

  /**
   * Reads a MOM built from a fixture down to its `video`’s
   * `presentation` children, in document order.
   */
  function getIngestedPresentations( fixturePath: string ): Promise<Presentation[]> {
    hvml = new HVML( fixturePath );
    return hvml.ready.then( () => {
      const MOM = hvml!.toMom();
      const video = MOM.children[0];
      const presentations = video.children.filter( ( child ) => child.nodeName === 'presentation' );

      presentations.forEach( ( presentation ) => {
        expect( presentation ).toBeInstanceOf( Presentation );
      } );

      return presentations as Presentation[];
    } );
  }

  it( 'materializes presentation elements as Presentation instances', async () => {
    const presentations = await getIngestedPresentations( './examples/hvml.jsonld' );

    expect( presentations ).toHaveLength( 2 );
    expect( presentations[1].about ).toBe( 'https://hugh.today/2016-09-17/live' );
  } );

  it( 'reports a presentation without files as instruction-only', async () => {
    const [choicePresentation, rebroadcast] = await getIngestedPresentations( './examples/hvml.jsonld' );

    expect( choicePresentation.isInstructionOnly() ).toBe( true );
    expect( rebroadcast.isInstructionOnly() ).toBe( true );
    expect( createFileBearingPresentation( 'encoded' ).isInstructionOnly() ).toBe( false );
  } );

  describe( 'selectFirstPlayable', () => {
    it( 'selects the first presentation the player can play, in document order', () => {
      const instructionOnly = new Presentation( { "id": 'trivia' } );
      const undecodable = createFileBearingPresentation( 'av1' );
      const decodable = createFileBearingPresentation( 'h264' );
      const alsoDecodable = createFileBearingPresentation( 'vp9' );
      const candidates = [instructionOnly, undecodable, decodable, alsoDecodable];

      expect( Presentation.selectFirstPlayable( candidates ) ).toBe( undecodable );
      expect( Presentation.selectFirstPlayable(
        candidates,
        ( presentation ) => presentation.id !== 'av1',
      ) ).toBe( decodable );
    } );

    it( 'excludes instruction-only presentations from source selection', () => {
      const trivia = new Presentation( { "id": 'trivia' } );
      const commentary = new Presentation( { "id": 'commentary' } );

      expect( Presentation.selectFirstPlayable( [trivia, commentary] ) ).toBeNull();
      expect( Presentation.selectFirstPlayable( [trivia, commentary], () => true ) ).toBeNull();
    } );

    it( 'skips sibling elements that are not presentations', async () => {
      hvml = new HVML( './examples/hvml.jsonld' );
      await hvml.ready;
      const video = hvml.toMom().children[0];
      const encoded = createFileBearingPresentation( 'encoded' );

      // The flagship fixture plays from its showing’s venue: no presentation there carries files
      expect( Presentation.selectFirstPlayable( video.children ) ).toBeNull();

      video.children.push( encoded );
      expect( Presentation.selectFirstPlayable( video.children ) ).toBe( encoded );
    } );
  } );
} );
