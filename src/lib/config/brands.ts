export const BRANDS = [
  { id: 'aftonbladet', name: 'Aftonbladet', country: 'SE' },
  { id: 'vg', name: 'VG', country: 'NO' },
  { id: 'bt', name: 'Bergens Tidende', country: 'NO' },
  { id: 'svd', name: 'Svenska Dagbladet', country: 'SE' },
  { id: 'e24', name: 'E24', country: 'NO' },
  { id: 'omni', name: 'Omni', country: 'SE' },
  { id: 'podme', name: 'Podme', country: 'NO' },
  { id: 'prisjakt', name: 'Prisjakt', country: 'SE' },
  { id: 'lendo', name: 'Lendo', country: 'SE' },
  { id: 'blocket', name: 'Blocket', country: 'SE' },
  { id: 'finn', name: 'FINN.no', country: 'NO' },
  { id: 'tori', name: 'Tori.fi', country: 'FI' },
] as const;

export type Brand = (typeof BRANDS)[number];
export type BrandId = Brand['id'];

export function getBrandById(id: string): Brand | undefined {
  return BRANDS.find((brand) => brand.id === id);
}

export function getBrandsByCountry(country: string): Brand[] {
  return BRANDS.filter((brand) => brand.country === country);
}
