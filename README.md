# hvml
[HVML](https://hypervideo.tech) Parser for Node.js

[![Build Status](https://api.travis-ci.com/RedBlueVideo/hvml.svg?branch=master)](https://travis-ci.com/RedBlueVideo/hvml)

HVML (Hypervideo Markup Language) is a video metadata vocabulary. It covers three main classes of metadata:
- Technical details, like the available resolutions or codecs of a media file;
- Artistic details, like who appears in a given movie or what awards it has won; and
- Interactive UI instructions for compatible video players such as [RedBlue](https://github.com/RedBlueVideo/redblue).

HVML is designed to be human-friendly enough to write by hand in most cases. This library is not required in order to use it; it just provides an imperative API for working with it programmatically.

## Installation
```shell
yarn add hvml
```
or
```shell
npm install hvml
```

## Example Usage

```js
const HVML = require( 'hvml' );
const hvml = new HVML( './hvml.xml' );
hvml.ready.then( () => {
  // Instance methods available now
  console.log( hvml.toJson() );
} );
```

## API

### Constructor

#### `new HVML(path, [encoding])`

- `path`: HVML file to be read.
- `encoding`: `readFile` character encoding. Defaults to `utf8`.

### Instance Properties

#### `.ready`
A Promise that resolves when your HVML file and the internal schema used for validation are both successfully read from the file system.

The Promise itself returns a [libxmljs](https://github.com/libxmljs/libxmljs) object representing the XML tree of the file. This object is also accessible as the instance property `.xml`, so you don’t need to capture it on your first `then()`.

#### `.xml`
A [libxmljs](https://github.com/libxmljs/libxmljs) object representing the XML tree of the file.

This is mostly just used internally but it’s provided as a convenience for custom operations.

#### `.hvmlPath`
The path specified in the constructor.

### Instance Methods

#### `.toJson()`
Transforms the current HVML tree to its JSON representation (i.e. an object literal).

#### `.validate([xmllintPath])`
Validates the HVML file against an internal Relax-NG schema.

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
