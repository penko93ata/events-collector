let startTime;
let endTime;
let timeSpent = 0;
let hours;
let minutes;
let seconds;
let hidden, visibilityChange;
const BASE_URL = 'http://localhost:4003';
const ENDPOINT = 'history';
const links = document.querySelectorAll('a');
const buttons = document.querySelectorAll('button');
const defautHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Accept': 'application/json',
    'Content-Type': 'application/json'
};

function handleVisibilityChange() {
    // if browser tab is currently not active
    if (document[hidden]) {
        // calculate endtime in seconds
        endTime = new Date().getTime() / 1000;
        // calculate time spent if user changes to another
        timeSpent = timeSpent + Math.floor(endTime - startTime);
    } else {
        // restart start time if tab becomes active
        startTime = new Date().getTime() / 1000;
    }
}

function getMeta(metaName) {
    const metas = document.getElementsByTagName('meta');

    for (let i = 0; i < metas.length; i++) {
        if (metas[i].getAttribute('name') === metaName) {
            return metas[i].getAttribute('content');
        }
    }

    return '';
}

function getCookies() {
    const cookies = document.cookie.split(";").reduce((ac, cv, i) => Object.assign(ac, { [cv.split('=')[0]]: cv.split('=')[1] }), {});
    return cookies;
}

function getCookie(name) {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    if (match) return match[2];
}

function initializeLib() {
    setInterval(runEventsCollectorRequests, 30000);
    // Set the name of the hidden property and the change event for visibility
    if (typeof document.hidden !== "undefined") { // Opera 12.10 and Firefox 18 and later support 
        hidden = "hidden";
        visibilityChange = "visibilitychange";
    } else if (typeof document.msHidden !== "undefined") {
        hidden = "msHidden";
        visibilityChange = "msvisibilitychange";
    } else if (typeof document.webkitHidden !== "undefined") {
        hidden = "webkitHidden";
        visibilityChange = "webkitvisibilitychange";
    }
    // start tracking time
    startTime = new Date().getTime() / 1000;
    if (typeof document.addEventListener === "undefined" || hidden === undefined) {
        console.warn("This demo requires a browser, such as Google Chrome or Firefox, that supports the Page Visibility API.");
    } else {
        // Handle page visibility change   
        document.addEventListener(visibilityChange, handleVisibilityChange, false);
    }
}

function collectEvents(options) {
    initializeLib();
    const dataAttr = options.dataAttr;
    const values = options.getIdentifier();

    window.onload = (event) => {
        const payload = {
            resource: window.location.href,
            resourceType: 'url',
            tags: getMeta('keywords').split(',').map(item => item.trim()),
            eventType: event.type
        };

        const uuid = generateUniqueID();
        localStorage.setItem('eventsCollector-' + uuid, JSON.stringify({
            ...values,
            ...payload
        }));
        runEventsCollectorRequests();
    }

    // add event listeners to links
    for (let i = 0; i < links.length; i++) {
        var link = links[i];

        link.addEventListener('click', function (event) {
            // check for data attribute
            if (this.hasAttribute(dataAttr)) {
                const payload = {
                    resource: window.location.href,
                    resourceType: 'url',
                    tags: this.getAttribute(dataAttr).split(',').map(item => item.trim()),
                    eventType: event.type
                };
                const uuid = generateUniqueID();
                localStorage.setItem('eventsCollector-' + uuid, JSON.stringify({
                    ...values,
                    ...payload
                }));
            }
        });
    }

    // add event listeners to all buttons
    for (let i = 0; i < buttons.length; i++) {
        var button = buttons[i];

        button.addEventListener('click', function (event) {
            if (this.hasAttribute(dataAttr)) {
                const payload = {
                    resource: window.location.href,
                    resourceType: 'url',
                    tags: this.getAttribute(dataAttr).split(',').map(item => item.trim()),
                    eventType: event.type
                };
                const uuid = generateUniqueID();
                localStorage.setItem('eventsCollector-' + uuid, JSON.stringify({
                    ...values,
                    ...payload
                }));
            }
        });
    }

    window.onbeforeunload = (event) => {
        // get final endtime before leaving current URL
        endTime = new Date().getTime() / 1000;
        // calculate final time spent on current URL
        timeSpent = timeSpent + Math.floor(endTime - startTime);

        const payload = {
            resource: window.location.href,
            resourceType: 'url',
            tags: [],
            eventType: event.type,
            timeSpent
        };
        const uuid = generateUniqueID();
        localStorage.setItem('eventsCollector-' + uuid, JSON.stringify({
            ...values,
            ...payload
        }));
    };
}

function generateUniqueID() {
    let dt = new Date().getTime();
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        let r = (dt + Math.random() * 16) % 16 | 0;
        dt = Math.floor(dt / 16);
        return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
    return uuid;
}

function createCookie(name, value, days) {
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        var expires = "; expires=" + date.toGMTString();
    } else var expires = "";
    document.cookie = escape(name) + "=" + escape(value) + expires + "; path=/";
}

function runEventsCollectorRequests() {
    if (Object.keys(localStorage).length !== 0) {
        Object.keys(localStorage).forEach(localStorageItem => {
            if (localStorageItem.includes('eventsCollector-')) {
                const payload = localStorage.getItem(localStorageItem);
                // setTimeout - delay
                fetch(`${BASE_URL}/${ENDPOINT}`, {
                    method: 'POST',
                    headers: {
                        'X-Tenant': 'bulpros',
                        'X-Application-Id': 'SmartInteractions',
                        ...defautHeaders
                    },
                    body: payload
                })
                    .then((response) => localStorage.removeItem(localStorageItem))
                    .catch((err => {
                        console.log(err);
                    }));
            }
        });
    }
}

function generateSoftId(cookieName, expiresInDays) {
    const uuid = generateUniqueID();
    createCookie(cookieName, uuid, expiresInDays);

    return {
        softIdType: cookieName,
        softIdValue: uuid
    }
}
