// ==UserScript==
// @name        	SMB Redesigned v3
// @namespace   	http://eccube.tk/
// @include     	http://messages.hci.edu.sg/
// @include			http://messages.hci.edu.sg/*
// @require     	http://ajax.googleapis.com/ajax/libs/jquery/2.1.3/jquery.min.js
// @require			https://cdnjs.cloudflare.com/ajax/libs/materialize/0.97.0/js/materialize.min.js
// @version     	3.14.15
// @description     SMB with a new look, made for browsers that support more than IE
// ==/UserScript==
// License: CC BY 4.0 http://creativecommons.org/licenses/by/4.0/

//Init vars
var materialize = true;
var retrieving = false;
var lastUpdated = null;
var currPage = "";
var currentMessages = [];
var currentMessage = false;
var selectedMessages = [];
var windowFocus = true;
var globalTImer;

//default values
var defaultColours = {
    "nav" : "",
    "footer": "",
    "loaderMain":
    {
        "main": "deep-orange darken-4",
        "accent": "light-blue"
    },
    "loaderSecondary":
    {
        "main": "amber",
        "accent": "pink"
    },
    "background": "#EDE8E4" //this can actually be an image, use url instead, and relevant css settings
}

var defaultSettings = {
    "footer": {
        "padding": "20px", // value has to be set
        "margin": "20px",
        "height": "50px" //30px should be min or something
    }
}

//init
var colours = (typeof(localStorage["colours"]) != "undefined") ? objectExtend(defaultColours, $.parseJSON(localStorage["colours"])) : defaultColours;
var settings = (typeof(localStorage["settings"]) != "undefined") ? objectExtend(defaultSettings, $.parseJSON(localStorage["settings"])) : defaultSettings;
var link_regex = /(([a-z]+:\/\/)?(([a-z0-9\-]+\.)+([a-z]{2}|aero|arpa|biz|com|coop|edu|gov|info|int|jobs|mil|museum|name|nato|net|org|pro|travel|local|internal))(:[0-9]{1,5})?(\/[a-z0-9_\-\.~]+)*(\/([a-z0-9_\-\.]*)(\?[a-z0-9+_\-\.%=&amp;]*)?)?(#[a-zA-Z0-9!$&'()*+.=-_~:@/?]*)?)(\s+|$)/gi; //link_regex.test("http://a.a.com/asd.tiff") returns false
//credit: stackoverflow.com/questions/1500260/detect-urls-in-text-with-javascript
var email_regex = /([-!#-'*+/-9=?A-Z^-~]+(\.[-!#-'*+/-9=?A-Z^-~]+)*|"([]!#-[^-~ \t]|(\\[\t -~]))+")@[0-9A-Za-z]([0-9A-Za-z-]{0,61}[0-9A-Za-z])?(\.[0-9A-Za-z]([0-9A-Za-z-]{0,61}[0-9A-Za-z])?)+/gi; //' //terminates string literal that sublime falsely recognizes
//credit http://stackoverflow.com/questions/201323/using-a-regular-expression-to-validate-an-email-address/14075810#14075810

//begin code
function getPage()
{
    var a = window.location.href.split('/');
    var aa = a[a.length-1].split('?')[0];
    return a[a.length-2]+aa+' '+a[3];
}

//utils
function objectExtend(objTarget, obj)
{
    //checks only 1 layer deep
    for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
            if(typeof(obj[key]) == "object")
            {
                if(typeof(objTarget[key]) != "undefined")
                {
                    var mergedObj  = $.extend(objTarget[key], obj[key]);
                    obj[key] = mergedObj;
                }
            }
        }
    }
    
    return $.extend(objTarget, obj);
}

function grabData(type)
{
	var ret = {};
	
	if(type == "login")
	{
		ret.action = $("form[name='theForm']").attr("action");
		ret.submitName = [];
		$("input[type='submit']").each(function(ele)
		{
			ret.submitName.push(this.name);
		});
	}
	else if(type == "menu")
	{
		ret.admin = ($("a[href='menu_admin.pl']").length > 0);
		
		ret.toplinks = {};
		$("a:not(table a)").each(function(ele)
		{
			ret.toplinks[$.trim($(this).text().toLowerCase())] = $(this).attr("href");
		});
		
		ret.boards = {};
		$("table a").each(function(ele)
		{
			var block = $(this).closest("tr").children("td[align='center']");
			
			ret.boards[$.trim($(this).text())] = {
				"href": $(this).attr("href"),
				"newc": $.trim($(block[0]).text()),
				"all": $.trim($(block[1]).text())
			};
		});
	}
	else if(type == "wrongidpw")
	{
		ret.link = $("a").attr("href");
	}
	else if(type == "loginError")
	{
		ret.logout = $("a[href^='logout']").attr("href");
	}
	else if(type == "util")
	{
		ret.links = [];
		$("li a").each(function(ele)
		{
			ret.links.push({
				"title": $(this).text(),
				"href" : $(this).attr("href")
			});
		});
	}
	else if(type == "root")
	{
		ret.links = [];
		$("a").each(function(ele)
		{
			ret.links.push({
				"title": $(this).text(),
				"href" : $(this).attr("href")
			});
		});
	}
	else if(type == "main")
	{
		console.log("getMessage");
		ret = getMessages("view");
		console.log("getMessage OK");
		console.log(ret);
		if(!ret.error)
		{
			ret.topbar = getTopbar();
			console.log("topbar OK");
		}
		else 
		{
			//assume error
			ret.topbar = {
				"error": true,
				"errorReason": {
					"errorThrown": "Gateway Time-out",
					"textStatus": "error"
				}
			}
		}
	}
	
	return ret;
}


function startLogin()
{
    currPage = 'login';
    
    //set localstoragelink
    localStorage.link = window.location.pathname;
    
    //set title
    document.title = "Electronic Messaging Board";
    
    //style the body
    $("body").css({
    	"background": colours.background,
    	"display": "none"
    });
    
    //process info
    var infos = grabData(currPage);   
    
    var body = [];
    
    body.push('<div class="card main"><div class="row"><form class="col s12" action="' + infos.action + '" method="POST">');
    //hcilogo
    body.push('<div class="row"><div class="center col s12"><img src="/smb/hci.png" style="height:50px;"></div></div>');
    //userid input field
    body.push('<div class="row"><div class="input-field col s12"><i class="material-icons prefix unselectable">account_circle</i><input id="userid" type="text" class="validate" maxlength="16" name="userid" required><label for="userid">User ID</label></div></div>');
    //password
    body.push('<div class="row"><div class="input-field col s12"><i class="material-icons prefix unselectable">vpn_key</i><input id="password" type="password" class="validate" maxlength="16" name="password" required><label for="password">Password</label></div></div>');
    //submit button + changepw
    body.push('<div class="row"><div class="col s12"><button class="btn waves-effect waves-light subbtn" type="submit" name="' + infos.submitName[0] + '"><i class="material-icons">send</i></button><div id="changepw"><button type="submit" class="waves-effect waves-teal btn-flat" name="' + infos.submitName[infos.submitName.length - 1] + '">Change Password</button></div></div></div>');
    
    body.push("</div></div></div>");
    
    //put in the html
    $("body").html(body.join(""));
    $("body").removeAttr("bgcolor");
    
    //apply the styles
    $(".main").css({
    	"position": "absolute",
		"left": 0,
		"right": 0,
		"top": 0,
		"bottom": 0,
		"max-width": "500px",
		"max-height": "300px",
		"padding-top": "20px",
		"margin": "auto"
    });
    
    $(".subbtn").css({
    	"float": "right"
    });
    
    $("#changepw button").css({
    	"float": "right"
    });
    
    $(".row").css({
    	"margin-bottom": "5px"
    });
    
    //show body
    $('body').fadeIn(1000, function(){
        //$("#password").focus();
        $("#userid").focus();
    });
}

function startMenu()
{
    currPage = 'menu';
    
    //set title
    document.title = "SMB Menu";
    
    //style the body
    $("body").css({
    	"background": colours.background,
    	"display": "none"
    });
    
    //process info
   	var infos = grabData(currPage);
   	
   	var body = [];
   	
   	body.push('<div class="parent"><div class="card main">');
   	//header
   	body.push('<div class="row"><h4 class="left" style="margin-left: 20px">SMB Menu</h4>');
   	//icons
   	var admIcons = "";
   	if(infos.admin)
   	{
   		admIcons = '<a class="material-icons waves-effect waves-teal btn-flat" href="menu_admin.pl" title="Admin">verified_user</a>';
   	}
   	
   	body.push('<div class="right barIcons">' + admIcons + '<a class="material-icons waves-effect waves-teal btn-flat" href="' + infos.toplinks.utility +'" title="Utility Functions">settings</a><a class="material-icons waves-effect waves-teal btn-flat" href="' + infos.toplinks.logout +'" title="Logout and Exit EMBs">exit_to_app</a></div>');
   	
   	body.push('</div>'); //close .row
   	//main collection
   	body.push('<div class="row"><div class="collection">');
   	
   	for(var board in infos.boards)
   	{
   		if(infos.boards.hasOwnProperty(board))
   		{
   			var obj = infos.boards[board];
   			var badge = "";
   			if(parseInt(obj.newc))
   			{
   				badge = '<span class="new badge">' + parseInt(obj.newc) + '</span>';
   			}
   			else if(obj.newc == "*")
   			{
   				badge = '<span class="badge">*</span>';
   			}
   			else
   			{
   				badge = '<span class="badge">' + parseInt(obj.all) + '</span>';
   			}
   			
   			body.push('<a href="'+ obj.href +'" class="collection-item">' + board + badge + '</a>');
		}
   	}
   	
   	body.push('</div></div>'); //close .collection then .row
   	
   	body.push('</div></div>'); //close .card.main then .parent
   	
   	
   	//put in the html
    $("body").html(body.join(""));
    $("body").removeAttr("bgcolor");
    $("body").removeAttr("oncontextmenu");

	//apply the styles
	$(".parent").css({
		"text-align": "center",
		"white-space": "nowrap",
		"width": "100%",
		"height": "100%"
	});
	
	$(".main").css({
		"display": "inline-block",
		"width": "500px",
		"vertical-align": "middle",
		"padding-top": "10px",
		"text-align": "left"
    });
    
	$(".row").css({
    	"margin-bottom": "5px"
    });
    
    $(".barIcons a").css({
		"padding": "5px",
		"margin-right": "10px"
    });
    
    $(".barIcons").css({
    	"margin": "1.14rem 10px 0.912rem"
    });
    
    var extracss = "<style>.parent:before {content: '';display: inline-block;height: 100%;vertical-align: middle;margin-right: -0.25em; /* Adjusts for spacing */}</style>";
    //credit https://css-tricks.com/centering-in-the-unknown/
    
    //inject css
    $("head").append(extracss);
	
    //show body
    $('body').fadeIn(1000);
}

function startError()
{
    var contents = $.trim($("body").text());
    
    if(/Invalid Login/gi.test(contents))
    {
    	currPage = "wrongidpw";
    	
    	//set title
		document.title = "Login Error";
		
		//style the body
		$("body").css({
			"background": colours.background,
			"display": "none"
		});
    	
    	//process info
   		var infos = grabData(currPage);
   		
   		var body = [];
   		
   		body.push('<div class="card main red darken-3">');
   		
   		body.push('<div class="card-content white-text">');
   		body.push('<span class="card-title">Error</span><p>There was an error logging in.<br>Please check your login credentials and try again.</p>');
   		body.push('</div>'); //close .card-content
   		
   		body.push('<div class="card-action">');
   		body.push('<a href="' + infos.link + '">Try Again</a>');
   		body.push('</div>'); //close .card-action
   		
   		body.push('</div>'); //close .card.main
   		
   		//put in the html
		$("body").html(body.join(""));
		$("body").removeAttr("bgcolor");
		$("body").removeAttr("oncontextmenu");
   		
   		//apply the styles
   		$(".main").css({
			"position": "absolute",
			"left": 0,
			"right": 0,
			"top": 0,
			"bottom": 0,
			"max-width": "500px",
			"max-height": "196px",
			"margin": "auto"
		});
   		
		//show body
    	$('body').fadeIn(1000);
    }
    else if(contents != "")
    {
    	currPage = "loginError";
    	
    	//set title
		document.title = "Login Error";
		
		//style the body
		$("body").css({
			"background": colours.background,
			"display": "none"
		});
    	
    	//process info
   		var infos = grabData(currPage);
   		
   		var body = [];
   		
   		body.push('<div class="card main red darken-3">');
   		
   		body.push('<div class="card-content white-text">');
   		body.push('<span class="card-title">Error</span><p>There was an error logging in. You probably didn\'t log out of your EMB.</p><p>Please logout and try again.</p>');
   		body.push('</div>'); //close .card-content
   		
   		body.push('<div class="card-action">');
   		body.push('<a href="' + infos.logout + '">Logout</a>');
   		body.push('</div>'); //close .card-action
   		
   		body.push('</div>'); //close .card.main
   		
   		//put in the html
		$("body").html(body.join(""));
		$("body").removeAttr("bgcolor");
		$("body").removeAttr("oncontextmenu");
   		
   		//apply the styles
   		$(".main").css({
			"position": "absolute",
			"left": 0,
			"right": 0,
			"top": 0,
			"bottom": 0,
			"max-width": "500px",
			"max-height": "220px",
			"margin": "auto"
		});
   		
		//show body
    	$('body').fadeIn(1000);
    }
}

function startUtil(smb)
{
	currPage = 'util';
    
    //set title
    document.title = "Utilities";
    
    //style the body
    $("body").css({
    	"background": colours.background,
    	"display": "none"
    });
    
    //process info
   	var infos = grabData(currPage);
   	
   	var body = [];
   	
   	body.push('<div class="parent"><div class="card main">');
   	
   	body.push('<div class="row">');
   	
   	//icon
   	if(document.referrer && !(/menu_htm\.pl/ig.test(document.referrer))) body.push('<div class="left barIcons"><a class="material-icons waves-effect waves-teal btn-flat" href="' + document.referrer +'" title="Utility Functions">arrow_back</a></div>');
   	//header
   	body.push('<h4 class="right" style="margin-right: 20px">Utility Menu</h4>');
   	
   	body.push('</div>'); //close .row
   	
   	
   	//main collection
   	body.push('<div class="row"><div class="collection">');
   	
   	var len = infos.links.length;
   	for(var i = 0; i < len; i++)
   	{   		
		var obj = infos.links[i];
		
		body.push('<a href="'+ obj.href +'" class="collection-item" title="' + obj.title + '">' + obj.title + '</a>');
   	}
   	
   	body.push('</div></div>'); //close .collection then .row
   	
   	body.push('</div></div>'); //close .card.main then .parent
   	
   	//put in the html
    $("body").html(body.join(""));
    $("body").removeAttr("bgcolor");
    
    //apply the styles
	$(".parent").css({
		"text-align": "center",
		"white-space": "nowrap",
		"width": "100%",
		"height": "100%"
	});
	
	$(".main").css({
		"display": "inline-block",
		"width": "500px",
		"vertical-align": "middle",
		"padding-top": "10px",
		"text-align": "left"
    });
    
    $(".barIcons a").css({
		"padding": "5px",
		"margin-left": "10px"
    });
    
    $(".barIcons").css({
    	"margin": "1.14rem 10px 0.912rem"
    });
    
    var extracss = "<style>.parent:before {content: '';display: inline-block;height: 100%;vertical-align: middle;margin-right: -0.25em; /* Adjusts for spacing */}</style>";
    //credit https://css-tricks.com/centering-in-the-unknown/
    
    //inject css
    $("head").append(extracss);
	
	//show body
	$('body').fadeIn(1000);
}

function startRoot()
{
	currPage = 'root';
    
    //set title
    document.title = "Welcome to EMBs";
    
    //style the body
    $("body").css({
    	"background": colours.background,
    	"display": "none"
    });
    
    //process info
   	var infos = grabData(currPage);
   	
   	var body = [];
   	
   	body.push('<div class="parent"><div class="card main">');
   	
   	body.push('<div class="row" style="margin-bottom: 10px;">');
   	
   	//header
   	body.push('<h4 class="left" style="margin-left: 20px">Choose EMB</h4>');
   	
   	body.push('</div>'); //close .row
   	
   	
   	//main collection
   	body.push('<div class="row"><div class="collection">');
   	
   	var len = infos.links.length;
   	for(var i = 0; i < len; i++)
   	{   		
		var obj = infos.links[i];
		
		body.push('<a href="'+ obj.href +'" class="collection-item" title="' + obj.title + '">' + obj.title + '</a>');
   	}
   	
   	body.push('</div></div>'); //close .collection then .row
   	
   	body.push('</div></div>'); //close .card.main then .parent
   	
   	//put in the html
    $("body").html(body.join(""));
    $("body").removeAttr("bgcolor");
    
    //apply the styles
	$(".parent").css({
		"text-align": "center",
		"white-space": "nowrap",
		"width": "100%",
		"height": "100%"
	});
	
	$(".main").css({
		"display": "inline-block",
		"width": "500px",
		"vertical-align": "middle",
		"padding-top": "10px",
		"text-align": "left"
    });
    
    var extracss = "<style>.parent:before {content: '';display: inline-block;height: 100%;vertical-align: middle;margin-right: -0.25em; /* Adjusts for spacing */}</style>";
    //credit https://css-tricks.com/centering-in-the-unknown/
    
    //inject css
    $("head").append(extracss);
	
	//show body
	$('body').fadeIn(1000);
}

function startMain(viewpl)
{
	console.log("Loading Main");
    currPage = 'main';
    
    //set title
    document.title = "Electronic Messaging Board";
    
    //style the body
    $("body").css({
    	"background": colours.background,
    	"display": "none"
    });
    
    $("html").prepend('<div class="progress' + (colours.loaderMain.main.length ? " " : "") + colours.loaderMain.main + '" id="loading" style="position: fixed; top: 0px; margin-top: 0px; z-index: 999	"><div class="indeterminate' + (colours.loaderMain.accent.length ? " " : "") + colours.loaderMain.accent + '"></div></div>');
    console.log("Loading bar OK");
    
    //Request Permission for notifications
	if (Notification.permission !== 'denied') {
		Notification.requestPermission();
	}
    
    //process info
    console.log("Grabbing Data");
   	var infos = grabData(currPage);
   	console.log("Data grabbed");
   	var body = [];
   	
   	//console.log(infos.error);
   	
   	//if it errored out
   	if(infos.error || infos.topbar.error)
   	{
   		//set title
		document.title = "Error";
   		
   		body.push('<div class="card main red darken-3">');
   		
   		body.push('<div class="card-content white-text">');
   		
   		var errorMsg = "";
   		
   		if(typeof(infos.errorReason) != "undefined")
   		{
   			errorMsg = " <i>(Error: ";
   			errorMsg += infos.errorReason.errorThrown;
   			errorMsg += ")</i>";
   		}
   		else if(typeof(infos.topbar.errorReason) != "undefined") //if there is an error in the first ajax, the second ajax wouldn't be called, because it will definitely be timed out
   		{
   			errorMsg = " <i>(Error: ";
   			errorMsg += infos.topbar.errorReason.errorThrown;
   			errorMsg += ")</i>";
   		}
   		//the above code is not extensively tested
   		
   		body.push('<span class="card-title">Error</span><p>There was an error retrieving the contents. There was probably a problem with EMB login.' + errorMsg + '</p><p>Please try logging in again.</p>');
   		body.push('</div>'); //close .card-content
   		
   		body.push('<div class="card-action">');
   		body.push('<a href="/">Return to Login</a>');
   		body.push('</div>'); //close .card-action
   		
   		body.push('</div>'); //close .card.main
   		
   		//put in the html
		$("body").html(body.join(""));
		$("body").removeAttr("bgcolor");
		$("body").removeAttr("oncontextmenu");
   		
   		//apply the styles
   		$(".main").css({
			"position": "absolute",
			"left": 0,
			"right": 0,
			"top": 0,
			"bottom": 0,
			"max-width": "500px",
			"max-height": "220px",
			"margin": "auto"
		});
   	}
   	else
   	{
   		console.log("Sorting Messages");
   		var sortedMessages = sortMessages(infos.messages); // or delta
   		console.log("Messages sorted");
   		
   		//add top bar

        //dropdown
        body.push('<ul id="extra" class="dropdown-content">');

        body.push('<li><a id="archive" href="' + infos.topbar.archive + '" title="View Archived Messages"><i class="material-icons unselectable">archive</i> <span>Archives</span></a></li>');
        body.push('<li><a id="utils" href="' + infos.topbar.util + '" title="Utility Functions"><i class="material-icons unselectable">settings</i> <span>Utilities</span></a></li>');
        if(typeof(infos.topbar.hciwebmail) != "undefined") body.push('<li><a id="hciwebmail" href="' + infos.topbar.hciwebmail + '" title="HCI Webmail"><i class="material-icons unselectable">email</i> <span>HCI Webmail</span></a></li>');
        body.push('<li><a id="logout" href="' + infos.topbar.logout + '" title="Logout and Exit EMBs"><i class="material-icons unselectable">exit_to_app</i> <span>Logout</span></a></li>');
        body.push('</ul>');
        //end dropdown
        
        //main navbar
   		body.push('<div class="navbar-fixed"><nav><div class="nav-wrapper'+ (colours.nav ? " " : "") + colours.nav +'">');
   		body.push('<a href="http://www.hci.edu.sg/" class="brand-logo unselectable" style="margin-left: 25px">Hwa Chong Institution</a>');
   		body.push('<ul class="right hide-on-med-and-down">');
		body.push('<li><a class="pointer" id="search" title="Search"><i class="material-icons unselectable">search</i></a></li>');
		body.push('<li><a class="pointer" id="refresh" title="Refresh"><i class="material-icons unselectable">refresh</i></a></li>');
        if(typeof(infos.topbar.post) != "undefined") body.push('<li><a id="post" href="' + infos.topbar.post + '" title="Post"><i class="material-icons unselectable">create</i></a></li>');

		if(infos.topbar.exit) body.push('<li><a id="otherBoards" href="' + infos.topbar.exit + '" title="Exit to Other Boards"><i class="material-icons unselectable">toc</i></a></li>');

        body.push('<li class="pointer unselectable"><a class="dropdown-button" data-activates="extra" title="More"><i class="material-icons right">more_vert</i></a></li>');

   		body.push('</ul></div></nav></div>');
   		console.log("Topbar OK");
        //end topbar
   		
   		//add refresh, util, logout
   		
   		//style="height:50px;"
   		body.push('<div class="row l12 main">');
   		
   		//messages
	   	body.push('<div class="card col l12 nopadding msgs">');
	   	
	   	body.push('<ul class="collection with-header" style="margin-top: 0px;">');
	   	console.log("open ul OK");
	   	
	   	body.push('<li class="collection-header"><h5 class="unselectable"><i class="material-icons">announcement</i> Important Messages</h5></li>');
	   	console.log("starting for loop");
	   	for(var type in sortedMessages)
	   	{
	   		if(sortedMessages.hasOwnProperty(type))
	   		{
	   			console.log("Reading", type);
	   			if(type == "normalUnread") 
	   			{
	   				console.log("in the if loop");
	   				console.log(sortedMessages.imptUnread.length, sortedMessages.impt.length);
	   				console.log(!(sortedMessages.imptUnread.length + sortedMessages.impt.length));
	   				if(!(sortedMessages.imptUnread.length + sortedMessages.impt.length))
	   				{
	   					console.log("No new messages");
	   					body.push('<li class="collection-item impt nonewmessages unselectable defaultCursor"><p class="center">&mdash; No new messages &mdash;</p></li>');
	   					console.log("pushed");
	   				}
	   				body.push('<li class="collection-header"><h5 class="unselectable"><i class="material-icons">chat</i> Normal Messages</h5></li>');
	   				console.log("Normal Messages header added");
   				}
	   			body.push('<div id="' + type + '">');
	   			var m = sortedMessages[type];
	   			console.log(m);
				for (var i = 0, len = m.length; i < len; i++) 
			   	{
			   		console.log("Message", i);
			   		var msge = m[i];
			   		body.push(printMessage(type, msge));
				}
				console.log("for loop done");
				if(type == "normal") 
	   			{
	   				console.log("Type is normal. checking whether there were no messages");
	   				if(!(sortedMessages.normalUnread.length + sortedMessages.normal.length))
	   				{
	   					body.push('<li class="collection-item normal nonewmessages unselectable defaultCursor"><p class="center">&mdash; No new messages &mdash;</p></li>');
	   				}
   				}
				body.push("</div>");
				console.log(type, "OK");
			}
	   	}
	   	
	   	//make a div that is clickable and handle everything later
	   	//to read http://messages.hci.edu.sg/cgi-bin/emb/update.pl
	   	
	   	body.push('</ul>'); //close .collection
	   	body.push('</div>'); //close messages
	   	
	   	//content panel
	   	body.push('<div class="card col nopadding cnt hidden">');
	   	body.push('</div>'); //close .cnt
	   	
	   	body.push('</div>'); //close .row.s12
	   	
	   	//footer
	   	body.push('<footer class="page-footer unselectable'+ (colours.footer ? " " : "") + colours.footer +'">');
   		body.push('<div class="footer-copyright"><div class="container">Login Count: ' + infos.topbar.loginCount 
					+ ' , Last: ' + infos.topbar.lastlogin.year 
					+ '-' + (infos.topbar.lastlogin.month < 10 ? '0' : '') + infos.topbar.lastlogin.month
					+ '-' + (infos.topbar.lastlogin.day < 10 ? '0' : '') + infos.topbar.lastlogin.day
					+ ' ' + (infos.topbar.lastlogin.hour < 10 ? '0' : '') + infos.topbar.lastlogin.hour
					+ ':' + (infos.topbar.lastlogin.minutes < 10 ? '0' : '') + infos.topbar.lastlogin.minutes
                    + ((infos.posted > 0) ? ('<span class="center messagesposted defaultCursor noPointerEvents">' + infos.posted + ' message' + ((infos.posted > 1) ? "s" : "") + ' ' + ((infos.posted > 1) ? "were" : "was") + ' posted today.</span>') : '<span class="center messagesposted defaultCursor noPointerEvents">No messages were posted today.</span>')
					+'<a class="grey-text text-lighten-4 right pointer" href="' + infos.topbar.help + '" title="EMB Help">EMB Help</a></div></div>');
	   	body.push('</footer>');
	   	
	   	//extracss
	   	var extraCSS = [];
	   	extraCSS.push('<style>');
        //header
        extraCSS.push(".nav-wrapper .dropdown-button i {margin-left: 0px;}");
        //extraCSS.push(".nav-wrapper .dropdown-button span {font-size: 1.1em;}");
        //extraCSS.push(".nav-wrapper ul.dropdown-content {margin-left: -20px;}");
        extraCSS.push(".nav-wrapper ul.dropdown-content li {text-align: center;}");
        extraCSS.push(".nav-wrapper ul.dropdown-content li span {font-size: 0.7em;}");

        //content general
	   	extraCSS.push('p.center{text-align:center;} ');
	   	extraCSS.push('.mark{opacity: 0.5; -webkit-transition: all 600ms ease-in-out; transition: all 600ms ease-in-out; } '); //cubic-bezier(0.165, 0.84, 0.44, 1);
	   	extraCSS.push('.mark.activated {opacity: 1; } ');
	   	extraCSS.push('.mark:hover {cursor: pointer; opacity:1; } ');
	   	extraCSS.push('.mark.activated:hover {opacity: 0.5;} ');
	   	extraCSS.push('#refresh {transition: all 0.5s ease-in-out;} ');
	   	extraCSS.push('.spin{-moz-animation: spin 1.7s infinite linear;-webkit-animation: spin 1.7s infinite linear; animation: spin 1.7s infinite linear;} ');
	   	extraCSS.push('.spin.faster{-moz-animation: spin 0.5s infinite linear;-webkit-animation: spin 0.5s infinite linear;animation: spin 0.5s infinite linear;} ');
	   	extraCSS.push('@-moz-keyframes spin {0% {-moz-transform: rotate(0deg);} 100% {-moz-transform: rotate(360deg);}; } @-webkit-keyframes spin {0% {-moz-transform: rotate(0deg);} 100% {-moz-transform: rotate(360deg);}; } ');
	   	//spin credit: http://www.alessioatzeni.com/blog/css3-loading-animation-loop/
	   	
	   	//.collection-itom.avatar (:hover)
	   	//.collection-header .material-icons
	   	//.collection-header
	   	extraCSS.push(".asyncerror{color:red; opacity: 0.7 !important;} ");
	   	extraCSS.push(".asyncerror:hover {opacity: 1 !important;} ");
	   	extraCSS.push(".collection-item.avatar{cursor:pointer; transition: all 0.4s ease-in-out;} "); //cubic-bezier(0.165, 0.84, 0.44, 1)
	   	extraCSS.push(".collection-item.avatar:hover{ background-color: #ccc; } ");
	   	extraCSS.push(".collection .collection-item {padding-right: 50px;} ");
	   	extraCSS.push(".collection-header .material-icons { margin-right: 10px; } ");
	   	extraCSS.push(".collection-header {cursor: default;} ");
        extraCSS.push(".collection-item.avatar p { color: #777; }");
	   	extraCSS.push(".collection #imptUnread .collection-item:last-child, .collection #normalUnread .collection-item:last-child{border-bottom: 1px solid #E0E0E0;}");
        extraCSS.push(".avt {display: inline-block; text-align: center; font-size: 22px; line-height: 42px; vertical-align: middle;}");
	   	extraCSS.push(".avt.selected{background-color: #999999 !important; transform: rotatey(180deg);} ");
	   	extraCSS.push(".collection-item.avatar.selected{background-color: #ddd !important;} ");
	   	extraCSS.push(".avt{transition: all 0.2s linear;} ");
	   	extraCSS.push(".queuing {height: 0px;} ");
        extraCSS.push(".unread {font-weight: bold;} ");
	   	extraCSS.push(".nopadding {padding: 0px !important;} ");
	   	extraCSS.push(".nonewmessages {transition: all 0.5s ease;} ");
	   	extraCSS.push(".nonewmessages p {margin: 0px} ");
	   	//.notif{transition: all 0.2s ease; opacity: 1; } .notif:hover{opacity: 0.5 !important;}
	   	
	   	//content
	   	extraCSS.push(".main {position: relative; margin: 20px 30px 0px 30px;}");
	   	extraCSS.push(".msgs {transition: all 0.3s ease-in-out;}"); //0.55s cubic-bezier(0.19, 1, 0.22, 1);}
	   	extraCSS.push(".cnt {transition: all 0.25s ease-in-out; position: fixed; margin: 0.5rem 0px 1rem 20px; width: calc(66.6667% - 90px); top: calc(64px + 20px); bottom: calc(" + settings.footer.height + " + " + settings.footer.padding +" + " + settings.footer.padding + " + " + settings.footer.margin + "); right: 50px;} "); //0.5s cubic-bezier(0.19, 1, 0.22, 1);
	   	extraCSS.push(".cnt.hidden {width: 0px; box-shadow: none;}");
	   	extraCSS.push(".cnt .row{transition: all 2s ease-in-out; opacity: 1; height: auto; position: relative;}"); //cubic-bezier(0.19, 1, 0.22, 1)
	   	extraCSS.push(".cnt .row.hidden{opacity: 0; height: 0px;}");
	   	extraCSS.push(".cnt .avt {height: 42px; display: inline-block; width: 42px; text-align: center; line-height: 42px; font-size: 22px; position: absolute; left: 20px; top: 20px;}");
        extraCSS.push(".cnt .cntcenter {margin-top: 0px;}");
	   	extraCSS.push(".msgcontent {overflow-y: auto; height: calc(100% - " + settings.footer.height + " - " + settings.footer.padding + " - " + settings.footer.padding + " - " + settings.footer.margin + " - 45px - 35px) !important;}"); //originally 5px
        extraCSS.push(".msgcontent .cntwrapper {height: 100%; padding: 20px 20px 0px 20px;}");
        extraCSS.push(".msgcontent .cntwrapper a:hover {text-decoration: underline;}");
        extraCSS.push(".msgcontent .cntwrapper .attachments a:hover {text-decoration: none;}");
        extraCSS.push(".msgHeader {margin-bottom: 0px;}");
        extraCSS.push(".msgdate {color: #777;}")
	   	extraCSS.push(".msgHeaderContent{padding: 10px 20px 20px 82px;}");
	   	extraCSS.push(".msgHeaderTitle {font-size: 1.5em; margin-top: 5px; display: inline-block;}");
	   	extraCSS.push(".msgHeaderContent p {margin: 0px;}");
	   	extraCSS.push(".msgHeaderContent {border-bottom: 1px dashed #888;}");
        extraCSS.push(".padding {height: 0px; margin-top: 10px;}");
        extraCSS.push(".attachborder {height: 0px; border-top: 1px dashed #888; margin: 20px 0px;}");
        extraCSS.push(".attachmentsHeader {margin-bottom: 1rem;}")
        extraCSS.push(".attachments {margin-bottom: 30px;}");
        extraCSS.push(".attach {background-color: #CDCDCD; padding: 10px; display: inline-block; width: calc(25% - 10px); margin-right: 10px; height: 110px; position: relative; transition: all 0.2s ease-in-out;}");
        extraCSS.push(".attach:hover {background-color: #AAA;}");
        extraCSS.push(".attachTitle {color: black; height: calc(100% - 32px); margin-bottom: 10px;}");
        extraCSS.push(".attachSize {color: #444; display: block; line-height: 32px; margin-top: 10px; bottom: 10px; position: absolute; width: calc(100% - 20px);}");
        extraCSS.push(".attachSize img {right: 5px; height: 32px; width: 32px; position: absolute;}");
        extraCSS.push(".choicesRadioOption {display: inline-block; padding-right: 10px; padding-bottom: 5px; border-bottom: 1px solid #ccc;}");
	   	
	   	//footer
	   	extraCSS.push("footer a:hover {text-decoration: underline; } ");
        extraCSS.push("footer.page-footer {font-weight: 400 !important; padding: " + settings.footer.padding + " 0px; margin-top: " + settings.footer.margin + ";}");
        extraCSS.push("footer.page-footer .footer-copyright {height: " + settings.footer.height + "; line-height: " + settings.footer.height + ";} ");
        extraCSS.push("footer .messagesposted {position: absolute; left: 0px; right: 0px;}");
	   	
	   	extraCSS.push("</style>");
	   	
	   	//put in the html
		$("body").html(body.join(""));
		$("body").removeAttr("bgcolor");
		$("body").removeAttr("oncontextmenu");
		$("head").append(extraCSS.join(""));
		
        //initialize javascripts
        $(".dropdown-button").dropdown();

		//apply the styles
		/*$(".main").css({
			"margin": "20px 50px"
		});*/
	
		//add eventHandlers
		$("#refresh").click(function(e) {
			if(!$(this).hasClass("spin"))
			{
				$(this).addClass("spin faster");
				refreshMessages("view", true);
			}
		});
		
		initializeMessages();
		
		$("#search").click(function(e){
			//add search here !!!!!
			//ajax search results (do all)
			//if not in result apply class queuing
			//rememeber to add a :before element that is the min height of the .cnt
		});
	
		//make a timer to do ajax every 2 minute(s)	for updates
		globalTimer = setInterval(function(){ refreshMessages("view", false) }, 120000);
		
	}
	
	//show body
	$('body').fadeIn(1000, function(){
		lastUpdated = infos.timestamp;
		$("#loading").fadeOut(500);
	});
}

function initializeMessages()
{
    $(".avt").off("click");
    $(".collection-item").off("click");
    $(".mark").off("click");

    $(".avt").click(function(e) {
        //some shit happens here for selecting
        if($(this).hasClass("selected"))
        {
            var uid = this.dataset.msgid;
            selectedMessages = selectedMessages.filter(function( obj ) {
                return obj.uid != uid;
            });
            //credit https://stackoverflow.com/questions/15287865/remove-array-element-based-on-object-property#15287938
            $(this).removeClass("selected");
            $(this).closest("li").removeClass("selected");
            $(this).html(this.dataset.letter);
        }
        else
        {
            var obj = $.parseJSON(he.decode($(this).closest("li")[0].dataset.obj));
            selectedMessages.push(obj);
            $(this).addClass("selected");
            $(this).closest("li").addClass("selected");
            $(this).html('<i style="line-height: 42px; transform: rotatey(180deg)" class="material-icons">check</i>');
        }
        //console.log("selected", selectedMessages);
        e.stopPropagation();
    });
    
    $(".collection-item").click(function(e) {
    
        //check not selected
        if(!$(this).hasClass("selected"))
        {
            var msgobj = $.parseJSON(he.decode(this.dataset.obj));
            if(!currentMessage)
            {
                currentMessage = msgobj;                
                $(".msgs").removeClass("l12").addClass("l4");
                $(".cnt").removeClass("hidden");
                fetchMessage(currentMessage);
                $(".cnt").on('transitionend webkitTransitionEnd oTransitionEnd otransitionend MSTransitionEnd', function() {
                    sscroll("#msg_" + currentMessage.uid);
                });
            }
            else
            {
                if(currentMessage.uid == msgobj.uid)
                {
                    $(".msgs").removeClass("l4").addClass("l12");
                    $(".cnt").addClass("hidden");
                    currentMessage = false;
                }
                else
                {
                    //change message
                    //===================================ISSUES HERE========================================
                    currentMessage = msgobj;
                    fetchMessage(currentMessage);
                    sscroll("#msg_" + currentMessage.uid);
                }
            }
        }
        else
        {
            console.log("Messaage is selected");
        }
    });
    
    
    $(".mark").click(function(e){
        //$(this).html('<div class="preloader-wrapper active" style="height: ' + $(this).height() + '"><div class="spinner-layer spinner-blue-only"><div class="circle-clipper left"><div class="circle"></div></div><div class="gap-patch"><div class="circle"></div></div><div class="circle-clipper right"><div class="circle"></div></div></div></div>');
        var ele = this;
        var currentlyMarked = $(ele).hasClass("activated");
        if($(ele).hasClass("asyncError"))
        {
            $(ele).removeClass("asyncError");
        }
        $(ele).html("filter_tilt_shift");
        $(ele).addClass("spin");
    
        //do ajax to mark message
        var jqxhr = $.ajax({
            url: "/cgi-bin/emb/choice.pl?view.pl?date??",
            method: "POST", 
            data: { 
                'msgid': ele.dataset.msgid,
                //'choice': "Back/Submit",
                'attn': ( currentlyMarked ? "B" : "A" ) /*A is yes, B is no*/
            }
        }).done(function(res, textStatus, jqXHR){
            //console.log(textStatus);
            $(ele).removeClass("spin");
    
            if(currentlyMarked) 
            {
                $(ele).html("star_border");
                $(ele).removeClass("activated");
            }
            else
            {
                $(ele).html("star");
                $(ele).addClass("activated");
            }

            var obj = $.parseJSON(he.decode($("#msg_" + ele.dataset.msgid).dataset.obj));
            obj.marked = !obj.marked;
            $("#msg_" + ele.dataset.msgid).dataset.obj = he.encode(JSON.stringify(msgobj), {'useNamedReferences': true});

        }).fail(function(jqXHR, textStatus, errorThrown) {
            //console.log(textStatus);
            $(ele).removeClass("spin");
            
            $(ele).html("warning");
            $(ele).addClass("asyncError");
        })
        .always(function() {});
        
        e.stopPropagation();
    });
}

function init()
{
    var page = getPage();
    var page1 = page.split(' ')[1];
    var page2 = page.split(' ')[0];
    var attachType = (/\/(attach)\//.test(window.location.toString())) || (/\.(png|jpe?g|gif|tiff?)/gi.test(window.location.toString()));
    
    if(window.location.pathname == "/")
    {
    	addMaterial();
    	startRoot();
	}
    else
    {
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
		    	$("html").html("<head></head><body></body>");
		    	addMaterial();
		        startMain(0);
		        break;
		    case 'smbmenu.pl':
		    	addMaterial();
		        startMenu(0);
		        break;
			case 'embview_archive.pl':
				addMaterial();
				startArchive();
				break;
		    case 'embview.pl':
		    	$("html").html("<head></head><body></body>");
		    	addMaterial();
		        startMain(1);
		        break;
		    case 'smblogin.pl':
		    	addMaterial();
		        startError();
		        break;
		    case 'emblogin.pl':
		    	addMaterial();
		        startError();
		        break;
		    /*case "embmenu_htm.pl":
		    	redirect("main");
		    	break;*/
		    case "smbmenu_util.pl":
		    	addMaterial();
		    	startUtil(1);
		    	break;
			case "embutil.pl":
				addMaterial();
				startUtil(0);
				break;
		    default:
		        if(page1=='smb' || page1=='emb')
		        {
		           	if(attachType) materialize = false;
		           	else if(page1 == page2) 
		           	{
		           		materialize = false;
		           		if(window.location.pathname == "/emb/")
		           		{
		           			window.location.href = "/";
		           			/*if(!localStorage.link)
							{
								window.location.href = '/smb/college_student/';
							}
							else
							{
								window.location.href = localStorage.link;
							}*/
		           		}
		       		}
		           	else 
		           	{
				       	addMaterial();
				       	startLogin();
			       	}
		        }
		        else materialize = false;
		        break;
		}
    }
    //runAfterLoad();
}

function addMaterial()
{
	var materialCSS = [];

    materialCSS.push('<link type="image/x-icon" href="http://www.hci.edu.sg/favicon.ico" rel="icon">');
    materialCSS.push('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/materialize/0.97.0/css/materialize.min.css">');
    materialCSS.push('<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">');

    materialCSS.push('<style>');

    materialCSS.push('@media only screen and (max-width:1366px) { html{zoom: 90%;} } ');
    materialCSS.push('.unselectable{-webkit-user-select: none;-moz-user-select: none;-ms-user-select: none;user-select: none;} ');
    materialCSS.push('.pointer{cursor: pointer;} ');
    materialCSS.push('.defaultCursor{cursor: default;} ');
    materialCSS.push('.grabbable:hover{cursor: grab;} ');
    materialCSS.push('.grabbable:active{cursor: grabbing;} ');
    materialCSS.push('.noPointerEvents {pointer-events: none;}');

    materialCSS.push('</style>');

    //var toastCSS = '<style>@media only screen and (min-width : 601px) and (max-width : 1260px) {.toast {width: 100%;border-radius: 0;} }@media only screen and (min-width : 1261px) {.toast {width: 100%;border-radius: 0; } }@media only screen and (min-width : 601px) and (max-width : 1260px) {#toast-container {min-width: 100%;bottom: 0%;top: 90%;right: 0%;left: 0%;} }@media only screen and (min-width : 1261px) {#toast-container {min-width: 100%;bottom: 0%;top: 90%;right: 0%;left: 0%; } } .toasted {margin: 0px 20px; width:calc(100% - 40px); position: fixed;}</style>';

	$("head").append(materialCSS.join("")); //.append(toastCSS);
}

//Other functions
function fetchMessage(msgobj)
{
	console.log(msgobj);
	$(".cnt .row").addClass("hidden");
	//$(".cnt").html("");
	//put in loading
    $(".cnt").html('<div class="progress' + (colours.loaderSecondary.main.length ? " " : "") + colours.loaderSecondary.main + ' cntcenter" id="msgloader"><div class="indeterminate' + (colours.loaderSecondary.accent.length ? " " : "") + colours.loaderSecondary.accent + '"></div></div>');
	
    retrieving = true;
    
    //settle where to grep from
    //defaults to grepping from view
    
    //obtaining the data
    console.log(msgobj.href);
    var jqxhr = $.ajax({
        url: msgobj.href,
        dataType: "html",
        method: "GET", 
        async: false
    }).done(function(data){
        var response = $('<html />').html(data);
        //credit https://stackoverflow.com/questions/405409/use-jquery-selectors-on-ajax-loaded-html#7831229
        var needResponse = false;
        var recordedResponses = false;
        var error = false;
        error = /No such file or directory\)/gi.test(response.find("body").text());
        
        if(!error)
        {
            //if successful
            //remove stuff and obtain data by traversing through content
            var attachments = [];
            response.find("hr").remove();
            response.find("font:lt(2)").remove();
            response.find("p:first-child").css("margin-top", "0px");
            //extract bottom form
            needResponse = (response.find("form [name=choice]").length > 1);
            if(needResponse)
            {
                var c = response.find("form [name=choice]:checked");
                recordedResponses = {
                    "choice" : (c.length ? c.val() : false),
                    "remark" : response.find("form [name=remark]").val()
                };
            }
            response.find("form").remove();
            response.find("font[color=red]:contains('Attachments')").nextAll("a").each(function(idx){
                var attachobj = {};
                attachobj.href = $(this).attr("href");
                var x = $.trim($(this).text()).split(" - ");
                attachobj.index = parseInt(x.shift().split(" ")[1]);
                attachobj.name = x.join(" - ");
                if(!($.trim(attachobj.name).length)) attachobj.name = "<i>Attach "+ attachobj.index +"</i>";
                attachobj.type = attachobj.href.split(".").slice(-1).pop();
                attachobj.size = $(this).next("font").text().replace(/(\(|\))/gi, "");
                attachments.push(attachobj);
            });
            response.find("font[color=red]:contains('Attachments')").nextAll().remove();
            response.find("font[color=red]:contains('Attachments')").remove();
            while($.trim(response.find("div *:not(img, p br):last").html()) == "")
            {
                response.find("div *:not(img, p br):last").remove();
            }
            //response.find("div *").each(function(id){});
            var messageContent = response.find("div").html();

            var head = [];
            //replace certain msgobj properties accordingly (bzw. title, attention, update, viewcount, viewlink)
            //add in date and other relevant informations !!!!!
            head.push('<div class="row msgheader hidden">');
            head.push('<span class="circle avt unselectable defaultCursor" style="background-color: ' + getColourfromText(msgobj.abbrname) + '; color: white">'+ msgobj.abbrname[0].toUpperCase() +'</span>');
            head.push('<div class="msgHeaderContent"><span class="msgHeaderTitle">' + msgobj.title + '</span>');
            head.push('<p>From: ' + msgobj.fullname + '<span class="msgdate"> / ' + msgobj.date + '</span><br>To: ' + msgobj.attention + '</p>');
            head.push("</div>"); //close .msgHeaderContent
            head.push('</div>'); //close .msgheader
            
            var body = [];
            body.push('<div class="row msgcontent hidden">');
            body.push('<div class="cntwrapper">');
            body.push(messageContent);

            //attachments
            if(attachments.length)
            {
                body.push("<div class='attachborder'></div>");
                body.push('<h5 class="attachmentsHeader unselectable defaultCursor">Attachments</h5>');
                body.push('<div class="attachments unselectable">');
                for(var i = 0, len = attachments.length; i < len; i++)
                {
                    var a = attachments[i]
                    //might want to add download attribute (download="filename")
                    body.push('<a class="attach" id="attach_' + a.index + '" title="' + a.name +"." + a.type + '" href="' + a.href + '" target="_blank">');
                    body.push("<div class='attachTitle'><span>" + a.name + "</span></div>");
                    body.push("<span class='attachSize'>" + a.size + "<img src='"+ retImg(a.type) +"'></span>");
                    body.push('</a>'); //close .attach
                }
                body.push('</div>'); //close .attachments
            }
            else
            {
                body.push("<div class='padding'></div>");
            }

            if(needResponse)
            {
                //generate the form for response
                //generate the options A thru E
                body.push("<div class='attachborder'></div>");
                body.push('<div class="row">');
                body.push('<form id="choiceForm" class="col s8">');
                for(var i = 0; i < 5; i++)
                {
                    var letter = String.fromCharCode(65 + i); //obtains A thru E
                    body.push('<div class="choicesRadioOption">');
                    body.push('<input name="choice" type="radio" id="choice_'+ letter +'" value="' + letter + '" ' + ((recordedResponses.choice == letter) ? "checked" : "") + '/>'); //class="with-gap"
                    body.push('<label for="choice_' + letter + '">' + letter + '</label>');
                    body.push('</div>');
                }

                //adds option to reset
                body.push('<div class="choicesRadioOption">');
                body.push('<input name="choice" type="radio" id="choice_'+ 'indeterminate' +'" value="' + 0 + '" ' + ((!recordedResponses.choice) ? "checked" : "") + '/>'); //class="with-gap"
                body.push('<label for="choice_' + 'indeterminate' + '">' + "No Choice" + '</label>');
                body.push('</div>');

                body.push('<div class="input-field">');
                body.push('<textarea id="remark" name="remark" class="materialize-textarea">' + recordedResponses.remark +'</textarea>');
                body.push('<label for="textarea1" class="unselectable defaultCursor noPointerEvents">Response Box</label>');
                body.push('</div>'); //close .input-field
                body.push('<button class="btn waves-effect waves-light" type="submit" name="action">Submit</button>');
                body.push("</form>");
                body.push('</div>');

                //body.push("<div class='padding'></div>");
            }
            //else if(attachments.length) body.push("<div class='padding'></div>");

            body.push('</div>'); //close .cntwrapper
            body.push('</div>'); //close .msgcontent
            
            if(!msgobj.read)
            {
                msgobj.read = true;
                $("#msg_" + msgobj.uid + " .title").removeClass("unread");
                $("#msg_" + msgobj.uid).attr("data-obj", he.encode(JSON.stringify(msgobj), {'useNamedReferences': true}));
            }
            $(".cnt").html(head.join("") + body.join(""));
            $(".row.hidden").removeClass("hidden");
            $(".attachTitle").dotdotdot({
                ellipsis : '... ',
                wrap : 'word',
                fallbackToLetter:  true,
                after : null,
                watch : false,
                height : null,
                tolerance : 0,
                callback : function( isTruncated, orgContent ) {},
                lastCharacter   : {
                    /*  Remove these characters from the end of the truncated text. */
                    remove: [ ' ', ',', ';', '.', '!', '?' ],
                    /*  Don't add an ellipsis if this array contains 
                    the last character of the truncated text. */
                    noEllipsis: []
                }
            });
            $("#choiceForm").on('submit', function(e){
                var latestObject = $.parseJSON(he.decode($("#msg_" + msgobj.uid).attr("data-obj")));
                var attn = latestObject.marked ? "A" : "B"; //"A" is yes, "B" is no
                var data = $(this).serialize().split("&");
                var dataObj = {
                    "msgid": msgobj.uid,
                    "attn" : attn
                };
                //black magic way to get all the form values for submission
                for(var i = 0, len = data.length; i < len; i++)
                {
                    var x = data[i].split("=");
                    dataObj[x[0]] = x[1];
                }

                //check if indeterminate is chosen
                if(!dataObj.choice) 
                {
                    if(recordedResponses.choice) dataObj.choice = "";
                    else delete dataObj["choice"];
                }

                //perform some black magic to submit
                var jqxhr = $.ajax({
                    url: "/cgi-bin/emb/choice.pl?view.pl?date??",
                    method: "POST", 
                    data: dataObj
                }).done(function(res, textStatus, jqXHR){
                    toast("Response Submitted!");
                }).fail(function(jqXHR, textStatus, errorThrown) {
                    err("Error Occured! (" + errorThrown + ")");
                })
                .always(function() {});

                console.log(dataObj);
                e.stopPropagation();
                e.preventDefault();
            });
            $("#msgloader").remove();
        }
        
    }).fail(function(jqXHR, textStatus, errorThrown) { 
        /*show error*/
        // TO DO !!!!!
        err("Error: " + errorThrown);
    }).always(function() {});
    
    retrieving = false;
}

function retImg(type)
{
    var url = ""
    if(browsername() == "firefox")
    {
        return "moz-icon://." + type + "?size=32";
    }
    else
    {
        url = "//ssl.gstatic.com/docs/doclist/images/mediatype/icon_1_";

        if(/pdf/gi.test(type)) url += "pdf";
        else if(/doc/gi.test(type)) url += "word";
        else if(/xls/gi.test(type)) url += "excel";
        else if(/(jpe?g|tif+|gif|bmp|png)/gi.test(type)) url += "image";
        else if(/ppt/gi.test(type)) url += "powerpoint";
        else if(/(zip|rar|7z)/gi.test(type)) url += "archive";
        else if(/(mp3|wa?v|m4a|aif+|aac|og(g|a)|wma|vox)/.test(type)) url += "audio";
        else if(/(mp4|mpe?g|m4v|webm|mkv|flv|vob|ogv|avi|mov|wmv)/.test(type)) url += "video";
        //add more in time to come *****

        url += "_x32.png";
    }
    return url;
}

function browsername()
{
    var isOpera = !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
    // Opera 8.0+ (UA detection to detect Blink/v8-powered Opera)
    var isFirefox = typeof InstallTrigger !== 'undefined';   // Firefox 1.0+
    var isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;
        // At least Safari 3+: "[object HTMLElementConstructor]"
    var isChrome = !!window.chrome && !isOpera;              // Chrome 1+
    var isIE = /*@cc_on!@*/false || !!document.documentMode; // At least IE6
    //does not detect Edge

    //credits: http://stackoverflow.com/questions/9847580/how-to-detect-safari-chrome-ie-firefox-and-opera-browser#9851769

    if(isOpera) return "opera";
    else if(isFirefox) return "firefox";
    else if(isSafari) return "safari";
    else if(isChrome) return "chrome";
    else if(isIE) return "ie";
}

function refreshMessages(page, manual, options)
{
	if(!retrieving)
	{
		var opt = $.extend({
			"date": false
		}, options);
		
		var newMessages = getMessages(page, opt);
		var delta = newMessages.delta;
		
		if(manual)
		{
			if(page == "view")
			{
				var messages = sortMessages(delta);
				
				if(delta.length > 0)
				{
					//adding messages
					for(var type in messages)
				   	{
				   		if(messages.hasOwnProperty(type))
				   		{
				   			var toBeAdded = [];
				   			var m = messages[type];
							for (var i = 0, len = m.length; i < len; i++) 
						   	{
						   		var msge = m[i];
						   		toBeAdded.push(printMessage(type, msge, true));
							}
							$("#" + type).prepend(toBeAdded.join(""));
						}
				   	}
                    initializeMessages();

				   	if(($(".queuing.msg_imptUnread").length + $(".queuing.msg_impt").length) && $(".impt.nonewmessages").length)
				   	{
				   		$(".impt.nonewmessages").css("height", "0px").remove();
				   	}
				   	if(($(".queuing.msg_normalUnread").length + $(".queuing.msg_normal").length) && $(".normal.nonewmessages").length)
				   	{
				   		$(".normal.nonewmessages").css("height", "0px").remove();
				   	}
					$(".queuing").removeClass("queuing");
				}
				else
				{
					console.log("No new messages");
                    toast("No new messages!&nbsp;&nbsp;^_^", 2000);
				}
				$("#refresh").removeClass("spin faster");
			}
		}
		else
		{
			if(page == "view")
			{
				var messages = sortMessages(delta);
				//adding messages
				for(var type in messages)
			   	{
			   		if(messages.hasOwnProperty(type))
			   		{
			   			var toBeAdded = [];
			   			var m = messages[type];
						for (var i = 0, len = m.length; i < len; i++) 
					   	{
					   		var msge = m[i];
					   		toBeAdded.push(printMessage(type, msge, true));
						}
						$("#" + type).prepend(toBeAdded.join(""));
					}
			   	}

                initializeMessages();
			   	
			   	if(delta.length > 0)
			   	{
			   		//yay there are new messages
			   		//add code to show tooltip !!!!!
			   		
		   			//show notif if window is not in focus and there are new messages
			   		if(!windowFocus)
			   		{
			   			//content, title, img, in order of necessity
			   			var x = notify("You have " + delta.length + " new messages, of which " + messages.imptUnread.length + " are important", "New EMB Messages", "/smb/hci.png"); 
			   			x.onclick = function()
			   			{
			   				$(window).focus(); 
			   				refreshMessages(page, true, opt);
		   				}
			   		}
			   		else
			   		{
			   			//show a toast !!!!!
			   			
			   			toast(delta.length + ' New Messages.<br>Click <i class="material-icons">refresh</i> to refresh.', 3000);
			   			//Materialize.toast("5 New Messages. Click&nbsp;<i class='material-icons'>refresh</i>&nbsp;to refresh.", 3000, "rounded unselectable grabbable notif");
						//Materialize.toast('I am a toast!', 3000, 'rounded');
						//$(".notif").forwardevents();
			   		}
			   	}
			   	else
			   	{
			   		console.log("No new messages");
			   	}
			}
		}
	}
}

function printMessage(type, msg, queuing)
{
	var ret = [];
	ret.push('<li class="collection-item avatar unselectable msg_' + type + (queuing ? " queuing" : "") + '" data-obj="' + he.encode(JSON.stringify(msg), {'useNamedReferences': true}) + '" data-msgid="' + msg.uid + '" id="msg_' + msg.uid + '">');
	ret.push('<span class="circle avt unselectable" style="background-color: ' + getColourfromText(msg.abbrname) + '; color: white" data-msgid="' + msg.uid + '" data-letter="' + msg.abbrname[0].toUpperCase() + '">'+ msg.abbrname[0].toUpperCase() +'</span>');
	
	ret.push('<span class="title' + ((/unread/gi.test(type)) ? ' unread' : '') + '">' + msg.title + '</span>');
	
	ret.push('<p>From: ' + msg.fullname + '<br>To: ' + msg.attention + '</p>');
	ret.push('<span class="secondary-content"><i class="material-icons mark' + (!!(msg.marked) ? " activated" : "") + '" data-msgid="' + msg.uid + '">' + (!!(msg.marked) ? "star" : "star_border") + '</i></span>');
	ret.push('</li>');

	return ret.join("");
}

function sortMessages(messageArray)
{
	var len = messageArray.length;
	var messages = {
		"imptUnread": [],
		"impt": [],
		"normalUnread": [],
		"normal": []
	};
	for(var i = 0; i < len; i++)
	{
		var message = messageArray[i];
		if(message.priority && !message.read) messages["imptUnread"].push(message);
		else if (message.priority) messages["impt"].push(message);
		else if (!message.read) messages["normalUnread"].push(message);
		else messages["normal"].push(message);
	}
	return messages;
}
function getMessages(page, options)
{
	retrieving = true;
	
	var opt = $.extend({
		"date" : false,
		"async": false, 
		"callback": null
	}, options);
	
	//settle where to grep from
	//defaults to grepping from view
	var pageurl = "/cgi-bin/emb/view.pl";
	var view = true; 
	
	if(page == "archive")
	{
		view = false;
		pageurl = "/cgi-bin/emb/view_archive.pl";
	}
	//else if(page == "view") {} //doesn't change from default
	
	if(opt.date) pageurl += "?date=" + date;
	
	
	//obtaining the data
	var retu = {};
	
	var jqxhr = $.ajax({
		url: pageurl,
		dataType: "html",
		method: "GET", 
		async: opt.async
	}).done(function(data){
		var response = $('<html />').html(data);
		//credit https://stackoverflow.com/questions/405409/use-jquery-selectors-on-ajax-loaded-html#7831229
		
		retu.error = /No such file or directory\)/gi.test(response.find("body").text());
        if(/Illegal Attempt/gi.test(response.find("body").text()))
        {
            retu.error = true;
            retu.errorReason = {
                "textStatus": "",
                "errorThrown": "Illegal Attempt"
            }
        }
		
		if(!retu.error)
		{
			retu.posted = view ? parseInt(response.find("font:contains('#Messages posted today:')").html().split(": ")[1]) : -1;
			retu.who = view ? response.find("input[name='xwho']").val() : false;
		
			var messages = [];
			var deltaMessages = [];
		
			response.find("table tr").each(function(index) {
				if(index) //skips the header row
				{
					var message = {};
					$(this).children("td").each(function(idx){
						if(view)
						{
							switch(idx)
							{
								case 0:
									message.marked = !!($.trim($(this).text()));
									message.priority = !!($(this).find("img").length);
									break;
								case 1:
									message.date = $.trim($(this).text());
									break;
								case 2:
									message.abbrname = $.trim($(this).text());
									message.fullname = $(this).find("abbr").attr("title");
                                    if(!$.trim(message.fullname).length) message.fullname = message.abbrname;
									break;
								case 3:
									//escape all the names
									message.title = he.encode($.trim($(this).text()), {'useNamedReferences': true});
									message.href = $(this).find("a").attr("href");
									message.uid = parseInt(message.href.split("?msgid=")[1].split("=")[0]);
									message.read = !($(this).find("b").length);
									break;
								case 4:
									message.attention = he.encode($.trim($(this).text()), {'useNamedReferences': true});
									break;
								case 5:
									message.viewers = parseInt($.trim($(this).text()));
									var as = $(this).find("a");
									message.viewerslink = as.length ? as.attr("href") : false;
									break;
								case 6:
									var txt = $.trim($(this).text());
									message.updates = !!(txt) ? parseInt(txt) : 0;
									break;
								default:
									break;
							}
						}
						else
						{
							//put archive traverse code here !!!!!
						}
					});
				
					if(currentMessages.indexOf(message.uid) == -1) {
						currentMessages.push(message.uid);
						deltaMessages.push(message);
					}
					//check which to insert message into
					/*
					if(message.priority && !message.read) messages["imptUnread"].push(message);
					else if (message.priority) messages["impt"].push(message);
					else if (!message.read) messages["normalUnread"].push(message);
					else messages["normal"].push(message);
					*/
					messages.push(message);
				}
			});
			//console.log(messages);
			retu.messages = messages;
			retu.delta = deltaMessages;
		}
		
		if(opt.callback) opt.callback(retu);
		
		//console.log(retu);
		
	}).fail(function(jqXHR, textStatus, errorThrown) { 
		/*show error*/ 
		retu.error = true; 
		retu.errorReason = {
			"textStatus": textStatus,
			"errorThrown": errorThrown
		}
	}).always(function() {});
	
	retu.timestamp = Date.now();
	
	retrieving = false;
	return retu;
}

function getTopbar(options)
{
	console.log("getting topbar");
	var opt = $.extend({
		"async": false, 
		"callback": null
	}, options);
	
	
	//obtaining the data
	var retu = {};
	
	retu.error = false;
	
	var jqxhr = $.ajax({
		url: "/cgi-bin/emb/menu_htm.pl",
		dataType: "html",
		method: "GET", 
		async: opt.async
	}).done(function(data){
		console.log("ajax success");
		var response = $('<html />').html(data);
		//credit https://stackoverflow.com/questions/405409/use-jquery-selectors-on-ajax-loaded-html#7831229
		var x = response.find("th").length;
        var i = 0; //custom iterator
		response.find("th").each(function(idx)
        {
            switch(i)
            {
                case 0:
                    retu.view = $(this).children("a").attr("href");
                    i++;
                    break;
                case 1:
                    if(/post/gi.test($.trim($(this).children("a").text()))) retu.post = $(this).children("a").attr("href");
                    else 
                    {
                        retu.archive = $(this).children("a").attr("href");
                        i++;
                    }
                    break;
                case 2:
                    retu.util = $(this).children("a").attr("href");
                    i++
                    break;
                case 3:
                    if($(this).children("a").length) retu.exit = $(this).children("a").attr("href");
                    else retu.exit = false;
                    i++
                    break;
                case 4:
                    retu.logout = $(this).children("a").attr("href");
                    i++
                    break;
                case 5:
                    if(/Webmail/gi.test($.trim($(this).children("a").text()))) retu.hciwebmail = $(this).children("a").attr("href");
                    else 
                    {
                        retu.help = $(this).children("a").attr("href");
                        i++;
                    }
                    break;
                case 6:
                    //here lies the emb name and id etc that isn't diplayed anyway if not passed a get parameter
                    i++;
                    break;
                case 7:
                    var rawString = $(this).children("font[size=-1]").text().split(": ")[1].split(" ");
                    var dateString = rawString[0].split("/");
                    var timeString = rawString[1].split(":");
                    retu.lastlogin = {
                        "day": parseInt(dateString[0]),
                        "month": parseInt(dateString[1]),
                        "year": parseInt("20" + dateString[2]),
                        "hour": parseInt(timeString[0]),
                        "minutes" : parseInt(timeString[1])
                    }
                    i++;
                    break;
                case 8:
                    retu.loginCount = parseInt($(this).text().split("#")[1]);
                    i++;
                    break;
                default:
                    break;
            }
            console.log(idx, "OK");
        });
		
		if(opt.callback) opt.callback(retu);
		
	}).fail(function(jqXHR, textStatus, errorThrown) { 
		/*show error*/ 
		retu.error = true; 
		retu.errorReason = {
			"textStatus": textStatus,
			"errorThrown": errorThrown
		}
	}).always(function() {});
	
	//console.log(retu);
	
	return retu;
}

function sscroll(id)
{
    //===================== some issues here !!! =====================
    $('html,body').stop(true,false).animate({
        scrollTop: $(id).offset().top - 70
    }, 500);
}

function toast(msg, time)
{
    //alert(msg);
    if(!time) time = 4000;
    Materialize.toast(msg, time, 'toasted grabbable unselectable');
}

function err(errormsg)
{
    alert(errormsg);
}

//notifying codes
function notify(msg, title, icon) {

	var notif;
	
  	// Let's check if the browser supports notifications
	if (!("Notification" in window)) 
	{
		alert(strings["errordns"]);
	}

	// Let's check whether notification permissions have already been granted
	else if (Notification.permission === "granted") {
		// If it's okay let's create a notification
		notif = spawnNotification(msg, title, icon);
	}

	// Otherwise, we need to ask the user for permission
	else if (Notification.permission !== 'denied') {
		Notification.requestPermission(function (permission) {
			// If the user accepts, let's create a notification
			if (permission === "granted") {
				notif = spawnNotification(msg, title, icon);
			}
		});
	}

	// At last, if the user has denied notifications, and you 
	// want to be respectful there is no need to bother them any more.
	
	//return the notif object
	return notif;
}

function spawnNotification(theBody, theTitle, theIcon) {
	var options = {
		body: theBody,
		icon: theIcon
	};
	var n = new Notification(theTitle, options);
	
	return n;
}

//ensures that bg colour allows for white text overlay
function getColourfromText(str)
{
	var co = stringToColour(str);
	if(idealTextColor(co) == "#000000")
	{
		//console.log(str, co, idealTextColor(stringToColour(co.substr(1,3))));
		if(idealTextColor(stringToColour(co.substr(1,3))) == "#000000") co = rgbToHex(getOpposite(co));
		
		while(idealTextColor(co) == "#000000")
		{
			co = changeColorLuminance(co, -0.05);
		}
		
	}
	
	return co;
}

function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(rgb) {
    return "#" + componentToHex(rgb.r) + componentToHex(rgb.g) + componentToHex(rgb.b);
}
//credit: https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb#562413

function stringToColour(str) {

    // str to hash
    for (var i = 0, hash = 0; i < str.length; hash = str.charCodeAt(i++) + ((hash << 5) - hash)) {}

    // int/hash to hex
    for (var i = 0, colour = "#"; i < 3; colour += ("00" + ((hash >> i++ * 8) & 0xFF).toString(16)).slice(-2)) {}

    return colour;
}
//credit: http://stackoverflow.com/questions/3426404/create-a-hexadecimal-colour-based-on-a-string-with-javascript#16348977


function idealTextColor(bgColor) {

    var nThreshold = 105;
    var components = getRGBComponents(bgColor);
    var bgDelta = (components.r * 0.299) + (components.g * 0.587) + (components.b * 0.114);

    return ((255 - bgDelta) < nThreshold) ? "#000000" : "#ffffff";
}

function getRGBComponents(color) {

    var r = color.substring(1, 3);
    var g = color.substring(3, 5);
    var b = color.substring(5, 7);

    return {
        r: parseInt(r, 16),
        g: parseInt(g, 16),
        b: parseInt(b, 16)
    };
}
//credit http://stackoverflow.com/questions/4726344/how-do-i-change-text-color-determined-by-the-background-color#answer-4726403

function getOpposite(color)
{
	var temprgb = getRGBComponents(color);
	var temphsv = RGB2HSV(temprgb);
	
	temphsv.hue = HueShift(temphsv.hue,180.0);
	temprgb = HSV2RGB(temphsv);
	
	return temprgb;
}

function RGB2HSV(rgb) {
    hsv = new Object();
    max=max3(rgb.r,rgb.g,rgb.b);
    dif=max-min3(rgb.r,rgb.g,rgb.b);
    hsv.saturation=(max==0.0)?0:(100*dif/max);
    if (hsv.saturation==0) hsv.hue=0;
    else if (rgb.r==max) hsv.hue=60.0*(rgb.g-rgb.b)/dif;
    else if (rgb.g==max) hsv.hue=120.0+60.0*(rgb.b-rgb.r)/dif;
    else if (rgb.b==max) hsv.hue=240.0+60.0*(rgb.r-rgb.g)/dif;
    if (hsv.hue<0.0) hsv.hue+=360.0;
    hsv.value=Math.round(max*100/255);
    hsv.hue=Math.round(hsv.hue);
    hsv.saturation=Math.round(hsv.saturation);
    return hsv;
}

// RGB2HSV and HSV2RGB are based on Color Match Remix [http://color.twysted.net/]
// which is based on or copied from ColorMatch 5K [http://colormatch.dk/]
function HSV2RGB(hsv) {
    var rgb=new Object();
    if (hsv.saturation==0) {
        rgb.r=rgb.g=rgb.b=Math.round(hsv.value*2.55);
    } else {
        hsv.hue/=60;
        hsv.saturation/=100;
        hsv.value/=100;
        i=Math.floor(hsv.hue);
        f=hsv.hue-i;
        p=hsv.value*(1-hsv.saturation);
        q=hsv.value*(1-hsv.saturation*f);
        t=hsv.value*(1-hsv.saturation*(1-f));
        switch(i) {
        case 0: rgb.r=hsv.value; rgb.g=t; rgb.b=p; break;
        case 1: rgb.r=q; rgb.g=hsv.value; rgb.b=p; break;
        case 2: rgb.r=p; rgb.g=hsv.value; rgb.b=t; break;
        case 3: rgb.r=p; rgb.g=q; rgb.b=hsv.value; break;
        case 4: rgb.r=t; rgb.g=p; rgb.b=hsv.value; break;
        default: rgb.r=hsv.value; rgb.g=p; rgb.b=q;
        }
        rgb.r=Math.round(rgb.r*255);
        rgb.g=Math.round(rgb.g*255);
        rgb.b=Math.round(rgb.b*255);
    }
    return rgb;
}

//Adding HueShift via Jacob (see comments)
function HueShift(h,s) { 
    h+=s; while (h>=360.0) h-=360.0; while (h<0.0) h+=360.0; return h; 
}

//min max via Hairgami_Master (see comments)
function min3(a,b,c) { 
    return (a<b)?((a<c)?a:c):((b<c)?b:c); 
}

function max3(a,b,c) { 
    return (a>b)?((a>c)?a:c):((b>c)?b:c); 
}
//credit https://stackoverflow.com/questions/1664140/js-function-to-calculate-complementary-colour#1664186

function changeColorLuminance(hex, lum) {

	// validate hex string
	hex = String(hex).replace(/[^0-9a-f]/gi, '');
	if (hex.length < 6) {
		hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
	}
	lum = lum || 0;

	// convert to decimal and change luminosity
	var rgb = "#", c, i;
	for (i = 0; i < 3; i++) {
		c = parseInt(hex.substr(i*2,2), 16);
		c = Math.round(Math.min(Math.max(0, c + (c * lum)), 255)).toString(16);
		rgb += ("00"+c).substr(c.length);
	}

	return rgb;
}
//credit http://www.sitepoint.com/javascript-generate-lighter-darker-color/

//code archive
/*
function difference(old, new)
{
	var diff = $(old_array).not(new_array).get();
	//credit: https://stackoverflow.com/questions/10927722/jquery-compare-2-arrays-return-difference#15385871
	//diff now contains what was in old_array that is not in new_array
}
/*
/*
function compareMessage(a, b)
{
	if (a.uid < b.uid) return -1;
	if (a.uid > b.uid) return 1;
	return 0;
}*/
//credit https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort

/*function redirect(page)
{
	/*if(page == "main")
	{
		window.location.href = ""
	}
}*/

/*function runAfterLoad()
{
    if(currPage == 'login')
    {
        //for the log in screen
        //$("input[name=userid]").focus();
    }
}*/

/*
	if(type == "imptUnread")
	{
		ret.push('<span class="title" style="font-weight: bold;">' + msg.title + '</span>');
		
	}
	else if (type == "impt")
	{
		ret.push('<span class="title">' + msg.title + '</span>');
	}
	else if (type == "normalUnread")
	{
		ret.push('<span class="title" style="font-weight: bold;">' + msg.title + '</span>');
		
	}
	else if (type == "normal")
	{
		ret.push('<span class="title">' + msg.title + '</span>');
	}
*/

/*	body.push('<div id="imptUnread">');
	for (var i = 0, len = sortedMessages.imptUnread.length; i < len; i++) 
	{
		var msge = sortedMessages.imptUnread[i];
		body.push(printMessage("imptUnread", msge));
	}
	body.push("</div>");
	body.push('<div id="impt">');
	for (var i = 0, len = sortedMessages.impt.length; i < len; i++) 
	{
		var msge = sortedMessages.impt[i];
		body.push(printMessage("impt", msge));
	}
	body.push("</div>");

	//normal messages
	body.push('<li class="collection-header"><h5 class="unselectable"><i class="material-icons">chat</i> Normal Messages</h5></li>');

	body.push('<div id="normalUnread">');
	for (var i = 0, len = sortedMessages.normalUnread.length; i < len; i++) 
	{
		var msge = sortedMessages.normalUnread[i];
		body.push(printMessage("normalUnread", msge));
	}
	body.push("</div>");
	body.push('<div id="normal">');
	for (var i = 0, len = sortedMessages.normal.length; i < len; i++) 
	{
		var msge = sortedMessages.normal[i];
		body.push(printMessage("normal", msge));
	}
	body.push("</div>");
*/

/*String.prototype.hashCode = function() {
  var hash = 0, i, chr, len;
  if (this.length == 0) return hash;
  for (i = 0, len = this.length; i < len; i++) {
    chr   = this.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};*/
//credit https://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript-jquery#7616484

$(document).ready(function() 
{
	init();
});

$(window).load(function()
{
	//add onfocus/blur event listeners
	$(window).focus(function()
	{
		windowFocus = true;
		//console.log("Window Focused");
	});
	
	$(window).blur(function()
	{
		windowFocus = false;
		//console.log("Window Blurred");
	});
});

//forwardevents
//credit: https://github.com/MichaelPote/jquery.forwardevents
/*(function(g){function d(d,h,a,b){var g=a.type,l=a.originalEvent,k=a.target,m=a.relatedTarget;a.target=d[0];a.type=h;a.originalEvent=null;b&&(a.relatedTarget=b);d.trigger(a);a.type=g;a.originalEvent=l;a.target=k;a.relatedTarget=m}g.fn.forwardevents=function(r){var h=g.extend({enableMousemove:!1,dblClickThreshold:500,directEventsTo:null},r);return this.each(function(){var a=g(this),b,q,l,k=0,m=0;a.bind("mouseout",function(c){b&&d(b,"mouseout",c,a[0])}).bind("mousemove mousedown mouseup mousewheel",
function(c){if(a.is(":visible")){var f=c.originalEvent,n=f.type,p=f.clientX,f=f.clientY,e;c.stopPropagation();null!=h.directEventsTo?e=h.directEventsTo:(a.hide(),e=g(document.elementFromPoint(p,f)),a.show());if(e)if((h.enableMousemove||"mousemove"!==n)&&d(e,n,c),b&&e[0]===b[0]){if("mouseup"==n){if(q!=p||l!=f||c.timeStamp-m>h.dblClickThreshold)k=0;q=p;l=f;m=c.timeStamp;d(e,"click",c);2==++k&&(d(e,"dblclick",c),k=0)}}else k=0,b&&d(b,"mouseout",c,e[0]),d(e,"mouseover",c,b?b[0]:a[0]);else d(b,"mouseout",
c);b=e}})})}})(jQuery);*/

/*
 *  jQuery dotdotdot 1.7.4
 *
 *  Copyright (c) Fred Heusschen
 *  www.frebsite.nl
 *
 *  Plugin website:
 *  dotdotdot.frebsite.nl
 *
 *  Licensed under the MIT license.
 *  http://en.wikipedia.org/wiki/MIT_License
 */
!function(t,e){function n(t,e,n){var r=t.children(),o=!1;t.empty();for(var i=0,d=r.length;d>i;i++){var l=r.eq(i);if(t.append(l),n&&t.append(n),a(t,e)){l.remove(),o=!0;break}n&&n.detach()}return o}function r(e,n,i,d,l){var s=!1,c="a, table, thead, tbody, tfoot, tr, col, colgroup, object, embed, param, ol, ul, dl, blockquote, select, optgroup, option, textarea, script, style",u="script, .dotdotdot-keep";return e.contents().detach().each(function(){var h=this,f=t(h);if("undefined"==typeof h)return!0;if(f.is(u))e.append(f);else{if(s)return!0;e.append(f),!l||f.is(d.after)||f.find(d.after).length||e[e.is(c)?"after":"append"](l),a(i,d)&&(s=3==h.nodeType?o(f,n,i,d,l):r(f,n,i,d,l),s||(f.detach(),s=!0)),s||l&&l.detach()}}),n.addClass("is-truncated"),s}function o(e,n,r,o,d){var c=e[0];if(!c)return!1;var h=s(c),f=-1!==h.indexOf(" ")?" ":"　",p="letter"==o.wrap?"":f,g=h.split(p),v=-1,w=-1,b=0,y=g.length-1;for(o.fallbackToLetter&&0==b&&0==y&&(p="",g=h.split(p),y=g.length-1);y>=b&&(0!=b||0!=y);){var m=Math.floor((b+y)/2);if(m==w)break;w=m,l(c,g.slice(0,w+1).join(p)+o.ellipsis),r.children().each(function(){t(this).toggle().toggle()}),a(r,o)?(y=w,o.fallbackToLetter&&0==b&&0==y&&(p="",g=g[0].split(p),v=-1,w=-1,b=0,y=g.length-1)):(v=w,b=w)}if(-1==v||1==g.length&&0==g[0].length){var x=e.parent();e.detach();var T=d&&d.closest(x).length?d.length:0;x.contents().length>T?c=u(x.contents().eq(-1-T),n):(c=u(x,n,!0),T||x.detach()),c&&(h=i(s(c),o),l(c,h),T&&d&&t(c).parent().append(d))}else h=i(g.slice(0,v+1).join(p),o),l(c,h);return!0}function a(t,e){return t.innerHeight()>e.maxHeight}function i(e,n){for(;t.inArray(e.slice(-1),n.lastCharacter.remove)>-1;)e=e.slice(0,-1);return t.inArray(e.slice(-1),n.lastCharacter.noEllipsis)<0&&(e+=n.ellipsis),e}function d(t){return{width:t.innerWidth(),height:t.innerHeight()}}function l(t,e){t.innerText?t.innerText=e:t.nodeValue?t.nodeValue=e:t.textContent&&(t.textContent=e)}function s(t){return t.innerText?t.innerText:t.nodeValue?t.nodeValue:t.textContent?t.textContent:""}function c(t){do t=t.previousSibling;while(t&&1!==t.nodeType&&3!==t.nodeType);return t}function u(e,n,r){var o,a=e&&e[0];if(a){if(!r){if(3===a.nodeType)return a;if(t.trim(e.text()))return u(e.contents().last(),n)}for(o=c(a);!o;){if(e=e.parent(),e.is(n)||!e.length)return!1;o=c(e[0])}if(o)return u(t(o),n)}return!1}function h(e,n){return e?"string"==typeof e?(e=t(e,n),e.length?e:!1):e.jquery?e:!1:!1}function f(t){for(var e=t.innerHeight(),n=["paddingTop","paddingBottom"],r=0,o=n.length;o>r;r++){var a=parseInt(t.css(n[r]),10);isNaN(a)&&(a=0),e-=a}return e}if(!t.fn.dotdotdot){t.fn.dotdotdot=function(e){if(0==this.length)return t.fn.dotdotdot.debug('No element found for "'+this.selector+'".'),this;if(this.length>1)return this.each(function(){t(this).dotdotdot(e)});var o=this;o.data("dotdotdot")&&o.trigger("destroy.dot"),o.data("dotdotdot-style",o.attr("style")||""),o.css("word-wrap","break-word"),"nowrap"===o.css("white-space")&&o.css("white-space","normal"),o.bind_events=function(){return o.bind("update.dot",function(e,d){switch(o.removeClass("is-truncated"),e.preventDefault(),e.stopPropagation(),typeof l.height){case"number":l.maxHeight=l.height;break;case"function":l.maxHeight=l.height.call(o[0]);break;default:l.maxHeight=f(o)}l.maxHeight+=l.tolerance,"undefined"!=typeof d&&(("string"==typeof d||"nodeType"in d&&1===d.nodeType)&&(d=t("<div />").append(d).contents()),d instanceof t&&(i=d)),g=o.wrapInner('<div class="dotdotdot" />').children(),g.contents().detach().end().append(i.clone(!0)).find("br").replaceWith("  <br />  ").end().css({height:"auto",width:"auto",border:"none",padding:0,margin:0});var c=!1,u=!1;return s.afterElement&&(c=s.afterElement.clone(!0),c.show(),s.afterElement.detach()),a(g,l)&&(u="children"==l.wrap?n(g,l,c):r(g,o,g,l,c)),g.replaceWith(g.contents()),g=null,t.isFunction(l.callback)&&l.callback.call(o[0],u,i),s.isTruncated=u,u}).bind("isTruncated.dot",function(t,e){return t.preventDefault(),t.stopPropagation(),"function"==typeof e&&e.call(o[0],s.isTruncated),s.isTruncated}).bind("originalContent.dot",function(t,e){return t.preventDefault(),t.stopPropagation(),"function"==typeof e&&e.call(o[0],i),i}).bind("destroy.dot",function(t){t.preventDefault(),t.stopPropagation(),o.unwatch().unbind_events().contents().detach().end().append(i).attr("style",o.data("dotdotdot-style")||"").data("dotdotdot",!1)}),o},o.unbind_events=function(){return o.unbind(".dot"),o},o.watch=function(){if(o.unwatch(),"window"==l.watch){var e=t(window),n=e.width(),r=e.height();e.bind("resize.dot"+s.dotId,function(){n==e.width()&&r==e.height()&&l.windowResizeFix||(n=e.width(),r=e.height(),u&&clearInterval(u),u=setTimeout(function(){o.trigger("update.dot")},100))})}else c=d(o),u=setInterval(function(){if(o.is(":visible")){var t=d(o);(c.width!=t.width||c.height!=t.height)&&(o.trigger("update.dot"),c=t)}},500);return o},o.unwatch=function(){return t(window).unbind("resize.dot"+s.dotId),u&&clearInterval(u),o};var i=o.contents(),l=t.extend(!0,{},t.fn.dotdotdot.defaults,e),s={},c={},u=null,g=null;return l.lastCharacter.remove instanceof Array||(l.lastCharacter.remove=t.fn.dotdotdot.defaultArrays.lastCharacter.remove),l.lastCharacter.noEllipsis instanceof Array||(l.lastCharacter.noEllipsis=t.fn.dotdotdot.defaultArrays.lastCharacter.noEllipsis),s.afterElement=h(l.after,o),s.isTruncated=!1,s.dotId=p++,o.data("dotdotdot",!0).bind_events().trigger("update.dot"),l.watch&&o.watch(),o},t.fn.dotdotdot.defaults={ellipsis:"... ",wrap:"word",fallbackToLetter:!0,lastCharacter:{},tolerance:0,callback:null,after:null,height:null,watch:!1,windowResizeFix:!0},t.fn.dotdotdot.defaultArrays={lastCharacter:{remove:[" ","　",",",";",".","!","?"],noEllipsis:[]}},t.fn.dotdotdot.debug=function(){};var p=1,g=t.fn.html;t.fn.html=function(n){return n!=e&&!t.isFunction(n)&&this.data("dotdotdot")?this.trigger("update",[n]):g.apply(this,arguments)};var v=t.fn.text;t.fn.text=function(n){return n!=e&&!t.isFunction(n)&&this.data("dotdotdot")?(n=t("<div />").text(n).html(),this.trigger("update",[n])):v.apply(this,arguments)}}}(jQuery);


//htmlentities
//credit: https://stackoverflow.com/questions/1354064/how-to-convert-characters-to-html-entities-using-plain-javascript/23831239#23831239

//// =============== / WARNING! / ACHTUNG! / WARNING! / ACHTUNG! / WARNING! / ACHTUNG! / WARNING! / ACHTUNG! / =============== ////
////                                                                                                                           ////
////                                                                                                                           ////
////                DO NOT SCROLL PAST THIS POINT AS IT MAY CAUSE EDITOR TO RUN OUT OF MEMORY. TO EDIT, PLEASE                 ////
////                USE ONLY NANO/VIM OR ANY OTHER TERMINAL-BASED EDITOR OR AN EDITOR THAT HAS MORE RAM.                       ////
////                JUST. NOT. GEDIT.                                                                                          ////
////                                                                                                                           ////
////                                                                                                                           ////
//// =============== / WARNING! / ACHTUNG! / WARNING! / ACHTUNG! / WARNING! / ACHTUNG! / WARNING! / ACHTUNG! / =============== ////

//Below are 20 lines of padding




















(function(u){var h="object"==typeof exports&&exports,v="object"==typeof module&&module&&module.exports==h&&module,g="object"==typeof global&&global;if(g.global===g||g.window===g)u=g;var D=/[\uD800-\uDBFF][\uDC00-\uDFFF]/g,E=/[\x01-\x7F]/g,F=/[\x01-\t\x0B\f\x0E-\x1F\x7F\x81\x8D\x8F\x90\x9D\xA0-\uFFFF]/g,w=/<\u20D2|=\u20E5|>\u20D2|\u205F\u200A|\u219D\u0338|\u2202\u0338|\u2220\u20D2|\u2229\uFE00|\u222A\uFE00|\u223C\u20D2|\u223D\u0331|\u223E\u0333|\u2242\u0338|\u224B\u0338|\u224D\u20D2|\u224E\u0338|\u224F\u0338|\u2250\u0338|\u2261\u20E5|\u2264\u20D2|\u2265\u20D2|\u2266\u0338|\u2267\u0338|\u2268\uFE00|\u2269\uFE00|\u226A\u0338|\u226A\u20D2|\u226B\u0338|\u226B\u20D2|\u227F\u0338|\u2282\u20D2|\u2283\u20D2|\u228A\uFE00|\u228B\uFE00|\u228F\u0338|\u2290\u0338|\u2293\uFE00|\u2294\uFE00|\u22B4\u20D2|\u22B5\u20D2|\u22D8\u0338|\u22D9\u0338|\u22DA\uFE00|\u22DB\uFE00|\u22F5\u0338|\u22F9\u0338|\u2933\u0338|\u29CF\u0338|\u29D0\u0338|\u2A6D\u0338|\u2A70\u0338|\u2A7D\u0338|\u2A7E\u0338|\u2AA1\u0338|\u2AA2\u0338|\u2AAC\uFE00|\u2AAD\uFE00|\u2AAF\u0338|\u2AB0\u0338|\u2AC5\u0338|\u2AC6\u0338|\u2ACB\uFE00|\u2ACC\uFE00|\u2AFD\u20E5|[\xA0-\u0113\u0116-\u0122\u0124-\u012B\u012E-\u014D\u0150-\u017E\u0192\u01B5\u01F5\u0237\u02C6\u02C7\u02D8-\u02DD\u0311\u0391-\u03A1\u03A3-\u03A9\u03B1-\u03C9\u03D1\u03D2\u03D5\u03D6\u03DC\u03DD\u03F0\u03F1\u03F5\u03F6\u0401-\u040C\u040E-\u044F\u0451-\u045C\u045E\u045F\u2002-\u2005\u2007-\u2010\u2013-\u2016\u2018-\u201A\u201C-\u201E\u2020-\u2022\u2025\u2026\u2030-\u2035\u2039\u203A\u203E\u2041\u2043\u2044\u204F\u2057\u205F-\u2063\u20AC\u20DB\u20DC\u2102\u2105\u210A-\u2113\u2115-\u211E\u2122\u2124\u2127-\u2129\u212C\u212D\u212F-\u2131\u2133-\u2138\u2145-\u2148\u2153-\u215E\u2190-\u219B\u219D-\u21A7\u21A9-\u21AE\u21B0-\u21B3\u21B5-\u21B7\u21BA-\u21DB\u21DD\u21E4\u21E5\u21F5\u21FD-\u2205\u2207-\u2209\u220B\u220C\u220F-\u2214\u2216-\u2218\u221A\u221D-\u2238\u223A-\u2257\u2259\u225A\u225C\u225F-\u2262\u2264-\u228B\u228D-\u229B\u229D-\u22A5\u22A7-\u22B0\u22B2-\u22BB\u22BD-\u22DB\u22DE-\u22E3\u22E6-\u22F7\u22F9-\u22FE\u2305\u2306\u2308-\u2310\u2312\u2313\u2315\u2316\u231C-\u231F\u2322\u2323\u232D\u232E\u2336\u233D\u233F\u237C\u23B0\u23B1\u23B4-\u23B6\u23DC-\u23DF\u23E2\u23E7\u2423\u24C8\u2500\u2502\u250C\u2510\u2514\u2518\u251C\u2524\u252C\u2534\u253C\u2550-\u256C\u2580\u2584\u2588\u2591-\u2593\u25A1\u25AA\u25AB\u25AD\u25AE\u25B1\u25B3-\u25B5\u25B8\u25B9\u25BD-\u25BF\u25C2\u25C3\u25CA\u25CB\u25EC\u25EF\u25F8-\u25FC\u2605\u2606\u260E\u2640\u2642\u2660\u2663\u2665\u2666\u266A\u266D-\u266F\u2713\u2717\u2720\u2736\u2758\u2772\u2773\u27C8\u27C9\u27E6-\u27ED\u27F5-\u27FA\u27FC\u27FF\u2902-\u2905\u290C-\u2913\u2916\u2919-\u2920\u2923-\u292A\u2933\u2935-\u2939\u293C\u293D\u2945\u2948-\u294B\u294E-\u2976\u2978\u2979\u297B-\u297F\u2985\u2986\u298B-\u2996\u299A\u299C\u299D\u29A4-\u29B7\u29B9\u29BB\u29BC\u29BE-\u29C5\u29C9\u29CD-\u29D0\u29DC-\u29DE\u29E3-\u29E5\u29EB\u29F4\u29F6\u2A00-\u2A02\u2A04\u2A06\u2A0C\u2A0D\u2A10-\u2A17\u2A22-\u2A27\u2A29\u2A2A\u2A2D-\u2A31\u2A33-\u2A3C\u2A3F\u2A40\u2A42-\u2A4D\u2A50\u2A53-\u2A58\u2A5A-\u2A5D\u2A5F\u2A66\u2A6A\u2A6D-\u2A75\u2A77-\u2A9A\u2A9D-\u2AA2\u2AA4-\u2AB0\u2AB3-\u2AC8\u2ACB\u2ACC\u2ACF-\u2ADB\u2AE4\u2AE6-\u2AE9\u2AEB-\u2AF3\u2AFD\uFB00-\uFB04]|\uD835[\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDCCF\uDD04\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDD6B]/g,
k={"\u00c1":"Aacute","\u00e1":"aacute","\u0102":"Abreve","\u0103":"abreve","\u223e":"ac","\u223f":"acd","\u223e\u0333":"acE","\u00c2":"Acirc","\u00e2":"acirc","\u00b4":"acute","\u0410":"Acy","\u0430":"acy","\u00c6":"AElig","\u00e6":"aelig","\u2061":"af","\ud835\udd04":"Afr","\ud835\udd1e":"afr","\u00c0":"Agrave","\u00e0":"agrave","\u2135":"aleph","\u0391":"Alpha","\u03b1":"alpha","\u0100":"Amacr","\u0101":"amacr","\u2a3f":"amalg","&":"amp","\u2a55":"andand","\u2a53":"And","\u2227":"and","\u2a5c":"andd",
"\u2a58":"andslope","\u2a5a":"andv","\u2220":"ang","\u29a4":"ange","\u29a8":"angmsdaa","\u29a9":"angmsdab","\u29aa":"angmsdac","\u29ab":"angmsdad","\u29ac":"angmsdae","\u29ad":"angmsdaf","\u29ae":"angmsdag","\u29af":"angmsdah","\u2221":"angmsd","\u221f":"angrt","\u22be":"angrtvb","\u299d":"angrtvbd","\u2222":"angsph","\u00c5":"angst","\u237c":"angzarr","\u0104":"Aogon","\u0105":"aogon","\ud835\udd38":"Aopf","\ud835\udd52":"aopf","\u2a6f":"apacir","\u2248":"ap","\u2a70":"apE","\u224a":"ape","\u224b":"apid",
"'":"apos","\u00e5":"aring","\ud835\udc9c":"Ascr","\ud835\udcb6":"ascr","\u2254":"colone","*":"ast","\u224d":"CupCap","\u00c3":"Atilde","\u00e3":"atilde","\u00c4":"Auml","\u00e4":"auml","\u2233":"awconint","\u2a11":"awint","\u224c":"bcong","\u03f6":"bepsi","\u2035":"bprime","\u223d":"bsim","\u22cd":"bsime","\u2216":"setmn","\u2ae7":"Barv","\u22bd":"barvee","\u2305":"barwed","\u2306":"Barwed","\u23b5":"bbrk","\u23b6":"bbrktbrk","\u0411":"Bcy","\u0431":"bcy","\u201e":"bdquo","\u2235":"becaus","\u29b0":"bemptyv",
"\u212c":"Bscr","\u0392":"Beta","\u03b2":"beta","\u2136":"beth","\u226c":"twixt","\ud835\udd05":"Bfr","\ud835\udd1f":"bfr","\u22c2":"xcap","\u25ef":"xcirc","\u22c3":"xcup","\u2a00":"xodot","\u2a01":"xoplus","\u2a02":"xotime","\u2a06":"xsqcup","\u2605":"starf","\u25bd":"xdtri","\u25b3":"xutri","\u2a04":"xuplus","\u22c1":"Vee","\u22c0":"Wedge","\u290d":"rbarr","\u29eb":"lozf","\u25aa":"squf","\u25b4":"utrif","\u25be":"dtrif","\u25c2":"ltrif","\u25b8":"rtrif","\u2423":"blank","\u2592":"blk12","\u2591":"blk14",
"\u2593":"blk34","\u2588":"block","=\u20e5":"bne","\u2261\u20e5":"bnequiv","\u2aed":"bNot","\u2310":"bnot","\ud835\udd39":"Bopf","\ud835\udd53":"bopf","\u22a5":"bot","\u22c8":"bowtie","\u29c9":"boxbox","\u2510":"boxdl","\u2555":"boxdL","\u2556":"boxDl","\u2557":"boxDL","\u250c":"boxdr","\u2552":"boxdR","\u2553":"boxDr","\u2554":"boxDR","\u2500":"boxh","\u2550":"boxH","\u252c":"boxhd","\u2564":"boxHd","\u2565":"boxhD","\u2566":"boxHD","\u2534":"boxhu","\u2567":"boxHu","\u2568":"boxhU","\u2569":"boxHU",
"\u229f":"minusb","\u229e":"plusb","\u22a0":"timesb","\u2518":"boxul","\u255b":"boxuL","\u255c":"boxUl","\u255d":"boxUL","\u2514":"boxur","\u2558":"boxuR","\u2559":"boxUr","\u255a":"boxUR","\u2502":"boxv","\u2551":"boxV","\u253c":"boxvh","\u256a":"boxvH","\u256b":"boxVh","\u256c":"boxVH","\u2524":"boxvl","\u2561":"boxvL","\u2562":"boxVl","\u2563":"boxVL","\u251c":"boxvr","\u255e":"boxvR","\u255f":"boxVr","\u2560":"boxVR","\u02d8":"breve","\u00a6":"brvbar","\ud835\udcb7":"bscr","\u204f":"bsemi","\u29c5":"bsolb",
"\\":"bsol","\u27c8":"bsolhsub","\u2022":"bull","\u224e":"bump","\u2aae":"bumpE","\u224f":"bumpe","\u0106":"Cacute","\u0107":"cacute","\u2a44":"capand","\u2a49":"capbrcup","\u2a4b":"capcap","\u2229":"cap","\u22d2":"Cap","\u2a47":"capcup","\u2a40":"capdot","\u2145":"DD","\u2229\ufe00":"caps","\u2041":"caret","\u02c7":"caron","\u212d":"Cfr","\u2a4d":"ccaps","\u010c":"Ccaron","\u010d":"ccaron","\u00c7":"Ccedil","\u00e7":"ccedil","\u0108":"Ccirc","\u0109":"ccirc","\u2230":"Cconint","\u2a4c":"ccups","\u2a50":"ccupssm",
"\u010a":"Cdot","\u010b":"cdot","\u00b8":"cedil","\u29b2":"cemptyv","\u00a2":"cent","\u00b7":"middot","\ud835\udd20":"cfr","\u0427":"CHcy","\u0447":"chcy","\u2713":"check","\u03a7":"Chi","\u03c7":"chi","\u02c6":"circ","\u2257":"cire","\u21ba":"olarr","\u21bb":"orarr","\u229b":"oast","\u229a":"ocir","\u229d":"odash","\u2299":"odot","\u00ae":"reg","\u24c8":"oS","\u2296":"ominus","\u2295":"oplus","\u2297":"otimes","\u25cb":"cir","\u29c3":"cirE","\u2a10":"cirfnint","\u2aef":"cirmid","\u29c2":"cirscir",
"\u2232":"cwconint","\u201d":"rdquo","\u2019":"rsquo","\u2663":"clubs",":":"colon","\u2237":"Colon","\u2a74":"Colone",",":"comma","@":"commat","\u2201":"comp","\u2218":"compfn","\u2102":"Copf","\u2245":"cong","\u2a6d":"congdot","\u2261":"equiv","\u222e":"oint","\u222f":"Conint","\ud835\udd54":"copf","\u2210":"coprod","\u00a9":"copy","\u2117":"copysr","\u21b5":"crarr","\u2717":"cross","\u2a2f":"Cross","\ud835\udc9e":"Cscr","\ud835\udcb8":"cscr","\u2acf":"csub","\u2ad1":"csube","\u2ad0":"csup","\u2ad2":"csupe",
"\u22ef":"ctdot","\u2938":"cudarrl","\u2935":"cudarrr","\u22de":"cuepr","\u22df":"cuesc","\u21b6":"cularr","\u293d":"cularrp","\u2a48":"cupbrcap","\u2a46":"cupcap","\u222a":"cup","\u22d3":"Cup","\u2a4a":"cupcup","\u228d":"cupdot","\u2a45":"cupor","\u222a\ufe00":"cups","\u21b7":"curarr","\u293c":"curarrm","\u22ce":"cuvee","\u22cf":"cuwed","\u00a4":"curren","\u2231":"cwint","\u232d":"cylcty","\u2020":"dagger","\u2021":"Dagger","\u2138":"daleth","\u2193":"darr","\u21a1":"Darr","\u21d3":"dArr","\u2010":"dash",
"\u2ae4":"Dashv","\u22a3":"dashv","\u290f":"rBarr","\u02dd":"dblac","\u010e":"Dcaron","\u010f":"dcaron","\u0414":"Dcy","\u0434":"dcy","\u21ca":"ddarr","\u2146":"dd","\u2911":"DDotrahd","\u2a77":"eDDot","\u00b0":"deg","\u2207":"Del","\u0394":"Delta","\u03b4":"delta","\u29b1":"demptyv","\u297f":"dfisht","\ud835\udd07":"Dfr","\ud835\udd21":"dfr","\u2965":"dHar","\u21c3":"dharl","\u21c2":"dharr","\u02d9":"dot","`":"grave","\u02dc":"tilde","\u22c4":"diam","\u2666":"diams","\u00a8":"die","\u03dd":"gammad",
"\u22f2":"disin","\u00f7":"div","\u22c7":"divonx","\u0402":"DJcy","\u0452":"djcy","\u231e":"dlcorn","\u230d":"dlcrop",$:"dollar","\ud835\udd3b":"Dopf","\ud835\udd55":"dopf","\u20dc":"DotDot","\u2250":"doteq","\u2251":"eDot","\u2238":"minusd","\u2214":"plusdo","\u22a1":"sdotb","\u21d0":"lArr","\u21d4":"iff","\u27f8":"xlArr","\u27fa":"xhArr","\u27f9":"xrArr","\u21d2":"rArr","\u22a8":"vDash","\u21d1":"uArr","\u21d5":"vArr","\u2225":"par","\u2913":"DownArrowBar","\u21f5":"duarr","\u0311":"DownBreve",
"\u2950":"DownLeftRightVector","\u295e":"DownLeftTeeVector","\u2956":"DownLeftVectorBar","\u21bd":"lhard","\u295f":"DownRightTeeVector","\u2957":"DownRightVectorBar","\u21c1":"rhard","\u21a7":"mapstodown","\u22a4":"top","\u2910":"RBarr","\u231f":"drcorn","\u230c":"drcrop","\ud835\udc9f":"Dscr","\ud835\udcb9":"dscr","\u0405":"DScy","\u0455":"dscy","\u29f6":"dsol","\u0110":"Dstrok","\u0111":"dstrok","\u22f1":"dtdot","\u25bf":"dtri","\u296f":"duhar","\u29a6":"dwangle","\u040f":"DZcy","\u045f":"dzcy",
"\u27ff":"dzigrarr","\u00c9":"Eacute","\u00e9":"eacute","\u2a6e":"easter","\u011a":"Ecaron","\u011b":"ecaron","\u00ca":"Ecirc","\u00ea":"ecirc","\u2256":"ecir","\u2255":"ecolon","\u042d":"Ecy","\u044d":"ecy","\u0116":"Edot","\u0117":"edot","\u2147":"ee","\u2252":"efDot","\ud835\udd08":"Efr","\ud835\udd22":"efr","\u2a9a":"eg","\u00c8":"Egrave","\u00e8":"egrave","\u2a96":"egs","\u2a98":"egsdot","\u2a99":"el","\u2208":"in","\u23e7":"elinters","\u2113":"ell","\u2a95":"els","\u2a97":"elsdot","\u0112":"Emacr",
"\u0113":"emacr","\u2205":"empty","\u25fb":"EmptySmallSquare","\u25ab":"EmptyVerySmallSquare","\u2004":"emsp13","\u2005":"emsp14","\u2003":"emsp","\u014a":"ENG","\u014b":"eng","\u2002":"ensp","\u0118":"Eogon","\u0119":"eogon","\ud835\udd3c":"Eopf","\ud835\udd56":"eopf","\u22d5":"epar","\u29e3":"eparsl","\u2a71":"eplus","\u03b5":"epsi","\u0395":"Epsilon","\u03f5":"epsiv","\u2242":"esim","\u2a75":"Equal","=":"equals","\u225f":"equest","\u21cc":"rlhar","\u2a78":"equivDD","\u29e5":"eqvparsl","\u2971":"erarr",
"\u2253":"erDot","\u212f":"escr","\u2130":"Escr","\u2a73":"Esim","\u0397":"Eta","\u03b7":"eta","\u00d0":"ETH","\u00f0":"eth","\u00cb":"Euml","\u00eb":"euml","\u20ac":"euro","!":"excl","\u2203":"exist","\u0424":"Fcy","\u0444":"fcy","\u2640":"female","\ufb03":"ffilig","\ufb00":"fflig","\ufb04":"ffllig","\ud835\udd09":"Ffr","\ud835\udd23":"ffr","\ufb01":"filig","\u25fc":"FilledSmallSquare",fj:"fjlig","\u266d":"flat","\ufb02":"fllig","\u25b1":"fltns","\u0192":"fnof","\ud835\udd3d":"Fopf","\ud835\udd57":"fopf",
"\u2200":"forall","\u22d4":"fork","\u2ad9":"forkv","\u2131":"Fscr","\u2a0d":"fpartint","\u00bd":"half","\u2153":"frac13","\u00bc":"frac14","\u2155":"frac15","\u2159":"frac16","\u215b":"frac18","\u2154":"frac23","\u2156":"frac25","\u00be":"frac34","\u2157":"frac35","\u215c":"frac38","\u2158":"frac45","\u215a":"frac56","\u215d":"frac58","\u215e":"frac78","\u2044":"frasl","\u2322":"frown","\ud835\udcbb":"fscr","\u01f5":"gacute","\u0393":"Gamma","\u03b3":"gamma","\u03dc":"Gammad","\u2a86":"gap","\u011e":"Gbreve",
"\u011f":"gbreve","\u0122":"Gcedil","\u011c":"Gcirc","\u011d":"gcirc","\u0413":"Gcy","\u0433":"gcy","\u0120":"Gdot","\u0121":"gdot","\u2265":"ge","\u2267":"gE","\u2a8c":"gEl","\u22db":"gel","\u2a7e":"ges","\u2aa9":"gescc","\u2a80":"gesdot","\u2a82":"gesdoto","\u2a84":"gesdotol","\u22db\ufe00":"gesl","\u2a94":"gesles","\ud835\udd0a":"Gfr","\ud835\udd24":"gfr","\u226b":"gg","\u22d9":"Gg","\u2137":"gimel","\u0403":"GJcy","\u0453":"gjcy","\u2aa5":"gla","\u2277":"gl","\u2a92":"glE","\u2aa4":"glj","\u2a8a":"gnap",
"\u2a88":"gne","\u2269":"gnE","\u22e7":"gnsim","\ud835\udd3e":"Gopf","\ud835\udd58":"gopf","\u2aa2":"GreaterGreater","\u2273":"gsim","\ud835\udca2":"Gscr","\u210a":"gscr","\u2a8e":"gsime","\u2a90":"gsiml","\u2aa7":"gtcc","\u2a7a":"gtcir",">":"gt","\u22d7":"gtdot","\u2995":"gtlPar","\u2a7c":"gtquest","\u2978":"gtrarr","\u2269\ufe00":"gvnE","\u200a":"hairsp","\u210b":"Hscr","\u042a":"HARDcy","\u044a":"hardcy","\u2948":"harrcir","\u2194":"harr","\u21ad":"harrw","^":"Hat","\u210f":"hbar","\u0124":"Hcirc",
"\u0125":"hcirc","\u2665":"hearts","\u2026":"mldr","\u22b9":"hercon","\ud835\udd25":"hfr","\u210c":"Hfr","\u2925":"searhk","\u2926":"swarhk","\u21ff":"hoarr","\u223b":"homtht","\u21a9":"larrhk","\u21aa":"rarrhk","\ud835\udd59":"hopf","\u210d":"Hopf","\u2015":"horbar","\ud835\udcbd":"hscr","\u0126":"Hstrok","\u0127":"hstrok","\u2043":"hybull","\u00cd":"Iacute","\u00ed":"iacute","\u2063":"ic","\u00ce":"Icirc","\u00ee":"icirc","\u0418":"Icy","\u0438":"icy","\u0130":"Idot","\u0415":"IEcy","\u0435":"iecy",
"\u00a1":"iexcl","\ud835\udd26":"ifr","\u2111":"Im","\u00cc":"Igrave","\u00ec":"igrave","\u2148":"ii","\u2a0c":"qint","\u222d":"tint","\u29dc":"iinfin","\u2129":"iiota","\u0132":"IJlig","\u0133":"ijlig","\u012a":"Imacr","\u012b":"imacr","\u2110":"Iscr","\u0131":"imath","\u22b7":"imof","\u01b5":"imped","\u2105":"incare","\u221e":"infin","\u29dd":"infintie","\u22ba":"intcal","\u222b":"int","\u222c":"Int","\u2124":"Zopf","\u2a17":"intlarhk","\u2a3c":"iprod","\u2062":"it","\u0401":"IOcy","\u0451":"iocy",
"\u012e":"Iogon","\u012f":"iogon","\ud835\udd40":"Iopf","\ud835\udd5a":"iopf","\u0399":"Iota","\u03b9":"iota","\u00bf":"iquest","\ud835\udcbe":"iscr","\u22f5":"isindot","\u22f9":"isinE","\u22f4":"isins","\u22f3":"isinsv","\u0128":"Itilde","\u0129":"itilde","\u0406":"Iukcy","\u0456":"iukcy","\u00cf":"Iuml","\u00ef":"iuml","\u0134":"Jcirc","\u0135":"jcirc","\u0419":"Jcy","\u0439":"jcy","\ud835\udd0d":"Jfr","\ud835\udd27":"jfr","\u0237":"jmath","\ud835\udd41":"Jopf","\ud835\udd5b":"jopf","\ud835\udca5":"Jscr",
"\ud835\udcbf":"jscr","\u0408":"Jsercy","\u0458":"jsercy","\u0404":"Jukcy","\u0454":"jukcy","\u039a":"Kappa","\u03ba":"kappa","\u03f0":"kappav","\u0136":"Kcedil","\u0137":"kcedil","\u041a":"Kcy","\u043a":"kcy","\ud835\udd0e":"Kfr","\ud835\udd28":"kfr","\u0138":"kgreen","\u0425":"KHcy","\u0445":"khcy","\u040c":"KJcy","\u045c":"kjcy","\ud835\udd42":"Kopf","\ud835\udd5c":"kopf","\ud835\udca6":"Kscr","\ud835\udcc0":"kscr","\u21da":"lAarr","\u0139":"Lacute","\u013a":"lacute","\u29b4":"laemptyv","\u2112":"Lscr",
"\u039b":"Lambda","\u03bb":"lambda","\u27e8":"lang","\u27ea":"Lang","\u2991":"langd","\u2a85":"lap","\u00ab":"laquo","\u21e4":"larrb","\u291f":"larrbfs","\u2190":"larr","\u219e":"Larr","\u291d":"larrfs","\u21ab":"larrlp","\u2939":"larrpl","\u2973":"larrsim","\u21a2":"larrtl","\u2919":"latail","\u291b":"lAtail","\u2aab":"lat","\u2aad":"late","\u2aad\ufe00":"lates","\u290c":"lbarr","\u290e":"lBarr","\u2772":"lbbrk","{":"lcub","[":"lsqb","\u298b":"lbrke","\u298f":"lbrksld","\u298d":"lbrkslu","\u013d":"Lcaron",
"\u013e":"lcaron","\u013b":"Lcedil","\u013c":"lcedil","\u2308":"lceil","\u041b":"Lcy","\u043b":"lcy","\u2936":"ldca","\u201c":"ldquo","\u2967":"ldrdhar","\u294b":"ldrushar","\u21b2":"ldsh","\u2264":"le","\u2266":"lE","\u21c6":"lrarr","\u27e6":"lobrk","\u2961":"LeftDownTeeVector","\u2959":"LeftDownVectorBar","\u230a":"lfloor","\u21bc":"lharu","\u21c7":"llarr","\u21cb":"lrhar","\u294e":"LeftRightVector","\u21a4":"mapstoleft","\u295a":"LeftTeeVector","\u22cb":"lthree","\u29cf":"LeftTriangleBar","\u22b2":"vltri",
"\u22b4":"ltrie","\u2951":"LeftUpDownVector","\u2960":"LeftUpTeeVector","\u2958":"LeftUpVectorBar","\u21bf":"uharl","\u2952":"LeftVectorBar","\u2a8b":"lEg","\u22da":"leg","\u2a7d":"les","\u2aa8":"lescc","\u2a7f":"lesdot","\u2a81":"lesdoto","\u2a83":"lesdotor","\u22da\ufe00":"lesg","\u2a93":"lesges","\u22d6":"ltdot","\u2276":"lg","\u2aa1":"LessLess","\u2272":"lsim","\u297c":"lfisht","\ud835\udd0f":"Lfr","\ud835\udd29":"lfr","\u2a91":"lgE","\u2962":"lHar","\u296a":"lharul","\u2584":"lhblk","\u0409":"LJcy",
"\u0459":"ljcy","\u226a":"ll","\u22d8":"Ll","\u296b":"llhard","\u25fa":"lltri","\u013f":"Lmidot","\u0140":"lmidot","\u23b0":"lmoust","\u2a89":"lnap","\u2a87":"lne","\u2268":"lnE","\u22e6":"lnsim","\u27ec":"loang","\u21fd":"loarr","\u27f5":"xlarr","\u27f7":"xharr","\u27fc":"xmap","\u27f6":"xrarr","\u21ac":"rarrlp","\u2985":"lopar","\ud835\udd43":"Lopf","\ud835\udd5d":"lopf","\u2a2d":"loplus","\u2a34":"lotimes","\u2217":"lowast",_:"lowbar","\u2199":"swarr","\u2198":"searr","\u25ca":"loz","(":"lpar",
"\u2993":"lparlt","\u296d":"lrhard","\u200e":"lrm","\u22bf":"lrtri","\u2039":"lsaquo","\ud835\udcc1":"lscr","\u21b0":"lsh","\u2a8d":"lsime","\u2a8f":"lsimg","\u2018":"lsquo","\u201a":"sbquo","\u0141":"Lstrok","\u0142":"lstrok","\u2aa6":"ltcc","\u2a79":"ltcir","<":"lt","\u22c9":"ltimes","\u2976":"ltlarr","\u2a7b":"ltquest","\u25c3":"ltri","\u2996":"ltrPar","\u294a":"lurdshar","\u2966":"luruhar","\u2268\ufe00":"lvnE","\u00af":"macr","\u2642":"male","\u2720":"malt","\u2905":"Map","\u21a6":"map","\u21a5":"mapstoup",
"\u25ae":"marker","\u2a29":"mcomma","\u041c":"Mcy","\u043c":"mcy","\u2014":"mdash","\u223a":"mDDot","\u205f":"MediumSpace","\u2133":"Mscr","\ud835\udd10":"Mfr","\ud835\udd2a":"mfr","\u2127":"mho","\u00b5":"micro","\u2af0":"midcir","\u2223":"mid","\u2212":"minus","\u2a2a":"minusdu","\u2213":"mp","\u2adb":"mlcp","\u22a7":"models","\ud835\udd44":"Mopf","\ud835\udd5e":"mopf","\ud835\udcc2":"mscr","\u039c":"Mu","\u03bc":"mu","\u22b8":"mumap","\u0143":"Nacute","\u0144":"nacute","\u2220\u20d2":"nang","\u2249":"nap",
"\u2a70\u0338":"napE","\u224b\u0338":"napid","\u0149":"napos","\u266e":"natur","\u2115":"Nopf","\u00a0":"nbsp","\u224e\u0338":"nbump","\u224f\u0338":"nbumpe","\u2a43":"ncap","\u0147":"Ncaron","\u0148":"ncaron","\u0145":"Ncedil","\u0146":"ncedil","\u2247":"ncong","\u2a6d\u0338":"ncongdot","\u2a42":"ncup","\u041d":"Ncy","\u043d":"ncy","\u2013":"ndash","\u2924":"nearhk","\u2197":"nearr","\u21d7":"neArr","\u2260":"ne","\u2250\u0338":"nedot","\u200b":"ZeroWidthSpace","\u2262":"nequiv","\u2928":"toea",
"\u2242\u0338":"nesim","\n":"NewLine","\u2204":"nexist","\ud835\udd11":"Nfr","\ud835\udd2b":"nfr","\u2267\u0338":"ngE","\u2271":"nge","\u2a7e\u0338":"nges","\u22d9\u0338":"nGg","\u2275":"ngsim","\u226b\u20d2":"nGt","\u226f":"ngt","\u226b\u0338":"nGtv","\u21ae":"nharr","\u21ce":"nhArr","\u2af2":"nhpar","\u220b":"ni","\u22fc":"nis","\u22fa":"nisd","\u040a":"NJcy","\u045a":"njcy","\u219a":"nlarr","\u21cd":"nlArr","\u2025":"nldr","\u2266\u0338":"nlE","\u2270":"nle","\u2a7d\u0338":"nles","\u226e":"nlt",
"\u22d8\u0338":"nLl","\u2274":"nlsim","\u226a\u20d2":"nLt","\u22ea":"nltri","\u22ec":"nltrie","\u226a\u0338":"nLtv","\u2224":"nmid","\u2060":"NoBreak","\ud835\udd5f":"nopf","\u2aec":"Not","\u00ac":"not","\u226d":"NotCupCap","\u2226":"npar","\u2209":"notin","\u2279":"ntgl","\u22f5\u0338":"notindot","\u22f9\u0338":"notinE","\u22f7":"notinvb","\u22f6":"notinvc","\u29cf\u0338":"NotLeftTriangleBar","\u2278":"ntlg","\u2aa2\u0338":"NotNestedGreaterGreater","\u2aa1\u0338":"NotNestedLessLess","\u220c":"notni",
"\u22fe":"notnivb","\u22fd":"notnivc","\u2280":"npr","\u2aaf\u0338":"npre","\u22e0":"nprcue","\u29d0\u0338":"NotRightTriangleBar","\u22eb":"nrtri","\u22ed":"nrtrie","\u228f\u0338":"NotSquareSubset","\u22e2":"nsqsube","\u2290\u0338":"NotSquareSuperset","\u22e3":"nsqsupe","\u2282\u20d2":"vnsub","\u2288":"nsube","\u2281":"nsc","\u2ab0\u0338":"nsce","\u22e1":"nsccue","\u227f\u0338":"NotSucceedsTilde","\u2283\u20d2":"vnsup","\u2289":"nsupe","\u2241":"nsim","\u2244":"nsime","\u2afd\u20e5":"nparsl","\u2202\u0338":"npart",
"\u2a14":"npolint","\u2933\u0338":"nrarrc","\u219b":"nrarr","\u21cf":"nrArr","\u219d\u0338":"nrarrw","\ud835\udca9":"Nscr","\ud835\udcc3":"nscr","\u2284":"nsub","\u2ac5\u0338":"nsubE","\u2285":"nsup","\u2ac6\u0338":"nsupE","\u00d1":"Ntilde","\u00f1":"ntilde","\u039d":"Nu","\u03bd":"nu","#":"num","\u2116":"numero","\u2007":"numsp","\u224d\u20d2":"nvap","\u22ac":"nvdash","\u22ad":"nvDash","\u22ae":"nVdash","\u22af":"nVDash","\u2265\u20d2":"nvge",">\u20d2":"nvgt","\u2904":"nvHarr","\u29de":"nvinfin",
"\u2902":"nvlArr","\u2264\u20d2":"nvle","<\u20d2":"nvlt","\u22b4\u20d2":"nvltrie","\u2903":"nvrArr","\u22b5\u20d2":"nvrtrie","\u223c\u20d2":"nvsim","\u2923":"nwarhk","\u2196":"nwarr","\u21d6":"nwArr","\u2927":"nwnear","\u00d3":"Oacute","\u00f3":"oacute","\u00d4":"Ocirc","\u00f4":"ocirc","\u041e":"Ocy","\u043e":"ocy","\u0150":"Odblac","\u0151":"odblac","\u2a38":"odiv","\u29bc":"odsold","\u0152":"OElig","\u0153":"oelig","\u29bf":"ofcir","\ud835\udd12":"Ofr","\ud835\udd2c":"ofr","\u02db":"ogon","\u00d2":"Ograve",
"\u00f2":"ograve","\u29c1":"ogt","\u29b5":"ohbar","\u03a9":"ohm","\u29be":"olcir","\u29bb":"olcross","\u203e":"oline","\u29c0":"olt","\u014c":"Omacr","\u014d":"omacr","\u03c9":"omega","\u039f":"Omicron","\u03bf":"omicron","\u29b6":"omid","\ud835\udd46":"Oopf","\ud835\udd60":"oopf","\u29b7":"opar","\u29b9":"operp","\u2a54":"Or","\u2228":"or","\u2a5d":"ord","\u2134":"oscr","\u00aa":"ordf","\u00ba":"ordm","\u22b6":"origof","\u2a56":"oror","\u2a57":"orslope","\u2a5b":"orv","\ud835\udcaa":"Oscr","\u00d8":"Oslash",
"\u00f8":"oslash","\u2298":"osol","\u00d5":"Otilde","\u00f5":"otilde","\u2a36":"otimesas","\u2a37":"Otimes","\u00d6":"Ouml","\u00f6":"ouml","\u233d":"ovbar","\u23de":"OverBrace","\u23b4":"tbrk","\u23dc":"OverParenthesis","\u00b6":"para","\u2af3":"parsim","\u2afd":"parsl","\u2202":"part","\u041f":"Pcy","\u043f":"pcy","%":"percnt",".":"period","\u2030":"permil","\u2031":"pertenk","\ud835\udd13":"Pfr","\ud835\udd2d":"pfr","\u03a6":"Phi","\u03c6":"phi","\u03d5":"phiv","\u260e":"phone","\u03a0":"Pi","\u03c0":"pi",
"\u03d6":"piv","\u210e":"planckh","\u2a23":"plusacir","\u2a22":"pluscir","+":"plus","\u2a25":"plusdu","\u2a72":"pluse","\u00b1":"pm","\u2a26":"plussim","\u2a27":"plustwo","\u2a15":"pointint","\ud835\udd61":"popf","\u2119":"Popf","\u00a3":"pound","\u2ab7":"prap","\u2abb":"Pr","\u227a":"pr","\u227c":"prcue","\u2aaf":"pre","\u227e":"prsim","\u2ab9":"prnap","\u2ab5":"prnE","\u22e8":"prnsim","\u2ab3":"prE","\u2032":"prime","\u2033":"Prime","\u220f":"prod","\u232e":"profalar","\u2312":"profline","\u2313":"profsurf",
"\u221d":"prop","\u22b0":"prurel","\ud835\udcab":"Pscr","\ud835\udcc5":"pscr","\u03a8":"Psi","\u03c8":"psi","\u2008":"puncsp","\ud835\udd14":"Qfr","\ud835\udd2e":"qfr","\ud835\udd62":"qopf","\u211a":"Qopf","\u2057":"qprime","\ud835\udcac":"Qscr","\ud835\udcc6":"qscr","\u2a16":"quatint","?":"quest",'"':"quot","\u21db":"rAarr","\u223d\u0331":"race","\u0154":"Racute","\u0155":"racute","\u221a":"Sqrt","\u29b3":"raemptyv","\u27e9":"rang","\u27eb":"Rang","\u2992":"rangd","\u29a5":"range","\u00bb":"raquo",
"\u2975":"rarrap","\u21e5":"rarrb","\u2920":"rarrbfs","\u2933":"rarrc","\u2192":"rarr","\u21a0":"Rarr","\u291e":"rarrfs","\u2945":"rarrpl","\u2974":"rarrsim","\u2916":"Rarrtl","\u21a3":"rarrtl","\u219d":"rarrw","\u291a":"ratail","\u291c":"rAtail","\u2236":"ratio","\u2773":"rbbrk","}":"rcub","]":"rsqb","\u298c":"rbrke","\u298e":"rbrksld","\u2990":"rbrkslu","\u0158":"Rcaron","\u0159":"rcaron","\u0156":"Rcedil","\u0157":"rcedil","\u2309":"rceil","\u0420":"Rcy","\u0440":"rcy","\u2937":"rdca","\u2969":"rdldhar",
"\u21b3":"rdsh","\u211c":"Re","\u211b":"Rscr","\u211d":"Ropf","\u25ad":"rect","\u297d":"rfisht","\u230b":"rfloor","\ud835\udd2f":"rfr","\u2964":"rHar","\u21c0":"rharu","\u296c":"rharul","\u03a1":"Rho","\u03c1":"rho","\u03f1":"rhov","\u21c4":"rlarr","\u27e7":"robrk","\u295d":"RightDownTeeVector","\u2955":"RightDownVectorBar","\u21c9":"rrarr","\u22a2":"vdash","\u295b":"RightTeeVector","\u22cc":"rthree","\u29d0":"RightTriangleBar","\u22b3":"vrtri","\u22b5":"rtrie","\u294f":"RightUpDownVector","\u295c":"RightUpTeeVector",
"\u2954":"RightUpVectorBar","\u21be":"uharr","\u2953":"RightVectorBar","\u02da":"ring","\u200f":"rlm","\u23b1":"rmoust","\u2aee":"rnmid","\u27ed":"roang","\u21fe":"roarr","\u2986":"ropar","\ud835\udd63":"ropf","\u2a2e":"roplus","\u2a35":"rotimes","\u2970":"RoundImplies",")":"rpar","\u2994":"rpargt","\u2a12":"rppolint","\u203a":"rsaquo","\ud835\udcc7":"rscr","\u21b1":"rsh","\u22ca":"rtimes","\u25b9":"rtri","\u29ce":"rtriltri","\u29f4":"RuleDelayed","\u2968":"ruluhar","\u211e":"rx","\u015a":"Sacute",
"\u015b":"sacute","\u2ab8":"scap","\u0160":"Scaron","\u0161":"scaron","\u2abc":"Sc","\u227b":"sc","\u227d":"sccue","\u2ab0":"sce","\u2ab4":"scE","\u015e":"Scedil","\u015f":"scedil","\u015c":"Scirc","\u015d":"scirc","\u2aba":"scnap","\u2ab6":"scnE","\u22e9":"scnsim","\u2a13":"scpolint","\u227f":"scsim","\u0421":"Scy","\u0441":"scy","\u22c5":"sdot","\u2a66":"sdote","\u21d8":"seArr","\u00a7":"sect",";":"semi","\u2929":"tosa","\u2736":"sext","\ud835\udd16":"Sfr","\ud835\udd30":"sfr","\u266f":"sharp",
"\u0429":"SHCHcy","\u0449":"shchcy","\u0428":"SHcy","\u0448":"shcy","\u2191":"uarr","\u00ad":"shy","\u03a3":"Sigma","\u03c3":"sigma","\u03c2":"sigmaf","\u223c":"sim","\u2a6a":"simdot","\u2243":"sime","\u2a9e":"simg","\u2aa0":"simgE","\u2a9d":"siml","\u2a9f":"simlE","\u2246":"simne","\u2a24":"simplus","\u2972":"simrarr","\u2a33":"smashp","\u29e4":"smeparsl","\u2323":"smile","\u2aaa":"smt","\u2aac":"smte","\u2aac\ufe00":"smtes","\u042c":"SOFTcy","\u044c":"softcy","\u233f":"solbar","\u29c4":"solb","/":"sol",
"\ud835\udd4a":"Sopf","\ud835\udd64":"sopf","\u2660":"spades","\u2293":"sqcap","\u2293\ufe00":"sqcaps","\u2294":"sqcup","\u2294\ufe00":"sqcups","\u228f":"sqsub","\u2291":"sqsube","\u2290":"sqsup","\u2292":"sqsupe","\u25a1":"squ","\ud835\udcae":"Sscr","\ud835\udcc8":"sscr","\u22c6":"Star","\u2606":"star","\u2282":"sub","\u22d0":"Sub","\u2abd":"subdot","\u2ac5":"subE","\u2286":"sube","\u2ac3":"subedot","\u2ac1":"submult","\u2acb":"subnE","\u228a":"subne","\u2abf":"subplus","\u2979":"subrarr","\u2ac7":"subsim",
"\u2ad5":"subsub","\u2ad3":"subsup","\u2211":"sum","\u266a":"sung","\u00b9":"sup1","\u00b2":"sup2","\u00b3":"sup3","\u2283":"sup","\u22d1":"Sup","\u2abe":"supdot","\u2ad8":"supdsub","\u2ac6":"supE","\u2287":"supe","\u2ac4":"supedot","\u27c9":"suphsol","\u2ad7":"suphsub","\u297b":"suplarr","\u2ac2":"supmult","\u2acc":"supnE","\u228b":"supne","\u2ac0":"supplus","\u2ac8":"supsim","\u2ad4":"supsub","\u2ad6":"supsup","\u21d9":"swArr","\u292a":"swnwar","\u00df":"szlig","\t":"Tab","\u2316":"target","\u03a4":"Tau",
"\u03c4":"tau","\u0164":"Tcaron","\u0165":"tcaron","\u0162":"Tcedil","\u0163":"tcedil","\u0422":"Tcy","\u0442":"tcy","\u20db":"tdot","\u2315":"telrec","\ud835\udd17":"Tfr","\ud835\udd31":"tfr","\u2234":"there4","\u0398":"Theta","\u03b8":"theta","\u03d1":"thetav","\u205f\u200a":"ThickSpace","\u2009":"thinsp","\u00de":"THORN","\u00fe":"thorn","\u2a31":"timesbar","\u00d7":"times","\u2a30":"timesd","\u2336":"topbot","\u2af1":"topcir","\ud835\udd4b":"Topf","\ud835\udd65":"topf","\u2ada":"topfork","\u2034":"tprime",
"\u2122":"trade","\u25b5":"utri","\u225c":"trie","\u25ec":"tridot","\u2a3a":"triminus","\u2a39":"triplus","\u29cd":"trisb","\u2a3b":"tritime","\u23e2":"trpezium","\ud835\udcaf":"Tscr","\ud835\udcc9":"tscr","\u0426":"TScy","\u0446":"tscy","\u040b":"TSHcy","\u045b":"tshcy","\u0166":"Tstrok","\u0167":"tstrok","\u00da":"Uacute","\u00fa":"uacute","\u219f":"Uarr","\u2949":"Uarrocir","\u040e":"Ubrcy","\u045e":"ubrcy","\u016c":"Ubreve","\u016d":"ubreve","\u00db":"Ucirc","\u00fb":"ucirc","\u0423":"Ucy","\u0443":"ucy",
"\u21c5":"udarr","\u0170":"Udblac","\u0171":"udblac","\u296e":"udhar","\u297e":"ufisht","\ud835\udd18":"Ufr","\ud835\udd32":"ufr","\u00d9":"Ugrave","\u00f9":"ugrave","\u2963":"uHar","\u2580":"uhblk","\u231c":"ulcorn","\u230f":"ulcrop","\u25f8":"ultri","\u016a":"Umacr","\u016b":"umacr","\u23df":"UnderBrace","\u23dd":"UnderParenthesis","\u228e":"uplus","\u0172":"Uogon","\u0173":"uogon","\ud835\udd4c":"Uopf","\ud835\udd66":"uopf","\u2912":"UpArrowBar","\u2195":"varr","\u03c5":"upsi","\u03d2":"Upsi",
"\u03a5":"Upsilon","\u21c8":"uuarr","\u231d":"urcorn","\u230e":"urcrop","\u016e":"Uring","\u016f":"uring","\u25f9":"urtri","\ud835\udcb0":"Uscr","\ud835\udcca":"uscr","\u22f0":"utdot","\u0168":"Utilde","\u0169":"utilde","\u00dc":"Uuml","\u00fc":"uuml","\u29a7":"uwangle","\u299c":"vangrt","\u228a\ufe00":"vsubne","\u2acb\ufe00":"vsubnE","\u228b\ufe00":"vsupne","\u2acc\ufe00":"vsupnE","\u2ae8":"vBar","\u2aeb":"Vbar","\u2ae9":"vBarv","\u0412":"Vcy","\u0432":"vcy","\u22a9":"Vdash","\u22ab":"VDash","\u2ae6":"Vdashl",
"\u22bb":"veebar","\u225a":"veeeq","\u22ee":"vellip","|":"vert","\u2016":"Vert","\u2758":"VerticalSeparator","\u2240":"wr","\ud835\udd19":"Vfr","\ud835\udd33":"vfr","\ud835\udd4d":"Vopf","\ud835\udd67":"vopf","\ud835\udcb1":"Vscr","\ud835\udccb":"vscr","\u22aa":"Vvdash","\u299a":"vzigzag","\u0174":"Wcirc","\u0175":"wcirc","\u2a5f":"wedbar","\u2259":"wedgeq","\u2118":"wp","\ud835\udd1a":"Wfr","\ud835\udd34":"wfr","\ud835\udd4e":"Wopf","\ud835\udd68":"wopf","\ud835\udcb2":"Wscr","\ud835\udccc":"wscr",
"\ud835\udd1b":"Xfr","\ud835\udd35":"xfr","\u039e":"Xi","\u03be":"xi","\u22fb":"xnis","\ud835\udd4f":"Xopf","\ud835\udd69":"xopf","\ud835\udcb3":"Xscr","\ud835\udccd":"xscr","\u00dd":"Yacute","\u00fd":"yacute","\u042f":"YAcy","\u044f":"yacy","\u0176":"Ycirc","\u0177":"ycirc","\u042b":"Ycy","\u044b":"ycy","\u00a5":"yen","\ud835\udd1c":"Yfr","\ud835\udd36":"yfr","\u0407":"YIcy","\u0457":"yicy","\ud835\udd50":"Yopf","\ud835\udd6a":"yopf","\ud835\udcb4":"Yscr","\ud835\udcce":"yscr","\u042e":"YUcy","\u044e":"yucy",
"\u00ff":"yuml","\u0178":"Yuml","\u0179":"Zacute","\u017a":"zacute","\u017d":"Zcaron","\u017e":"zcaron","\u0417":"Zcy","\u0437":"zcy","\u017b":"Zdot","\u017c":"zdot","\u2128":"Zfr","\u0396":"Zeta","\u03b6":"zeta","\ud835\udd37":"zfr","\u0416":"ZHcy","\u0436":"zhcy","\u21dd":"zigrarr","\ud835\udd6b":"zopf","\ud835\udcb5":"Zscr","\ud835\udccf":"zscr","\u200d":"zwj","\u200c":"zwnj"},l=/["&'<>`]/g,G={'"':"&quot;","&":"&amp;","'":"&#x27;","<":"&lt;",">":"&gt;","`":"&#x60;"},H=/&#(?:[xX][^a-fA-F0-9]|[^0-9xX])/,
I=/[\0-\x08\x0B\x0E-\x1F\x7F-\x9F\uFDD0-\uFDEF\uFFFE\uFFFF]|[\uD83F\uD87F\uD8BF\uD8FF\uD93F\uD97F\uD9BF\uD9FF\uDA3F\uDA7F\uDABF\uDAFF\uDB3F\uDB7F\uDBBF\uDBFF][\uDFFE\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/,J=/&#([0-9]+)(;?)|&#[xX]([a-fA-F0-9]+)(;?)|&([0-9a-zA-Z]+);|&(Aacute|iacute|Uacute|plusmn|otilde|Otilde|Agrave|agrave|yacute|Yacute|oslash|Oslash|Atilde|atilde|brvbar|Ccedil|ccedil|ograve|curren|divide|Eacute|eacute|Ograve|oacute|Egrave|egrave|ugrave|frac12|frac14|frac34|Ugrave|Oacute|Iacute|ntilde|Ntilde|uacute|middot|Igrave|igrave|iquest|aacute|laquo|THORN|micro|iexcl|icirc|Icirc|Acirc|ucirc|ecirc|Ocirc|ocirc|Ecirc|Ucirc|aring|Aring|aelig|AElig|acute|pound|raquo|acirc|times|thorn|szlig|cedil|COPY|Auml|ordf|ordm|uuml|macr|Uuml|auml|Ouml|ouml|para|nbsp|Euml|quot|QUOT|euml|yuml|cent|sect|copy|sup1|sup2|sup3|Iuml|iuml|shy|eth|reg|not|yen|amp|AMP|REG|uml|ETH|deg|gt|GT|LT|lt)([=a-zA-Z0-9])?/g,
x={Aacute:"\u00c1",aacute:"\u00e1",Abreve:"\u0102",abreve:"\u0103",ac:"\u223e",acd:"\u223f",acE:"\u223e\u0333",Acirc:"\u00c2",acirc:"\u00e2",acute:"\u00b4",Acy:"\u0410",acy:"\u0430",AElig:"\u00c6",aelig:"\u00e6",af:"\u2061",Afr:"\ud835\udd04",afr:"\ud835\udd1e",Agrave:"\u00c0",agrave:"\u00e0",alefsym:"\u2135",aleph:"\u2135",Alpha:"\u0391",alpha:"\u03b1",Amacr:"\u0100",amacr:"\u0101",amalg:"\u2a3f",amp:"&",AMP:"&",andand:"\u2a55",And:"\u2a53",and:"\u2227",andd:"\u2a5c",andslope:"\u2a58",andv:"\u2a5a",
ang:"\u2220",ange:"\u29a4",angle:"\u2220",angmsdaa:"\u29a8",angmsdab:"\u29a9",angmsdac:"\u29aa",angmsdad:"\u29ab",angmsdae:"\u29ac",angmsdaf:"\u29ad",angmsdag:"\u29ae",angmsdah:"\u29af",angmsd:"\u2221",angrt:"\u221f",angrtvb:"\u22be",angrtvbd:"\u299d",angsph:"\u2222",angst:"\u00c5",angzarr:"\u237c",Aogon:"\u0104",aogon:"\u0105",Aopf:"\ud835\udd38",aopf:"\ud835\udd52",apacir:"\u2a6f",ap:"\u2248",apE:"\u2a70",ape:"\u224a",apid:"\u224b",apos:"'",ApplyFunction:"\u2061",approx:"\u2248",approxeq:"\u224a",
Aring:"\u00c5",aring:"\u00e5",Ascr:"\ud835\udc9c",ascr:"\ud835\udcb6",Assign:"\u2254",ast:"*",asymp:"\u2248",asympeq:"\u224d",Atilde:"\u00c3",atilde:"\u00e3",Auml:"\u00c4",auml:"\u00e4",awconint:"\u2233",awint:"\u2a11",backcong:"\u224c",backepsilon:"\u03f6",backprime:"\u2035",backsim:"\u223d",backsimeq:"\u22cd",Backslash:"\u2216",Barv:"\u2ae7",barvee:"\u22bd",barwed:"\u2305",Barwed:"\u2306",barwedge:"\u2305",bbrk:"\u23b5",bbrktbrk:"\u23b6",bcong:"\u224c",Bcy:"\u0411",bcy:"\u0431",bdquo:"\u201e",becaus:"\u2235",
because:"\u2235",Because:"\u2235",bemptyv:"\u29b0",bepsi:"\u03f6",bernou:"\u212c",Bernoullis:"\u212c",Beta:"\u0392",beta:"\u03b2",beth:"\u2136",between:"\u226c",Bfr:"\ud835\udd05",bfr:"\ud835\udd1f",bigcap:"\u22c2",bigcirc:"\u25ef",bigcup:"\u22c3",bigodot:"\u2a00",bigoplus:"\u2a01",bigotimes:"\u2a02",bigsqcup:"\u2a06",bigstar:"\u2605",bigtriangledown:"\u25bd",bigtriangleup:"\u25b3",biguplus:"\u2a04",bigvee:"\u22c1",bigwedge:"\u22c0",bkarow:"\u290d",blacklozenge:"\u29eb",blacksquare:"\u25aa",blacktriangle:"\u25b4",
blacktriangledown:"\u25be",blacktriangleleft:"\u25c2",blacktriangleright:"\u25b8",blank:"\u2423",blk12:"\u2592",blk14:"\u2591",blk34:"\u2593",block:"\u2588",bne:"=\u20e5",bnequiv:"\u2261\u20e5",bNot:"\u2aed",bnot:"\u2310",Bopf:"\ud835\udd39",bopf:"\ud835\udd53",bot:"\u22a5",bottom:"\u22a5",bowtie:"\u22c8",boxbox:"\u29c9",boxdl:"\u2510",boxdL:"\u2555",boxDl:"\u2556",boxDL:"\u2557",boxdr:"\u250c",boxdR:"\u2552",boxDr:"\u2553",boxDR:"\u2554",boxh:"\u2500",boxH:"\u2550",boxhd:"\u252c",boxHd:"\u2564",
boxhD:"\u2565",boxHD:"\u2566",boxhu:"\u2534",boxHu:"\u2567",boxhU:"\u2568",boxHU:"\u2569",boxminus:"\u229f",boxplus:"\u229e",boxtimes:"\u22a0",boxul:"\u2518",boxuL:"\u255b",boxUl:"\u255c",boxUL:"\u255d",boxur:"\u2514",boxuR:"\u2558",boxUr:"\u2559",boxUR:"\u255a",boxv:"\u2502",boxV:"\u2551",boxvh:"\u253c",boxvH:"\u256a",boxVh:"\u256b",boxVH:"\u256c",boxvl:"\u2524",boxvL:"\u2561",boxVl:"\u2562",boxVL:"\u2563",boxvr:"\u251c",boxvR:"\u255e",boxVr:"\u255f",boxVR:"\u2560",bprime:"\u2035",breve:"\u02d8",
Breve:"\u02d8",brvbar:"\u00a6",bscr:"\ud835\udcb7",Bscr:"\u212c",bsemi:"\u204f",bsim:"\u223d",bsime:"\u22cd",bsolb:"\u29c5",bsol:"\\",bsolhsub:"\u27c8",bull:"\u2022",bullet:"\u2022",bump:"\u224e",bumpE:"\u2aae",bumpe:"\u224f",Bumpeq:"\u224e",bumpeq:"\u224f",Cacute:"\u0106",cacute:"\u0107",capand:"\u2a44",capbrcup:"\u2a49",capcap:"\u2a4b",cap:"\u2229",Cap:"\u22d2",capcup:"\u2a47",capdot:"\u2a40",CapitalDifferentialD:"\u2145",caps:"\u2229\ufe00",caret:"\u2041",caron:"\u02c7",Cayleys:"\u212d",ccaps:"\u2a4d",
Ccaron:"\u010c",ccaron:"\u010d",Ccedil:"\u00c7",ccedil:"\u00e7",Ccirc:"\u0108",ccirc:"\u0109",Cconint:"\u2230",ccups:"\u2a4c",ccupssm:"\u2a50",Cdot:"\u010a",cdot:"\u010b",cedil:"\u00b8",Cedilla:"\u00b8",cemptyv:"\u29b2",cent:"\u00a2",centerdot:"\u00b7",CenterDot:"\u00b7",cfr:"\ud835\udd20",Cfr:"\u212d",CHcy:"\u0427",chcy:"\u0447",check:"\u2713",checkmark:"\u2713",Chi:"\u03a7",chi:"\u03c7",circ:"\u02c6",circeq:"\u2257",circlearrowleft:"\u21ba",circlearrowright:"\u21bb",circledast:"\u229b",circledcirc:"\u229a",
circleddash:"\u229d",CircleDot:"\u2299",circledR:"\u00ae",circledS:"\u24c8",CircleMinus:"\u2296",CirclePlus:"\u2295",CircleTimes:"\u2297",cir:"\u25cb",cirE:"\u29c3",cire:"\u2257",cirfnint:"\u2a10",cirmid:"\u2aef",cirscir:"\u29c2",ClockwiseContourIntegral:"\u2232",CloseCurlyDoubleQuote:"\u201d",CloseCurlyQuote:"\u2019",clubs:"\u2663",clubsuit:"\u2663",colon:":",Colon:"\u2237",Colone:"\u2a74",colone:"\u2254",coloneq:"\u2254",comma:",",commat:"@",comp:"\u2201",compfn:"\u2218",complement:"\u2201",complexes:"\u2102",
cong:"\u2245",congdot:"\u2a6d",Congruent:"\u2261",conint:"\u222e",Conint:"\u222f",ContourIntegral:"\u222e",copf:"\ud835\udd54",Copf:"\u2102",coprod:"\u2210",Coproduct:"\u2210",copy:"\u00a9",COPY:"\u00a9",copysr:"\u2117",CounterClockwiseContourIntegral:"\u2233",crarr:"\u21b5",cross:"\u2717",Cross:"\u2a2f",Cscr:"\ud835\udc9e",cscr:"\ud835\udcb8",csub:"\u2acf",csube:"\u2ad1",csup:"\u2ad0",csupe:"\u2ad2",ctdot:"\u22ef",cudarrl:"\u2938",cudarrr:"\u2935",cuepr:"\u22de",cuesc:"\u22df",cularr:"\u21b6",cularrp:"\u293d",
cupbrcap:"\u2a48",cupcap:"\u2a46",CupCap:"\u224d",cup:"\u222a",Cup:"\u22d3",cupcup:"\u2a4a",cupdot:"\u228d",cupor:"\u2a45",cups:"\u222a\ufe00",curarr:"\u21b7",curarrm:"\u293c",curlyeqprec:"\u22de",curlyeqsucc:"\u22df",curlyvee:"\u22ce",curlywedge:"\u22cf",curren:"\u00a4",curvearrowleft:"\u21b6",curvearrowright:"\u21b7",cuvee:"\u22ce",cuwed:"\u22cf",cwconint:"\u2232",cwint:"\u2231",cylcty:"\u232d",dagger:"\u2020",Dagger:"\u2021",daleth:"\u2138",darr:"\u2193",Darr:"\u21a1",dArr:"\u21d3",dash:"\u2010",
Dashv:"\u2ae4",dashv:"\u22a3",dbkarow:"\u290f",dblac:"\u02dd",Dcaron:"\u010e",dcaron:"\u010f",Dcy:"\u0414",dcy:"\u0434",ddagger:"\u2021",ddarr:"\u21ca",DD:"\u2145",dd:"\u2146",DDotrahd:"\u2911",ddotseq:"\u2a77",deg:"\u00b0",Del:"\u2207",Delta:"\u0394",delta:"\u03b4",demptyv:"\u29b1",dfisht:"\u297f",Dfr:"\ud835\udd07",dfr:"\ud835\udd21",dHar:"\u2965",dharl:"\u21c3",dharr:"\u21c2",DiacriticalAcute:"\u00b4",DiacriticalDot:"\u02d9",DiacriticalDoubleAcute:"\u02dd",DiacriticalGrave:"`",DiacriticalTilde:"\u02dc",
diam:"\u22c4",diamond:"\u22c4",Diamond:"\u22c4",diamondsuit:"\u2666",diams:"\u2666",die:"\u00a8",DifferentialD:"\u2146",digamma:"\u03dd",disin:"\u22f2",div:"\u00f7",divide:"\u00f7",divideontimes:"\u22c7",divonx:"\u22c7",DJcy:"\u0402",djcy:"\u0452",dlcorn:"\u231e",dlcrop:"\u230d",dollar:"$",Dopf:"\ud835\udd3b",dopf:"\ud835\udd55",Dot:"\u00a8",dot:"\u02d9",DotDot:"\u20dc",doteq:"\u2250",doteqdot:"\u2251",DotEqual:"\u2250",dotminus:"\u2238",dotplus:"\u2214",dotsquare:"\u22a1",doublebarwedge:"\u2306",
DoubleContourIntegral:"\u222f",DoubleDot:"\u00a8",DoubleDownArrow:"\u21d3",DoubleLeftArrow:"\u21d0",DoubleLeftRightArrow:"\u21d4",DoubleLeftTee:"\u2ae4",DoubleLongLeftArrow:"\u27f8",DoubleLongLeftRightArrow:"\u27fa",DoubleLongRightArrow:"\u27f9",DoubleRightArrow:"\u21d2",DoubleRightTee:"\u22a8",DoubleUpArrow:"\u21d1",DoubleUpDownArrow:"\u21d5",DoubleVerticalBar:"\u2225",DownArrowBar:"\u2913",downarrow:"\u2193",DownArrow:"\u2193",Downarrow:"\u21d3",DownArrowUpArrow:"\u21f5",DownBreve:"\u0311",downdownarrows:"\u21ca",
downharpoonleft:"\u21c3",downharpoonright:"\u21c2",DownLeftRightVector:"\u2950",DownLeftTeeVector:"\u295e",DownLeftVectorBar:"\u2956",DownLeftVector:"\u21bd",DownRightTeeVector:"\u295f",DownRightVectorBar:"\u2957",DownRightVector:"\u21c1",DownTeeArrow:"\u21a7",DownTee:"\u22a4",drbkarow:"\u2910",drcorn:"\u231f",drcrop:"\u230c",Dscr:"\ud835\udc9f",dscr:"\ud835\udcb9",DScy:"\u0405",dscy:"\u0455",dsol:"\u29f6",Dstrok:"\u0110",dstrok:"\u0111",dtdot:"\u22f1",dtri:"\u25bf",dtrif:"\u25be",duarr:"\u21f5",
duhar:"\u296f",dwangle:"\u29a6",DZcy:"\u040f",dzcy:"\u045f",dzigrarr:"\u27ff",Eacute:"\u00c9",eacute:"\u00e9",easter:"\u2a6e",Ecaron:"\u011a",ecaron:"\u011b",Ecirc:"\u00ca",ecirc:"\u00ea",ecir:"\u2256",ecolon:"\u2255",Ecy:"\u042d",ecy:"\u044d",eDDot:"\u2a77",Edot:"\u0116",edot:"\u0117",eDot:"\u2251",ee:"\u2147",efDot:"\u2252",Efr:"\ud835\udd08",efr:"\ud835\udd22",eg:"\u2a9a",Egrave:"\u00c8",egrave:"\u00e8",egs:"\u2a96",egsdot:"\u2a98",el:"\u2a99",Element:"\u2208",elinters:"\u23e7",ell:"\u2113",els:"\u2a95",
elsdot:"\u2a97",Emacr:"\u0112",emacr:"\u0113",empty:"\u2205",emptyset:"\u2205",EmptySmallSquare:"\u25fb",emptyv:"\u2205",EmptyVerySmallSquare:"\u25ab",emsp13:"\u2004",emsp14:"\u2005",emsp:"\u2003",ENG:"\u014a",eng:"\u014b",ensp:"\u2002",Eogon:"\u0118",eogon:"\u0119",Eopf:"\ud835\udd3c",eopf:"\ud835\udd56",epar:"\u22d5",eparsl:"\u29e3",eplus:"\u2a71",epsi:"\u03b5",Epsilon:"\u0395",epsilon:"\u03b5",epsiv:"\u03f5",eqcirc:"\u2256",eqcolon:"\u2255",eqsim:"\u2242",eqslantgtr:"\u2a96",eqslantless:"\u2a95",
Equal:"\u2a75",equals:"=",EqualTilde:"\u2242",equest:"\u225f",Equilibrium:"\u21cc",equiv:"\u2261",equivDD:"\u2a78",eqvparsl:"\u29e5",erarr:"\u2971",erDot:"\u2253",escr:"\u212f",Escr:"\u2130",esdot:"\u2250",Esim:"\u2a73",esim:"\u2242",Eta:"\u0397",eta:"\u03b7",ETH:"\u00d0",eth:"\u00f0",Euml:"\u00cb",euml:"\u00eb",euro:"\u20ac",excl:"!",exist:"\u2203",Exists:"\u2203",expectation:"\u2130",exponentiale:"\u2147",ExponentialE:"\u2147",fallingdotseq:"\u2252",Fcy:"\u0424",fcy:"\u0444",female:"\u2640",ffilig:"\ufb03",
fflig:"\ufb00",ffllig:"\ufb04",Ffr:"\ud835\udd09",ffr:"\ud835\udd23",filig:"\ufb01",FilledSmallSquare:"\u25fc",FilledVerySmallSquare:"\u25aa",fjlig:"fj",flat:"\u266d",fllig:"\ufb02",fltns:"\u25b1",fnof:"\u0192",Fopf:"\ud835\udd3d",fopf:"\ud835\udd57",forall:"\u2200",ForAll:"\u2200",fork:"\u22d4",forkv:"\u2ad9",Fouriertrf:"\u2131",fpartint:"\u2a0d",frac12:"\u00bd",frac13:"\u2153",frac14:"\u00bc",frac15:"\u2155",frac16:"\u2159",frac18:"\u215b",frac23:"\u2154",frac25:"\u2156",frac34:"\u00be",frac35:"\u2157",
frac38:"\u215c",frac45:"\u2158",frac56:"\u215a",frac58:"\u215d",frac78:"\u215e",frasl:"\u2044",frown:"\u2322",fscr:"\ud835\udcbb",Fscr:"\u2131",gacute:"\u01f5",Gamma:"\u0393",gamma:"\u03b3",Gammad:"\u03dc",gammad:"\u03dd",gap:"\u2a86",Gbreve:"\u011e",gbreve:"\u011f",Gcedil:"\u0122",Gcirc:"\u011c",gcirc:"\u011d",Gcy:"\u0413",gcy:"\u0433",Gdot:"\u0120",gdot:"\u0121",ge:"\u2265",gE:"\u2267",gEl:"\u2a8c",gel:"\u22db",geq:"\u2265",geqq:"\u2267",geqslant:"\u2a7e",gescc:"\u2aa9",ges:"\u2a7e",gesdot:"\u2a80",
gesdoto:"\u2a82",gesdotol:"\u2a84",gesl:"\u22db\ufe00",gesles:"\u2a94",Gfr:"\ud835\udd0a",gfr:"\ud835\udd24",gg:"\u226b",Gg:"\u22d9",ggg:"\u22d9",gimel:"\u2137",GJcy:"\u0403",gjcy:"\u0453",gla:"\u2aa5",gl:"\u2277",glE:"\u2a92",glj:"\u2aa4",gnap:"\u2a8a",gnapprox:"\u2a8a",gne:"\u2a88",gnE:"\u2269",gneq:"\u2a88",gneqq:"\u2269",gnsim:"\u22e7",Gopf:"\ud835\udd3e",gopf:"\ud835\udd58",grave:"`",GreaterEqual:"\u2265",GreaterEqualLess:"\u22db",GreaterFullEqual:"\u2267",GreaterGreater:"\u2aa2",GreaterLess:"\u2277",
GreaterSlantEqual:"\u2a7e",GreaterTilde:"\u2273",Gscr:"\ud835\udca2",gscr:"\u210a",gsim:"\u2273",gsime:"\u2a8e",gsiml:"\u2a90",gtcc:"\u2aa7",gtcir:"\u2a7a",gt:">",GT:">",Gt:"\u226b",gtdot:"\u22d7",gtlPar:"\u2995",gtquest:"\u2a7c",gtrapprox:"\u2a86",gtrarr:"\u2978",gtrdot:"\u22d7",gtreqless:"\u22db",gtreqqless:"\u2a8c",gtrless:"\u2277",gtrsim:"\u2273",gvertneqq:"\u2269\ufe00",gvnE:"\u2269\ufe00",Hacek:"\u02c7",hairsp:"\u200a",half:"\u00bd",hamilt:"\u210b",HARDcy:"\u042a",hardcy:"\u044a",harrcir:"\u2948",
harr:"\u2194",hArr:"\u21d4",harrw:"\u21ad",Hat:"^",hbar:"\u210f",Hcirc:"\u0124",hcirc:"\u0125",hearts:"\u2665",heartsuit:"\u2665",hellip:"\u2026",hercon:"\u22b9",hfr:"\ud835\udd25",Hfr:"\u210c",HilbertSpace:"\u210b",hksearow:"\u2925",hkswarow:"\u2926",hoarr:"\u21ff",homtht:"\u223b",hookleftarrow:"\u21a9",hookrightarrow:"\u21aa",hopf:"\ud835\udd59",Hopf:"\u210d",horbar:"\u2015",HorizontalLine:"\u2500",hscr:"\ud835\udcbd",Hscr:"\u210b",hslash:"\u210f",Hstrok:"\u0126",hstrok:"\u0127",HumpDownHump:"\u224e",
HumpEqual:"\u224f",hybull:"\u2043",hyphen:"\u2010",Iacute:"\u00cd",iacute:"\u00ed",ic:"\u2063",Icirc:"\u00ce",icirc:"\u00ee",Icy:"\u0418",icy:"\u0438",Idot:"\u0130",IEcy:"\u0415",iecy:"\u0435",iexcl:"\u00a1",iff:"\u21d4",ifr:"\ud835\udd26",Ifr:"\u2111",Igrave:"\u00cc",igrave:"\u00ec",ii:"\u2148",iiiint:"\u2a0c",iiint:"\u222d",iinfin:"\u29dc",iiota:"\u2129",IJlig:"\u0132",ijlig:"\u0133",Imacr:"\u012a",imacr:"\u012b",image:"\u2111",ImaginaryI:"\u2148",imagline:"\u2110",imagpart:"\u2111",imath:"\u0131",
Im:"\u2111",imof:"\u22b7",imped:"\u01b5",Implies:"\u21d2",incare:"\u2105","in":"\u2208",infin:"\u221e",infintie:"\u29dd",inodot:"\u0131",intcal:"\u22ba","int":"\u222b",Int:"\u222c",integers:"\u2124",Integral:"\u222b",intercal:"\u22ba",Intersection:"\u22c2",intlarhk:"\u2a17",intprod:"\u2a3c",InvisibleComma:"\u2063",InvisibleTimes:"\u2062",IOcy:"\u0401",iocy:"\u0451",Iogon:"\u012e",iogon:"\u012f",Iopf:"\ud835\udd40",iopf:"\ud835\udd5a",Iota:"\u0399",iota:"\u03b9",iprod:"\u2a3c",iquest:"\u00bf",iscr:"\ud835\udcbe",
Iscr:"\u2110",isin:"\u2208",isindot:"\u22f5",isinE:"\u22f9",isins:"\u22f4",isinsv:"\u22f3",isinv:"\u2208",it:"\u2062",Itilde:"\u0128",itilde:"\u0129",Iukcy:"\u0406",iukcy:"\u0456",Iuml:"\u00cf",iuml:"\u00ef",Jcirc:"\u0134",jcirc:"\u0135",Jcy:"\u0419",jcy:"\u0439",Jfr:"\ud835\udd0d",jfr:"\ud835\udd27",jmath:"\u0237",Jopf:"\ud835\udd41",jopf:"\ud835\udd5b",Jscr:"\ud835\udca5",jscr:"\ud835\udcbf",Jsercy:"\u0408",jsercy:"\u0458",Jukcy:"\u0404",jukcy:"\u0454",Kappa:"\u039a",kappa:"\u03ba",kappav:"\u03f0",
Kcedil:"\u0136",kcedil:"\u0137",Kcy:"\u041a",kcy:"\u043a",Kfr:"\ud835\udd0e",kfr:"\ud835\udd28",kgreen:"\u0138",KHcy:"\u0425",khcy:"\u0445",KJcy:"\u040c",kjcy:"\u045c",Kopf:"\ud835\udd42",kopf:"\ud835\udd5c",Kscr:"\ud835\udca6",kscr:"\ud835\udcc0",lAarr:"\u21da",Lacute:"\u0139",lacute:"\u013a",laemptyv:"\u29b4",lagran:"\u2112",Lambda:"\u039b",lambda:"\u03bb",lang:"\u27e8",Lang:"\u27ea",langd:"\u2991",langle:"\u27e8",lap:"\u2a85",Laplacetrf:"\u2112",laquo:"\u00ab",larrb:"\u21e4",larrbfs:"\u291f",larr:"\u2190",
Larr:"\u219e",lArr:"\u21d0",larrfs:"\u291d",larrhk:"\u21a9",larrlp:"\u21ab",larrpl:"\u2939",larrsim:"\u2973",larrtl:"\u21a2",latail:"\u2919",lAtail:"\u291b",lat:"\u2aab",late:"\u2aad",lates:"\u2aad\ufe00",lbarr:"\u290c",lBarr:"\u290e",lbbrk:"\u2772",lbrace:"{",lbrack:"[",lbrke:"\u298b",lbrksld:"\u298f",lbrkslu:"\u298d",Lcaron:"\u013d",lcaron:"\u013e",Lcedil:"\u013b",lcedil:"\u013c",lceil:"\u2308",lcub:"{",Lcy:"\u041b",lcy:"\u043b",ldca:"\u2936",ldquo:"\u201c",ldquor:"\u201e",ldrdhar:"\u2967",ldrushar:"\u294b",
ldsh:"\u21b2",le:"\u2264",lE:"\u2266",LeftAngleBracket:"\u27e8",LeftArrowBar:"\u21e4",leftarrow:"\u2190",LeftArrow:"\u2190",Leftarrow:"\u21d0",LeftArrowRightArrow:"\u21c6",leftarrowtail:"\u21a2",LeftCeiling:"\u2308",LeftDoubleBracket:"\u27e6",LeftDownTeeVector:"\u2961",LeftDownVectorBar:"\u2959",LeftDownVector:"\u21c3",LeftFloor:"\u230a",leftharpoondown:"\u21bd",leftharpoonup:"\u21bc",leftleftarrows:"\u21c7",leftrightarrow:"\u2194",LeftRightArrow:"\u2194",Leftrightarrow:"\u21d4",leftrightarrows:"\u21c6",
leftrightharpoons:"\u21cb",leftrightsquigarrow:"\u21ad",LeftRightVector:"\u294e",LeftTeeArrow:"\u21a4",LeftTee:"\u22a3",LeftTeeVector:"\u295a",leftthreetimes:"\u22cb",LeftTriangleBar:"\u29cf",LeftTriangle:"\u22b2",LeftTriangleEqual:"\u22b4",LeftUpDownVector:"\u2951",LeftUpTeeVector:"\u2960",LeftUpVectorBar:"\u2958",LeftUpVector:"\u21bf",LeftVectorBar:"\u2952",LeftVector:"\u21bc",lEg:"\u2a8b",leg:"\u22da",leq:"\u2264",leqq:"\u2266",leqslant:"\u2a7d",lescc:"\u2aa8",les:"\u2a7d",lesdot:"\u2a7f",lesdoto:"\u2a81",
lesdotor:"\u2a83",lesg:"\u22da\ufe00",lesges:"\u2a93",lessapprox:"\u2a85",lessdot:"\u22d6",lesseqgtr:"\u22da",lesseqqgtr:"\u2a8b",LessEqualGreater:"\u22da",LessFullEqual:"\u2266",LessGreater:"\u2276",lessgtr:"\u2276",LessLess:"\u2aa1",lesssim:"\u2272",LessSlantEqual:"\u2a7d",LessTilde:"\u2272",lfisht:"\u297c",lfloor:"\u230a",Lfr:"\ud835\udd0f",lfr:"\ud835\udd29",lg:"\u2276",lgE:"\u2a91",lHar:"\u2962",lhard:"\u21bd",lharu:"\u21bc",lharul:"\u296a",lhblk:"\u2584",LJcy:"\u0409",ljcy:"\u0459",llarr:"\u21c7",
ll:"\u226a",Ll:"\u22d8",llcorner:"\u231e",Lleftarrow:"\u21da",llhard:"\u296b",lltri:"\u25fa",Lmidot:"\u013f",lmidot:"\u0140",lmoustache:"\u23b0",lmoust:"\u23b0",lnap:"\u2a89",lnapprox:"\u2a89",lne:"\u2a87",lnE:"\u2268",lneq:"\u2a87",lneqq:"\u2268",lnsim:"\u22e6",loang:"\u27ec",loarr:"\u21fd",lobrk:"\u27e6",longleftarrow:"\u27f5",LongLeftArrow:"\u27f5",Longleftarrow:"\u27f8",longleftrightarrow:"\u27f7",LongLeftRightArrow:"\u27f7",Longleftrightarrow:"\u27fa",longmapsto:"\u27fc",longrightarrow:"\u27f6",
LongRightArrow:"\u27f6",Longrightarrow:"\u27f9",looparrowleft:"\u21ab",looparrowright:"\u21ac",lopar:"\u2985",Lopf:"\ud835\udd43",lopf:"\ud835\udd5d",loplus:"\u2a2d",lotimes:"\u2a34",lowast:"\u2217",lowbar:"_",LowerLeftArrow:"\u2199",LowerRightArrow:"\u2198",loz:"\u25ca",lozenge:"\u25ca",lozf:"\u29eb",lpar:"(",lparlt:"\u2993",lrarr:"\u21c6",lrcorner:"\u231f",lrhar:"\u21cb",lrhard:"\u296d",lrm:"\u200e",lrtri:"\u22bf",lsaquo:"\u2039",lscr:"\ud835\udcc1",Lscr:"\u2112",lsh:"\u21b0",Lsh:"\u21b0",lsim:"\u2272",
lsime:"\u2a8d",lsimg:"\u2a8f",lsqb:"[",lsquo:"\u2018",lsquor:"\u201a",Lstrok:"\u0141",lstrok:"\u0142",ltcc:"\u2aa6",ltcir:"\u2a79",lt:"<",LT:"<",Lt:"\u226a",ltdot:"\u22d6",lthree:"\u22cb",ltimes:"\u22c9",ltlarr:"\u2976",ltquest:"\u2a7b",ltri:"\u25c3",ltrie:"\u22b4",ltrif:"\u25c2",ltrPar:"\u2996",lurdshar:"\u294a",luruhar:"\u2966",lvertneqq:"\u2268\ufe00",lvnE:"\u2268\ufe00",macr:"\u00af",male:"\u2642",malt:"\u2720",maltese:"\u2720",Map:"\u2905",map:"\u21a6",mapsto:"\u21a6",mapstodown:"\u21a7",mapstoleft:"\u21a4",
mapstoup:"\u21a5",marker:"\u25ae",mcomma:"\u2a29",Mcy:"\u041c",mcy:"\u043c",mdash:"\u2014",mDDot:"\u223a",measuredangle:"\u2221",MediumSpace:"\u205f",Mellintrf:"\u2133",Mfr:"\ud835\udd10",mfr:"\ud835\udd2a",mho:"\u2127",micro:"\u00b5",midast:"*",midcir:"\u2af0",mid:"\u2223",middot:"\u00b7",minusb:"\u229f",minus:"\u2212",minusd:"\u2238",minusdu:"\u2a2a",MinusPlus:"\u2213",mlcp:"\u2adb",mldr:"\u2026",mnplus:"\u2213",models:"\u22a7",Mopf:"\ud835\udd44",mopf:"\ud835\udd5e",mp:"\u2213",mscr:"\ud835\udcc2",
Mscr:"\u2133",mstpos:"\u223e",Mu:"\u039c",mu:"\u03bc",multimap:"\u22b8",mumap:"\u22b8",nabla:"\u2207",Nacute:"\u0143",nacute:"\u0144",nang:"\u2220\u20d2",nap:"\u2249",napE:"\u2a70\u0338",napid:"\u224b\u0338",napos:"\u0149",napprox:"\u2249",natural:"\u266e",naturals:"\u2115",natur:"\u266e",nbsp:"\u00a0",nbump:"\u224e\u0338",nbumpe:"\u224f\u0338",ncap:"\u2a43",Ncaron:"\u0147",ncaron:"\u0148",Ncedil:"\u0145",ncedil:"\u0146",ncong:"\u2247",ncongdot:"\u2a6d\u0338",ncup:"\u2a42",Ncy:"\u041d",ncy:"\u043d",
ndash:"\u2013",nearhk:"\u2924",nearr:"\u2197",neArr:"\u21d7",nearrow:"\u2197",ne:"\u2260",nedot:"\u2250\u0338",NegativeMediumSpace:"\u200b",NegativeThickSpace:"\u200b",NegativeThinSpace:"\u200b",NegativeVeryThinSpace:"\u200b",nequiv:"\u2262",nesear:"\u2928",nesim:"\u2242\u0338",NestedGreaterGreater:"\u226b",NestedLessLess:"\u226a",NewLine:"\n",nexist:"\u2204",nexists:"\u2204",Nfr:"\ud835\udd11",nfr:"\ud835\udd2b",ngE:"\u2267\u0338",nge:"\u2271",ngeq:"\u2271",ngeqq:"\u2267\u0338",ngeqslant:"\u2a7e\u0338",
nges:"\u2a7e\u0338",nGg:"\u22d9\u0338",ngsim:"\u2275",nGt:"\u226b\u20d2",ngt:"\u226f",ngtr:"\u226f",nGtv:"\u226b\u0338",nharr:"\u21ae",nhArr:"\u21ce",nhpar:"\u2af2",ni:"\u220b",nis:"\u22fc",nisd:"\u22fa",niv:"\u220b",NJcy:"\u040a",njcy:"\u045a",nlarr:"\u219a",nlArr:"\u21cd",nldr:"\u2025",nlE:"\u2266\u0338",nle:"\u2270",nleftarrow:"\u219a",nLeftarrow:"\u21cd",nleftrightarrow:"\u21ae",nLeftrightarrow:"\u21ce",nleq:"\u2270",nleqq:"\u2266\u0338",nleqslant:"\u2a7d\u0338",nles:"\u2a7d\u0338",nless:"\u226e",
nLl:"\u22d8\u0338",nlsim:"\u2274",nLt:"\u226a\u20d2",nlt:"\u226e",nltri:"\u22ea",nltrie:"\u22ec",nLtv:"\u226a\u0338",nmid:"\u2224",NoBreak:"\u2060",NonBreakingSpace:"\u00a0",nopf:"\ud835\udd5f",Nopf:"\u2115",Not:"\u2aec",not:"\u00ac",NotCongruent:"\u2262",NotCupCap:"\u226d",NotDoubleVerticalBar:"\u2226",NotElement:"\u2209",NotEqual:"\u2260",NotEqualTilde:"\u2242\u0338",NotExists:"\u2204",NotGreater:"\u226f",NotGreaterEqual:"\u2271",NotGreaterFullEqual:"\u2267\u0338",NotGreaterGreater:"\u226b\u0338",
NotGreaterLess:"\u2279",NotGreaterSlantEqual:"\u2a7e\u0338",NotGreaterTilde:"\u2275",NotHumpDownHump:"\u224e\u0338",NotHumpEqual:"\u224f\u0338",notin:"\u2209",notindot:"\u22f5\u0338",notinE:"\u22f9\u0338",notinva:"\u2209",notinvb:"\u22f7",notinvc:"\u22f6",NotLeftTriangleBar:"\u29cf\u0338",NotLeftTriangle:"\u22ea",NotLeftTriangleEqual:"\u22ec",NotLess:"\u226e",NotLessEqual:"\u2270",NotLessGreater:"\u2278",NotLessLess:"\u226a\u0338",NotLessSlantEqual:"\u2a7d\u0338",NotLessTilde:"\u2274",NotNestedGreaterGreater:"\u2aa2\u0338",
NotNestedLessLess:"\u2aa1\u0338",notni:"\u220c",notniva:"\u220c",notnivb:"\u22fe",notnivc:"\u22fd",NotPrecedes:"\u2280",NotPrecedesEqual:"\u2aaf\u0338",NotPrecedesSlantEqual:"\u22e0",NotReverseElement:"\u220c",NotRightTriangleBar:"\u29d0\u0338",NotRightTriangle:"\u22eb",NotRightTriangleEqual:"\u22ed",NotSquareSubset:"\u228f\u0338",NotSquareSubsetEqual:"\u22e2",NotSquareSuperset:"\u2290\u0338",NotSquareSupersetEqual:"\u22e3",NotSubset:"\u2282\u20d2",NotSubsetEqual:"\u2288",NotSucceeds:"\u2281",NotSucceedsEqual:"\u2ab0\u0338",
NotSucceedsSlantEqual:"\u22e1",NotSucceedsTilde:"\u227f\u0338",NotSuperset:"\u2283\u20d2",NotSupersetEqual:"\u2289",NotTilde:"\u2241",NotTildeEqual:"\u2244",NotTildeFullEqual:"\u2247",NotTildeTilde:"\u2249",NotVerticalBar:"\u2224",nparallel:"\u2226",npar:"\u2226",nparsl:"\u2afd\u20e5",npart:"\u2202\u0338",npolint:"\u2a14",npr:"\u2280",nprcue:"\u22e0",nprec:"\u2280",npreceq:"\u2aaf\u0338",npre:"\u2aaf\u0338",nrarrc:"\u2933\u0338",nrarr:"\u219b",nrArr:"\u21cf",nrarrw:"\u219d\u0338",nrightarrow:"\u219b",
nRightarrow:"\u21cf",nrtri:"\u22eb",nrtrie:"\u22ed",nsc:"\u2281",nsccue:"\u22e1",nsce:"\u2ab0\u0338",Nscr:"\ud835\udca9",nscr:"\ud835\udcc3",nshortmid:"\u2224",nshortparallel:"\u2226",nsim:"\u2241",nsime:"\u2244",nsimeq:"\u2244",nsmid:"\u2224",nspar:"\u2226",nsqsube:"\u22e2",nsqsupe:"\u22e3",nsub:"\u2284",nsubE:"\u2ac5\u0338",nsube:"\u2288",nsubset:"\u2282\u20d2",nsubseteq:"\u2288",nsubseteqq:"\u2ac5\u0338",nsucc:"\u2281",nsucceq:"\u2ab0\u0338",nsup:"\u2285",nsupE:"\u2ac6\u0338",nsupe:"\u2289",nsupset:"\u2283\u20d2",
nsupseteq:"\u2289",nsupseteqq:"\u2ac6\u0338",ntgl:"\u2279",Ntilde:"\u00d1",ntilde:"\u00f1",ntlg:"\u2278",ntriangleleft:"\u22ea",ntrianglelefteq:"\u22ec",ntriangleright:"\u22eb",ntrianglerighteq:"\u22ed",Nu:"\u039d",nu:"\u03bd",num:"#",numero:"\u2116",numsp:"\u2007",nvap:"\u224d\u20d2",nvdash:"\u22ac",nvDash:"\u22ad",nVdash:"\u22ae",nVDash:"\u22af",nvge:"\u2265\u20d2",nvgt:">\u20d2",nvHarr:"\u2904",nvinfin:"\u29de",nvlArr:"\u2902",nvle:"\u2264\u20d2",nvlt:"<\u20d2",nvltrie:"\u22b4\u20d2",nvrArr:"\u2903",
nvrtrie:"\u22b5\u20d2",nvsim:"\u223c\u20d2",nwarhk:"\u2923",nwarr:"\u2196",nwArr:"\u21d6",nwarrow:"\u2196",nwnear:"\u2927",Oacute:"\u00d3",oacute:"\u00f3",oast:"\u229b",Ocirc:"\u00d4",ocirc:"\u00f4",ocir:"\u229a",Ocy:"\u041e",ocy:"\u043e",odash:"\u229d",Odblac:"\u0150",odblac:"\u0151",odiv:"\u2a38",odot:"\u2299",odsold:"\u29bc",OElig:"\u0152",oelig:"\u0153",ofcir:"\u29bf",Ofr:"\ud835\udd12",ofr:"\ud835\udd2c",ogon:"\u02db",Ograve:"\u00d2",ograve:"\u00f2",ogt:"\u29c1",ohbar:"\u29b5",ohm:"\u03a9",oint:"\u222e",
olarr:"\u21ba",olcir:"\u29be",olcross:"\u29bb",oline:"\u203e",olt:"\u29c0",Omacr:"\u014c",omacr:"\u014d",Omega:"\u03a9",omega:"\u03c9",Omicron:"\u039f",omicron:"\u03bf",omid:"\u29b6",ominus:"\u2296",Oopf:"\ud835\udd46",oopf:"\ud835\udd60",opar:"\u29b7",OpenCurlyDoubleQuote:"\u201c",OpenCurlyQuote:"\u2018",operp:"\u29b9",oplus:"\u2295",orarr:"\u21bb",Or:"\u2a54",or:"\u2228",ord:"\u2a5d",order:"\u2134",orderof:"\u2134",ordf:"\u00aa",ordm:"\u00ba",origof:"\u22b6",oror:"\u2a56",orslope:"\u2a57",orv:"\u2a5b",
oS:"\u24c8",Oscr:"\ud835\udcaa",oscr:"\u2134",Oslash:"\u00d8",oslash:"\u00f8",osol:"\u2298",Otilde:"\u00d5",otilde:"\u00f5",otimesas:"\u2a36",Otimes:"\u2a37",otimes:"\u2297",Ouml:"\u00d6",ouml:"\u00f6",ovbar:"\u233d",OverBar:"\u203e",OverBrace:"\u23de",OverBracket:"\u23b4",OverParenthesis:"\u23dc",para:"\u00b6",parallel:"\u2225",par:"\u2225",parsim:"\u2af3",parsl:"\u2afd",part:"\u2202",PartialD:"\u2202",Pcy:"\u041f",pcy:"\u043f",percnt:"%",period:".",permil:"\u2030",perp:"\u22a5",pertenk:"\u2031",
Pfr:"\ud835\udd13",pfr:"\ud835\udd2d",Phi:"\u03a6",phi:"\u03c6",phiv:"\u03d5",phmmat:"\u2133",phone:"\u260e",Pi:"\u03a0",pi:"\u03c0",pitchfork:"\u22d4",piv:"\u03d6",planck:"\u210f",planckh:"\u210e",plankv:"\u210f",plusacir:"\u2a23",plusb:"\u229e",pluscir:"\u2a22",plus:"+",plusdo:"\u2214",plusdu:"\u2a25",pluse:"\u2a72",PlusMinus:"\u00b1",plusmn:"\u00b1",plussim:"\u2a26",plustwo:"\u2a27",pm:"\u00b1",Poincareplane:"\u210c",pointint:"\u2a15",popf:"\ud835\udd61",Popf:"\u2119",pound:"\u00a3",prap:"\u2ab7",
Pr:"\u2abb",pr:"\u227a",prcue:"\u227c",precapprox:"\u2ab7",prec:"\u227a",preccurlyeq:"\u227c",Precedes:"\u227a",PrecedesEqual:"\u2aaf",PrecedesSlantEqual:"\u227c",PrecedesTilde:"\u227e",preceq:"\u2aaf",precnapprox:"\u2ab9",precneqq:"\u2ab5",precnsim:"\u22e8",pre:"\u2aaf",prE:"\u2ab3",precsim:"\u227e",prime:"\u2032",Prime:"\u2033",primes:"\u2119",prnap:"\u2ab9",prnE:"\u2ab5",prnsim:"\u22e8",prod:"\u220f",Product:"\u220f",profalar:"\u232e",profline:"\u2312",profsurf:"\u2313",prop:"\u221d",Proportional:"\u221d",
Proportion:"\u2237",propto:"\u221d",prsim:"\u227e",prurel:"\u22b0",Pscr:"\ud835\udcab",pscr:"\ud835\udcc5",Psi:"\u03a8",psi:"\u03c8",puncsp:"\u2008",Qfr:"\ud835\udd14",qfr:"\ud835\udd2e",qint:"\u2a0c",qopf:"\ud835\udd62",Qopf:"\u211a",qprime:"\u2057",Qscr:"\ud835\udcac",qscr:"\ud835\udcc6",quaternions:"\u210d",quatint:"\u2a16",quest:"?",questeq:"\u225f",quot:'"',QUOT:'"',rAarr:"\u21db",race:"\u223d\u0331",Racute:"\u0154",racute:"\u0155",radic:"\u221a",raemptyv:"\u29b3",rang:"\u27e9",Rang:"\u27eb",
rangd:"\u2992",range:"\u29a5",rangle:"\u27e9",raquo:"\u00bb",rarrap:"\u2975",rarrb:"\u21e5",rarrbfs:"\u2920",rarrc:"\u2933",rarr:"\u2192",Rarr:"\u21a0",rArr:"\u21d2",rarrfs:"\u291e",rarrhk:"\u21aa",rarrlp:"\u21ac",rarrpl:"\u2945",rarrsim:"\u2974",Rarrtl:"\u2916",rarrtl:"\u21a3",rarrw:"\u219d",ratail:"\u291a",rAtail:"\u291c",ratio:"\u2236",rationals:"\u211a",rbarr:"\u290d",rBarr:"\u290f",RBarr:"\u2910",rbbrk:"\u2773",rbrace:"}",rbrack:"]",rbrke:"\u298c",rbrksld:"\u298e",rbrkslu:"\u2990",Rcaron:"\u0158",
rcaron:"\u0159",Rcedil:"\u0156",rcedil:"\u0157",rceil:"\u2309",rcub:"}",Rcy:"\u0420",rcy:"\u0440",rdca:"\u2937",rdldhar:"\u2969",rdquo:"\u201d",rdquor:"\u201d",rdsh:"\u21b3",real:"\u211c",realine:"\u211b",realpart:"\u211c",reals:"\u211d",Re:"\u211c",rect:"\u25ad",reg:"\u00ae",REG:"\u00ae",ReverseElement:"\u220b",ReverseEquilibrium:"\u21cb",ReverseUpEquilibrium:"\u296f",rfisht:"\u297d",rfloor:"\u230b",rfr:"\ud835\udd2f",Rfr:"\u211c",rHar:"\u2964",rhard:"\u21c1",rharu:"\u21c0",rharul:"\u296c",Rho:"\u03a1",
rho:"\u03c1",rhov:"\u03f1",RightAngleBracket:"\u27e9",RightArrowBar:"\u21e5",rightarrow:"\u2192",RightArrow:"\u2192",Rightarrow:"\u21d2",RightArrowLeftArrow:"\u21c4",rightarrowtail:"\u21a3",RightCeiling:"\u2309",RightDoubleBracket:"\u27e7",RightDownTeeVector:"\u295d",RightDownVectorBar:"\u2955",RightDownVector:"\u21c2",RightFloor:"\u230b",rightharpoondown:"\u21c1",rightharpoonup:"\u21c0",rightleftarrows:"\u21c4",rightleftharpoons:"\u21cc",rightrightarrows:"\u21c9",rightsquigarrow:"\u219d",RightTeeArrow:"\u21a6",
RightTee:"\u22a2",RightTeeVector:"\u295b",rightthreetimes:"\u22cc",RightTriangleBar:"\u29d0",RightTriangle:"\u22b3",RightTriangleEqual:"\u22b5",RightUpDownVector:"\u294f",RightUpTeeVector:"\u295c",RightUpVectorBar:"\u2954",RightUpVector:"\u21be",RightVectorBar:"\u2953",RightVector:"\u21c0",ring:"\u02da",risingdotseq:"\u2253",rlarr:"\u21c4",rlhar:"\u21cc",rlm:"\u200f",rmoustache:"\u23b1",rmoust:"\u23b1",rnmid:"\u2aee",roang:"\u27ed",roarr:"\u21fe",robrk:"\u27e7",ropar:"\u2986",ropf:"\ud835\udd63",
Ropf:"\u211d",roplus:"\u2a2e",rotimes:"\u2a35",RoundImplies:"\u2970",rpar:")",rpargt:"\u2994",rppolint:"\u2a12",rrarr:"\u21c9",Rrightarrow:"\u21db",rsaquo:"\u203a",rscr:"\ud835\udcc7",Rscr:"\u211b",rsh:"\u21b1",Rsh:"\u21b1",rsqb:"]",rsquo:"\u2019",rsquor:"\u2019",rthree:"\u22cc",rtimes:"\u22ca",rtri:"\u25b9",rtrie:"\u22b5",rtrif:"\u25b8",rtriltri:"\u29ce",RuleDelayed:"\u29f4",ruluhar:"\u2968",rx:"\u211e",Sacute:"\u015a",sacute:"\u015b",sbquo:"\u201a",scap:"\u2ab8",Scaron:"\u0160",scaron:"\u0161",
Sc:"\u2abc",sc:"\u227b",sccue:"\u227d",sce:"\u2ab0",scE:"\u2ab4",Scedil:"\u015e",scedil:"\u015f",Scirc:"\u015c",scirc:"\u015d",scnap:"\u2aba",scnE:"\u2ab6",scnsim:"\u22e9",scpolint:"\u2a13",scsim:"\u227f",Scy:"\u0421",scy:"\u0441",sdotb:"\u22a1",sdot:"\u22c5",sdote:"\u2a66",searhk:"\u2925",searr:"\u2198",seArr:"\u21d8",searrow:"\u2198",sect:"\u00a7",semi:";",seswar:"\u2929",setminus:"\u2216",setmn:"\u2216",sext:"\u2736",Sfr:"\ud835\udd16",sfr:"\ud835\udd30",sfrown:"\u2322",sharp:"\u266f",SHCHcy:"\u0429",
shchcy:"\u0449",SHcy:"\u0428",shcy:"\u0448",ShortDownArrow:"\u2193",ShortLeftArrow:"\u2190",shortmid:"\u2223",shortparallel:"\u2225",ShortRightArrow:"\u2192",ShortUpArrow:"\u2191",shy:"\u00ad",Sigma:"\u03a3",sigma:"\u03c3",sigmaf:"\u03c2",sigmav:"\u03c2",sim:"\u223c",simdot:"\u2a6a",sime:"\u2243",simeq:"\u2243",simg:"\u2a9e",simgE:"\u2aa0",siml:"\u2a9d",simlE:"\u2a9f",simne:"\u2246",simplus:"\u2a24",simrarr:"\u2972",slarr:"\u2190",SmallCircle:"\u2218",smallsetminus:"\u2216",smashp:"\u2a33",smeparsl:"\u29e4",
smid:"\u2223",smile:"\u2323",smt:"\u2aaa",smte:"\u2aac",smtes:"\u2aac\ufe00",SOFTcy:"\u042c",softcy:"\u044c",solbar:"\u233f",solb:"\u29c4",sol:"/",Sopf:"\ud835\udd4a",sopf:"\ud835\udd64",spades:"\u2660",spadesuit:"\u2660",spar:"\u2225",sqcap:"\u2293",sqcaps:"\u2293\ufe00",sqcup:"\u2294",sqcups:"\u2294\ufe00",Sqrt:"\u221a",sqsub:"\u228f",sqsube:"\u2291",sqsubset:"\u228f",sqsubseteq:"\u2291",sqsup:"\u2290",sqsupe:"\u2292",sqsupset:"\u2290",sqsupseteq:"\u2292",square:"\u25a1",Square:"\u25a1",SquareIntersection:"\u2293",
SquareSubset:"\u228f",SquareSubsetEqual:"\u2291",SquareSuperset:"\u2290",SquareSupersetEqual:"\u2292",SquareUnion:"\u2294",squarf:"\u25aa",squ:"\u25a1",squf:"\u25aa",srarr:"\u2192",Sscr:"\ud835\udcae",sscr:"\ud835\udcc8",ssetmn:"\u2216",ssmile:"\u2323",sstarf:"\u22c6",Star:"\u22c6",star:"\u2606",starf:"\u2605",straightepsilon:"\u03f5",straightphi:"\u03d5",strns:"\u00af",sub:"\u2282",Sub:"\u22d0",subdot:"\u2abd",subE:"\u2ac5",sube:"\u2286",subedot:"\u2ac3",submult:"\u2ac1",subnE:"\u2acb",subne:"\u228a",
subplus:"\u2abf",subrarr:"\u2979",subset:"\u2282",Subset:"\u22d0",subseteq:"\u2286",subseteqq:"\u2ac5",SubsetEqual:"\u2286",subsetneq:"\u228a",subsetneqq:"\u2acb",subsim:"\u2ac7",subsub:"\u2ad5",subsup:"\u2ad3",succapprox:"\u2ab8",succ:"\u227b",succcurlyeq:"\u227d",Succeeds:"\u227b",SucceedsEqual:"\u2ab0",SucceedsSlantEqual:"\u227d",SucceedsTilde:"\u227f",succeq:"\u2ab0",succnapprox:"\u2aba",succneqq:"\u2ab6",succnsim:"\u22e9",succsim:"\u227f",SuchThat:"\u220b",sum:"\u2211",Sum:"\u2211",sung:"\u266a",
sup1:"\u00b9",sup2:"\u00b2",sup3:"\u00b3",sup:"\u2283",Sup:"\u22d1",supdot:"\u2abe",supdsub:"\u2ad8",supE:"\u2ac6",supe:"\u2287",supedot:"\u2ac4",Superset:"\u2283",SupersetEqual:"\u2287",suphsol:"\u27c9",suphsub:"\u2ad7",suplarr:"\u297b",supmult:"\u2ac2",supnE:"\u2acc",supne:"\u228b",supplus:"\u2ac0",supset:"\u2283",Supset:"\u22d1",supseteq:"\u2287",supseteqq:"\u2ac6",supsetneq:"\u228b",supsetneqq:"\u2acc",supsim:"\u2ac8",supsub:"\u2ad4",supsup:"\u2ad6",swarhk:"\u2926",swarr:"\u2199",swArr:"\u21d9",
swarrow:"\u2199",swnwar:"\u292a",szlig:"\u00df",Tab:"\t",target:"\u2316",Tau:"\u03a4",tau:"\u03c4",tbrk:"\u23b4",Tcaron:"\u0164",tcaron:"\u0165",Tcedil:"\u0162",tcedil:"\u0163",Tcy:"\u0422",tcy:"\u0442",tdot:"\u20db",telrec:"\u2315",Tfr:"\ud835\udd17",tfr:"\ud835\udd31",there4:"\u2234",therefore:"\u2234",Therefore:"\u2234",Theta:"\u0398",theta:"\u03b8",thetasym:"\u03d1",thetav:"\u03d1",thickapprox:"\u2248",thicksim:"\u223c",ThickSpace:"\u205f\u200a",ThinSpace:"\u2009",thinsp:"\u2009",thkap:"\u2248",
thksim:"\u223c",THORN:"\u00de",thorn:"\u00fe",tilde:"\u02dc",Tilde:"\u223c",TildeEqual:"\u2243",TildeFullEqual:"\u2245",TildeTilde:"\u2248",timesbar:"\u2a31",timesb:"\u22a0",times:"\u00d7",timesd:"\u2a30",tint:"\u222d",toea:"\u2928",topbot:"\u2336",topcir:"\u2af1",top:"\u22a4",Topf:"\ud835\udd4b",topf:"\ud835\udd65",topfork:"\u2ada",tosa:"\u2929",tprime:"\u2034",trade:"\u2122",TRADE:"\u2122",triangle:"\u25b5",triangledown:"\u25bf",triangleleft:"\u25c3",trianglelefteq:"\u22b4",triangleq:"\u225c",triangleright:"\u25b9",
trianglerighteq:"\u22b5",tridot:"\u25ec",trie:"\u225c",triminus:"\u2a3a",TripleDot:"\u20db",triplus:"\u2a39",trisb:"\u29cd",tritime:"\u2a3b",trpezium:"\u23e2",Tscr:"\ud835\udcaf",tscr:"\ud835\udcc9",TScy:"\u0426",tscy:"\u0446",TSHcy:"\u040b",tshcy:"\u045b",Tstrok:"\u0166",tstrok:"\u0167",twixt:"\u226c",twoheadleftarrow:"\u219e",twoheadrightarrow:"\u21a0",Uacute:"\u00da",uacute:"\u00fa",uarr:"\u2191",Uarr:"\u219f",uArr:"\u21d1",Uarrocir:"\u2949",Ubrcy:"\u040e",ubrcy:"\u045e",Ubreve:"\u016c",ubreve:"\u016d",
Ucirc:"\u00db",ucirc:"\u00fb",Ucy:"\u0423",ucy:"\u0443",udarr:"\u21c5",Udblac:"\u0170",udblac:"\u0171",udhar:"\u296e",ufisht:"\u297e",Ufr:"\ud835\udd18",ufr:"\ud835\udd32",Ugrave:"\u00d9",ugrave:"\u00f9",uHar:"\u2963",uharl:"\u21bf",uharr:"\u21be",uhblk:"\u2580",ulcorn:"\u231c",ulcorner:"\u231c",ulcrop:"\u230f",ultri:"\u25f8",Umacr:"\u016a",umacr:"\u016b",uml:"\u00a8",UnderBar:"_",UnderBrace:"\u23df",UnderBracket:"\u23b5",UnderParenthesis:"\u23dd",Union:"\u22c3",UnionPlus:"\u228e",Uogon:"\u0172",
uogon:"\u0173",Uopf:"\ud835\udd4c",uopf:"\ud835\udd66",UpArrowBar:"\u2912",uparrow:"\u2191",UpArrow:"\u2191",Uparrow:"\u21d1",UpArrowDownArrow:"\u21c5",updownarrow:"\u2195",UpDownArrow:"\u2195",Updownarrow:"\u21d5",UpEquilibrium:"\u296e",upharpoonleft:"\u21bf",upharpoonright:"\u21be",uplus:"\u228e",UpperLeftArrow:"\u2196",UpperRightArrow:"\u2197",upsi:"\u03c5",Upsi:"\u03d2",upsih:"\u03d2",Upsilon:"\u03a5",upsilon:"\u03c5",UpTeeArrow:"\u21a5",UpTee:"\u22a5",upuparrows:"\u21c8",urcorn:"\u231d",urcorner:"\u231d",
urcrop:"\u230e",Uring:"\u016e",uring:"\u016f",urtri:"\u25f9",Uscr:"\ud835\udcb0",uscr:"\ud835\udcca",utdot:"\u22f0",Utilde:"\u0168",utilde:"\u0169",utri:"\u25b5",utrif:"\u25b4",uuarr:"\u21c8",Uuml:"\u00dc",uuml:"\u00fc",uwangle:"\u29a7",vangrt:"\u299c",varepsilon:"\u03f5",varkappa:"\u03f0",varnothing:"\u2205",varphi:"\u03d5",varpi:"\u03d6",varpropto:"\u221d",varr:"\u2195",vArr:"\u21d5",varrho:"\u03f1",varsigma:"\u03c2",varsubsetneq:"\u228a\ufe00",varsubsetneqq:"\u2acb\ufe00",varsupsetneq:"\u228b\ufe00",
varsupsetneqq:"\u2acc\ufe00",vartheta:"\u03d1",vartriangleleft:"\u22b2",vartriangleright:"\u22b3",vBar:"\u2ae8",Vbar:"\u2aeb",vBarv:"\u2ae9",Vcy:"\u0412",vcy:"\u0432",vdash:"\u22a2",vDash:"\u22a8",Vdash:"\u22a9",VDash:"\u22ab",Vdashl:"\u2ae6",veebar:"\u22bb",vee:"\u2228",Vee:"\u22c1",veeeq:"\u225a",vellip:"\u22ee",verbar:"|",Verbar:"\u2016",vert:"|",Vert:"\u2016",VerticalBar:"\u2223",VerticalLine:"|",VerticalSeparator:"\u2758",VerticalTilde:"\u2240",VeryThinSpace:"\u200a",Vfr:"\ud835\udd19",vfr:"\ud835\udd33",
vltri:"\u22b2",vnsub:"\u2282\u20d2",vnsup:"\u2283\u20d2",Vopf:"\ud835\udd4d",vopf:"\ud835\udd67",vprop:"\u221d",vrtri:"\u22b3",Vscr:"\ud835\udcb1",vscr:"\ud835\udccb",vsubnE:"\u2acb\ufe00",vsubne:"\u228a\ufe00",vsupnE:"\u2acc\ufe00",vsupne:"\u228b\ufe00",Vvdash:"\u22aa",vzigzag:"\u299a",Wcirc:"\u0174",wcirc:"\u0175",wedbar:"\u2a5f",wedge:"\u2227",Wedge:"\u22c0",wedgeq:"\u2259",weierp:"\u2118",Wfr:"\ud835\udd1a",wfr:"\ud835\udd34",Wopf:"\ud835\udd4e",wopf:"\ud835\udd68",wp:"\u2118",wr:"\u2240",wreath:"\u2240",
Wscr:"\ud835\udcb2",wscr:"\ud835\udccc",xcap:"\u22c2",xcirc:"\u25ef",xcup:"\u22c3",xdtri:"\u25bd",Xfr:"\ud835\udd1b",xfr:"\ud835\udd35",xharr:"\u27f7",xhArr:"\u27fa",Xi:"\u039e",xi:"\u03be",xlarr:"\u27f5",xlArr:"\u27f8",xmap:"\u27fc",xnis:"\u22fb",xodot:"\u2a00",Xopf:"\ud835\udd4f",xopf:"\ud835\udd69",xoplus:"\u2a01",xotime:"\u2a02",xrarr:"\u27f6",xrArr:"\u27f9",Xscr:"\ud835\udcb3",xscr:"\ud835\udccd",xsqcup:"\u2a06",xuplus:"\u2a04",xutri:"\u25b3",xvee:"\u22c1",xwedge:"\u22c0",Yacute:"\u00dd",yacute:"\u00fd",
YAcy:"\u042f",yacy:"\u044f",Ycirc:"\u0176",ycirc:"\u0177",Ycy:"\u042b",ycy:"\u044b",yen:"\u00a5",Yfr:"\ud835\udd1c",yfr:"\ud835\udd36",YIcy:"\u0407",yicy:"\u0457",Yopf:"\ud835\udd50",yopf:"\ud835\udd6a",Yscr:"\ud835\udcb4",yscr:"\ud835\udcce",YUcy:"\u042e",yucy:"\u044e",yuml:"\u00ff",Yuml:"\u0178",Zacute:"\u0179",zacute:"\u017a",Zcaron:"\u017d",zcaron:"\u017e",Zcy:"\u0417",zcy:"\u0437",Zdot:"\u017b",zdot:"\u017c",zeetrf:"\u2128",ZeroWidthSpace:"\u200b",Zeta:"\u0396",zeta:"\u03b6",zfr:"\ud835\udd37",
Zfr:"\u2128",ZHcy:"\u0416",zhcy:"\u0436",zigrarr:"\u21dd",zopf:"\ud835\udd6b",Zopf:"\u2124",Zscr:"\ud835\udcb5",zscr:"\ud835\udccf",zwj:"\u200d",zwnj:"\u200c"},K={Aacute:"\u00c1",aacute:"\u00e1",Acirc:"\u00c2",acirc:"\u00e2",acute:"\u00b4",AElig:"\u00c6",aelig:"\u00e6",Agrave:"\u00c0",agrave:"\u00e0",amp:"&",AMP:"&",Aring:"\u00c5",aring:"\u00e5",Atilde:"\u00c3",atilde:"\u00e3",Auml:"\u00c4",auml:"\u00e4",brvbar:"\u00a6",Ccedil:"\u00c7",ccedil:"\u00e7",cedil:"\u00b8",cent:"\u00a2",copy:"\u00a9",COPY:"\u00a9",
curren:"\u00a4",deg:"\u00b0",divide:"\u00f7",Eacute:"\u00c9",eacute:"\u00e9",Ecirc:"\u00ca",ecirc:"\u00ea",Egrave:"\u00c8",egrave:"\u00e8",ETH:"\u00d0",eth:"\u00f0",Euml:"\u00cb",euml:"\u00eb",frac12:"\u00bd",frac14:"\u00bc",frac34:"\u00be",gt:">",GT:">",Iacute:"\u00cd",iacute:"\u00ed",Icirc:"\u00ce",icirc:"\u00ee",iexcl:"\u00a1",Igrave:"\u00cc",igrave:"\u00ec",iquest:"\u00bf",Iuml:"\u00cf",iuml:"\u00ef",laquo:"\u00ab",lt:"<",LT:"<",macr:"\u00af",micro:"\u00b5",middot:"\u00b7",nbsp:"\u00a0",not:"\u00ac",
Ntilde:"\u00d1",ntilde:"\u00f1",Oacute:"\u00d3",oacute:"\u00f3",Ocirc:"\u00d4",ocirc:"\u00f4",Ograve:"\u00d2",ograve:"\u00f2",ordf:"\u00aa",ordm:"\u00ba",Oslash:"\u00d8",oslash:"\u00f8",Otilde:"\u00d5",otilde:"\u00f5",Ouml:"\u00d6",ouml:"\u00f6",para:"\u00b6",plusmn:"\u00b1",pound:"\u00a3",quot:'"',QUOT:'"',raquo:"\u00bb",reg:"\u00ae",REG:"\u00ae",sect:"\u00a7",shy:"\u00ad",sup1:"\u00b9",sup2:"\u00b2",sup3:"\u00b3",szlig:"\u00df",THORN:"\u00de",thorn:"\u00fe",times:"\u00d7",Uacute:"\u00da",uacute:"\u00fa",
Ucirc:"\u00db",ucirc:"\u00fb",Ugrave:"\u00d9",ugrave:"\u00f9",uml:"\u00a8",Uuml:"\u00dc",uuml:"\u00fc",Yacute:"\u00dd",yacute:"\u00fd",yen:"\u00a5",yuml:"\u00ff"},y={0:"\ufffd",128:"\u20ac",130:"\u201a",131:"\u0192",132:"\u201e",133:"\u2026",134:"\u2020",135:"\u2021",136:"\u02c6",137:"\u2030",138:"\u0160",139:"\u2039",140:"\u0152",142:"\u017d",145:"\u2018",146:"\u2019",147:"\u201c",148:"\u201d",149:"\u2022",150:"\u2013",151:"\u2014",152:"\u02dc",153:"\u2122",154:"\u0161",155:"\u203a",156:"\u0153",
158:"\u017e",159:"\u0178"},z=[1,2,3,4,5,6,7,8,11,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,127,128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,64976,64977,64978,64979,64980,64981,64982,64983,64984,64985,64986,64987,64988,64989,64990,64991,64992,64993,64994,64995,64996,64997,64998,64999,65E3,65001,65002,65003,65004,65005,65006,65007,65534,65535,131070,131071,196606,196607,262142,262143,327678,327679,393214,
393215,458750,458751,524286,524287,589822,589823,655358,655359,720894,720895,786430,786431,851966,851967,917502,917503,983038,983039,1048574,1048575,1114110,1114111],A=String.fromCharCode,p={}.hasOwnProperty,B=function(a,c){if(!a)return c;var b={},d;for(d in c)b[d]=p.call(a,d)?a[d]:c[d];return b},C=function(a,c){var b="";if(55296<=a&&57343>=a||1114111<a)return c&&e("character reference outside the permissible Unicode range"),"\ufffd";if(p.call(y,a))return c&&e("disallowed character reference"),y[a];
var d;if(d=c)a:{d=-1;for(var L=z.length;++d<L;)if(z[d]==a){d=!0;break a}d=!1}d&&e("disallowed character reference");65535<a&&(a-=65536,b+=A(a>>>10&1023|55296),a=56320|a&1023);return b+=A(a)},q=function(a){return"&#x"+a.charCodeAt(0).toString(16).toUpperCase()+";"},e=function(a){throw Error("Parse error: "+a);},r=function(a,c){c=B(c,r.options);c.strict&&I.test(a)&&e("forbidden code point");var b=c.useNamedReferences,d=c.allowUnsafeSymbols;c.encodeEverything?(a=a.replace(E,function(a){return b&&p.call(k,
a)?"&"+k[a]+";":q(a)}),b&&(a=a.replace(/&gt;\u20D2/g,"&nvgt;").replace(/&lt;\u20D2/g,"&nvlt;").replace(/&#x66;&#x6A;/g,"&fjlig;")),b&&(a=a.replace(w,function(a){return"&"+k[a]+";"}))):b?(d||(a=a.replace(l,function(a){return"&"+k[a]+";"})),a=a.replace(/&gt;\u20D2/g,"&nvgt;").replace(/&lt;\u20D2/g,"&nvlt;"),a=a.replace(w,function(a){return"&"+k[a]+";"})):d||(a=a.replace(l,q));return a.replace(D,function(a){var d=a.charCodeAt(0);a=a.charCodeAt(1);return"&#x"+(1024*(d-55296)+a-56320+65536).toString(16).toUpperCase()+
";"}).replace(F,q)};r.options={allowUnsafeSymbols:!1,encodeEverything:!1,strict:!1,useNamedReferences:!1};var n=function(a,c){c=B(c,n.options);var b=c.strict;b&&H.test(a)&&e("malformed character reference");return a.replace(J,function(a,f,m,g,k,h,n,l){if(f)return a=f,b&&!m&&e("character reference was not terminated by a semicolon"),C(a,b);if(g)return b&&!k&&e("character reference was not terminated by a semicolon"),a=parseInt(g,16),C(a,b);if(h){m=h;if(p.call(x,m))return x[m];b&&e("named character reference was not terminated by a semicolon");
return a}m=n;if(l&&c.isAttributeValue)return b&&"="==l&&e("`&` did not start a character reference"),a;b&&e("named character reference was not terminated by a semicolon");return K[m]+(l||"")})};n.options={isAttributeValue:!1,strict:!1};var f={version:"0.5.0",encode:r,decode:n,escape:function(a){return a.replace(l,function(a){return G[a]})},unescape:n};if("function"==typeof define&&"object"==typeof define.amd&&define.amd)define(function(){return f});else if(h&&!h.nodeType)if(v)v.exports=f;else for(var t in f)p.call(f,
t)&&(h[t]=f[t]);else u.he=f})(this);