class Lock {
    constructor(counter) {
        this.counter = counter; // how many users can use the resource at one, set 1 for regular lock 
        this.waiters = []; // all the callback that are waiting to use the resource
    }

    hold(cb) {
        if (this.counter > 0) { // there is no one wating for the resource
            this.counter--; // update the resource is in usage
            cb();  // fire the requested callback
        } else {
            this.waiters.push(cb); // the resoucre is in usage you need to wait for it
        }
    }

    release() { // some one just relese the resource - pop the next user who is waiting and fire it
        if (this.waiters.length > 0) { // some one released the lock - so we need to see who is wating and fire it
            const cb = this.waiters.pop(); // get the latest request for the lock
            // select the relevent one
            process.nextTick(cb); // if you are on node
            setTimeOut(() => cb, 0); // if you are in the browser
        } else {
            this.counter++;
        }
    }
}