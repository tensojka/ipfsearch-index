export class Indexer{
    invertedindex : Array<Token> //no point in saving this as Map
    index : Array<Document>

    constructor(){
        this.invertedindex = []
        this.index = []
    }

    /**
     * Add a given document to the given index.
     * @param index 
     * @param token 
     * @param documentid 
     */
    private addDocumentToInvertedIndex(document : Document){
        tokenizeAndFilter(document.getText()).forEach(function(tokenname : string) {
            this.addTokenToInvertedIndex(new Token(tokenname,[document.id]))
        },this)
    }

    private addTokenToInvertedIndex(token : Token){
        for(let i = 0; i < this.invertedindex.length ;i++){
            if(this.invertedindex[i].name === token.name){
                token.documents.forEach((docid) => {
                    this.invertedindex[i].addDocument(docid)
                })
                return
            }
        }
        this.invertedindex.push(token)
    }

    /**
     * Add a document to the index AND invertedindex.
     * @param document 
     */
    addToIndex(document : Document){
        if(this.index.indexOf(document) === -1){
            this.index.push(document)
        }else{
            throw "Document already in index"
        }
        this.addDocumentToInvertedIndex(document)
    }
}


/**
 * Replace all chars "find" in a string with "replace"
 * @param str string
 * @param find char
 * @param replace char
 */
function replaceAll(str : string, find : string, replace : string) : string{
    let newstr = []
    for(var i = 0, len = str.length; i < len; i++){
        if(str[i] === find){
            newstr[i] = replace
        }else{
            newstr[i] = str[i]
        }
    }
    return newstr.join("")
}


import * as stemmer from "./porterstemmer.js"
/**
 * Tokenizes a text, filters out stopwords and stems the tokens.
 * shouldn't really be an export function, but for tests, it has to...
 * @param text 
 * @param separators? optional by what chars to split the string while tokenizing
 */
export function tokenizeAndFilter(text : string, separators? : Array<string>) : string[]{
    text = text.toLowerCase().trim()
    if(separators === undefined){
        separators = [".","-",",","_","'","(",")","[","]","{","}","&","!",'"']
    }
    separators.forEach((c) => {
        text = replaceAll(text,c," ")
    })
    let tokens = text
        .split(' ')
        .map(function(token) { return stemmer.stemmer(token)})
    tokens = tokens.filter(function (token){
        if(token){
            if(token.toLowerCase() === "the" || token.toLowerCase() === "and" || token === "&" || token === "+"){
                return false
            }else if(token.length <= 2){
                return false
            }else if(token.startsWith("&") && token.indexOf(';') > -1){
                return false
            }else{
                return true
            }
        }else{
            return false
        }
    })
    return tokens
    
}


export class Token{
    name : string
    documents : Array<string>
    constructor(token : string, documents : string[]){
        this.name = token
        this.documents = documents
    }

    addDocument(documentid : string){
        this.documents.push(documentid)
    }

    toString(){
        return name
    }
}


/**
 * Represents a document in the index. 
 * Subclass this if you require specific fields and override getText method to return all text that should get indexed.
 * id will be used for sorting when breaking it up.
 */
export class Document{
    id : string
    text : string

    constructor(id : string,text : string){
        this.id = id
        this.text = text
    }

    /**
     * Return text for tokenization and adding to the inverted index.
     */
    getText(){
        return this.text
    }
}


/**
 * @param index index in array form
 * @return alphabetically sorted index array 
 */
export function sortInvertedIndex(index : Array<Token>) : Array<Token>{
    index.sort(function(a,b){
        if(a.name < b.name){
            return -1
        }else if(a.name == b.name){
            return 0
        }else{
            return 1
        }
    })
    return index
}


/**
 * @param index index in array form
 * @return alphabetically sorted index array 
 */
export function sortIndex(index : Array<Document>) : Array<Document>{
    index.sort(function(a,b){
        if(a.id < b.id){
            return -1
        }else if(a.id == b.id){
            return 0
        }else{
            return 1
        }
    })
    return index
}


export function mapIndextoArray(map : { [token: string]: Token; }) : Array<Token>{
    let array : Array<Token> = []
    for(let key in map){
        if(map.hasOwnProperty(key)){
            if(map[key] != null){
                array.push(map[key])
            }
        }
    }
    return array
}

/**
 * Save index to files, breaking it up.
 * @param index 
 * @param filenamestub 
 * @param blocksize How many documents to store in one file
 */
export function saveIndexToFiles(index : Array<Document>, filenamestub : string, blocksize : number){
    let splitmap : string[] = []
    for(let needle = 0; needle < index.length; needle++){
        if(needle % blocksize == 0){
            splitmap.push(index[needle].id)
        }
    }

    for(let needle = 0; needle < splitmap.length; needle++){
        //console.debug("saving index #"+needle+", starts with "+splitmap[needle])
        saveIndexToFile(index.slice(blocksize*needle, blocksize*(needle+1)), "assets/part/" + needle)
    }
}

const fs = require('fs');

/**
 * Intended to be used with saveIndexToFiles()
 * @param index 
 * @param filename 
 */
function saveIndexToFile(index : Array<Document>, filename : string){
    fs.writeFile(filename,JSON.stringify(index))
}


/** 
 * Save whole inverted index (sorted array) to a file.
 * 
 * Format of the file for inverted index:
 * first line is the file format version number (currently 1)
 * more lines are in the following format:
 * token,documentid,documentid...
 * 
 * Tokens are separated by newlines.
 * Tokens are urlencoded.
 * 
 * Async.
 * @returns void
 */
export function saveInvertedIndexToFile(invindex: Array<Token>, filename: string) : void {
    let writeStream = fs.createWriteStream(filename)
    writeStream.on('error',function(err){
        console.log('error:' + err)
    })
    writeStream.write("1\n") //version number 
    invindex.forEach(function(token){
        let string = encodeURIComponent(token.name)
        for(let docid of token.documents){
            string = string + "," + docid
        }
        writeStream.write(string + "\n")
    })
}


export function loadIndexFromFile(filename : string, callback : IndexCallback) : void {

    let loadedIndex : Array<Token> = []

    var lineReader = require('readline').createInterface({
        input: fs.createReadStream(filename)
    });
    let lineNumber = 0
    lineReader.on('line', (line : string) => {
        if(lineNumber === 0){
            if(parseInt(line) != 1){
                throw "Invalid version, must be 1!"
            }
            lineNumber++
            return
        }

        let cols = line.split(",")
        let tokenname = decodeURIComponent(cols[0])
        cols.shift()
        loadedIndex.push(new Token(tokenname, cols))

        lineNumber++
    })
    lineReader.on('close', function(){
        return callback(loadedIndex)
    })
}

interface IndexCallback {
    ( index : Array<Token>) : void;
}