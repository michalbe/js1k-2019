const map = `11111
10001
10001
10111
10001
10101
10101
10011
11001
11111`.split('\n').join('');

// let globalstr = '';
// for (let i = 0; i < map.length; i+=4) {
//     const str = map[i] + map[i+1] + map[i+2] + map[i+3];
//     globalstr += parseInt(str, 2).toString(36) + ',';
// }

globalstr = parseInt(map, 2).toString(36);
console.log(globalstr);

