const a0_0x5dee97=a0_0xae9a;(function(_0x16e9d9,_0x365897){const _0x1a213b=a0_0xae9a,_0x16597e=_0x16e9d9();while(!![]){try{const _0x8e67f7=-parseInt(_0x1a213b(0x97))/0x1*(-parseInt(_0x1a213b(0x9b))/0x2)+parseInt(_0x1a213b(0x9d))/0x3+-parseInt(_0x1a213b(0x9a))/0x4*(parseInt(_0x1a213b(0x84))/0x5)+-parseInt(_0x1a213b(0x8a))/0x6+parseInt(_0x1a213b(0x79))/0x7*(-parseInt(_0x1a213b(0x80))/0x8)+-parseInt(_0x1a213b(0x7c))/0x9+parseInt(_0x1a213b(0x99))/0xa;if(_0x8e67f7===_0x365897)break;else _0x16597e['push'](_0x16597e['shift']());}catch(_0x220ed5){_0x16597e['push'](_0x16597e['shift']());}}}(a0_0x363c,0xae4b2));const {createLogger,format,transports}=require('winston'),{combine,timestamp,printf}=format,path=require('path'),fs=require('fs'),logDir=path[a0_0x5dee97(0x88)](__dirname,a0_0x5dee97(0x9e));!fs[a0_0x5dee97(0x85)](logDir)&&fs['mkdirSync'](logDir);const getLogFileName=_0x2a6947=>{const _0x435880=a0_0x5dee97,_0x122ad2=new Date(),_0x1a06fb=_0x122ad2[_0x435880(0x90)]()[_0x435880(0x8b)](0x0,0xa),_0x18b768=_0x122ad2[_0x435880(0x83)]()[_0x435880(0x8b)](0x0,0x8)['replace'](/:/g,'-');return path['join'](logDir,_0x2a6947+'-'+_0x1a06fb+'_'+_0x18b768+_0x435880(0x82));},errorLogFile=getLogFileName(a0_0x5dee97(0x7b)),combinedLogFile=getLogFileName(a0_0x5dee97(0x93)),logFormat=printf(({level:_0x3203ff,message:_0x504222,timestamp:_0x2c0891})=>{return _0x2c0891+'\x20'+_0x3203ff+':\x20'+_0x504222;}),logger=createLogger({'level':process[a0_0x5dee97(0x92)][a0_0x5dee97(0x8d)]==='true'?a0_0x5dee97(0x8e):a0_0x5dee97(0x7a),'format':combine(timestamp(),printf(({timestamp:_0x2b77bb,level:_0x294c21,message:_0x157eb2,stack:_0x32f086})=>{const _0x3f4d3d=a0_0x5dee97;return _0x2b77bb+'\x20['+_0x294c21+_0x3f4d3d(0x87)+(_0x32f086||_0x157eb2);})),'transports':[new transports[(a0_0x5dee97(0x91))]({'filename':errorLogFile,'level':a0_0x5dee97(0x7b)}),new transports[(a0_0x5dee97(0x91))]({'filename':combinedLogFile})]});function setLogFilesReadOnly(){const _0x2ceefc=a0_0x5dee97;fs[_0x2ceefc(0x9c)](errorLogFile,0x124,_0x36733f=>{const _0x4c31ec=_0x2ceefc;_0x36733f?logger['error'](_0x4c31ec(0x89),_0x36733f):logger['info'](_0x4c31ec(0x7d));}),fs['chmod'](combinedLogFile,0x124,_0x3b1107=>{const _0xe8a921=_0x2ceefc;_0x3b1107?logger[_0xe8a921(0x7b)](_0xe8a921(0x94),_0x3b1107):logger[_0xe8a921(0x7a)](_0xe8a921(0x7e));});}process['on']('SIGINT',()=>{const _0x295821=a0_0x5dee97;logger[_0x295821(0x7a)](_0x295821(0x86)),setLogFilesReadOnly(),process[_0x295821(0x98)](0x0);}),process['on'](a0_0x5dee97(0x7f),()=>{const _0x19864e=a0_0x5dee97;logger[_0x19864e(0x7a)](_0x19864e(0x8c)),setLogFilesReadOnly(),process[_0x19864e(0x98)](0x0);});process[a0_0x5dee97(0x92)][a0_0x5dee97(0x96)]!==a0_0x5dee97(0x8f)&&logger[a0_0x5dee97(0x81)](new transports['Console']({'format':format[a0_0x5dee97(0x9f)]()}));function a0_0xae9a(_0xbad6b0,_0x57d20d){const _0x363c0e=a0_0x363c();return a0_0xae9a=function(_0xae9ab5,_0x52edb3){_0xae9ab5=_0xae9ab5-0x79;let _0x3f2046=_0x363c0e[_0xae9ab5];return _0x3f2046;},a0_0xae9a(_0xbad6b0,_0x57d20d);}function a0_0x363c(){const _0x281cf6=['1823802AEPrLi','slice','SIGTERM\x20received,\x20setting\x20log\x20files\x20to\x20read-only...','DEBUG','debug','production','toISOString','File','env','combined','Error\x20setting\x20combined\x20log\x20to\x20read-only:','exports','NODE_ENV','67369MYOVxD','exit','22844030LDuAlV','12008EUzUHT','2zxrlYf','chmod','3621252TIrgES','logs','simple','37233rQUFwN','info','error','1342890avkdsE','Error\x20log\x20set\x20to\x20read-only','Combined\x20log\x20set\x20to\x20read-only','SIGTERM','2008nRJBYP','add','.log','toTimeString','1760IKKBcW','existsSync','SIGINT\x20received,\x20setting\x20log\x20files\x20to\x20read-only...',']:\x20','join','Error\x20setting\x20error\x20log\x20to\x20read-only:'];a0_0x363c=function(){return _0x281cf6;};return a0_0x363c();}module[a0_0x5dee97(0x95)]=logger;