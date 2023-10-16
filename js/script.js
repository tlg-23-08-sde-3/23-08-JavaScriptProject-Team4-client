import { Map } from "./map.js";
import { API } from "./api.js";
import { flags } from "./flags.js";

const API_URL = "http://localhost:8080/api";

const map = new Map(onMarkerClicked);
const api = new API(API_URL);

const flights = await api.getFlights();

map.updateMarkers(flights);

async function onMarkerClicked(params) {
    const flightInfo = await api.getFlightInfo(params);
    showFlightInfo(flightInfo);
}

function showFlightInfo(flightInfo) {
    document.getElementById("p_flight_icao").textContent =
        flightInfo.flight_icao;
    //TODO: GET THE AIRLINE"S INFORMATION FROM THE API!!!!
    let airline = airlines_snapshot.find(
        (airline) => airline.icao_code === flightInfo.airline_icao
    );
    document.getElementById("img_airline").src =
        "https://airlabs.co/img/airline/m/" + airline?.iata_code + ".png";
    document.getElementById("p_flag").textContent = flags[flightInfo.flag];

    document.getElementById("p_squawk").textContent = flightInfo.squawk;
    fetch(`http://localhost:8080/api/airplane/picture/${flightInfo.reg_number}`)
        .then((response) => response.json())
        .then(
            (picture) =>
                (document.getElementById("img_airplane").src = picture.picture)
        )
        .catch((err) => console.log(err));
}
