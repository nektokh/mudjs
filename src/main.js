
'use strict';

const $ = require('jquery');

var websock = require('./websock');
var lastLocation = require('./location');
var sessionId = require('./sessionid')();
var historydb = require('./historydb');

require('./notify');
require('./input');
require('./settings');
require('./prompt');
require('./textedit');
require('./cs');

require('./main.css');

var connect = websock.connect, rpccmd = websock.rpccmd, send = websock.send;


$(window).bind('beforeunload', function() {
    return 'leaving already?';
});

$(document).ready(function() {
    $('#logs-button').click(function(e) {
        var logs = [];

        e.preventDefault();

        historydb
            .then(function(db) {
                return db.load(null, false, 100000000, function(key, value) {
                    logs.push(value);
                });
            })
            .then(function() {
                var blobOpts = { type: 'text/html' },
                    blob = new Blob(logs, blobOpts),
                    url = URL.createObjectURL(blob);

                logs = null;
                console.log(url);

                // create a link
                var link = $('<a>')
                    .attr({
                        href: url,
                        download: 'mudjs.log'
                    })
                    [0];

                // click on it
                setTimeout(function() {
                    var event = document.createEvent('MouseEvents');
                        event.initMouseEvent('click', true, true, window, 1, 0, 0, 0, 0, false, false, false, false, 0, null);
                        link.dispatchEvent(event);
                }, 10);
            });
    });

    $('#map-button').click(function(e) {
        e.preventDefault();

        if(!lastLocation()) {
            return;
        }

        var basefilename = lastLocation().area.replace(/\.are$/, '');
        var mapfile = '/maps/' + basefilename + '.html?sessionId=' + sessionId;
        window.open(mapfile);
    });


    connect();
    initTerminalFontSize();


    $('body').on('keydown', function(e) {
        var input = $('#input input');

        // dont autofocus if modal dialog is present
        if($('body.modal-open').length != 0)
            return;

        if(e.ctrlKey || e.altKey)
            return;

        if(input.is(':focus'))
            return;

        if ($('#help input').is(':focus'))
            return;

        input.focus();
        document.getElementById('inputBox').dispatchEvent(new KeyboardEvent('keydown', e));
    });


    /*
     * Handlers for plus-minus buttons to change terminal font size.
     */ 
    var fontDelta = 2;
    var terminalFontSizeKey = "terminal-font-size";
    
    function changeFontSize(delta) {
        var terminal = $('.terminal');
        var style = terminal.css('font-size'); 
        var fontSize = parseFloat(style); 
        terminal.css('font-size', (fontSize + delta) + 'px');
        localStorage.setItem(terminalFontSizeKey, fontSize + delta);
    }

    function initTerminalFontSize() {
        var cacheFontSize = localStorage.getItem(terminalFontSizeKey);
        if (cacheFontSize != null) {
            var terminal = $('.terminal');
            terminal.css('font-size', (cacheFontSize) + 'px');
        }
    }
        

    $('#font-plus-button').click(function(e) {
        e.preventDefault();
        changeFontSize(fontDelta);
    });

    $('#font-minus-button').click(function(e) {
        e.preventDefault();
        changeFontSize(-fontDelta);
    });

});

