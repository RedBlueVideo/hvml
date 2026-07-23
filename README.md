# hvml
[HVML](https://hvml.redblue.video) Parser for Node.js

[![CI](https://github.com/RedBlueVideo/hvml/actions/workflows/ci.yml/badge.svg)](https://github.com/RedBlueVideo/hvml/actions/workflows/ci.yml) [![Code Coverage](https://img.shields.io/codecov/c/github/RedBlueVideo/hvml/master.svg)](https://codecov.io/gh/RedBlueVideo/hvml/) [![Downloads per month (NPM)](https://img.shields.io/npm/dm/hvml.svg)](https://www.npmjs.com/package/hvml)

HVML (Hypervideo Markup Language) is a video metadata vocabulary. It covers three main classes of metadata:
- Technical details, like the available resolutions or codecs of a media file;
- Artistic details, like who appears in a given movie or what awards it has won; and
- Interactive UI instructions for compatible video players such as [RedBlue](https://github.com/RedBlueVideo/redblue).

HVML is designed to be human-friendly enough to write by hand in most cases. This library is not required in order to use it; it just provides an imperative API for working with it programmatically — and serves as the reference implementation of the (evolving) HVML specification.

## Installation

```shell
yarn add hvml
```
or
```shell
npm install hvml
```

Requires Node ≥ 18.20. This is an **ESM-only** package (`import`, not `require`) — see [TypeScript & Module Notes](#typescript--module-notes).

## Example Usage

```ts
import { HVML, Video } from 'hvml';

const hvml = new HVML( './hvml.xml' );
await hvml.ready;
console.log( hvml.toJson() );

const video = new Video( {
  "type": ["personal", "documentary"],
  "lang": "en-US",
  "id": "welcome-to-my-channel",
} );
video.setTitle( 'Welcome to My Channel!' );
video.setTitle( 'チャンネルへようこそ！', 'ja' );
// The Video types `personal` and `documentary` combine
// to create an implicit "vlog episode" semantic.
console.log( video.isVlogEpisode() ); // true

hvml.appendChild( video );

// DOM cue: children is a live, named collection —
// look children up by id via bracket access…
hvml.children['welcome-to-my-channel'];
// …or the typed, null-safe namedItem() (cf. HTMLCollection.namedItem)
hvml.children.namedItem( 'welcome-to-my-channel' );
```

## TypeScript & Module Notes

The library is written in TypeScript and ships complete declarations — the types *are* the API documentation, designed the way `lib.dom` models browsers:

- **`HVMLElementTagNameMap`** maps every HVML tag name to its element class, mirroring `HTMLElementTagNameMap`. `createHVMLElement( 'video' )` returns a typed `HVMLVideoElement | undefined`.
- **DOM-cue naming.** Class identities follow the DOM convention: the `video` element class is `HVMLVideoElement` (as browsers say `HTMLVideoElement`), with **`Video`** exported as its ergonomic alias. Unknown tags are represented by `HVMLUnknownElement` (cf. `HTMLUnknownElement`) rather than failing.
- **`HVMLCollection`** models the DOM's live, named element collection — bracket access by `id` *and* `namedItem()` — something TypeScript's own `HTMLCollection` type cannot express.
- **Spec-pinned vocabulary.** The element tag-name union derives from `HVML_ELEMENT_TAG_NAMES`, which a conformance test diffs against the RELAX NG grammar (`rng/hvml.rng`) — the schema remains the single source of truth as the spec evolves.
- Compiled under `"strict": true` with `lib: ["ES2022"]` — the published types work in Node projects without the browser (`"dom"`) lib.
- **ESM-only.** The element registry is a stateful singleton; a dual CJS/ESM build would risk two registries in one process (the dual-package hazard). On Node ≥ 22, CommonJS consumers can `require()` it natively; otherwise use dynamic `import()`.

## Roadmap

View project progress at the [public Trello board](https://trello.com/b/SJg4TLYz/hvml).

## API

### HVML

A Class representing the [`hvml` root element](https://hvml.redblue.video/elements/hvml/).

#### Constructor: `new HVML([path], [config])`

- `path`: (optional) HVML file to be read. Omit to start from an empty document.
- `config`: (optional) Configuration object with keys:
  - `schemaPath` Path to validation schema. Defaults to `rng/hvml.rng` (relative to `node_modules/hvml/`).
  - `schemaType`: Type of validation schema, `rng` for RELAX NG or `xsd` for XML Schema Definition. Currently only `rng` is supported. Defaults to `rng`.
  - `encoding`: `readFile` character encoding. Defaults to `utf8`.

Returns <b>Object</b>, an instance of `HVML`.

#### Instance Properties

##### `.ready`

<b>Promise</b> that resolves when your HVML file and the internal schema used for validation are both successfully read from the file system.

The Promise itself returns a [libxmljs](https://github.com/libxmljs/libxmljs) object representing the XML tree of the file. This object is also accessible as the instance property `.xml`, so you don’t need to capture it on your first `then()`.

##### `.xml`

<b>Object</b> representing the XML tree of your HVML file, as returned from [libxmljs](https://github.com/libxmljs/libxmljs).

This is mostly just used internally but it’s provided as a convenience for custom operations.

##### `.children`

<b>HVMLCollection</b>. The element’s children — an array that also supports named lookup by child `id`, via bracket access (`children['my-id']`) or `namedItem( 'my-id' )`.

##### `.hvmlPath`

<b>String</b>. The HVML file path specified in the constructor.

#### Instance Methods

##### `.toJson()`

Transforms the current HVML tree to its JSON representation (i.e. an object literal).

Returns <b>Object</b>.

##### `.appendChild(child)` / `.removeChild(child)`

DOM cues: add or remove a child element (`Video` or `Series` at the root). Children with an `id` register a named index on `.children`.

##### `.validate([xmllintPath])`
Validates the HVML file against an internal RELAX NG schema.

- `xmllintPath`: Path where Node can find `xmllint`¹. Defaults to `xmllint` (which assumes it is somewhere in your system’s `$PATH`, such as `/usr/bin/`).

Returns a Promise that
- Resolves to `true` on validation success; or
- Rejects with an `object` on validation error, for example:
```json
  {
    "message": "./bad.hvml:3: element ovml: Relax-NG validity error : Expecting element hvml, got ovml",
    "error": "Expecting element hvml, got ovml",
    "file": "./bad.hvml",
    "line": "3",
    "type": "validity",
    "expecting": "hvml",
    "got": "ovml"
  }
```

¹ `xmllint` is a command-line tool written in C which performs XML validation according to schema rules. Due to the added complexity of porting this utility to JavaScript, `.validate()` currently requires the `xmllint` binary to be installed on your system and available to Node. It comes bundled with `libxml2`, which you may already have if you work with XML a lot.

If you don’t have `libxml2` installed, you must [download it](http://xmlsoft.org/downloads.html) and compile the source code using the following steps:

```shell
cd libxml2/
./autogen.sh
configure
make
make install
```

We realize this is a pain but we’d rather ship the feature than be blocked by a lack of C/C++ experience. Pull requests welcome!

### Video

A Class representing a [`video` element](https://hvml.redblue.video/elements/video/). `Video` is the export alias of the canonical class `HVMLVideoElement` (DOM cue: `HTMLVideoElement`).

#### Constructor: `new Video([config])`

- `config`: (optional) `HVMLVideoElementConfig` object with keys:
  - `type`: Space-separated string or array containing valid video types (`narrative`, `documentary`, `ad`, `personal`, `historical`).
  - `lang`: A [BCP 47](https://tools.ietf.org/html/bcp47) language/region tag, e.g. `en` or `en-US`.
  - `id`: An XML/HTML-style unique ID for querying.

Returns <b>Object</b>, an instance of `Video`.

##### Example

```ts
import { Video } from 'hvml';

const video = new Video( {
  "type": ["personal", "documentary"],
  "lang": "en-US",
  "id": "welcome-to-my-channel",
} );
```

#### Static Methods

##### `isValidType(type)`

Checks if the given video type is allowed in HVML.

- `type`: String of individual type to check.

Returns <b>Boolean</b>.

##### Example

```ts
import { Video } from 'hvml';

console.log( Video.isValidType( 'narrative' ) ); // true
console.log( Video.isValidType( 'big-chungus' ) ); // false
```

#### Instance Methods

##### `hasType(type)`

Checks if a `Video` object has a given type set.

Returns <b>Boolean</b>.

##### Example

```ts
import { Video } from 'hvml';

const video = new Video( {
  "type": ["personal", "documentary"],
  "lang": "en-US",
  "id": "welcome-to-my-channel",
} );
console.log( video.hasType( 'documentary' ) ); // true
console.log( video.hasType( 'ad' ) ); // false
```

##### `isVlogEpisode()`

Convenience method. Checks if a `Video` object contains the special type combination `personal` + `documentary`.

Returns <b>Boolean</b>.

##### Example

```ts
import { Video } from 'hvml';

const video = new Video( {
  "type": ["personal", "documentary"],
  "lang": "en-US",
  "id": "welcome-to-my-channel",
} );
console.log( video.isVlogEpisode() ); // true
```

##### `isArchived()`

Convenience method. Checks if a `Video` object contains the special type combination `personal` + `historical`.

Returns <b>Boolean</b>.

##### Example

```ts
import { Video } from 'hvml';

const video = new Video( {
  "type": ["personal", "historical"],
  "lang": "en-US",
  "id": "welcome-to-my-channel",
} );
console.log( video.isArchived() ); // true
```
