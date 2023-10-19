const STARTUP_LAT = 36;
const STARTUP_LNG = -95;
const STARTUP_ZOOM = 5;
const MAX_ZOOM = 10;
const MAX_AIRPLANES = 1000;

// Class that extends leafletjs map's functionalities
// Here we also initialize the map with the default values we want
export class Map {
    //This will hold the airplanes
    #airplanes_snapshot = [];
    //Here we store the latest snapshot
    #flightInfoList = [];
    //These would be airplanes in the screen, aka markers. Storing this for whatever reason, not sure if we should do that
    #markers = [];
    //the actual map which is an instance from Leaflet
    #map;
    //The default Airplane icon
    #defaultAirplaneIcon = L.icon({
        iconUrl: "./images/plane.png",
        shadowUrl: "./images/plane_shadow1.png",

        iconSize: [30, 30], // size of the icon
        shadowSize: [30, 30], // size of the shadow
        iconAnchor: [15, 15], // point of the icon which will correspond to marker's location
        shadowAnchor: [12, 12], // the same for the shadow
        popupAnchor: [-3, -76], // point from which the popup should open relative to the iconAnchor
    });
    //The Selected Airplane icon
    #selectedAirplaneIcon = L.icon({
        iconUrl: "./images/plane_selected.png",
        shadowUrl: "./images/plane_shadow1.png",

        iconSize: [30, 30], // size of the icon
        shadowSize: [30, 30], // size of the shadow
        iconAnchor: [15, 15], // point of the icon which will correspond to marker's location
        shadowAnchor: [12, 12], // the same for the shadow
        popupAnchor: [-3, -76], // point from which the popup should open relative to the iconAnchor
    });
    // store selected airplane to handle if one should spawn over it
    #selectedAirplane;
    // store polylines
    #polylines;
    //This will store a callback function that will get triggered each time we click a marker (airplane), we pass the HEX to that function
    #markerOnClick;

    constructor(markerOnClickCallBack) {
        //Initializing the map bounds
        this.#map = L.map("map", {
            maxBounds: L.latLngBounds([-90, -180], [90, 180]),
        }).setView([STARTUP_LAT, STARTUP_LNG], STARTUP_ZOOM);
        //We then load the tile Layer from https://www.openstreetmap.org and set some attributes
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 14,
            minZoom: 3,
            noWrap: true,
            attribution:
                '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(this.#map);
        //When the user moves the map around or zoom we re-load the airplanes
        this.#map.on("moveend", () => {
            this.updateMarkers();
        });
        //Initializing the callback
        this.#markerOnClick = markerOnClickCallBack;
        //Clear the selected airplane if clicking away from the airplane
        // TODO
    }

    addMarker({ lat, lng, dir, flight_icao, flight_iata, hex }) {
        if (this.isInBound({ lat, lng })) {
            const coords = [lat, lng];
            // check if coords = the selected airplane to not overwrite selected airplane
            const marker = L.marker(coords, {
                icon:
                    this.#selectedAirplane?.hex === hex
                        ? this.#selectedAirplaneIcon
                        : this.#defaultAirplaneIcon,
                rotationAngle: dir,
                hex: hex,
                flight_icao: flight_icao,
                flight_iata: flight_iata,
            });
            if (flight_icao) {
                marker.bindTooltip(flight_icao);
            } else {
                marker.bindTooltip(flight_iata);
            }
            this.#markers.push(marker);
            marker.addTo(this.#map);
            marker.on("click", (e) => {
                if (this.updateSelectedPlane(e.target, hex)) {
                    return;
                }
                return this.#markerOnClick({ hex });
            });
            return true;
        }

        return false;
    }
    isInBound(coords) {
        const inBound = this.#map.getBounds().contains(coords);
        return inBound;
    }
    restartMarkers() {
        this.#markers.forEach((marker) => {
            // remove all non-selected planes
            this.#map.removeLayer(marker);
        });
        this.#markers = [];
    }

    async updateMarkers(flightsArray) {
        if (flightsArray) {
            this.#flightInfoList = flightsArray;
        }
        this.restartMarkers();
        let count = 0;
        try {
            this.#flightInfoList.every((flightInfo) => {
                count += this.addMarker(flightInfo) ? 1 : 0;
                if (count >= MAX_AIRPLANES) {
                    return false;
                }
                return true;
            });
        } catch (error) {
            console.log(error);
        }
    }

    findFlightMarkerFromParams(params) {
        for (let marker of this.#markers) {
            if (
                marker.options.flight_icao === params ||
                marker.options.hex === params ||
                marker.options.flight_iata === params
            ) {
                return marker;
            }
        }
        return undefined;
    }

    updateSelectedPlane(elem, hex) {
        // Check if the selected plane was clicked again to hide it.
        if (elem === this.#selectedAirplane) {
            let overlay = document.getElementById("overlay");
            overlay.classList.remove("animated");
            overlay.style.animationName = "moveOverlayOut";
            overlay.classList.add("animated");
            this.#selectedAirplane.setIcon(this.#defaultAirplaneIcon);
            this.#selectedAirplane = undefined;
            this.removeLines();
            return true;
        }
        //Callback triggered, a plane got clicked and we execute the call back passing the HEX value inside an object
        if (this.#selectedAirplane) {
            this.#map.removeLayer(this.#selectedAirplane);
            this.#selectedAirplane.setIcon(this.#defaultAirplaneIcon);
            this.#selectedAirplane.addTo(this.#map);
        }
        this.#selectedAirplane = elem;
        this.#selectedAirplane.setIcon(this.#selectedAirplaneIcon);
        this.#selectedAirplane.hex = hex;

        return false;
    }

    moveMap(lat, lng, time = 0) {
        if (time === 0) {
            this.#map.panTo(new L.LatLng(lat, lng));
            return;
        }
    }

    drawLines(positions) {
        this.removeLines();
        if (!positions) {
            return;
        }

        let posArr = [];
        for (let pos of positions) {
            posArr.push([pos.lat, pos.lng]);
        }
        this.#polylines = L.polyline(posArr, { color: "blue" }).addTo(
            this.#map
        );
    }

    get hasSelectedPlane() {
        return this.#selectedAirplane !== undefined;
    }

    removeLines() {
        if (this.#polylines) {
            this.#map.removeLayer(this.#polylines);
            this.#polylines = undefined;
        }
    }

    // It gets a flight {hex, lat, lng, dir} and with that queries the API for the full flight information
    // With the flight info then prints that in the screen
}
