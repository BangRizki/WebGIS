var nodes = [
	[-6.898649, 107.612479, "A"],
	[-6.900398, 107.609317, "B"],
  [-6.906970, 107.610454, "C"],
  [-6.905521,	107.607740, "D"],
  [-6.906448,	107.597537, "E"],
  [-6.912594,	107.603964, "F"],
  [-6.916503,	107.610026, "G"],
  [-6.915843,	107.604490, "H"],
  [-6.920806,	107.604093, "I"],
  [-6.921786,	107.612022, "J"],
  [-6.927207,	107.603664, "K"],
  [-6.931244,	107.612387, "L"],
  [-6.918740,	107.586627, "M"],
  [-6.937783,	107.597077, "N"],
  [-6.937219,	107.602999, "O"],
  [-6.937592,	107.609136, "P"],
  [-6.915726,	107.630089, "Q"],
  [-6.945430,	107.593182, "R"],
  [-6.917409,	107.574396, "S"],
];

var edges = [
	[0,1],
  [0,2],
  [0,16],
  [1,4],
  [1,3],
  [2,3],
  [2,5],
  [2,16],
];
var start = performance.now();
function degreesToRadians(degrees) 
{
    //(Math.PI / 180) = 0,0174532925199433
    return degrees * (Math.PI / 180);
}

function getDistance(pos1, pos2)
{
    //kalikan 1000 untuk ubah ke meter
    var earthRadius = 6371;
    //delta latlong
    var dLat = degreesToRadians(pos2[0]-pos1[0]);
    var dLon = degreesToRadians(pos2[1]-pos1[1]);

    //teta latlong
    var tlat1 = degreesToRadians(pos1[0]);
    var tlat2 = degreesToRadians(pos2[0]);
    var a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(tlat1) * Math.cos(tlat2); 

    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    var total = (earthRadius * c).toFixed(2); 
    return total;
}
for(var i = 0; i < edges.length; i++)
  {
    var distance = getDistance(nodes[edges[i][0]], nodes[edges[i][1]]);
    console.log("jarak node " + nodes[edges[i][0]][2] + " ke node " + nodes[edges[i][1]][2] + " = " + distance + " km");
  }
var end = performance.now()
// console.log(nodes[edges[0][0]]);
// console.log("ini itungan manual " + getDistance(nodes[0], nodes[1]))
// console.log("ini itungan manual " + getDistance(nodes[0], nodes[2]))
console.log("waktu yang dibutuhkan dalam perhitungan = " + (end - start) + "ms")