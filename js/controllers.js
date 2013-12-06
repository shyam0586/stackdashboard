// We should be storng all global variables here.
var filtersArray = {}; // Stores the termFilter list like Rating and isDvd/BluRay
var screenData = ""; // Current response data from ES , stores globally
var size = 20; // Size per page of ES
var totalResult = 0; // Total number of results for the current query
var currentPage = 1; // For pagination
var isFirst = true; // For a text query , we dont update the filters , until another text query is fired. 
//This flag is to mark if its a text search or a filter search
var oldSearchTerm = ""; // Thi variable would be used to track if a search query have changed or not.
var currentPage = 1;
var isCompareQuery = true;
var from = 0;

function addUserDetails(input) {
    $(".news-list").empty();
    for (var i = 0; i < input.responses.length; i++) {
        var mgetQuestionJSON = '';
        mgetQuestionJSON += '{"docs" : [';
        for (var k = 0; k < input.responses[i].facets.users.terms.length; k++) {
            if (k == input.responses[i].facets.users.terms.length - 1) {
                mgetQuestionJSON += '{"_id" : "' + input.responses[i].facets.users.terms[k].term + '"}';
            } else {
                mgetQuestionJSON += '{"_id" : "' + input.responses[i].facets.users.terms[k].term + '"},';
            }
        }
        mgetQuestionJSON += ']}';
        requestUserDetails(mgetQuestionJSON, i);
    }
    $(".tab-pane").removeClass('loading');
}

function disableCompare(){
	$("#comparePlaceholder").empty();
	$(".compareGraphContainer").css({"display":"none"});
	$("#s2id_compareSelection input").prop('disabled', true);
	$('.selectChange').selectpicker('hide');
	$("#s2id_compareSelection").css({"cursor" : "not-allowed"});
	$("#s2id_compareSelection ul").css({"cursor" : "not-allowed"});	
}

function addCacheUserDetails() {
	$("#userTemplate0").tmpl(cachedData.questionsMget.docs).appendTo(".news-list0");
	$("#userTemplate1").tmpl(cachedData.answersMget.docs).appendTo(".news-list1");
	$("#relatedTagTemplate").tmpl(cachedData.trendingTags).appendTo(".tags");
	$("#upvoteTemplate0").tmpl(cachedData.questionsUpvote).appendTo(".upvoteList0");
	$("#upvoteTemplate1").tmpl(cachedData.answersUpvote).appendTo(".upvoteList1");
	$(".tab-pane").removeClass('loading');
	$(".trendGraphContainer").removeClass('loading');
	
}


function requestUserDetails(json, i) {
    $.ajax({
        url: hostname + userIndex + "/_mget",
        type: "post",
        async: false,
        data: json,
        success: function (data) {
            var personsArray = [];
            for (var m = 0; m < data.docs.length; m++) {
                if (data.docs[m].exists) {
                    personsArray.push(data.docs[m]);
                }
            }
			$("#userTemplate"+i).tmpl(personsArray).appendTo(".news-list"+i)
            
        }
    });
}

angular.module('controllers', []);
angular.module('controllers').controller('SearchCtrl', function ($scope, ejsResource, $http, limitToFilter) {
    $scope.tags = function (tagName) {
        return $http({
            method: 'POST',
            url: hostname + '/_suggest',
            data: getSuggestJSON(tagName)
        }).
        then(function (response) {
            var data = response.data;
            var suggestArray = data['movie-suggest'][0]['options'];
            var array = [];
            for (var suggest in suggestArray) {
                //console.log(suggestArray[suggest].text);
                array.push(suggestArray[suggest]['text']);
            }
            return limitToFilter(suggestArray, 15);
        });
    };

    // Create a elasticsearch instance
    var ejs = ejsResource(hostname);

    $scope.search = function () {
        if (isCompareQuery) {
            handleReset();
			addLoading();
			size = 20;
        }else{
			addCompareLoading();
			size = 0;
		}
		
        var client = ejs.Request()
            .indices(index)
            .types(typeQuestion);

        var answerClient = ejs.Request()
            .indices(index)
            .types(typeAnswer);

        var oQuery = "";
        if (isCompareQuery){
            if (inputTagElements.length == 0) {
                displayCachedData();
                addCacheUserDetails();
                return false;
            } else {
                oQuery = ejs.TermsQuery("tags", inputTagElements).minimumShouldMatch(inputTagElements.length);	
            }

        } else {
				oQuery = ejs.TermsQuery("tags", inputCompareElements).minimumShouldMatch(inputTagElements.length);
        }

		answerQuery = ejs.HasParentQuery(oQuery, typeQuestion);
		
        var histogramFacet = ejs.DateHistogramFacet("histogram").field("creation_date").interval('week');
        var users = ejs.TermsFacet("users").field("owner.user_id").size(20);
        var tags = ejs.TermsFacet("tags").field("tags").size(20);

		oQuery = ejs.CustomScoreQuery(oQuery, "doc['up_vote_count'].value");
        var request = client.query(oQuery)
            .facet(histogramFacet)
            .facet(users)
            .facet(tags)
            .from(from)
            .size(size);

		answerQuery = ejs.CustomScoreQuery(answerQuery, "doc['up_vote_count'].value");
        var answerRequest = answerClient.query(answerQuery)
            .facet(histogramFacet)
            .facet(users)
            .facet(tags)
            .from(from)
            .size(size);
		
       
        var boolFilters = ejs.BoolFilter();
        var isFilterPresent = false;
        var filter = ejs.BoolFilter(); // We create a boolean filter to house all filters
		
		var mainRequest = ejs.MultiSearchRequest().requests(request).requests(answerRequest);

        var r = mainRequest.doSearch().
        then(function (response) {
            var message = "";
            var isBad = false;
            if (response.length == 0) {
                // Caputre error and handle it
                message = "Error in the results";
                isBad = true;
            }

            // Mark the message as bad if any of the above happens
            if (isBad) {
                response = {
                    message: message,
                    bad: true
                };
                return response;
            } else {
                //message = response.hits.total + " Docs found";
                response['message'] = message;
            }

		if (isCompareQuery) {
				//drawMaps()
				makeAreaChartData(response);
				drawAreaGraph();
				addUserDetails(response);
				addUpvotes(response);
				addRelatedTags(response);
           }else{
				makeAreaChartData(response);
				comparisonDraw(defaultComparison);
		   }
		   
		   $(".trendGraphContainer").removeClass("loading");

           
            // If the query is a text term query and not a filter change initiated query , update the filters
            if (isFirst) {
                isFirst = false;
                currentPage = 1;
            }
            return response;
        });
        $scope.message = r;
        $scope.results = r;
        //Resetting from
        from = 0;
        //isCompareQuery = true;
    };
});


// On startup , trigger a search
angular.element(document).ready(function () {
	$('.selectChange').selectpicker();
	disableCompare();
    takeCacheInfo();
});