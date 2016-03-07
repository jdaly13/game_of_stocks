(function () {
 'use strict';
    console.log('callllllled')
    $('.getQuote').on('click', function () {
        var $this = $(this);
        var textInput = $(this).prev().val(),
            beginningUrl = "http://marketdata.websol.barchart.com/getQuote.json?key="
        var apiKey = "1c4c6cace9c7babb0d054f23aacd43ee";
        $.getJSON('http://dev.markitondemand.com/MODApis/Api/v2/Quote/jsonp?symbol='+textInput+'&callback=?', function (obj) {
            $this.parent().append(obj.LastPrice);


        }); 
    });

 
 
 
 })()