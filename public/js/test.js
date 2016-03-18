(function () {
 'use strict';
    var stockObj = {};
    $('.getQuote').on('click', function () {
        var $this = $(this),
            textInput = $(this).prev().val(),
            beginningUrl = "http://marketdata.websol.barchart.com/getQuote.json?key=",
            apiKey = "1c4c6cace9c7babb0d054f23aacd43ee";
        $.getJSON('http://dev.markitondemand.com/MODApis/Api/v2/Quote/jsonp?symbol='+textInput+'&callback=?', function (obj) {
            var html;
            if (obj.Status === 'Failure|APP_SPECIFIC_ERROR') {
                html = "Stock/ETF not available";
                stockObj.stock = null;
                stockObj.quote = null;
            } else if (!obj.Status) {
                html = obj.Message;
                stockObj.stock = null;
                stockObj.quote = null;
            } else {
                html = stockObj.quote = obj.LastPrice;
                stockObj.stock = textInput;
                stockObj.name = obj.Name
            }
            $this.next().html(html);


        }); 
        return false;
    });
    
    $('.placeOrder').on('click', function(e) {
        e.preventDefault();
        var parentString = this.id.split('_')[0];
        var $container = $('#'+parentString+'Stocks'),
            stock = stockObj.stock,
            name = stockObj.name,
            quote = stockObj.quote,
            amount = $container.find("input[name = 'amount']").val(),
            noOfShares = amount / quote;
        
        if (typeof quote !== "number" || !stock) {
            $container.find('span.quote').html('Please make sure you have a valid symbol and the amount invested is a number');
            return false;
        }
        
        $.colorbox({
            'html': function () {
               return '<div class="container"> <p>You are about to ' + parentString + ' ' + noOfShares + ' shares of ' + name + ' for a total amount of ' + amount + '  </p> <p> <button action="/pickstocks" id="confirmStock">confirm</button></div>';
            }
        });
        
        $(document).on('click', '#confirmStock', function(e) {
            var $modal = $('#colorbox'),
                $modalContainer = $modal.find('.container');
                $modalContainer.html('<img src="/images/loading.gif"/>');
            $.ajax({
                url: $(this).attr('action'),
                type: 'POST',
                data: {
                    'buyorsell' : parentString,
                    'investedamount': amount,
                    'noOfShares': noOfShares,
                    'symbol': stock,
                    'price': quote,
                    'name' : name
                },
                success: function (data) {
                    var existingdiv = document.getElementById(data.id),
                        $yourStawks = $('.yourStawks');
                    if (data.flashMessage) {$modalContainer.html(data.flashMessage); return false;}
                    if(data.success) {
                        var output = '<p>You have ' + data.portfolio.noOfShares + ' shares of ' + data.portfolio.name + '. The average price paid for each share is ' + data.portfolio.price + ' and your total invested amount is ' + data.portfolio.investedamount;
                        $yourStawks.find('h1 > span').text(data.balance);
                        if(existingdiv) {
                            existingdiv.innerHTML = output;
                        } else {
                            $yourStawks.append(output);
                        }
                        $modalContainer.html("You're order was received succesfully!");
                    } else {
                        $modalContainer.html("There was an error please try again later or not");
                    }
                },
                error: function (e) {
                    console.log(e, 'iwanna be rich');
                }
            })  
        })
        
        return false;
    });
    
    $('[name="tradeAction"]').on('change', function () {
        $('#buyStocks').toggleClass('hide');
        $('#sellStocks').toggleClass('hide');
    });

 
 
 
 })()