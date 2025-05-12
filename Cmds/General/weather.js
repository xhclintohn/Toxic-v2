module.exports = async (context) => {
    const { m, text } = context;

    try {
        if (!text) {
            return m.reply('◈━━━━━━━━━━━━━━━━◈\n❒ Provide a city/town name.\n◈━━━━━━━━━━━━━━━━◈');
        }

        const response = await fetch(
            `http://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(text)}&units=metric&appid=1ad47ec6172f19dfaf89eb3307f74785`
        );
        if (!response.ok) {
            throw new Error('Location not found');
        }

        const data = await response.json();

        const cityName = data.name;
        const temperature = data.main.temp;
        const feelsLike = data.main.feels_like;
        const minTemperature = data.main.temp_min;
        const maxTemperature = data.main.temp_max;
        const description = data.weather[0].description;
        const humidity = data.main.humidity;
        const windSpeed = data.wind.speed;
        const rainVolume = data.rain ? data.rain['1h'] : 0;
        const cloudiness = data.clouds.all;
        const sunrise = new Date(data.sys.sunrise * 1000).toLocaleTimeString();
        const sunset = new Date(data.sys.sunset * 1000).toLocaleTimeString();

        await m.reply(
            `◈━━━━━━━━━━━━━━━━◈\n` +
            `❒ Weather in ${cityName}\n\n` +
            `🌡️ Temperature: ${temperature}°C (Feels like: ${feelsLike}°C)\n` +
            `──────────\n` +
            `📝 Description: ${description}\n` +
            `──────────\n` +
            `💧 Humidity: ${humidity}%\n` +
            `──────────\n` +
            `🌀 Wind Speed: ${windSpeed} m/s\n` +
            `──────────\n` +
            `🌧️ Rain (1h): ${rainVolume} mm\n` +
            `──────────\n` +
            `☁️ Cloudiness: ${cloudiness}%\n` +
            `──────────\n` +
            `🌄 Sunrise: ${sunrise}\n` +
            `──────────\n` +
            `🌅 Sunset: ${sunset}\n` +
            `◈━━━━━━━━━━━━━━━━◈`
        );
    } catch (error) {
        console.error(`Weather error: ${error.message}`);
        await m.reply('◈━━━━━━━━━━━━━━━━◈\n❒ Unable to find that location.\n◈━━━━━━━━━━━━━━━━◈');
    }
};