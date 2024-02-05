import {getWeather} from "./weather.js"
getWeather(10, 10, Intl.DateTimeFormat().resolvedOptions().timeZone).then(res => {
    console.log(res.data)
}
    
)