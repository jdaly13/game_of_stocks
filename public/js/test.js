(function () {
 'use strict';
    
    function getStockQuote (stock, obj, cb) {
        $.getJSON('http://dev.markitondemand.com/MODApis/Api/v2/Quote/jsonp?symbol='+stock+'&callback=?', cb);
    }
    
    var utilityFunctions = function () {
        return {
           toFixed: function (num) {
               return +parseFloat(num).toFixed(2);
           }    
        };
    }();
    
    var stockObj = {},
        User = {
            gainsAndLosses: [],
            totalInvestedAmount: null,
            gainsAndLossesTotal: null,
            netBalance:null,
            availableBalance: null,
            portfolioValue: 0
        },
				purchaseStocksUrl = "/pickstocks";
    
    $('.getQuote').on('click', function () {
        var $this = $(this),
            textInput = $(this).prev().val();
            getStockQuote(textInput, stockObj, function (obj) {
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
                    stockObj.name = obj.Name;
                }
                $this.next().html(html); 
            });
            
        return false;
    });
    
    $('.placeOrder').on('click', function(e) {
        e.preventDefault();
        stockObj.buyOrSell = this.id.split('_')[0]; //buy or sell
        var $container = $('#'+stockObj.buyOrSell+'Stocks');
        stockObj.amount = $container.find("input[name = 'amount']").val();
        stockObj.noOfShares = utilityFunctions.toFixed(stockObj.amount / stockObj.quote);
        
        
        if (typeof stockObj.quote !== "number" || !stockObj.stock) {
            $container.find('span.quote').html('Please make sure you have a valid symbol and the amount invested is a number');
            return false;
        }
        
        $.colorbox({
            'html': function () {
               return '<div class="container"> <p>You are about to ' + stockObj.buyOrSell + ' ' + stockObj.noOfShares + ' shares of ' + stockObj.name + ' for a total amount of ' + stockObj.amount + '  </p> <p> <button action='+purchaseStocksUrl+ ' id="confirmStock">confirm</button></div>';
            }
        });
        
    });
    
    
    
    $(document).on('click', '#confirmStock', function(e) {
        var $modal = $('#colorbox'),
            $modalContainer = $modal.find('.container');
            $modalContainer.html('<img src="/images/loading.gif"/>');
        $.ajax({
                url: $(this).attr('action'),
                type: 'POST',
                data: {
                    'buyorsell' : stockObj.buyOrSell,
                    'investedamount': stockObj.amount,
                    'noOfShares': stockObj.noOfShares,
                    'symbol': stockObj.stock,
                    'price': stockObj.quote,
                    'name' : stockObj.name
                },
                success: function (data) {
                    var existingdiv = document.getElementById(data.id),
                        $yourStawks = $('.yourStawks');
                    console.log(data);
                    if (data.flashMessage.length) {$modalContainer.html(data.flashMessage); return false;}
                    if(data.success) {
                        var output = '<p>You have ' + data.portfolio.noOfShares + ' shares of ' + data.portfolio.name + '. The average price paid for each share is ' + data.portfolio.pershareavg + ' and your total invested amount is ' + data.portfolio.investedamount;
                        //$yourStawks.find('h1 > span').text(data.balance);
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
            });
        });
    
    function updateUserObj (gainOrLoss, investedAmount, currentValue) {
            User.gainsAndLossesTotal += gainOrLoss;
            User.totalInvestedAmount += investedAmount;
            User.portfolioValue += currentValue;
    }
    
    function compareLastPriceToCurrent (markitObj, dbObj) {
        var lastPrice = utilityFunctions.toFixed(markitObj.LastPrice),
            string = 'The Current Price of ' + markitObj.Name + 'is ' + lastPrice + '.',
            averagePricePaid = dbObj.pershareavg,
            investedAmount = dbObj.investedamount,
            noOfShares = dbObj.noOfShares,
            currentValue = utilityFunctions.toFixed(lastPrice * noOfShares),
            gainOrLoss = utilityFunctions.toFixed(currentValue - investedAmount);
        
        string += 'The current value of your stock is ' + currentValue + ' Your gains/loss are ' + gainOrLoss;
       // User.gainsAndLosses.push(gainOrLoss);
        updateUserObj(gainOrLoss, investedAmount, currentValue);
        
        $('#'+dbObj.symbol).append('<span class="block">' + string + '</span>');
    }
    
    
    $('[name="tradeAction"]').on('change', function () {
        $('#buyStocks').toggleClass('hide');
        $('#sellStocks').toggleClass('hide');
    });
    
    function postUpdatedUserBalance () {
        $.ajax({
            url:'/api/balance',
            type: 'POST',
            data: User,
            success: function (userData) {
                console.log(userData);
            }
        });
    }

    $.getJSON('/api/portfolio', function (obj) {
        var arr = [];
        console.log(obj);
        User.startAmount = obj.data.startAmount;
        obj.data.portfolio.forEach(function (obj) {
            arr.push($.getJSON('http://dev.markitondemand.com/MODApis/Api/v2/Quote/jsonp?symbol='+obj.symbol+'&callback=?'));
        });
        
        var defer = $.when.apply(window, arr);
        defer.done(function () {
            for (var i=0; i<arguments.length; i++) {
								var whatToUse = (!Array.isArray(arguments[i])) ? arguments[i] : arguments[i][0];
								console.log(obj.data.portfolio[i]);
                compareLastPriceToCurrent(whatToUse, obj.data.portfolio[i]);
								if (!Array.isArray(arguments[i])) break;
            }
            
            User.totalInvestedAmount += obj.data.portfolioCashValue;
            User.availableBalance = User.startAmount - User.totalInvestedAmount;
            User.gainsAndLossesTotal = utilityFunctions.toFixed(User.gainsAndLossesTotal) || 0;
            User.netBalance = (User.gainsAndLossesTotal<0) ? User.availableBalance - Math.abs(User.gainsAndLossesTotal) : User.availableBalance + User.gainsAndLossesTotal;
            console.log(User);
            postUpdatedUserBalance();
            
        });
        
        
    });
 
 
 })(window, document);