import type { Metadata } from "next";
import { APP_URL } from "./constants";
import type { Cafe } from "@/types/cafe";
import type { Event } from "@/types/event";

export function getBaseMetadata(): Metadata {
  return {
    metadataBase: new URL(APP_URL),
    icons: {
      icon: "/krown-icon.png",
      apple: "/krown-icon.png",
      shortcut: "/krown-icon.png",
    },
    title: {
      default: "Krown — Premium Café Discovery & Events in Chennai",
      template: "%s | Krown",
    },
    description:
      "Discover Chennai's finest cafés, book tables, attend exclusive events, and earn rewards with Krown Pass. Your premium café experience starts here.",
    keywords: [
      "cafes in chennai",
      "cafe booking chennai",
      "events in chennai",
      "krown pass",
      "restaurant booking",
      "table booking",
      "cafe discovery",
    ],
    authors: [{ name: "Krown" }],
    creator: "Krown",
    openGraph: {
      type: "website",
      locale: "en_IN",
      url: APP_URL,
      siteName: "Krown",
      title: "Krown — Premium Café Discovery & Events in Chennai",
      description:
        "Discover Chennai's finest cafés, book tables, attend exclusive events, and earn rewards with Krown Pass.",
      images: [
        {
          url: `${APP_URL}/og-image.jpg`,
          width: 1200,
          height: 630,
          alt: "Krown — Premium Café Experience",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Krown — Premium Café Discovery & Events in Chennai",
      description:
        "Discover Chennai's finest cafés, book tables, attend exclusive events.",
      images: [`${APP_URL}/og-image.jpg`],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export function getCafeMetadata(cafe: Cafe): Metadata {
  return {
    title: `${cafe.name} — ${cafe.area ?? cafe.city}`,
    description:
      cafe.description?.slice(0, 160) ??
      `Visit ${cafe.name} in ${cafe.area ?? cafe.city}. Book a table and discover amazing food and drinks.`,
    openGraph: {
      title: cafe.name,
      description: cafe.description?.slice(0, 160) ?? `${cafe.name} in ${cafe.city}`,
      images: cafe.cover_image ? [{ url: cafe.cover_image, width: 1200, height: 630 }] : [],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: cafe.name,
      description: cafe.description?.slice(0, 160) ?? `${cafe.name} in ${cafe.city}`,
      images: cafe.cover_image ? [cafe.cover_image] : [],
    },
  };
}

export function getEventMetadata(event: Event): Metadata {
  return {
    title: `${event.title} — ${event.venue_city ?? "Chennai"}`,
    description:
      event.description?.slice(0, 160) ??
      `Join us for ${event.title} at ${event.venue_name}. ${event.is_paid ? `From ₹${event.base_price}` : "Free entry"}.`,
    openGraph: {
      title: event.title,
      description: event.description?.slice(0, 160) ?? `${event.title} at ${event.venue_name}`,
      images: event.cover_image
        ? [{ url: event.cover_image, width: 1200, height: 630 }]
        : [],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: event.title,
      description: event.description?.slice(0, 160) ?? `${event.title} at ${event.venue_name}`,
      images: event.cover_image ? [event.cover_image] : [],
    },
  };
}
