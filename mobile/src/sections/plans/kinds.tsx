import { AirplaneTilt, Bed, Car, ForkKnife, Ticket, Train, type Icon } from "phosphor-react-native";
import type { BookingKind } from "@orbit/data/plans";
import { kindNames } from "@orbit/sections/plans/lib";

/** Booking kinds with their mobile icons. Names come from the shared lib. */
export const kinds: Record<BookingKind, { name: string; icon: Icon }> = {
  flight: { name: kindNames.flight, icon: AirplaneTilt },
  hotel: { name: kindNames.hotel, icon: Bed },
  train: { name: kindNames.train, icon: Train },
  restaurant: { name: kindNames.restaurant, icon: ForkKnife },
  event: { name: kindNames.event, icon: Ticket },
  car: { name: kindNames.car, icon: Car },
};
