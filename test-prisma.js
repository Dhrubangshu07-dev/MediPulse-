const prisma = require('./lib/prisma');

async function test() {
  try {
    const doctors = await prisma.doctorProfile.findMany({
      include: { user: true },
      orderBy: { rating: "desc" },
    });
    console.log("Success:", doctors.length);
  } catch (err) {
    console.error("Prisma error name:", err.name);
    console.error("Prisma error message:", err.message);
    console.error("Prisma error code:", err.code);
    console.error("Full error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

test();
