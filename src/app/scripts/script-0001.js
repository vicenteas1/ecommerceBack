import mongoose from "mongoose";
import "dotenv/config.js";

const MONGO_URI = process.env.MDBURI ;

try {
  await mongoose.connect(MONGO_URI, { dbName: "test" });
  const db = mongoose.connection.db;
  console.log("Conectado a MongoDB");
  console.log("DB actual:", db.databaseName);

  const colls = await db.listCollections().toArray();
  console.log("Colecciones:", colls.map(c => c.name));

  const products = db.collection("products");

  const missingType = await products.countDocuments({ type: { $exists: false } });
  const missingCat  = await products.countDocuments({ category: { $exists: false } });
  console.log("Docs sin type ($exists:false):", missingType);
  console.log("Docs sin category ($exists:false):", missingCat);

  const res1 = await products.updateMany(
    { $or: [{ type: { $exists: false } }, { type: null }, { type: "" }] },
    { $set: { type: "producto" } }
  );
  const res2 = await products.updateMany(
    { $or: [{ category: { $exists: false } }, { category: null }, { category: "" }] },
    { $set: { category: "servicio" } }
  );

  console.log(`type → matched: ${res1.matchedCount}, modified: ${res1.modifiedCount}`);
  console.log(`category → matched: ${res2.matchedCount}, modified: ${res2.modifiedCount}`);

  const sample = await products
    .find({}, { projection: { nombre: 1, type: 1, category: 1 } })
    .limit(3)
    .toArray();
  console.log("Muestra post-update:", sample);
} catch (e) {
  console.error("Error:", e);
} finally {
  await mongoose.disconnect();
  console.log("Conexión cerrada");
}
