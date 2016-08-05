;(function (window, document, Math) {
  /**
   *定义事件名称
   */
  var
  hasTouch = 'ontouchstart' in window,
  START_EV = hasTouch ? 'touchstart' : 'mousedown',
  MOVE_EV = hasTouch ? 'touchmove' : 'mousemove',
  END_EV = hasTouch ? 'touchend' : 'mouseup',
  CANCEL_EV = hasTouch ? 'touchcancel' : 'mouseup';

  /*
  *获取时间
  */
  function getTime(){
    return new Date().getTime();
  }
  //deceleration减速
   /**
    * 根据我们的拖动返回运动的长度与耗时，用于惯性拖动判断
    * @param current 当前鼠标位置
    * @param start touchStart时候记录的Y（可能是X）的开始位置，但是在touchmove时候可能被重写
    * @param time touchstart到手指离开时候经历的时间，同样可能被touchmove重写
    * @param lowerMargin y可移动的最大距离，这个一般为计算得出 this.wrapperHeight - this.scrollerHeight
    * @param wrapperSize 如果有边界距离的话就是可拖动，不然碰到0的时候便停止
    * @param deceleration 匀减速
    * @returns {{destination: number, duration: number}}
    */
    function momentum(current, start, time, lowerMargin, wrapperSize, deceleration) {
       var distance = current - start,
           speed = Math.abs(distance) / time,
           destination,
           duration;
       //减速变量
       deceleration = deceleration === undefined ? 0.0006 : deceleration;
       //减速路程
       destination = current + ( speed * speed ) / ( 2 * deceleration ) * ( distance < 0 ? -1 : 1 );
       //持续时间
       duration = speed / deceleration;

       if ( destination < lowerMargin ) {
           destination = wrapperSize ? lowerMargin - ( wrapperSize / 2.5 * ( speed / 8 ) ) : lowerMargin;
           distance = Math.abs(destination - current);
           duration = distance / speed;
       } else if ( destination > 0 ) {
           destination = wrapperSize ? wrapperSize / 2.5 * ( speed / 8 ) : 0;
           distance = Math.abs(current) + destination;
           duration = distance / speed;
       }

       return {
           destination: Math.round(destination),
           duration: duration
       };
   };

  /*
  *动画函数
  **/

  var ease = {
    //二次方程式
    quadratic: {
        style: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        fn: function (k) {
            return k * ( 2 - k );
        }
    },
    //圆形的
    circular: {
        style: 'cubic-bezier(0.1, 0.57, 0.1, 1)',    // Not properly "circular" but this looks better, it should be (0.075, 0.82, 0.165, 1)
        fn: function (k) {
            return Math.sqrt( 1 - ( --k * k ) );
        }
    }
  }
  /**
   * [Constructor]
   * @param {[type]} el      [description]
   * @param {[type]} options [description]
   */
  function IScroll(el,options){
    /*
    去除掉#wrapper这种形式的传入
     */
    if(el.charAt(0)=="#"){
      el = el.substr(1, el.length-1);
    }
    this.wrapper  = typeof el == 'string' ? document.getElementById(el) : el;
    this.wrapper.style.overflow = 'hidden';

    this.scroller = this.wrapper.children[0];
    this.scrollerStyle = this.scroller.style;
    this.options = {

      bounce:true,//反弹
      deceleration:undefined,//减速
      bounceTime:600,
      /*
      横竖向滚动配置
       */
      scrollX: false,
      scrollY: true,
      /*
      方向锁定阈值，比如用户点击屏幕后，x与y之间差距大于5px，判断用户的拖动意图，是x方向拖动还是y方向
       */
      directionLockThreshold:5,

      // Events
      onRefresh: null,
      onBeforeScrollStart: function (e) { e.preventDefault(); },
      onScrollStart: null,
      onBeforeScrollMove: null,
      onScrollMove: null,
      onBeforeScrollEnd: null,
      onScrollEnd: null

    }
    for ( var i in options ) {
      this.options[i] = options[i];
    }
    this.options.bounceEasing = ease.circular;
    this.x = 0;
    this.y = 0;
    this.directionX = 0;
    this.directionY = 0;
    this.translateZ = ' translateZ(0)' ;

    this._init();
    this.refresh()
  }
  IScroll.prototype = {
    refresh:function refresh(){
      console.log('refresh');
      var that = this;
      that.wrapperW = that.wrapper.clientWidth || 1;
      that.wrapperH = that.wrapper.clientHeight || 1;
      // 获取包含块的宽度/高度
       this.wrapperWidth    = this.wrapper.clientWidth;
       this.wrapperHeight    = this.wrapper.clientHeight;

      that.minScrollY = -that.options.topOffset || 0;
  		that.scrollerW = Math.round(that.scroller.offsetWidth );
  		that.scrollerH = Math.round((that.scroller.offsetHeight + that.minScrollY));
  		that.maxScrollX = that.wrapperW - that.scrollerW;
  		that.maxScrollY = that.wrapperH - that.scrollerH + that.minScrollY;

      // 是否可以垂直/水平滑动
      this.hasHorizontalScroll    = this.options.scrollX && this.maxScrollX < 0;
      this.hasVerticalScroll        = this.options.scrollY && this.maxScrollY < 0;
      if ( !this.hasHorizontalScroll ) {
          this.maxScrollX = 0;
          this.scrollerWidth = this.wrapperWidth;
      }

      if ( !this.hasVerticalScroll ) {
          this.maxScrollY = 0;
          this.scrollerHeight = this.wrapperHeight;
      }

      // console.log(that.wrapperH);
      that.endTime = 0;
      that.directionX = 0;    //x方向移动数
      that.directionY = 0;    //y方向移动数

  		if (that.options.onRefresh) that.options.onRefresh.call(that);
      that.scroller.style.webkitTransitionDuration = '0';
      that._resetPos(200);
    },
    getComputedPosition: function () {
        //获取scroller的样式
        var matrix = window.getComputedStyle(this.scroller, null),
            x, y;

        matrix = matrix.webkitTransform.split(')')[0].split(', ');
        x = +(matrix[12] || matrix[4]);
        y = +(matrix[13] || matrix[5]);
        //返回 (x ,y)  or (top ,left)
        return { x: x, y: y };
    },
    _init: function () {
      this._initEvents();
    },
    _initEvents:function(){
      this._bind(START_EV);
    },
    _onStart:function onStart(event) {
      console.log('_onStart');
      var target = event.target;
      while (target.nodeType != 1)    target = target.parentNode;
      if (target.tagName != 'SELECT' && target.tagName != 'INPUT' && target.tagName != 'TEXTAREA'){
        event.preventDefault();
      }
      if (this.options.onBeforeScrollStart) this.options.onBeforeScrollStart.call(this, event);
      this.moved    = false;
      var point = event.touches ? event.touches[0] : event;
      this.distX    = 0;        //
      this.distY    = 0;        //
      this.directionLocked = 0;    //方向锁

      this.startTime = getTime();
      this._transitionTime();
      // this.x = event.type === 'touchstart' ? event.targetTouches[0].pageX : event.pageX;
      // this.y = event.type === 'touchstart' ? event.targetTouches[0].pageY : event.pageY;

      this.startX    = this.x;        // scroller开始位置x
      this.startY    = this.y;        // scroller开始位置y

      this.pointX    = point.pageX;    // 触点x
      this.pointY    = point.pageY;    // 触点y

      /*
      如果还在运动中,则快速滚到结束位置
      */
     if ( this.isInTransition ) {
         this.isInTransition = false;
         // 获取当前位置
         var pos = this.getComputedPosition();
         // 滑动到当前位置 相当于停止于此处
         this._translate(Math.round(pos.x), Math.round(pos.y));

     }
      if (this.options.onScrollStart) this.options.onScrollStart.call(this, event);
      this._bind(MOVE_EV);
      this._bind(END_EV);
      this._bind(CANCEL_EV);
      this._bind('webkitTransitionEnd');


    },

    _onMove:function onMove(event){
      console.log('_onMove');
      var that = this;
      var point = event.touches ? event.touches[0] : event;
      var deltaX  = point.pageX - this.pointX;    // 当前触点的pagex - 开始时的pagex = 触点档次增量x  [变量增量]
      var deltaY  = point.pageY - this.pointY;    // 触点增量y

      if (that.options.onBeforeScrollMove) that.options.onBeforeScrollMove.call(that, event);
      var timestamp = getTime();
      var absDistX, absDistY,newX,newY;
      // 最近上一次的触点位置
      this.pointX = point.pageX;
      this.pointY = point.pageY;


      // 触点移动的距离
      this.distX        += deltaX;
      this.distY        += deltaY;
      absDistX        = Math.abs(this.distX);
      absDistY        = Math.abs(this.distY);

      /*
      除非设置了freeScroll，否则将只允许同一时间一个方向滑动
       */

       if ( absDistX > absDistY + this.options.directionLockThreshold ) {
           this.directionLocked = 'h';        // lock horizontally
       } else if ( absDistY >= absDistX + this.options.directionLockThreshold ) {
           this.directionLocked = 'v';        // lock vertically
       } else {
           this.directionLocked = 'n';        // no lock
       }
       if ( this.directionLocked == 'h' ) {
           deltaY = 0;
       } else if ( this.directionLocked == 'v' ) {
           deltaX = 0;
       }
       deltaX = this.hasHorizontalScroll ? deltaX : 0;
       deltaY = this.hasVerticalScroll ? deltaY : 0;


      newX = this.x + deltaX;
      newY = this.y + deltaY;


      // We need to move at least 10 pixels for the scrolling to initiate
       // 触点至少移动10px才会触发scroll的move 并且 移动大于300ms
      //  console.log((timestamp - this.endTime ));
      //  console.log(absDistX,absDistY);
       if ( timestamp - this.endTime > 300 && (absDistX < 10 && absDistY < 10) ) {
           return;
       }
       // Slow down if outside of the boundaries

  		if (newX > 0 || newX < that.maxScrollX) {

  			newX = that.options.bounce ? that.x + (deltaX / 2) : newX >= 0 || that.maxScrollX >= 0 ? 0 : that.maxScrollX;
  		}
  		if (newY > this.minScrollY || newY < this.maxScrollY) {

  			newY = this.options.bounce ? this.y + (deltaY / 2) : newY >= this.minScrollY || this.maxScrollY >= 0 ? this.minScrollY : this.maxScrollY;
  		}

      // this._trigger('scrollStart');
      this.moved = true;

      this._translate(newX, newY);
      this.directionY = deltaY > 0 ? -1 : deltaY < 0 ? 1 : 0; // -1 手势向上   1 手势向下
      // console.log((timestamp - this.startTime));
      if (timestamp - this.startTime > 300) {
        this.startTime = timestamp;
  			this.startX = this.x;
  			this.startY = this.y;
  		}

      if(this.options.onScrollMove) this.options.onScrollMove.call(this, event);
    },
    _onEnd:function onEnd(event){
      console.log('_onEnd');

      var that = this;
      this.isInTransition = 0;
      var newX = Math.round(this.x);
      var newY = Math.round(this.y);

      var duration = getTime() - this.startTime;
      var momentumX = this.hasHorizontalScroll ? momentum(this.x, this.startX, duration, this.maxScrollX, this.options.bounce ? this.wrapperWidth : 0, this.options.deceleration) : { destination: newX, duration: 0 };
      var momentumY = this.hasVerticalScroll ? momentum(this.y, this.startY, duration, this.maxScrollY, this.options.bounce ? this.wrapperHeight : 0, this.options.deceleration) : { destination: newY, duration: 0 };

      // var momentumY = momentum(this.y, this.startY, duration, this.maxScrollY, this.wrapperHeight , this.options.deceleration)
      //

      newX = momentumX.destination;

      newY = momentumY.destination;


        console.log(momentumX,momentumY);
      var time = Math.max(momentumX.duration, momentumY.duration);
      // var time = momentumY.duration;
      var easing = ease.quadratic;

      this._unbind(MOVE_EV);
      this._unbind(END_EV);
      this._unbind(CANCEL_EV);


      if (that.options.onBeforeScrollEnd) that.options.onBeforeScrollEnd.call(that, event);
      // 超过了边界就重新回到边界位
     this.endTime = getTime();

     if(this._resetPos(this.options.bounceTime) ) {
       return;
     }


      this.scrollTo(newX, newY, time, easing);



    },
    scrollTo:function scrollTo(x, y, time, easing){
      easing = easing || ease.circular;
      this.isInTransition = time > 0;
      this._transitionTimingFunction(easing.style);
      this._transitionTime(time);

      this._translate(x, y);

    },

    _translate:function _translate(x, y){
      console.log("_translate::",x, y);
      this.scrollerStyle.webkitTransform = 'translate(' + x + 'px,' + y + 'px)' + this.translateZ;

      this.x = x;
      this.y = y;
    },

    _transitionTime:function _transitionTime(time){
      time = time || 0;
      this.scrollerStyle.webkitTransitionDuration = time + 'ms';
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
    handleEvent: function (event) {
  		var that = this;
  		switch(event.type) {
  			case START_EV:that._onStart(event);	break;
  			case MOVE_EV: that._onMove(event); break;
  			case END_EV:
  			case CANCEL_EV: that._onEnd(event); break;
        case 'webkitTransitionEnd': that._onTransitionEnd(event); break;




  		}
  	},
    _onTransitionEnd:function(e){
      console.log("_onTransitionEnd");
      // return;
      //禁止掉其它动画的影响，如loading动画 e.target != this.scroller
      if ( e.target != this.scroller || !this.isInTransition ) {
          console.log('---------------',this.isInTransition);
           return;
       }

      this._transitionTime();
      if ( !this._resetPos(this.options.bounceTime) ) {
         this.isInTransition = false;
         this._unbind('webkitTransitionEnd');
         if (this.options.onScrollEnd) this.options.onScrollEnd.call(this);
      }
    },
    _resetPos:function(time){
      var x = this.x,
        y = this.y;
      time = time || 0;
        // console.log('_resetPos',this.directionY,this.y,this.maxScrollY );
        //向上滚动
        //
      y = this.y >= this.minScrollY || this.maxScrollY > 0 ? this.minScrollY : this.y < this.maxScrollY ? this.maxScrollY : this.y;
      x = this.x >= 0 ? 0 : this.x < this.maxScrollX ? this.maxScrollX : this.x;

      /**
      * 如果禁止水平滑动或者x大于0，x=0。如果可以滑动的情况，x应该是小于0的。
      * 否则（可水平滑动），x为maxScrollX即最左
      */
      if ( !this.hasHorizontalScroll || this.x > 0 ) {
          x = 0;
      } else if ( this.x < this.maxScrollX ) {
          x = this.maxScrollX;
      }
      /**
      * 如果禁止垂直滑动或者y大于0，y=0。如果可以滑动的情况，y应该是小于0的。
      * 否则（可垂直滑动），y为maxScrollY即最上
      */
      if ( !this.hasVerticalScroll || this.y > 0 ) {
          y = 0;
      } else if ( this.y < this.maxScrollY ) {
          y = this.maxScrollY;
      }


      if (x == this.x&&y == this.y) {
        if (this.moved) {
          this.moved = false;
          if (this.options.onScrollEnd) this.options.onScrollEnd.call(this);		// Execute custom code on scroll end
        }
        return false;
      }

      if ( x == this.x && y == this.y ) {
        return false;
      }

      this.scrollTo(x, y, time, this.options.bounceEasing);
      return true;
    }

   }
  window.FastScroll=window.fs=window.FS = window.is=window.IS = IScroll;
  if (!window.IScroll) {
    window.IScroll = IScroll;
  }
})(window, document, Math);
