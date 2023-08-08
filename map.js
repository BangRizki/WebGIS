	// Global variables
	var map;			// Penggunaan Map
	var polyline;		// Polyline digunakan untuk petunjuk arah
	var myMarker;		// Lokasi pengguna
	var tryCount;		// Counter apabila geolokasi gagal ngedi-get
	var hash;			// Hashing untuk lokasi (fitur search)
	var locating;		// Boolean untuk mengunci geolokasi ketika sedang berjalan
	var icons;			// Ikon untuk bangunan/feature
	var activeMarkers;	// Berisi icon,edge,posisi user yang sedang berjalan di map
	var markerDragging;	// Boolean yang digunakan agar icon user bisa dipindahkan
	var changeMap;		// Boolean yang digunakan untuk mengubah mode map
	var satView;		// Map satelit
	var mapView;		// Map biasa
	var buildLoc;		// Index bangunan yang dipilih untuk dicari rutenya
	var buildTypes;		// Tipe lokasi
	var sidebar;		// Sidebar ambil dari leaflet biar gampang 
	var baseURL;		// Tag link
	var controls;		// Boolean untuk control pada sidebar
	var fullScreen;		// Boolean untuk fullscreen (tombolnya nyatu sama geo dan change map)
	
	/* -------------------- Map -------------------- */

	function initMap()
	{
		if (location.protocol === 'http:')
		{
			location.href = 'https:' + window.location.href.substring(window.location.protocol.length);
		}
		
		map = L.map('map', {
			center: [-7.050475855061316, 110.39239006899713],
			zoom: 16,
			minZoom: 16,
			zoomControl: false
		});

		map.removeControl(map.attributionControl)
		mapView = L.tileLayer('https://api.mapbox.com/styles/v1/rizkioktav/clked2sac003x01pg7yoq53ex/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1Ijoicml6a2lva3RhdiIsImEiOiJjbGtlY3R1bnQwMmd0M3NvNXBnYjE0eHEwIn0.IoTNgaJgO9DLLyyfoqzngg', {
			maxZoom: 20,
			attribution: 'Imagery © <a href="https://www.mapbox.com/" target="_blank">Mapbox</a>',
		}).addTo(map);

		satView = L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
			maxZoom: 19,
			attribution: 'Imagery © <a href="https://www.mapbox.com/" target="_blank">Mapbox</a>',
		});
		
		map.addLayer(mapView);

		L.Control.Options = L.Control.extend({
			options: {	
				position: 'bottomright',
			},
			
			onAdd: function() {
				this._container = L.DomUtil.create('div', 'options-container');
				this._container.id = "map-options";
				
				this._locate = L.DomUtil.create('div', 'map-option');
				this._locate.innerHTML = "<button class='map-button' onclick='attemptLocate();'><img class='map-button-img' id='locateButton' src='images/locate.svg'></button>";
				
				this._full = L.DomUtil.create('div', 'map-option');
				this._full.innerHTML = "<button class='map-button' onclick='toggleFullScreen();'><img class='map-button-img' src='images/fullscreen.svg'></button>";
				
				this._view = L.DomUtil.create('div', 'map-option');
				this._view.innerHTML = "<button class='map-button' onclick='switchTileLayer();'><img class='map-button-img' id='changeView' src='images/earth.svg'></button>";
				
				this._container.appendChild(this._locate);
				this._container.appendChild(this._full);
				this._container.appendChild(this._view);
				
				if(window.innerWidth <= 600 && !L.Browser.mobile)
				{
					this._container.style.display = "none";
				}
				
				L.DomEvent.disableScrollPropagation(this._container);
				L.DomEvent.disableClickPropagation(this._container);
				
				return this._container;
			},
			show: function() {
				this._container.style.display = "block";
			},
			hide: function() {
				this._container.style.display = "none";
			}
		});
		L.control.options = function() {return new L.Control.Options(); };
	
		var optionsControl = L.control.options().addTo(map);
		
		sidebar = L.control.sidebar("sidebar", {openOnAdd: !L.Browser.mobile, showHeader: true, showFooter: true, fullHeight: true, togglePan: true, autoResize: true, headerHeight: 12}).addTo(map);
		
		sidebar.on('open', function() {
			if(window.innerWidth <= 500)
			{
				setTimeout(function() {
					optionsControl.hide();
				}, 200);
			}
		});
		
		sidebar.on('close', function() {
			if(window.innerWidth <= 500)
			{
				setTimeout(function() {
					optionsControl.show();
				}, 200);
			}
		});
				
		map.on('locationfound', onLocationFound);
		map.on('locationerror', locationError);
		
		activeMarkers = [];
		buildTypes = new Set();
		
		for(var i = 0; i < features.length; i++)
		{
			buildTypes.add(features[i][2]);
		}
		
		icons = {
			parking: 'images/parking-ico.svg',
			admin: 'images/admin-ico.svg',
			interest: 'images/interest-ico.svg',
			dorm: 'images/dorm-ico.svg',
			classroom: 'images/classroom-ico.svg',
			food: 'images/food-ico.svg',
			printer: 'images/printer-ico.svg',
			bathroom: 'images/bathroom-ico.svg',
			recreation: 'images/recreation-ico.svg',
			library: 'images/library-ico.svg',
			student: 'images/student-ico.svg',
			mosque: 'images/mosque-ico.svg',
		};
		
		var urlAddress = window.location.href.trim();
		var tagsArray = urlAddress.slice( urlAddress.indexOf("?") + 1 ).split("&");
		
		if(urlAddress.indexOf('?') > -1)
		{
			baseURL = urlAddress.substring(0, urlAddress.indexOf('?'));
		}
		else
		{
			baseURL = urlAddress;
		}
		
		controls = false;
		
		if(urlAddress.indexOf("ctrl=false") > -1)
		{
			controls = true;
			map.removeControl(sidebar);
			map.removeControl(optionsControl);
		}
		
		if(!controls)
		{
			populateList();
		}
		
		for(var i = 0; i < tagsArray.length; i++)
		{
			var tag = tagsArray[i].toLowerCase().split("=");
			
			switch (tag[0]) 
			{
				case "type": 
					if (buildTypes.has(tag[1]))
					{
						addType(tag[1]);
					}
					break;
				case "bldg": 
					if (tag[1] >= 0 && tag[1] <= features.length) 
					{
						if((urlAddress.match(/bldg/g) || []).length === 1)
							addMarker(tag[1], true);
						else
							addMarker(tag[1], false);
					}
					break;
			}	
		}
		
		if(controls)
		{
			return;
		}

		tryCount = 0;
		buildLoc = -1;
		changeMap = false;
		locating = false;
		markerDragging = false;
		fullScreen = false;
		initHash();
		
		document.getElementById("textField").onkeypress = function(e) {
			var keyCode = e.keyCode || e.which;
			
			if(keyCode === 13)
			{
				//
				if(document.getElementById("textField").value === "Rizki Oktavianus" || "rizki oktavianus" || "rizki" || "developer")
				{
					window.open("https://www.instagram.com/rzkioktv_/")
				}
			
				if(document.getElementById("suggestions").firstChild)
				{
					document.getElementById("suggestions").children[0].click();
					clearSearch();
				}
			}
		};
	}
	
	/* -------------------- Geolocation -------------------- */
	
	// Temukan pengguna
	function attemptLocate()
	{
		if(locating)
		{
			if(myMarker !== undefined)
			{
				onLocationFound({ latlng: myMarker.getLatLng(), accuracy: 1 });
			}
			return;
		}
		
		locating = true;
		document.getElementById("locateButton").src = "images/spinner.svg";
		
		map.locate({ maximumAge: 0, enableHighAccuracy: true});
	}
	
	// Jika peta bermasalah dengan lokasi, coba lagi atau peringatkan pengguna
	function locationError(err)
	{
		var message = "";
				
		switch(err.code)
		{
			case 1: tryCount = 2;
				message = "Silakan aktifkan lokasi dan izinkan aplikasi menggunakan lokasi Anda.";
				break;
			case 2: message = "Gagal mendapatkan lokasi.";
				break;
			case 3: message = "Service timed out.";
				break;
			case 4: message = "Akurasi lokasi terlalu rendah.";
				break;
			case 5: message = "Lokasi anda diluar jangkauan kampus.";
				break;
		}
		message += " Klik \"Lanjutkan\" untuk menyeret penanda ke lokasi Anda atau klik \"Batal\" untuk membatalkan.";
		
		if(tryCount >= 2)
		{
			errorPopup(message, failedLocation);
			return;
		}
		tryCount++;
		map.locate({maximumAge: 0, enableHighAccuracy: true, timeout: 50000});
	}
	
	// Set penanda lokasi pengguna ke tengah, ketika ada masalah dengan lokasi
	function failedLocation()
	{
		if(polyline !== undefined)
		{
			map.removeLayer(polyline);
		}

		if(myMarker !== undefined)
		{
			map.removeLayer(myMarker);
		}
		
		myMarker = L.marker([-7.050475855061316, 110.39239006899713], {zIndexOffset: 1000, icon: L.icon({iconUrl: 'images/location-ico.svg', iconSize: [32, 36], iconAnchor: [10, 10], popupAnchor: [0, -18]})}).addTo(map);

		myMarker.on('dragstart', function() {
			markerDragging = true;
		});
		
		myMarker.on('dragend', function() {
			markerDragging = false;
		});
				
		myMarker.dragging.enable();
		tryCount = 2;
		
		setTimeout(function() { map.setView(myMarker.getLatLng(), 17); }, 300);
				
		setTimeout(function() { 
			onLocationFound({ latlng: myMarker.getLatLng(), accuracy: 1 });
		}, 10000 );

		console.log(myMarker.getLatLng())
	}
	
	// Saat lokasi ditemukan, pastikan lokasinya akurat
	function onLocationFound(position) 
	{
		if(!locating)
		{
			return;
		}
		
		if(position.accuracy > 100)
		{
			locationError({code: 4});
			return;
		}
		else if((position.latlng.lat <= -7.058750683573349 || position.latlng.lat >= -7.040800655027339) || (position.latlng.lng >= 110.40612250661202 || position.latlng.lng <= 110.38710917809286))
		{
			locationError({code: 5});
		return;
		}
		// -7.040800655027339, 110.38710917809286
		// -7.058750683573349, 110.40612250661202
		
		setLocation(position.latlng);
		console.log(position.latlng)
	}
	
	// Set lokasi pengguna ke map
	function setLocation(position)
	{
		if(myMarker !== undefined)
		{
			map.removeLayer(myMarker);	
		}
		
		myMarker = L.marker(position, {zIndexOffset: 1000, icon: L.icon({iconUrl: 'images/location-ico.svg', iconSize: [32, 36], iconAnchor: [10, 10]})}).addTo(map);
		
		map.setView(position, 18);
		setTimeout(function() {verifyLocation();}, 500);
	}
	
	// Notice error
	function errorPopup(message, callback)
	{
		sidebar.close();
		
		document.getElementById("errorMsg").innerHTML = message;
		$(function() {
			if($("#confirm-location").hasClass("ui-dialog-content"))
			{
				$( "#confirm-location" ).dialog("close");
			}
			
			$( "#error-message" ).dialog({
				dialogClass: "no-close",
				resizable: false,
				draggable: false,
				modal: true,
				buttons: {
					"Continue": function() {
						setTimeout(function() { $( "#error-message" ).dialog( "close" ); }, 1);

						callback();
					},
					"Cancel": function() {
						setTimeout(function() { $( "#error-message" ).dialog( "close" ); }, 1);

						tryCount = 0;
						document.getElementById("locateButton").src = "images/locate.svg";
						locating = false;
						
						if(myMarker !== undefined)
						{
							map.removeLayer(myMarker);
						}
						map.setView([-7.050475855061316, 110.39239006899713], 16);

					}
				}
			});
			$( "#error-message" ).dialog("moveToTop");
		});
	}
	
	// Konfirmasi pengguna apakah lokasi sudah tepat/belum
	function verifyLocation()
	{
		$(function() {
			if($("#error-message").hasClass("ui-dialog-content"))
			{
				$( "#error-message" ).dialog("close");
			}
			
			$( "#confirm-location" ).dialog({
				dialogClass: "no-close",
				resizable: false,
				draggable: true,
				modal: true,
				buttons: {
					"Yes": function() {
						setTimeout(function() { $( "#confirm-location" ).dialog( "close" ); }, 1);
						tryCount = 0;
						document.getElementById("locateButton").src = "images/locate.svg";
						myMarker.dragging.disable();
						locating = false;
					},
					"No":  function() {
						setTimeout(function() { $( "#confirm-location" ).dialog( "close" ); }, 1);
						myMarker.dragging.enable();	
						setTimeout(function() { onLocationFound({ latlng: myMarker.getLatLng(), accuracy: 1 }); }, 10000);
					}
				}
			});
			$( "#confirm-location" ).dialog("moveToTop");
		});
	}
	
	
	/* -------------------- Sidebar -------------------- */

	// List lokasi/feature
	function populateList()
	{
		var divList = {};
		
		for(var i = 0; i < features.length; i++)
		{
			if(!(features[i][2] in divList))
			{
				divList[features[i][2]] = [];
				var locationType = features[i][2];
				
				if(locationType === "hidden")
				{
					continue;
				}
				
				var divID = features[i][2] + "-section";
				var tableID = features[i][2] + "-list";
				
				var section = L.DomUtil.create('div', 'section');
				section.id = divID;
				
				var sectionHeader = L.DomUtil.create('div', 'section-header');
				sectionHeader.id = features[i][2] + "-temp";
				
				sectionHeader.onclick = function(e) 
				{
					if(e.target.id.indexOf("check") == -1)
					{
						$(this).next().slideToggle('fast');
						
						$(".section-list").not($(this).next()).slideUp('fast');
					}
				};
				
				var sectionTitle = L.DomUtil.create('span', 'section-title');
				
				switch(locationType)
				{
					case "admin": locationType = "administrasi";
						break;
					case "interest": locationType = "Gerbang Kampus";
						break;
					// case "bathroom": locationType = "inclusive Bathrooms";
					// 	break;
					case "printer": locationType = "Fotocopy dan Printer";
						break;
					case "library": locationType = "Perpustakaan";
						break;
					case "food": locationType = "Kantin";
						break;
					case "recreation": locationType = "Sarana"
						break;
					case "parking": locationType = "Parkiran"
						break;
					case "classroom": locationType= "Gedung Fakultas"
						break;
					case "dorm":
						break;
					case "student": locationType= "Gedung Kemahasiswaan"
						break;
					case "mosque": locationType= "Mushola dan Masjid"
						break
						
				}
				
				locationType = locationType.charAt(0).toUpperCase() + locationType.slice(1);
				
				sectionTitle.innerHTML = "<p><img class='section-image' src='images/" + features[i][2] + "C-ico.svg'/>" + locationType + "</p>";
				
				var sectionCheck = L.DomUtil.create('input', 'section-check');
				sectionCheck.type = "checkbox";
				sectionCheck.openType = features[i][2];
				sectionCheck.id = features[i][2] + "-check";
				
				sectionCheck.onclick = function() 
				{
					checkedLocation(this.openType);
				};
				
				sectionHeader.appendChild(sectionTitle);
				sectionHeader.appendChild(sectionCheck);
				
				var tablediv = L.DomUtil.create('div', 'section-list');
				tablediv.id = tableID;
				tablediv.innerHTML = "";

				section.appendChild(sectionHeader);
				section.appendChild(tablediv);
				document.getElementById("location-list").appendChild(section);
			}

			divList[features[i][2]].push("<div class='section-location' name='" + features[i][3] + "' onclick='openMarker(" + i + ");'>" + features[i][3] + "</div>");
		}
		
		for(var typeKey in divList)
		{
			var typeList = divList[typeKey];
			typeList.sort();
			
			for(var entry in typeList)
			{
				var tableID = typeKey + "-list";
				document.getElementById(tableID).innerHTML += typeList[entry];
			}
		}
	}
		
	// Untuk menampilkan keterangan lokasi sesuai indeks dari lokasi/feature
	function populateLocation(index)
	{
		var feature = features[index];
		
		document.getElementById("location-content").innerHTML = "";
	
		document.getElementById("location-title").innerHTML = feature[3];
		
		document.getElementById("image-block").removeChild(document.getElementById("image-block").firstChild);
	
		var locationImage = L.DomUtil.create('img');
		locationImage.id = 'location-image';
		locationImage.alt = feature[3];
		
		var imageURL = "locations/" + feature[3].toLowerCase().split('.').join('').split(' ').join('-').replace(' ', '-') + ".jpg";
		locationImage.src = (feature[2] === 'parking' || feature[2] === 'printer' || feature[2] === 'bathroom') ? "locations/default-img.jpg" : imageURL;
		locationImage.onerror = function() {
			locationImage.src = "locations/default-img.jpg";
		};
	
		document.getElementById("image-block").appendChild(locationImage);
	
		if(feature.length > 4)
		{
			for(var i = 0; i < feature[4].length; i++)
			{
				var detail = "";
				switch(feature[4][i][0])
				{
					case 'inside':
						detail = "Inside this location";
						break;
					case 'website':
						detail = "Website(s) for this location";
						break;
					case 'phone':
						detail = "Phone number for this location";
						break;
					case 'parktype':
						detail = "The parking permits that can park here";
						break;
					case 'accessible':
						detail = "The number of handicap-accessible spots";
						break;
					case 'bathroom':
						detail = "The unisex bathroom can be found here";
						break;
					case 'printloc':
						detail = "The printer can be found here";
						break;
				}
			
				document.getElementById("location-content").innerHTML += detail + "<br>";
				for(var j = 1; j < feature[4][i].length; j++)
				{
					document.getElementById("location-content").innerHTML += "<div class='location-detail'><img class='detail-image' src='images/" + feature[4][i][0] + "-ico.svg'></img> " + feature[4][i][j] + "</div>";					
				}
				document.getElementById('location-content').innerHTML += "<br>";
			}
		}
			
		// document.getElementById("share-location").onclick = function() {
		// 	shareLocation(index);
		// };
		
		document.getElementById("directions-button").onclick = function() {
			populateDirections(index);
		};
	}
	
	// Get semua route yang menuju ke lokasi yang dipilih 
	function populateDirections(index)
	{
		sidebar.showLayer(2);
		
		document.getElementById("direction-title").innerHTML = features[index][3];
		
		document.getElementById('directions-info').innerHTML = "";
		
		document.getElementById("directions-distance").innerHTML = "";
		
		document.getElementById("direction-location").onclick = function() {
			if(!document.getElementById("location-option").checked)
			{
				document.getElementById("location-option").checked = true;
				clearDirections();
				
				if(myMarker === undefined)
				{
					attemptLocate();
				}
			}
		};
		
		document.getElementById("direction-building").onclick = function() {
			if(!document.getElementById("building-option").checked)
			{
				document.getElementById("building-option").checked = true;
				clearDirections();
			}
		};

		L.DomUtil.removeClass(document.getElementById('directions-info'), 'directions-open');

		document.getElementById("direction-button").onclick = function() {
			getDirections(index);
		};
	}
	
	// Fungsi untuk menghapus search input pada menu pencarian
	function clearSearch()
	{
		document.getElementById("textField").value="";
		hashText("textField", "suggestions", 5, null);
	}
	
	// Fungsi untuk menghapus semua yang ada di map (rute,marker dll)
	function clearList()
	{
		buildTypes.forEach(function(type) {
			var name = type + "-check";
			
			if(document.getElementById(name).checked)
			{
				document.getElementById(name).checked = false;
				checkedLocation(type);
			}
		});
		
		for(var i = 0; i < activeMarkers.length; i++)
		{
			map.removeLayer(activeMarkers[i]);
		}
		activeMarkers = [];
		
		cleanMap();
	}
	
	function checkedLocation(type)
	{
		var name = type + "-check";
		if(document.getElementById(name).checked)
		{
			addType(type);
		}
		else
		{
			for(var i = 0; i < activeMarkers.length; i++)
			{
				if(activeMarkers[i].mType === type)
				{
					map.removeLayer(activeMarkers[i]);
				}
			}
			
			activeMarkers = activeMarkers.filter(function(marker) {
				return marker.mType !== type;
			});
		}
	}

	function clearDirections()
	{
		document.getElementById("locations").innerHTML = "";
		document.getElementById('directions-info').innerHTML = "";
		document.getElementById("directions-distance").innerHTML = "";
		if(L.DomUtil.hasClass(document.getElementById("directions-info"), "directions-open"))
		{
			L.DomUtil.removeClass(document.getElementById("directions-info"), "directions-open");
		}
	}
	
	// Fungsi untuk mengisi pencarian lokasi arah berdasarkan entri yang diklik
	function findBuilding(index)
	{
		document.getElementById("locations").innerHTML = "";
		document.getElementById("locationBox").value = features[index][3];
		document.getElementById("building-option").checked = true;
		buildLoc = index;
		return;
	}
	
	
	/* -------------------- Modifying map -------------------- */
	
	// Fungsi untuk memperlihatkan marker dari lokasi/feature yang dipilih 
	function openMarker(index)
	{
		for(var i = 0; i < activeMarkers.length; i++)
		{
			if(activeMarkers[i].index === index)
			{
				activeMarkers[i].fire('click');
				return;
			}
		}
		addMarker(index, features[index][2], true);
	}

	function addMarker(index, openUp)
	{
		for(var i = 0; i < activeMarkers.length; i++)
		{
			if(activeMarkers[i].index === index)
			{
				return;
			}
		}
		
		var feature = features[index];
		var marker = L.marker([feature[0], feature[1]], {zIndexOffset: 0, interactive: true, icon: L.icon({iconUrl: icons[feature[2]], iconSize: [26, 30], iconAnchor: [10, 10], popupAnchor: [2, -10]})});
		marker.mType = feature[2];
		marker.index = index;

		marker.bindPopup(feature[3]);

		if(controls === false)
		{
			marker.on('click', function() {
				cleanMap();
				sidebar.showLayer(1);

				populateLocation(index);
					
				marker.closePopup();
				sidebar.open();
				map.setView(marker.getLatLng(), 18);
			});
		}
		
		marker.on('mouseover', function() {
			if(!markerDragging)
			{
				var icon = marker.options.icon;
				marker.options.zIndexOffset = 100;
				icon.options.iconSize = [40, 40];
				icon.options.popupAnchor = [10, -10];
				marker.setIcon(icon);
				marker.openPopup();
			}
		});
			
		marker.on('mouseout', function() {
			if(!markerDragging) 
			{
				var icon = marker.options.icon;
				marker.options.zIndexOffset = 0;
				icon.options.iconSize = [26, 30];
				icon.options.popupAnchor = [2, -10];
				marker.setIcon(icon);
				marker.closePopup();
			}
		});
		
		marker.addTo(map);
		activeMarkers.push(marker);

		if(openUp)
		{
			setTimeout(function() {
				marker.fireEvent('click');
				map.setView(marker.getLatLng(), 18);
			}, 300);
		}
	}

	// Menambahkan semua marker dengan tipe tertentu ke dalam map
	function addType(type)
	{
		for(var i = 0; i < features.length; i++)
		{
			if(features[i][2] === type)
			{
				addMarker(i, false);
			}
		}
		
		if(sidebar.getCurrentIndex() === 0)
		{
			document.getElementById(type + "-check").checked = true;
		}
	}
	
	// Menghapus semua layer map yang tidak ada markernya
	function cleanMap()
	{
		map.closePopup();
		
		if(polyline !== undefined)
		{
			map.removeLayer(polyline);
		}
	}
	
	// Beralih antara tampilan map biasa dan satelit
	function switchTileLayer()
	{
		if(!changeMap)
		{
			document.getElementById("changeView").src = "images/map.svg";
			map.removeLayer(mapView);
			map.addLayer(satView);
			changeMap = true;
			
			if(polyline !== undefined)
			{
				polyline.setStyle({color: '#c40923'});
			}
		}
		else
		{
			document.getElementById("changeView").src = "images/earth.svg";
			map.removeLayer(satView);
			map.addLayer(mapView);
			changeMap = false;

			if(polyline !== undefined)
			{
				polyline.setStyle({color: '#005ef7'});
			}
		}
	}
	
	// Fungsi untuk tombol beralih layar fullscreen
	function toggleFullScreen()
	{
		var elem = document.documentElement;
		
		if(fullScreen)
		{
			if (document.exitFullscreen) 
			{
				document.exitFullscreen();
			} 
			else if (document.mozCancelFullScreen) 
			{
				document.mozCancelFullScreen();
			} 
			else if (document.webkitExitFullscreen)
			{
				document.webkitExitFullscreen();
			} 
			else if (document.msExitFullscreen) 
			{
				document.msExitFullscreen();
			}
		}
		else
		{
			if (elem.requestFullscreen) 
			{
				elem.requestFullscreen();
			} 
			else if (elem.mozRequestFullScreen) 
			{
				elem.mozRequestFullScreen();
			} 
			else if (elem.webkitRequestFullscreen) 
			{
				elem.webkitRequestFullscreen();
			} 
			else if (elem.msRequestFullscreen) 
			{
				elem.msRequestFullscreen();
			}
		}
		
		fullScreen = !fullScreen;
	}

	
	/* -------------------- Directions -------------------- */
	
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
		
		return (earthRadius * c);
	}
	
	// Fungsi untuk mencari angle jalan
	function findAngle(a, b, c)
	{
		var ab = [ b[0] - a[0], b[1] - a[1] ];
		var cb = [ b[0] - c[0], b[1] - c[1] ];

        var dot = (ab[0] * cb[0] + ab[1] * cb[1]);
        var cross = (ab[0] * cb[1] - ab[1] * cb[0]);

        var alpha = -Math.atan2(cross, dot);
        if (alpha < 0) alpha += 2 * Math.PI;
		
		alpha = (alpha * 180) / Math.PI;
        return alpha;
	}
	
	// Menampilkan rute optimal/terdekat dari titik awal (dipilih oleh user) ke lokasi akhir menggunakan algoritma Dijkstra
	function getDirections(end_index)
	{
		var canAccess = !document.getElementById("accessBox").checked;
		var start_index = 0;
		var start_name = "";
		var end_name = features[end_index][3];
		
		document.getElementById("directions-distance").innerHTML = "";
		document.getElementById('directions-info').innerHTML = "";
		L.DomUtil.removeClass(document.getElementById('directions-info'), 'directions-open');
		
		if(document.getElementById("location-option").checked)
		{
			if(myMarker === undefined || locating)
			{
				document.getElementById("directions-distance").innerHTML = "Cari lokasi anda dahulu.";
				return;
			}
			
			start_name = "Lokasi anda";
			
			var distance = Number.MAX_VALUE;
			
			var markerLocation = [myMarker.getLatLng().lat, myMarker.getLatLng().lng];
			
			for(var i = 0; i < sidewalks.length; i++)
			{
				var newdist = getDistance(markerLocation, sidewalks[i]);
			
				if(newdist < distance)
				{
					distance = newdist;
					start_index = i;
				}
			}
		}
		else if(document.getElementById("building-option").checked)
		{
			if(buildLoc === -1)
			{
				document.getElementById("directions-distance").innerHTML = "Cari lokasi anda dahulu.";
				return;	
			}
			
			if(buildLoc === end_index)
			{
				document.getElementById("directions-distance").innerHTML = "Pilihan anda sama dengan lokasi yang anda tuju!";
				return;	
			}
			
			addMarker(buildLoc, false);
			
			start_name = features[buildLoc][3];
			
			var smallestDistance = Number.MAX_VALUE;
			var minIndex = 0;
			
			for(var i = 0; i < connections.length; i++)
			{
				if(connections[i][1] === buildLoc)
				{
					if(connections[i][2] || canAccess)
					{
						var newdist = getDistance(sidewalks[connections[i][0]], features[end_index]);
						
						if(newdist < smallestDistance)
						{
							smallestDistance = newdist;
							minIndex = connections[i][0];
						}
					}
				}
			}
			
			start_index = minIndex;
		}
		else
		{
			document.getElementById("directions-distance").innerHTML = "Pilih posisi awal dulu.";
			return;
		}
		
		var numNodes = sidewalks.length;
		var infinity = Number.MAX_VALUE;

		var myMap = new Map();
		var visitedNodes = new Array(numNodes);
		var nodeWeights = new Array(numNodes);
		var prevNodes = new Array(numNodes);

		for (var i = 0; i < numNodes; i++)
		{
			myMap.set(i, []);
			visitedNodes[i] = false;
			prevNodes[i] = -1;
			nodeWeights[i] = infinity;
		}
		
		for(var i = 0; i < edges.length; i++)
		{
			myMap.get(edges[i][0]).push([edges[i][1], edges[i][3], edges[i][2]]);
			// myMap.get(edges[i][1]).push([edges[i][0], edges[i][3], edges[i][2]]);
		}
		
		visitedNodes[start_index] = true;
		nodeWeights[start_index] = 0;

		var currentNode = start_index;
		
		loop:
		while (true)
		{
			for(var i = 0; i < connections.length; i++)
			{
				if(connections[i][1] === end_index && connections[i][0] === currentNode)
				{		
					if(connections[i][2] || canAccess)
					{
						break loop;
					}
				}
			}
			
			var len = myMap.get(currentNode).length;

			for (var i = 0; i < len; i++) 
			{
				var newEdge = myMap.get(currentNode)[i];
				
				if(newEdge[2] || canAccess)
				{
					if (nodeWeights[currentNode] + newEdge[1] < nodeWeights[newEdge[0]] )
					{
						nodeWeights[newEdge[0]] = nodeWeights[currentNode] + newEdge[1];
						prevNodes[newEdge[0]] = currentNode;
					}
				}
			}

			var minIndex = -1;
			var minDist = infinity;

			for (var i = 0; i < numNodes; i++) 
			{
				if (visitedNodes[i] === false && nodeWeights[i] < minDist) 
				{
					minIndex = i;
					minDist = nodeWeights[i];
				}
			}
			
			if(minIndex === -1)
			{
				alert("Tidak ada rute yang memungkinkan");
				return;
			}
			
			currentNode = minIndex;
			visitedNodes[minIndex] = true;
		}
		
		sidebar.showLayer(2);
		if(polyline !== undefined)
		{
			map.removeLayer(polyline);
		}
		
		var index = currentNode;
		var latlngs = [[sidewalks[currentNode][0], sidewalks[currentNode][1]]];
		
		while (index !== start_index) 
		{			
			index = prevNodes[index];
			latlngs.push([sidewalks[index][0], sidewalks[index][1]]);
		}
		
		if(latlngs.length === 1)
		{
			document.getElementById("directions-distance").innerHTML = "Keduanya bersebelahan satu sama lain.";
			return;	
		}
		
		L.DomUtil.addClass(document.getElementById('directions-info'), 'directions-open');
		var tableText = "<table class='direction-table'><tr class='direction-row top-direction-row'><td><b>Awal</b></td><td><b>" + start_name + "</b></td></tr>";
		var totalDistance = 0
		for(var i = latlngs.length - 1; i > 1; i--)
		{			
			var distance = getDistance(latlngs[i], latlngs[i - 1]);
			totalDistance += distance
			console.log(latlngs[i])
			console.log(latlngs[i - 1])
			console.log(distance)
			console.log(totalDistance)
			var angle = findAngle(latlngs[i], latlngs[i - 1], latlngs[i - 2]);
			
			var turn = "";
			var imageURL = "";

			if(angle > 170 && angle < 190)
			{
				turn = "lurus terus";
				imageURL = "images/straight.svg";
			}
			else if(angle <= 170 && angle > 135)
			{
				turn = "belok kanan dikit";
				imageURL = "images/veer-right.svg";
			}
			else if(angle >= 190 && angle < 225)
			{
				turn = "belok kiri dikit";
				imageURL = "images/veer-left.svg";
			}
			else if(angle <= 150)
			{
				turn = "belok kanan";
				imageURL = "images/right-turn.svg";
			}
			else
			{
				turn = "belok kiri";
				imageURL = "images/left-turn.svg";
			}
			// distance = (distance).toFixed(4)
			distance = Math.round(distance);

			tableText += "<tr class='direction-row'><td><img class='direction-image' src='" + imageURL + "'/></td><td>Jalan terus sampai " + distance + " meteran, lalu " + turn + "</td></tr>";
		}
		document.getElementById("directions-distance").innerHTML = "Jarak total: ±" + Math.round(totalDistance.toString()) + " m";
		
		tableText += "<tr class='direction-row'><td><b>Sampai</b></td><td><b>" + end_name + "</b></td></tr></table>";

		setTimeout(function() {
			document.getElementById("directions-info").innerHTML = tableText; 
		}, 10);
		
		polyline = L.polyline(latlngs, {color: '#005ef7', interactive: false, weight: 5, opacity: 1});
		
		if(changeMap)
		{
			polyline.setStyle({color: '#c40923'});
		}

		map.addLayer(polyline);
		
		if(L.Browser.mobile)
		{
			sidebar.close();
			map.fitBounds(polyline.getBounds());
		}
		else
		{
			var center = polyline.getCenter();
			var point = map.latLngToContainerPoint(center);
		
			if(sidebar.isOpen())
			{
				point = point.subtract([document.getElementById("left-layer").offsetWidth, 0]);
			}
		
			setTimeout(function() {
				map.setView(map.containerPointToLatLng(point), 17);
			}, 200);
		}
	}
	

	/* -------------------- Hashing -------------------- */
	
	// Mengembalikan angka berdasarkan karakter dalam string
	function hashStr(str)
	{
		var hashed = 0;
		
		for(var i = 0; i < str.length; i++)
		{
			//101 = large prime number
			hashed += (str.charCodeAt(i) * Math.pow(101, i)) % 2847731;
		}
		
		return hashed;
	}
	
	// Mengisi tabel hash dengan nama lokasi berdasarkan algoritma Rabin-Karp
	function initHash()
	{
		hash = {};
		
		for(var i = 0; i < features.length; i++)
		{
			var str = features[i][3];
			var str_lower = str.toLowerCase();
			str_lower = str_lower.replace("'", "");
			
			for(var j = 0; j < str.length - 1; j++)
			{
				for(var k = j + 1; k <= str.length; k++)
				{
					var partial = str_lower.substring(j, k);
					
					var partial_hash = hashStr(partial);
					
					if(hash[partial_hash] === undefined)
					{
						hash[partial_hash] = [i];
					}
					else
					{
						hash[partial_hash].push(i);
					}
				}
			}
		}
	}
	
	// Mengembalikan hasil yang paling relevan berdasarkan teks yang dimasukkan
	function hashText(inputID, outputID, outputLimit, callbackName)
	{
		if(inputID === "locationBox")
		{
			buildLoc = -1;
		}
		
		var str = document.getElementById(inputID).value;
		clean_str = str.toLowerCase().replace("'", "");
		document.getElementById(outputID).innerHTML = "";
		
		if(clean_str.length < 2)
		{
			return;
		}
		
		var str_hash = hashStr(clean_str);
		
		if(hash[str_hash] === undefined)
		{
			document.getElementById(outputID).innerHTML = "<span class='search-result'>No matches found.</span>";
		}
		else
		{
			var results = hash[str_hash];
			
			var freq = {};
			for(var i = 0; i < results.length; i++)
			{
				freq[results[i]] = (freq[results[i]] === undefined) ? 1 : freq[results[i]] + 1;
			}
			
			var suggestions = [];
			
			for(var key in freq)
			{
				suggestions.push(key);
			}
			
			suggestions.sort(function(a, b) { return (freq[b] - freq[a]);});
			var limit = (suggestions.length < outputLimit) ? suggestions.length : outputLimit;
			
			for(var i = 0; i < limit; i++)
			{
				var name = features[suggestions[i]][3];
				var reg = new RegExp(str, 'gi');
				name = name.replace(reg, function(str) { return "<b>" + str + "</b>"; });
				
				document.getElementById(outputID).innerHTML += "<a class='search-result' onclick='" + callbackName + "(" + suggestions[i] + ");'>" + name + "</a>";
			}
		}
	}
	