(function() {
  'use strict';

  function requestData(config, callback, callback2) {
    if (config.type === 'auto') {
      liveReminder.getPlatformsInfo(config.platforms, callback);
    } else if (config.type === 'manu') {
      liveReminder.getRoomsInfo(config.rooms, callback2);
    }
  }

  function renderElement(data) {
    var html = '';
    var tpl = [
      '<li class="item" data-src="${url}">',
        '<img class="cover" src="${cover}" alt="${name}">',
        '<div class="info">',
          '<p class="room-title">${name}</p>',
          '<span><i class="icon icon-owner"></i>&nbsp;${owner}</span>',
          '<span><i class="icon icon-audience"></i>&nbsp;${audience}</span>',
        '</div>',
      '</li>'
    ].join('');
    html = data.map(function(i) {
      return tpl.replace(/\$\{(\w+)\}/g, function() {
        return i[arguments[1]];
      });
    }).join('');
    document.getElementById('item-list').insertAdjacentHTML('beforeend', html);
  }

  function _renderElement(data) {
    var html = '';
    var tpl = '';
    if (!data.isLive) {
      tpl = [
        '<li class="item" data-src="${url}">',
          '<img class="cover" src="${cover}" alt="${name}">',
          '<div class="info">',
            '<p class="room-title">${name}</p>',
            '<span><i class="icon icon-owner"></i>&nbsp;${owner}</span>',
            '<span><i class="icon icon-rest"></i>&nbsp;休息</span>',
          '</div>',
        '</li>'
      ].join('');
    } else {
      tpl = [
        '<li class="item" data-src="${url}">',
          '<img class="cover" src="${cover}" alt="${name}">',
          '<div class="info">',
            '<p class="room-title">${name}</p>',
            '<span><i class="icon icon-owner"></i>&nbsp;${owner}</span>',
            '<span><i class="icon icon-audience"></i>&nbsp;${audience}</span>',
            '<span><i class="icon icon-live"></i>&nbsp;正在直播</span>',
          '</div>',
        '</li>'
      ].join('');
    }
    html = tpl.replace(/\$\{(\w+)\}/g, function() {
      return data[arguments[1]];
    });
    document.getElementById('item-list').insertAdjacentHTML('beforeend', html);
  }

  function init() {
    // 请求并渲染数据
    requestData(liveReminder.getConfig(), renderElement, _renderElement);
    // 绑定事件
    document.getElementById('go-to-options').addEventListener('click', liveReminder.openOptionsPage);
    document.getElementById('item-list').addEventListener('click', function(e) {
      var target = e.target;
      while (target.nodeName.toLowerCase() !== "li") target = target.parentNode;
      chrome.tabs.create({ url: target.getAttribute('data-src') });
    });
  }

  init();

})();