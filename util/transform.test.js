const Transform = require( './transform.cjs' ).default;

describe( 'Transform', () => {
  test( 'markdownToJsonMl', () => {
    const input = '**Hey now!**';
    const output = Transform.markdownToJsonMl( input );

    expect( output ).toEqual( [
      "div", { "xmlns": "http://www.w3.org/1999/xhtml" }, [
        "p", [
          "strong", "Hey now!",
        ],
      ],
    ] );
  } );

  test( 'xmlStringToJsonMl', () => {
    const input = '<strong>Hey now!</strong>';
    const output = Transform.xmlStringToJsonMl( input );

    expect( output ).toEqual(
      ["#document",
        ["strong", "Hey now!"]],
    );
  } );

  test( 'jsonMlToXmlString', () => {
    const input = ["div", { "xmlns": "http://www.w3.org/1999/xhtml" },
      ["p", ["strong", "Hey now!"]]];
    const output = Transform.jsonMlToXmlString( input );

    expect( output ).toBe( '<div xmlns="http://www.w3.org/1999/xhtml"><p><strong>Hey now!</strong></p></div>' );
  } );

  test( 'jsonMlWrapper', () => {
    expect( Transform.jsonMlWrapper ).toEqual(
      ['div', {
        "xmlns": "http://www.w3.org/1999/xhtml",
      }],
    );
  } );

  test( 'xhtmlWrapper', () => {
    expect( Transform.xhtmlWrapper ).toBe( '<div xmlns="http://www.w3.org/1999/xhtml">$innerHTML</div>' );
  } );

  test( 'wrapXhtml', () => {
    expect( Transform.wrapXhtml( '<p>Foo</p>' ) ).toBe( '<div xmlns="http://www.w3.org/1999/xhtml"><p>Foo</p></div>' );
  } );

  test( 'wrapJsonMl', () => {
    // Needs to be wrapped in additional array in order to
    // register as child nodes instead of sibling nodes
    const input = [
      [
        "p", [
          "strong", "Hey now!",
        ],
      ],
    ];
    const expectedOutput = [
      "div", { "xmlns": "http://www.w3.org/1999/xhtml" }, [
        "p", [
          "strong", "Hey now!",
        ],
      ],
    ];

    expect( Transform.wrapJsonMl( input ) ).toEqual( expectedOutput );
  } );

  test( 'getJsonMlTextContent', () => {
    /* getJsonMlTextContent(
        jsonML,
        preserveBRs = false,
        normalizeWhitespace = false
    ) */
    const aBunchOfWhitespace = '                        ';
    const jsonMl = [
      "div", { "xmlns": "http://www.w3.org/1999/xhtml" }, [
        "p", [
          "strong", "Hey now!",
        ],
        [
          "br",
        ],
        [
          "p", [
            "b", `${aBunchOfWhitespace}`,
          ],
        ],
        "unaccompanied child",
      ],
    ];

    expect.assertions( 4 );

    expect( Transform.getJsonMlTextContent( jsonMl ) ).toBe( `Hey now!${aBunchOfWhitespace}unaccompanied child` );
    expect( Transform.getJsonMlTextContent( jsonMl, true ) ).toBe( `Hey now!\n${aBunchOfWhitespace}unaccompanied child` );
    expect( Transform.getJsonMlTextContent( jsonMl, true, true ) ).toBe( `Hey now!\nunaccompanied child` );
    expect( Transform.getJsonMlTextContent( jsonMl, false, true ) ).toBe( `Hey now!unaccompanied child` );
  } );
} );
