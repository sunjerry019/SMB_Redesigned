// ==UserScript==
// @name        	SMB Redesigned v2
// @namespace   	http://eccube.tk/
// @include     	http://messages.hci.edu.sg/
// @include			http://messages.hci.edu.sg/*
// @require     	http://ajax.googleapis.com/ajax/libs/jquery/2.1.3/jquery.min.js
// @version     	2.0.1.0
// @description	    SMB with a new look, made for browsers that support more than IE
// ==/UserScript==
// License: CC BY 4.0 http://creativecommons.org/licenses/by/4.0/

//init global variables
var backgroundColor = "#F9F9F9"; //"#ceeb87"; //"#1C83A5"; //"#A3A3A3";
var boxColor = "#3D3D3D"; //"#5E94F2"; //"#4484f6", //"#FFFF7C",
var currPage = "";
var immerLoad = false;
var admin = false;
var angularanot = true;
var boldPatt = /<b>/;

// login.js

function getPage()
{
    var a = window.location.href.split('/');
    var aa = a[a.length-1].split('?')[0];
    return a[a.length-2]+aa+' '+a[3];
}

function startLogin()
{
    currPage = 'login';

    //find the well designed EMB logo & titles and remove it
    $("img[src='../emb.gif'], img[src='../hci.png'], img[src='../embs.png'], h3, font[size='4']").css("display", "none");

    //find and remove the breaklines that could have been margin/padding
    $("br").each(function(){$(this).remove()});

    //set the background properly
    $("body").css("background-color", backgroundColor);

    //put the form in a well-designed whiteframe
    $("form[name=theForm]").wrap(function(){
        return '<md-whiteframe class="md-whiteframe-z2 whiteHidden" layout="column" layout-align="center center" id="login-form" style="display: none;"></md-whiteframe>';
    });
    //style the whiteframe
    $("#login-form").css({
        "max-width" : "450px",
        "height": "290px",
        "background-color": boxColor,
        "position": "absolute",
        "margin": "auto",
        "top": "0",
        "bottom": "0",
        "left": "0",
        "right": "0",
        "padding": "10px"
    })
        //add the HCI logo + the words SMB
        .prepend('<md-whiteframe class="md-whiteframe-z1" layout layout-align="center" style="height:60px; margin: 5px 0px; background-color: white; border-radius:50%; width:60px; -webkit-touch-callout: none;-webkit-user-select: none;-khtml-user-select: none;-moz-user-select: none;-ms-user-select: none;user-select: none;"><div style="text-align: center; width: 100%;"><img src="../../smb/hci.png" style="height: 44px; margin: 8px;"></div></md-whiteframe>');



    //do the buttons some justice
    //loop thru buttons and change them
    $("input[type='submit'], input[type='reset']").each(function(){
        var name = $(this).attr("name");
        var value = $(this).attr("value");
        var type = $(this).attr("type");
        var cls = "md-raised";
        var extStil = "";
        if(name == "login")
        {
            cls += " md-primary";
            extStil = " background-color: white;";
        }
        else if(name == "clear") cls += " md-warn";
        else cls += " md-accent md-hue-1";
        $(this).parent().append('<md-button class="'+cls+'" type="'+type+'" name="'+name+'" value="'+value+'" style="margin: 0px 5px; padding: 5px 10px;'+extStil+'">'+value+'</md-button>');
        $(this).remove();
    });

    //extra style for md-primary md-button
    $("head").append("<style>.md-button.md-primary:hover {background-color: #ccc !important;}</style>");

    //style the login form properly
    var loginForm = '<md-input-container style="padding-bottom: 5px;" class="md-accent md-hue-2"><label style="color:white;">USER ID</label><input name="userid" type="text" style="color:white; border-bottom-color: white;"></md-input-container>';
    loginForm += '<md-input-container style="padding-bottom: 5px;" class="md-accent md-hue-2"><label style="color:white;">PASSWORD</label><input name="password" type="password" style="font-size: 11px; color:white; border-bottom-color: white;"></md-input-container>';

    $("table").parent().css({
        "margin-bottom": "20px",
        "text-align": "left"
    }).html(loginForm);
}

function startMenu()
{
    currPage = 'menu';

    //find the well designed EMB logo and remove it
    $("img").css("display", "none");

    //find and remove the breaklines that could have been margin/padding
    $("br").each(function(){$(this).remove();});

    //find and remove unnecessary font tags, could be replaced later with proper css styling
    $("font[color=red]").each(function(){$(this).remove();});

    //set the background properly
    $("body").css({
        "background-color": backgroundColor,
        "margin": "0"
    });

    //remove the current administration, utility and logout links
    $("a[href='menu_util.pl']").remove();
    $("a[href='logoutxyz.pl']").remove();
    //check admin privileges
    var adm = $("a[href='menu_admin.pl']");
    if(adm.length > 0) admin = true;
    adm.remove();


    //make the elements for the icons
    var icons = "";

    icons += '<md-button class="md-fab md-accent md-hue-4" aria-label="Utility" ng-href="menu_util.pl" style="display: inline-block; position: absolute; left: 20px; bottom: 20px;"><md-icon icon="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABEAAAARCAYAAAA7bUf6AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA3ZpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNi1jMDE0IDc5LjE1Njc5NywgMjAxNC8wOC8yMC0wOTo1MzowMiAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDowMTcwYjg4OS00MzgwLWZkNGEtYWNmNS05Njc5OTY2MTdlZDIiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6RjJGMjRGMjFBQTBBMTFFNDlGOTg5ODYzNzA4NjQ0QTIiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6RjJGMjRGMjBBQTBBMTFFNDlGOTg5ODYzNzA4NjQ0QTIiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTQgKFdpbmRvd3MpIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6MDE3MGI4ODktNDM4MC1mZDRhLWFjZjUtOTY3OTk2NjE3ZWQyIiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOjAxNzBiODg5LTQzODAtZmQ0YS1hY2Y1LTk2Nzk5NjYxN2VkMiIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PunesRoAAAEMSURBVHjarJQ7CgIxEIajlc0uPsHC1tIL+DiMrXoFsRP1CnoEL6IH0EY7CwsFX4XgI/4rf5Y1ZBYUAx9kmH9+ksnsKq21Emjqz9WUtEklr4YV10Ul3ZKgDBKMa2BtnWQFqswnqA/qQpM2hQswBU/tXk/mF4zbxiQLdjFFmxjToC4b9KQDctYt72AI8qAECmAEHpYu966HU4X3ja6+8BIDR58qJumDU+QKacHEA1fqjqwLn/gEUtxvwUF4zDPzivqgLjTxwZX7IkgLJh7zinrfzMlfetJzPN2NBV6kF0Nwd2i7Zk72whxcOLmXmDnJmGN2vpzYJeNWdOz/8u24mFgm419+BTMrnkvClwADADb43ouNLKBAAAAAAElFTkSuQmCC" style="width: 17px; height: 17px; position: absolute; left: 0; right: 0; bottom: 0; top: 0; margin: auto;"></md-icon><md-tooltip>Utility</md-tooltip></md-button>';

    icons += '<md-button class="md-fab md-accent md-warn" aria-label="Logout" ng-href="logoutxyz.pl" style="display: inline-block;  position: absolute; right: 20px; bottom: 20px;"><md-icon icon="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABsAAAAbCAYAAACN1PRVAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA3ZpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNi1jMDE0IDc5LjE1Njc5NywgMjAxNC8wOC8yMC0wOTo1MzowMiAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDo5NGUxMmU0Mi1iMmJlLTg4NDAtYTY3NS04MzYxMzI0NDhhOWEiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6NDdGQTM0OEVBQTBDMTFFNDhGNkJENkE0MTNBQkJFREYiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6NDdGQTM0OERBQTBDMTFFNDhGNkJENkE0MTNBQkJFREYiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTQgKFdpbmRvd3MpIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6OTRlMTJlNDItYjJiZS04ODQwLWE2NzUtODM2MTMyNDQ4YTlhIiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOjk0ZTEyZTQyLWIyYmUtODg0MC1hNjc1LTgzNjEzMjQ0OGE5YSIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/Pr1QQjcAAABeSURBVHjaYmAYBaNgFAwY+P//PzouxyKGgalhWcN/CKC5ZTCLaG4ZskU0taz8PxkAn5lMeOQE6Z0aO0gIRoI+o2YCoYplxCZ9gpaxEGl3AxFqGEeLwlEwCkYYAAgwANenci93RurqAAAAAElFTkSuQmCC" style="width: 24px; height: 24px; position: absolute; left: 0; right: 0; bottom: 0; top: 0; margin: auto;"></md-icon><md-tooltip>Logout</md-tooltip></md-button>';

    //icons += "</div>";

    var header = '<h2 style="font-weight: 300; color: white; margin: 10px 5px;">Boards</h2>'; //Boards header

    //put the table in a well-designed whiteframe
    $("table").wrap(function(){
        return '<md-whiteframe class="md-whiteframe-z2 whiteHidden" layout="column" layout-align="top center" id="boards" style="display: none;"></md-whiteframe>';
    });

    //style the whiteframe
    $("#boards").css({
        "max-width" : "450px",
        "max-height": "410px",
        "background-color": boxColor,
        "position": "absolute",
        "margin": "auto",
        "top": "0",
        "bottom": "0",
        "left": "0",
        "right": "0",
        "padding": "10px",
        "overflow-y": "auto"
    }).prepend(icons).prepend(header); //Re-add the utility and logout as buttons in the whiteframe

    //display the boards
    //var boardBtns = "<md-content layout='row' layout-align='center center'>";
    //var boardBtns = '<div md-theme="altTheme">';
    var boardBtns = '';

    //grab dem information
    $('tr[bgcolor="#ffffff"]').each(function(){
        var anchor = $(this).children("td[align='left']").children("a");
        var title1 = anchor.children("b").html().split("_");
        title1.shift();
        var title = title1.join(" ");
        var link = anchor.attr("href");
        var newMsg = '', allMsg = '';

        $(this).children("td[align='center']").each(function(i){
            if(!i) newMsg = $(this).children("font").children("b").html();
            else allMsg = $(this).children("font").html();
        });

        //boardBtns += "<md-card><md-card-content><h3><a href='"+link+"'>"+title+"</a></h3><p><b>"+newMsg+"</b> new messages out of <b>"+allMsg+"</b> total messages.</p></md-card-content></md-card>";
        
        boardBtns += '<md-button md-theme="altTheme" class="md-primary md-raised boardbtns" ng-href="'+link+'" style="margin:5px 10px; font-family: RobotoDraft,Roboto,sans-serif; font-weight: 500; padding: 15px; font-size: 20px;" data-newm="'+newMsg+'" data-allm="'+allMsg+'" data-title="'+title1.join('_')+'">'+title+'</md-button>'; //('+newMsg+'/'+allMsg+')
    });

    //boardBtns += "</md-content>";
    //boardBtns += "</div>";

    boardBtns += '<md-whiteframe class="md-whiteframe-z1" layout layout-align="center center" id="msgsframe" style="font-family: RobotoDraft,Roboto,sans-serif; font-weight: 500;"><span id="msgs">5 of 5 new</span></md-whiteframe>';

    //put it into html
    $("table").remove();
    $("#boards").append(boardBtns);

    //style the msgsframe
    $("#msgsframe").css({
        "background-color": "#fff",
        "max-width": "150px",
        "padding": "10px",
        "margin": "10px auto",
        "position": "absolute",
        "left": "0",
        "right": "0",
        "bottom": "18px",
        "display": "none"
    });

}

function startError()
{
    var contents = $("body").html();

    if(contents != "")
    {
        currpage = "loginError";

        //set the background properly
        $("body").css({
            "background-color": backgroundColor,
            "margin": "0"
        });

        //grab the link for logout from the page
        var logoutLink = $("a[href^='logout']").attr("href");

        //Make the error message more useful
        var errorMsg = '<h2 style="margin:5px 0px;">Error in logging in</h2>';
        errorMsg += '<p style="margin:5px 0px 10px 0px;">tl;dr You probably didn\'t log out of your EMB.</p>';
        //add the button
        errorMsg += '<md-button class="md-raised md-warn" value="Logout" style="margin: 0px 5px; padding: 5px 10px;" ng-href="' + logoutLink + '">Logout</md-button>';
        errorMsg += '<p style="margin: 10px 10px; 0px 10px; text-align: justify; -moz-text-align-last: center; -webkit-text-align-last: center; -ms-text-align-last: center; -o-text-align-last: center; text-align-last: center;">Sorry, no further links can be provided because links to other pages require the userid to be specified. But the userid on this page is not readable by JavaScript. GLHF, or you can just log out.</p>';

        //wrap the new error message in a md-whiteframe
        //var errorMsg = $("body").html();
        $("body").html('<md-whiteframe class="md-whiteframe-z2 whiteHidden" layout="column" layout-align="center center" id="errorBox" style="display: none;">' + errorMsg + '</md-whiteframe>');

        //style the whiteframe
        $("#errorBox").css({
            "max-width" : "550px",
            "max-height": "270px",
            "background-color": boxColor,
            "position": "absolute",
            "margin": "auto",
            "top": "0",
            "bottom": "0",
            "left": "0",
            "right": "0",
            "padding": "10px",
            "color": "white"
        });
    }
    else
    {
        immerLoad = true;
    }
}

function startMain(viewpl)
{
    currPage = "main";

    $("frameset").wrap(function(){
        return "<body></body>";
    });

    var ctx = $(document);
    var reachedUnimportant = false;

    if(!viewpl)
    {
        var usrStr = decodeURIComponent(window.location.search.substr(1));
        var MsgFrameDocument = $("frame[name='content']")[0].contentDocument;
        ctx = $(MsgFrameDocument);
    }

    var left = '<md-whiteframe class="md-whiteframe-z2" layout="column" layout-align="left" id="messages">';

    left += '<section>'
          + '<md-subheader class="md-warn">Important Unread Messages</md-subheader>'
          + '<md-list layout="column">';

    var unreadMsg = [];
    var readMsg = [];

    ctx.find("tr").each(function(i){
        console.log(i);
        if(i)
        {
            var x = getContents($(this));
            var temp = '';

            if(!reachedUnimportant)
            {
                reachedUnimportant = (!x.priority);
                if (!reachedUnimportant)
                {

                    left += '<md-item class="unread important">'
                          + createListItem(x);
                }
                else
                {
                    left += '</md-list>'
                          + '</section>'

                          + '<section>'
                          + '<md-subheader class="md-primary">Other Messages</md-subheader>'
                          + '<md-list layout="column">';

                    temp = x.unread ? '<md-item class="unread unimportant">' : '<md-item class="read unimportant">';

                    temp += createListItem(x);

                    //add unread/read msgs
                    if (x.unread) unreadMsg.push(temp);
                    else read.push(temp);
                }
            }
            else
            {
                temp = x.unread ? '<md-item class="unread unimportant">' : '<md-item class="read unimportant">';

                temp += createListItem(x);

                //add unread/read msgs
                if(x.unread) unreadMsg.push(temp);
                else read.push(temp);
            }
        }
    }).promise().done(function(){
        var l = unreadMsg.length;
        for(var ul = l; ul--;)
        {
            left +=  unreadMsg[l - ul];
        }

        l = readMsg.length;
        for(var rl = l; rl--;)
        {
            left +=  readMsg[l - rl];
        }

        left += '</md-list>'
        + '</section>'
        + '</md-whiteframe>'
        + '</section>';

        $("body").html(left);
        //$("html").append("<body>" + left + "</body>");

        $(".face").css({
            "border-radius": "50%",
            "border": "1px solid #ddd",
            "height": "48px",
            "margin": "16px",
            "text-align": "center",
            "line-height": "48px"
        });
    });
}

function getContents(ele)
{
    var obj;
    ele.children("td").each(function(i){
        switch(i) {
            case 0:
                obj.priority = !!($(this).children("img[title='Priority Message']").length);
                obj.marked = ($(this).children("font abbr b").html() == '!');
                break;
            case 1:
                var d = $(this).children("font");
                var db = d.children("b");
                obj.unread = !!(db.length);
                obj.date = d.text();
                break;
            case 2:
                var s = $(this).children("abbr");
                obj.sender.s = a.text();
                obj.sender.l = a.attr("title");
                obj.bgcolor  = stringToColour(obj.sender.s.toUpperCase());
                obj.txtcolor = idealTextColor(obj.bgcolor);
                break;
            case 3:
                var t = $(this).children("a");
                obj.title = t.text();
                obj.href = t.attr("href");
                break;
            case 4:
                obj.attn = $(this).text();
                break;
            case 5:
                obj.viewers.no = $(this).text();
                var as = $(this).children("a");
                obj.viewers.href = (!!(as.length)) ? as.attr("href") : 0;
                break;
            case 6:
                //obj.editUrl = ($(this).children('input[src="http://messages.hci.edu.sg/emb/edit.png"]').length);
                var ti = parseInt($(this).text());
                obj.updateTimes = (isNaN(ti)) ? 0 : ti;
                break;
            default:
                break;
        }
    });
    return obj;
}

function createListItem(x)
{
    //add url for viewing
    var views = !!(x.viewers.href) ? '<a href="' + x.viewers.href + '">' + x.viewers.no + '</a>' : x.viewers.no;

    return '<md-item-content>'
         + '<div class="md-tile-left"><abbr title="' + x.sender.l + ' class="face" style="background-color: '+ x.bgcolor +'; color: ' + x.txtcolor + ';">' + x.sender.s.substr(0,1).toUpperCase() + '</abbr></div>'
         + '<div class="md-tile-content"><h2 class="msg-title" ng-href="' + x.href + '">' + x.title + '</h2><h4 class="msg-sender">' + x.sender.s.toUpperCase() + ' (' + x.sender.l + ')</h4><p class="message-attn">Attention: ' + x.attn + '</p></div>'

         + '<div class="md-tile-right"><h4 class="message-date">' + x.date + '</h4><p class="messageOtherDets">(Viewed: ' + views + ', Updated: ' + x.updateTimes + ')</p></div>'

         + '</md-item-content>'
         + '</md-item>';
}

function stringToColour(str) {

    // str to hash
    for (var i = 0, hash = 0; i < str.length; hash = str.charCodeAt(i++) + ((hash << 5) - hash)) {}

    // int/hash to hex
    for (var i = 0, colour = "#"; i < 3; colour += ("00" + ((hash >> i++ * 8) & 0xFF).toString(16)).slice(-2)) {}

    return colour;
}
//credit: http://stackoverflow.com/questions/3426404/create-a-hexadecimal-colour-based-on-a-string-with-javascript#answer-16348977


function idealTextColor(bgColor) {

    var nThreshold = 105;
    var components = getRGBComponents(bgColor);
    var bgDelta = (components.R * 0.299) + (components.G * 0.587) + (components.B * 0.114);

    return ((255 - bgDelta) < nThreshold) ? "#000000" : "#ffffff";
}

function getRGBComponents(color) {

    var r = color.substring(1, 3);
    var g = color.substring(3, 5);
    var b = color.substring(5, 7);

    return {
        R: parseInt(r, 16),
        G: parseInt(g, 16),
        B: parseInt(b, 16)
    };
} //credit http://stackoverflow.com/questions/4726344/how-do-i-change-text-color-determined-by-the-background-color#answer-4726403

function runAfterLoad()
{
    if(currPage == 'login')
    {
        //for the log in screen
        $("input[name=userid]").focus();
    }
    else if(currPage == 'menu')
    {
        $(".boardbtns").mouseenter(function(e){
            var a = this.dataset.allm;
            var n = this.dataset.newm;
            $("#msgsframe span").html(n + " of " + a + " new");
            $("#msgsframe").stop(true, false).fadeIn(150);
        });

        $(".boardbtns").mouseleave(function(e){
            $("#msgsframe").stop(true, false).fadeOut(150);
        });
    }
}

function init()
{    
    var page = getPage();
    var page1 = page.split(' ')[1];
    var page2 = page.split(' ')[0];
    var attachType = /\/(attach)\//.test(window.location.toString());

    switch (page2)
    {
        /*case 'smb':
            if(!localStorage.link)
            {
                window.location.href='http://messages.hci.edu.sg/smb/college_student/';
            }
            else
            {
                window.location.href=localStorage.link;
            }
            break;*/
        case 'embmenu.pl':
            startMain(0);
            break;
        case 'smbmenu.pl':
            startMenu(0);
            break;
		case 'embview_archive.pl':
			startArchive();
			break;
        case 'embview.pl':
            startMain(1);
            break;
        case 'smblogin.pl':
            startError();
            break;
        case 'emblogin.pl':
            startError();
            break;
        default:
            if(page1=='smb' || page1=='emb')
            {
                if(attachType) angularanot = false;
                if(page2 == page1) angularanot = false;
                else startLogin();
            }
            else angularanot = false;
            break;
    }
    if(angularanot) load_ng();
    else
    {
        if(!immerLoad)
        {
            $("#loader").fadeOut(200, function(){
                $("body").fadeIn(200, function(){
                    $(".whiteHidden").fadeIn(150, function(){
                        runAfterLoad();
                    });
                });
            });
        }
    }
}

function load_ng()
{
    /*var loader = '<div class="ng-scope" id="load"></md-progress-linear><md-progress-circular class="md-warn" md-mode="indeterminate" aria-valuemin="0" aria-valuemax="100" ></md-progress-circular></div>';
     $("body").append(loader);*/

    //bootstrap angular
    angular.module('SMBr', ['ngMaterial'])
        .config(function($mdThemingProvider) {
            $mdThemingProvider.theme('default')
                .primaryColor('lime')
                .accentColor('lime');
            $mdThemingProvider.theme('altTheme')
                .primaryColor('yellow')
                .accentColor('yellow');
        });

    angular.element(document).ready(function() {
        angular.bootstrap(document, ['SMBr']);

        if(!immerLoad)
        {
            $("#loader").fadeOut(200, function(){
                $("body").fadeIn(200, function(){
                    $(".whiteHidden").fadeIn(150, function(){
                        runAfterLoad();
                    });
                });
            });
        }
    });
}

jQuery.cachedScript = function( url , callback ) {
// Allow user to set any option except for dataType, cache, and url
    var options = $.extend( options || {}, {
        dataType: "script",
        cache: true,
        url: url,
        complete: callback
    });
// Use $.ajax() since it is more flexible than $.getScript
// Return the jqXHR object so we can chain callbacks
    return jQuery.ajax( options );
};


$(document).ready(function() {
    //init stuff for angular js
    //$("html").attr("ng-app","SMBr");

    var materialCSS = '<link rel="stylesheet" href="//ajax.googleapis.com/ajax/libs/angular_material/0.7.0/angular-material.css" type="text/css"/>';
    $("head").append(materialCSS);

    //angular scripts
    $.cachedScript("//cdn.jsdelivr.net/hammerjs/2.0.4/hammer.min.js", function() {
        $.cachedScript( "//ajax.googleapis.com/ajax/libs/angularjs/1.3.11/angular.min.js", function() {
            $.cachedScript("//ajax.googleapis.com/ajax/libs/angularjs/1.3.11/angular-route.min.js", function() {
                $.cachedScript("//ajax.googleapis.com/ajax/libs/angularjs/1.3.6/angular-animate.min.js", function () {
                    $.cachedScript("//ajax.googleapis.com/ajax/libs/angularjs/1.3.6/angular-aria.min.js", function () {
                        $.cachedScript("//ajax.googleapis.com/ajax/libs/angular_material/0.7.0/angular-material.min.js", function () {
                            init();
                        });
                    });
                });
            });
        });
    });

});

//Google+-like loader
$("head").append("<style>@-webkit-keyframes folding-top {2.5% {background: #f86;-moz-transform: rotateY(0deg);-ms-transform: rotateY(0deg);-webkit-transform: rotateY(0deg);transform: rotateY(0deg);-webkit-animation-timing-function: ease-in;-khtml-animation-timing-function: ease-in;-moz-animation-timing-function: ease-in;-ms-animation-timing-function: ease-in;-o-animation-timing-function: ease-in;animation-timing-function: ease-in;}13.75% {background: #ff430d;-moz-transform: rotateY(90deg);-ms-transform: rotateY(90deg);-webkit-transform: rotateY(90deg);transform: rotateY(90deg);-webkit-animation-timing-function: step-start;-khtml-animation-timing-function: step-start;-moz-animation-timing-function: step-start;-ms-animation-timing-function: step-start;-o-animation-timing-function: step-start;animation-timing-function: step-start;}13.76% {background: #ffae0d;-moz-transform: rotateY(90deg);-ms-transform: rotateY(90deg);-webkit-transform: rotateY(90deg);transform: rotateY(90deg);-webkit-animation-timing-function: ease-out;-khtml-animation-timing-function: ease-out;-moz-animation-timing-function: ease-out;-ms-animation-timing-function: ease-out;-o-animation-timing-function: ease-out;animation-timing-function: ease-out;}25% {background: #fc6;-moz-transform: rotateY(180deg);-ms-transform: rotateY(180deg);-webkit-transform: rotateY(180deg);transform: rotateY(180deg);}27.5% {background: #fc6;-moz-transform: rotateY(180deg);-ms-transform: rotateY(180deg);-webkit-transform: rotateY(180deg);transform: rotateY(180deg);-webkit-animation-timing-function: ease-in;-khtml-animation-timing-function: ease-in;-moz-animation-timing-function: ease-in;-ms-animation-timing-function: ease-in;-o-animation-timing-function: ease-in;animation-timing-function: ease-in;}41.25% {background: #ffae0d;-moz-transform: rotateY(90deg);-ms-transform: rotateY(90deg);-webkit-transform: rotateY(90deg);transform: rotateY(90deg);-webkit-animation-timing-function: step-start;-khtml-animation-timing-function: step-start;-moz-animation-timing-function: step-start;-ms-animation-timing-function: step-start;-o-animation-timing-function: step-start;animation-timing-function: step-start;}41.26% {background: #2cc642;-moz-transform: rotateY(90deg);-ms-transform: rotateY(90deg);-webkit-transform: rotateY(90deg);transform: rotateY(90deg);-webkit-animation-timing-function: ease-out;-khtml-animation-timing-function: ease-out;-moz-animation-timing-function: ease-out;-ms-animation-timing-function: ease-out;-o-animation-timing-function: ease-out;animation-timing-function: ease-out;}50% {background: #6d7;-moz-transform: rotateY(0deg);-ms-transform: rotateY(0deg);-webkit-transform: rotateY(0deg);transform: rotateY(0deg);}52.5% {background: #6d7;-moz-transform: rotateY(0deg);-ms-transform: rotateY(0deg);-webkit-transform: rotateY(0deg);transform: rotateY(0deg);-webkit-animation-timing-function: ease-in;-khtml-animation-timing-function: ease-in;-moz-animation-timing-function: ease-in;-ms-animation-timing-function: ease-in;-o-animation-timing-function: ease-in;animation-timing-function: ease-in;}63.75% {background: #2cc642;-moz-transform: rotateY(90deg);-ms-transform: rotateY(90deg);-webkit-transform: rotateY(90deg);transform: rotateY(90deg);-webkit-animation-timing-function: step-start;-khtml-animation-timing-function: step-start;-moz-animation-timing-function: step-start;-ms-animation-timing-function: step-start;-o-animation-timing-function: step-start;animation-timing-function: step-start;}63.76% {background: #1386d2;-moz-transform: rotateY(90deg);-ms-transform: rotateY(90deg);-webkit-transform: rotateY(90deg);transform: rotateY(90deg);-webkit-animation-timing-function: ease-out;-khtml-animation-timing-function: ease-out;-moz-animation-timing-function: ease-out;-ms-animation-timing-function: ease-out;-o-animation-timing-function: ease-out;animation-timing-function: ease-out;}75% {background: #4ae;-moz-transform: rotateY(180deg);-ms-transform: rotateY(180deg);-webkit-transform: rotateY(180deg);transform: rotateY(180deg);}77.5% {background: #4ae;-moz-transform: rotateY(180deg);-ms-transform: rotateY(180deg);-webkit-transform: rotateY(180deg);transform: rotateY(180deg);-webkit-animation-timing-function: ease-in;-khtml-animation-timing-function: ease-in;-moz-animation-timing-function: ease-in;-ms-animation-timing-function: ease-in;-o-animation-timing-function: ease-in;animation-timing-function: ease-in;}91.25% {background: #1386d2;-moz-transform: rotateY(90deg);-ms-transform: rotateY(90deg);-webkit-transform: rotateY(90deg);transform: rotateY(90deg);-webkit-animation-timing-function: step-start;-khtml-animation-timing-function: step-start;-moz-animation-timing-function: step-start;-ms-animation-timing-function: step-start;-o-animation-timing-function: step-start;animation-timing-function: step-start;}91.26% {background: #ff430d;-moz-transform: rotateY(90deg);-ms-transform: rotateY(90deg);-webkit-transform: rotateY(90deg);transform: rotateY(90deg);-webkit-animation-timing-function: ease-in;-khtml-animation-timing-function: ease-in;-moz-animation-timing-function: ease-in;-ms-animation-timing-function: ease-in;-o-animation-timing-function: ease-in;animation-timing-function: ease-in;}100% {background: #f86;-moz-transform: rotateY(0deg);-ms-transform: rotateY(0deg);-webkit-transform: rotateY(0deg);transform: rotateY(0deg);-webkit-animation-timing-function: step-start;-khtml-animation-timing-function: step-start;-moz-animation-timing-function: step-start;-ms-animation-timing-function: step-start;-o-animation-timing-function: step-start;animation-timing-function: step-start;}}@-moz-keyframes folding-top {2.5% {background: #f86;-moz-transform: rotateY(0deg);-ms-transform: rotateY(0deg);-webkit-transform: rotateY(0deg);transform: rotateY(0deg);-webkit-animation-timing-function: ease-in;-khtml-animation-timing-function: ease-in;-moz-animation-timing-function: ease-in;-ms-animation-timing-function: ease-in;-o-animation-timing-function: ease-in;animation-timing-function: ease-in;}13.75% {background: #ff430d;-moz-transform: rotateY(90deg);-ms-transform: rotateY(90deg);-webkit-transform: rotateY(90deg);transform: rotateY(90deg);-webkit-animation-timing-function: step-start;-khtml-animation-timing-function: step-start;-moz-animation-timing-function: step-start;-ms-animation-timing-function: step-start;-o-animation-timing-function: step-start;animation-timing-function: step-start;}13.76% {background: #ffae0d;-moz-transform: rotateY(90deg);-ms-transform: rotateY(90deg);-webkit-transform: rotateY(90deg);transform: rotateY(90deg);-webkit-animation-timing-function: ease-out;-khtml-animation-timing-function: ease-out;-moz-animation-timing-function: ease-out;-ms-animation-timing-function: ease-out;-o-animation-timing-function: ease-out;animation-timing-function: ease-out;}25% {background: #fc6;-moz-transform: rotateY(180deg);-ms-transform: rotateY(180deg);-webkit-transform: rotateY(180deg);transform: rotateY(180deg);}27.5% {background: #fc6;-moz-transform: rotateY(180deg);-ms-transform: rotateY(180deg);-webkit-transform: rotateY(180deg);transform: rotateY(180deg);-webkit-animation-timing-function: ease-in;-khtml-animation-timing-function: ease-in;-moz-animation-timing-function: ease-in;-ms-animation-timing-function: ease-in;-o-animation-timing-function: ease-in;animation-timing-function: ease-in;}41.25% {background: #ffae0d;-moz-transform: rotateY(90deg);-ms-transform: rotateY(90deg);-webkit-transform: rotateY(90deg);transform: rotateY(90deg);-webkit-animation-timing-function: step-start;-khtml-animation-timing-function: step-start;-moz-animation-timing-function: step-start;-ms-animation-timing-function: step-start;-o-animation-timing-function: step-start;animation-timing-function: step-start;}41.26% {background: #2cc642;-moz-transform: rotateY(90deg);-ms-transform: rotateY(90deg);-webkit-transform: rotateY(90deg);transform: rotateY(90deg);-webkit-animation-timing-function: ease-out;-khtml-animation-timing-function: ease-out;-moz-animation-timing-function: ease-out;-ms-animation-timing-function: ease-out;-o-animation-timing-function: ease-out;animation-timing-function: ease-out;}50% {background: #6d7;-moz-transform: rotateY(0deg);-ms-transform: rotateY(0deg);-webkit-transform: rotateY(0deg);transform: rotateY(0deg);}52.5% {background: #6d7;-moz-transform: rotateY(0deg);-ms-transform: rotateY(0deg);-webkit-transform: rotateY(0deg);transform: rotateY(0deg);-webkit-animation-timing-function: ease-in;-khtml-animation-timing-function: ease-in;-moz-animation-timing-function: ease-in;-ms-animation-timing-function: ease-in;-o-animation-timing-function: ease-in;animation-timing-function: ease-in;}63.75% {background: #2cc642;-moz-transform: rotateY(90deg);-ms-transform: rotateY(90deg);-webkit-transform: rotateY(90deg);transform: rotateY(90deg);-webkit-animation-timing-function: step-start;-khtml-animation-timing-function: step-start;-moz-animation-timing-function: step-start;-ms-animation-timing-function: step-start;-o-animation-timing-function: step-start;animation-timing-function: step-start;}63.76% {background: #1386d2;-moz-transform: rotateY(90deg);-ms-transform: rotateY(90deg);-webkit-transform: rotateY(90deg);transform: rotateY(90deg);-webkit-animation-timing-function: ease-out;-khtml-animation-timing-function: ease-out;-moz-animation-timing-function: ease-out;-ms-animation-timing-function: ease-out;-o-animation-timing-function: ease-out;animation-timing-function: ease-out;}75% {background: #4ae;-moz-transform: rotateY(180deg);-ms-transform: rotateY(180deg);-webkit-transform: rotateY(180deg);transform: rotateY(180deg);}77.5% {background: #4ae;-moz-transform: rotateY(180deg);-ms-transform: rotateY(180deg);-webkit-transform: rotateY(180deg);transform: rotateY(180deg);-webkit-animation-timing-function: ease-in;-khtml-animation-timing-function: ease-in;-moz-animation-timing-function: ease-in;-ms-animation-timing-function: ease-in;-o-animation-timing-function: ease-in;animation-timing-function: ease-in;}91.25% {background: #1386d2;-moz-transform: rotateY(90deg);-ms-transform: rotateY(90deg);-webkit-transform: rotateY(90deg);transform: rotateY(90deg);-webkit-animation-timing-function: step-start;-khtml-animation-timing-function: step-start;-moz-animation-timing-function: step-start;-ms-animation-timing-function: step-start;-o-animation-timing-function: step-start;animation-timing-function: step-start;}91.26% {background: #ff430d;-moz-transform: rotateY(90deg);-ms-transform: rotateY(90deg);-webkit-transform: rotateY(90deg);transform: rotateY(90deg);-webkit-animation-timing-function: ease-in;-khtml-animation-timing-function: ease-in;-moz-animation-timing-function: ease-in;-ms-animation-timing-function: ease-in;-o-animation-timing-function: ease-in;animation-timing-function: ease-in;}100% {background: #f86;-moz-transform: rotateY(0deg);-ms-transform: rotateY(0deg);-webkit-transform: rotateY(0deg);transform: rotateY(0deg);-webkit-animation-timing-function: step-start;-khtml-animation-timing-function: step-start;-moz-animation-timing-function: step-start;-ms-animation-timing-function: step-start;-o-animation-timing-function: step-start;animation-timing-function: step-start;}}@-o-keyframes folding-top {2.5% {background: #f86;-moz-transform: rotateY(0deg);-ms-transform: rotateY(0deg);-webkit-transform: rotateY(0deg);transform: rotateY(0deg);-webkit-animation-timing-function: ease-in;-khtml-animation-timing-function: ease-in;-moz-animation-timing-function: ease-in;-ms-animation-timing-function: ease-in;-o-animation-timing-function: ease-in;animation-timing-function: ease-in;}13.75% {background: #ff430d;-moz-transform: rotateY(90deg);-ms-transform: rotateY(90deg);-webkit-transform: rotateY(90deg);transform: rotateY(90deg);-webkit-animation-timing-function: step-start;-khtml-animation-timing-function: step-start;-moz-animation-timing-function: step-start;-ms-animation-timing-function: step-start;-o-animation-timing-function: step-start;animation-timing-function: step-start;}13.76% {background: #ffae0d;-moz-transform: rotateY(90deg);-ms-transform: rotateY(90deg);-webkit-transform: rotateY(90deg);transform: rotateY(90deg);-webkit-animation-timing-function: ease-out;-khtml-animation-timing-function: ease-out;-moz-animation-timing-function: ease-out;-ms-animation-timing-function: ease-out;-o-animation-timing-function: ease-out;animation-timing-function: ease-out;}25% {background: #fc6;-moz-transform: rotateY(180deg);-ms-transform: rotateY(180deg);-webkit-transform: rotateY(180deg);transform: rotateY(180deg);}27.5% {background: #fc6;-moz-transform: rotateY(180deg);-ms-transform: rotateY(180deg);-webkit-transform: rotateY(180deg);transform: rotateY(180deg);-webkit-animation-timing-function: ease-in;-khtml-animation-timing-function: ease-in;-moz-animation-timing-function: ease-in;-ms-animation-timing-function: ease-in;-o-animation-timing-function: ease-in;animation-timing-function: ease-in;}41.25% {background: #ffae0d;-moz-transform: rotateY(90deg);-ms-transform: rotateY(90deg);-webkit-transform: rotateY(90deg);transform: rotateY(90deg);-webkit-animation-timing-function: step-start;-khtml-animation-timing-function: step-start;-moz-animation-timing-function: step-start;-ms-animation-timing-function: step-start;-o-animation-timing-function: step-start;animation-timing-function: step-start;}41.26% {background: #2cc642;-moz-transform: rotateY(90deg);-ms-transform: rotateY(90deg);-webkit-transform: rotateY(90deg);transform: rotateY(90deg);-webkit-animation-timing-function: ease-out;-khtml-animation-timing-function: ease-out;-moz-animation-timing-function: ease-out;-ms-animation-timing-function: ease-out;-o-animation-timing-function: ease-out;animation-timing-function: ease-out;}50% {background: #6d7;-moz-transform: rotateY(0deg);-ms-transform: rotateY(0deg);-webkit-transform: rotateY(0deg);transform: rotateY(0deg);}52.5% {background: #6d7;-moz-transform: rotateY(0deg);-ms-transform: rotateY(0deg);-webkit-transform: rotateY(0deg);transform: rotateY(0deg);-webkit-animation-timing-function: ease-in;-khtml-animation-timing-function: ease-in;-moz-animation-timing-function: ease-in;-ms-animation-timing-function: ease-in;-o-animation-timing-function: ease-in;animation-timing-function: ease-in;}63.75% {background: #2cc642;-moz-transform: rotateY(90deg);-ms-transform: rotateY(90deg);-webkit-transform: rotateY(90deg);transform: rotateY(90deg);-webkit-animation-timing-function: step-start;-khtml-animation-timing-function: step-start;-moz-animation-timing-function: step-start;-ms-animation-timing-function: step-start;-o-animation-timing-function: step-start;animation-timing-function: step-start;}63.76% {background: #1386d2;-moz-transform: rotateY(90deg);-ms-transform: rotateY(90deg);-webkit-transform: rotateY(90deg);transform: rotateY(90deg);-webkit-animation-timing-function: ease-out;-khtml-animation-timing-function: ease-out;-moz-animation-timing-function: ease-out;-ms-animation-timing-function: ease-out;-o-animation-timing-function: ease-out;animation-timing-function: ease-out;}75% {background: #4ae;-moz-transform: rotateY(180deg);-ms-transform: rotateY(180deg);-webkit-transform: rotateY(180deg);transform: rotateY(180deg);}77.5% {background: #4ae;-moz-transform: rotateY(180deg);-ms-transform: rotateY(180deg);-webkit-transform: rotateY(180deg);transform: rotateY(180deg);-webkit-animation-timing-function: ease-in;-khtml-animation-timing-function: ease-in;-moz-animation-timing-function: ease-in;-ms-animation-timing-function: ease-in;-o-animation-timing-function: ease-in;animation-timing-function: ease-in;}91.25% {background: #1386d2;-moz-transform: rotateY(90deg);-ms-transform: rotateY(90deg);-webkit-transform: rotateY(90deg);transform: rotateY(90deg);-webkit-animation-timing-function: step-start;-khtml-animation-timing-function: step-start;-moz-animation-timing-function: step-start;-ms-animation-timing-function: step-start;-o-animation-timing-function: step-start;animation-timing-function: step-start;}91.26% {background: #ff430d;-moz-transform: rotateY(90deg);-ms-transform: rotateY(90deg);-webkit-transform: rotateY(90deg);transform: rotateY(90deg);-webkit-animation-timing-function: ease-in;-khtml-animation-timing-function: ease-in;-moz-animation-timing-function: ease-in;-ms-animation-timing-function: ease-in;-o-animation-timing-function: ease-in;animation-timing-function: ease-in;}100% {background: #f86;-moz-transform: rotateY(0deg);-ms-transform: rotateY(0deg);-webkit-transform: rotateY(0deg);transform: rotateY(0deg);-webkit-animation-timing-function: step-start;-khtml-animation-timing-function: step-start;-moz-animation-timing-function: step-start;-ms-animation-timing-function: step-start;-o-animation-timing-function: step-start;animation-timing-function: step-start;}}@keyframes folding-top {2.5% {background: #f86;-moz-transform: rotateY(0deg);-ms-transform: rotateY(0deg);-webkit-transform: rotateY(0deg);transform: rotateY(0deg);-webkit-animation-timing-function: ease-in;-khtml-animation-timing-function: ease-in;-moz-animation-timing-function: ease-in;-ms-animation-timing-function: ease-in;-o-animation-timing-function: ease-in;animation-timing-function: ease-in;}13.75% {background: #ff430d;-moz-transform: rotateY(90deg);-ms-transform: rotateY(90deg);-webkit-transform: rotateY(90deg);transform: rotateY(90deg);-webkit-animation-timing-function: step-start;-khtml-animation-timing-function: step-start;-moz-animation-timing-function: step-start;-ms-animation-timing-function: step-start;-o-animation-timing-function: step-start;animation-timing-function: step-start;}13.76% {background: #ffae0d;-moz-transform: rotateY(90deg);-ms-transform: rotateY(90deg);-webkit-transform: rotateY(90deg);transform: rotateY(90deg);-webkit-animation-timing-function: ease-out;-khtml-animation-timing-function: ease-out;-moz-animation-timing-function: ease-out;-ms-animation-timing-function: ease-out;-o-animation-timing-function: ease-out;animation-timing-function: ease-out;}25% {background: #fc6;-moz-transform: rotateY(180deg);-ms-transform: rotateY(180deg);-webkit-transform: rotateY(180deg);transform: rotateY(180deg);}27.5% {background: #fc6;-moz-transform: rotateY(180deg);-ms-transform: rotateY(180deg);-webkit-transform: rotateY(180deg);transform: rotateY(180deg);-webkit-animation-timing-function: ease-in;-khtml-animation-timing-function: ease-in;-moz-animation-timing-function: ease-in;-ms-animation-timing-function: ease-in;-o-animation-timing-function: ease-in;animation-timing-function: ease-in;}41.25% {background: #ffae0d;-moz-transform: rotateY(90deg);-ms-transform: rotateY(90deg);-webkit-transform: rotateY(90deg);transform: rotateY(90deg);-webkit-animation-timing-function: step-start;-khtml-animation-timing-function: step-start;-moz-animation-timing-function: step-start;-ms-animation-timing-function: step-start;-o-animation-timing-function: step-start;animation-timing-function: step-start;}41.26% {background: #2cc642;-moz-transform: rotateY(90deg);-ms-transform: rotateY(90deg);-webkit-transform: rotateY(90deg);transform: rotateY(90deg);-webkit-animation-timing-function: ease-out;-khtml-animation-timing-function: ease-out;-moz-animation-timing-function: ease-out;-ms-animation-timing-function: ease-out;-o-animation-timing-function: ease-out;animation-timing-function: ease-out;}50% {background: #6d7;-moz-transform: rotateY(0deg);-ms-transform: rotateY(0deg);-webkit-transform: rotateY(0deg);transform: rotateY(0deg);}52.5% {background: #6d7;-moz-transform: rotateY(0deg);-ms-transform: rotateY(0deg);-webkit-transform: rotateY(0deg);transform: rotateY(0deg);-webkit-animation-timing-function: ease-in;-khtml-animation-timing-function: ease-in;-moz-animation-timing-function: ease-in;-ms-animation-timing-function: ease-in;-o-animation-timing-function: ease-in;animation-timing-function: ease-in;}63.75% {background: #2cc642;-moz-transform: rotateY(90deg);-ms-transform: rotateY(90deg);-webkit-transform: rotateY(90deg);transform: rotateY(90deg);-webkit-animation-timing-function: step-start;-khtml-animation-timing-function: step-start;-moz-animation-timing-function: step-start;-ms-animation-timing-function: step-start;-o-animation-timing-function: step-start;animation-timing-function: step-start;}63.76% {background: #1386d2;-moz-transform: rotateY(90deg);-ms-transform: rotateY(90deg);-webkit-transform: rotateY(90deg);transform: rotateY(90deg);-webkit-animation-timing-function: ease-out;-khtml-animation-timing-function: ease-out;-moz-animation-timing-function: ease-out;-ms-animation-timing-function: ease-out;-o-animation-timing-function: ease-out;animation-timing-function: ease-out;}75% {background: #4ae;-moz-transform: rotateY(180deg);-ms-transform: rotateY(180deg);-webkit-transform: rotateY(180deg);transform: rotateY(180deg);}77.5% {background: #4ae;-moz-transform: rotateY(180deg);-ms-transform: rotateY(180deg);-webkit-transform: rotateY(180deg);transform: rotateY(180deg);-webkit-animation-timing-function: ease-in;-khtml-animation-timing-function: ease-in;-moz-animation-timing-function: ease-in;-ms-animation-timing-function: ease-in;-o-animation-timing-function: ease-in;animation-timing-function: ease-in;}91.25% {background: #1386d2;-moz-transform: rotateY(90deg);-ms-transform: rotateY(90deg);-webkit-transform: rotateY(90deg);transform: rotateY(90deg);-webkit-animation-timing-function: step-start;-khtml-animation-timing-function: step-start;-moz-animation-timing-function: step-start;-ms-animation-timing-function: step-start;-o-animation-timing-function: step-start;animation-timing-function: step-start;}91.26% {background: #ff430d;-moz-transform: rotateY(90deg);-ms-transform: rotateY(90deg);-webkit-transform: rotateY(90deg);transform: rotateY(90deg);-webkit-animation-timing-function: ease-in;-khtml-animation-timing-function: ease-in;-moz-animation-timing-function: ease-in;-ms-animation-timing-function: ease-in;-o-animation-timing-function: ease-in;animation-timing-function: ease-in;}100% {background: #f86;-moz-transform: rotateY(0deg);-ms-transform: rotateY(0deg);-webkit-transform: rotateY(0deg);transform: rotateY(0deg);-webkit-animation-timing-function: step-start;-khtml-animation-timing-function: step-start;-moz-animation-timing-function: step-start;-ms-animation-timing-function: step-start;-o-animation-timing-function: step-start;animation-timing-function: step-start;}}@-webkit-keyframes folding-bottom {0% {background: #fc6;-webkit-animation-timing-function: step-start;-khtml-animation-timing-function: step-start;-moz-animation-timing-function: step-start;-ms-animation-timing-function: step-start;-o-animation-timing-function: step-start;animation-timing-function: step-start;}50% {background: #fc6;-webkit-animation-timing-function: step-start;-khtml-animation-timing-function: step-start;-moz-animation-timing-function: step-start;-ms-animation-timing-function: step-start;-o-animation-timing-function: step-start;animation-timing-function: step-start;}75% {background: #4ae;-webkit-animation-timing-function: step-start;-khtml-animation-timing-function: step-start;-moz-animation-timing-function: step-start;-ms-animation-timing-function: step-start;-o-animation-timing-function: step-start;animation-timing-function: step-start;}100% {background: #4ae;-webkit-animation-timing-function: step-start;-khtml-animation-timing-function: step-start;-moz-animation-timing-function: step-start;-ms-animation-timing-function: step-start;-o-animation-timing-function: step-start;animation-timing-function: step-start;}}@-moz-keyframes folding-bottom {0% {background: #fc6;-webkit-animation-timing-function: step-start;-khtml-animation-timing-function: step-start;-moz-animation-timing-function: step-start;-ms-animation-timing-function: step-start;-o-animation-timing-function: step-start;animation-timing-function: step-start;}50% {background: #fc6;-webkit-animation-timing-function: step-start;-khtml-animation-timing-function: step-start;-moz-animation-timing-function: step-start;-ms-animation-timing-function: step-start;-o-animation-timing-function: step-start;animation-timing-function: step-start;}75% {background: #4ae;-webkit-animation-timing-function: step-start;-khtml-animation-timing-function: step-start;-moz-animation-timing-function: step-start;-ms-animation-timing-function: step-start;-o-animation-timing-function: step-start;animation-timing-function: step-start;}100% {background: #4ae;-webkit-animation-timing-function: step-start;-khtml-animation-timing-function: step-start;-moz-animation-timing-function: step-start;-ms-animation-timing-function: step-start;-o-animation-timing-function: step-start;animation-timing-function: step-start;}}@-o-keyframes folding-bottom {0% {background: #fc6;-webkit-animation-timing-function: step-start;-khtml-animation-timing-function: step-start;-moz-animation-timing-function: step-start;-ms-animation-timing-function: step-start;-o-animation-timing-function: step-start;animation-timing-function: step-start;}50% {background: #fc6;-webkit-animation-timing-function: step-start;-khtml-animation-timing-function: step-start;-moz-animation-timing-function: step-start;-ms-animation-timing-function: step-start;-o-animation-timing-function: step-start;animation-timing-function: step-start;}75% {background: #4ae;-webkit-animation-timing-function: step-start;-khtml-animation-timing-function: step-start;-moz-animation-timing-function: step-start;-ms-animation-timing-function: step-start;-o-animation-timing-function: step-start;animation-timing-function: step-start;}100% {background: #4ae;-webkit-animation-timing-function: step-start;-khtml-animation-timing-function: step-start;-moz-animation-timing-function: step-start;-ms-animation-timing-function: step-start;-o-animation-timing-function: step-start;animation-timing-function: step-start;}}@keyframes folding-bottom {0% {background: #fc6;-webkit-animation-timing-function: step-start;-khtml-animation-timing-function: step-start;-moz-animation-timing-function: step-start;-ms-animation-timing-function: step-start;-o-animation-timing-function: step-start;animation-timing-function: step-start;}50% {background: #fc6;-webkit-animation-timing-function: step-start;-khtml-animation-timing-function: step-start;-moz-animation-timing-function: step-start;-ms-animation-timing-function: step-start;-o-animation-timing-function: step-start;animation-timing-function: step-start;}75% {background: #4ae;-webkit-animation-timing-function: step-start;-khtml-animation-timing-function: step-start;-moz-animation-timing-function: step-start;-ms-animation-timing-function: step-start;-o-animation-timing-function: step-start;animation-timing-function: step-start;}100% {background: #4ae;-webkit-animation-timing-function: step-start;-khtml-animation-timing-function: step-start;-moz-animation-timing-function: step-start;-ms-animation-timing-function: step-start;-o-animation-timing-function: step-start;animation-timing-function: step-start;}}@-webkit-keyframes folding-background {0% {background: #f86;-moz-transform: rotateZ(180deg);-ms-transform: rotateZ(180deg);-webkit-transform: rotateZ(180deg);transform: rotateZ(180deg);}25% {background: #f86;-moz-transform: rotateZ(180deg);-ms-transform: rotateZ(180deg);-webkit-transform: rotateZ(180deg);transform: rotateZ(180deg);-webkit-animation-timing-function: step-start;-khtml-animation-timing-function: step-start;-moz-animation-timing-function: step-start;-ms-animation-timing-function: step-start;-o-animation-timing-function: step-start;animation-timing-function: step-start;}27.5% {background: #6d7;-moz-transform: rotateZ(90deg);-ms-transform: rotateZ(90deg);-webkit-transform: rotateZ(90deg);transform: rotateZ(90deg);}50% {background: #6d7;-moz-transform: rotateZ(90deg);-ms-transform: rotateZ(90deg);-webkit-transform: rotateZ(90deg);transform: rotateZ(90deg);-webkit-animation-timing-function: step-start;-khtml-animation-timing-function: step-start;-moz-animation-timing-function: step-start;-ms-animation-timing-function: step-start;-o-animation-timing-function: step-start;animation-timing-function: step-start;}52.5% {background: #6d7;-moz-transform: rotateZ(0deg);-ms-transform: rotateZ(0deg);-webkit-transform: rotateZ(0deg);transform: rotateZ(0deg);}75% {background: #6d7;-moz-transform: rotateZ(0deg);-ms-transform: rotateZ(0deg);-webkit-transform: rotateZ(0deg);transform: rotateZ(0deg);-webkit-animation-timing-function: step-start;-khtml-animation-timing-function: step-start;-moz-animation-timing-function: step-start;-ms-animation-timing-function: step-start;-o-animation-timing-function: step-start;animation-timing-function: step-start;}77.5% {background: #f86;-moz-transform: rotateZ(270deg);-ms-transform: rotateZ(270deg);-webkit-transform: rotateZ(270deg);transform: rotateZ(270deg);}100% {background: #f86;-moz-transform: rotateZ(270deg);-ms-transform: rotateZ(270deg);-webkit-transform: rotateZ(270deg);transform: rotateZ(270deg);-webkit-animation-timing-function: step-start;-khtml-animation-timing-function: step-start;-moz-animation-timing-function: step-start;-ms-animation-timing-function: step-start;-o-animation-timing-function: step-start;animation-timing-function: step-start;}}@-moz-keyframes folding-background {0% {background: #f86;-moz-transform: rotateZ(180deg);-ms-transform: rotateZ(180deg);-webkit-transform: rotateZ(180deg);transform: rotateZ(180deg);}25% {background: #f86;-moz-transform: rotateZ(180deg);-ms-transform: rotateZ(180deg);-webkit-transform: rotateZ(180deg);transform: rotateZ(180deg);-webkit-animation-timing-function: step-start;-khtml-animation-timing-function: step-start;-moz-animation-timing-function: step-start;-ms-animation-timing-function: step-start;-o-animation-timing-function: step-start;animation-timing-function: step-start;}27.5% {background: #6d7;-moz-transform: rotateZ(90deg);-ms-transform: rotateZ(90deg);-webkit-transform: rotateZ(90deg);transform: rotateZ(90deg);}50% {background: #6d7;-moz-transform: rotateZ(90deg);-ms-transform: rotateZ(90deg);-webkit-transform: rotateZ(90deg);transform: rotateZ(90deg);-webkit-animation-timing-function: step-start;-khtml-animation-timing-function: step-start;-moz-animation-timing-function: step-start;-ms-animation-timing-function: step-start;-o-animation-timing-function: step-start;animation-timing-function: step-start;}52.5% {background: #6d7;-moz-transform: rotateZ(0deg);-ms-transform: rotateZ(0deg);-webkit-transform: rotateZ(0deg);transform: rotateZ(0deg);}75% {background: #6d7;-moz-transform: rotateZ(0deg);-ms-transform: rotateZ(0deg);-webkit-transform: rotateZ(0deg);transform: rotateZ(0deg);-webkit-animation-timing-function: step-start;-khtml-animation-timing-function: step-start;-moz-animation-timing-function: step-start;-ms-animation-timing-function: step-start;-o-animation-timing-function: step-start;animation-timing-function: step-start;}77.5% {background: #f86;-moz-transform: rotateZ(270deg);-ms-transform: rotateZ(270deg);-webkit-transform: rotateZ(270deg);transform: rotateZ(270deg);}100% {background: #f86;-moz-transform: rotateZ(270deg);-ms-transform: rotateZ(270deg);-webkit-transform: rotateZ(270deg);transform: rotateZ(270deg);-webkit-animation-timing-function: step-start;-khtml-animation-timing-function: step-start;-moz-animation-timing-function: step-start;-ms-animation-timing-function: step-start;-o-animation-timing-function: step-start;animation-timing-function: step-start;}}@-o-keyframes folding-background {0% {background: #f86;-moz-transform: rotateZ(180deg);-ms-transform: rotateZ(180deg);-webkit-transform: rotateZ(180deg);transform: rotateZ(180deg);}25% {background: #f86;-moz-transform: rotateZ(180deg);-ms-transform: rotateZ(180deg);-webkit-transform: rotateZ(180deg);transform: rotateZ(180deg);-webkit-animation-timing-function: step-start;-khtml-animation-timing-function: step-start;-moz-animation-timing-function: step-start;-ms-animation-timing-function: step-start;-o-animation-timing-function: step-start;animation-timing-function: step-start;}27.5% {background: #6d7;-moz-transform: rotateZ(90deg);-ms-transform: rotateZ(90deg);-webkit-transform: rotateZ(90deg);transform: rotateZ(90deg);}50% {background: #6d7;-moz-transform: rotateZ(90deg);-ms-transform: rotateZ(90deg);-webkit-transform: rotateZ(90deg);transform: rotateZ(90deg);-webkit-animation-timing-function: step-start;-khtml-animation-timing-function: step-start;-moz-animation-timing-function: step-start;-ms-animation-timing-function: step-start;-o-animation-timing-function: step-start;animation-timing-function: step-start;}52.5% {background: #6d7;-moz-transform: rotateZ(0deg);-ms-transform: rotateZ(0deg);-webkit-transform: rotateZ(0deg);transform: rotateZ(0deg);}75% {background: #6d7;-moz-transform: rotateZ(0deg);-ms-transform: rotateZ(0deg);-webkit-transform: rotateZ(0deg);transform: rotateZ(0deg);-webkit-animation-timing-function: step-start;-khtml-animation-timing-function: step-start;-moz-animation-timing-function: step-start;-ms-animation-timing-function: step-start;-o-animation-timing-function: step-start;animation-timing-function: step-start;}77.5% {background: #f86;-moz-transform: rotateZ(270deg);-ms-transform: rotateZ(270deg);-webkit-transform: rotateZ(270deg);transform: rotateZ(270deg);}100% {background: #f86;-moz-transform: rotateZ(270deg);-ms-transform: rotateZ(270deg);-webkit-transform: rotateZ(270deg);transform: rotateZ(270deg);-webkit-animation-timing-function: step-start;-khtml-animation-timing-function: step-start;-moz-animation-timing-function: step-start;-ms-animation-timing-function: step-start;-o-animation-timing-function: step-start;animation-timing-function: step-start;}}@keyframes folding-background {0% {background: #f86;-moz-transform: rotateZ(180deg);-ms-transform: rotateZ(180deg);-webkit-transform: rotateZ(180deg);transform: rotateZ(180deg);}25% {background: #f86;-moz-transform: rotateZ(180deg);-ms-transform: rotateZ(180deg);-webkit-transform: rotateZ(180deg);transform: rotateZ(180deg);-webkit-animation-timing-function: step-start;-khtml-animation-timing-function: step-start;-moz-animation-timing-function: step-start;-ms-animation-timing-function: step-start;-o-animation-timing-function: step-start;animation-timing-function: step-start;}27.5% {background: #6d7;-moz-transform: rotateZ(90deg);-ms-transform: rotateZ(90deg);-webkit-transform: rotateZ(90deg);transform: rotateZ(90deg);}50% {background: #6d7;-moz-transform: rotateZ(90deg);-ms-transform: rotateZ(90deg);-webkit-transform: rotateZ(90deg);transform: rotateZ(90deg);-webkit-animation-timing-function: step-start;-khtml-animation-timing-function: step-start;-moz-animation-timing-function: step-start;-ms-animation-timing-function: step-start;-o-animation-timing-function: step-start;animation-timing-function: step-start;}52.5% {background: #6d7;-moz-transform: rotateZ(0deg);-ms-transform: rotateZ(0deg);-webkit-transform: rotateZ(0deg);transform: rotateZ(0deg);}75% {background: #6d7;-moz-transform: rotateZ(0deg);-ms-transform: rotateZ(0deg);-webkit-transform: rotateZ(0deg);transform: rotateZ(0deg);-webkit-animation-timing-function: step-start;-khtml-animation-timing-function: step-start;-moz-animation-timing-function: step-start;-ms-animation-timing-function: step-start;-o-animation-timing-function: step-start;animation-timing-function: step-start;}77.5% {background: #f86;-moz-transform: rotateZ(270deg);-ms-transform: rotateZ(270deg);-webkit-transform: rotateZ(270deg);transform: rotateZ(270deg);}100% {background: #f86;-moz-transform: rotateZ(270deg);-ms-transform: rotateZ(270deg);-webkit-transform: rotateZ(270deg);transform: rotateZ(270deg);-webkit-animation-timing-function: step-start;-khtml-animation-timing-function: step-start;-moz-animation-timing-function: step-start;-ms-animation-timing-function: step-start;-o-animation-timing-function: step-start;animation-timing-function: step-start;}}body {text-align: center;padding: 50px;}/* Styles for old versions of IE */.folding {font-family: sans-serif;font-weight: 100;}/* :not(:required) hides this rule from IE9 and below */.folding:not(:required) {overflow: hidden;position: relative;text-indent: -9999px;display: inline-block;width: 48px;height: 48px;background: #f86;-moz-border-radius: 24px;-webkit-border-radius: 24px;border-radius: 24px;-moz-transform: rotateZ(90deg);-ms-transform: rotateZ(90deg);-webkit-transform: rotateZ(90deg);transform: rotateZ(90deg);-moz-transform-origin: 50% 50%;-ms-transform-origin: 50% 50%;-webkit-transform-origin: 50% 50%;transform-origin: 50% 50%;-webkit-animation: folding-background 3s infinite ease-in-out;-khtml-animation: folding-background 3s infinite ease-in-out;-moz-animation: folding-background 3s infinite ease-in-out;-ms-animation: folding-background 3s infinite ease-in-out;-o-animation: folding-background 3s infinite ease-in-out;animation: folding-background 3s infinite ease-in-out;}.folding:not(:required)::after {background: #f86;-moz-border-radius: 24px 0 0 24px;-webkit-border-radius: 24px;border-radius: 24px 0 0 24px;content: '';position: absolute;right: 50%;top: 0;width: 50%;height: 100%;-moz-transform-origin: 100% 50%;-ms-transform-origin: 100% 50%;-webkit-transform-origin: 100% 50%;transform-origin: 100% 50%;-webkit-animation: folding-top 3s infinite linear;-khtml-animation: folding-top 3s infinite linear;-moz-animation: folding-top 3s infinite linear;-ms-animation: folding-top 3s infinite linear;-o-animation: folding-top 3s infinite linear;animation: folding-top 3s infinite linear;}.folding:not(:required)::before {background: #fc6;-moz-border-radius: 24px 0 0 24px;-webkit-border-radius: 24px;border-radius: 24px 0 0 24px;content: '';position: absolute;right: 50%;top: 0;width: 50%;height: 100%;-moz-transform-origin: 100% 50%;-ms-transform-origin: 100% 50%;-webkit-transform-origin: 100% 50%;transform-origin: 100% 50%;-webkit-animation: folding-bottom 3s infinite linear;-khtml-animation: folding-bottom 3s infinite linear;-moz-animation: folding-bottom 3s infinite linear;-ms-animation: folding-bottom 3s infinite linear;-o-animation: folding-bottom 3s infinite linear;animation: folding-bottom 3s infinite linear;}</style>"); //credit: John W. Long, http://codepen.io/jlong/details/nsHkf

$("body").hide();
$("frameset").hide();
$("html").append('<div id="loader" style="position:fixed; top:0;right:0;left:0;bottom:0;margin:auto;display:block; height:100px; width: 100px;"><span class="folding">Loading...</span></div>');

WebFontConfig = {
    google: { families: [ 'Roboto:400,300,300italic,400italic,500,500italic,700,700italic:latin' ] }
};

(function() {
    var wf = document.createElement('script');
    wf.src = ('https:' == document.location.protocol ? 'https' : 'http') +
      '://ajax.googleapis.com/ajax/libs/webfont/1/webfont.js';
    wf.type = 'text/javascript';
    wf.async = 'true';
    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(wf, s);
})();