export interface LocationData {
  subCities: {
    name: string;
    areas: string[];
  }[];
}

export const locationData: LocationData = {
  subCities: [
    {
      name: 'Dukam',
      areas: [
        'Odaa Nabee',
        'Xaddachaa',
        'Malkaa',
        'Abbuu Seeraa',
        'Chelaleka',
        'Jalaa',
        'Erere',
        'Arsadee',
        'Kilolee',
        'Debaayyuu',
      ],
    },
    {
      name: 'Bishoftu Central',
      areas: ['Dhakaa Boora', 'Dirree', 'Horaa', 'Biiftuu'],
    },
    {
      name: 'Other',
      areas: ['Not Listed'],
    },
  ],
};

export function getAreasForSubCity(subCityName: string): string[] {
  const subCity = locationData.subCities.find(
    (sc) => sc.name === subCityName
  );
  return subCity ? subCity.areas : [];
}

export function getAllSubCities(): string[] {
  return locationData.subCities.map((sc) => sc.name);
}

export const LICENSE_TYPES = [
  'Hotel',
  'Guest House',
  'Lodge',
  'Hostel',
  'Motel',
  'Bed & Breakfast',
];

export const LICENSE_LEVELS = [
  'Star 1',
  'Star 2',
  'Star 3',
  'Star 4',
  'Star 5',
  'Standard',
  'Not Rated',
  'Under License',
];
