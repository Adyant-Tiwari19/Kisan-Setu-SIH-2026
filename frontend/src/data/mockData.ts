export const roleOptions = [
  {
    id: 'farmer',
    title: 'Farmer',
    description: 'List harvests, track demand, and plan pickup easily.',
    route: '/farmer',
  },
  {
    id: 'retailer',
    title: 'Retailer',
    description: 'Buy fresh produce from nearby farmers and FPOs.',
    route: '/retailer',
  },
  {
    id: 'bulk-buyer',
    title: 'Bulk Buyer',
    description: 'Manage procurement, RFQs, and supplier matching.',
    route: '/buyer',
  },
]

export const retailNavItems = ['Home', 'Marketplace', 'Cart', 'Orders', 'Profile']

export const retailCategories = ['All', 'Vegetables', 'Fruits', 'Rice', 'Spices', 'Seasonal']

export const retailProducts = [
  {
    name: 'Tomatoes',
    farmer: 'Green Valley FPO',
    origin: 'Nashik',
    price: '₹38/kg',
    delivered: '₹52/kg',
    harvest: '2 hrs ago',
    distance: '4.8 km',
    freshness: '96',
    trust: '4.9',
    qty: '180 kg',
    badge: 'Best value',
  },
  {
    name: 'Bananas',
    farmer: 'Sundaram Farms',
    origin: 'Coimbatore',
    price: '₹28/kg',
    delivered: '₹39/kg',
    harvest: '1 hr ago',
    distance: '7.2 km',
    freshness: '94',
    trust: '4.8',
    qty: '240 kg',
    badge: 'Freshest',
  },
  {
    name: 'Rice',
    farmer: 'Aaranya Collective',
    origin: 'Kurnool',
    price: '₹24/kg',
    delivered: '₹32/kg',
    harvest: 'Today',
    distance: '12.4 km',
    freshness: '92',
    trust: '4.7',
    qty: '410 kg',
    badge: 'Cheapest',
  },
]

export const retailOrderTimeline = ['Confirmed', 'Pickup', 'In Transit', 'Delivered']

export const bulkBuyerNavItems = ['Home', 'Requirements', 'Matches', 'Orders', 'Suppliers', 'Profile']

export const bulkBuyerMatches = [
  {
    name: 'Green Valley FPO',
    landed: '₹32/kg',
    distance: '12 km away',
    freshness: 'Harvested today',
    reliability: '95% fulfillment',
    recommendation: '₹6/kg cheaper delivered',
    value: 'Best fit',
  },
  {
    name: 'Aaranya Collective',
    landed: '₹35/kg',
    distance: '18 km away',
    freshness: 'Fresh grade A',
    reliability: '92% fulfillment',
    recommendation: 'Higher quality match',
    value: 'Preferred',
  },
  {
    name: 'Sundaram Farms',
    landed: '₹38/kg',
    distance: '9 km away',
    freshness: 'Harvested yesterday',
    reliability: '90% fulfillment',
    recommendation: 'Nearest route',
    value: 'Fastest',
  },
]

export const bulkOrderRows = [
  { id: 'BULK-2048', qty: '650 kg', supplier: 'Green Valley FPO', pickup: 'Tomorrow 7:30 AM', cost: '₹20,800', status: 'Confirmed' },
  { id: 'BULK-2034', qty: '420 kg', supplier: 'Aaranya Collective', pickup: 'Wed 8:00 AM', cost: '₹14,700', status: 'In transit' },
]

export const farmerSummary = [
  { label: 'Today', value: '₹18,500', note: 'Expected sales' },
  { label: 'Listings', value: '14', note: 'Active crops' },
  { label: 'Orders', value: '08', note: 'Pending' },
]

export const farmerAlerts = [
  'Tomato demand up by 18% next week',
  'Rain expected tomorrow - protect harvest',
  'Pickup slot available for 2:30 PM',
]
