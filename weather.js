// getting users current location
navigator.geolocation.getCurrentPosition(positionSuccess, positionError);

function positionSuccess({ coords }) {
  getWeather(
    coords.latitude,
    coords.longitude,
    Intl.DateTimeFormat().resolvedOptions().timeZone
  )
    .then(renderWeather)
    .catch((e) => {
      console.log(e);
      alert("Error getting Weather info.");
    });
}

function positionError() {
  alert(
    "There ws an error getting your location. please allows us to use your location and kindly refresh the page"
  );
}

// fetching from the pi
function getWeather(lat, lon, timeZone) {
  const apiUrl = `https://api.open-meteo.com/v1/forecast?current=temperature_2m,weather_code,wind_speed_10m&hourly=temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,precipitation_sum&wind_speed_unit=mph&precipitation_unit=inch&timeformat=unixtime&latitude=${lat}&longitude=${lon}&timeZone=${timeZone}`;

  return fetch(apiUrl)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      // console.log(data);
      // return data;
      return {
        current: parseCurrentWeather(data),
        daily: parseDailyWeather(data),
        hourly: parseHourlyWeather(data),
      };
    })
    .catch((error) => {
      console.error("Error fetching weather data:", error.message);
    });
}

function parseCurrentWeather({ current, daily }) {
  if (!current) {
    return null;
  }
  const {
    temperature_2m: currentTemp,
    wind_speed_10m: windSpeed,
    weather_code: iconCode,
  } = current;
  const {
    temperature_2m_max: [maxTemp],
    temperature_2m_min: [minTemp],
    apparent_temperature_max: [maxFeelsLike],
    apparent_temperature_min: [minFeelsLike],
    precipitation_sum: [precip],
  } = daily;
  return {
    currentTemp: Math.round(currentTemp),
    highTemp: Math.round(maxTemp),
    lowTemp: Math.round(minTemp),
    highFeelsLike: Math.round(maxFeelsLike),
    lowFeelsLike: Math.round(minFeelsLike),
    windSpeed: Math.round(windSpeed),
    precip: Math.round(precip * 100) / 100,
    iconCode,
  };
}

// for daily
function parseDailyWeather({ daily }) {
  return daily.time.map((time, index) => {
    return {
      timestamp: time * 1000,
      iconCode: daily.weather_code[index],
      maxTemp: Math.round(daily.temperature_2m_max[index]),
    };
  });
}

// for hourly
function parseHourlyWeather({ hourly, current }) {
  return hourly.time
    .map((time, index) => {
      return {
        timestamp: time * 1000,
        iconCode: hourly.weather_code[index],
        temp: Math.round(hourly.temperature_2m[index]),
        feelsLike: Math.round(hourly.apparent_temperature[index]),
        windSpeed: Math.round(hourly.wind_speed_10m[index]),
        precip: Math.round(hourly.precipitation[index] * 100) / 100,
      };
    })
    .filter(({ timestamp }) => timestamp >= current.time * 1000);
}
// rendering the weather info
function renderWeather(present) {
  renderCurrentWeather(present);
  renderDailyWeather(present);
  renderHourlyWeather(present);
  document.body.classList.remove("blurred");
}

// for icons icon maping
const ICON_MAP = new Map();

addMapping([0, 1], "sun");
addMapping([2], "cloudSun");
addMapping([3], "cloud");
addMapping([45, 48], "cloud");
addMapping([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82], "rain");
addMapping([71, 73, 75, 77, 85, 86], "snow");
addMapping([95, 96, 99], "cloudBolt");

function addMapping(values, icon) {
  values.forEach((value) => {
    ICON_MAP.set(value, icon);
  });
}
ICON_MAP.get(0);
function getIconUrl(iconCode) {
  return `${ICON_MAP.get(iconCode)}.svg`;
}

// icon mapping ends here
// for current weather info
const currentIcon = document.querySelector("[data-current-icon]");
function renderCurrentWeather(present) {
  currentIcon.src = getIconUrl(present.current.iconCode);
  document.querySelector("[data-current-temp]").textContent =
    present.current.currentTemp;
  document.querySelector("[data-current-high]").textContent =
    present.current.highTemp;
  document.querySelector("[data-current-fl-high]").textContent =
    present.current.highFeelsLike;
  document.querySelector("[data-current-fl-low]").textContent =
    present.current.lowFeelsLike;
  document.querySelector("[data-current-low]").textContent =
    present.current.lowTemp;
  document.querySelector("[data-current-wind]").textContent =
    present.current.windSpeed;
  document.querySelector("[data-current-precipitation]").textContent =
    present.current.precip;
}
// for daily weather info
function setValue(selector, value, { parent = document } = {}) {
  parent.querySelector(`[data-${selector}]`).textContent = value;
}
const DAY_FORMATTER = new Intl.DateTimeFormat(undefined, { weekday: "long" });
const dailySection = document.querySelector("[data-day-section]");
const dayCardTemplate = document.getElementById("day-card-template");
function renderDailyWeather(present) {
  dailySection.innerHTML = "";
  present.daily.forEach((day) => {
    const element = dayCardTemplate.content.cloneNode(true);
    setValue("temp", day.maxTemp, { parent: element });
    setValue("date", DAY_FORMATTER.format(day.timestamp), { parent: element });
    element.querySelector("[data-icon]").src = getIconUrl(day.iconCode);
    dailySection.append(element);
  });
}

// rendering hourly data
const HOURLY_FORMATTER = new Intl.DateTimeFormat(undefined, {
  hour: "numeric",
});
const hourlySection = document.querySelector("[data-hour-section]");
const hourRowTemplate = document.getElementById("hour-row-template");
function renderHourlyWeather(present) {
  hourlySection.innerHTML = "";
  present.hourly.forEach((hour) => {
    const element = hourRowTemplate.content.cloneNode(true);
    setValue("temp", hour.temp, { parent: element });
    setValue("fl-temp", hour.feelsLike, { parent: element });
    setValue("wind", hour.windSpeed, { parent: element });
    setValue("precip", hour.precip, { parent: element });
    setValue("day", DAY_FORMATTER.format(hour.timestamp), { parent: element });
    setValue("time", HOURLY_FORMATTER.format(hour.timestamp), {
      parent: element,
    });
    element.querySelector("[data-icon]").src = getIconUrl(hour.iconCode);
    hourlySection.append(element);
  });
}
