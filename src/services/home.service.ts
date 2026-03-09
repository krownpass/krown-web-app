import api from "./api";
import { mapCafe } from "./cafe.service";
import type { Cafe } from "@/types/cafe";

export interface KrownStory {
  story_id: string;
  title: string;
  description: string;
  cover_img: string;
  created_at: string;
  media: { media_id: string; type: "image" | "video"; uri: string }[];
}

export interface HomeBanner {
  image_id: number;
  image_url: string;
  path: string;
  section: string;
}

export interface HomeData {
  banners: HomeBanner[];
  stories: KrownStory[];
  cafeWithOffers: Cafe[];
  recommendedCafes: Cafe[];
  itemsOnTheBuzz: any[];
  visitedCafes: Cafe[];
}

export const homeService = {
  // GET /api/home
  async getHomeData(): Promise<HomeData> {
    const res = await api.get("/home");
    const d = res.data.data ?? res.data;
    return {
      banners: d.krownOfferBanners ?? [],
      stories: d.krownStories ?? [],
      cafeWithOffers: (d.cafeWithOffers ?? []).map(mapCafe),
      recommendedCafes: (d.recommendedCafes ?? []).map(mapCafe),
      itemsOnTheBuzz: d.itemsOnTheBuzz ?? [],
      visitedCafes: (d.visitedCafes ?? []).map(mapCafe),
    };
  },
};
