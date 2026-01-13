/**
 * ZIP code to coordinates lookup for San Diego County
 * Coordinates are approximate centroids for each ZIP code area
 */

interface Coordinates {
	lat: number;
	lng: number;
}

// San Diego County ZIP codes with approximate center coordinates
const ZIP_COORDINATES: Record<string, Coordinates> = {
	// Central San Diego
	"92101": { lat: 32.7195, lng: -117.1628 }, // Downtown
	"92102": { lat: 32.7097, lng: -117.1182 }, // Southeast SD
	"92103": { lat: 32.7469, lng: -117.1698 }, // Hillcrest
	"92104": { lat: 32.7418, lng: -117.1296 }, // North Park
	"92105": { lat: 32.7349, lng: -117.0929 }, // City Heights
	"92106": { lat: 32.7236, lng: -117.2359 }, // Point Loma
	"92107": { lat: 32.7462, lng: -117.2494 }, // Ocean Beach
	"92108": { lat: 32.7738, lng: -117.1459 }, // Mission Valley
	"92109": { lat: 32.7872, lng: -117.2386 }, // Pacific Beach
	"92110": { lat: 32.7659, lng: -117.1995 }, // Morena
	"92111": { lat: 32.8088, lng: -117.1669 }, // Linda Vista
	"92113": { lat: 32.6867, lng: -117.1080 }, // Logan Heights
	"92114": { lat: 32.7048, lng: -117.0538 }, // Encanto
	"92115": { lat: 32.7611, lng: -117.0702 }, // College Area
	"92116": { lat: 32.7619, lng: -117.1273 }, // Normal Heights
	"92117": { lat: 32.8244, lng: -117.2003 }, // Clairemont
	"92118": { lat: 32.6804, lng: -117.1702 }, // Coronado
	"92119": { lat: 32.7937, lng: -117.0327 }, // San Carlos
	"92120": { lat: 32.7955, lng: -117.0701 }, // Allied Gardens
	"92121": { lat: 32.8989, lng: -117.2035 }, // Sorrento Valley
	"92122": { lat: 32.8575, lng: -117.2104 }, // University City
	"92123": { lat: 32.8099, lng: -117.1395 }, // Serra Mesa
	"92124": { lat: 32.8284, lng: -117.0839 }, // Tierrasanta
	"92126": { lat: 32.9111, lng: -117.1421 }, // Mira Mesa
	"92127": { lat: 33.0239, lng: -117.0842 }, // Rancho Bernardo
	"92128": { lat: 33.0170, lng: -117.0610 }, // Rancho Bernardo
	"92129": { lat: 32.9632, lng: -117.1239 }, // Rancho Penasquitos
	"92130": { lat: 32.9557, lng: -117.2264 }, // Carmel Valley
	"92131": { lat: 32.9189, lng: -117.0785 }, // Scripps Ranch
	"92132": { lat: 32.7000, lng: -117.2000 }, // Naval Base
	"92134": { lat: 32.7200, lng: -117.1500 }, // Naval Medical Center
	"92135": { lat: 32.7000, lng: -117.2000 }, // Naval Base
	"92136": { lat: 32.6850, lng: -117.1250 }, // Naval Station
	"92139": { lat: 32.6802, lng: -117.0499 }, // Paradise Hills
	"92140": { lat: 32.7400, lng: -117.1950 }, // Naval Training Center
	"92145": { lat: 32.8800, lng: -117.1400 }, // Miramar
	"92154": { lat: 32.5752, lng: -117.0582 }, // Otay Mesa

	// North County Coastal
	"92007": { lat: 33.0475, lng: -117.2917 }, // Cardiff
	"92008": { lat: 33.1261, lng: -117.3011 }, // Carlsbad
	"92009": { lat: 33.0892, lng: -117.2653 }, // Carlsbad
	"92010": { lat: 33.1581, lng: -117.3267 }, // Carlsbad
	"92011": { lat: 33.1117, lng: -117.3117 }, // Carlsbad
	"92014": { lat: 32.9592, lng: -117.2654 }, // Del Mar
	"92024": { lat: 33.0372, lng: -117.2789 }, // Encinitas
	"92054": { lat: 33.1959, lng: -117.3795 }, // Oceanside
	"92056": { lat: 33.2126, lng: -117.3296 }, // Oceanside
	"92057": { lat: 33.2384, lng: -117.3067 }, // Oceanside
	"92058": { lat: 33.2200, lng: -117.3500 }, // Oceanside
	"92075": { lat: 32.9873, lng: -117.2680 }, // Solana Beach
	"92083": { lat: 33.1386, lng: -117.1660 }, // Vista
	"92084": { lat: 33.1856, lng: -117.2386 }, // Vista

	// North County Inland
	"92025": { lat: 33.0492, lng: -117.0378 }, // Escondido
	"92026": { lat: 33.1167, lng: -117.0853 }, // Escondido
	"92027": { lat: 33.1127, lng: -117.0164 }, // Escondido
	"92028": { lat: 33.3531, lng: -117.2514 }, // Fallbrook
	"92029": { lat: 33.0955, lng: -117.0989 }, // Escondido
	"92064": { lat: 32.9812, lng: -117.0351 }, // Poway
	"92065": { lat: 33.0364, lng: -116.9575 }, // Ramona
	"92066": { lat: 33.1850, lng: -116.8756 }, // Ranchita
	"92069": { lat: 33.1417, lng: -117.1642 }, // San Marcos
	"92078": { lat: 33.1248, lng: -117.1714 }, // San Marcos
	"92081": { lat: 33.1528, lng: -117.2264 }, // Vista
	"92082": { lat: 33.2067, lng: -117.0083 }, // Valley Center
	"92086": { lat: 33.2889, lng: -116.5636 }, // Warner Springs

	// East County
	"91901": { lat: 32.8353, lng: -116.7664 }, // Alpine
	"91902": { lat: 32.6358, lng: -117.0431 }, // Bonita
	"91905": { lat: 32.6600, lng: -116.3167 }, // Boulevard
	"91906": { lat: 32.6336, lng: -116.4672 }, // Campo
	"91910": { lat: 32.6400, lng: -117.0100 }, // Chula Vista
	"91911": { lat: 32.6100, lng: -117.0400 }, // Chula Vista
	"91913": { lat: 32.6308, lng: -116.9558 }, // Chula Vista
	"91914": { lat: 32.6594, lng: -116.9236 }, // Chula Vista
	"91915": { lat: 32.5992, lng: -116.9489 }, // Chula Vista
	"91916": { lat: 32.8300, lng: -116.5500 }, // Descanso
	"91917": { lat: 32.6194, lng: -116.7667 }, // Dulzura
	"91931": { lat: 32.8389, lng: -116.5111 }, // Guatay
	"91932": { lat: 32.5778, lng: -117.1172 }, // Imperial Beach
	"91935": { lat: 32.7092, lng: -116.7875 }, // Jamul
	"91941": { lat: 32.7675, lng: -117.0028 }, // La Mesa
	"91942": { lat: 32.7797, lng: -117.0239 }, // La Mesa
	"91945": { lat: 32.7406, lng: -117.0453 }, // Lemon Grove
	"91950": { lat: 32.6672, lng: -117.0897 }, // National City
	"91962": { lat: 32.7500, lng: -116.4667 }, // Pine Valley
	"91963": { lat: 32.6167, lng: -116.6167 }, // Potrero
	"91977": { lat: 32.7028, lng: -117.0003 }, // Spring Valley
	"91978": { lat: 32.7467, lng: -116.9450 }, // Spring Valley
	"92019": { lat: 32.7822, lng: -116.9028 }, // El Cajon
	"92020": { lat: 32.7917, lng: -116.9614 }, // El Cajon
	"92021": { lat: 32.8206, lng: -116.9206 }, // El Cajon
	"92040": { lat: 32.8333, lng: -116.8667 }, // Lakeside
	"92071": { lat: 32.8378, lng: -116.9942 }, // Santee

	// Backcountry
	"91934": { lat: 32.6000, lng: -116.1667 }, // Jacumba
	"92004": { lat: 33.2500, lng: -116.3333 }, // Borrego Springs
	"92036": { lat: 32.9833, lng: -116.5833 }, // Julian
	"92070": { lat: 33.1000, lng: -116.6333 }, // Santa Ysabel
};

/**
 * Look up coordinates for a ZIP code
 * @returns Coordinates if found, null if ZIP code not in our database
 */
export function getCoordinatesForZip(zip: string): Coordinates | null {
	const cleaned = zip.trim().substring(0, 5);
	return ZIP_COORDINATES[cleaned] ?? null;
}

/**
 * Check if a ZIP code is valid (5 digits)
 */
export function isValidZipFormat(zip: string): boolean {
	return /^\d{5}$/.test(zip.trim());
}
