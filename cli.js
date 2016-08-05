var exec = require('child_process').exec;
function exe(cmdStr){
  exec(cmdStr, function(err,stdout,stderr){
      if(err) {
          console.log(cmdStr+'  fail:'+stderr);
      } else {
          console.log(cmdStr+'  success!');
      }
  });
}

var cmdStr1 = 'uglifyjs ./src/fastscroll.js -o ./build/fastscroll.b.js -b';
var cmdStr2 = 'uglifyjs ./src/fastscroll.js -o ./build/fastscroll.c.js -c';
var cmdStr3 = 'uglifyjs ./src/fastscroll.js -o ./build/fastscroll.m.js -m';
var cmdStr4 = 'uglifyjs ./src/fastscroll.js -o ./build/fastscroll.r.js -r';

exe(cmdStr1);
exe(cmdStr2);
exe(cmdStr3);
exe(cmdStr4);
