import { Map } from "./map.js";
import { API } from "./api.js";
import { flags } from "./flags.js";

const API_URL = "http://localhost:8080/api";

const map = new Map(onMarkerClicked);
const api = new API(API_URL);

const refreshMapInSeconds = 60;

let flights = await api.getFlights();

map.updateMarkers(flights);

async function onMarkerClicked(params) {
    const flightInfo = await api.getFlightInfo(params);
    showFlightInfo(flightInfo);
}

// search for flight via HEX
async function searchFlight(params) {
    let flightMarker = map.findFlightMarkerFromIcao(params);
    if (flightMarker) {
        const flightInfo = await api.getFlightInfo(flightMarker.options);
        showFlightInfo(flightInfo);
        map.updateSelectedPlane(flightMarker, flightMarker.options.hex);
        map.moveMap(flightMarker._latlng.lat, flightMarker._latlng.lng )
    }
    else {
        console.log("flight not found")
    }
}

function showFlightInfo(flightInfo) {
    // checks before showFlightInfo
    if (!flightInfo) {
        console.log("Flight Info Undefined");
        return;
    }

    // display .overlay if hidden
    let overlay = document.getElementById("overlay");
    if (overlay.style.display !== "block") {
        overlay.style.display = "block";
    }
    // play overlay animation
    overlay.classList.remove("animated");
    overlay.style.animationName = "moveOverlayIn";
    overlay.classList.add("animated");


    // get flight info from API
    let flightIdentifier = checkDefinied(flightInfo.flight_icao);
    let airlineCode = checkDefinied(flightInfo.airline_iata);
    let airlineName = checkDefinied(flightInfo.airline_name);
    let departureIata = checkDefinied(flightInfo.dep_iata);
    let arrivalIata = checkDefinied(flightInfo.arr_iata);
    let estimatedDepart = checkDefinied(flightInfo.dep_estimated, "No data");
    let actualDepart = checkDefinied(flightInfo.dep_actual, "");
    let estimatedArrival = checkDefinied(flightInfo.arr_estimated, "");
    let actualArrival = checkDefinied(flightInfo.arr_actual, estimatedDepart !== "No data" ? "Flying!" : "");
    let depCity = checkDefinied(flightInfo.dep_city, "");
    let arrCity = checkDefinied(flightInfo.arr_city, "");
    let flightFlag = checkDefinied(flightInfo.flag);
    let flightSquawk = checkDefinied(flightInfo.squawk);
    let flightRegNum = checkDefinied(flightInfo.reg_number);

    console.log(actualArrival);

    // get Elements
    let pFlightIcao = document.getElementById("p_flight_icao");
    let airlineImg = document.getElementById("img_airline");
    let pFlag = document.getElementById("p_flag");
    let pSquawk = document.getElementById("p_squawk")
    let airplaneImg = document.getElementById("img_airplane");
    let fromLocation = document.getElementById("from_location");
    let toLocation = document.getElementById("to_location");
    let fromCity = document.getElementById("from_city");
    let toCity = document.getElementById("to_city");
    let pDepartEst = document.getElementById("depart_time_est");
    let pDepartAct = document.getElementById("depart_time_act");
    let pArriveEst = document.getElementById("arrive_time_est");
    let pArriveAct = document.getElementById("arrive_time_act");

    // modify Elements
    //pFlightIcao.textContent = flightIdentifier;
    airlineImg.src = "http://pics.avs.io/200/80/" + airlineCode + ".png";
    if (airlineCode.includes("???")) {
        airlineImg.src = "./images/default_logo.png"
    }
    airlineImg.alt = airlineName;
    // airlineImg.src = "./images/default_logo.png"
    //pFlag.textContent = flags[flightFlag];
    //pSquawk.textContent = flightSquawk;
    //hAirlineName.textContent = airlineName;
    fromLocation.textContent = departureIata;
    toLocation.textContent = arrivalIata;
    fromCity.textContent = depCity;
    toCity.textContent = arrCity;


    pDepartEst.textContent = estimatedDepart;
    pDepartAct.textContent = actualDepart;
    pArriveEst.textContent = estimatedArrival;
    pArriveAct.textContent = actualArrival;
    
    //TODO: GET THE AIRLINE"S INFORMATION FROM THE API!!!!

    // Airplane Image
    fetch(`http://localhost:8080/api/airplane/picture/${flightRegNum}`)
        .then((response) => response.json())
        .then((picture) =>{
            airplaneImg.src = picture.picture;
        })
        .catch((err) => {
            airplaneImg.src = './images/default_plane.jpg';
        });
}

function checkDefinied(data, altText="???") {
    return data === undefined || data === null ? altText : data;
}

// Interval to refresh map
setInterval(async () => {
    console.log("auto refreshing");
    flights = await api.getFlights();
    map.updateMarkers(flights);
}, refreshMapInSeconds * 1000);

const searchBtn = document.getElementById("search_button");
searchBtn.addEventListener('click', ()=>{
    searchFlight(document.getElementById("search_field").value);
})