/*d3.select(window).on("resize", throttle);
var tstJson = {"India" : 300, "Germany" : 100,"Spain":100, "United Kingdom" : 110,"United States" : 110, "Canada" : 110, "Argentina" : 300 , "France" : 600, "Russian Federation" : 100 };

var zoom = d3.behavior.zoom()
    .scaleExtent([1, 8])
    .on("zoom", move);


var width = document.getElementById('maps').offsetWidth-60;
var height = width / 2;

var color = d3.scale.category20c();
   
var topo,projection,path,svg,g;

var tooltip = d3.select("#maps").append("div").attr("class", "tooltip hidden");

setup(width,height);

function setup(width,height){
  projection = d3.geo.mercator()
    .translate([0, 0])
    .scale(width / 2 / Math.PI);

  path = d3.geo.path()
      .projection(projection);

  svg = d3.select("#maps").append("svg")
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", "translate(" + width / 2 + "," + height / 1.6 + ")")
      .call(zoom);

  g = svg.append("g");

}


function drawMaps(){
	d3.json("world-topo.json", function(error, world) {

	  var countries = topojson.feature(world, world.objects.countries).features;

	  topo = countries;
	  draw(topo);

	});
	$("#maps").removeClass("loading");
}

function draw(topo){
  var country = g.selectAll(".country").data(topo);

  country.enter().insert("path")
      .attr("class", "country")
      .attr("d", path)
      .attr("id", function(d,i) { return d.id; })
      .attr("title", function(d,i) { return d.properties.name; })
      .style("fill", function(d, i) { 
			if(tstJson[d.properties.name] == undefined){
				return "#e2e0d6"; 
			}else{
				return color(tstJson[d.properties.name]);
			} 
		});

  //ofsets plus width/height of transform, plsu 20 px of padding, plus 20 extra for tooltip offset off mouse
  var offsetL = document.getElementById('maps').offsetLeft+(width/2)+40;
  var offsetT =document.getElementById('maps').offsetTop+(height/2)+20;

  //tooltips
  country
    .on("mousemove", function(d,i) {
      var mouse = d3.mouse(svg.node()).map( function(d) { return parseInt(d); } );
        tooltip
          .classed("hidden", false)
          .attr("style", "left:"+(mouse[0]+offsetL)+"px;top:"+(mouse[1]+offsetT)+"px")
          .html(d.properties.name)
      })
      .on("mouseout",  function(d,i) {
        tooltip.classed("hidden", true)
      }); 
}

function redraw() {
  width = document.getElementById('maps').offsetWidth-60;
  height = width / 2;
  d3.select('svg').remove();
  setup(width,height);
  draw(topo);
}

function move() {
  var t = d3.event.translate;
  var s = d3.event.scale;  
  var h = height / 3;
  
  t[0] = Math.min(width / 2 * (s - 1), Math.max(width / 2 * (1 - s), t[0]));
  t[1] = Math.min(height / 2 * (s - 1) + h * s, Math.max(height / 2 * (1 - s) - h * s, t[1]));

  zoom.translate(t);
  g.style("stroke-width", 1 / s).attr("transform", "translate(" + t + ")scale(" + s + ")");
  
}

var throttleTimer;
function throttle() {
  window.clearTimeout(throttleTimer);
    throttleTimer = window.setTimeout(function() {
      redraw();
    }, 200);
}*/