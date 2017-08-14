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

    it('persist', function(){
        let indexer = new ipfsearch.Indexer()
        indexer = addExampleData(indexer)
        indexer.persist("assets/test/invinx","assets/test/inx", "ipfsearch-index tests", "test items")
        let saved = ipfsearch.mapToArray(indexer.index) 
        ipfsearch.loadIndexFromFile(fs.readFileSync("assets/test/invinx", 'utf-8'), function(loaded){
            assert.equal(saved, loaded)
        })


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

    it('persisting',function(){
        let indexer = new ipfsearch.Indexer()
        indexer = addExampleData(indexer)
        let sortedindex = ipfsearch.mapToArray(indexer.index)
        should(sortedindex.length).equal(3)
        //should(sortedindex).containEql(new ipfsearch.Document("Pear","A very juicy fruit with cinnamon spices."))

    })
})

function addExampleData(indexer : ipfsearch.Indexer) : ipfsearch.Indexer{
    indexer.addToIndex(new ipfsearch.Document("Pear","A very juicy fruit with cinnamon spices."))
    indexer.addToIndex(new ipfsearch.Document("Apple","The fruit that caused the first sin. To this day is connected to sins."))
    indexer.addToIndex(new ipfsearch.Document("Banana","The cause of many wars between apes and humans for how they should be peeled."))
    return indexer
}