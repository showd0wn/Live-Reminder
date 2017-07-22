(function(window) {
  'use strict';

  window.liveReminder = {};
  var L = window.liveReminder;

  var until = {
    output: function(value, def) {
      return value === null ? def : value;
    },
    API: {
      douyu: 'http://www.douyu.com/member/cp/get_follow_list',
      panda: 'http://www.panda.tv/ajax_get_follow_rooms',
      zhanqi: 'https://www.zhanqi.tv/api/user/follow.listall',
      huya: 'http://fw.huya.com/dispatch?do=subscribeList&uid='
    }
  };

  var cachedItems = {};

  L.openOptionsPage = function() {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open(chrome.runtime.getURL('options.html'));
    }
  };

  L.getConfig = function() {
    return {
      type: until.output(localStorage.getItem('type'), 'auto'),
      platforms: until.output(localStorage.getItem('platforms'), 'douyu,panda,zhanqi,huya'),
      enableNotification: until.output(localStorage.getItem('enableNotification'), 'true'),
      queryInterval: until.output(localStorage.getItem('queryInterval'), '10')
    }
  };

  L.setConfig = function(config) {
    Object.keys(config).forEach(function(k) {
      localStorage.setItem(k, config[k]);
    });
  };

  L.getInfo = function(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.send(null);
    xhr.responseType = 'json';
    xhr.onreadystatechange = function() {
      if (xhr.readyState == 4 && xhr.status == 200) {
        callback(xhr.response);
      }
    };
  };

  L.getPlatformInfo = function(platform, callback) {
    var result = [];
    switch (platform) {
      case 'douyu':
        L.getInfo(until.API['douyu'], function(resp) {
          resp.room_list.forEach(function(i) {
            result.push({
              cover: i.room_src,
              name: i.room_name,
              owner: i.nickname,
              audience: i.online,
              url: 'https://www.douyu.com' + i.url
            });
          });
          callback(result, 'douyu');
        });
        break;
      case 'panda':
        L.getInfo(until.API['panda'], function(resp) {
          resp.data.items.filter(function(i) {
            return i.status === '2';
          }).forEach(function(i) {
            result.push({
              cover: i.pictures.img,
              name: i.name,
              owner: i.userinfo.nickName,
              audience: i.person_num,
              url: 'https://www.panda.tv/' + i.id
            });
          });
          callback(result, 'panda');
        });
        break;
      case 'zhanqi':
        L.getInfo(until.API['zhanqi'], function(resp) {
          resp.data.filter(function(i) {
            return i.status === '4';
          }).forEach(function(i) {
            result.push({
              cover: i.bpic,
              name: i.title,
              owner: i.nickname,
              audience: i.online,
              url: 'https://www.zhanqi.tv' + i.roomUrl
            });
          });
          callback(result, 'zhanqi');
        });
        break;
      case 'huya':
        chrome.cookies.get({
          url: 'http://www.huya.com',
          name: 'yyuid'
        }, function(cookie) {
          L.getInfo(until.API['huya'] + cookie.value, function(resp) {
            resp.result.list.filter(function(i) {
              return i.isLive === true;
            }).forEach(function(i) {
              result.push({
                cover: i.screenshot,
                name: i.intro,
                owner: i.nick,
                audience: i.activityCount,
                url: 'http://www.huya.com/' + i.privateHost
              });
            });
            callback(result, 'huya');
          });
        });
        break;
    }
  };

  L.getPlatformsInfo = function(platforms, callback) {
    var platforms = platforms.split(',');
    if (!platforms.length) return;
    while (platforms.length) {
      liveReminder.getPlatformInfo(platforms.shift(), callback);
    }
  };

  L.addAlarmHandler = function(config) {
    chrome.alarms.onAlarm.addListener(function(alarm) {
      if (alarm.name !== 'checkSubscriptions') return;
      if (config.type === 'auto') {
        L.getPlatformsInfo(config.platforms, function(value, platform) {
          if (typeof cachedItems[platform] !== 'undefined') {
            var goOnline = L.goOnline(value, cachedItems[platform]);
            var goOffline = L.goOnline(cachedItems[platform], value);
            goOnline.length && goOnline.forEach(L.showNotification);
            goOffline.length && goOffline.forEach(L.clearNotification);
          }
          cachedItems[platform] = value;
        });
      }
    });
  };

  L.addNotificationHandler = function() {
    chrome.notifications.onClicked.addListener(function(id) {
      if (!/^liveReminder/.test(id)) {
        chrome.tabs.create({ url: id.replace('liveReminder-', '') });
      }
    });
  };

  L.showNotification = function(data) {
    chrome.notifications.create('liveReminder-' + data.url, {
      type: 'basic',
      iconUrl: 'images/icon128.png',
      title: data.owner + '正在直播',
      message: data.name,
      isClickable: true
    });
  };

  L.clearNotification = function(data) {
    chrome.notifications.clear('liveReminder-' + data.url);
  };

  L.goOnline = function(current, last) {
    return current.filter(function(v) {
      return last.every(function(e) { return e.url !== v.url });
    });
  };

})(window);