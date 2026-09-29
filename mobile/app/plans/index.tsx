import { useCallback, useMemo, useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { Plus } from "phosphor-react-native";
import type { Booking, Trip } from "@orbit/data/plans";
import { on } from "@orbit/time";
import { isPast } from "@orbit/sections/plans/lib";
import { useTheme } from "../../src/theme";
import { useDB } from "../../src/store";
import { Button, Empty, IconButton, Page, Screen, Section, useSimulatedLoad } from "../../src/ui";
import { AddBooking } from "../../src/sections/plans/AddBooking";
import { PlansSkeleton } from "../../src/sections/plans/Skeleton";
import { LaterTrip, NextTrip, OtherBookings, PastList } from "../../src/sections/plans/Trip";

const byStart = (a: Booking, b: Booking) => a.start.localeCompare(b.start);

export default function PlansScreen() {
  const { c } = useTheme();
  const router = useRouter();
  const bookings = useDB((d) => d.bookings);
  const trips = useDB((d) => d.trips);
  const [adding, setAdding] = useState(false);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [allPast, setAllPast] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const loading = useSimulatedLoad("plans", refresh);
  const onRefresh = useCallback(() => setRefresh((n) => n + 1), []);

  const today = on(0);
  const upcomingTrips = useMemo(() => trips.filter((t) => t.end >= today).sort((a, b) => a.start.localeCompare(b.start)), [trips, today]);
  const [next, ...later] = upcomingTrips;
  const inTrip = (t: Trip) => bookings.filter((b) => b.tripId === t.id).sort(byStart);
  const upcomingIds = new Set(upcomingTrips.map((t) => t.id));
  const other = bookings.filter((b) => !isPast(b) && !(b.tripId && upcomingIds.has(b.tripId))).sort(byStart);
  const past = bookings.filter((b) => isPast(b) && !(b.tripId && upcomingIds.has(b.tripId))).sort((a, b) => b.start.localeCompare(a.start));

  const open = (id: string) => router.push(`/plans/${id}`);
  const toggle = (id: string) => setExpanded((x) => (x.includes(id) ? x.filter((y) => y !== id) : [...x, id]));

  return (
    <Screen back onRefresh={onRefresh}>
      <Page
        eyebrow="Life"
        title="Plans"
        lede="Trips and bookings, put together from your confirmation emails."
        actions={
          <IconButton label="Add a booking" onPress={() => setAdding(true)} style={{ backgroundColor: c.ink }}>
            <Plus size={18} weight="bold" color={c.paper} />
          </IconButton>
        }
      >
        {loading ? (
          <PlansSkeleton />
        ) : (
          <View style={{ gap: 40 }}>
            {next ? (
              <NextTrip trip={next} list={inTrip(next)} onOpen={open} onOpenTrip={() => open(next.id)} />
            ) : (
              <Empty title="No trips coming up" action={<Button onPress={() => setAdding(true)}>Add a booking</Button>}>
                When a flight or hotel confirmation arrives, Orbit puts the trip together here.
              </Empty>
            )}

            <Section title="Other bookings" meta="Not part of a trip" style={{ marginBottom: 0 }}>
              <OtherBookings list={other} onOpen={open} />
            </Section>

            {later.length > 0 && (
              <Section title="Later trips" style={{ marginBottom: 0 }}>
                <View style={{ borderTopWidth: 1, borderTopColor: c.line }}>
                  {later.map((t) => (
                    <LaterTrip key={t.id} trip={t} list={inTrip(t)} open={expanded.includes(t.id)} onToggle={() => toggle(t.id)} onOpen={open} onOpenTrip={() => open(t.id)} />
                  ))}
                </View>
              </Section>
            )}

            {past.length > 0 && (
              <Section title="Past" meta={`${past.length} ${past.length === 1 ? "booking" : "bookings"}`} style={{ marginBottom: 0 }}>
                <PastList list={past} trips={trips} onOpen={open} all={allPast} onToggleAll={() => setAllPast((v) => !v)} />
              </Section>
            )}
          </View>
        )}
      </Page>
      <AddBooking open={adding} onClose={() => setAdding(false)} />
    </Screen>
  );
}
