(function(window, document, Math) {
    var rAF = window.requestAnimationFrame || window.webkitRequestAnimationFrame || function(callback) {
        window.setTimeout(callback, 1e3 / 60);
    };
    var hasTouch = "ontouchstart" in window, START_EV = hasTouch ? "touchstart" : "mousedown", MOVE_EV = hasTouch ? "touchmove" : "mousemove", END_EV = hasTouch ? "touchend" : "mouseup", CANCEL_EV = hasTouch ? "touchcancel" : "mouseup";
    function getTime() {
        return new Date().getTime();
    }
    function momentum(current, start, time, lowerMargin, wrapperSize, deceleration) {
        var distance = current - start, speed = Math.abs(distance) / time, destination, duration;
        deceleration = deceleration === undefined ? 6e-4 : deceleration;
        destination = current + speed * speed / (2 * deceleration) * (distance < 0 ? -1 : 1);
        duration = speed / deceleration;
        if (destination < lowerMargin) {
            destination = wrapperSize ? lowerMargin - wrapperSize / 2.5 * (speed / 8) : lowerMargin;
            distance = Math.abs(destination - current);
            duration = distance / speed;
        } else if (destination > 0) {
            destination = wrapperSize ? wrapperSize / 2.5 * (speed / 8) : 0;
            distance = Math.abs(current) + destination;
            duration = distance / speed;
        }
        return {
            destination: Math.round(destination),
            duration: duration
        };
    }
    var ease = {
        quadratic: {
            style: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
            fn: function(k) {
                return k * (2 - k);
            }
        },
        circular: {
            style: "cubic-bezier(0.1, 0.57, 0.1, 1)",
            fn: function(k) {
                return Math.sqrt(1 - --k * k);
            }
        }
    };
    function IScroll(el, options) {
        if (el.charAt && el.charAt(0) == "#") {
            el = el.substr(1, el.length - 1);
        }
        this.wrapper = typeof el == "string" ? document.getElementById(el) : el;
        this.wrapper.style.overflow = "hidden";
        this.scroller = this.wrapper.children[0];
        this.scrollerStyle = this.scroller.style;
        this._events = {};
        this.options = {
            momentum: true,
            bounce: true,
            deceleration: undefined,
            bounceTime: 600,
            startX: 0,
            startY: 0,
            scrollX: false,
            scrollY: true,
            directionLockThreshold: 5,
            onfunction: function(e) {
                e.preventDefault();
            },
            onScrollStart: null,
            onBeforeScrollMove: null,
            onScrollMove: function() {
                console.log("ScrollY::", this.y);
            },
            onBeforeScrollEnd: null,
            onScrollEnd: null,
            useTransition: true
        };
        for (var i in options) {
            this.options[i] = options[i];
        }
        this.options.bounceEasing = ease.circular;
        if (this.options.probeType == 3) {
            this.options.useTransition = false;
        }
        this.x = 0;
        this.y = 0;
        this.directionX = 0;
        this.directionY = 0;
        this.translateZ = " translateZ(0)";
        this._init();
        this.refresh();
        this.scrollTo(this.options.startX, this.options.startY);
    }
    IScroll.prototype = {
        refresh: function refresh() {
            console.log("refresh");
            var that = this;
            var wrapperWidth = this.options.wrapperWidth;
            var wrapperHeight = this.options.wrapperHeight;
            var scrollerWidth = this.options.scrollerWidth;
            var scrollerHeight = this.options.scrollerHeight;
            that.wrapperW = wrapperWidth || that.wrapper.clientWidth || 1;
            that.wrapperH = wrapperHeight || that.wrapper.clientHeight || 1;
            this.wrapperWidth = wrapperWidth || this.wrapper.clientWidth;
            this.wrapperHeight = wrapperHeight || this.wrapper.clientHeight;
            that.minScrollY = -that.options.topOffset || 0;
            that.scrollerW = scrollerWidth || Math.round(that.scroller.offsetWidth);
            that.scrollerH = scrollerHeight || Math.round(that.scroller.offsetHeight + that.minScrollY);
            that.maxScrollX = that.wrapperW - that.scrollerW;
            that.maxScrollY = that.wrapperH - that.scrollerH + that.minScrollY;
            this.hasHorizontalScroll = this.options.scrollX && this.maxScrollX < 0;
            this.hasVerticalScroll = this.options.scrollY && this.maxScrollY < 0;
            if (!this.hasHorizontalScroll) {
                this.maxScrollX = 0;
                this.scrollerWidth = this.wrapperWidth;
            }
            if (!this.hasVerticalScroll) {
                this.maxScrollY = 0;
                this.scrollerHeight = this.wrapperHeight;
            }
            that.endTime = 0;
            that.directionX = 0;
            that.directionY = 0;
            if (that.options.onRefresh) that.options.onRefresh.call(that);
            that._resetPos();
        },
        getComputedPosition: function() {
            var matrix = window.getComputedStyle(this.scroller, null), x, y;
            console.log("getComputedPosition------", matrix.webkitTransform);
            matrix = matrix.webkitTransform.split(")")[0].split(", ");
            x = +(matrix[12] || matrix[4]);
            y = +(matrix[13] || matrix[5]);
            return {
                x: x,
                y: y
            };
        },
        _init: function() {
            this._initEvents();
        },
        _initEvents: function() {
            this._bind(START_EV);
        },
        _onStart: function onStart(event) {
            console.log("_onStart");
            var that = this;
            var target = event.target;
            while (target.nodeType != 1) target = target.parentNode;
            if (target.tagName != "SELECT" && target.tagName != "INPUT" && target.tagName != "TEXTAREA") {
                event.preventDefault();
            }
            if (this.options.onBeforeScrollStart) this.options.onBeforeScrollStart.call(this, event);
            this._execEvent("onBeforeScrollStart");
            this.moved = false;
            var point = event.touches ? event.touches[0] : event;
            this.distX = 0;
            this.distY = 0;
            this.directionLocked = 0;
            this.startTime = getTime();
            this._transitionTime();
            this.startX = this.x;
            this.startY = this.y;
            this.pointX = point.pageX;
            this.pointY = point.pageY;
            if (this.options.useTransition && this.isInTransition) {
                console.log("--------------in transition............", this.scrollerStyle.webkitTransitionDuration);
                that.isInTransition = false;
                var pos = that.getComputedPosition();
                that._translate(Math.round(pos.x), Math.round(pos.y));
                that.startX = that.x;
                that.startY = that.y;
            } else if (!this.options.useTransition && this.isAnimating) {
                this.isAnimating = false;
                this._execEvent("scrollEnd");
            }
            if (this.options.onScrollStart) this.options.onScrollStart.call(this, event);
            this._execEvent("onScrollStart");
            this._bind(MOVE_EV);
            this._bind(END_EV);
            this._bind(CANCEL_EV);
            this._bind("webkitTransitionEnd");
        },
        _onMove: function onMove(event) {
            console.log("_onMove");
            var that = this;
            event.preventDefault();
            var point = event.touches ? event.touches[0] : event;
            var deltaX = point.pageX - this.pointX;
            var deltaY = point.pageY - this.pointY;
            if (that.options.onBeforeScrollMove) that.options.onBeforeScrollMove.call(that, event);
            this._execEvent("onBeforeScrollMove");
            var timestamp = getTime();
            var absDistX, absDistY, newX, newY;
            this.pointX = point.pageX;
            this.pointY = point.pageY;
            this.distX += deltaX;
            this.distY += deltaY;
            absDistX = Math.abs(this.distX);
            absDistY = Math.abs(this.distY);
            if (absDistX > absDistY + this.options.directionLockThreshold) {
                this.directionLocked = "h";
            } else if (absDistY >= absDistX + this.options.directionLockThreshold) {
                this.directionLocked = "v";
            } else {
                this.directionLocked = "n";
            }
            if (this.directionLocked == "h") {
                deltaY = 0;
            } else if (this.directionLocked == "v") {
                deltaX = 0;
            }
            deltaX = this.hasHorizontalScroll ? deltaX : 0;
            deltaY = this.hasVerticalScroll ? deltaY : 0;
            newX = this.x + deltaX;
            newY = this.y + deltaY;
            if (timestamp - this.endTime > 300 && (absDistX < 10 && absDistY < 10)) {
                return;
            }
            if (newX > 0 || newX < that.maxScrollX) {
                newX = that.options.bounce ? that.x + deltaX / 3 : newX >= 0 || that.maxScrollX >= 0 ? 0 : that.maxScrollX;
            }
            if (newY > this.minScrollY || newY < this.maxScrollY) {
                newY = this.options.bounce ? this.y + deltaY / 3 : newY >= this.minScrollY || this.maxScrollY >= 0 ? this.minScrollY : this.maxScrollY;
            }
            this.moved = true;
            this._translate(newX, newY);
            this.directionY = deltaY > 0 ? -1 : deltaY < 0 ? 1 : 0;
            if (timestamp - this.startTime > 300) {
                this.startTime = timestamp;
                this.startX = this.x;
                this.startY = this.y;
                if (this.options.probeType == 1) {
                    this._execEvent("scroll");
                }
            }
            if (this.options.probeType > 1) {
                this._execEvent("scroll");
            }
            if (this.options.onScrollMove) this.options.onScrollMove.call(this, event);
            this._execEvent("onScrollMove");
        },
        _onEnd: function onEnd(event) {
            console.log("_onEnd");
            var that = this;
            this.isInTransition = 0;
            var newX = Math.round(this.x);
            var newY = Math.round(this.y);
            var distanceX = Math.abs(newX - this.startX);
            var distanceY = Math.abs(newY - this.startY);
            var duration = getTime() - this.startTime;
            this._unbind(MOVE_EV);
            this._unbind(END_EV);
            this._unbind(CANCEL_EV);
            var easing = "";
            if (that.options.onBeforeScrollEnd) that.options.onBeforeScrollEnd.call(that, event);
            this._execEvent("onBeforeScrollEnd");
            this.endTime = getTime();
            if (this._resetPos(this.options.bounceTime)) {
                return;
            }
            this.scrollTo(newX, newY);
            if (!this.moved) {
                console.log("---------onScrollCancel");
                if (this.options.onScrollCancel) this.options.onScrollCancel.call(this, event);
                this._execEvent("onScrollCancel");
                return;
            }
            console.log("flick::", duration, distanceX, distanceY);
            console.log("======", this.options.momentum, duration);
            if (this.options.momentum && duration < 300) {
                var momentumX = this.hasHorizontalScroll ? momentum(this.x, this.startX, duration, this.maxScrollX, this.options.bounce ? this.wrapperWidth : 0, this.options.deceleration) : {
                    destination: newX,
                    duration: 0
                };
                var momentumY = this.hasVerticalScroll ? momentum(this.y, this.startY, duration, this.maxScrollY, this.options.bounce ? this.wrapperHeight : 0, this.options.deceleration) : {
                    destination: newY,
                    duration: 0
                };
                newX = momentumX.destination;
                newY = momentumY.destination;
                console.log("_onEnd::newY:", newY);
                console.log(this.y, this.startY, duration, this.maxScrollY, this.options.bounce);
                var time = Math.max(momentumX.duration, momentumY.duration);
                this.isInTransition = 1;
            }
            if (newX != this.x || newY != this.y) {
                if (newX > 0 || newX < this.maxScrollX || newY > 0 || newY < this.maxScrollY) {
                    easing = ease.quadratic;
                }
                this.scrollTo(newX, newY, time, easing);
                return;
            }
        },
        scrollTo: function scrollTo(x, y, time, easing) {
            easing = easing || ease.circular;
            this.isInTransition = time > 0;
            if (!time || this.options.useTransition && easing.style) {
                this._transitionTimingFunction(easing.style);
                this._transitionTime(time);
                this._translate(x, y);
            } else {
                this._animate(x, y, time, easing.fn);
            }
        },
        _translate: function _translate(x, y) {
            console.log("_translate::", this.scrollerStyle.webkitTransitionDuration);
            this.scrollerStyle.webkitTransform = "translate(" + x + "px," + y + "px)" + this.translateZ;
            this.x = x;
            this.y = y;
        },
        _transitionTime: function _transitionTime(time) {
            time = time || 0;
            this.scrollerStyle.webkitTransitionDuration = time + "ms";
        },
        _transitionTimingFunction: function _transitionTimingFunction(easing) {
            this.scrollerStyle.webkitTransitionTimingFunction = easing;
        },
        _bind: function _bind(type, el, bubble) {
            (el || this.scroller).addEventListener(type, this, !!bubble);
        },
        _unbind: function _unbind(type, el, bubble) {
            (el || this.scroller).removeEventListener(type, this, !!bubble);
        },
        handleEvent: function(event) {
            var that = this;
            switch (event.type) {
              case START_EV:
                that._onStart(event);
                break;

              case MOVE_EV:
                that._onMove(event);
                break;

              case END_EV:
              case CANCEL_EV:
                that._onEnd(event);
                break;

              case "webkitTransitionEnd":
                that._onTransitionEnd(event);
                break;
            }
        },
        _onTransitionEnd: function(e) {
            console.log("_onTransitionEnd");
            if (e.target != this.scroller || !this.isInTransition) {
                return;
            }
            this._transitionTime();
            if (!this._resetPos(this.options.bounceTime)) {
                this.isInTransition = false;
                this._unbind("webkitTransitionEnd");
                if (this.options.onScrollEnd) this.options.onScrollEnd.call(this);
                this._execEvent("onScrollEnd");
                if (this.options.probeType) {
                    this._execEvent("scroll");
                }
            }
        },
        _resetPos: function(time) {
            console.log("_resetPos");
            var x = this.x, y = this.y;
            time = time || 0;
            if (!this.hasHorizontalScroll || this.x > 0) {
                x = 0;
            } else if (this.x < this.maxScrollX) {
                x = this.maxScrollX;
            }
            if (!this.hasVerticalScroll || this.y > 0) {
                y = 0;
            } else if (this.y < this.maxScrollY) {
                y = this.maxScrollY;
            }
            if (x == this.x && y == this.y) {
                return false;
            }
            console.log("-----3------");
            this.scrollTo(x, y, time, this.options.bounceEasing);
            return true;
        },
        on: function(type, fn) {
            if (!this._events[type]) {
                this._events[type] = [];
            }
            this._events[type].push(fn);
        },
        _execEvent: function(type) {
            console.log("_execEvent:", type);
            if (!this._events[type]) {
                return;
            }
            var i = 0, l = this._events[type].length;
            if (!l) {
                return;
            }
            for (;i < l; i++) {
                this._events[type][i].apply(this, [].slice.call(arguments, 1));
            }
        },
        _animate: function(destX, destY, duration, easingFn) {
            var that = this, startX = this.x, startY = this.y, startTime = getTime(), destTime = startTime + duration;
            function step() {
                var now = getTime(), newX, newY, easing;
                if (now >= destTime) {
                    that.isAnimating = false;
                    that._translate(destX, destY);
                    if (!that._resetPos(that.options.bounceTime)) {
                        that._execEvent("scrollEnd");
                    }
                    return;
                }
                now = (now - startTime) / duration;
                easing = easingFn(now);
                newX = (destX - startX) * easing + startX;
                newY = (destY - startY) * easing + startY;
                that._translate(newX, newY);
                if (that.isAnimating) {
                    rAF(step);
                }
                if (that.options.probeType == 3) {
                    that._execEvent("scroll");
                }
            }
            this.isAnimating = true;
            step();
        }
    };
    window.FastScroll = window.fs = window.FS = window.is = window.IS = IScroll;
    if (!window.IScroll) {
        window.IScroll = IScroll;
    }
})(window, document, Math);