define(['jquery', 'global/global__views', 'global/global__modules', 'auth/auth', 'jquery-caret'], function ($, View, Module) {
  'use strict';

  var $el,
    $queryContainer,
    url,
    $global = $(window),
    timeoutHandler,
    lastPolledCaretPosition,
    lastTriggeredCaretPosition,
    lastPolledValue,
    lastTriggeredValue;

  var destroy = function () {
    if($queryContainer) {
      $queryContainer.remove();
      $queryContainer = null;

      Module.get('query').trigger('hide:done');
      return true;
    } else {
      Module.get('query').trigger('hide:fail');
      return false;
    }
  };

  var _doAssist = function (query, caret, requestHighlighting) {
    if(query && caret) {
      _getSuggestion.call(null, query, caret, requestHighlighting).then(function (data /* status, jqXHR*/) {
        var suggestions,
          styleRanges;

        console.log(data);
        if(data.query === $el.text()) {
          suggestions = data.suggestions;
        } else {
          suggestions = [];
        }
        if(data.styleRanges) {
          // render styleRanges
          styleRanges = data.styleRanges;
        }

//        console.log(suggestions);
        $queryContainer = $(View.render('query', data));
        $queryContainer.css('top', $el.offset().top + 24);
        $queryContainer.css('left', $el.offset().left);
        $queryContainer.appendTo('body');
        $queryContainer.on('click', function () {
          console.log(arguments);
        });
      });

    }
  };

  var _getSuggestion = function (query, caret, requestHighlighting) {
    var defer = $.Deferred(),
      restUrl = url;
    if(url) {
      var substr = ['query', 'caret', 'styleRanges'],
        suggestArgs = [encodeURI(query), caret, (requestHighlighting ? ',styleRanges' : '')];

      substr.forEach(function (item, index) {
        restUrl = restUrl.replace('#{' + item  + '}', suggestArgs[index] ? suggestArgs[index] : '');
      });
    } else {
      restUrl = '/rest/users/queryAssist?caret=' + caret + '&fields=query,caret,suggestions' + (requestHighlighting ? ',styleRanges' : '') + '&query=' + encodeURI(query);
    }
    Module.get('auth')('ajax', restUrl).then(function (data, state, jqXHR) {
      defer.resolve(data, state, jqXHR);
    });
    return defer.promise();
  };

  var pollCaretPosition = function () {
    var caret = $el.caret();
    var value = $el.text();

    if(lastPolledCaretPosition !== caret || lastPolledValue !== value) {
      lastPolledCaretPosition = caret;
      lastPolledValue = value;
    } else if(value !== lastTriggeredValue) {
      lastTriggeredCaretPosition = caret;
      lastTriggeredValue = value;
      Module.get('query').trigger('delayedChange:done', {value: value, caret: caret});
      _doAssist.call(null, value, caret, true);
    } else if(caret !== lastTriggeredCaretPosition) {
      lastTriggeredCaretPosition = caret;
      lastTriggeredValue = value;
      Module.get('query').trigger('delayedCaretMove:done', {value: value, caret: caret});
      _doAssist.call(null, value, caret, true);
    }
  };

  var init = function (config) {
    $el = $(config.el);
    url = config.url;
    $el.bind('focus', function () {
      _startListen();
    });

    $el.bind('blur', function () {
      _stopListen();
    });
    $global.on('click', function (ev) {
      var target = $(ev.target);
      if(!target.is($el) && !target.closest('.ring-query').length) {
        destroy();
      }
    });

    if($el.is(':focus')) {
      _stopListen();
    }

  };

  var _startListen = function () {
    lastTriggeredCaretPosition = undefined;
    lastPolledCaretPosition = undefined;
    timeoutHandler = setInterval(pollCaretPosition, 250);
  };
  var _stopListen = function () {
    if(timeoutHandler) {
      clearInterval(timeoutHandler);
    }
  };

  $global.resize(destroy);

  Module.add('query', {
    init: {
      method: init,
      override: true
    },
    destroy: {
      method: destroy,
      override: true
    }
  });
});