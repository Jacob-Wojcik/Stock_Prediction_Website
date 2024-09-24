var Site = function(){
	this.symbol = "MSFT";
};

Site.prototype.Init = function(){
	this.GetQuote();
	$("#symbol").on("click", function(){
		$(this).val("");
	});
};

Site.prototype.GetQuote = function(){
	// store the site context.
	var that = this;

	// pull the HTTP REquest
	$.ajax({
		url: "/quote?symbol=" + that.symbol,
		method: "GET",
		cache: false
	}).done(function(data) {

		// set up a data context for just what we need.
		var context = {};
		context.shortName = data.shortName;
		context.symbol = data.symbol;
		context.price = data.ask;
        context.dayHigh = data.dayHigh;
        context.dayLow = data.dayLow;

		if(data.quoteType="MUTUALFUND"){
			context.price = data.previousClose
		}

		// call the request to load the chart and pass the data context with it.
		//that.LoadChart(context);

         // Check current page URL to determine which chart to load
         if (window.location.pathname === "/") {
            that.LoadHistoricalChart(context);
        } 
        else if (window.location.pathname === "/predictionpage") {
            that.LoadPredictionChart(context);
        }
	});
};

Site.prototype.SubmitForm = function(){
	this.symbol = $("#symbol").val();
	this.GetQuote();
}


Site.prototype.LoadHistoricalChart = function(quote){

	var that = this;
	$.ajax({
		url: "/history?symbol=" + that.symbol,
		method: "GET",
		cache: false
	}).done(function(data) {
		that.RenderHistoricalChart(JSON.parse(data), quote);
	});
};



Site.prototype.LoadPredictionChart = function() {
    var that = this;
    $.ajax({
        url: "/prediction?symbol=" + that.symbol,
        method: "GET",
        cache: false
    }).done(function(response) {
        // Assuming 'response' contains 'Date' and 'Close' arrays
        that.RenderPredictionChart(response);
        that.RenderPredictionChart2(response);
    }).fail(function(jqXHR, textStatus, errorThrown) {
        console.error("Failed to load prediction data:", textStatus, errorThrown);
    });
};


Site.prototype.RenderHistoricalChart = function(data, quote){
	var priceData = [];
	var dates = [];

	var title = quote.shortName  + " (" + quote.symbol + ") - " + numeral(quote.price).format('$0,0.00');

	for(var i in data.Close){
		var dt = i.slice(0,i.length-3);
		var dateString = moment.unix(dt).format("MM/YY");
		var close = data.Close[i];
		if(close != null){
			priceData.push(data.Close[i]);
			dates.push(dateString);
		}
	}

	Highcharts.chart('chart_container', {
		title: {
			text: title
		},
		yAxis: {
			title: {
				text: ''
			}
		},
		xAxis: {
			categories :dates,
		},
		legend: {
			layout: 'vertical',
			align: 'right',
			verticalAlign: 'middle'
		},
		plotOptions: {
			series: {
				label: {
					connectorAllowed: false
				}
			},
			area: {
			}
		},
		series: [{
			type: 'line',
			color: '#3CA4FF',
			name: 'Price',
			data: priceData
		}],
		responsive: {
			rules: [{
				condition: {
					maxWidth: 640
				},
				chartOptions: {
					legend: {
						layout: 'horizontal',
						align: 'center',
						verticalAlign: 'bottom'
					}
				}
			}]
		}

	});

};

//old way of rendering data without the margin of error
Site.prototype.RenderPredictionChart2 = function(data_from_backend) {
    // Prepare the data series for Highcharts

    //render historical data
    var historicalSeries = {
        name: 'Historical',
        data: data_from_backend.HistoricalPrices.map(function(price, index) {
            return [data_from_backend.Dates[index], price];
        }),
        type: 'line',
        color: '#7cb5ec'
    };

// render the prediction data
var predictionSeries = {
    name: 'Prediction',
    data: data_from_backend.Predictions_me.map(function(item, index) {
        var predictionIndex = index + data_from_backend.HistoricalPrices.length;
        return [data_from_backend.Dates[predictionIndex], item[1]];  // Use the prediction value
    }),
    type: 'spline',
    dashStyle: 'dash',
    color: '#f7a35c'
};

    // Render the chart
    Highcharts.chart('chart_container2', {
        chart: {
            type: 'line'
        },
        title: {
            text: 'Stock Price Prediction'
        },
        xAxis: {
            type: 'category',
            categories: data_from_backend.Date,
            tickmarkPlacement: 'on',
            title: {
                enabled: false
            }
        },
        yAxis: {
            title: {
                text: 'Price'
            }
        },
        series: [historicalSeries, predictionSeries]
    });
};

// render historical data, prediction data, and margin of error
Site.prototype.RenderPredictionChart = function(data_from_backend) {
    var that = this;

    //render historical data
    var historicalSeries = {
        name: 'Historical',
        data: data_from_backend.HistoricalPrices.map(function(price, index) {
            return [data_from_backend.Dates[index], price];
        }),
        type: 'line',
        color: '#7cb5ec'
    };

// render the prediction data
var predictionSeries = {
    name: 'Prediction',
    data: data_from_backend.Predictions_me.map(function(item, index) {
        var predictionIndex = index + data_from_backend.HistoricalPrices.length;
        return [data_from_backend.Dates[predictionIndex], item[1]];  // Use the prediction value
    }),
    type: 'spline',
    dashStyle: 'dash',
    color: '#f7a35c'
};

// render margin of errors
var errorMarginSeries = {
    name: 'Prediction Margin',
    data: data_from_backend.Predictions_me.map(function(item, index) {
        var marginIndex = index + data_from_backend.HistoricalPrices.length;
        return [data_from_backend.Dates[marginIndex], item[0], item[2]];  // Use the lower and upper bounds
    }),
    type: 'arearange',
    linkedTo: ':previous',
    lineWidth: 0,
    fillOpacity: 0.3,
    zIndex: 0,
    color: '#f15c80'
};

    // Render the chart with separated series
    Highcharts.chart('chart_container', {
        chart: {
            type: 'spline'
        },
        title: {
            text: 'Stock Price Forecast'
        },
        xAxis: {
            // If Dates includes both historical and prediction dates, use it directly
            categories: data_from_backend.Dates,
            type: 'category',
            tickmarkPlacement: 'on',
            title: {
                enabled: false
            }
        },
        yAxis: {
            title: {
                text: 'Price'
            }
        },
        tooltip: {
            shared: true,
            valueSuffix: ' USD'
        },
        series: [historicalSeries, predictionSeries, errorMarginSeries]
    });
};

var site = new Site();

$(document).ready(()=>{
	site.Init();
})
