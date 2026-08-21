// ==========================================
// CONFIGURATION
// ==========================================

// Les coordonnées utilisées ici correspondent directement
// aux coordonnées X/Y données par coordonnees.html.
//
// Exemple :
// X = 1547
// Y = 1012
//
// IMPORTANT :
// Ne plus utiliser lat/lng pour définir tes lieux.
// Utilise x/y.

let MAP_WIDTH = 0;
let MAP_HEIGHT = 0;

// ==========================================
// INITIALISATION DE LEAFLET
// ==========================================

const map = L.map("map", {
    crs: L.CRS.Simple,
    minZoom: -4,
    maxZoom: 3,
    zoomControl: true,
    attributionControl: false
});

// ==========================================
// DONNEES DES LIEUX
// ==========================================

const locations = [
    // police
    {
        name: "Poste Mission Row",
        type: "police",
        icon: "🚓",
        x: 1012,
        y: 1545,
        images: [
            "images/mission_row.jpg",
        ],
        description:
            "Poste principal de police de Mission Row."
    },
    {
        name: "Poste Vespucci",
        type: "police",
        icon: "🚓",
        x: 757,
        y: 1516,
        images: [
            "images/mission_row.jpg",
            "images/mission_row.jpg",
        ],
        description:
            "Poste principal de police de Vespucci."
    },
    {
        name: "Poste Vinewood",
        type: "police",
        icon: "🚓",
        x: 1043,
        y: 1380,
        description:
            "Poste principal de police de Vinewood."
    },
    // other
    {
        name: "Flamme Olympique",
        type: "other",
        icon: "📍",
        x: 854,
        y: 1614,
        description:
            "Flamme Olympique."
    },
    // hospital
    {
        name: "Pillbox Hill Medical Center",
        type: "hospital",
        icon: "🏥",
        x: 1200,
        y: 900,
        description:
            "Centre médical principal de Los Santos."
    }

];

// ==========================================
// COULEURS DES CATEGORIES
// ==========================================

const typeColors = {
    police: "#2d7dd2",
    hospital: "#d62828",
    company: "#a010da",
    government: "#cfbe24",
    other: "#888"
};

// ==========================================
// DONNEES DES ZONES
// ==========================================

const zones = [
    {
        name: "Canaux Vespucci",
        color: "#10d1d1",
        opacity: 0.25,
        points: [
            { x: 730, y: 1533 },
            { x: 760, y: 1510 },
            { x: 773, y: 1517 },
            { x: 792, y: 1533 },
            { x: 801, y: 1550 },
            { x: 810, y: 1564 },
            { x: 749, y: 1599 },
            { x: 739, y: 1569 },
            { x: 731, y: 1542 }
        ],
        description:
            "Canaux de Vespucci."
    },
    {
        name: "Mirror Park",
        color: "#1ac023",
        opacity: 0.25,
        points: [
            { x: 1131, y: 1517 },
            { x: 1110, y: 1517 },
            { x: 1094, y: 1499 },
            { x: 1071, y: 1483 },
            { x: 1069, y: 1465 },
            { x: 1053, y: 1449 },
            { x: 1057, y: 1445 },
            { x: 1076, y: 1439 },
            { x: 1094, y: 1436 },
            { x: 1099, y: 1432 },
            { x: 1108, y: 1419 },
            { x: 1127, y: 1425 },
            { x: 1136, y: 1432 },
            { x: 1152, y: 1448 },
            { x: 1173, y: 1473 },
            { x: 1175, y: 1509 },
            { x: 1149, y: 1517 }
        ],
        description:
            "Quartier résidentiel de Mirror Park."
    },
];

// ==========================================
// MARQUEURS
// ==========================================

const markers = [];
const zoneLayers = [];

// ==========================================
// CONVERSION X/Y → LEAFLET
// ==========================================

/*
 * coordonnees.html :
 *
 * X = horizontal
 * Y = vertical depuis le haut de l'image
 *
 *
 * Leaflet avec L.CRS.Simple :
 *
 * latitude  = axe vertical
 * longitude = axe horizontal
 *
 * L'axe vertical de Leaflet est inversé par rapport
 * aux pixels de l'image.
 *
 *
 * Donc :
 *
 * Leaflet latitude  = MAP_HEIGHT - Y
 * Leaflet longitude = X
 */

function imageToLeaflet(x, y) {
    return [
        MAP_HEIGHT - y,
        x
    ];

}

function zoneToLeaflet(points) {
    return points.map(point => {
        return imageToLeaflet(
            point.x,
            point.y
        );
    });
}

// ==========================================
// CREATION D'UN MARQUEUR
// ==========================================

function createMarker(location) {
    const icon = L.divIcon({
        className: "",
        html: `
            <div
                class="custom-marker"
                style="
                    background: ${typeColors[location.type]};
                "
            >
                ${location.icon}
            </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17]
    });

    const marker = L.marker(
        imageToLeaflet(
            location.x,
            location.y
        ),
        {
            icon: icon
        }
    );

    // ==========================================
    // IMAGES
    // ==========================================

    const images = Array.isArray(location.images)
        ? location.images
        : [];

    let imageHTML = "";

    // ==========================================
    // AUCUNE IMAGE
    // ==========================================

    if (images.length === 0) {
        imageHTML = "";
    }

    // ==========================================
    // UNE SEULE IMAGE
    // ==========================================

    else if (images.length === 1) {
        imageHTML = `
            <div class="popup-gallery single-image">
                <img
                    src="${images[0]}"
                    alt="${location.name}"
                    class="popup-image"
                >
            </div>
        `;
    }

    // ==========================================
    // PLUSIEURS IMAGES
    // ==========================================

    else {
        imageHTML = `
            <div
                class="popup-gallery"
                data-gallery-id="${location.name
                    .replace(/[^a-zA-Z0-9]/g, "-")
                    .toLowerCase()}"
            >
                <div class="popup-image-container">
                    <img
                        src="${images[0]}"
                        alt="${location.name}"
                        class="popup-image"
                    >
                    <button
                        type="button"
                        class="gallery-button gallery-prev"
                    >
                        ‹
                    </button>
                    <button
                        type="button"
                        class="gallery-button gallery-next"
                    >
                        ›
                    </button>
                </div>

                <div class="gallery-footer">
                    <span class="gallery-counter">
                        1 / ${images.length}
                    </span>
                </div>
            </div>
        `;
    }

    // ==========================================
    // POPUP
    // ==========================================

    marker.bindPopup(`
        <div class="popup-content">
            ${imageHTML}

            <div class="popup-title">
                ${location.icon}
                ${location.name}
            </div>

            <div class="popup-type">
                ${getTypeName(location.type)}
            </div>

            <div class="popup-description">
                ${location.description}
            </div>
        </div>
    `);

    // ==========================================
    // GALERIE
    // ==========================================

    marker.on(
        "popupopen",
        () => {
            if (images.length <= 1) {
                return;
            }

            const popupElement =
                marker.getPopup()
                    .getElement();

            if (!popupElement) {
                return;
            }

            const gallery =
                popupElement.querySelector(
                    ".popup-gallery"
                );

            if (!gallery) {
                return;
            }

            const imageElement =
                gallery.querySelector(
                    ".popup-image"
                );

            const counter =
                gallery.querySelector(
                    ".gallery-counter"
                );

            const previousButton =
                gallery.querySelector(
                    ".gallery-prev"
                );

            const nextButton =
                gallery.querySelector(
                    ".gallery-next"
                );

            let currentImage = 0;

            function showImage(index) {
                currentImage =
                    (index + images.length)
                    % images.length;

                imageElement.src =
                    images[currentImage];

                imageElement.alt =
                    `${location.name} - Image ${currentImage + 1}`;

                counter.textContent =
                    `${currentImage + 1} / ${images.length}`;
            }

            previousButton.addEventListener(
                "click",
                (event) => {
                    event.stopPropagation();
                    showImage(
                        currentImage - 1
                    );
                }
            );

            nextButton.addEventListener(
                "click",
                (event) => {
                    event.stopPropagation();
                    showImage(
                        currentImage + 1
                    );
                }
            );
        }
    );

    // ==========================================
    // DONNEES DU LIEU
    // ==========================================

    marker.locationData =
        location;

    return marker;
}

// ==========================================
// CREATION D'UNE ZONE
// ==========================================

function createZone(zone) {
    const polygon = L.polygon(
        zoneToLeaflet(
            zone.points
        ),
        {
            color: zone.color,
            fillColor: zone.color,
            fillOpacity:
                zone.opacity ?? 0.25,
            weight: 2,
            opacity: 0.8
        }
    );

    // ==========================================
    // POPUP
    // ==========================================

    polygon.bindPopup(`
        <div class="popup-content">
            <div class="popup-title">
                ${zone.name}
            </div>
            <div class="popup-description">
                ${zone.description}
            </div>
        </div>
    `);

    // ==========================================
    // SURVOL
    // ==========================================

    polygon.on(
        "mouseover",
        () => {
            polygon.setStyle({

                fillOpacity:
                    Math.min(
                        (zone.opacity ?? 0.25) + 0.15,
                        0.8
                    ),
                weight: 3
            });
        }
    );

    polygon.on(
        "mouseout",
        () => {
            polygon.setStyle({
                fillOpacity:
                    zone.opacity ?? 0.25,

                weight: 2
            });
        }
    );

    polygon.zoneData =
        zone;

    return polygon;
}

// ==========================================
// TRADUCTION DES CATEGORIES
// ==========================================

function getTypeName(type) {
    const names = {
        police: "Police",
        hospital: "Hôpital",
        company: "Entreprise",
        government: "Gouvernement",
        other: "Lieu connu"
    };

    return names[type] || type;
}

// ==========================================
// CHARGEMENT DE LA CARTE
// ==========================================

const mapImage = new Image();

mapImage.onload = function () {

    // Récupération des vraies dimensions
    // de map.jpg

    MAP_WIDTH =
        mapImage.naturalWidth;

    MAP_HEIGHT =
        mapImage.naturalHeight;

    console.log(
        "Dimensions de la carte :",
        MAP_WIDTH,
        "x",
        MAP_HEIGHT
    );

    // ==========================================
    // BOUNDS LEAFLET
    // ==========================================

    const bounds = [
        [0, 0],
        [
            MAP_HEIGHT,
            MAP_WIDTH
        ]
    ];

    // ==========================================
    // AJOUT DE L'IMAGE
    // ==========================================

    L.imageOverlay(
        "map.jpg",
        bounds
    ).addTo(map);

    // ==========================================
    // POSITION INITIALE
    // ==========================================

    map.fitBounds(bounds);

    // ==========================================
    // CREATION DES MARQUEURS
    // ==========================================

    locations.forEach(
        location => {
            const marker =
                createMarker(location);

            marker.addTo(map);

            markers.push(marker);
        }
    );

    // ==========================================
    // CREATION DES ZONES
    // ==========================================

    zones.forEach(
        zone => {
            const polygon =
                createZone(zone);
            polygon.addTo(map);
            zoneLayers.push(polygon);
        }
    );

    // ==========================================
    // LISTE DES LIEUX
    // ==========================================

    updateLocationList();
};


// ==========================================
// ERREUR DE CHARGEMENT
// ==========================================

mapImage.onerror = function () {
    console.error(
        "Impossible de charger map.jpg"
    );
};

// Lancement du chargement
mapImage.src = "map.jpg";

// ==========================================
// FILTRES
// ==========================================

const filters =
    document.querySelectorAll(
        ".filter"
    );

filters.forEach(
    filter => {
        filter.addEventListener(
            "change",
            updateMarkers
        );
    }
);

// ==========================================
// MISE A JOUR DES MARQUEURS
// ==========================================

function updateMarkers() {

    const activeTypes = [];

    filters.forEach(
        filter => {
            if (filter.checked) {
                activeTypes.push(
                    filter.value
                );

            }
        }
    );

    const searchValue =
        document
            .getElementById("search")
            .value
            .toLowerCase()
            .trim();

    markers.forEach(
        marker => {
            const location =
                marker.locationData;

            const typeVisible =
                activeTypes.includes(
                    location.type
                );

            const searchVisible =
                location.name
                    .toLowerCase()
                    .includes(
                        searchValue
                    );

            if (
                typeVisible &&
                searchVisible
            ) {
                marker.addTo(map);
            } else {
                marker.removeFrom(map);
            }
        }
    );

    updateLocationList(
        activeTypes,
        searchValue
    );
}

// ==========================================
// RECHERCHE
// ==========================================

document
    .getElementById("search")
    .addEventListener(
        "input",
        updateMarkers
    );

// ==========================================
// LISTE DES LIEUX
// ==========================================

const locationList =
    document.getElementById(
        "location-list"
    );

// ==========================================
// MISE A JOUR DE LA LISTE
// ==========================================

function updateLocationList(
    activeTypes = [
        "police",
        "hospital",
        "company",
        "government",
        "other"
    ],

    searchValue = ""
) {
    locationList.innerHTML = "";

    locations.forEach(
        location => {
            // Vérifier la catégorie
            if (
                !activeTypes.includes(
                    location.type
                )
            ) {
                return;
            }

            // Vérifier la recherche
            if (
                !location.name
                    .toLowerCase()
                    .includes(
                        searchValue
                    )
            ) {
                return;
            }

            const item =
                document.createElement(
                    "div"
                );

            item.className =
                "location-item";

            item.innerHTML = `
                <div class="location-name">
                    ${location.icon}
                    ${location.name}
                </div>

                <div class="location-type">
                    ${getTypeName(
                        location.type
                    )}
                </div>
            `;

            // ==========================================
            // CLIC SUR UN LIEU
            // ==========================================

            item.addEventListener(
                "click",
                () => {
                    map.flyTo(
                        imageToLeaflet(
                            location.x,
                            location.y
                        ),
                        1,
                        {
                            duration: 1
                        }
                    );

                    const marker =
                        markers.find(
                            marker =>
                                marker
                                    .locationData ===
                                    location
                        );

                    if (marker) {
                        marker.openPopup();
                    }
                }
            );

            locationList.appendChild(
                item
            );
        }
    );
}

// ==========================================
// SIDEBAR MOBILE
// ==========================================

const sidebarToggle =
    document.getElementById(
        "sidebar-toggle"
    );

const sidebar =
    document.getElementById(
        "sidebar"
    );

sidebarToggle.addEventListener(
    "click",
    () => {
        sidebar.classList.toggle(
            "open"
        );
    }
);