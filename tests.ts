const assert = require('assert');
const should = require('should');
let ipfsearch = require('./ipfsearch-indexlib')
const fs = require("fs")


//USAGE EXAMPLES, OPTIMIZED FOR HUMAN READING:
describe('Simple usage', function(){
    it('create index and save it', function(){
        let indexer = new ipfsearch.Indexer()
        indexer.addToIndex(new ipfsearch.Document("Python","A great, nice programming language. Super user-friendly."))
        indexer.addToIndex(new ipfsearch.Document("Javascript","A language that was hacked together in 14 days and ECMA is trying to make it better. Still feels hacked together tho"))
        //add more docs...
        
        indexer.persist("assets/sortedindex.inx", "assets/index.inx", function(){})
    })
})




describe('Unit tests', function(){
    it('added document is in index', function(){
        let indexer = new ipfsearch.Indexer()
        indexer.addToIndex(new ipfsearch.Document("Hello", "hello, it's me."))
        assert.equal(isTokenInIndex(indexer.invertedindex,"hello"), true)
        assert.notEqual(isTokenInIndex(indexer.invertedindex,"me"), true)
    })

    it('tokenization and filtering', function(){
        let tokens = []
        tokens = ipfsearch.tokenizeAndFilter("Hello, it's me.")
        assert.notEqual(tokens.indexOf("hello"), -1)

        tokens = ipfsearch.tokenizeAndFilter("A great, nice programming language. Super user-friendly.")
        tokens.should.containEql("great")
        tokens.should.containEql("nice")
        tokens.should.containEql("program")
        tokens.should.containEql("languag")
        tokens.should.containEql("super")
        tokens.should.containEql("user")
        tokens.should.containEql("friendli")
    })
})

function isTokenInIndex(invinx, name){
    for(token of invinx){
        if(token.name === name){
            return true
        }
    }
}