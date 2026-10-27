import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CATEGORIES: { id: number; name: string; description: string }[] = [
  { id: 1, name: 'Cleaning', description: 'Home and commercial cleaning services' },
  { id: 2, name: 'Cooking', description: 'Home cooking and meal preparation' },
  { id: 3, name: 'Plumbing', description: 'Plumbing installations and repairs' },
  { id: 4, name: 'Electrical', description: 'Electrical wiring and appliance repairs' },
  { id: 5, name: 'Carpentry', description: 'Furniture repairs and carpentry works' },
  { id: 6, name: 'General Help', description: 'General moving and lifting assistance' },
  { id: 7, name: 'Service Staff', description: 'Event and dining service staff' },
  { id: 8, name: 'Nurse', description: 'Home healthcare and nursing care' },
  { id: 9, name: 'Driver', description: 'Personal and professional drivers' },
  { id: 10, name: 'Delivery', description: 'Local courier and delivery tasks' },
  { id: 11, name: 'Gardening', description: 'Lawn and garden care' },
  { id: 12, name: 'Beauty', description: 'Personal grooming and salon services' },
  { id: 13, name: 'AC Service', description: 'AC servicing and repairs' },
  { id: 14, name: 'Appliance Repair', description: 'Home appliances repair' },
  { id: 15, name: 'Welding', description: 'Fabrication and metal welding' },
];

const SKILLS: Record<number, string[]> = {
  1: ['Deep cleaning', 'Kitchen cleaning', 'Bathroom cleaning', 'Window cleaning', 'Regular cleaning'],
  2: ['Meal preparation', 'Kitchen prep', 'Weekly meal prep'],
  3: ['Pipe repair', 'Tap fitting', 'Drain cleaning', 'Leak repair'],
  4: ['Wiring', 'Switchboard repair', 'Fan installation', 'Inverter setup', 'Lighting installation'],
  5: ['Furniture repair', 'Assembly', 'Door repair'],
  6: ['Moving assistance', 'Household tasks', 'Lifting help'],
  7: ['Table service', 'Event setup', 'Serving food'],
  8: ['Bathing assistance', 'Patient hygiene', 'Wound nursing', 'Daily patient care'],
  9: ['Local trip', 'Outstation trip'],
  10: ['Parcel delivery', 'Pickup'],
  11: ['Plant care', 'Pruning', 'Lawn care', 'Garden cleanup'],
  12: ['Waxing', 'Threading', 'Facial', 'Cleanup', 'Massage', 'Manicure', 'Pedicure'],
  13: ['AC cleaning', 'AC repair', 'Refrigerator service'],
  14: ['Washing machine', 'Refrigerator', 'Small appliance'],
  15: ['Fabrication', 'Metal repair'],
};

async function main() {
  console.log('Ensuring spatial compatibility functions...');
  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'geography') THEN
            CREATE TYPE geography AS (
                longitude float8,
                latitude float8,
                srid int
            );
        END IF;
    END $$;

    CREATE OR REPLACE FUNCTION PostGIS_Version() RETURNS text AS $$
    BEGIN
        RETURN '3.4.0 USE_GEOS=1 USE_PROJ=1';
    END;
    $$ LANGUAGE plpgsql IMMUTABLE;

    CREATE OR REPLACE FUNCTION ST_MakePoint(lng float8, lat float8) RETURNS geography AS $$
    BEGIN
        RETURN ROW(lng, lat, 4326)::geography;
    END;
    $$ LANGUAGE plpgsql IMMUTABLE;

    CREATE OR REPLACE FUNCTION ST_SetSRID(geom geography, srid int) RETURNS geography AS $$
    BEGIN
        RETURN ROW(geom.longitude, geom.latitude, srid)::geography;
    END;
    $$ LANGUAGE plpgsql IMMUTABLE;

    CREATE OR REPLACE FUNCTION ST_Distance(g1 geography, g2 geography) RETURNS float8 AS $$
    DECLARE
        lat1 float8 := radians(g1.latitude);
        lat2 float8 := radians(g2.latitude);
        dlat float8 := radians(g2.latitude - g1.latitude);
        dlng float8 := radians(g2.longitude - g1.longitude);
        a float8;
        c float8;
        R float8 := 6371000.0;
    BEGIN
        a := sin(dlat/2.0)^2 + cos(lat1) * cos(lat2) * sin(dlng/2.0)^2;
        c := 2.0 * atan2(sqrt(a), sqrt(1.0 - a));
        RETURN R * c;
    END;
    $$ LANGUAGE plpgsql IMMUTABLE;

    CREATE OR REPLACE FUNCTION ST_DWithin(g1 geography, g2 geography, distance_meters float8) RETURNS boolean AS $$
    BEGIN
        RETURN ST_Distance(g1, g2) <= distance_meters;
    END;
    $$ LANGUAGE plpgsql IMMUTABLE;
  `);

  console.log('Seeding categories...');
  for (const cat of CATEGORIES) {
    await prisma.category.upsert({
      where: { id: cat.id },
      update: { name: cat.name, description: cat.description },
      create: { id: cat.id, name: cat.name, description: cat.description },
    });
  }

  // Update sequence so next autoincrement doesn't conflict
  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('"Category"', 'id'), coalesce(max(id), 1)) FROM "Category";`
  );

  console.log('Seeding skills...');
  for (const [categoryId, names] of Object.entries(SKILLS)) {
    for (const name of names) {
      await prisma.skill.upsert({
        where: { categoryId_name: { categoryId: Number(categoryId), name } },
        update: {},
        create: { categoryId: Number(categoryId), name },
      });
    }
  }

  console.log('Categories and skills successfully seeded!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());