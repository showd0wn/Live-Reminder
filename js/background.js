(function() {
    var config = liveReminder.getConfig();
    if (config.enableNotification === 'true') {
        chrome.alarms.create("checkSubscriptions", {
            delayInMinutes: 1,
            periodInMinutes: Number(config.queryInterval)
        });
        liveReminder.addAlarmHandler(config);
        liveReminder.addNotificationHandler();
    }
})();