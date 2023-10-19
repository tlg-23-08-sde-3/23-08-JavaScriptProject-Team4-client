export class API {
    #API_URL;
    constructor(api_url) {
        this.#API_URL = api_url;
    }

    async getFlights() {
        return await fetch(`${this.#API_URL}/flights`)
            .then((res) => res.json())
            .then((flights) => {
                return flights;
            })
            .catch((err) => {
                console.log(err);
                return [];
            });
    }

    async getFlightInfo(flight) {
        return fetch(`${this.#API_URL}/flight/?hex=${flight.hex}`)
            .then((res) => res.json())
            .then((flight) => {
                return flight;
            })
            .catch((err) => {
                console.log(err);
                return undefined;
            });
    }
}
