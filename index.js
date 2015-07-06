var fs = require("fs");
var stopWord = ["OF", "A", "TO", "THE", "ANY"];

function getAllFilesFromFolder(dir) {
    var results = [];
    fs.readdirSync(dir).forEach(function (file) {
        file = dir + '/' + file;
        var stat = fs.statSync(file);

        if (stat && stat.isDirectory()) {
            results = results.concat(getAllFilesFromFolder(file))
        } else results.push(file);
    });

    return results;
}

function uniqueWords(a) {
    var seen = {};
    var out = [];
    var len = a.length;
    var j = 0;
    for (var i = 0; i < len; i++) {
        var item = a[i];
        if (stopWord.indexOf(item) == -1 && seen[item] !== 1) {
            seen[item] = 1;
            out[j++] = item;
        }
    }
    return out;
}

function htmlToString(html) {
    html = html.replace(/<\s*br\/*>/gi, "");
    html = html.replace(/<\s*a.*href="(.*?)".*>(.*?)<\/a>/gi, "$2");
    html = html.replace(/<\s*\/*.+?>/ig, " ");
    html = html.replace(/ {2,}/gi, " ");
    html = html.replace(/\n+\s*/gi, "");
    html = html.replace(/\r/gi, "");
    html = html.replace(/"/gi, "");
    html = html.replace(/'/gi, "");
    html = html.replace(/&nbsp;/gi, "");
    html = html.replace(/\./g, "");
    html = html.replace(/[^a-zA-Z]+/g, " ");
    return html;
}

function createIndex(arr, map) {
    var indexes = [];
    for (var j = 0; j < arr.length; j++) {
        var word = arr[j],
            pat = new RegExp('\\b' + word + '\\b', 'gi');
        var index = [];
        for (var k = 0; k < map.length; k++) {
            var con = map[k].content;
            if (pat.test(con)) {
                index.push(k);
            }
        }
        if (index.length > 0) {
            indexes.push([word, index]);
        }
    }
    return indexes;
}

function searchIndexer(dir) {
    var map = [],
        text = "",
        SearchFiles = [],
        SearchTitles = [],
        files = getAllFilesFromFolder(dir);

    for (var i = 0; i < files.length; i++) {
        var url = files[i];
        if (url.match(/\htm$/)) {
            var data = fs.readFileSync(url, 'utf8');
            var title = data.match(/<title[^>]*>([^<]+)<\/title>/)[1];
            var body = data.match(/<body[^>]*>((.|[\n\r])*)<\/body>/im)[1];

            text += htmlToString(body);
            SearchFiles.push(url);
            SearchTitles.push(title);

            map.push({url: url, title: title, content: body});
        }
    }

    text = text.toUpperCase();
    var strToArr = text.split(" ");
    strToArr.sort();

    var uniqueArray = uniqueWords(strToArr);
    var indexes = createIndex(uniqueArray, map);

    var result = {SearchFiles: SearchFiles, SearchTitles: SearchTitles, SearchIndexes: indexes};

    fs.writeFile('searchdat.json', JSON.stringify(result), function (err) {
        if (err) throw err;
        console.log('done');
    });
}

module.exports = searchIndexer;
