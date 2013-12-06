var inputTagElements = [];
var inputCompareElements = [];
var cacheDetails = [];
var cachedData = [];
var questionHistogram = {};
var answerHistogram = {};
var d1 = [];
var d2 = [];
var d3 = [];
var d4 = [];
var plot,comparePlot;
var compareData = [];
var legends, compareLegends;

var updateLegendTimeout = null;
var latestPosition = null;


function updateMainPlot(inputPlot, lgnd){
	updateLegendTimeout = null;
    var pos = latestPosition;

    var axes = inputPlot.getAxes();
    if (pos.x < axes.xaxis.min || pos.x > axes.xaxis.max ||
        pos.y < axes.yaxis.min || pos.y > axes.yaxis.max) {
        return;
    }

    var i, j, dataset = inputPlot.getData();
    for (i = 0; i < dataset.length; ++i) {

        var series = dataset[i];

        // Find the nearest points, x-wise
        for (j = 0; j < series.data.length; ++j) {
            if (series.data[j][0] > pos.x) {
                break;
            }
        }

        // Now Interpolate

        var y,
            p1 = series.data[j - 1],
            p2 = series.data[j];

        if (p1 == null) {
            y = p2[1];
        } else if (p2 == null) {
            y = p1[1];
        } else {
            y = p1[1] + (p2[1] - p1[1]) * (pos.x - p1[0]) / (p2[0] - p1[0]);
        }

        lgnd.eq(i).text(series.label.replace(/:.*/, ": " + y));

    }
}

function updateLegend() {
    updateMainPlot(plot, legends)
}

function updateCompareLegend() {
    updateMainPlot(comparePlot,compareLegends)
}

function handleReset() {
    $(".news-list").empty();
    $("#placeholder").empty();
    $(".upvoteList").empty();
}


function takeCacheInfo() {
    addLoading();
    $.ajax({
        url: cacheURL,
        type: 'GET',
        success: function (data) {
            handleReset();
            cachedData = data._source;
            displayCachedData();
            sortGraphData(cachedData);
        }
    });
}


function displayCachedData() {
    creatGraphCacheData(cachedData);
    drawAreaGraph();
    addCacheUserDetails(cachedData);
}


function sortGraphData(data) {
    for (var k = 0; k < data.questionsHistogram.length - 1; k++) {
        questionHistogram[data.questionsHistogram[k].time] = data.questionsHistogram[k].count;
    }

    for (var k = 0; k < data.answersHistogram.length - 1; k++) {
        answerHistogram[data.answersHistogram[k].time] = data.answersHistogram[k].count;
    }

}

function creatGraphCacheData() {
    d1 = [], d2 = [];
    for (var k = 0; k < cachedData.questionsHistogram.length - 1; k++) {
        var innerArray1 = []
        innerArray1.push(cachedData.questionsHistogram[k].time);
        innerArray1.push(cachedData.questionsHistogram[k].count);
        d1.push(innerArray1);
    }


    for (var k = 0; k < cachedData.answersHistogram.length - 1; k++) {
        var innerArray2 = [];
        innerArray2.push(cachedData.answersHistogram[k].time);
        innerArray2.push(cachedData.answersHistogram[k].count);
        d2.push(innerArray2);
    }
}

function makeAreaChartData(input) {
    if (isCompareQuery) {
        d1 = [];
        d2 = [];
    } else {
        d3 = [];
        d4 = [];
    }

    for (var k = 0; k < input.responses.length; k++) {
        for (var i = 0; i < input.responses[k].facets.histogram.entries.length; i++) {
            var innerArray = [];
            if (k == 0) {
                if (questionHistogram[input.responses[k].facets.histogram.entries[i].time] != undefined) {
                    innerArray.push(input.responses[k].facets.histogram.entries[i].time);
                    innerArray.push((input.responses[k].facets.histogram.entries[i].count / questionHistogram[input.responses[k].facets.histogram.entries[i].time]) * 100);
                }
                if (isCompareQuery) {
                    d1.push(innerArray);
                } else {
                    d3.push(innerArray);
                }
            } else {
                if (answerHistogram[input.responses[k].facets.histogram.entries[i].time] != undefined) {
                    innerArray.push(input.responses[k].facets.histogram.entries[i].time);
                    innerArray.push((input.responses[k].facets.histogram.entries[i].count / answerHistogram[input.responses[k].facets.histogram.entries[i].time]) * 100)
                }
                if (isCompareQuery) {
                    d2.push(innerArray);
                } else {
                    d4.push(innerArray);
                }
            }
        }
    }
}


function addLoading() {
    $(".tab-pane").addClass("loading");
    $("#maps").addClass("loading");
    $(".trendGraphContainer").addClass("loading");
}

function addCompareLoading() {
    $(".compareGraphContainer").addClass("loading");
}

function drawAreaGraph() {
    var stack = 0,
        bars = false,
        lines = true,
        steps = false;

    var data = [{
        data: d1,
        label: "Questions : "
    }, {
        data: d2,
        label: "Answers : "
    }];

    plot = $.plot("#placeholder", data, {
        xaxis: {
            mode: "time"
        },
        series: {
            stack: stack,
            lines: {
                show: lines,
                fill: true,
                steps: steps
            },
            bars: {
                show: bars,
                barWidth: 0.6
            }
        },
        crosshair: {
            mode: "x"
        },
        grid: {
            hoverable: true
        },
        legend: {
            position: "nw"
        }
    });

    $("<div id='tooltip'></div>").css({
        position: "absolute",
        display: "none",
        padding: "2px",
        "background-color": "#f1f1f1",
        "color": "#666"
    }).appendTo("body");

    $("#placeholder").bind("plothover", function (event, pos, item) {

        if (item) {
            var x = item.datapoint[0].toFixed(2),
                y = item.datapoint[1].toFixed(2);

            $("#tooltip").html(item.datapoint[1] - item.datapoint[2] + " " + item.series.label + " on " + new Date(item.datapoint[0]).getDate() + ", " + monthArray[new Date(item.datapoint[0]).getMonth()] + " " + new Date(item.datapoint[0]).getFullYear())
                .css({
                    top: item.pageY + 5,
                    left: item.pageX + 5
                })
                .fadeIn(200);
        } else {
            $("#tooltip").hide();
        }

        latestPosition = pos;
        if (!updateLegendTimeout) {
            updateLegendTimeout = setTimeout(updateLegend, 50);
        }
    });
    legends = $("#placeholder .legendLabel");
    legends.each(function () {
        // fix the widths so they don't jump around
        $(this).css('width', "auto");
    });
}


function comparisonDraw(val) {
    var stack = 0,
        bars = false,
        lines = true,
        steps = false;
    var labelName1 = '';
    var labelName2 = '';

    for (var k = 0; k < inputTagElements.length; k++) {
        labelName1 += inputTagElements[k] + " ";
    }

    for (var k = 0; k < inputCompareElements.length; k++) {
        labelName2 += inputCompareElements[k] + " ";
    }

    if (val == "answers") {
        compareData = [{
            data: d2,
            label: labelName1 + " :"	,
            color: '#f1f1f1'
        }, {
            data: d4,
            label: labelName2 + " :",
            color: '#66b3de'
        }];
    } else {
        compareData = [{
            data: d1,
            label: labelName1 + " :",
            color: '#f1f1f1'
        }, {
            data: d3,
            label: labelName2 + " :",
            color: '#66b3de'
        }];
    }

   comparePlot = $.plot("#comparePlaceholder", compareData, {
        xaxis: {
            mode: "time"
        },
        series: {
            stack: stack,
            lines: {
                show: lines,
                fill: true,
                steps: steps
            },
            bars: {
                show: bars,
                barWidth: 0.6
            }
        },
        grid: {
            hoverable: true
        },
        crosshair: {
            mode: "x"
        },
        legend: {
            position: "nw"
        }
    });

    $("#comparePlaceholder").bind("plothover", function (event, pos, item) {
        if (item) {
            $("#tooltip").html(item.datapoint[1] - item.datapoint[2] + " % " + item.series.label + " on " + new Date(item.datapoint[0]).getDate() + ", " + monthArray[new Date(item.datapoint[0]).getMonth()] + " " + new Date(item.datapoint[0]).getFullYear())
                .css({
                    top: item.pageY + 5,
                    left: item.pageX + 5
                })
                .fadeIn(200);
        } else {
            $("#tooltip").hide();
        }
		
		latestPosition = pos;
        if (!updateLegendTimeout) {
            updateLegendTimeout = setTimeout(updateCompareLegend, 50);
        }
    });
	compareLegends = $("#comparePlaceholder .legendLabel");
    compareLegends.each(function () {
        // fix the widths so they don't jump around
        $(this).css('width', "auto");
    });

    $(".compareGraphContainer").removeClass("loading");
}


$.ajaxSetup({
    jsonp: null,
    jsonpCallback: null
});

$(document).ready(function () {
    $("#mainSearch").select2({
        id: function (obj) {
            return obj.name; // use slug field for id
        },
        multiple: true,
        minimumInputLength: 1,
        allowClear: true,
        selectOnBlur: true,
        ajax: {
            url: hostname + '/stackoverflow/_suggest',
            type: 'post',
            dataType: 'json',
            quietMillis: 100,
            data: function (term, page) { // page is the one-based page
                // number tracked by Select2
                return getSuggestJSON(term);
            },
            results: function (data, page) {
                var groups = [];
                for (var k = 0; k < data["movie-suggest"][0].options.length; k++) {
                    groups.push({
                        name: data["movie-suggest"][0].options[k].text
                    })
                }
                return {
                    results: groups
                };
            },
            error: function (ixhr, status, error) {
                alert("Failed")
            }
        },
        formatResult: formatResult,
        formatSelection: formatSelection,

    });

    $("#mainSearch")
        .on("change", function (e) {
            if (e.removed != undefined) {
                inputTagElements.splice(inputTagElements.indexOf(e.removed.name), 1);
                var scope = angular.element($("#mainSearch")).scope();
                scope.$apply(function () {
                    isCompareQuery = true;
                    scope.search();
                });
                if (inputTagElements.length == 0) {
                    $('#s2id_compareSelection .select2-choices li.select2-search-choice').remove();
                    inputCompareElements = [];
                    disableCompare();
                }
            }
        });


    function formatResult(element) {
        var markup = "<table class='movie-result'><tr style='font-size:11px; height:25px;'>";
        markup += "<td>";
        var addGroup = '';
        var groupName = element.group;

        markup += "<span><b>" + element.name + "</b>" + addGroup + "</span></td></tr></table>";
        return markup;
    }



    function formatSelection(element) {
        inputTagElements.push(element.name);
        var scope = angular.element($("#mainSearch")).scope();
        scope.$apply(function () {
            scope.search();
        });
        if (inputTagElements.length != 0) {
            $(".compareGraphContainer").css({
                "display": "block"
            });
            $("#s2id_compareSelection input").prop('disabled', false);
            $('.selectChange').selectpicker('show');
            $("#s2id_compareSelection").css({
                "cursor": "default"
            });
            $("#s2id_compareSelection ul").css({
                "cursor": "default"
            });
        }
        return element.name;
    }



    $("#compareSelection").select2({
        id: function (obj) {
            return obj.name; // use slug field for id
        },
        multiple: true,
        minimumInputLength: 1,
        allowClear: true,
        selectOnBlur: true,
        ajax: {
            url: hostname + '/stackoverflow/_suggest',
            type: 'post',
            dataType: 'json',
            quietMillis: 100,
            data: function (term, page) { // page is the one-based page
                // number tracked by Select2
                return getSuggestJSON(term);
            },
            results: function (data, page) {
                var groups = [];
                for (var k = 0; k < data["movie-suggest"][0].options.length; k++) {
                    groups.push({
                        name: data["movie-suggest"][0].options[k].text
                    })
                }
                return {
                    results: groups
                };
            },
            error: function (ixhr, status, error) {
                alert("Failed")
            }
        },
        formatResult: formatResult,
        formatSelection: compareSelection,

    });
});


function compareSelection(element) {
    inputCompareElements.push(element.name);
    var scope = angular.element($("#compareSelection")).scope();
    scope.$apply(function () {
        isCompareQuery = false;
        scope.search();
    });
    return element.name
}


$("#compareSelection")
    .on("change", function (e) {
        if (e.removed != undefined) {
            isCompareQuery = false;
            inputCompareElements.splice(inputCompareElements.indexOf(e.removed.name), 1);
            var scope = angular.element($("#compareSelection")).scope();
            scope.$apply(function () {
                isCompareQuery = false;
                scope.search();
            });
        }
    });


$(".selectChange").on("change", function () {
    comparisonDraw($(this).val());
});

function addUpvotes(input) {
    for (var i = 0; i < input.responses.length; i++) {
        $("#upvoteTemplate" + i).tmpl(input.responses[i].hits.hits).appendTo(".upvoteList" + i);
    }
}


function addRelatedTags(input) {
    var relatedTagsArray = [];
    for (var i = 0; i < input.responses.length; i++) {
        for (var l = 0; l < input.responses[i].facets.tags.terms.length; l++) {
            relatedTagsArray.push(input.responses[i].facets.tags.terms[l]);
        }
    }
    var finalTags = removeSearchTags(relatedTagsArray);
    $("#relatedTagTemplate").tmpl(finalTags).appendTo(".tags");

}

function removeSearchTags(input) {
    for (var i = 0; i < input.length; i++) {
        for (var k = 0; k < inputTagElements.length; k++) {
            if (input[i].term == inputTagElements[k]) {
                input.splice(i, 1);
            }
        }
    }
    return input;
}