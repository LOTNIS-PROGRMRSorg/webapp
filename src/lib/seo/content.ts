// Unique, useful copy for the "rent a {type}" and "stays in {city}" landing pages.
// Each page needs its own text (not just a filtered grid) to be worth indexing.

export type SpaceCopy = { slug: string; label: string; plural: string; h1: string; intro: string; why: string[]; faqs: Array<{ question: string; answer: string }> };
export type CityCopy = { slug: string; name: string; h1: string; intro: string; areas: string[] };

export const SPACE_COPY: SpaceCopy[] = [
  { slug: 'apartment', label: 'Apartment', plural: 'apartments', h1: 'Apartments for rent in Ghana',
    intro: 'Furnished and unfurnished apartments, rented by the night, week, month or year. Every host is verified, the full price is shown up front, and the refund rules are clear before you book.',
    why: ['Book short stays or lets of a year or more', 'See photos, size and facilities before you reserve', 'Pay with mobile money (MTN, Telecel, AirtelTigo) or card'],
    faqs: [{ question: 'Can I rent an apartment in Ghana for a month?', answer: 'Yes. Many hosts price apartments by the month. Monthly stays are booked in whole calendar months, for example 1 March to 1 April, never pro-rated by days.' },
           { question: 'Are utilities included in apartment rent?', answer: 'It depends on the listing. Each apartment shows whether utilities are included, whether it is furnished and whether there is power backup.' }] },
  { slug: 'house', label: 'House', plural: 'houses', h1: 'Houses for rent in Ghana',
    intro: 'Family homes and whole houses to rent for a weekend, a season or a year. Some hosts also let rooms in the same house separately, so you can take just the space you need.',
    why: ['Whole-house or room-by-room, depending on the host', 'Clear deposit and refund terms on every listing', 'Verified hosts and approved listings'],
    faqs: [{ question: 'Can I rent just one room in a house?', answer: 'Many houses on Lotnis can be booked room by room. Booking a room blocks the whole house for those dates, and booking the whole house blocks every room, so there are no double bookings.' },
           { question: 'How much is the deposit on a house rental?', answer: 'Hosts set an optional refundable deposit. It is shown before you pay and is returned after you move out, less any itemised deductions you can review and dispute.' }] },
  { slug: 'villa', label: 'Villa', plural: 'villas', h1: 'Villas for rent in Ghana',
    intro: 'Villas for family holidays, events and long lets — with the details that matter listed up front: bedrooms, bathrooms, guest capacity, power backup and more.',
    why: ['Whole-villa or individual suites', 'Photo galleries for every space', 'Transparent pricing and a published refund policy'],
    faqs: [{ question: 'How do I book a villa on Lotnis?', answer: 'Choose your dates, review the price, and pay by mobile money or card. Some hosts approve requests first: they have 48 hours to respond and you only pay once they accept.' },
           { question: 'What if I need to cancel a villa booking?', answer: 'Each villa shows its refund policy before you book. Your deposit is refunded, the Lotnis service fee is not, and if the host cancels you get everything back.' }] },
  { slug: 'room', label: 'Room', plural: 'rooms', h1: 'Rooms for rent in Ghana',
    intro: 'Private and shared rooms in verified homes, from a few nights to a full year. Each room shows its own photos, bed type, bathroom and price.',
    why: ['Rent one room, not a whole house', 'See each room\'s photos, size and bathroom', 'Short and long stays, billed in whole units'],
    faqs: [{ question: 'Can I rent a room for a year?', answer: 'Yes. Hosts can price rooms by the night, week, month or year. Yearly rooms are booked in whole years.' },
           { question: 'Is the bathroom private?', answer: 'Every room states whether it has a private or shared bathroom, along with how many guests it sleeps.' }] },
  { slug: 'hotel', label: 'Hotel / hostel', plural: 'hotels and hostels', h1: 'Hotels and hostels in Ghana',
    intro: 'Hotels, guesthouses and hostels with clear prices and fair refund rules. Book individual rooms by the night or by the week.',
    why: ['Room-by-room booking with photos', 'Verified hosts and approved listings', 'Free, clear refund rules shown before you pay'],
    faqs: [{ question: 'Can I pay for a hotel with mobile money?', answer: 'Yes. Checkout runs through Paystack, which accepts MTN, Telecel and AirtelTigo mobile money as well as Visa and Mastercard.' }] },
  { slug: 'office', label: 'Office', plural: 'offices', h1: 'Offices for rent in Ghana',
    intro: 'Office space on flexible terms — a desk-sized room or a whole floor, by the month or year. Capacity, furnishing, 24-hour access and power backup are listed on every office.',
    why: ['Monthly and yearly terms in whole calendar units', 'Capacity, access hours and power backup shown up front', 'A clear refund and notice policy, so you can plan'],
    faqs: [{ question: 'Can I rent an office in Ghana monthly?', answer: 'Yes. Offices can be priced monthly or yearly. Monthly lets are booked in whole calendar months and yearly lets in whole years.' },
           { question: 'What notice do I give if I leave an office early?', answer: 'Lotnis asks for 7 nights\' notice. If you give less, the shortfall is charged — never past your booking end — and any time the host re-lets is credited back to you.' }] },
  { slug: 'shop', label: 'Shop', plural: 'shops', h1: 'Shops and retail space for rent in Ghana',
    intro: 'Storefronts and retail units for pop-ups, trading and long leases, with loading access, power backup and utilities noted on each listing.',
    why: ['Flexible terms from weekly to yearly', 'Loading access and utilities listed', 'Verified hosts and clear deposits'],
    faqs: [{ question: 'Can I rent a shop for a short pop-up?', answer: 'Hosts can price shops by the week or month, so short trading periods are possible. Check each listing\'s minimum and maximum stay.' }] },
  { slug: 'garage', label: 'Garage', plural: 'garages', h1: 'Garages and parking for rent in Ghana',
    intro: 'Secure garages and covered parking for a car, a workshop or storage — by the week, month or year, with access hours and ceiling height listed.',
    why: ['Ceiling height and access hours shown', 'Weekly, monthly and yearly options', 'Clear deposit and refund terms'],
    faqs: [{ question: 'Is a garage accessible 24 hours?', answer: 'Each garage listing says whether it has 24-hour access, loading access and power backup.' }] },
  { slug: 'warehouse', label: 'Warehouse', plural: 'warehouses', h1: 'Warehouses and storage for rent in Ghana',
    intro: 'Warehouse and storage space for businesses: floor area, ceiling height, loading access, 24-hour access and power backup are listed so you can compare like with like.',
    why: ['Loading access and ceiling height listed', 'Monthly and yearly terms', 'Verified hosts, clear refund and notice rules'],
    faqs: [{ question: 'Can I rent warehouse space on a monthly basis?', answer: 'Yes. Warehouses are commonly priced by the month or year and booked in whole calendar units.' }] },
  { slug: 'venue', label: 'Venue', plural: 'venues', h1: 'Venues for rent in Ghana',
    intro: 'Event spaces and venues with capacity, ceiling height, power backup and access hours listed, so you can pick the right space for your gathering.',
    why: ['Capacity and facilities listed up front', 'Clear refund policy shown before you pay', 'Verified hosts'],
    faqs: [{ question: 'How do I know a venue is big enough?', answer: 'Each venue shows its capacity and floor area, with photos of every space.' }] },
];

export const CITY_COPY: CityCopy[] = [
  { slug: 'accra', name: 'Accra', h1: 'Places to rent in Accra', intro: 'Apartments, serviced stays, offices and storage close to work, the airport and the coast. Browse by area or space type, rent by the night, week, month or year.', areas: ['Osu', 'Cantonments', 'East Legon', 'Airport Residential', 'Labone'] },
  { slug: 'kumasi', name: 'Kumasi', h1: 'Places to rent in Kumasi', intro: 'Family homes, offices and long lets in Kumasi and the Ashanti Region, from verified hosts with clear prices and fair refund rules.', areas: ['Santasi', 'Ahodwo', 'Nhyiaeso', 'Adum'] },
  { slug: 'cape-coast', name: 'Cape Coast', h1: 'Places to rent in Cape Coast', intro: 'Guesthouses, villas and beach-side stays near Cape Coast Castle, by the night or for longer.', areas: ['Fosu Lagoon', 'University of Cape Coast', 'Elmina'] },
  { slug: 'takoradi', name: 'Takoradi', h1: 'Places to rent in Takoradi and Busua', intro: 'Surf-town stays, apartments and commercial space around Takoradi and Busua in the Western Region.', areas: ['Busua', 'Anaji', 'Beach Road'] },
  { slug: 'aburi', name: 'Aburi', h1: 'Places to rent in Aburi', intro: 'Cool-hills getaways an hour from Accra: villas and homes for weekends, retreats and longer stays.', areas: ['Aburi Gardens', 'Akuapem Hills'] },
  { slug: 'tema', name: 'Tema', h1: 'Places to rent in Tema', intro: 'Warehouses, garages, offices and homes in Tema — close to the port and the Accra–Tema motorway.', areas: ['Community 1', 'Community 18', 'Tema Industrial Area'] },
];

export const spaceBySlug = (slug?: string) => SPACE_COPY.find((s) => s.slug === slug);
export const cityBySlug = (slug?: string) => CITY_COPY.find((c) => c.slug === slug);
