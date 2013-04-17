// Set up namespace and some state.
var mkdru = {
  // Variables
  active: false,
  callbacks: [],
  pz2: null,
  totalRec: 0,
  pagerRange: 6,
  defaultState: {
    page: 1,
    perpage: 20,
    sort: 'relevance',
    query:'',
    recid:null
  },
  state: {},
  realm: ''
};
// Wrapper for jQuery
(function ($) {

// IE doesn't decode JSON, jQuery in D7 does, not in D6 but it has its own.
if ($.parseJSON)
  mkdru.settings = $.parseJSON(Drupal.settings.mkdru.settings);
else
  mkdru.settings = Drupal.parseJson(Drupal.settings.mkdru.settings);

// Reference for external use
mkdru.facets = mkdru.settings.facets;

// So we can use jQuery BBQ with Drupal 6 and its 1.2.6 jQuery
if (!$.isArray) $.isArray = function(obj) {
  return Object.prototype.toString.call(obj) === "[object Array]";
};

// BBQ has no handy way to remove params without changing the hash.
// This takes an object to add and an array of keys to delete.
mkdru.hashAddDelMany = function (add, del) {
  var newHash = $.deparam.fragment();
  if (typeof(add) === 'object')
    $.extend(newHash, add);
  if ($.isArray(del))
    for (var i=0; i < del.length; i++)
      if (newHash[del[i]] !== 'undefined')
        delete newHash[del[i]];
  return $.param.fragment("#", newHash);
}

// It's sometimes cumbersome that object literals can't take variable keys.
mkdru.hashAddDelOne = function (key, value, del) {
  var toAdd;
  var toDel;
  if (key && value) {
    var toAdd = {};
    toAdd[key] = value;
  }
  if (del) {
    var toDel = [];
    toDel.push(del);
  }
  return mkdru.hashAddDelMany(toAdd, toDel);
}

// pz2.js event handlers:
mkdru.pz2Init = function () {
  if (mkdru.state.query) {
    // search will issue stat and termlist if the callbacks are enabled
    mkdru.search();
  }
};

mkdru.pz2Show = function (data) {
  mkdru.totalRec = data.merged;
  $('.mkdru-pager').html(mkdru.generatePager());
  $('.mkdru-counts').html(Drupal.theme('mkdruCounts', data.start + 1,
                                      data.start + data.num, data.merged, data.total));
  var html = "";
  for (var i = 0; i < data.hits.length; i++) {
    html += Drupal.theme('mkdruResult', data.hits[i], 
      i + 1 + mkdru.state.perpage * (mkdru.state.page - 1),
      "#" + $.param.fragment($.param.fragment(
        window.location.href, {recid: data.hits[i].recid})) + "\n"
    );
  }
  $('.mkdru-result-list').html(html);
  if (mkdru.state.recid) {
    mkdru.pz2.record(mkdru.state.recid);
  }
  else {
    $('.mkdru-results').show();
  }
};

mkdru.pz2Status = function (data) {
  $('.mkdru-status').html(Drupal.theme('mkdruStatus', data.activeclients, data.clients));
};

mkdru.compareIgnoreCase = function (value1, value2) {
  var lower1 = value1.toLowerCase();
  var lower2 = value2.toLowerCase();
  return lower1 == lower2;
};

mkdru.contains = function (hash, key, value) {
  if (hash[key]) {
    if (hash[key].length) {
      for (var i=0; i<hash[key].length; i++) {
        if (mkdru.compareIgnoreCase(hash[key][i], value)) {
          return true;
        }
      }
    } else {
      return mkdru.compareIgnoreCase(hash[key], value);
    }
  }
  return false;
}

mkdru.pz2Term = function (data) {
  // map all facets against selected, for simple rendering 
  var hash = $.deparam.fragment();
  var replacementhash = {}; // IE8 and below iterates also on attributes added in the loop
  for (var key in hash) {
    if (key.indexOf('limit') == 0 && hash[key]) 
      //always wrap in array
      replacementhash[key.substr(6)] = hash[key].split(/;+/);
    delete hash[key];
  }
  hash = replacementhash;
  for (var facet in mkdru.facets) {
    var terms = data[mkdru.facets[facet].pz2Name];
    for (var i=0; terms && i < terms.length; i++) {
      var term = terms[i];
      var value = facet == "source" ? term.id : term.name;
      if (mkdru.contains(hash, facet, value)) { //enabled
        term.toggleLink = mkdru.removeLimit(facet, value);
        term.selected = true;
      } else { //disabled
        term.toggleLink = mkdru.addLimit(facet, value);
        term.selected = false;
      }
    }
    $('.mkdru-facet-' + facet).html(
        Drupal.theme('mkdruFacet', terms, facet, mkdru.facets[facet].max, 
          hash[facet]));
  }
};

mkdru.pz2Record = function (data) {
  clearTimeout(mkdru.pz2.showTimer);
  $('.mkdru-results').hide();
  $('.mkdru-detail').html(Drupal.theme('mkdruDetail', data, mkdru.hashAddDelOne(null, null, 'recid')));
  $('.mkdru-detail').show();
  clearTimeout(mkdru.pz2.recordTimer);
};



// State and URL handling 

// populate state from current window's hash string
mkdru.stateFromHash = function () {
  mkdru.state = $.extend({}, mkdru.defaultState, $.deparam.fragment());
};

// set current window's hash string from state
mkdru.hashFromState = function () {
  // only include non-default settings in the URL
  var alteredState = {};
  for (var key in mkdru.defaultState) {
    if (mkdru.state[key] != mkdru.defaultState[key]) {
      alteredState[key] = mkdru.state[key];
    }
  }
  $.bbq.pushState(alteredState, 2);
};

// update mkdru_form theme's ui to match state
mkdru.uiFromState = function () {
  for (var key in mkdru.state) {
    switch(key) {
    case 'query':
      $('.mkdru-search input:text').attr('value', mkdru.state[key]);
      break;
    case 'perpage':
      $('.mkdru-perpage').attr('value', mkdru.state[key]);
      break;
    case 'sort':
      $('.mkdru-sort').attr('value', mkdru.state[key]);
      break;
    }
  }
};

mkdru.hashChange = function () {
  // return to top of page
  window.scrollTo(0,0);
  // do we need to restart the search?
  var searchTrigger = false;
  // shallow copy of state so we can see what changed.
  var oldState = $.extend({}, mkdru.state);
  mkdru.stateFromHash();
  // only have to compare values since all keys are initialised
  for (key in mkdru.state) {
    var changed = (mkdru.state[key] != oldState[key]);
    if (key.substring(0,5) === 'limit' && changed)
      searchTrigger = true;
    if (key === 'page' && changed)
      mkdru.pz2.showPage(mkdru.state.page-1);
    if (key === 'query' && changed)
      searchTrigger = true;
  }
  if (searchTrigger)
    mkdru.search();
  // request for record detail
  if (mkdru.state.recid && (mkdru.state.recid != oldState.recid)) {
    mkdru.pz2.record(mkdru.state.recid);
  }
  else {
    $('.mkdru-detail').hide();
    $('.mkdru-results').show();
  }
};

// return link to limit facet
mkdru.addLimit = function (facet, limit) {
  var newHash = $.deparam.fragment();
  delete newHash['page'];
  if ((typeof(newHash['limit_' + facet]) === 'undefined')
       || !mkdru.facets[facet].multiLimit) {
    newHash['limit_' + facet] = limit;
  }
  else {
    newHash['limit_' + facet] += ';' + limit;
  }
  return $.param.fragment("#", newHash);
};

// return link to remove limit from facet
mkdru.removeLimit = function (facet, limit) {
  var newHash = $.deparam.fragment();
  delete newHash['page'];
  if (!newHash['limit_' + facet].indexOf(';')
      || !mkdru.facets[facet].multiLimit) {
    delete newHash['limit_' + facet];
  }
  else {
    var limits = newHash['limit_' + facet].split(';');
    for (var i = 0; i < limits.length; i++) {
      if (limits[i] == limit) {
        limits.splice(i, 1);
        if (limits.length < 1)
          delete newHash['limit_' + facet];
        else
          newHash['limit_' + facet] = limits.join(';');
        break;
      }
    }
  }
  return $.param.fragment("#", newHash);
};



// form submit handler
mkdru.submitQuery = function () {
  // new query, back to defaults (shallow copy)
  mkdru.state = $.extend({}, mkdru.defaultState);
  mkdru.state.query = $('.mkdru-search input:text').attr('value');
  mkdru.pollDropDowns();
  mkdru.hashFromState();
  mkdru.search();
  mkdru.active = true;
  return false;
};

// Find the sort order we want to use based on settings and state 
mkdru.sortOrder = function () {
  if (mkdru.settings.disable_ranking == 1) {
    return "position:1";
  }
  return mkdru.state.sort;

}

// criteria drop-down (perpage, sort) handler
mkdru.submitCriteria = function () {
  mkdru.pollDropDowns();
  //search is not ON, do nothing
  if (!mkdru.active) return false;
  // pages mean different things now
  mkdru.state.page = 1;
  mkdru.hashFromState();
  mkdru.pz2.show(0, mkdru.state.perpage, mkdru.sortOrder());
  return false;
}

function escape_field_value(facet, value, doLimit) {
    if (doLimit) {
    	value = value.replace(/\\/g, '\\\\').replace(/,/g, '\\,');
    	return facet['pz2Name'] + '=' + value; 
    }
    else {
    	return  facet['limiter'] + '="' + value + '"';
    }
}

function makeFacetLimit(values, doLimit, separator) {
  // doLimit format author=value1|value2|value3
  if (doLimit)
    return values.join(separator);
  else
	// query format: ( author=value1 or author=value2 )  
	// Values already in name=value format
	return "(" + values.join(separator) + ")"
}


mkdru.search = function () {
  var filter = null;
  var limits = null;
  var query = mkdru.state.query;
  var doLimit = 1;
  var limits = []; 
  var facetSeparator;
  var valueSeparator;

  if (doLimit) {
      facetSeparator = ',';
      valueSeparator = ',';
  }
  else {
      facetSeparator = ' and ';
      valueSeparator = ' and ';
  }
  var noFacets = 0;
  // facet limit implementation
  for (var facet in mkdru.facets) {
    // facet is limited
    if (mkdru.state['limit_' + facet]) {
      if (facet == "source") {
        filter = 'pz:id=' + mkdru.state.limit_source;
      }
      else {
        var facet_limits = mkdru.state['limit_' + facet].split(/;+/);
	var facet_limit_parameters = [];
	// WARNING There are not support for multiple limits values for one facet in pazpar2 yet.
	// Well no support for OR between  
	var noValues = 0;
        for (var i = 0; i < facet_limits.length; i++) {
	    if (facet_limits[i]) {
	    	facet_limit_parameters[noValues++] = escape_field_value(mkdru.facets[facet], facet_limits[i], doLimit);
	    }
        }
	limits[noFacets++] = makeFacetLimit(facet_limit_parameters, doLimit, valueSeparator);
      }
    }
  }
  if (doLimit)
      mkdru.pz2.search(query, mkdru.state.perpage, mkdru.sortOrder(), filter, null, (limits.length > 0 ? {limit: limits.join(facetSeparator) } : null ));
  else {
      if (limits.length > 0)
	  query += ' and ' + limits.join(facetSeparator);
      mkdru.pz2.search(query, mkdru.state.perpage, mkdru.sortOrder(), filter);
  }
  mkdru.active = true;
};

mkdru.pollDropDowns = function () {
  mkdru.state.perpage = $('.mkdru-perpage').attr('value');
  mkdru.state.sort = $('.mkdru-sort').attr('value');
};

mkdru.generatePager = function () {
  // cast page parameter to numeric so we can add to it
  if (typeof mkdru.state.page == "string") {
    mkdru.state.page = Number(mkdru.state.page);
  }
  var total = Math.ceil(mkdru.totalRec / mkdru.state.perpage);
  var first = (mkdru.state.page - mkdru.pagerRange > 0)
      ? mkdru.state.page - mkdru.pagerRange : 1;
  var last = first + 2 * mkdru.pagerRange < total
      ? first + 2 * mkdru.pagerRange : total;
  var prev = null;
  var next = null;
  var pages = [];

  if ((mkdru.state.page - 1) >= first) {
    prev = "#" + $.param.fragment($.param.fragment(
               window.location.href, {page: mkdru.state.page - 1}))
  }
  if ((mkdru.state.page + 1) <= total) {
    next = "#" + $.param.fragment($.param.fragment(
               window.location.href, {page: mkdru.state.page + 1}))
  }

  for (var i = first; i <= last; i++) {
    pages.push("#" + $.param.fragment($.param.fragment(
               window.location.href, {page: i})));
  }

  return Drupal.theme('mkdruPager', pages, first, mkdru.state.page,
                      total, prev, next);
};



// wait until the DOM is ready, bind events
// and instantiate pz2 library
$(document).ready(function () {
  $(window).bind( 'hashchange', mkdru.hashChange);
  $('.mkdru-search').bind('submit', mkdru.submitQuery);
  $('.mkdru-search input:text').attr('value', '');
  $('.mkdru-perpage').bind('change', mkdru.submitCriteria);
  $('.mkdru-sort').bind('change', mkdru.submitCriteria);

  // generate termlist for pz2.js and populate facet limit state
  var termlist = [];
  for (var key in mkdru.facets) {
    termlist.push(mkdru.facets[key].pz2Name);
    mkdru.defaultState['limit_' + key] = null;
  }

  mkdru.pz2 = new pz2( { "onshow": mkdru.pz2Show,
              "showtime": 500, //each timer (show, stat, term, bytarget) can be specified this way
              "pazpar2path": mkdru.settings.pz2_path,
              "oninit": mkdru.pz2Init,
              "onstat": mkdru.pz2Status,
              "onterm": mkdru.pz2Term,
              "termlist": termlist.join(','),
              "usesessions" : mkdru.settings.use_sessions,
              "showResponseType": mkdru.showResponseType,
              "onrecord": mkdru.pz2Record,
              "autoInit": false } );
  mkdru.pz2.showFastCount = 1;

  // callback for access to DOM and pz2 object pre-search
  for (var i=0; i < mkdru.callbacks.length; i++) {
    mkdru.callbacks[i]();
  }

  if (typeof(Drupal.settings.mkdru.state) === "object") {
    // initialise state with properties from the hash in the URL taking
    // precedence over initial values passed in from embedding and
    // with defaults filling in the gaps
    mkdru.state = $.extend({}, mkdru.defaultState, Drupal.settings.mkdru.state, $.deparam.fragment());
    mkdru.hashFromState();
  } else {
    // initialise state to hash string or defaults
    mkdru.stateFromHash();
  }

  // update UI to match
  mkdru.uiFromState();
  
  //not running against SP? init, otherwise authenticate
  if (mkdru.settings.use_sessions === 1) {
    mkdru.pz2.init();
  } else {
    //runnin against SP
    var user = mkdru.settings.sp.user;
    var pass = mkdru.settings.sp.pass;
    var params = {};
    params['command'] = 'auth';
    if (user && pass) {
      params['action'] = 'login';
      params['username'] = user;
      params['password'] = pass;
    } else {
      params['action'] = 'ipauth';
    }
    var authReq = new pzHttpRequest(mkdru.settings.pz2_path, 
      function (err) {
        alert(Drupal.t("Authentication against metasearch gateway failed: ") + err);
      }
    );
    authReq.get(params,
      function (data) {
        var s = data.getElementsByTagName('status');
        if (s.length && Element_getTextContent(s[0]) == "OK") {
          mkdru.realm = data.getElementsByTagName('realm');
          mkdru.pz2Init();
        } else {
          alert(Drupal.t("Malformed response when authenticating against the metasearch gateway"));
        }
      }
    );
  }
});
})(jQuery);
