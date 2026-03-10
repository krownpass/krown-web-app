import api from "./api";
import type { Event, Ticket, EventFilters } from "@/types/event";

export const eventService = {
  // GET /api/events
  async getEvents(filters?: EventFilters): Promise<{ events: Event[]; total: number }> {
    const res = await api.get("/events", { params: filters });
    const data = res.data.data ?? res.data;
    return {
      events: Array.isArray(data) ? data : data.events ?? [],
      total: data.total ?? 0,
    };
  },

  // GET /api/events/slug/:slug
  async getEventBySlug(slug: string): Promise<Event> {
    const res = await api.get(`/events/slug/${slug}`);
    return res.data.data ?? res.data;
  },

  // GET /api/events/:event_id
  async getEventById(id: string): Promise<Event> {
    const res = await api.get(`/events/${id}`);
    return res.data.data ?? res.data;
  },

  // GET /api/events — no /events/upcoming endpoint on server
  async getUpcomingEvents(): Promise<Event[]> {
    const res = await api.get("/events");
    const data = res.data.data ?? res.data;
    return Array.isArray(data) ? data : data.events ?? [];
  },

  async getFeaturedEvents(): Promise<Event[]> {
    const res = await api.get("/events");
    const data = res.data.data ?? res.data;
    return (Array.isArray(data) ? data : data.events ?? []).slice(0, 5);
  },

  // POST /api/events/:eventId/register
  async registerForEvent(eventId: string, ticketCount: number = 1, tierId?: string): Promise<any> {
    const res = await api.post(`/events/${eventId}/register`, { 
      ticket_count: ticketCount,
      ...(tierId && { tier_id: tierId })
    });
    return res.data.data ?? res.data;
  },

  // POST /api/events/:eventId/waitlist
  async joinWaitlist(eventId: string): Promise<any> {
    const res = await api.post(`/events/${eventId}/waitlist`);
    return res.data.data ?? res.data;
  },

  // GET /api/events/my-registrations
  async getMyTickets(): Promise<Ticket[]> {
    const res = await api.get("/events/my-registrations");
    const data = res.data.data ?? res.data;
    return Array.isArray(data) ? data : data.events ?? data.registrations ?? [];
  },

  // GET /api/events/:eventId/registration
  async getUserRegistration(eventId: string): Promise<any> {
    const res = await api.get(`/events/${eventId}/registration`);
    return res.data.data ?? res.data;
  },

  // GET /api/events/:eventId/registration/qr
  async getTicketById(eventId: string): Promise<Ticket> {
    const res = await api.get(`/events/${eventId}/registration/qr`);
    return res.data.data ?? res.data;
  },

  async cancelRegistration(eventId: string): Promise<void> {
    await api.delete(`/events/${eventId}/registration`);
  },

  async bookmarkEvent(eventId: string): Promise<void> {
    await api.post(`/events/${eventId}/bookmark`);
  },

  async unbookmarkEvent(eventId: string): Promise<void> {
    await api.delete(`/events/${eventId}/bookmark`);
  },
};
