// =========================================================
// CONFIGURATION
// =========================================================

// Supabase Dashboard > Project Settings > API

const SUPABASE_URL =
    "https://kdahsggjtmgcjiguidfr.supabase.co";

const SUPABASE_ANON_KEY =
    "sb_publishable_ELLTPv_hy2TybFrHKS3Mdg_HadZh9JH";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
    );


// =========================================================
// ELEMENTS / VARIABLES
// =========================================================

const $ = id =>
    document.getElementById(id);

const login = $("login");
const admin = $("admin");
const list = $("list");

let locations = [];
let zones = [];
let types = [];

let currentId = null;
let currentZoneId = null;

let images = [];

let map;
let marker;

let mapW = 0;
let mapH = 0;

let creationMode = "location";


// =========================================================
// ZONES
// =========================================================

let zonePoints = [];
let zonePolygon = null;
let zoneMarkers = [];


// =========================================================
// UTILITAIRES
// =========================================================

function msg(text) {
    alert(text);
}


function typeName(id) {

    return (
        types.find(
            type => type.id === id
        )?.name || "Sans type"
    );

}


function iconValue(typeId) {

    const type =
        types.find(
            type => type.id === typeId
        );

    return type?.icon || "";

}


// =========================================================
// INITIALISATION
// =========================================================

async function init() {

    const {
        data: { session }
    } = await supabaseClient.auth.getSession();


    if (session) {

        await showAdmin();

    } else {

        showLogin();

    }

}


// =========================================================
// LOGIN / LOGOUT
// =========================================================

function showLogin() {

    login.classList.remove("hidden");

    admin.classList.add("hidden");

    $("logout").classList.add("hidden");

}


async function showAdmin() {

    login.classList.add("hidden");

    admin.classList.remove("hidden");

    $("logout").classList.remove("hidden");


    initMap();

    await loadRefs();

    await loadLocations();

    await loadZones();

}


$("loginForm").addEventListener(
    "submit",
    async e => {

        e.preventDefault();

        $("loginError").textContent = "";


        const email =
            $("email").value.trim();

        const password =
            $("password").value;


        const {
            data,
            error
        } =
            await supabaseClient.auth
                .signInWithPassword({
                    email,
                    password
                });


        if (error) {

            console.error(
                "Erreur de connexion :",
                error
            );

            $("loginError").textContent =
                error.message;

            return;
        }


        if (data.session) {

            await showAdmin();

        }

    }
);


$("logout").onclick =
    async () => {

        await supabaseClient.auth.signOut();

        showLogin();

    };


// =========================================================
// TYPES
// =========================================================

async function loadRefs() {

    const {
        data,
        error
    } =
        await supabaseClient
            .from("types")
            .select("*")
            .order("name");


    if (error) {

        console.error(error);

        msg(
            "Impossible de charger les types : " +
            error.message
        );

        return;
    }


    types = data || [];


    $("type").innerHTML =
        types.map(type => {

            return `
                <option value="${type.id}">
                    ${type.icon || ""}
                    ${type.name}
                </option>
            `;

        }).join("");

}


// =========================================================
// LOCATIONS
// =========================================================

async function loadLocations() {

    const {
        data,
        error
    } =
        await supabaseClient
            .from("locations")
            .select("*")
            .order("name");


    if (error) {

        msg(
            "Impossible de charger les lieux : " +
            error.message
        );

        return;
    }


    locations = data || [];

    renderList();

}


function renderList() {

    const q =
        $("search").value
            .toLowerCase()
            .trim();


    list.innerHTML = "";


    locations
        .filter(location =>
            location.name
                .toLowerCase()
                .includes(q)
        )
        .forEach(location => {

            const d =
                document.createElement("div");


            d.className =
                "item" +
                (
                    location.id === currentId
                        ? " active"
                        : ""
                );


            d.innerHTML = `
                <b>
                    ${iconValue(location.type_id)}
                    ${location.name}
                </b>

                <small>
                    ${typeName(location.type_id)}
                    · X ${location.x}
                    · Y ${location.y}
                </small>
            `;


            d.onclick = () =>
                editLocation(location);


            list.appendChild(d);

        });

}


$("search").oninput =
    renderList;


// =========================================================
// ZONES — CHARGEMENT
// =========================================================

async function loadZones() {

    const {
        data,
        error
    } =
        await supabaseClient
            .from("zones")
            .select("*")
            .order("name");


    if (error) {

        console.error(
            "Erreur chargement zones :",
            error
        );

        msg(
            "Impossible de charger les zones : " +
            error.message
        );

        return;
    }


    zones = data || [];

    renderZoneList();

}


// =========================================================
// ZONES — LISTE SIDEBAR
// =========================================================

function renderZoneList() {

    const zoneList =
        $("zone-list");


    zoneList.innerHTML = "";


    zones.forEach(zone => {

        const d =
            document.createElement("div");


        d.className =
            "item" +
            (
                zone.id === currentZoneId
                    ? " active"
                    : ""
            );


        const pointCount =
            Array.isArray(zone.points)
                ? zone.points.length
                : 0;


        d.innerHTML = `
            <b>
                ${iconValue(zone.type_id)}
                ${zone.name}
            </b>

            <small>
                <span
                    class="zone-color"
                    style="
                        display: inline-block;
                        width: 10px;
                        height: 10px;
                        border-radius: 3px;
                        background: ${zone.color || "#888"};
                        margin-right: 5px;
                        vertical-align: middle;
                    "
                ></span>

                Zone : ${pointCount} points
            </small>
        `;


        d.onclick = () =>
            editZone(zone);


        zoneList.appendChild(d);

    });

}


// =========================================================
// NOUVEAU LIEU
// =========================================================

function resetLocation() {

    currentId = null;
    currentZoneId = null;

    images = [];


    creationMode =
        "location";


    $("title").textContent =
        "Nouveau lieu";

    $("status").textContent =
        "Création d'un lieu";


    $("delete")
        .classList
        .add("hidden");


    $("name").value = "";

    $("description").value = "";

    $("x").value = "";

    $("y").value = "";

    $("visible").checked = true;


    if (types[0]) {

        $("type").value =
            types[0].id;

    }


    // Affichage champs lieu

    $("x-field")
        .classList
        .remove("hidden");

    $("y-field")
        .classList
        .remove("hidden");

    $("color-field")
        .classList
        .add("hidden");

    $("zone-controls")
        .classList
        .add("hidden");


    $("images-field")
        .classList
        .remove("hidden");


    // Supprimer ancien marqueur

    if (marker) {

        map.removeLayer(marker);

        marker = null;

    }


    clearZone();


    renderImages();

    renderList();

    renderZoneList();

}


$("new").onclick =
    resetLocation;


// =========================================================
// NOUVELLE ZONE
// =========================================================

function resetZone() {

    currentId = null;
    currentZoneId = null;

    images = [];


    creationMode =
        "zone";


    $("title").textContent =
        "Nouvelle zone";

    $("status").textContent =
        "Création d'une zone";


    $("delete")
        .classList
        .add("hidden");


    $("name").value = "";

    $("description").value = "";

    $("visible").checked = true;


    if (types[0]) {

        $("type").value =
            types[0].id;

    }


    $("color").value =
        "#10d1d1";


    // Masquer X / Y

    $("x-field")
        .classList
        .add("hidden");

    $("y-field")
        .classList
        .add("hidden");


    // Afficher couleur

    $("color-field")
        .classList
        .remove("hidden");


    // Afficher contrôles zone

    $("zone-controls")
        .classList
        .remove("hidden");


    // Les zones n'utilisent pas les images

    $("images-field")
        .classList
        .add("hidden");


    if (marker) {

        map.removeLayer(marker);

        marker = null;

    }


    clearZone();


    renderImages();

    renderList();

    renderZoneList();

}


$("new-zone").onclick =
    resetZone;


// =========================================================
// EDITION D'UN LIEU
// =========================================================

function editLocation(location) {

    creationMode =
        "location";


    currentId =
        location.id;

    currentZoneId =
        null;


    $("title").textContent =
        location.name;

    $("status").textContent =
        `ID : ${location.id}`;


    $("delete")
        .classList
        .remove("hidden");


    $("name").value =
        location.name;


    $("type").value =
        location.type_id || "";


    $("x").value =
        location.x;


    $("y").value =
        location.y;


    $("description").value =
        location.description || "";


    $("visible").checked =
        location.visible !== false;


    // Champs lieu

    $("x-field")
        .classList
        .remove("hidden");

    $("y-field")
        .classList
        .remove("hidden");

    $("color-field")
        .classList
        .add("hidden");

    $("zone-controls")
        .classList
        .add("hidden");


    $("images-field")
        .classList
        .remove("hidden");


    images =
        Array.isArray(location.images)
            ? structuredClone(location.images)
            : [];


    clearZone();


    renderImages();

    renderList();

    renderZoneList();


    setPoint(
        location.x,
        location.y
    );

}


// =========================================================
// EDITION D'UNE ZONE
// =========================================================

function editZone(zone) {

    creationMode =
        "zone";


    currentId = null;

    currentZoneId =
        zone.id;


    $("title").textContent =
        zone.name;

    $("status").textContent =
        `ID : ${zone.id}`;


    $("delete")
        .classList
        .remove("hidden");


    $("name").value =
        zone.name;


    $("type").value =
        zone.type_id || "";


    $("description").value =
        zone.description || "";


    $("visible").checked =
        zone.visible !== false;


    $("color").value =
        zone.color || "#10d1d1";


    // Champs zone

    $("x-field")
        .classList
        .add("hidden");

    $("y-field")
        .classList
        .add("hidden");


    $("color-field")
        .classList
        .remove("hidden");


    $("zone-controls")
        .classList
        .remove("hidden");


    $("images-field")
        .classList
        .add("hidden");


    // Charger les points

    zonePoints =
        Array.isArray(zone.points)
            ? structuredClone(zone.points)
            : [];


    if (marker) {

        map.removeLayer(marker);

        marker = null;

    }


    renderZonePreview();

    renderList();

    renderZoneList();


    // Centrer la carte sur la zone

    if (zonePoints.length > 0) {

        const firstPoint =
            zonePoints[0];

        const p =
            L.latLng(
                mapH - firstPoint.y,
                firstPoint.x
            );

        map.panTo(p);

    }

}


// =========================================================
// CARTE
// =========================================================

function initMap() {

    if (map) {
        return;
    }


    map =
        L.map(
            "map",
            {
                crs: L.CRS.Simple,
                minZoom: -4,
                maxZoom: 3,
                attributionControl: false
            }
        );


    const img =
        new Image();


    img.onload = () => {

        mapW =
            img.naturalWidth;

        mapH =
            img.naturalHeight;


        const bounds = [
            [0, 0],
            [mapH, mapW]
        ];


        L.imageOverlay(
            "map.jpg",
            bounds
        ).addTo(map);


        map.fitBounds(bounds);


        map.on(
            "click",
            e => {

                const x =
                    Math.round(
                        e.latlng.lng
                    );


                const y =
                    Math.round(
                        mapH -
                        e.latlng.lat
                    );


                // LIEU

                if (
                    creationMode ===
                    "location"
                ) {

                    $("x").value = x;

                    $("y").value = y;

                    setPoint(x, y);

                    return;

                }


                // ZONE

                if (
                    creationMode ===
                    "zone"
                ) {

                    addZonePoint(
                        x,
                        y
                    );

                }

            }
        );

    };


    img.src =
        "map.jpg";

}


// =========================================================
// MARQUEUR D'UN LIEU
// =========================================================

function setPoint(x, y) {

    if (
        !map ||
        !Number.isFinite(x) ||
        !Number.isFinite(y)
    ) {
        return;
    }


    const p =
        L.latLng(
            mapH - y,
            x
        );


    if (!marker) {

        marker =
            L.marker(p)
                .addTo(map);

    } else {

        marker.setLatLng(p);

    }


    map.panTo(p);

}


$("x").onchange =
    () =>
        setPoint(
            Number($("x").value),
            Number($("y").value)
        );


$("y").onchange =
    () =>
        setPoint(
            Number($("x").value),
            Number($("y").value)
        );


// =========================================================
// ZONES — AJOUT D'UN POINT
// =========================================================

function addZonePoint(x, y) {

    zonePoints.push({
        x,
        y
    });


    renderZonePreview();

}


// =========================================================
// ZONES — APERÇU
// =========================================================

function renderZonePreview() {

    $("zone-point-count").textContent =
        `Points : ${zonePoints.length}`;


    // Supprimer ancien polygone

    if (zonePolygon) {

        map.removeLayer(
            zonePolygon
        );

        zonePolygon = null;

    }


    // Supprimer anciens points

    zoneMarkers.forEach(
        zoneMarker => {

            map.removeLayer(
                zoneMarker
            );

        }
    );


    zoneMarkers = [];


    if (
        zonePoints.length === 0
    ) {

        return;

    }


    const color =
        $("color")?.value ||
        "#10d1d1";


    // Afficher les points

    zonePoints.forEach(
        point => {

            const pointMarker =
                L.circleMarker(
                    [
                        mapH - point.y,
                        point.x
                    ],
                    {
                        radius: 5,
                        color: "#fff",
                        weight: 2,
                        fillColor: color,
                        fillOpacity: 1
                    }
                )
                .addTo(map);


            zoneMarkers.push(
                pointMarker
            );

        }
    );


    // Afficher le polygone

    if (
        zonePoints.length >= 3
    ) {

        const leafletPoints =
            zonePoints.map(
                point => [
                    mapH - point.y,
                    point.x
                ]
            );


        zonePolygon =
            L.polygon(
                leafletPoints,
                {
                    color,
                    fillColor: color,
                    fillOpacity: 0.25,
                    weight: 2
                }
            )
            .addTo(map);

    }

}


// Mise à jour de la zone quand on change sa couleur

$("color").oninput =
    () => {

        if (
            creationMode ===
            "zone"
        ) {

            renderZonePreview();

        }

    };


// =========================================================
// ZONES — EFFACER
// =========================================================

function clearZone() {

    zonePoints = [];


    $("zone-point-count").textContent =
        "Points : 0";


    if (zonePolygon) {

        map.removeLayer(
            zonePolygon
        );

        zonePolygon = null;

    }


    zoneMarkers.forEach(
        zoneMarker => {

            map.removeLayer(
                zoneMarker
            );

        }
    );


    zoneMarkers = [];

}


// =========================================================
// ZONES — RETIRER DERNIER POINT
// =========================================================

$("undo-zone-point").onclick =
    () => {

        if (
            zonePoints.length === 0
        ) {

            return;

        }


        zonePoints.pop();

        renderZonePreview();

    };


// =========================================================
// ZONES — EFFACER
// =========================================================

$("clear-zone").onclick =
    () => {

        clearZone();

    };


// =========================================================
// IMAGES
// =========================================================

function renderImages() {

    $("images").innerHTML = "";


    images.forEach(
        (im, i) => {

            const url =
                typeof im === "string"
                    ? im
                    : im.path || im.url;


            const d =
                document.createElement(
                    "div"
                );


            d.className =
                "image";


            d.innerHTML = `
                <img
                    src="${url}"
                    alt=""
                >

                <div>

                    <small>
                        ${url.split("/").pop()}
                    </small>

                    <button
                        type="button"
                    >
                        Supprimer
                    </button>

                </div>
            `;


            d.querySelector(
                "button"
            ).onclick =
                () => {

                    images.splice(
                        i,
                        1
                    );

                    renderImages();

                };


            $("images")
                .appendChild(d);

        }
    );

}


$("files").onchange =
    async () => {

        for (
            const file of [
                ...$("files").files
            ]
        ) {

            const safe =
                file.name.replace(
                    /[^a-zA-Z0-9._-]/g,
                    "-"
                );


            const path =
                `locations/${
                    currentId ||
                    crypto.randomUUID()
                }/${
                    Date.now()
                }-${safe}`;


            const {
                error
            } =
                await supabaseClient
                    .storage
                    .from("images")
                    .upload(
                        path,
                        file,
                        {
                            contentType:
                                file.type,
                            upsert: false
                        }
                    );


            if (error) {

                msg(
                    error.message
                );

                continue;

            }


            const {
                data
            } =
                supabaseClient
                    .storage
                    .from("images")
                    .getPublicUrl(
                        path
                    );


            images.push({
                path:
                    data.publicUrl,
                alt:
                    file.name
            });

        }


        $("files").value = "";

        renderImages();

    };


// =========================================================
// SAUVEGARDE
// =========================================================

$("save").onclick =
    async () => {

        const name =
            $("name")
                .value
                .trim();


        if (!name) {

            msg(
                "Le nom est obligatoire."
            );

            return;

        }


        // =================================================
        // ZONE
        // =================================================

        if (
            creationMode ===
            "zone"
        ) {

            if (
                zonePoints.length < 3
            ) {

                msg(
                    "Une zone doit avoir au moins 3 points."
                );

                return;

            }


            const payload = {

                name,

                type_id:
                    $("type").value ||
                    null,

                color:
                    $("color").value,

                points:
                    zonePoints,

                description:
                    $("description")
                        .value
                        .trim(),

                visible:
                    $("visible")
                        .checked

            };


            $("save").disabled =
                true;


            let result;


            if (currentZoneId) {

                result =
                    await supabaseClient
                        .from("zones")
                        .update(payload)
                        .eq(
                            "id",
                            currentZoneId
                        )
                        .select()
                        .single();

            } else {

                result =
                    await supabaseClient
                        .from("zones")
                        .insert(payload)
                        .select()
                        .single();

            }


            $("save").disabled =
                false;


            if (result.error) {

                console.error(
                    "Erreur sauvegarde zone :",
                    result.error
                );


                msg(
                    "Erreur zone : " +
                    result.error.message
                );

                return;

            }


            currentZoneId =
                result.data.id;


            msg(
                "Zone enregistrée !"
            );


            await loadZones();


            const savedZone =
                zones.find(
                    zone =>
                        zone.id ===
                        currentZoneId
                );


            if (savedZone) {

                editZone(
                    savedZone
                );

            }


            return;

        }


        // =================================================
        // LIEU
        // =================================================

        const x =
            Number(
                $("x").value
            );


        const y =
            Number(
                $("y").value
            );


        if (
            !Number.isInteger(x) ||
            !Number.isInteger(y)
        ) {

            msg(
                "X et Y sont obligatoires."
            );

            return;

        }


        const payload = {

            name,

            type_id:
                $("type").value ||
                null,

            x,

            y,

            description:
                $("description")
                    .value
                    .trim(),

            images,

            visible:
                $("visible")
                    .checked

        };


        $("save").disabled =
            true;


        let result;


        if (currentId) {

            result =
                await supabaseClient
                    .from("locations")
                    .update(payload)
                    .eq(
                        "id",
                        currentId
                    )
                    .select()
                    .single();

        } else {

            result =
                await supabaseClient
                    .from("locations")
                    .insert(payload)
                    .select()
                    .single();

        }


        $("save").disabled =
            false;


        if (result.error) {

            msg(
                result.error.message
            );

            return;

        }


        currentId =
            result.data.id;


        msg(
            "Lieu enregistré."
        );


        await loadLocations();


        const savedLocation =
            locations.find(
                location =>
                    location.id ===
                    currentId
            );


        if (savedLocation) {

            editLocation(
                savedLocation
            );

        }

    };


// =========================================================
// SUPPRESSION
// =========================================================

$("delete").onclick =
    async () => {

        // =============================================
        // SUPPRESSION ZONE
        // =============================================

        if (
            creationMode ===
            "zone" &&
            currentZoneId
        ) {

            const zone =
                zones.find(
                    z =>
                        z.id ===
                        currentZoneId
                );


            if (
                !zone ||
                !confirm(
                    `Supprimer "${zone.name}" ?`
                )
            ) {

                return;

            }


            const {
                error
            } =
                await supabaseClient
                    .from("zones")
                    .delete()
                    .eq(
                        "id",
                        currentZoneId
                    );


            if (error) {

                msg(
                    error.message
                );

                return;

            }


            msg(
                "Zone supprimée."
            );


            resetZone();

            await loadZones();


            return;

        }


        // =============================================
        // SUPPRESSION LIEU
        // =============================================

        if (
            creationMode ===
            "location" &&
            currentId
        ) {

            const location =
                locations.find(
                    x =>
                        x.id ===
                        currentId
                );


            if (
                !location ||
                !confirm(
                    `Supprimer "${location.name}" ?`
                )
            ) {

                return;

            }


            const {
                error
            } =
                await supabaseClient
                    .from("locations")
                    .delete()
                    .eq(
                        "id",
                        currentId
                    );


            if (error) {

                msg(
                    error.message
                );

                return;

            }


            msg(
                "Lieu supprimé."
            );


            resetLocation();

            await loadLocations();

        }

    };


// =========================================================
// AUTH STATE
// =========================================================

supabaseClient.auth.onAuthStateChange(
    (_, session) => {

        if (!session) {

            showLogin();

        }

    }
);


// =========================================================
// SECTIONS SIDEBAR
// =========================================================

function setupCollapse(
    buttonId,
    contentId
) {

    const button =
        $(buttonId);

    const content =
        $(contentId);


    button.onclick =
        () => {

            const hidden =
                content.classList.toggle(
                    "hidden"
                );


            button.textContent =
                hidden
                    ? "⌄"
                    : "⌃";

        };

}


setupCollapse(
    "toggle-locations",
    "locations-content"
);


setupCollapse(
    "toggle-zones",
    "zones-content"
);


// =========================================================
// START
// =========================================================

init();