(function () {
 'use strict';
    $('.getQuote').on('click', function () {
        var $this = $(this);
        var textInput = $(this).prev().val(),
            beginningUrl = "http://marketdata.websol.barchart.com/getQuote.json?key="
        var apiKey = "1c4c6cace9c7babb0d054f23aacd43ee";
        $.getJSON('http://dev.markitondemand.com/MODApis/Api/v2/Quote/jsonp?symbol='+textInput+'&callback=?', function (obj) {
            $this.parent().append('<span class="quote">' + obj.LastPrice + '</span>');


        }); 
        return false;
    });
    
    $('#purchase_stock').on('click', function(e) {
        e.preventDefault();
        var $container = $('#pickStocks'),
            stock = $container.find("input[name = 'symbol']").val(),
            quote = parseInt($container.find('span.quote').html()),
            amount = $container.find("input[name = 'amount']").val(),
            noOfShares = amount / quote;
        console.log(amount, quote);
        
        $.colorbox({
            'html': function () {
               return '<div class="container"> <p>You are about to purchase ' + noOfShares + ' shares for this ' + stock + '  </p> <p> <button action="/pickstocks" id="confirmStock">confirm</button></div>';
            }
        });
        
        $(document).on('click', '#confirmStock', function(e) {
            console.log(e.target, $(this));
            $.ajax({
                url: $(this).attr('action'),
                type: 'POST',
                data: {
                    'investedamount': amount,
                    'noOfShares': noOfShares,
                    'symbol': stock,
                    'price': quote
                },
                success: function (data) {
                    if(data.success) {
                        console.log('yes')
                    } else {
                        console.log('nope')
                    }
                },
                error: function (e) {
                    console.log(e);
                }
            })  
        })
        
        return false;
    });

 
 
 
 })()