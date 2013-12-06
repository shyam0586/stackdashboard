var hostname =  'http://54.200.105.78:80/';
var cacheURL = 'http://54.200.105.78:80/cache/cache/latestCache';
//var hostname =  'http://localhost:9200/';
//var hostname =  'http://192.208.184.249:9200/';

var monthArray=["Jan" , "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
var index = "stackoverflow";
var userIndex = "users";
var defaultComparison = "questions";
var typeQuestion = 'questions';
var typeAnswer = 'answers';

var sortField = "quantityLimit";

function getSuggestJSON(name) {
    var suggestJSON = '{                                   \
                                  "movie-suggest": {             \
                                    "text" : "' + name + '",               \
                                    "completion": {           \
                                      "field": "suggest"       \
                                    }                         \
                                  }                           \
                                }';
    return suggestJSON;
}
