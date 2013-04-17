/* $Id: search.js,v 1.53 2007-04-11 02:11:29 quinn Exp $
 * ---------------------------------------------------
 * Javascript container
 */

var xmlHttp
var xinitSession;
var xloadTargets;
var xsearch;
var xshow;
var xstat;
var xtermlist;
var xfetchDetails;
var session = false;
var targetsloaded = false;
var shown;
var searchtimer;
var showtimer;
var termtimer;
var stattimer;
var session_cells = Array('query', 'startrec', 'action_type');
var old_session = session_read();
var url_surveillence;
var recstoshow = 20;
var page_window = 5;  // Number of pages prior to and after the current page
var facet_list;
var cur_sort = "relevance";
var searched = 0;
var cur_id = -1;
var cur_rec = 0;
var filter = '';

function initialize ()
{
    facet_list = get_available_facets();
    start_session();
    session_check();
    set_sort();
}

function GetXmlHttpObject()
{ 
    var objXMLHttp=null
    if (window.XMLHttpRequest)
      {
      objXMLHttp=new XMLHttpRequest()
      }
    else if (window.ActiveXObject)
      {
      objXMLHttp=new ActiveXObject("Microsoft.XMLHTTP")
      }
    return objXMLHttp
} 

function SendXmlHttpObject(obj, url, handler)
{
    obj.onreadystatechange=handler;
    obj.open("GET", url);
    obj.send(null);
}

function session_started()
{
    if (xinitSession.readyState != 4)
	return;
    var xml = xinitSession.responseXML;
    var sesid = xml.getElementsByTagName("session")[0].childNodes[0].nodeValue;
    assign_text(document.getElementById("status"), 'Live');
    session = sesid;
    setTimeout(ping_session, 50000);
}

function start_session()
{
    xinitSession = GetXmlHttpObject();
    var url="search.pz2?";
    url += "command=init";
    xinitSession.onreadystatechange=session_started;
    xinitSession.open("GET", url);
    xinitSession.send(null);
}

function ping_session()
{
    if (!session)
	return;
    var url = "search.pz2?command=ping&session=" + session;
    SendXmlHttpObject(xpingSession = GetXmlHttpObject(), url, session_pinged);
}

function session_pinged()
{
    if (xpingSession.readyState != 4)
	return;
    var xml = xpingSession.responseXML;
    var error = xml.getElementsByTagName("error");
    if (error[0])
	location = "?";
    else
        setTimeout(ping_session, 50000);
}

function update_action (new_action) {
    document.search.action_type.value = new_action;
}


function make_pager (hits, offset, max) {
    var html = '';
    var off;
    var start_offset = offset - page_window * max;
    var div_elem = document.createElement('div');
    
    div_elem.className = 'pages';

    if (start_offset < 0) {
        start_offset = 0;
    }

    for (off = start_offset;
         off < hits && off < (start_offset + 2 * page_window * max); 
         off += max) {
        
        var p = off / max + 1;
        var page_elem = create_element('a', p);
        var newline_node = document.createTextNode(' ');

        if ((offset >= off) && (offset < (off + max))) {
            page_elem.className = 'select';
        }

        page_elem.setAttribute('off', off);
        page_elem.style.cursor = 'pointer';
        page_elem.onclick = function () {
            update_offset(this.getAttribute('off'));
        };

        div_elem.appendChild(page_elem);
        div_elem.appendChild(newline_node);
    }

    return div_elem;
}


function update_offset (offset) {
    clearTimeout(searchtimer);
    document.search.startrec.value = offset;
    update_action('page');
    check_search();
    update_history();
    return false;
}


function create_element (name, cdata) {
    var elem_node = document.createElement(name);
    elem_node.innerHTML = cdata;

    return elem_node;
}


function clear_cell (cell) {
    while (cell.hasChildNodes())
        cell.removeChild(cell.firstChild);
}


function append_text(cell, text) {
    text_node = document.createTextNode(text);
    cell.appendChild(text_node);
}


function assign_text (cell, text) {
    clear_cell(cell);
    append_text(cell, text);
}

function set_sort_opt(n, opt, str)
{
    var txt = document.createTextNode(str);
    if (opt == cur_sort)
	n.appendChild(txt);
    else
    {
	var a = document.createElement('a');
	a.appendChild(txt);
	a.setAttribute('href', "");
	a.setAttribute('id', opt);
	a.onclick = function() { set_sort(this.getAttribute('id')); return false; };
	n.appendChild(a);
    }
}

function set_sort(sort)
{
    if (sort && sort != cur_sort)
    {
	cur_sort = sort;
	if (searched)
	    check_search();
    }

    var t = document.getElementById("sortselect");
    clear_cell(t);
    t.appendChild(document.createTextNode("Sort results by: "));
    set_sort_opt(t, 'relevance', 'Relevance');
    t.appendChild(document.createTextNode(" or "));
    set_sort_opt(t, 'title:1', 'Title');
}

function displayname(name)
{
    if (name == 'md-author')
	return 'Author';
    else if (name == 'md-subject')
	return 'Subject';
    else if (name == 'md-date')
	return 'Date';
    else if (name == 'md-isbn')
	return 'ISBN';
    else if (name == 'md-publisher')
	return 'Publisher';
    else if (name == 'md-url')
	return 'URL';
    else if (name == 'md-title')
	return '@';
    else if (name == 'md-id')
	return 'Local ID';
    else if (name == 'md-description')
	return 'Description';
    else if (name == 'md-lccn')
	return 'LCCN';
    else if (name == 'recid')
	return '@';
    else if (name == 'location')
	return '@';
    else
	return name;
}

function hyperlink_field(name)
{
    if (name == 'md-author')
	return 'au';
    else if (name == 'md-subject')
	return 'su';
    else if (name == 'md-url')
	return 'URL';
    else
	return 0;
}

function  paint_details_tr(name, dn)
{
    //emit a table row
    var dname = displayname(name);
    var ln = create_element('b', dname);
    var tln = document.createElement('td');
    tln.width = '90';
    tln.vAlign = 'top';
    tln.appendChild(ln);
    var tr = document.createElement('tr');
    tr.appendChild(tln);
    tr.appendChild(dn);
    return tr;
}

function cleanurl(v)
{
    var v1 = v;
    var v2 = v1.replace(/\?.*$/, "");
    var v3 = v2.replace(/http:\/\//, "");
    return v3;
}

function paint_data_elements(target, node)
{
    var nodes = node.childNodes;
    var dn = 0;
    var lastname = '';
    var i;
    for (i = 0; i < nodes.length; i++)
    {
	if (nodes[i].nodeType != 1)
	    continue;
	var name = nodes[i].nodeName;
	if (name == 'recid' || name == 'md-title')
	    continue;
	if (name != lastname && lastname != 'location') 
	{
	    if (dn)
	    {
		var tr = paint_details_tr(lastname, dn);
		target.appendChild(tr);
	    }
	    dn = document.createElement('td');
	    lastname = name;
	}
	if (name == 'location')
	{
	    dn = document.createElement('td');
	    dn.appendChild(paint_subrecord(nodes[i]));
	    target.appendChild(paint_details_tr('Location', dn)); 
	    continue;
	}
	if (!nodes[i].childNodes[0])
		continue;
	var value = nodes[i].childNodes[0].nodeValue;
	if (dn.childNodes[0])
	    dn.appendChild(document.createTextNode('; '));
	var hyl = hyperlink_field(name);
	var nv;
	if (hyl)
	{
	    nv = create_element('a', cleanurl(value));
	    if (hyl == 'URL')
	    {
		nv.href = value;
		nv.target = '_blank';
	    }
	    else
	    {
		nv.href = '#';
		nv.setAttribute('term', value);
		nv.setAttribute('searchfield', hyl);
		nv.onclick = function() { hyperlink_search(this); return false; };
	    }
	}
	else if (name == 'md-lccn')
	{
	    nv = document.createElement('span');
	    nv.appendChild(document.createTextNode(value + ' '));
	    var link = create_element('a', 'Show title in LoC');
		link.setAttribute('target', '_blank');
		link.setAttribute('href', 'http://catalog.loc.gov/cgi-bin/Pwebrecon.cgi?DB=local&CNT=10&CMD=10+records+per+page&CMD=lccn+' + value);
	    nv.appendChild(link);

	}
	else if (name == 'md-isbn')
	{
	    nv = document.createElement('span');
	    nv.appendChild(document.createTextNode(value + ' '));
	    var link = create_element('a', 'search OpenWorldCat');
		link.setAttribute('target', '_blank');
		link.setAttribute('href', 'http://www.worldcat.org/search?q=isbn%3A' + value);
	    nv.appendChild(link);
	}
	else
	    nv = document.createTextNode(value);
	dn.appendChild(nv);
    }
    if (dn && lastname != 'location')
    {
	var tr = paint_details_tr(lastname, dn);
	target.appendChild(tr);
    }
}

function paint_subrecord(node)
{
    var table = document.createElement('table');
    var tbody = document.createElement('tbody');
    var zurl = node.getAttribute('id');
    var name = node.getAttribute('name');
    var tr;
    var td;
    if (name)
	td = create_element('td', name);
    else
	td = create_element('td', zurl);
    tr = paint_details_tr('Source', td);
    tbody.appendChild(tr);
    paint_data_elements(tbody, node);
    table.appendChild(tbody);
    return table;
}

function paint_details(body, xml)
{
    clear_cell(body);
    var table = document.createElement('table');
    var tbody = document.createElement('tbody');
    table.setAttribute('cellpadding', 2);
    paint_data_elements(tbody, xml.childNodes[0]);
    table.appendChild(tbody);
    body.appendChild(table);
    body.style.display = 'inline';
}

function show_details()
{
    if (xfetchDetails.readyState != 4)
	return;
    var xml = xfetchDetails.responseXML;
    var error = xml.getElementsByTagName("error");
    if (error[0])
    {
	var msg = error[0].childNodes[0].nodeValue;
	alert(msg);
	location = "?";
	return;
    }

    var idn = xml.getElementsByTagName('recid');
    if (!idn[0])
	return;
    var id = idn[0].childNodes[0].nodeValue;
    cur_id = id;
    cur_rec = xml;

    var nodes = document.getElementsByName('listrecord');
    var i;
    for (i = 0; i < nodes.length; i++)
    {
	var dets = nodes[i].getElementsByTagName('div');
	if (dets[0])
	    dets[0].style.display = 'none';
    }

    var body = document.getElementById('rec_' + id);
    if (!body)
	return;
    paint_details(body, xml);
}

function hyperlink_search(obj)
{
    var field = obj.getAttribute('searchfield');
    var term = obj.getAttribute('term');
    var queryfield  = document.getElementById('query');
    queryfield.value = field + '="' + term + '"';
    start_search();
}

function fetch_details(id)
{
    cur_id = -1;
    if (id == cur_id)
    {
	cur_id = -1;
	return;
    }
    if (!session)
	return;
    var url = "search.pz2?session=" + session +
        "&command=record" +
	"&id=" + id;
    SendXmlHttpObject(xfetchDetails = GetXmlHttpObject(), url, show_details);
}

function show_records()
{
    if (xshow.readyState != 4)
	return;
    var i;
    var xml = xshow.responseXML;
    var body = document.getElementById("body");
    var hits = xml.getElementsByTagName("hit");

    clear_cell(body);

    if (!hits[0]) // We should never get here with blocking operations
    {
	assign_text(body, 'No records yet');
	searchtimer = setTimeout(check_search, 250);
    }
    else
    {
	var total = Number(xml.getElementsByTagName('total')[0].childNodes[0].nodeValue);
	var merged = Number(xml.getElementsByTagName('merged')[0].childNodes[0].nodeValue);
	var start = Number(xml.getElementsByTagName('start')[0].childNodes[0].nodeValue);
	var num = Number(xml.getElementsByTagName('num')[0].childNodes[0].nodeValue);
	var clients = Number(xml.getElementsByTagName("activeclients")[0].childNodes[0].nodeValue);
        var pager = make_pager(merged, start,recstoshow);
        var break_node1 = document.createElement('br');
        var break_node2 = document.createElement('br');
        var record_container = document.createElement('div');
        var interval = create_element('div', 'Records : ' + (start + 1) +
                                             ' to ' + (start + num) + ' of ' +
                                             merged + ' (total hits: ' +
                                             total + ')');
	searched = 1;
        interval.className = 'results';
        record_container.className = 'records';

        body.appendChild(pager);
        body.appendChild(interval);
        body.appendChild(break_node1);
        body.appendChild(break_node2);
        body.appendChild(record_container);

	for (i = 0; i < hits.length; i++)
	{
	    var tn = hits[i].getElementsByTagName("md-title");
            var title = '';
	    var an = hits[i].getElementsByTagName("md-author");
	    var author = '';
	    var cn = hits[i].getElementsByTagName("count");
	    var count = 1;
	    var idn = hits[i].getElementsByTagName("recid");

	    if (tn[0] && tn[0].childNodes[0]) {
                title = tn[0].childNodes[0].nodeValue;
            } else {
                title = 'N/A';
            }
	    if (an[0] && an[0].childNodes[0])
		    author = an[0].childNodes[0].nodeValue;
	    if (cn[0])
		count = Number(cn[0].childNodes[0].nodeValue);
	    var id = idn[0].childNodes[0].nodeValue;
            
	    var record_div = document.createElement('div');
	    record_div.className = 'record';
	    record_div.setAttribute('name', 'listrecord');

            var record_cell = create_element('a', title);
            record_cell.setAttribute('href', '#' + id);
	    record_cell.setAttribute('id', id);
	    //record_cell.onclick = function() { fetch_details(this.getAttribute('id')); return false; }
	    record_cell.onclick = function() { fetch_details(this.getAttribute('id')); return false; };
            record_div.appendChild(record_cell);
	    if (author)
	    {
		record_div.appendChild(document.createTextNode(' by '));
		var al = create_element('a', author);
		al.setAttribute('href', '#');
		al.setAttribute('term', author);
		al.setAttribute('searchfield', 'au');
		al.onclick = function() { hyperlink_search(this); return false; };
		record_div.appendChild(al);
	    }
	    if (count > 1)
		record_div.appendChild(document.createTextNode(
			' (' + count + ')'));
	    var det_div = document.createElement('div');
	    if (id == cur_id)
		paint_details(det_div, cur_rec);
	    else
		det_div.style.display = 'none';
	    det_div.setAttribute('id', 'rec_' + id);
	    det_div.setAttribute('name', 'details');
	    record_div.appendChild(det_div);
	    record_container.appendChild(record_div);
	}

	shown++;
	if (clients > 0)
	{
	    if (shown < 5)
		searchtimer = setTimeout(check_search, 1000);
	    else
		searchtimer = setTimeout(check_search, 2000);
	}
    }
    if (!termtimer)
	termtimer = setTimeout(check_termlist, 500);
}

function check_search()
{
    clearTimeout(searchtimer);
    var url = "search.pz2?" +
        "command=show" +
	"&start=" + document.search.startrec.value +
	"&num=" + recstoshow +
	"&session=" + session +
	"&sort=" + cur_sort +
	"&block=1";
    xshow = GetXmlHttpObject();
    xshow.onreadystatechange=show_records;
    xshow.open("GET", url);
    xshow.send(null);
}


function refine_query (obj) {
    var term = obj.getAttribute('term');
    var cur_termlist = obj.getAttribute('facet');
    var query_cell = document.getElementById('query');
    var id = obj.getAttribute('target_id');
    
    term = term.replace(/[\(\)]/g, '');
    
    if (cur_termlist == 'subject')
	query_cell.value += ' and su="' + term + '"';
    else if (cur_termlist == 'author')
	query_cell.value += ' and au="' + term + '"';
    else if (cur_termlist == 'date')
	query_cell.value += ' and date="' + term + '"';
    else if (cur_termlist == 'xtargets')
	filter ='pz:id=' +  id;

    start_search();
}

function clear_termlists()
{
    var i;
    for (i = 0; i < facet_list.length; i++)
	clear_cell(facet_list[i][1]);
}

function show_termlists()
{
    if (xtermlist.readyState != 4)
	return;

    var i;
    var xml = xtermlist.responseXML;
    var clients =
	Number(xml.getElementsByTagName("activeclients")[0].childNodes[0].nodeValue);
    var lists = xml.getElementsByTagName("list");

    for (i = 0; i < lists.length; i++)
    {
	var listname = lists[i].getAttribute('name');
	var body = document.getElementById('facet_' + listname + '_terms');
	if (body.style.display == 'none')
	    continue;
	clear_cell(body);
	var terms = lists[i].getElementsByTagName('term');
	var t;
        for (t = 0; t < terms.length; t++)
	{
	    var namen = terms[t].getElementsByTagName("name");
	    var freqn = terms[t].getElementsByTagName("frequency");
	    var idn = terms[t].getElementsByTagName("id");
	    if (namen[0])
	    {
                var term = namen[0].childNodes[0].nodeValue;
		var freq = freqn[0].childNodes[0].nodeValue;
		var id;
		if (idn[0])
		    id = idn[0].childNodes[0].nodeValue;
                var refine_cell = create_element('a', term + ' (' + freq + ')');
                refine_cell.setAttribute('href', '#');
                refine_cell.setAttribute('term', term);
                refine_cell.setAttribute('facet', listname);
		refine_cell.setAttribute('target_id', id);
                refine_cell.onclick = function () {
                    refine_query(this);
                    return false;
                };
                body.appendChild(refine_cell);
	    }
	}
    }
    if (clients > 0)
	termtimer = setTimeout(check_termlist, 1000);
}

function check_termlist()
{
    var facet_names = '';
    var i;
    for (i = 0; i < facet_list.length; i++)
	if (facet_list[i][1].style.display != 'none')
	{
	    if (facet_names)
		facet_names += ',';
	    facet_names += facet_list[i][0];
	}
    var url = "search.pz2?" +
        "command=termlist" +
	"&session=" + session +
	"&name=" + facet_names +
	"&num=12";
    SendXmlHttpObject(xtermlist = GetXmlHttpObject(), url, show_termlists);
}

function show_stat()
{
    if (xstat.readyState != 4)
	return;
    var i;
    var xml = xstat.responseXML;
    var body = document.getElementById("stat");
    var nodes = xml.childNodes[0].childNodes;
    var clients =
	Number(xml.getElementsByTagName("activeclients")[0].childNodes[0].nodeValue);
    if (!nodes[0])
    {
	stattimer  = setTimeout(check_stat, 500);
    }
    else
    {
	assign_text(body, '(');
	for (i = 0; i < nodes.length; i++)
	{
	    if (nodes[i].nodeType != 1)
		continue;
	    var value = nodes[i].childNodes[0].nodeValue;
	    if (value == 0)
		continue;
	    var name = nodes[i].nodeName;
	    append_text(body, ' ' + name + '=' + value);
	}

        append_text(body, ')');
	if (clients > 0)
	    stattimer = setTimeout(check_stat, 2000);
    }
}

function check_stat()
{
    var url = "search.pz2?" +
        "command=stat" +
	"&session=" + session;
    xstat = GetXmlHttpObject();
    xstat.onreadystatechange=show_stat;
    xstat.open("GET", url);
    xstat.send(null);
}

function search_started()
{
    if (xsearch.readyState != 4)
	return;
    var xml = xsearch.responseXML;
    var error = xml.getElementsByTagName("error");
    if (error[0])
    {
	var msg = error[0].childNodes[0].nodeValue;
	alert(msg);
	return;
    }
    check_search();
    stattimer = setTimeout(check_stat, 1000);
}

function clear_filter()
{
    filter = '';
}

function start_search()
{
    clearTimeout(termtimer);
    termtimer = 0;
    clearTimeout(searchtimer);
    searchtimer = 0;
    clearTimeout(stattimer);
    stattimer = 0;
    clearTimeout(showtimer);
    showtimer = 0;
    cur_id = -1;
    clear_termlists();
    var query = escape(document.getElementById('query').value);
    var url = "search.pz2?" +
        "command=search" +
	"&session=" + session +
	"&query=" + query +
	"&filter=" + escape(filter);
    xsearch = GetXmlHttpObject();
    xsearch.onreadystatechange=search_started;
    xsearch.open("GET", url);
    xsearch.send(null);
    clear_cell(document.getElementById("body"));
    update_history();
    shown = 0;
    document.search.startrec.value = 0;
}

function session_encode ()
{
    var i;
    var session = '';

    for (i = 0; i < session_cells.length; i++)
    {
        var name = session_cells[i];
        var value = escape(document.getElementById(name).value);
        session += '&' + name + '=' + value;
    }

    return session;
}


function session_restore (session)
{
    var fields = session.split(/&/);
    var i;

    for (i = 1; i < fields.length; i++)
    {
        var pair = fields[i].split(/=/);
        var key = pair.shift();
        var value = pair.join('=');
        var cell = document.getElementById(key);

        cell.value = value;
    }
    
}


function session_read ()
{
    var ses = window.location.hash.replace(/^#/, '');
    return ses;
}


function session_store (new_value)
{
    window.location.hash = '#' + new_value;
}


function update_history ()
{
    var session = session_encode();
    session_store(session);
    old_session = session;
}


function session_check ()
{
    var session = session_read();
    var action = document.search.action_type.value;

    clearInterval(url_surveillence);

    if ( session != unescape(old_session) )
    {
        session_restore(session);

        if (action == 'search') {
            start_search();
        } else if (action == 'page') {
            check_search();
        } else {
            alert('Unregocnized action_type: ' + action);
            return;
        }
    }
    
    url_surveillence = setInterval(session_check, 200);
}


function get_available_facets () {
    var facet_container = document.getElementById('termlists');
    var facet_cells = facet_container.childNodes;
    var facets = Array();
    var i;

    for (i = 0; i < facet_cells.length; i++) {
        var cell = facet_cells.item(i);

        if (cell.className == 'facet') {
            var facet_name = cell.id.replace(/^facet_([^_]+)_terms$/, "$1");
            facets.push(Array(facet_name, cell));
        }
    }

    return facets;
}


function get_facet_container (obj) {
    return document.getElementById(obj.id + '_terms');
}


function toggle_facet (obj) {
    var container = get_facet_container(obj);

    if (obj.className == 'selected') {
        obj.className = 'unselected';
        container.style.display = 'inline';
	check_termlist();
    } else {
        obj.className = 'selected';
        container.style.display = 'none';
    }
}
