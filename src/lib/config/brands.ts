export const BRANDS = [
  // Norway
  { id: 'vg', name: 'VG', country: 'NO' },
  { id: 'ap', name: 'Aftenposten', country: 'NO' },
  { id: 'bt', name: 'Bergens Tidende', country: 'NO' },
  { id: 'e24', name: 'E24', country: 'NO' },
  { id: 'sa', name: 'Stavanger Aftenblad', country: 'NO' },
  // Sweden
  { id: 'ab', name: 'Aftonbladet', country: 'SE' },
  { id: 'svd', name: 'Svenska Dagbladet', country: 'SE' },
  { id: 'omni', name: 'Omni', country: 'SE' },
] as const;

export type Brand = (typeof BRANDS)[number];
export type BrandId = Brand['id'];

export function getBrandById(id: string): Brand | undefined {
  return BRANDS.find((brand) => brand.id === id);
}

export function getBrandsByCountry(country: string): Brand[] {
  return BRANDS.filter((brand) => brand.country === country);
}
