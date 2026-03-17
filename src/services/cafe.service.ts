import api from "./api";
import type { Cafe, MenuItem, MenuCategory, CafeFilters, CafeTheme } from "@/types/cafe";
import type { Review, CreateReviewData } from "@/types/review";

// Map raw server response (uses DB column names) to our Cafe type
function mapCafe(raw: any): Cafe {
  return {
    cafe_id: raw.cafe_id,
    slug: raw.slug ?? undefined,
    name: raw.cafe_name ?? raw.name ?? "",
    description: raw.cafe_description ?? raw.description,
    address: raw.cafe_location ?? raw.address ?? "",
    city: raw.city ?? raw.cafe_location ?? "",
    area: raw.area ?? raw.cafe_location,
    latitude: raw.latitude,
    longitude: raw.longitude,
    phone: raw.cafe_mobile_no ?? raw.phone,
    email: raw.cafe_mail_id ?? raw.email,
    cover_image: raw.cover_img ?? raw.cover_image,
    rating: raw.ratings ?? raw.rating,
    total_reviews: raw.total_reviews,
    price_range: raw.price_range,
    vibes: raw.vibes ?? raw.keywords ?? [],
    is_open: raw.is_available ?? raw.is_open,
    is_bookmarked: raw.is_favourite ?? raw.is_bookmarked ?? false,
    has_krown_pass_benefit: raw.has_krown_pass_benefit ?? raw.editors_pick ?? false,
    discount_percent: raw.discount_percent,
    offers: Array.isArray(raw.offers) ? raw.offers.filter((o: any) => o && typeof o === 'object' && 'title' in o) : [],
    created_at: raw.created_at ?? "",
    updated_at: raw.updated_at ?? "",
  };
}

export const cafeService = {
  // GET /api/cafes — server returns all cafes (no server-side pagination)
  async getCafes(filters?: CafeFilters): Promise<{ cafes: Cafe[]; total: number }> {
    const res = await api.get("/cafes");
    const data = res.data.data ?? res.data;
    const raw: any[] = Array.isArray(data) ? data : data.cafes ?? [];
    let cafes = raw.map(mapCafe);

    if (filters) {
      if (filters.search) {
        const lower = filters.search.toLowerCase();
        cafes = cafes.filter((c) =>
          (c.name && c.name.toLowerCase().includes(lower)) ||
          (c.address && c.address.toLowerCase().includes(lower)) ||
          (c.vibes && c.vibes.some((v) => v.toLowerCase().includes(lower)))
        );
      }
      if (filters.vibe) {
        const targetVibe = filters.vibe.toLowerCase();
        cafes = cafes.filter((c) => c.vibes && c.vibes.some(v => v.toLowerCase().includes(targetVibe)));
      }
      if (filters.open_now !== undefined) {
        cafes = cafes.filter((c) => c.is_open === filters.open_now);
      }
      if (filters.sort_by) {
        if (filters.sort_by === 'rating') {
          cafes.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        } else if (filters.sort_by === 'newest') {
          cafes.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        }
      }
    }

    // Handled client-side pagination since we fetched all
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const startIndex = (page - 1) * limit;
    const paginatedCafes = cafes.slice(startIndex, startIndex + limit);

    return { cafes: paginatedCafes, total: cafes.length };
  },

  // GET /api/cafes/:cafeId — server only supports UUID lookup
  // If slug is not a UUID (e.g. "xpcdvp3a"), fetch all cafes and find by slug
  async getCafeBySlug(slug: string): Promise<Cafe> {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(slug)) {
      const res = await api.get(`/cafes/${slug}`);
      return mapCafe(res.data.data ?? res.data);
    }
    // Short slug — find matching cafe from list
    const listRes = await api.get("/cafes");
    const data = listRes.data.data ?? listRes.data;
    const raw: any[] = Array.isArray(data) ? data : data.cafes ?? [];
    const found = raw.find((c) => c.slug === slug);
    if (!found) throw new Error("Cafe not found");
    // Fetch full details by UUID
    const res = await api.get(`/cafes/${found.cafe_id}`);
    return mapCafe(res.data.data ?? res.data);
  },

  async getCafeById(id: string): Promise<Cafe> {
    const res = await api.get(`/cafes/${id}`);
    return mapCafe(res.data.data ?? res.data);
  },

  // GET /api/cafes/:cafeId/menu
  async getCafeMenu(cafeId: string): Promise<MenuCategory[]> {
    const res = await api.get(`/cafes/${cafeId}/menu`);
    const data = res.data.data ?? res.data;
    const items = Array.isArray(data) ? data : data.menu ?? data.categories ?? [];
    
    // Auto-group if it's a flat array of items (like from Postgres)
    if (items.length > 0 && !('items' in items[0])) {
       const grouped: Record<string, any[]> = {};
       items.forEach((item: any) => {
         const cat = item.category || 'Other';
         if (!grouped[cat]) grouped[cat] = [];
         grouped[cat].push({
            item_id: item.item_id,
            cafe_id: item.cafe_id,
            name: item.item_name || item.name,
            description: item.item_description || item.description,
            price: Number(item.price),
            image_url: item.cover_img || item.image_url,
            category: cat,
            is_recommended: item.recommended ?? item.is_recommended,
            is_available: item.availability === 'available' || item.is_available === true || item.availability == null
         });
       });
       return Object.keys(grouped).map(cat => ({ category: cat, items: grouped[cat] }));
    }
    return items;
  },

  // GET /api/cafes/:cafeId/images  — returns structured { main, gallery, menu }
  async getCafeImages(cafeId: string): Promise<{ main: string[]; gallery: string[]; menu: string[] }> {
    const res = await api.get(`/cafes/${cafeId}/images`);
    const data = res.data.data ?? res.data;
    const toUrls = (imgs: any[]) => imgs?.map((img: any) => img.image_url ?? img.uri ?? img) ?? [];
    return {
      main: toUrls(data?.main?.images ?? data?.main ?? []),
      gallery: toUrls(data?.gallery?.images ?? data?.gallery ?? []),
      menu: toUrls(data?.menu?.images ?? data?.menu ?? []),
    };
  },

  // GET /api/cafes/:cafeId/reviews?page=1&limit=20
  async getCafeReviews(cafeId: string): Promise<Review[]> {
    const res = await api.get(`/cafes/${cafeId}/reviews`, { params: { page: 1, limit: 20 } });
    const data = res.data.data ?? res.data;
    return data.reviews ?? (Array.isArray(data) ? data : []);
  },

  async createReview(data: CreateReviewData): Promise<Review> {
    const payload = {
      ratings: data.rating,
      description: data.comment,
      images: data.images,
    };
    const res = await api.post(`/cafes/${data.cafe_id}/reviews`, payload);
    return res.data.data ?? res.data;
  },

  // GET /api/users/themes/with-cafes
  async getThemes(): Promise<CafeTheme[]> {
    const res = await api.get("/users/themes/with-cafes");
    const data = res.data.data ?? res.data;
    return Array.isArray(data) ? data : data.themes ?? [];
  },

  async getCafesByTheme(themeSlug: string): Promise<Cafe[]> {
    const res = await api.get("/users/themes/with-cafes");
    const data = res.data.data ?? res.data;
    const themes: any[] = Array.isArray(data) ? data : data.themes ?? [];
    const theme = themes.find((t: any) =>
      t.slug === themeSlug || t.theme_name?.toLowerCase().replace(/\s+/g, "-") === themeSlug
    );
    return (theme?.cafes ?? []).map(mapCafe);
  },

  // All cafes (no pagination, used by swipe deck)
  async getAllCafes(): Promise<Cafe[]> {
    const res = await api.get("/cafes");
    const data = res.data.data ?? res.data;
    const raw: any[] = Array.isArray(data) ? data : data.cafes ?? [];
    return raw.map(mapCafe);
  },

  // Featured cafes: use GET /cafes (server has no /cafes/offers endpoint)
  async getFeaturedCafes(): Promise<Cafe[]> {
    const res = await api.get("/cafes");
    const data = res.data.data ?? res.data;
    const raw: any[] = Array.isArray(data) ? data : data.cafes ?? [];
    return raw.slice(0, 12).map(mapCafe);
  },

  async getSimilarCafes(cafeId: string, limit = 10): Promise<Cafe[]> {
    const res = await api.get(`/cafes/${cafeId}/similar`, { params: { limit } });
    const data = res.data.data ?? res.data;
    const raw: any[] = Array.isArray(data) ? data : data.cafes ?? [];
    return raw.map(mapCafe);
  },
  async getNearbyCafes(lat: number, lng: number): Promise<Cafe[]> {
    const res = await api.get("/cafes", { params: { userLat: lat, userLng: lng } });
    const data = res.data.data ?? res.data;
    const raw: any[] = Array.isArray(data) ? data : data.cafes ?? [];
    return raw.slice(0, 10).map(mapCafe);
  },
};

export { mapCafe };
