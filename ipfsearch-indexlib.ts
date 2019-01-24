import * as fs from "fs"

export class Indexer{
    invertedindex : Map<string,Token>
    index : Map<string,Document> //maps docid to whole doc

    constructor(){
        this.invertedindex = new Map()
        this.index = new Map()
    }

    /**
     * Saves invinx and inx to cwd, and 
     * @param invinxFilename relative to cwd. If blocksize set, will be appended by number.
     * @param indexFilename relative to cwd. If blocksize set, will be appended by number.
     * @param baseURL the start of the URL for invinxFilename and indexFilename.
     * The meta.json file will be placed in indexFilename + ".meta.json"
     * @param blocksize If you don't provide a blocksize, files won't be split up.
     */
    persist(invinxFilename : string, indexFilename : string, author : string, indexname : string, baseURL : string, blocksize? : number){
        if(blocksize === undefined){
            let sortedindex = sortInvertedIndex(mapToArray(this.invertedindex))
            saveInvertedIndexToFile(sortedindex, invinxFilename)

            // may choke on large indices
            fs.writeFileSync(indexFilename, JSON.stringify(sortIndex(mapToArray(this.index))))
        }else{
            let indexsplits = saveIndexToFiles(sortIndex(mapToArray(this.index)),indexFilename,blocksize)

            let invinxsplitmap : Array<string> = []
            let invinx = sortInvertedIndex(mapToArray(this.invertedindex))
            for(let needle = 0; needle < invinx.length; needle++){
                if(needle % blocksize == 0){
                    invinxsplitmap.push(invinx[needle].name)
                }
            }
        
            for(let needle = 0; needle < invinxsplitmap.length; needle++){
                console.debug("saving index #"+needle+", starts with "+invinxsplitmap[needle])
                saveInvertedIndexToFile(invinx.slice(blocksize*needle, blocksize*(needle+1)), invinxFilename + needle)
            }
            let meta = {
                author : author,
                name : indexname,
                created : Date.now(),
                invURLBase : baseURL + invinxFilename,
                inxURLBase : baseURL + indexFilename,
                inxsplits : indexsplits,
                invsplits : invinxsplitmap
            }
            fs.writeFile(indexFilename+".meta.json",JSON.stringify(meta), (err) => {if(err){console.error(err)}})
        }
    }

    private addDocumentToInvertedIndex(document : Document){
        tokenizeAndFilter(document.getText()).forEach(function(tokenname : string) {
            this.addTokenToInvertedIndex(new Token(tokenname,[document.id]))
        },this)
    }

    private addTokenToInvertedIndex(token : Token){
        if(this.invertedindex.has(token.name)){
            token.documents.forEach((docid) => {
                this.invertedindex.get(token.name).addDocument(docid)
            })
            
        }else{
            this.invertedindex.set(token.name, token)
        }
    }

    /**
     * Add a document to the index AND invertedindex.
     * @param document 
     */
    addToIndex(document : Document){
        this.index.set(document.id, document)
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
export function tokenizeAndFilter(name : string) : string[]{
    let tokens : string[] = name.split(' ').join(',').split('.').join(',').split('(').join(',').split(')').join(',').split('-').join(',').split('_').join(',').split(',').join('[').split(',').join(']').split(',') // super super awful and nasty, but gets the job done.
    tokens = tokens.filter(function (token){
        if(token){
            if(token.toLowerCase() === "the" || token.toLowerCase() === "of" || token.toLowerCase() === "and" || token === "&" || token === "+"){
                return false
            }else if(token.length <= 1){
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
    tokens.forEach((value,index,array) => {array[index] = value.toLowerCase()})
    tokens.forEach((value,index,array) => {array[index] = stemmer.stemmer(value)})
    return tokens
}


export class Token{
    name : string
    documents : Array<string>
    constructor(token : string, documents : string[]){
        this.name = token
        this.documents = documents
    }

    /**
     * Add a document to the token. Silently doesn't add a duplicit one.
     * @param documentid 
     */
    addDocument(documentid : string){
        if(this.documents.indexOf(documentid) === -1){
            this.documents.push(documentid)
        }
    }

    toString(){
        return name
    }
}


/**
 * Represents a document in the index. 
 * Subclass this if you require specific fields and override getText method to return all text that should get indexed.
 * id will be used for sorting when breaking it up.
 * @param id should be UNIQUE across the whole index.
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


/**
 * Put all values from a Map into an Array.
 * @param map 
 */
export function mapToArray(map : Map<string,any>) : Array<any>{
    let array = []
    for(let key of map.values()){
        array.push(key)
    }
    return array
}


/**
 * Save index to files, breaking it up.
 * @param index 
 * @param filenamestub 
 * @param blocksize How many documents to store in one file
 */
export function saveIndexToFiles(index : Array<Document>, filenamestub : string, blocksize : number) : string[]{
    let splitmap : string[] = []
    for(let needle = 0; needle < index.length; needle++){
        if(needle % blocksize == 0){
            splitmap.push(index[needle].id)
        }
    }

    for(let needle = 0; needle < splitmap.length; needle++){
        //console.debug("saving index #"+needle+", starts with "+splitmap[needle])
        saveIndexToFile(index.slice(blocksize*needle, blocksize*(needle+1)), filenamestub + needle)
    }
    return splitmap
}


/**
 * Intended to be used by saveIndexToFiles()
 * @param index 
 * @param filename 
 */
function saveIndexToFile(index : Array<Document>, filename : string){
    fs.writeFile(filename,JSON.stringify(index), (err) => {if(err){console.error(err)}})
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
            docid = docid.replace(",","%2C")
            string = string + "," + docid
        }
        writeStream.write(string + "\n")
    })
}


/**
 * Load inverted index from file
 * @param filename
 * @param callback 
 */
export function loadIndexFromFile(filename : string, callback : IndexCallback) : void {

    let loadedIndex : Array<Token> = []

    var lineReader = require('readline').createInterface({
        input: fs.createReadStream(filename)
    });
    let lineNumber = 0
    lineReader.on('line', (line : string) => {
        if(lineNumber === 0){
            if(parseInt(line) != 2){
                throw "Invalid version, must be 2!"
            }
            lineNumber++
            return
        }

        let cols = line.split(",")
        cols = cols.map(function(value){
            return value.replace("%2C",",")
        })
        let tokenname = decodeURIComponent(cols[0])
        cols.shift()
        loadedIndex.push(new Token(tokenname, cols))

        lineNumber++
    })
    lineReader.on('close', function(){
        return callback(loadedIndex)
    })
}

export interface IndexCallback {
    ( index : Array<Token>) : void;
}