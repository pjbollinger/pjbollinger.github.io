$(document).ready(function() {
  var table = $('#myTable').DataTable({
    paging: false,
    searching: false,
    enderer: "bootstrap"
  });
  var currentPrice = {};
  var socket = io.connect('https://streamer.cryptocompare.com/');
  //Format: {SubscriptionId}~{ExchangeName}~{FromSymbol}~{ToSymbol}
  //Use SubscriptionId 0 for TRADE, 2 for CURRENT and 5 for CURRENTAGG
  //For aggregate quote updates use CCCAGG as market
  var subscription = [
    '2~Coinbase~BTC~USD',
    '2~Coinbase~ETH~USD',
    '2~Coinbase~LTC~USD',
    '2~BitTrex~XMR~BTC'
  ];
  var quantities = {
    'BTC': 1.00000000,
    'ETH': 1.00000000,
    'LTC': 1.00000000,
    'XMR': 1.00000000
  }
  socket.emit('SubAdd', { subs: subscription });
  socket.on("m", function(message) {
    var messageType = message.substring(0, message.indexOf("~"));
    var res = {};
    if (messageType == CCC.STATIC.TYPE.CURRENT) {
      res = CCC.CURRENT.unpack(message);
      dataUnpack(res);
    }
  });

  var dataUnpack = function(data) {
    var from = data['FROMSYMBOL'];
    var to = data['TOSYMBOL'];
    var fsym = CCC.STATIC.CURRENCY.getSymbol(from);
    var tsym = CCC.STATIC.CURRENCY.getSymbol(to);
    var pair = from + to;

    if (!currentPrice.hasOwnProperty(pair)) {
      currentPrice[pair] = {};
    }

    for (var key in data) {
      currentPrice[pair][key] = data[key];
    }
    if (from !== 'BTC' && to !=='USD' && currentPrice.hasOwnProperty('BTCUSD')) {
      if (data.hasOwnProperty('PRICE')) {
        currentPrice[pair]['PRICE'] = data['PRICE'] * currentPrice['BTCUSD']['PRICE'];
      }
      if (data.hasOwnProperty('OPEN24HOUR')) {
        currentPrice[pair]['OPEN24HOUR'] = data['OPEN24HOUR'] * currentPrice['BTCUSD']['OPEN24HOUR'];
      }
    }

    if (currentPrice[pair]['LASTTRADEID']) {
      currentPrice[pair]['LASTTRADEID'] = parseInt(currentPrice[pair]['LASTTRADEID']).toFixed(0);
    }

    currentPrice[pair]['CHANGE24HOUR'] = currentPrice[pair]['PRICE'] - currentPrice[pair]['OPEN24HOUR'];
    currentPrice[pair]['CHANGE24HOURPCT'] = ((currentPrice[pair]['PRICE'] - currentPrice[pair]['OPEN24HOUR']) / currentPrice[pair]['OPEN24HOUR'] * 100).toFixed(2) + "%";
    currentPrice[pair]['QUANTITY'] = quantities[from];
    currentPrice[pair]['AMOUNT'] = quantities[from] * currentPrice[pair]['PRICE'];
    var total = 0.0;
    var open24hourtotal = 0.0
    for (var key in currentPrice) {
      total = total + currentPrice[key]['AMOUNT'];
      open24hourtotal = open24hourtotal + (currentPrice[key]['OPEN24HOUR'] * quantities[key.slice(0,-3)]);
    }
    currentPrice[pair]['PCTOFPORT'] = ((currentPrice[pair]['AMOUNT'] / total) * 100).toFixed(2) + "%";
    displayData(currentPrice[pair], from, tsym, fsym, total, open24hourtotal);
  };

  var displayData = function(current, from, tsym, fsym, total, open24hourtotal) {
    var priceDirection = current.FLAGS;
    for (var key in current) {
      if (key == 'CHANGE24HOURPCT') {
        $('#' + from + ' > td > .' + key).text(' (' + current[key] + ')');
      }
      else if (key == 'CHANGE24HOUR') {
        if (Math.abs(current[key]) > 1.05) {
          $('#' + from + ' > td > .' + key).text('$ ' + current[key].formatMoney(2));
        } else {
          $('#' + from + ' > td > .' + key).text('$ ' + current[key].formatMoney(8));
        }
      }
      else if (key == 'PRICE' || key == 'AMOUNT') {
        if (Math.abs(current[key]) > 1.05) {
          $('#' + from + ' > .' + key).text('$ ' + current[key].formatMoney(2));
        } else {
          $('#' + from + ' > .' + key).text('$ ' + current[key].formatMoney(8));
        }
      }
      else if (key == 'QUANTITY') {
        if (current[key] > 1) {
          $('#' + from + ' > .' + key).text(current[key].toFixed(2));
        } else {
          $('#' + from + ' > .' + key).text(current[key].toFixed(8));
        }
      }
      else if (key == 'PCTOFPORT') {
        $('#' + from + ' > .' + key).text(current[key]);
      }
    }

    $('#' + from + ' > .PRICE').removeClass('up down');
    if (priceDirection & 1) {
      $('#' + from + ' > .PRICE').addClass("up");
    }
    else if (priceDirection & 2) {
      $('#' + from + ' > .PRICE').addClass("down");
    }

    $('#' + from + ' > .AMOUNT').removeClass('up down');
    if (priceDirection & 1) {
      $('#' + from + ' > .AMOUNT').addClass("up");
    }
    else if (priceDirection & 2) {
      $('#' + from + ' > .AMOUNT').addClass("down");
    }

    if (current['PRICE'] > current['OPEN24HOUR']) {
      $('#' + from + ' > td > .CHANGE24HOURPCT').parent().removeClass('up down');
      $('#' + from + ' > td > .CHANGE24HOURPCT').parent().addClass("up");
    }
    else if (current['PRICE'] < current['OPEN24HOUR']) {
      $('#' + from + ' > td > .CHANGE24HOURPCT').parent().removeClass('up down');
      $('#' + from + ' > td > .CHANGE24HOURPCT').parent().addClass("down");
    }

    $("#total").text(total.formatMoney(2));
    totalchange = total - open24hourtotal;
    pcttotalchange = ((totalchange / open24hourtotal) * 100).toFixed(2) + '%';
    $('h1 > span.change > span.CHANGE24HOUR').text(totalchange.formatMoney(2));
    $('h1 > span.change > span.CHANGE24HOURPCT').text(pcttotalchange);

    $('h1 > span.change').removeClass('up down');
    if (total > open24hourtotal) {
      $('h1 > span.change').addClass('up');
    } else if (total < open24hourtotal) {
      $('h1 > span.change').addClass('down');
    }
  };
});