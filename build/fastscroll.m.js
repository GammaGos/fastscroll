(function(t,i,s){var o="ontouchstart"in t,n=o?"touchstart":"mousedown",r=o?"touchmove":"mousemove",e=o?"touchend":"mouseup",l=o?"touchcancel":"mouseup";function h(){return(new Date).getTime()}function a(t,i,o,n,r,e){var l=t-i,h=s.abs(l)/o,a,c;e=e===undefined?6e-4:e;a=t+h*h/(2*e)*(l<0?-1:1);c=h/e;if(a<n){a=r?n-r/2.5*(h/8):n;l=s.abs(a-t);c=l/h}else if(a>0){a=r?r/2.5*(h/8):0;l=s.abs(t)+a;c=l/h}return{destination:s.round(a),duration:c}}var c={quadratic:{style:"cubic-bezier(0.25, 0.46, 0.45, 0.94)",fn:function(t){return t*(2-t)}},circular:{style:"cubic-bezier(0.1, 0.57, 0.1, 1)",fn:function(t){return s.sqrt(1- --t*t)}}};function d(t,s){if(t.charAt(0)=="#"){t=t.substr(1,t.length-1)}this.wrapper=typeof t=="string"?i.getElementById(t):t;this.wrapper.style.overflow="hidden";this.scroller=this.wrapper.children[0];this.scrollerStyle=this.scroller.style;this.options={bounce:true,deceleration:undefined,bounceTime:600,scrollX:false,scrollY:true,directionLockThreshold:5,onRefresh:null,onBeforeScrollStart:function(t){t.preventDefault()},onScrollStart:null,onBeforeScrollMove:null,onScrollMove:null,onBeforeScrollEnd:null,onScrollEnd:null};for(var o in s){this.options[o]=s[o]}this.options.bounceEasing=c.circular;this.x=0;this.y=0;this.directionX=0;this.directionY=0;this.translateZ=" translateZ(0)";this._init();this.refresh()}d.prototype={refresh:function t(){console.log("refresh");var i=this;i.wrapperW=i.wrapper.clientWidth||1;i.wrapperH=i.wrapper.clientHeight||1;this.wrapperWidth=this.wrapper.clientWidth;this.wrapperHeight=this.wrapper.clientHeight;i.minScrollY=-i.options.topOffset||0;i.scrollerW=s.round(i.scroller.offsetWidth);i.scrollerH=s.round(i.scroller.offsetHeight+i.minScrollY);i.maxScrollX=i.wrapperW-i.scrollerW;i.maxScrollY=i.wrapperH-i.scrollerH+i.minScrollY;this.hasHorizontalScroll=this.options.scrollX&&this.maxScrollX<0;this.hasVerticalScroll=this.options.scrollY&&this.maxScrollY<0;if(!this.hasHorizontalScroll){this.maxScrollX=0;this.scrollerWidth=this.wrapperWidth}if(!this.hasVerticalScroll){this.maxScrollY=0;this.scrollerHeight=this.wrapperHeight}i.endTime=0;i.directionX=0;i.directionY=0;if(i.options.onRefresh)i.options.onRefresh.call(i);i.scroller.style.webkitTransitionDuration="0";i._resetPos(200)},getComputedPosition:function(){var i=t.getComputedStyle(this.scroller,null),s,o;i=i.webkitTransform.split(")")[0].split(", ");s=+(i[12]||i[4]);o=+(i[13]||i[5]);return{x:s,y:o}},_init:function(){this._initEvents()},_initEvents:function(){this._bind(n)},_onStart:function t(i){console.log("_onStart");var o=i.target;while(o.nodeType!=1)o=o.parentNode;if(o.tagName!="SELECT"&&o.tagName!="INPUT"&&o.tagName!="TEXTAREA"){i.preventDefault()}if(this.options.onBeforeScrollStart)this.options.onBeforeScrollStart.call(this,i);this.moved=false;var n=i.touches?i.touches[0]:i;this.distX=0;this.distY=0;this.directionLocked=0;this.startTime=h();this._transitionTime();this.startX=this.x;this.startY=this.y;this.pointX=n.pageX;this.pointY=n.pageY;if(this.isInTransition){this.isInTransition=false;var a=this.getComputedPosition();this._translate(s.round(a.x),s.round(a.y))}if(this.options.onScrollStart)this.options.onScrollStart.call(this,i);this._bind(r);this._bind(e);this._bind(l);this._bind("webkitTransitionEnd")},_onMove:function t(i){console.log("_onMove");var o=this;var n=i.touches?i.touches[0]:i;var r=n.pageX-this.pointX;var e=n.pageY-this.pointY;if(o.options.onBeforeScrollMove)o.options.onBeforeScrollMove.call(o,i);var l=h();var a,c,d,u;this.pointX=n.pageX;this.pointY=n.pageY;this.distX+=r;this.distY+=e;a=s.abs(this.distX);c=s.abs(this.distY);if(a>c+this.options.directionLockThreshold){this.directionLocked="h"}else if(c>=a+this.options.directionLockThreshold){this.directionLocked="v"}else{this.directionLocked="n"}if(this.directionLocked=="h"){e=0}else if(this.directionLocked=="v"){r=0}r=this.hasHorizontalScroll?r:0;e=this.hasVerticalScroll?e:0;d=this.x+r;u=this.y+e;if(l-this.endTime>300&&(a<10&&c<10)){return}if(d>0||d<o.maxScrollX){d=o.options.bounce?o.x+r/2:d>=0||o.maxScrollX>=0?0:o.maxScrollX}if(u>this.minScrollY||u<this.maxScrollY){u=this.options.bounce?this.y+e/2:u>=this.minScrollY||this.maxScrollY>=0?this.minScrollY:this.maxScrollY}this.moved=true;this._translate(d,u);this.directionY=e>0?-1:e<0?1:0;if(l-this.startTime>300){this.startTime=l;this.startX=this.x;this.startY=this.y}if(this.options.onScrollMove)this.options.onScrollMove.call(this,i)},_onEnd:function t(i){console.log("_onEnd");var o=this;this.isInTransition=0;var n=s.round(this.x);var d=s.round(this.y);var u=h()-this.startTime;var f=this.hasHorizontalScroll?a(this.x,this.startX,u,this.maxScrollX,this.options.bounce?this.wrapperWidth:0,this.options.deceleration):{destination:n,duration:0};var p=this.hasVerticalScroll?a(this.y,this.startY,u,this.maxScrollY,this.options.bounce?this.wrapperHeight:0,this.options.deceleration):{destination:d,duration:0};n=f.destination;d=p.destination;console.log(f,p);var S=s.max(f.duration,p.duration);var m=c.quadratic;this._unbind(r);this._unbind(e);this._unbind(l);if(o.options.onBeforeScrollEnd)o.options.onBeforeScrollEnd.call(o,i);this.endTime=h();if(this._resetPos(this.options.bounceTime)){return}this.scrollTo(n,d,S,m)},scrollTo:function t(i,s,o,n){n=n||c.circular;this.isInTransition=o>0;this._transitionTimingFunction(n.style);this._transitionTime(o);this._translate(i,s)},_translate:function t(i,s){console.log("_translate::",i,s);this.scrollerStyle.webkitTransform="translate("+i+"px,"+s+"px)"+this.translateZ;this.x=i;this.y=s},_transitionTime:function t(i){i=i||0;this.scrollerStyle.webkitTransitionDuration=i+"ms"},_transitionTimingFunction:function t(i){this.scrollerStyle.webkitTransitionTimingFunction=i},_bind:function t(i,s,o){(s||this.scroller).addEventListener(i,this,!!o)},_unbind:function t(i,s,o){(s||this.scroller).removeEventListener(i,this,!!o)},handleEvent:function(t){var i=this;switch(t.type){case n:i._onStart(t);break;case r:i._onMove(t);break;case e:case l:i._onEnd(t);break;case"webkitTransitionEnd":i._onTransitionEnd(t);break}},_onTransitionEnd:function(t){console.log("_onTransitionEnd");if(t.target!=this.scroller||!this.isInTransition){console.log("---------------",this.isInTransition);return}this._transitionTime();if(!this._resetPos(this.options.bounceTime)){this.isInTransition=false;this._unbind("webkitTransitionEnd");if(this.options.onScrollEnd)this.options.onScrollEnd.call(this)}},_resetPos:function(t){var i=this.x,s=this.y;t=t||0;s=this.y>=this.minScrollY||this.maxScrollY>0?this.minScrollY:this.y<this.maxScrollY?this.maxScrollY:this.y;i=this.x>=0?0:this.x<this.maxScrollX?this.maxScrollX:this.x;if(!this.hasHorizontalScroll||this.x>0){i=0}else if(this.x<this.maxScrollX){i=this.maxScrollX}if(!this.hasVerticalScroll||this.y>0){s=0}else if(this.y<this.maxScrollY){s=this.maxScrollY}if(i==this.x&&s==this.y){if(this.moved){this.moved=false;if(this.options.onScrollEnd)this.options.onScrollEnd.call(this)}return false}if(i==this.x&&s==this.y){return false}this.scrollTo(i,s,t,this.options.bounceEasing);return true}};t.FastScroll=t.fs=t.FS=t.is=t.IS=d;if(!t.IScroll){t.IScroll=d}})(window,document,Math);