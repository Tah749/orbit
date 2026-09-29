import { useEffect, useState } from "react";
import { View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Plus } from "phosphor-react-native";
import type { Trip } from "@orbit/data/plans";
import { on } from "@orbit/time";
import { joinNames, kindNames, prompts, tripDates } from "@orbit/sections/plans/lib";
import { useDB } from "../../src/store";
import { Button, Empty, Page, Screen, Sheet, Source, Text, useSimulatedLoad } from "../../src/ui";
import { AddBooking } from "../../src/sections/plans/AddBooking";
import { BookingActions, BookingBody } from "../../src/sections/plans/BookingBody";
import { Itinerary } from "../../src/sections/plans/Itinerary";
import { PlansSkeleton } from "../../src/sections/plans/Skeleton";
import { Prompts, References } from "../../src/sections/plans/Trip";

/** plans/<tripId> is a trip's itinerary. plans/<bookingId> opens that booking, on its trip if it has one. */
export default function PlanScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const trip = useDB((d) => d.trips.find((t) => t.id === id));
  const booking = useDB((d) => d.bookings.find((b) => b.id === id));
  const loading = useSimulatedLoad(`plan-${id}`);

  if (trip) return <TripScreen trip={trip} loading={loading} />;
  if (booking?.tripId) return <TripScreenFor tripId={booking.tripId} openId={booking.id} loading={loading} />;
  if (booking) return <SingleBooking id={booking.id} loading={loading} />;
  return (
    <Screen back>
      <Page eyebrow="Plans" title="Booking">
        {loading ? <PlansSkeleton /> : <Empty title="That booking isn't here any more">It may have been removed.</Empty>}
      </Page>
    </Screen>
  );
}

function TripScreenFor({ tripId, openId, loading }: { tripId: string; openId: string; loading: boolean }) {
  const trip = useDB((d) => d.trips.find((t) => t.id === tripId));
  if (!trip)
    return (
      <Screen back>
        <Page eyebrow="Plans" title="Trip">
          <Empty title="That trip isn't here any more" />
        </Page>
      </Screen>
    );
  return <TripScreen trip={trip} openId={openId} loading={loading} />;
}

function TripScreen({ trip, openId, loading }: { trip: Trip; openId?: string; loading: boolean }) {
  const list = useDB((d) => d.bookings.filter((b) => b.tripId === trip.id).sort((a, b) => a.start.localeCompare(b.start)));
  const [open, setOpen] = useState<string | undefined>(openId);
  const [adding, setAdding] = useState(false);
  useEffect(() => setOpen(openId), [openId]);
  const b = list.find((x) => x.id === open);
  const upcoming = trip.end >= on(0);
  const kindsIn = [...new Set(list.map((x) => kindNames[x.kind].toLowerCase()))];

  return (
    <Screen back>
      <Page
        eyebrow="Trip"
        title={trip.title}
        lede={`${tripDates(trip)} · ${joinNames(trip.travellers)}${trip.note ? ` · ${trip.note}` : ""}`}
        actions={
          <Button size="sm" icon={<Plus size={14} weight="bold" />} onPress={() => setAdding(true)}>
            Add
          </Button>
        }
      >
        {loading ? (
          <PlansSkeleton />
        ) : list.length === 0 ? (
          <Empty title="No bookings in this trip yet" action={<Button onPress={() => setAdding(true)}>Add a booking</Button>}>
            Confirmation emails for {trip.destination} will appear here.
          </Empty>
        ) : (
          <View style={{ gap: 28 }}>
            {upcoming ? <Prompts list={prompts(list)} onOpen={setOpen} /> : null}
            <References list={list} />
            <Itinerary bookings={list} tripStart={trip.start} onOpen={setOpen} />
            <View style={{ gap: 8 }}>
              <Text size={12.5} tone="muted">
                {list.length} {list.length === 1 ? "booking" : "bookings"}: {joinNames(kindsIn)}. Tap one for the details.
              </Text>
              <View style={{ flexDirection: "row", gap: 12 }}>
                {[...new Set(list.map((x) => x.source))].map((s) => (
                  <Source key={s} id={s} />
                ))}
              </View>
            </View>
          </View>
        )}
      </Page>

      <Sheet open={!!b} onClose={() => setOpen(undefined)} title={b?.title ?? ""} footer={b ? <BookingActions b={b} fill /> : undefined}>
        {b ? <BookingBody b={b} hideTrip /> : null}
      </Sheet>
      <AddBooking open={adding} onClose={() => setAdding(false)} tripId={trip.id} />
    </Screen>
  );
}

function SingleBooking({ id, loading }: { id: string; loading: boolean }) {
  const b = useDB((d) => d.bookings.find((x) => x.id === id));
  if (!b) return null;
  return (
    <Screen back>
      <Page eyebrow="Booking" title={b.title}>
        {loading ? (
          <PlansSkeleton />
        ) : (
          <View style={{ gap: 28 }}>
            <BookingBody b={b} />
            <BookingActions b={b} />
          </View>
        )}
      </Page>
    </Screen>
  );
}
