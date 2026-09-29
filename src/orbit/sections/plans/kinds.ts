import { AirplaneTilt, Bed, Car, ForkKnife, Ticket, Train, type Icon } from "@phosphor-icons/react";
import type { BookingKind } from "../../data/plans";
import { kindNames } from "./lib";

/** Booking kinds with their web icons. The names live in lib.ts so mobile can share them. */
export const kinds: Record<BookingKind, { name: string; icon: Icon }> = {
  flight: { name: kindNames.flight, icon: AirplaneTilt },
  hotel: { name: kindNames.hotel, icon: Bed },
  train: { name: kindNames.train, icon: Train },
  restaurant: { name: kindNames.restaurant, icon: ForkKnife },
  event: { name: kindNames.event, icon: Ticket },
  car: { name: kindNames.car, icon: Car },
};
