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
      douyuRoom: 'http://open.douyucdn.cn/api/RoomApi/room/',
      panda: 'http://www.panda.tv/ajax_get_follow_rooms',
      pandaRoom: 'http://www.panda.tv/api_room_v2?roomid=',
      zhanqi: 'https://www.zhanqi.tv/api/user/follow.listall',
      huomao: 'https://www.huomao.com/subscribe/getUsersSubscribe',
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
      rooms: until.output(localStorage.getItem('rooms'), ''),
      platforms: until.output(localStorage.getItem('platforms'), 'douyu,panda,zhanqi,huomao,huya'),
      enableNotification: until.output(localStorage.getItem('enableNotification'), 'true'),
      queryInterval: until.output(localStorage.getItem('queryInterval'), '10')
    };
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
              isLive: true,
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
              isLive: true,
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
              isLive: true,
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
      case 'huomao':
        L.getInfo(until.API['huomao'], function(resp) {
          resp.data.usersSubChannels.filter(function(i) {
            return i.is_live === 1;
          }).forEach(function(i) {
            result.push({
              isLive: true,
              cover: i.image,
              name: i.channel,
              owner: i.nickname,
              audience: i.views,
              url: 'https://www.huomao.com/' + i.room_number
            });
          });
          callback(result, 'huomao');
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
                isLive: true,
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

  L.getRoomInfo = function(room, callback) {
    var roomArray = room.split('_');
    var platform = roomArray[0];
    var roomId = roomArray[2];
    switch (platform) {
      case 'douyu':
        L.getInfo(until.API['douyuRoom'] + roomId, function(resp) {
          if (resp.error) return;
          var data = resp.data;
          callback({
            isLive: data.room_status === '1',
            owner: data.owner_name,
            name: data.room_name,
            cover: data.room_thumb,
            audience: data.online,
            url: 'https://www.douyu.com/' + data.room_id
          }, room);
        });
        break;
      case 'panda':
        L.getInfo(until.API['pandaRoom'] + roomId, function(resp) {
          if (resp.errno) return;
          var data = resp.data;
          callback({
            isLive: data.videoinfo.status === '2',
            owner: data.hostinfo.name,
            name: data.roominfo.name,
            cover: data.roominfo.pictures.img,
            audience: data.roominfo.person_num,
            url: 'https://www.panda.tv/' + data.roominfo.id
          }, room);
        });
        break;
    }
  };

  L.getRoomsInfo = function(rooms, callback) {
    var rooms = rooms.split(',');
    if (!rooms.length) return;
    while (rooms.length) {
      liveReminder.getRoomInfo(rooms.shift(), callback);
    }
  };

  L.addRoom = function(platform, roomId, callback) {
    switch (platform) {
      case 'douyu':
        L.getInfo(until.API['douyuRoom'] + roomId, function(resp) {
          if (!resp.error) {
            callback(1, platform + '_' + resp.data.owner_name + '_' + resp.data.room_id);
          } else {
            callback(0, resp.data);
          }
        });
        break;
    }
    switch (platform) {
      case 'panda':
        L.getInfo(until.API['pandaRoom'] + roomId, function(resp) {
          if (!resp.errno) {
            callback(1, platform + '_' + resp.data.hostinfo.name + '_' + resp.data.roominfo.id);
          } else {
            callback(0, resp.errmsg);
          }
        });
        break;
    }
  };

  L.addAlarmHandler = function(config) {
    chrome.alarms.onAlarm.addListener(function(alarm) {
      if (alarm.name !== 'checkSubscriptions') return;
      if (config.type === 'auto') {
        L.getPlatformsInfo(config.platforms, function(value, platform) {
          if (typeof cachedItems[platform] !== 'undefined') {
            var goOnline = L.goOnlineAuto(value, cachedItems[platform]);
            var goOffline = L.goOnlineAuto(cachedItems[platform], value);
            goOnline.length && goOnline.forEach(L.showNotification);
            goOffline.length && goOffline.forEach(L.clearNotification);
          }
          cachedItems[platform] = value;
        });
      } else if (config.type === 'manu') {
        L.getRoomsInfo(config.rooms, function(value, room) {
          if (typeof cachedItems[room] !== 'undefined') {
            var goOnline = L.goOnlineManu(value, cachedItems[room]);
            var goOffline = L.goOnlineManu(cachedItems[room], value);
            goOnline && L.showNotification(value);
            goOffline && L.clearNotification(value);
          }
          cachedItems[room] = value;
        });
      }
    });
  };

  L.addNotificationHandler = function() {
    chrome.notifications.onClicked.addListener(function(id) {
      if (/^liveReminder/.test(id)) {
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

  L.goOnlineAuto = function(current, last) {
    return current.filter(function(v) {
      return last.every(function(e) { return e.url !== v.url });
    });
  };

  L.goOnlineManu = function(current, last) {
    return current.isLive && !last.isLive;
  };

})(window);