(function() {
  'use strict';

  function requestData(config, callback) {
    // 自动模式
    if (config.type === 'auto') {
      liveReminder.getPlatformsInfo(config.platforms, callback);
    }
  }

  function renderElement(data) {
    var html = '';
    var tpl = [
      '<li class="item" data-src="${url}">',
        '<img class="cover" src="${cover}" alt="${name}">',
        '<div class="info">',
          '<p class="room-title">${name}</p>',
          '<span><i class="owner"></i>&nbsp;${owner}</span>',
          '<span><i class="audience"></i>&nbsp;${audience}</span>',
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

  function init() {
    // 请求并渲染数据
    requestData(liveReminder.getConfig(), renderElement);
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