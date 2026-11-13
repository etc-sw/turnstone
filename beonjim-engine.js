/* 번짐 엔진: 저절로 도는 판(갈래 B) + 왕의 명령(갈래 D 최소판).
   DOM을 모른다. 브라우저에서는 window.Beonjim, node에서는 require()로 쓴다.
   w.player가 0이면 beonjim-sim.html의 엔진과 같은 씨앗에서 같은 역사가 나온다(tools/check.js가 확인). */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.Beonjim=factory();})(this,function(){
"use strict";
var F=0,R=1,K=2,S=3,NOTO=3,NM=['','흑','백'];
function rng(seed){var a=seed>>>0;return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function newWorld(N,seed,opt){
  var w={N:N,b:new Int8Array(N*N),k:new Int8Array(N*N),year:0,ph:0,player:0,claimFirst:false,rand:rng(seed),seed:seed,opt:opt||{},log:[],OR:[],NB:[],hist:[],over:0,stat:{},lastF:[],lastC:[],ye:{hunger:[0,0,0],eaten:[0,0,0],conq:[0,0,0]}};
  for(var i=0;i<N*N;i++){var r=Math.floor(i/N),c=i%N,o=[],n=[];
    for(var dr=-1;dr<=1;dr++)for(var dc=-1;dc<=1;dc++){if(!dr&&!dc)continue;var rr=r+dr,cc=c+dc;if(rr<0||cc<0||rr>=N||cc>=N)continue;n.push(rr*N+cc);if(!dr||!dc)o.push(rr*N+cc);}
    w.OR.push(o);w.NB.push(n);}
  var w0=Math.floor((N-6)/2),sh=Math.floor(w.rand()*3)-1,sh2=Math.floor(w.rand()*3)-1;
  for(c=0;c<6;c++){w.b[1*N+w0+c+sh]=16;w.b[(N-2)*N+w0+c+sh2]=8;}
  return w;}
function col(p){return p>>3;}function typ(p){return p&7;}
function shuffle(a,rand){for(var i=a.length-1;i>0;i--){var j=Math.floor(rand()*(i+1)),t=a[i];a[i]=a[j];a[j]=t;}return a;}
function dist(w,a,c){var N=w.N;return Math.abs(Math.floor(a/N)-Math.floor(c/N))+Math.abs(a%N-c%N);}
function cheb(w,a,c){var N=w.N;return Math.max(Math.abs(Math.floor(a/N)-Math.floor(c/N)),Math.abs(a%N-c%N));}
function at(w,r,c){return(r<0||c<0||r>=w.N||c>=w.N)?-1:w.b[r*w.N+c];}
function between(w,i,c){var N=w.N,r=Math.floor(i/N),x=i%N,f=c*8+F;return(at(w,r,x-1)===f&&at(w,r,x+1)===f)||(at(w,r-1,x)===f&&at(w,r+1,x)===f);}
function hasLand(w,i){var o=w.opt.hunger8?w.NB[i]:w.OR[i];for(var k=0;k<o.length;k++)if(!w.b[o[k]])return true;return false;}
function findKing(w,c){for(var i=0;i<w.b.length;i++)if(w.b[i]===c*8+K)return i;return -1;}
function move(w,from,to){w.b[to]=w.b[from];w.k[to]=w.k[from];w.b[from]=0;w.k[from]=0;}
function note(w,c,text,big){w.log.push({y:w.year,c:c,t:text,big:!!big});}
function stepToward(w,i,target){   /* 목표에 가까워지는 빈 칸으로 상하좌우 한 걸음 */
  var o=shuffle(w.OR[i].slice(),w.rand),best=-1,bd=dist(w,i,target);
  for(var k=0;k<o.length;k++){if(w.b[o[k]])continue;var d=dist(w,o[k],target);if(d<bd){bd=d;best=o[k];}}
  return best;}
function nearest(w,i,sight,test){var best=-1,bd=99;for(var j=0;j<w.b.length;j++){var p=w.b[j];if(!p||j===i||!test(p,j))continue;var d=dist(w,i,j);if(d<=sight&&(d<bd||(d===bd&&w.rand()<0.5))){bd=d;best=j;}}return best;}
function fallOfKing(w,c,why){   /* 군사가 흩어진다 */
  var n=0;for(var i=0;i<w.b.length;i++)if(w.b[i]===c*8+S){w.b[i]=c*8+R;w.k[i]=0;n++;}
  note(w,c,why+(n?' 군사 '+n+'명이 도적으로 흩어집니다.':''),true);w.stat.fall=(w.stat.fall||0)+1;}

/* 한 철의 앞부분: 번식, 확장, 굶주림, 도적, 왕의 고용 */
function land(w,c){
  var b=w.b,N=w.N,i,j,k,o,p,t,st,v,ch=[],nm=NM[c];
  for(i=0;i<b.length;i++)if(!b[i]&&between(w,i,c))ch.push(i);
  for(k=0;k<ch.length;k++)b[ch[k]]=c*8+F;
  var fs=[],used=new Uint8Array(b.length),f=c*8+F;for(i=0;i<b.length;i++)if(b[i]===f)fs.push(i);
  shuffle(fs,w.rand);
  for(k=0;k<fs.length;k++){i=fs[k];if(used[i])continue;var r0=Math.floor(i/N),c0=i%N,ds=shuffle([[0,1],[0,-1],[1,0],[-1,0]],w.rand),best=-1,bs=-1,an=null;
    for(j=0;j<4;j++){var dr=ds[j][0],dc=ds[j][1],fr=r0+dr,fc=c0+dc;if(at(w,fr,fc)!==0)continue;var anc=null;
      if(at(w,r0-dr,c0-dc)===f&&!used[(r0-dr)*N+c0-dc])anc=[(r0-dr)*N+c0-dc];
      else if(at(w,r0+dc,c0+dr)===f&&at(w,r0-dc,c0-dr)===f)anc=[(r0+dc)*N+c0+dr,(r0-dc)*N+c0-dr];
      if(!anc)continue;
      var s=0,oo=w.OR[fr*N+fc];for(var q=0;q<oo.length;q++)if(!b[oo[q]])s++;if(s>bs){bs=s;best=fr*N+fc;an=anc;}}
    if(best>=0){move(w,i,best);used[best]=1;for(j=0;j<an.length;j++)used[an[j]]=1;}}
  ch=[];for(i=0;i<b.length;i++)if(b[i]===c*8+F&&!hasLand(w,i))ch.push(i);
  if(w.opt.hungerShare<1){ch=ch.filter(function(){return w.rand()<w.opt.hungerShare;});}
  for(k=0;k<ch.length;k++){b[ch[k]]=c*8+R;w.k[ch[k]]=0;}
  w.stat.hunger=(w.stat.hunger||0)+ch.length;w.ye.hunger[c]+=ch.length;
  var rs=[];for(i=0;i<b.length;i++)if(b[i]===c*8+R)rs.push(i);shuffle(rs,w.rand);
  for(k=0;k<rs.length;k++){i=rs[k];if(b[i]!==c*8+R)continue;o=w.OR[i];
    if(w.k[i]>=NOTO){
      var subj=[],nb=w.NB[i];for(j=0;j<nb.length;j++)if(typ(b[nb[j]])===F&&b[nb[j]])subj.push(nb[j]);
      if(subj.length>=2&&findKing(w,c)<0){b[i]=c*8+K;w.k[i]=0;for(j=0;j<subj.length;j++)b[subj[j]]=c*8+F;note(w,c,nm+'에 왕이 섰습니다. 셋을 잡아먹은 도적에게 농부 '+subj.length+'명이 무릎을 꿇었습니다.',true);w.stat.crown=(w.stat.crown||0)+1;
        if(w.claimFirst&&!w.player)w.player=c;
        continue;}
      t=nearest(w,i,6,function(p){return typ(p)===F;});if(t>=0){st=stepToward(w,i,t);if(st>=0)move(w,i,st);}
      continue;}
    var prey=[],preyOwn=[];for(j=0;j<o.length;j++){p=b[o[j]];if(!p)continue;if(typ(p)===F||(typ(p)===K&&col(p)!==c)){(col(p)===c?preyOwn:prey).push(o[j]);}}
    if(!prey.length)prey=preyOwn;
    if(prey.length){v=prey[Math.floor(w.rand()*prey.length)];var wasK=typ(b[v])===K,vc=col(b[v]);b[v]=0;w.k[v]=0;move(w,i,v);w.k[v]++;w.stat.eaten=(w.stat.eaten||0)+1;w.ye.eaten[c]++;
      if(wasK)fallOfKing(w,vc,NM[vc]+' 왕이 도적에게 죽었습니다.');
      continue;}
    var open=false,full=true;for(j=0;j<o.length;j++)if(!b[o[j]]){open=true;full=false;}
    t=nearest(w,i,w.opt.sight||4,function(p){return typ(p)===F;});
    if(t>=0){st=stepToward(w,i,t);if(st>=0){move(w,i,st);continue;}}
    if(t<0&&open){b[i]=c*8+F;w.k[i]=0;w.stat.settle=(w.stat.settle||0)+1;continue;}
    if(full){b[i]=0;w.k[i]=0;w.stat.feud=(w.stat.feud||0)+1;}}
  var kc=findKing(w,c);
  if(kc>=0){for(i=0;i<b.length;i++)if(b[i]===c*8+R&&cheb(w,i,kc)<=2){b[i]=c*8+S;w.k[i]=0;w.stat.hire=(w.stat.hire||0)+1;}}
  else{for(i=0;i<b.length;i++)if(b[i]===c*8+S){b[i]=c*8+R;w.k[i]=0;}}
}

/* ---- 왕의 명령 (D) ----
   깃든 왕(w.player)은 한 해에 한 수: 왕 자신이 한 칸, 또는 범위 안의 군사 하나가 한 칸.
   범위 안의 군사는 자리를 지키고(옆에 붙은 적만 베고 복속), 범위 밖의 군사는 예전처럼 제 뜻대로 걷는다. */
function range(w){return w.opt.range||2;}
function awaiting(w){var c=w.ph===1?1:w.ph===3?2:0;return !w.over&&c>0&&c===w.player&&findKing(w,c)>=0;}
function orders(w){
  var c=w.player,kc=c?findKing(w,c):-1,out=[],b=w.b,e=3-c,i,j,o,p,Rg=range(w);if(kc<0)return out;
  o=w.NB[kc];for(j=0;j<o.length;j++)if(!b[o[j]]||b[o[j]]===c*8+F)out.push({from:kc,to:o[j],king:true,strike:false,swap:!!b[o[j]],leaves:false});
  for(i=0;i<b.length;i++){if(b[i]!==c*8+S||cheb(w,i,kc)>Rg)continue;o=w.OR[i];
    for(j=0;j<o.length;j++){p=b[o[j]];var lv=cheb(w,o[j],kc)>Rg;
      if(!p||p===c*8+F)out.push({from:i,to:o[j],king:false,strike:false,swap:!!p,leaves:lv});   /* 비켜: 옆의 내 농부와는 자리를 바꾼다 */
      else if(typ(p)===R||(col(p)===e&&(typ(p)===K||typ(p)===S)))out.push({from:i,to:o[j],king:false,strike:true,leaves:lv});}}
  return out;}
function obey(w,c,cmd){   /* 명을 받은 군사의 새 자리를 돌려준다. 그 군사는 이번 철에 더 움직이지 않는다 */
  var os=orders(w),m=null,e=3-c;for(var i=0;i<os.length;i++)if(os[i].from===cmd.from&&os[i].to===cmd.to)m=os[i];
  if(!m)return -1;
  w.stat.order=(w.stat.order||0)+1;
  if(m.strike){var wasK=typ(w.b[m.to])===K;w.b[m.to]=0;w.k[m.to]=0;move(w,m.from,m.to);w.stat.slain=(w.stat.slain||0)+1;
    if(wasK)fallOfKing(w,e,NM[e]+' 왕이 '+NM[c]+' 왕의 명을 받은 군사에게 죽었습니다.');}
  else if(m.swap){var tb=w.b[m.to],tk=w.k[m.to];w.b[m.to]=w.b[m.from];w.k[m.to]=w.k[m.from];w.b[m.from]=tb;w.k[m.from]=tk;}
  else move(w,m.from,m.to);
  if(m.leaves)w.stat.sent=(w.stat.sent||0)+1;
  return m.king?-1:m.to;}

/* 한 철의 뒷부분: 군사 */
function soldiers(w,c,cmd){
  var b=w.b,i,j,k,o,p,v,t,st,e=3-c,nm=NM[c],done=-1,held=w.player===c&&findKing(w,c)>=0,Rg=range(w);
  if(cmd&&held)done=obey(w,c,cmd);
  var kc=findKing(w,c);
  var ss=[];for(i=0;i<b.length;i++)if(b[i]===c*8+S)ss.push(i);shuffle(ss,w.rand);
  for(k=0;k<ss.length;k++){i=ss[k];if(b[i]!==c*8+S||i===done)continue;o=w.OR[i];var tk=-1,ts=-1,tr=-1;
    for(j=0;j<o.length;j++){p=b[o[j]];if(!p)continue;if(col(p)===e&&typ(p)===K)tk=o[j];else if(col(p)===e&&typ(p)===S)ts=o[j];else if(typ(p)===R)tr=o[j];}
    v=tk>=0?tk:ts>=0?ts:tr;
    if(v>=0){var wasK=typ(b[v])===K;b[v]=0;w.k[v]=0;move(w,i,v);w.stat.slain=(w.stat.slain||0)+1;if(wasK)fallOfKing(w,e,NM[e]+' 왕이 '+nm+' 군사에게 죽었습니다.');continue;}
    var conv=0;for(j=0;j<o.length;j++)if(b[o[j]]===e*8+F){b[o[j]]=c*8+F;conv++;}
    if(conv){w.stat.conq=(w.stat.conq||0)+conv;w.ye.conq[c]+=conv;continue;}
    if(held&&kc>=0&&cheb(w,i,kc)<=Rg){   /* 왕의 곁: 범위 안에 든 적과 도적만 쫓고, 명 없이는 범위를 나서지 않는다 */
      t=nearest(w,i,w.opt.march||6,function(p,j){return(typ(p)===R||col(p)===e)&&cheb(w,j,kc)<=Rg;});
      if(t>=0){st=stepToward(w,i,t);if(st>=0)move(w,i,st);}
      continue;}
    t=nearest(w,i,w.opt.march||6,function(p){return typ(p)===R||col(p)===e;});
    if(t>=0){st=stepToward(w,i,t);if(st>=0)move(w,i,st);}
    else if(kc>=0&&cheb(w,i,kc)>3){st=stepToward(w,i,kc);if(st>=0)move(w,i,st);}}
}
function census(w){var n=[[0,0,0,0],[0,0,0,0],[0,0,0,0]];for(var i=0;i<w.b.length;i++)if(w.b[i])n[col(w.b[i])][typ(w.b[i])]++;return n;}
function endYear(w){
  for(var c=1;c<=2;c++){var nm=NM[c];
    if(w.ye.hunger[c]>=8&&w.year-(w.lastF[c]||-99)>6){w.lastF[c]=w.year;note(w,c,nm+'에 큰 기근: 농부 '+w.ye.hunger[c]+'명이 도적이 됐습니다.');}
    if(w.ye.conq[c]>=8&&w.year-(w.lastC[c]||-99)>6){w.lastC[c]=w.year;note(w,c,nm+' 군사가 한 해에 농부 '+w.ye.conq[c]+'명을 복속시켰습니다.');}}
  var n=census(w),t1=n[1][0]+n[1][1]+n[1][2]+n[1][3],t2=n[2][0]+n[2][1]+n[2][2]+n[2][3];
  w.hist.push([t1,t2,n[1][1],n[2][1],n[1][3],n[2][3],n[1][2],n[2][2]]);
  if(!t1||!t2){w.over=t1?1:t2?2:3;note(w,w.over===3?0:w.over,w.over===3?'아무도 남지 않았습니다.':NM[w.over]+'만 남았습니다.',true);}}

/* 한 해는 네 토막: 흑의 땅, 흑의 군사, 백의 땅, 백의 군사. awaiting(w)가 참이면 다음 tick에 명령을 넘길 수 있다 */
function tick(w,cmd){if(w.over)return;
  if(w.ph===0){w.year++;w.ye={hunger:[0,0,0],eaten:[0,0,0],conq:[0,0,0]};land(w,1);w.ph=1;}
  else if(w.ph===1){soldiers(w,1,cmd);w.ph=2;}
  else if(w.ph===2){land(w,2);w.ph=3;}
  else{soldiers(w,2,cmd);w.ph=0;endYear(w);}}
function year(w,policy){if(w.over)return;do{tick(w,policy&&awaiting(w)?policy(w):null);}while(w.ph!==0&&!w.over);}

return {F:F,R:R,K:K,S:S,NOTO:NOTO,NM:NM,newWorld:newWorld,tick:tick,year:year,awaiting:awaiting,orders:orders,range:range,census:census,findKing:findKing,col:col,typ:typ,cheb:cheb,dist:dist};
});
