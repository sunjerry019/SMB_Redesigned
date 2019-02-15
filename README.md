# SMB_Redesigned
[![Uses JS](https://img.shields.io/badge/Uses-JavaScript-brightgreen.svg?style=for-the-badge&logo=JavaScript)](//shields.io/)

SMB with a new look, made for browsers that support more than IE. Inspired by SMB Redesigned coded by our seniors.

Feel free to fork this repo! We do hope that this script inspires more people to tinker, experiment, and make our online experiences more pleasant. :)

> Kleinvieh macht auch Mist<br>
"Many a little makes a mickle."

## Greasemonkey Userscript
To use, first install Greasemonkey on Firefox if it is not installed already, then install this userscript.
For users on Google Chrome, please download the crx file and install it manually by dragging it to your chrome://extensions/ page. However, note that certain features seems to not work properly in Chrome.

## Disclaimers?
Made in 2015 in good faith.

USE AT YOUR OWN RISK.
WE ARE NOT LIABLE FOR YOUR USE OF THIS SCRIPT.

The creator(s) play(s) no part in the publicity of this script. It is also no longer actively maintained because *sunjerry019* has decided he needs to study for the A Levels. Feel free to contact him if you want to take over this repo.

> Do not go gentle into that good night.

So long, and thanks for all the fish!<br>
-*sunjerry019* 17 Sep 2016

# Update
11 Feb 2019

Unfortunately, being the scared cat that I was back in JC, I didn't actually take any screenshots of this project, and now that the SMB has been decommissioned, I can't exactly go back to get more screenshots...You know, I spent a lot of free time on this back in my JC days and I was actually really proud of what I achieved, so let me just write a feature breakdown and provide some screenshots I found in my archives.

## Features
First we have the Log In Screen:

![Log In](https://github.com/sunjerry019/SMB_Redesigned/raw/master/screenshots/login.jpg "Login")

As you can see, it's beautifully crafted with Material Design. Double clicking the school logo will bring you to the song [Rick Astley - Never Gonna Give You Up on Youtube](https://www.youtube.com/watch?v=dQw4w9WgXcQ). This was added as an easter egg.

After you log in, you will be greeted with this menu of the different boards. The links at the top will bring you to the Account Settings and Logout pages respectively:

![Boards](https://github.com/sunjerry019/SMB_Redesigned/raw/master/screenshots/boards.jpg "Boards")

As a comparison, this was the original:

![Boards](https://github.com/sunjerry019/SMB_Redesigned/raw/master/screenshots/boards_o.jpg "Boards")

After going into the board, we can view the messages posted there.

Herein lies the heavylifting of the script, so let me break it down on how it works:
1. Add a full white overlay on the entire screen to hide the original contents and a progress bar at the top to provide some loading animations.
2. Parse the DOM with Javascript to extract all the links, properties (e.g. poster, post date) and any associated types of the messages (e.g. Importance, requires response, etc. )
    1. There are usually 2 frames (not even iframes) on the original page, one for the header (with links to Archives, Settings, Other Board, etc. ), one for the actual content.
    2. It was a headache to parse the already loaded dom as the page could be accessed from various endpoints that give different page layouts, making a lot of special cases necessary, so it was easier for the script to make a new AJAX request and parse the returned content (controlled and defined)
    3. 2 &times; AJAX requests will be made, one to the "top bar" and one to the page with the content.  
    4. Parse the data (including if the login cookie is not set)
        1. If the AJAX was unsuccessful, a red warning box will be shown to redirect the user back to the log in page. However, instead of simply redirecting to the login (The first screenshot), the link brings the user to the logout endpoint to ensure a clean clearing of cookies, and then the log out endpoint automatically redirects to the log in page.
    5. All metadata are then embedded into the DOM through data attributes.
3. Delete the old content on the page
4. Sort the messages
5. Iterate through the messages and add them to the list of messages.
6. Fade in the entire page, newly styled.

The entire board starts with the list of messages, arranged according to importance, with unread messages at the top. Once a message is opened, the message list shrinks to the left, and the message loads on the right. To put it in a more visual way, it kind of looks like GMail on a tablet.

![First Load View](https://github.com/sunjerry019/SMB_Redesigned/raw/master/screenshots/firstload.jpg "First Load View")

Every message has a profile picture, that isn't really a picture, but a circle with the first letter of the username of the poster and a (mostly unique) background color. This background colour is generated programmatically from their username with a simple algorithm, and then tested for sufficient contrast for a white letter to be placed over it. If there isn't enough contrast (e.g. pastel pink was generated), the opposite colour is chosen by flipping the `V` of the `HSV` by 180&deg;. If there still isn't enough contrast, `HSL` luminescence is turned down in steps of `0.05` until there exists enough contrast to place white letter over it. This ensures that every poster has their own (most likely unique) colour, and there is no need to store the colour data anywhere to ensure that it is consistent across reloads, and even across devices/browsers.

![Example Message](https://github.com/sunjerry019/SMB_Redesigned/raw/master/screenshots/msg.jpg "Example Message")

[dotdotdot](https://github.com/FrDH/dotdotdot-JS) is used to truncate any titles or content that is too log for the display box.

Once the message is opened, an AJAX request is made to obtain the message. The DOM response is then parsed and put into the right message pane.

![Message Pane](https://github.com/sunjerry019/SMB_Redesigned/raw/master/screenshots/messagepane.jpg "Message Pane")

Should the message require any form of response, a response box is placed at the bottom with the 5 options A, B, C, D, and E, and a textarea. Once the user clicks submit, another AJAX request is made to the server to submit the response. Toasts are used to provide the user with feedback and confirmation.

![Response](https://github.com/sunjerry019/SMB_Redesigned/raw/master/screenshots/needresponse.png "Requires Response")

The original SMB also provided this "Mark this message" feature that honestly wasn't very well implemented. For one, you have to actually *submit a HTML form* to mark a message. If you use any other ways of navigating e.g. bookmarks, you won't be able to mark the message. However, my redesign solves this problem by making it much more accessible as a "Star this message" that submits this HTML form via AJAX. It still uses the "Mark this message" backend. You can even mark a message without opening it first.

Original:
![Mark This Message Old](https://github.com/sunjerry019/SMB_Redesigned/raw/master/screenshots/markthismsg_o.jpg "Notice how I have to click submit to mark.")

New:
![Mark This Message](https://github.com/sunjerry019/SMB_Redesigned/raw/master/screenshots/markthismsg.jpg "Notice the star at the top right corner")

Should the message have any form of attachments, the links to the attachments are parsed, and an icon is added to the attachment title. If the user is using firefox, the icon is loaded with `moz-icon://.<extension>`, otherwise, it is loaded with `//ssl.gstatic.com/docs/doclist/images/mediatype/icon_1_<type>_x32.png`. If the attachment has a name, the name will also be displayed, or else it will be displayed as "Attach *N*".

![Attachment](https://github.com/sunjerry019/SMB_Redesigned/raw/master/screenshots/attachment.png "Attachment")

At the top of the page, there is a refresh button that makes AJAX request on demand to check for new messages. The script also checks for new messages in the background every 2 minutes. Browser notifications for new messages are also shown should the user have them enabled.

The colour theme of the entire page is also customizable by the user by the magic of [Materialize CSS](https://materializecss.com/).

There might be some features I have missed out on, but this should be the juice :) Most of these screenshots are what I found digging through my archives, feel free to go to [the screenshots folder](//github.com/sunjerry019/SMB_Redesigned/tree/master/screenshots/archive)) to take a look at some of the other old screenshots, including some in between progress pics.

I would also like to use this opportunity to say that I used jQuery because it was just more convenient (with AJAX, event listeners and stuff), and honestly performance was not crucial in this application :/ Stop bugging me about it .-.
