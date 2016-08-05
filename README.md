### FastsScroll使用文档
### 简介:
FastScroll是对iscroll、iscroll-lite的重写，主要解决在微信、webkit内核浏览器（PC和Mobile）上的iscroll体积太大，性能太差的问题。
#### 体积:

源码：14k

压缩后L：7k

gzip:2k

`我们的目标是gzip之后，不超过3k`

#### 浏览器支持情况:
支持PC、Mobile上webkit内核的浏览器

#### 引入方式:

```
<script type="text/javascript" src="./build/fastscroll.m.js">
</script>

```

#### API详解:
```
{
  topOffset: 0,
  scrollX: false,
  scrollY: true,
  onRefresh: null,
  onBeforeScrollStart: function (e) { e.preventDefault(); },
  onScrollStart: null,
  onBeforeScrollMove: null,
  onScrollMove: null,
  onBeforeScrollEnd: null,
  onScrollEnd: null
}
```
#### Demo代码:

```
var myScroll;

myScroll = new IScroll(id, options);

说明：
1、FastScroll的别名有：FastScroll、FS、fs、IScroll、is、IS
2、id可以为 ID、#ID、document.getElementById(ID)
3、options见API详解

```

#### 文件说明
```
fastscroll.b.js
fastscroll.m.js
fastscroll.r.js
fastscroll.c.js

* -b, –beautify [string], 输出带格式化的文件。
* -m, –mangle [string], 输出变量名替换后的文件。
* -r, –reserved [string], 保留变量名，排除mangle过程。
* -c, –compress [string], 输出压缩后的文件。

```
#### 扩展
可基于FastScroll进行二次扩展，如./src/adapter.js
