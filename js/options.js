(function() {
  'use strict';

  var DOMS = {
    AUTO: document.querySelector("input[value='auto']"),
    MANU: document.querySelector("input[value='manu']"),
    ROOMID: document.querySelector("input[name='room-id']"),
    PLATFORMS: document.querySelectorAll("input[name='platform']"),
    ROOMS_LIST:document.getElementById('rooms-list'),
    SELECTION:document.getElementById('selection'),
    BTN_ADD: document.getElementById('btn-add'),
    BTN_SAVE: document.getElementById('btn-save'),
    BTN_CLOSE: document.getElementById('btn-close'),
    QUERY: document.getElementById('query-interval'),
    NOTIFICATION: document.getElementById('notification'),
    ADD_ROOM_NOTICE: document.getElementById('add-room-notice'),
    QUERY_INTERVAL_NOTICE: document.getElementById('query-interval-notice')
  };

  var platforms = {
    douyu: '斗鱼',
    panda: '熊猫',
    zhanqi: '战旗',
    huomao: '火猫',
    huya: '虎牙'
  }

  function bindEvent() {
    DOMS['AUTO'].addEventListener('click', function() {
      nodeListToArray(DOMS['PLATFORMS']).forEach(function(e) {
        e.disabled = false;
      });
      [DOMS['SELECTION'], DOMS['ROOMID'], DOMS['BTN_ADD']].forEach(function(e) {
        e.disabled = true;
      });
      nodeListToArray(document.querySelectorAll('.btn-del')).forEach(function(e) {
        e.disabled = true;
      });
      DOMS['ROOMS_LIST'].className = 'disabled';
      resetManuInput();
    });

    DOMS['MANU'].addEventListener('click', function() {
      nodeListToArray(DOMS['PLATFORMS']).forEach(function(e) {
        e.disabled = true;
      });
      [DOMS['SELECTION'], DOMS['ROOMID'], DOMS['BTN_ADD']].forEach(function(e) {
        e.disabled = false;
      });
      nodeListToArray(document.querySelectorAll('.btn-del')).forEach(function(e) {
        e.disabled = false;
      });
      DOMS['ROOMS_LIST'].className = 'normal';
      resetManuInput();
    });

    DOMS['NOTIFICATION'].addEventListener('click', function(e) {
      DOMS['QUERY'].disabled = !e.target.checked;
    });

    DOMS['QUERY'].addEventListener('input', function(e) {
      var reg = /^\+?[1-9][0-9]*$/;
      if (!reg.test(e.target.value)) {
        DOMS['QUERY_INTERVAL_NOTICE'].innerHTML = '无效的输入！';
        DOMS['QUERY_INTERVAL_NOTICE'].className = DOMS['QUERY_INTERVAL_NOTICE'].className.replace('hidden', '');
      } else {
        DOMS['QUERY_INTERVAL_NOTICE'].className = 'notice hidden';
      }
    });

    DOMS['BTN_ADD'].addEventListener('click', function() {
      var selection_value = DOMS['SELECTION'].value;
      var doomId_value = DOMS['ROOMID'].value;
      DOMS['ADD_ROOM_NOTICE'].className = 'notice hidden';

      if (!doomId_value) return;
      liveReminder.addRoom(selection_value, doomId_value, function(errno, message) {
        if (!errno) {
          DOMS['ADD_ROOM_NOTICE'].innerHTML = message;
          DOMS['ADD_ROOM_NOTICE'].className = DOMS['ADD_ROOM_NOTICE'].className.replace('hidden', '');
        } else if (getFormData().rooms.indexOf(message) !== -1) {
          DOMS['ADD_ROOM_NOTICE'].innerHTML = '该直播间已订阅！';
          DOMS['ADD_ROOM_NOTICE'].className = DOMS['ADD_ROOM_NOTICE'].className.replace('hidden', '');
        } else {
          createRoomDiv(message);
        }
      });
    });

    DOMS['BTN_SAVE'].addEventListener('click', function() {
      var formData = getFormData();
      if (!/^\+?[1-9][0-9]*$/.test(formData.queryInterval)) return;
      liveReminder.setConfig(formData);
      closePage();
    });

    DOMS['BTN_CLOSE'].addEventListener('click', closePage);
  }

  function renderPage(config) {
    // 订阅的平台
    config.platforms && config.platforms.split(',').forEach(function(i) {
      document.querySelector('input[value=' + i + ']').checked = true;
    });
    
    // 订阅的直播间
    config.rooms && config.rooms.split(',').forEach(createRoomDiv);
    
    // 选择的模式
    document.querySelector('input[value=' + config.type + ']').click();
    
    // 后台查询间隔
    DOMS['QUERY'].value = config.queryInterval;

    // 是否开启浏览器通知
    if (config.enableNotification === 'true') DOMS['NOTIFICATION'].click();
  }

  /**
   * 重置手动输入项
   */
  function resetManuInput() {
    DOMS['ROOMID'].value = '';
    DOMS['SELECTION'].options[0].selected = true;
    DOMS['ADD_ROOM_NOTICE'].className = 'notice hidden';
  }

  /**
   * 手动订阅直播间
   */
  function createRoomDiv(info) {
    var infoArray = info.split('_');
    var newItem = document.createElement('div');
    var newSpan = document.createElement('span');
    var newIcon = document.createElement('i');
    var newButton = document.createElement('button');
    newItem.setAttribute('data-info', info);
    newItem.className = 'room-item';
    newSpan.className = 'room-owner';
    newSpan.innerHTML = platforms[infoArray[0]] + ' - ' + infoArray[1];
    newIcon.className = 'owner';
    newButton.className = 'btn btn-del';
    newButton.innerHTML = '-';
    newButton.addEventListener('click', unsubscribe);
    newItem.appendChild(newButton);
    newItem.appendChild(newIcon);
    newItem.appendChild(newSpan);

    DOMS['ROOMS_LIST'].appendChild(newItem);
  }

  /**
   * 取消直播间关注
   */
  function unsubscribe(e) {
    var item = e.target.parentNode;
    item.parentNode.removeChild(item);
  }

  /**
   * 获取当前页面数据
   */
  function getFormData() {
    return {
      type: document.querySelector('input[name="type"]:checked').value,
      rooms: nodeListToArray(document.querySelectorAll('.room-item')).map(function(e) {
        return e.getAttribute('data-info');
      }),
      platforms: nodeListToArray(document.querySelectorAll('input[name="platform"]:checked')).map(function(e) {
        return e.value;
      }),
      enableNotification: DOMS['NOTIFICATION'].checked,
      queryInterval: DOMS['QUERY'].value
    };
  }

  /**
   * nodeList转数组
   */
  function nodeListToArray(nodeList) {
    return Array.prototype.slice.call(nodeList);
  }

  /**
   * 关闭配置页面
   */
  function closePage() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      chrome.tabs.remove(tabs[0].id);
    });
  }

  /**
   * 初始化
   */
  function init() {
    bindEvent();
    renderPage(liveReminder.getConfig());
  }

  init();

})();