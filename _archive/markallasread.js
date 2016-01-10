function open()
{
    for(var a=window.frames[1].document.body.getElementsByTagName('b'),e=[],d=[],b=0,c=a.length;b<c;b++)
    {
        var g=a[b],f=g.parentNode;'A'===f.tagName&&'function'===typeof f.onclick&&(-1!==f.href.search('messages.hci.edu.sg/cgi-bin/emb/update_viewlist.pl')||-1!==f.href.search('messages.hci.edu.sg/cgi-bin/emb/update_viewlist1.pl')||-1!==f.href.search('learning.hci.edu.sg/cgi-bin/emb/update_viewlist.pl'))&&(e.push(f.href),d.push(g.textContent))}
        a='You have '+e.length+' unread messages, do you want to mark them all as read?\n\n';
        b=0;for(c=d.length;b<c;b++)a+=d[b]+'\n\n';
        if(!0===confirm(a)){d=document.getElementsByTagName('frameset')[0];console.log(d.innerHTML);a=0;for(b=e.length;a<b;a++)c=document.createElement('frame'),c.src=e[a],c.style.visible='hidden',d.appendChild(c);window.frames[1].window.location.href=window.frames[1].window.location.href
    }
}
open();
