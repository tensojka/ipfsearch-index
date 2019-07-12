ipfsearch-index generates index and inverted index for use by ipfsearch-webapp.

# Usage

```js
import * as ipfsearch from "ipfsearch-indexlib"
let indexer = new ipfsearch.Indexer()
indexer.addToIndex(new ipfsearch.Document("Python","A great, nice programming language. Super user-friendly."))
indexer.addToIndex(new ipfsearch.Document("Javascript","A language that was hacked together in 14 days and ECMA is trying to make it better. Still feels hacked together tho"))
//add more docs...

indexer.persist("assets/sortedindex.inx", "assets/index.inx","authors name","index name","URL")
```

# Building

Clone this repo and run:

```bash
$ npm install
$ node_modules/typescript/bin/tsc -p tsconfig.json
```

# Test index

The meta.json for the files has been generated and saved to ipfs at QmUFVKRPGsGUziEydsic91GfuDzJTjXdoxSiv9dHjutv1g. It references another ipfs directory that contains the generated invinx and inx.

# Result page

You can include a "result page" in your index that will be sent raw results. You can use it to format the result or add sorting.

## Result page iframe API

The result page will get the results via [cross-document messaging](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage).

The message passed is a Javascript object: `{"type": "results", "results": Document[]}`.
Document is an object, fetched from inx. It has to contain id, text and possibly more attributes. You will find what you have put into the index there.
