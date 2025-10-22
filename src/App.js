// frontend/src/App.js
import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Orange marker for search results
const searchIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png",
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Violet marker for favorites
const favoriteIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-violet.png",
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Fix default Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

function App() {
  const [city, setCity] = useState("");
  const [cafes, setCafes] = useState([]);
  const [center, setCenter] = useState([48.8566, 2.3522]); // Default Paris
  const [loading, setLoading] = useState(false);
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem("favorites");
    return saved ? JSON.parse(saved) : [];
  });
  const [userLocation, setUserLocation] = useState(null);

  // Get user location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
          setCenter([latitude, longitude]);
        },
        (error) => {
          console.warn(
            "Geolocation not available or permission denied.",
            error
          );
        }
      );
    }
  }, []);

  // Calculate distance between two lat/lon points in km
  function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Search cafes in city
  async function handleSearch(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`https://cafe-finder-backend.onrender.com/search?city=${encodeURIComponent(city)}`);
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        setCafes(data.cafes);
        setCenter([data.lat, data.lon]);
      }
    } catch (err) {
      alert("Error fetching cafes");
      console.error(err);
    }
    setLoading(false);
  }

  // Add/remove favorite
  function toggleFavorite(cafe) {
    const exists = favorites.find((f) => f.id === cafe.id);
    let newFavorites;

    if (exists) {
      newFavorites = favorites.filter((f) => f.id !== cafe.id);
    } else {
      newFavorites = [...favorites, cafe];
    }
    setFavorites(newFavorites);
    localStorage.setItem("favorites", JSON.stringify(newFavorites));
  }

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        padding: "1rem",
        gap: "1rem",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      }}
    >
      {/* Left panel: Controls */}
      <div
        style={{
          width: "50%",
          padding: "1rem",
          backgroundColor: "#FFF7E6",
          borderRadius: "10px",
          overflowY: "auto",
          boxShadow: "2px 2px 10px rgba(0,0,0,0.1)",
        }}
      >
        <h2 style={{ color: "#FF8C42" }}>☕ Cafe Finder</h2>
        <form style={{ marginBottom: "1rem" }} onSubmit={handleSearch}>
          <input
            type="text"
            value={city}
            placeholder="Enter city..."
            onChange={(e) => setCity(e.target.value)}
            required
            style={{
              padding: "0.5rem",
              width: "70%",
              borderRadius: "5px",
              border: "1px solid #ccc",
              outline: "none",
              marginRight: "0.5rem",
            }}
          />
          <button
            type="submit"
            style={{
              padding: "0.5rem 1rem",
              border: "none",
              borderRadius: "5px",
              backgroundColor: "#FF8C42",
              color: "white",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            {loading ? "Searching..." : "Find"}
          </button>
        </form>

        <h3 style={{ color: "#9B5DE5" }}>Search Results</h3>
        {cafes.map((cafe) => {
          const isFav = favorites.find((f) => f.id === cafe.id);
          const distance = userLocation
            ? getDistance(userLocation[0], userLocation[1], cafe.lat, cafe.lon).toFixed(2)
            : null;
          return (
            <div
              key={cafe.id}
              style={{
                marginBottom: "1rem",
                padding: "0.8rem",
                borderRadius: "8px",
                backgroundColor: "#FFF",
                boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
              }}
            >
              <h4 style={{ margin: "0 0 0.3rem 0" }}>{cafe.name}</h4>
              <p style={{ margin: 0, color: "#555", fontSize: "0.9rem" }}>
                Lat: {cafe.lat.toFixed(3)}, Lon: {cafe.lon.toFixed(3)}
                {distance && ` — ${distance} km from you`}
              </p>
              <button
                onClick={() => toggleFavorite(cafe)}
                style={{
                  marginTop: "6px",
                  padding: "0.4rem 0.6rem",
                  border: "none",
                  borderRadius: "5px",
                  backgroundColor: isFav ? "#9B5DE5" : "#FF8C42",
                  color: "white",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                {isFav ? "💖 Remove Favorite" : "🤍 Save Favorite"}
              </button>
            </div>
          );
        })}

        <h3 style={{ color: "#9B5DE5", marginTop: "1rem" }}>Favorites</h3>
        {favorites.map((cafe) => (
          <div
            key={cafe.id}
            style={{
              marginBottom: "1rem",
              padding: "0.8rem",
              borderRadius: "8px",
              backgroundColor: "#FFF",
              boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
            }}
          >
            <h4 style={{ margin: "0 0 0.3rem 0" }}>{cafe.name}</h4>
            <p style={{ margin: 0, color: "#555", fontSize: "0.9rem" }}>
              Lat: {cafe.lat.toFixed(3)}, Lon: {cafe.lon.toFixed(3)}
            </p>
          </div>
        ))}
      </div>

      {/* Right panel: Map */}
      <div
        style={{
          width: "45%", // smaller map width
          borderRadius: "10px",
          overflow: "hidden",
          boxShadow: "2px 2px 10px rgba(0,0,0,0.2)",
        }}
      >
        <MapContainer
          center={center}
          zoom={14}
          style={{
            height: "100%",
            width: "100%",
            borderRadius: "10px",
          }}
          key={center[0] + center[1]}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* User location */}
          {userLocation && (
            <Marker
              position={userLocation}
              icon={new L.Icon({
                iconUrl:
                  "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
                shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41],
              })}
            >
              <Popup>📍 You are here</Popup>
            </Marker>
          )}

          {/* Cafes */}
          {cafes.map((cafe) => {
            const isFav = favorites.find((f) => f.id === cafe.id);
            return (
              <Marker
                key={cafe.id}
                position={[cafe.lat, cafe.lon]}
                icon={isFav ? favoriteIcon : searchIcon}
                eventHandlers={{ click: () => toggleFavorite(cafe) }}
              >
                <Popup>
                  {cafe.name}
                  {userLocation &&
                    ` — ${getDistance(
                      userLocation[0],
                      userLocation[1],
                      cafe.lat,
                      cafe.lon
                    ).toFixed(2)} km from you`}
                  <br /> {isFav ? "💖 Click to Remove" : "🤍 Click to Save"}
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}

export default App;
