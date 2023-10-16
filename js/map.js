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
    #selectedAirplane
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

    addMarker({ lat, lng, dir, flight_icao, hex }) {
        if (this.isInBound({ lat, lng })) {
            const coords = [lat, lng];
            // check if coords = the selected airplane to not overwrite selected airplane
            if (!this.#selectedAirplane || coords[0] !== this.#selectedAirplane._latlng.lat && coords[0] !== this.#selectedAirplane._latlng.lng){
                const marker = L.marker(coords, {
                    icon: this.#defaultAirplaneIcon,
                    rotationAngle: dir,
                });
                marker.bindTooltip(flight_icao);
                this.#markers.push(marker);
                marker.addTo(this.#map);
                marker.on("click", (e) => {
                    //Callback triggered, a plane got clicked and we execute the call back passing the HEX value inside an object
                    if (this.#selectedAirplane) {
                        this.#selectedAirplane.setIcon(this.#defaultAirplaneIcon);
                    }
                    e.target.setIcon(this.#selectedAirplaneIcon);
                    this.#selectedAirplane = e.target;
                    return this.#markerOnClick({ hex })
            }); //TODO DELETE THIS, ADD SOME LOGIC HERE
                return true;
            }
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
            if (!this.#selectedAirplane || marker._latlng.lat !== this.#selectedAirplane._latlng.lat && marker._latlng.lng !== this.#selectedAirplane._latlng.lng){
                this.#map.removeLayer(marker);
            }
        });
        this.#markers = [];
        if (this.#selectedAirplane) {
            this.#markers.push(this.#selectedAirplane);
        }
    }

    async updateMarkers(flightsArray) {
        if (flightsArray) {
            this.#flightInfoList = flightsArray;
        }
        this.restartMarkers();
        let count = 0;
        this.#flightInfoList.every((flightInfo) => {
            count += this.addMarker(flightInfo) ? 1 : 0;
            if (count >= MAX_AIRPLANES) {
                return false;
            }
            return true;
        });
    }

    // It gets a flight {hex, lat, lng, dir} and with that queries the API for the full flight information
    // With the flight info then prints that in the screen
}
