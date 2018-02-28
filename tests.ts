import * as assert from "assert"
import * as should from "should"
import * as ipfsearch from './ipfsearch-indexlib'
import * as fs from 'fs'


describe('API', function(){
    it('added document is in index', function(){
        let indexer = new ipfsearch.Indexer()
        indexer.addToIndex(new ipfsearch.Document("Hello", "hello, it's me."))
        assert.ok(indexer.invertedindex.has("hello"))
        assert.ok(indexer.index.has("Hello"))
    })

    it('persist', function(done){
        let indexer = new ipfsearch.Indexer()
        indexer = addExampleData(indexer)
        indexer.persist("assets/test/invinx","assets/test/inx", "ipfsearch-index test runner", "test items","ipfs://",1000)
        let saved = ipfsearch.sortInvertedIndex(ipfsearch.mapToArray(indexer.invertedindex))
        ipfsearch.loadIndexFromFile("assets/test/invinx0", function(loaded){
            should(loaded.length).equal(saved.length)
            done()
        })
        assert.ok(fs.existsSync("assets/test/inx.meta.json"))

    })
})

describe('insides',function(){
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

    it('adding to index',function(){
        let indexer = new ipfsearch.Indexer()
        indexer = addExampleData(indexer)
        let sortedindex = ipfsearch.mapToArray(indexer.index)
        should(sortedindex.length).equal(3)
        should(sortedindex).containEql(new ipfsearch.Document("Pear","A very juicy fruit with cinnamon spices."))

    })

    it('document with a comma in name doesnt confuse the invinx format', function(done){
        let indexer = new ipfsearch.Indexer()
        indexer = addExampleData(indexer)
        indexer.addToIndex(new ipfsearch.Document("Mango,1999","A fruit that causes problems very often, especially with a comma ;)"))
        indexer.persist("assets/test/invinx","assets/test/inx", "ipfsearch-index test runner", "test items","ipfs://",1000)
        ipfsearch.loadIndexFromFile("assets/test/invinx0", function(loaded){
            should(loaded).not.containEql(new ipfsearch.Token("problem",["Mango","1999"]))
            should(loaded).containEql(new ipfsearch.Token("problem",["Mango,1999"]))
            done()
        })
    })
})

function addExampleData(indexer : ipfsearch.Indexer) : ipfsearch.Indexer{
    indexer.addToIndex(new ipfsearch.Document("Pear","A very juicy fruit with cinnamon spices."))
    indexer.addToIndex(new ipfsearch.Document("Apple","The fruit that caused the first sin. To this day is connected to sins."))
    indexer.addToIndex(new ipfsearch.Document("Banana","The cause of many wars between apes and humans for how they should be peeled."))
    return indexer
}