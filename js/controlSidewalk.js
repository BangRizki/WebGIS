//Global Variables
var map;
var mapView;
var satView;
var showSat;
var edgeGroup;
var connectGroup;
var sidewalkGroup;
var colorIndex;
var newSidewalk;
var newEdge;
var newConnect;

var blueColor = ['aqua', 'blue'];
var redColor = ['crimson', 'red'];
var sidewalkColor = [['black', 'dimgray'], ['red', 'green']];

function initMap()
{
    map = L.map('map', {
        center: [-7.050475855061316, 110.39239006899713],
        zoom: 16,
        minZoom: 15,
        zoomControl: false
    });

    map.removeControl(map.attributionControl);

    mapView = L.tileLayer('https://api.mapbox.com/styles/v1/rizkioktav/cldh4fpel000n01lfmim21k0i/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1Ijoicml6a2lva3RhdiIsImEiOiJjbGN5d2dkaG8wMXRtM3NwaGMzOXRuZXk1In0.bYw3duKyb8ESXzcOYzhPfg', {
    maxZoom: 20,
    attribution: 'Imagery © <a href="https://www.mapbox.com/" target="_blank">Mapbox</a>',
    });

    satView = L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        attribution: 'Imagery © <a href="https://www.mapbox.com/" target="_blank">Mapbox</a>',
    });
    
    map.addLayer(mapView);

    map.on("click", function(e) {
        alert("Lat, Lon : " + e.latlng.lat + ", " + e.latlng.lng)
    });
    
    colorIndex = 1;
    showSat = true;
    edgeGroup = new L.layerGroup();
    connectGroup = new L.layerGroup();
    sidewalkGroup = new L.layerGroup();
    
    toggleEdges();
    toggleConnections();
    
    var addConnectDropdown = document.getElementById('add-connect-feat');
    for(var i = 0; i < features.length; i++)
    {
        var option = document.createElement("option");
        option.text = features[i][3];
        addConnectDropdown.add(option);
    }

    var connectDropdown = document.getElementById('connectFeat');
    for(var i = 0; i < features.length; i++)
    {
        var option = document.createElement("option");
        option.text = features[i][3];
        connectDropdown.add(option);
    }
}
//ganti jenis map
function swapTiles()
{
    colorIndex = 1;
    
    if(showSat)
    {
        map.removeLayer(mapView);
        map.addLayer(satView);
        
        colorIndex = 0;
    }
    else
    {
        map.removeLayer(satView);
        map.addLayer(mapView);
    }
    
    showSat = !showSat;
    
    setEdgeColor(colorIndex);
    setConnectColor(colorIndex);
}
//warna garis edge/vertex (jalan)
function setEdgeColor(newIndex)
{
    var oldIndex = 1 - newIndex;
    
    edgeGroup.eachLayer(function(layer) {
        if(layer.options.color === blueColor[oldIndex])
        {
            layer.setStyle({color: blueColor[newIndex]});
        }
        else if(layer.options.color === redColor[oldIndex])
        {
            layer.setStyle({color: redColor[newIndex]});
        }
    });
}
//warna garis penghubung antar gedung
function setConnectColor(newIndex)
{
    var oldIndex = 1 - newIndex;
    
    connectGroup.eachLayer(function(layer) {
        if(layer.options.color === blueColor[oldIndex])
        {
            layer.setStyle({color: blueColor[newIndex]});
        }
        else if(layer.options.color === redColor[oldIndex])
        {
            layer.setStyle({color: redColor[newIndex]});
        }
    });
}

//update
function updateSidewalk()
{
    var id = document.getElementById('sidewalkID').value;
    
    if(id.length === 0)
    {
        return;
    }
    
    var lat = document.getElementById('sidewalklat').value;
    var lng = document.getElementById('sidewalklng').value;	
    
    sidewalks[id] = [lat, lng];
}

function updateEdge()
{
    var id = document.getElementById('edgeID').value;
    
    if(id.length === 0)
    {
        return;
    }

    var startIndex = parseInt(document.getElementById('edgeStart').value);
    var endIndex = parseInt(document.getElementById('edgeEnd').value);
    var edgeAccess = document.getElementById('edgeAccess').checked;
    var edgeLength = parseFloat(document.getElementById('edgeLength').value);

    edges[id] = [startIndex, endIndex, edgeAccess, edgeLength];
}

function updateConnection()
{
    var id = document.getElementById('connectionID').value;
    
    if(id.length === 0)
    {
        return;
    }
    
    var feat = document.getElementById('connectFeat').selectedIndex;
    var side = parseInt(document.getElementById('connectSide').value);
    var access = document.getElementById('connectAccess').checked;
    
    connections[id] = [side, feat, access];
}

//Hitung edge dengan rumus haversine
function degreesToRadians(degrees) 
{
    //(Math.PI / 180) = 0,0174532925199433
    return degrees * (Math.PI / 180);
}

function getDistance(pos1, pos2)
{
    //kalikan 1000 untuk ubah ke meter
    var earthRadius = 6371 * 1000;
    //delta latlong
    var dLat = degreesToRadians(pos2[0]-pos1[0]);
    var dLon = degreesToRadians(pos2[1]-pos1[1]);

    //teta latlong
    var tlat1 = degreesToRadians(pos1[0]);
    var tlat2 = degreesToRadians(pos2[0]);
    var a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(tlat1) * Math.cos(tlat2); 

    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    return (earthRadius * c).toFixed(4);
}

function estimateLength(startIndex, endIndex)
{
    var distance = getDistance(sidewalks[startIndex], sidewalks[endIndex]);

    console.log(sidewalks[startIndex],sidewalks[endIndex])

    return distance;
}

function estimateOldEdge()
{
    var id = document.getElementById('edgeID').value;
    
    if(id.length === 0)
    {
        return;
    }

    var startIndex = parseInt(document.getElementById("edgeStart").value);
    var endIndex = parseInt(document.getElementById("edgeEnd").value);
    var access = document.getElementById("edgeAccess").checked;
    
    if(startIndex.length === 0 || endIndex.length === 0)
    {
        return;
    }
    
    var z = estimateLength(startIndex, endIndex);

    document.getElementById("edgeLength").value = z;

    console.log(startIndex, endIndex, z, "ini id edge ke : " + id, id.length, startIndex.length, endIndex.length);

    return z;
}

function estimateNewEdge()
{
    var startIndex = parseInt(document.getElementById("add-edge-start").value);
    var endIndex = parseInt(document.getElementById("add-edge-end").value);
    var access = document.getElementById("add-edge-access").checked;
    
    if(startIndex.length === 0 || endIndex.length === 0)
    {
        return;
    }
    
    var z = estimateLength(startIndex, endIndex);
    
    document.getElementById("add-edge-length").value = z;

    console.log(startIndex, endIndex, z, startIndex.length, endIndex.length);
    
    return z;
}

//membuat sidewalk,edge,dan koneksi baru
function updateNewSidewalk()
{
    // var bounds = [[-7.0403, 110.4031], [-7.0617, 110.3870]];
    
    var lat = document.getElementById("add-sidewalk-lat").value;
    var lng = document.getElementById("add-sidewalk-lng").value;
    
    if(lat.length < 3 || lng.length < 3)
    {
        return;
    }
    
    // if(lat < bounds[0][0] || lat > bounds[1][0] || lng < bounds[0][1] || lng > bounds[1][0])
    // {
    // 	return;
    // }
    
    if(newSidewalk !== undefined)
    {
        map.removeLayer(newSidewalk);
    }
    
    newSidewalk = L.circleMarker([lat, lng], {radius: 15, weight: 4, fillColor: 'dimgray', fillOpacity: 1.0, color: 'black'});
    newSidewalk.addTo(map);
}

function updateNewEdge()
{
    var startIndex = parseInt(document.getElementById("add-edge-start").value);
    var endIndex = parseInt(document.getElementById("add-edge-end").value);
    var access = document.getElementById("add-edge-access").checked;
    
    if(startIndex.length == 0 || startIndex < 0  || startIndex > sidewalks.length)
    {
        return;
    }
    
    if(endIndex.length == 0 || endIndex < 0 || endIndex > sidewalks.length)
    {
        return;
    }
    
    if(newEdge !== undefined)
    {
        map.removeLayer(newEdge);
    }
    
    newEdge = L.polyline([[sidewalks[startIndex][0], sidewalks[startIndex][1]], [sidewalks[endIndex][0], sidewalks[endIndex][1]]], {weight: 8, color: 'deepskyblue'});
    newEdge.addTo(map);
}

function updateNewConnect()
{
    var feat = document.getElementById('add-connect-feat').selectedIndex;
    var side = document.getElementById('add-connect-side').value;
    
    if(feat.length == 0 || feat < 0 || feat > features.length)
    {
        return;
    }
    
    if(side.length == 0 || side < 0 || side > sidewalks.length)
    {
        return;
    }
    
    if(newConnect !== undefined)
    {
        map.removeLayer(newConnect);
    }
    
    newConnect = L.polyline([[features[feat][0], features[feat][1]], [sidewalks[side][0], sidewalks[side][1]]], {weight: 8, color: 'deepskyblue'});
    newConnect.addTo(map);
}

//Save function dan memunculkan icon/rute di map
function saveNewSidewalk()
{
    if(newSidewalk === undefined)
    {
        return;
    }
    
    var latlng = newSidewalk.getLatLng();
    var newId = sidewalks.length;
    
    sidewalks.push([latlng.lat, latlng.lng]);
    
    var marker = L.circleMarker(latlng, {radius: 8, color: '#7a00cc'});
    marker.bindPopup(" " + newId);
    marker.addTo(map);
    sidewalkGroup.addLayer(marker);
    
    map.removeLayer(newSidewalk);
    newSidewalk = undefined;
}

function saveNewEdge()
{
    if(newEdge === undefined)
    {
        return;
    }
    
    var i = edges.length;

    var startIndex = parseInt(document.getElementById("add-edge-start").value);
    var endIndex = parseInt(document.getElementById("add-edge-end").value);
    var access = document.getElementById("add-edge-access").checked;
    var length = parseFloat(document.getElementById("add-edge-length").value);
    
    edges.push([startIndex, endIndex, access, length]);
    
    var newline;
        
    var lineColor = (edges[i][2]) ? blueColor[0] : redColor[0];
        
    newline = L.polyline([[sidewalks[startIndex][0], sidewalks[startIndex][1]], [sidewalks[endIndex][0], sidewalks[endIndex][1]]], {color: lineColor, interactive: true, weight: 4});
    newline.edgeIndex = i;
    newline.on('click', function() {
        var thisIndex = Number(this);
        populateEdge(thisIndex);
    }.bind(i));
    
    newline.addTo(map);
    edgeGroup.addLayer(newline);
    
    map.removeLayer(newEdge);
    newEdge = undefined;
}

function saveNewConnect()
{
    if(newConnect === undefined)
    {
        return;
    }
    
    var i = connections.length;

    var sidewalkIndex = document.getElementById("add-connect-side").value;
    var locationIndex = document.getElementById("add-connect-feat").selectedIndex;
    var access = document.getElementById("add-connect-access").checked;

    connections.push([sidewalkIndex, locationIndex, access]);
    
    var sidewalk = sidewalks[sidewalkIndex];
    var location = features[locationIndex];

    var lineColor = access ? blueColor[0] : redColor[0];
    var newline = L.polyline([[sidewalk[0], sidewalk[1]], [location[0], location[1]]], {color: lineColor, interactive: true, weight: 4}).addTo(map);	
    newline.connectIndex = i;
    newline.on('click', function() {
        var thisIndex = Number(this);
        populateConnection(thisIndex);
    }.bind(i));
    
    newline.addTo(map);
    connectGroup.addLayer(newline);
    
    map.removeLayer(newConnect);
}

//Function untuk melihat sidewalks,edge,dan koneksi 
function toggleSidewalks()
{
    if(sidewalkGroup.getLayers().length > 1)
    {
        sidewalkGroup.eachLayer(function(layer) {
            map.removeLayer(layer);
        });
        
        sidewalkGroup = new L.layerGroup();
    }
    else
    {
        for(var i = 0; i < sidewalks.length; i++)
        {
            var sidewalk = sidewalks[i];
    
            var marker = L.circleMarker([sidewalk[0], sidewalk[1]], {radius: 8, color: '#7a00cc'});
            marker.bindPopup(" " + i);
            marker.on('click', function() {
                var id = Number(this);
                populateSidewalk(id);
            }.bind(i));
            marker.addTo(map);
            sidewalkGroup.addLayer(marker);
        }			
    }
}

function toggleEdges()
{
    if(edgeGroup.getLayers().length > 1)
    {
        edgeGroup.eachLayer(function(layer) {
            map.removeLayer(layer);
        });
        
        edgeGroup = new L.layerGroup();
    }
    else
    {
        var polylines = [];
    
        for(var i = 0; i < edges.length; i++)
        {
            var thisEdge = edges[i];
            var sidewalk1 = sidewalks[edges[i][0]];
            var sidewalk2 = sidewalks[edges[i][1]];
    
            var newline;
        
            var lineColor = (edges[i][2]) ? blueColor[0] : redColor[0];
        
            newline = L.polyline([[sidewalk1[0], sidewalk1[1]], [sidewalk2[0], sidewalk2[1]]], {color: lineColor, interactive: true, weight: 4});
            newline.edgeIndex = i;
            newline.on('click', function() {
                var thisIndex = Number(this);
                populateEdge(thisIndex);
            }.bind(i));
        
            polylines.push(newline);
        }
    
        edgeGroup = L.layerGroup(polylines);
        edgeGroup.addTo(map);
        setEdgeColor(colorIndex);
    }
}

function toggleConnections()
{
    if(connectGroup.getLayers().length > 1)
    {
        connectGroup.eachLayer(function(layer) {
            map.removeLayer(layer);
        });
        
        connectGroup = new L.layerGroup();
    }
    else
    {
        var polylines = [];
        for(var i = 0; i < connections.length; i++)
        {
            var sidewalkIndex = connections[i][0];
            var locationIndex = connections[i][1];

            var sidewalk = sidewalks[sidewalkIndex];
            var location = features[locationIndex];

            var lineColor = (connections[i][2]) ? blueColor[0] : redColor[0];
            var newline = L.polyline([[sidewalk[0], sidewalk[1]], [location[0], location[1]]], {color: lineColor, interactive: true, weight: 4}).addTo(map);	
            newline.connectIndex = i;
            newline.on('click', function() {
                var thisIndex = Number(this);
                populateConnection(thisIndex);
            }.bind(i));
            polylines.push(newline);
        }
        
        connectGroup = L.layerGroup(polylines);
        connectGroup.addTo(map);
        setConnectColor(colorIndex);
    }
}

//Function untuk save atau cancel 
function addSidewalk()
{
    $(function() {
        $("#add-sidewalk").dialog({
            dialogClass: "no-close",
            draggable: true,
            buttons: {
                "Simpan": function() {
                    setTimeout(function() { $( "#add-sidewalk" ).dialog( "close" ); }, 1);
                    saveNewSidewalk();
                    if(newSidewalk !== undefined)
                    {
                        map.removeLayer(newSidewalk);
                    }
                },
                "kembali": function() {
                    setTimeout(function() { $( "#add-sidewalk" ).dialog( "close" ); }, 1);
                    if(newSidewalk !== undefined)
                    {
                        map.removeLayer(newSidewalk);
                    }							
                }
            }
        });
        
        $( "#add-sidewalk" ).dialog("moveToTop");
    });
}

function addEdge()
{
    $(function() {
        $("#add-edge").dialog({
            dialogClass: "no-close",
            draggable: true,
            buttons: {
                "Simpan": function() {
                    setTimeout(function() { $( "#add-edge" ).dialog( "close" ); }, 1);
                    saveNewEdge();
                    if(newSidewalk !== undefined)
                    {
                        map.removeLayer(newEdge);
                    }
                },
                "Kembali": function() {
                    setTimeout(function() { $( "#add-edge" ).dialog( "close" ); }, 1);
                    if(newSidewalk !== undefined)
                    {
                        map.removeLayer(newEdge);
                    }
                }
            }
        });
        
        $( "#add-edge" ).dialog("moveToTop");
    });			
}

function addConnection()
{			
    $(function() {
        $("#add-connect").dialog({
            dialogClass: "no-close",
            draggable: true,
            buttons: {
                "Simpan": function() {
                    setTimeout(function() { $( "#add-connect" ).dialog( "close" ); }, 1);
                    saveNewConnect();
                    if(newSidewalk !== undefined)
                    {
                        map.removeLayer(newSidewalk);
                    }
                },
                "Kembali": function() {
                    setTimeout(function() { $( "#add-connect" ).dialog( "close" ); }, 1);
                    if(newSidewalk !== undefined)
                    {
                        map.removeLayer(newSidewalk);
                    }
                }
            }
        });
        
        $( "#add-connect" ).dialog("moveToTop");
    });
}

//Function untuk get data
function populateSidewalk(index)
{
    document.getElementById('sidewalkID').value = index;
    document.getElementById('sidewalklat').value = sidewalks[index][0];
    document.getElementById('sidewalklng').value = sidewalks[index][1];			
}

function populateEdge(index)
{
    document.getElementById('edgeID').value = index;
    document.getElementById('edgeLength').value = edges[index][3];
    document.getElementById('edgeStart').value = edges[index][0];
    document.getElementById('edgeEnd').value = edges[index][1];
    document.getElementById('edgeAccess').checked = edges[index][2];
}

function populateConnection(index)
{
    document.getElementById('connectionID').value = index;
    document.getElementById('connectFeat').selectedIndex = connections[index][1];
    document.getElementById('connectSide').value = connections[index][0];
    document.getElementById('connectAccess').checked = connections[index][2];
}

//Function untuk delete data
function deleteSidewalk()
{
    var id = document.getElementById("sidewalkID").value;
    
    if(id.length === 0)
    {
        return;
    }
    
    var result = confirm("Are you sure you want to delete this sidewalk?");
    
    if(result == false)
    {
        return;
    }
    
    sidewalks.splice(id, 1);
    
    edges = edges.filter(function(edge) {
        return (edge[0] != id) && (edge[1] != id);
    });
    
    for(var i = 0; i < edges.length; i++)
    {
        if(edges[i][0] > id)
        {
            edges[i][0] = edges[i][0] - 1;
        }
        if(edges[i][1] > id)
        {
            edges[i][1] = edges[i][1] - 1;
        }
    }
    
    connections = connections.filter(function(connection) {
        return connection[0] != id;
    });
    
    for(var i = 0; i < connections.length; i++)
    {
        if(connections[i][0] > id)
        {
            connections[i][0] = connections[i][0] - 1;
        }
    }

    document.getElementById('sidewalkID').value = "";
    document.getElementById('sidewalklat').value = "";
    document.getElementById('sidewalklng').value = "";	
}

function deleteEdge()
{
    var id = document.getElementById('edgeID').value;
    
    if(id.length === 0)
    {
        return;
    }
    
    edgeGroup.eachLayer(function(layer) {
        if(layer.edgeIndex == id)
        {
            var result = confirm("Are you sure you want to delete this edge?");
            
            if(result == true)
            {
                map.removeLayer(layer);
                document.getElementById('edgeID').value = "";
                document.getElementById('edgeLength').value = "";
                document.getElementById('edgeStart').value = "";
                document.getElementById('edgeEnd').value = "";
                document.getElementById('edgeAccess').checked = false;
                edges.splice(id, 1);
            }
        }
    });
}

function deleteConnection()
{
    var id = document.getElementById('connectionID').value;
    
    if(id.length === 0)
    {
        return;
    }
    
    connectGroup.eachLayer(function(layer) {
        if(layer.connectIndex == id)
        {
            var result = confirm("Are you sure you want to delete this connection?");
            
            if(result == true)
            {
                map.removeLayer(layer);
                document.getElementById('connectionID').value = "";
                document.getElementById('connectStart').value = "";
                document.getElementById('connectEnd').value = "";
                document.getElementById('connectAccess').checked = false;
                connections.splice(id, 1);
            }
        }
    });
}

//Function untuk download data/file yang sudah disave
function download() 
{
    var filename = "sidewalks.js";
        
    var text = "var sidewalks = [\n";
    for(var i = 0; i < sidewalks.length; i++)
    {
        text += "\t" + JSON.stringify(sidewalks[i]) + ",\n";
    }
    text += "];\n\n";
    
    text += "var edges = [\n";
    for(var i = 0; i < edges.length; i++)
    {
        text += "\t" + JSON.stringify(edges[i]) + ",\n";
    }
    text += "];\n\n";
    
    text += "var connections = [\n";
    for(var i = 0; i < connections.length; i++)
    {
        text += "\t" + JSON.stringify(connections[i]) + ",\n";
    }
    text += "];";
    
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}

	