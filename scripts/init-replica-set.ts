// Initialize MongoDB replica set for standalone development
import { MongoClient } from "mongodb";

async function main() {
  const uri = "mongodb://127.0.0.1:27017/?directConnection=true";
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const admin = client.db("admin");

    try {
      const result = await admin.command({ replSetInitiate: {
        _id: "rs0",
        members: [{ _id: 0, host: "127.0.0.1:27017" }]
      }});
      console.log("✅ Replica set initialized:", JSON.stringify(result, null, 2));
    } catch (err: any) {
      if (err.message?.includes("already initialized")) {
        console.log("ℹ️ Replica set already initialized");
      } else {
        throw err;
      }
    }

    console.log("\n✅ MongoDB is ready for Prisma transactions!");
  } catch (err) {
    console.error("❌ Failed to initialize replica set:", err);
    process.exit(1);
  } finally {
    await client.close();
  }
}

main();