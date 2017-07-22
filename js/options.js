(function() {
  'use strict';

  var DOMS = {
    AUTO: document.querySelector("input[value='auto']"),
    MANU: document.querySelector("input[value='manu']"),
    PLATFORMS: document.querySelectorAll("input[name='platform']"),
    BTN_SAVE: document.getElementById('btn-save'),
    BTN_CLOSE: document.getElementById('btn-close'),
    NOTIFICATION: document.getElementById('notification'),
    QUERY: document.getElementById('query-interval'),
    NOTICE: document.getElementById('notice')
  };

  function bindEvent() {
    DOMS['AUTO'].addEventListener('click', function() {
      nodeListToArray(DOMS['PLATFORMS']).forEach(function(e) {
        e.disabled = false;
      });
    });

    DOMS['MANU'].addEventListener('click', function() {
      nodeListToArray(DOMS['PLATFORMS']).forEach(function(e) {
        e.disabled = true;
      });
    });

    DOMS['NOTIFICATION'].addEventListener('click', function(e) {
      DOMS['QUERY'].disabled = !e.target.checked;
    });

    DOMS['QUERY'].addEventListener('input', function(e) {
      var reg = /^\+?[1-9][0-9]*$/;
      if (!reg.test(e.target.value)) {
        DOMS['NOTICE'].className = DOMS['NOTICE'].className.replace('hidden', '');
      } else {
        DOMS['NOTICE'].className = 'hidden';
      }
    });

    DOMS['BTN_SAVE'].addEventListener('click', function() {
      if (!isValid()) return;
      liveReminder.setConfig(getFormData());
      closePage();
    });

    DOMS['BTN_CLOSE'].addEventListener('click', function() {
      closePage();
    });
  }

  function renderPage(config) {
    config.platforms && config.platforms.split(',').forEach(function(i) {
      document.querySelector('input[value=' + i + ']').checked = true;
    });

    document.querySelector('input[value=' + config.type + ']').click();

    DOMS['QUERY'].value = config.queryInterval;
    if (config.enableNotification === 'true') DOMS['NOTIFICATION'].click();
  }

  /**
   * 获取当前页面数据
   */
  function getFormData() {
    return {
      type: document.querySelector('input[name="type"]:checked').value,
      platforms: nodeListToArray(document.querySelectorAll('input[name="platform"]:checked')).map(function(e) {
        return e.value;
      }).toString(),
      enableNotification: DOMS['NOTIFICATION'].checked,
      queryInterval: DOMS['QUERY'].value
    };
  }

  /**
   * 检测有效性
   */
  function isValid() {
    return /^\+?[1-9][0-9]*$/.test(getFormData().queryInterval);
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