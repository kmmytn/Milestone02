const a0_0xd43a21=a0_0x25bd;(function(_0xe50859,_0xfe830){const _0x2de18a=a0_0x25bd,_0x2a2989=_0xe50859();while(!![]){try{const _0x13650f=-parseInt(_0x2de18a(0x183))/0x1+-parseInt(_0x2de18a(0x1a3))/0x2+-parseInt(_0x2de18a(0x192))/0x3+parseInt(_0x2de18a(0x1a4))/0x4+-parseInt(_0x2de18a(0x1a2))/0x5*(parseInt(_0x2de18a(0x198))/0x6)+-parseInt(_0x2de18a(0x186))/0x7*(-parseInt(_0x2de18a(0x172))/0x8)+parseInt(_0x2de18a(0x193))/0x9;if(_0x13650f===_0xfe830)break;else _0x2a2989['push'](_0x2a2989['shift']());}catch(_0x4732a0){_0x2a2989['push'](_0x2a2989['shift']());}}}(a0_0x33b5,0xbd995));async function sendLog(_0x1f32f9,_0x730080,_0x2f63c5){const _0x4cf3f6=a0_0x25bd,_0x5df0b2=getCsrfToken();try{const _0x2e5d5c=await fetch(_0x4cf3f6(0x1ae),{'method':_0x4cf3f6(0x19f),'headers':{'Content-Type':_0x4cf3f6(0x199),'CSRF-Token':_0x5df0b2},'body':JSON[_0x4cf3f6(0x1ab)]({'type':_0x1f32f9,'email':_0x730080,'message':_0x2f63c5,'timestamp':new Date()['toISOString']()})});if(!_0x2e5d5c['ok']){if(_0x2e5d5c['status']===0x193)throw new Error('Invalid\x20CSRF\x20token');else throw new Error(_0x4cf3f6(0x182));}console[_0x4cf3f6(0x1a9)](_0x4cf3f6(0x176));}catch(_0x93c067){handleError(_0x4cf3f6(0x196),_0x93c067,_0x730080);}finally{console[_0x4cf3f6(0x19a)](_0x4cf3f6(0x194));}}function handleError(_0x9ffe42,_0x1b181d,_0x4248f9){const _0x19175e=a0_0x25bd;console[_0x19175e(0x1a7)](_0x9ffe42+':\x20'+_0x1b181d[_0x19175e(0x16d)]),sendErrorLog(_0x4248f9,_0x9ffe42+':\x20'+_0x1b181d[_0x19175e(0x16d)])[_0x19175e(0x171)](()=>{const _0x1aa351=_0x19175e;window['location'][_0x1aa351(0x19b)]=_0x1aa351(0x178);});}async function sendErrorLog(_0x202e4d,_0x1e9062){const _0x1f5451=a0_0x25bd,_0x2616c4=getCsrfToken();try{const _0x4175f4=await fetch('/log-error',{'method':_0x1f5451(0x19f),'headers':{'Content-Type':_0x1f5451(0x199),'CSRF-Token':_0x2616c4},'body':JSON[_0x1f5451(0x1ab)]({'type':'error','email':_0x202e4d,'message':_0x1e9062,'timestamp':new Date()['toISOString']()})});if(!_0x4175f4['ok'])throw new Error(_0x1f5451(0x170));console[_0x1f5451(0x1a9)](_0x1f5451(0x16c));}catch(_0x89a15){console[_0x1f5451(0x1a7)](_0x1f5451(0x1b0),_0x89a15[_0x1f5451(0x16d)]),DEBUG_MODE&&console['error'](_0x89a15['stack']);}finally{console[_0x1f5451(0x19a)](_0x1f5451(0x19e));}}function logAuthenticationAction(_0x5c7124,_0x42796c){sendLog('authentication',_0x5c7124,'User\x20performed\x20authentication\x20action:\x20'+_0x42796c);}function a0_0x25bd(_0x576f8f,_0x48bd47){const _0x33b5b1=a0_0x33b5();return a0_0x25bd=function(_0x25bd8c,_0x40ccc1){_0x25bd8c=_0x25bd8c-0x165;let _0x1ce412=_0x33b5b1[_0x25bd8c];return _0x1ce412;},a0_0x25bd(_0x576f8f,_0x48bd47);}function logAction(_0x161989,_0x58776b){const _0x4870f9=a0_0x25bd;sendLog(_0x4870f9(0x17b),_0x161989,_0x4870f9(0x18a)+_0x58776b);}function getCsrfToken(){const _0x3ac155=a0_0x25bd,_0x1c364f=_0x3ac155(0x175),_0x157e23=decodeURIComponent(document[_0x3ac155(0x17d)]),_0x4366f0=_0x157e23[_0x3ac155(0x1ac)](';');for(let _0x5939cf=0x0;_0x5939cf<_0x4366f0['length'];_0x5939cf++){let _0x2dd26d=_0x4366f0[_0x5939cf][_0x3ac155(0x190)]();if(_0x2dd26d[_0x3ac155(0x16b)](_0x1c364f)===0x0)return _0x2dd26d[_0x3ac155(0x174)](_0x1c364f[_0x3ac155(0x16f)],_0x2dd26d[_0x3ac155(0x16f)]);}return'';}let currentUserEmail=localStorage['getItem'](a0_0xd43a21(0x167));function a0_0x33b5(){const _0x17109d=['send','trim','addEventListener','1983228QtrEFh','20905866IlbQiI','Completed\x20log\x20operation','Error\x20during\x20logout','Error\x20sending\x20log','location','85776jVSSZO','application/json','log','href','invalid\x20csrf\x20token','Invalid\x20CSRF\x20token','Completed\x20error\x20log\x20operation','POST','responseText','delete','380qqUvjx','2724882Zcboui','5394196CuFZra','setRequestHeader','clear','error','Logged\x20out\x20successfully.','info','onload','stringify','split','querySelector','/log','replaceState','Error\x20sending\x20error\x20log:','forEach','status','click','currentUserEmail','Unexpected\x20logout\x20error','keys','User\x20logged\x20out\x20successfully','indexOf','Error\x20log\x20sent\x20successfully','message','includes','length','Failed\x20to\x20send\x20error\x20log','finally','7817768CmZWbs','GET','substring','CSRF-TOKEN=','Log\x20sent\x20successfully','Error\x20sending\x20session\x20timeout\x20request','index.html','onkeypress','Error\x20logging\x20out.\x20Please\x20try\x20again.','action','CSRF-Token','cookie','Logout\x20error','Invalid\x20CSRF\x20token\x20during\x20session\x20check','onmousemove','Error\x20sending\x20session\x20check\x20request','Failed\x20to\x20send\x20log','762034moGMow','/logout','Content-Type','7pQvLwO','Error\x20during\x20session\x20timeout','open','Unexpected\x20session\x20timeout\x20error','User\x20performed\x20action:\x20','Invalid\x20CSRF\x20token\x20during\x20session\x20timeout\x20logout','Session\x20timed\x20out.\x20Please\x20log\x20in\x20again.','Session\x20timed\x20out','Error\x20sending\x20logout\x20request'];a0_0x33b5=function(){return _0x17109d;};return a0_0x33b5();}const button=document[a0_0xd43a21(0x1ad)]('.logoutbtn');button[a0_0xd43a21(0x191)](a0_0xd43a21(0x166),function(){const _0x5b6323=a0_0xd43a21,_0x3c1891=new XMLHttpRequest();_0x3c1891[_0x5b6323(0x188)](_0x5b6323(0x19f),'/logout',!![]),_0x3c1891[_0x5b6323(0x1a5)](_0x5b6323(0x185),_0x5b6323(0x199)),_0x3c1891[_0x5b6323(0x1a5)](_0x5b6323(0x17c),getCsrfToken()),_0x3c1891[_0x5b6323(0x1aa)]=function(){const _0x55d3e6=_0x5b6323;if(_0x3c1891['status']===0xc8)alert(_0x55d3e6(0x1a8)),logAuthenticationAction(currentUserEmail,_0x55d3e6(0x16a)),'caches'in window&&caches[_0x55d3e6(0x169)]()['then'](_0x2417c3=>{const _0x43083d=_0x55d3e6;_0x2417c3[_0x43083d(0x1b1)](_0xe1110b=>{const _0x21ee6f=_0x43083d;caches[_0x21ee6f(0x1a1)](_0xe1110b);});}),localStorage[_0x55d3e6(0x1a6)](),history[_0x55d3e6(0x1af)](null,null,_0x55d3e6(0x178)),window[_0x55d3e6(0x197)]['href']=_0x55d3e6(0x178);else try{if(_0x3c1891[_0x55d3e6(0x1a0)][_0x55d3e6(0x16e)](_0x55d3e6(0x19c)))handleError('Invalid\x20CSRF\x20token\x20during\x20logout',new Error(_0x55d3e6(0x19d)),currentUserEmail);else throw new Error(_0x55d3e6(0x168));}catch(_0x27d2b3){alert(_0x55d3e6(0x17a)),logAuthenticationAction(currentUserEmail,_0x55d3e6(0x17e)),handleError(_0x55d3e6(0x195),_0x27d2b3,currentUserEmail);}};try{_0x3c1891[_0x5b6323(0x18f)]();}catch(_0x2d4aa4){handleError(_0x5b6323(0x18e),_0x2d4aa4,currentUserEmail);}});let warningTimeout,logoutTimeout;function resetTimers(){clearTimeout(warningTimeout),clearTimeout(logoutTimeout),warningTimeout=setTimeout(()=>{alert('You\x20will\x20be\x20logged\x20out\x20in\x2010\x20seconds\x20due\x20to\x20inactivity.'),logoutTimeout=setTimeout(()=>{const _0x2ab1ec=a0_0x25bd,_0x4680cd=new XMLHttpRequest();_0x4680cd['open']('POST',_0x2ab1ec(0x184),!![]),_0x4680cd[_0x2ab1ec(0x1a5)](_0x2ab1ec(0x185),'application/json'),_0x4680cd[_0x2ab1ec(0x1a5)](_0x2ab1ec(0x17c),getCsrfToken()),_0x4680cd[_0x2ab1ec(0x1aa)]=function(){const _0x1ef913=_0x2ab1ec;if(_0x4680cd[_0x1ef913(0x165)]===0xc8)alert(_0x1ef913(0x18c)),logAuthenticationAction(currentUserEmail,_0x1ef913(0x18d)),window[_0x1ef913(0x197)]['href']=_0x1ef913(0x178);else try{if(_0x4680cd[_0x1ef913(0x1a0)][_0x1ef913(0x16e)]('invalid\x20csrf\x20token'))handleError(_0x1ef913(0x18b),new Error('Invalid\x20CSRF\x20token'),currentUserEmail);else throw new Error(_0x1ef913(0x189));}catch(_0x1365a4){handleError(_0x1ef913(0x187),_0x1365a4,currentUserEmail);}};try{_0x4680cd[_0x2ab1ec(0x18f)]();}catch(_0x23b6c4){handleError(_0x2ab1ec(0x177),_0x23b6c4,currentUserEmail);}},0x2710);},0x4e20);}window[a0_0xd43a21(0x1aa)]=resetTimers,document[a0_0xd43a21(0x180)]=resetTimers,document[a0_0xd43a21(0x179)]=resetTimers,setInterval(function(){const _0x181d6c=a0_0xd43a21,_0x351417=new XMLHttpRequest();_0x351417[_0x181d6c(0x188)](_0x181d6c(0x173),'/check-session',!![]),_0x351417[_0x181d6c(0x1a5)](_0x181d6c(0x17c),getCsrfToken()),_0x351417['onload']=function(){const _0x4e60c8=_0x181d6c;if(_0x351417['status']===0x191)alert(_0x4e60c8(0x18c)),logAuthenticationAction(currentUserEmail,_0x4e60c8(0x18d)),window[_0x4e60c8(0x197)][_0x4e60c8(0x19b)]='index.html';else try{_0x351417[_0x4e60c8(0x1a0)]['includes'](_0x4e60c8(0x19c))&&handleError(_0x4e60c8(0x17f),new Error('Invalid\x20CSRF\x20token'),currentUserEmail);}catch(_0x12a16b){handleError('Error\x20during\x20session\x20check',_0x12a16b,currentUserEmail);}};try{_0x351417[_0x181d6c(0x18f)]();}catch(_0x15fc2b){handleError(_0x181d6c(0x181),_0x15fc2b,currentUserEmail);}},0x1388);