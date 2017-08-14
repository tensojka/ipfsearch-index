import * as assert from "assert"
import * as should from "should"
const ipfsearch = require('./ipfsearch-indexlib')
const fs = require("fs")


describe('Unit tests', function(){
    it('added document is in index', function(){
        let indexer = new ipfsearch.Indexer()
        indexer.addToIndex(new ipfsearch.Document("Hello", "hello, it's me."))
        assert.ok(indexer.invertedindex.has("hello"))
    })

    it('tokenization and filtering', function(){
        let tokens = []
        tokens = ipfsearch.tokenizeAndFilter("Hello, it's me.")
        assert.notEqual(tokens.indexOf("hello"), -1)

        tokens = ipfsearch.tokenizeAndFilter("A great, nice programming language. Super user-friendly.")
        should(tokens).containEql("great")
        should(tokens).containEql("nice")
        should(tokens).containEql("program")
        should(tokens).containEql("languag")
        should(tokens).containEql("super")
        should(tokens).containEql("user")
        should(tokens).containEql("friendli")
    })
})