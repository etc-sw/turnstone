/* node tools/check.js
   1) beonjim-engine.js가 플레이어 없이 돌 때 beonjim-sim.html의 엔진과 똑같은 역사를 내는지 대조한다.
   2) 왕의 명령이 결과를 바꾸는지 단순한 정책 몇 개로 잰다. */
"use strict";
var fs=require('fs'),path=require('path'),root=path.join(__dirname,'..');
var E=require(path.join(root,'beonjim-engine.js'));
var SEEDS=+process.argv[2]||60,MAXY=300,OPT=function(){return {hungerShare:1,sight:4};};

/* ---- 1. 원본 대조 ---- */
var html=fs.readFileSync(path.join(root,'beonjim-sim.html'),'utf8');
var a=html.indexOf('var F=0,R=1'),z=html.indexOf('/* ---- view ---- */');
var Orig=new Function(html.slice(a,z)+';return {newWorld:newWorld,year:year};')();
var bad=0;
for(var s=1;s<=30;s++){var w1=Orig.newWorld(12,s,OPT()),w2=E.newWorld(12,s,OPT());
  for(var y=0;y<MAXY&&!w1.over;y++){Orig.year(w1);E.year(w2);}
  var same=w1.year===w2.year&&w1.over===w2.over&&w1.log.length===w2.log.length;
  for(var i=0;same&&i<w1.b.length;i++)if(w1.b[i]!==w2.b[i]||w1.k[i]!==w2.k[i])same=false;
  if(!same){bad++;console.log('세상 '+s+': 원본과 다름');}}
console.log('원본 대조: 세상 30개 중 '+(30-bad)+'개 일치');

/* ---- 2. 정책 비교 ---- */
function enemyTarget(w){var e=3-w.player,k=E.findKing(w,e);if(k>=0)return k;var kc=E.findKing(w,w.player),best=-1,bd=999;
  for(var i=0;i<w.b.length;i++)if(w.b[i]&&E.col(w.b[i])===e){var d=E.dist(w,i,kc);if(d<bd){bd=d;best=i;}}return best;}
var POLICY={
  '플레이어 없음 (갈래 B 그대로)':null,
  '아무 명도 안 내림 (전부 곁에 둠)':function(){return null;},
  '해마다 하나씩 적 쪽으로 내보냄':function(w){var os=E.orders(w).filter(function(o){return !o.king;}),t=enemyTarget(w);if(!os.length||t<0)return null;
    var best=null,bd=999;os.forEach(function(o){var d=o.strike?-1:E.dist(w,o.to,t);if(d<bd){bd=d;best=o;}});return best;},
  '곁에 둘은 남기고 나머지를 내보냄':function(w){var os=E.orders(w).filter(function(o){return !o.king;}),t=enemyTarget(w),n={};os.forEach(function(o){n[o.from]=1;});
    var hit=os.filter(function(o){return o.strike;});if(hit.length)return hit[0];
    if(Object.keys(n).length<=2||t<0)return null;
    var best=null,bd=999;os.forEach(function(o){var d=E.dist(w,o.to,t);if(d<bd){bd=d;best=o;}});return best;}
};
console.log('\n왕의 명령 (12×12, 세상 '+SEEDS+'개, 최대 '+MAXY+'년, 범위 2칸). "내 색"은 첫 왕이 선 색.');
console.log(['정책','내 색 승','상대 승','미결','평균 길이','내 왕의 죽음','내보낸 군사'].join(' | '));
Object.keys(POLICY).forEach(function(name){var win=0,lose=0,open=0,len=0,falls=0,sent=0;
  for(var s=1;s<=SEEDS;s++){var w=E.newWorld(12,s,OPT());w.claimFirst=true;var pol=POLICY[name],mine=0,myFalls=0,had=false;
    if(!pol){w.claimFirst=false;}
    var first=0;
    for(var y=0;y<MAXY&&!w.over;y++){
      if(!pol&&!first){var n0=w.log.length;E.year(w);for(var j=n0;j<w.log.length;j++)if(!first&&/왕이 섰습니다/.test(w.log[j].t))first=w.log[j].c;}
      else E.year(w,pol||undefined);
      var me=pol?w.player:first;if(me){var alive=E.findKing(w,me)>=0;if(had&&!alive)myFalls++;had=alive;}}
    mine=pol?w.player:first;
    if(w.over&&w.over===mine)win++;else if(w.over)lose++;else open++;
    len+=w.year;falls+=myFalls;sent+=w.stat.sent||0;}
  console.log([name,win,lose,open,(len/SEEDS).toFixed(0)+'년',(falls/SEEDS).toFixed(2),(sent/SEEDS).toFixed(1)].join(' | '));});
