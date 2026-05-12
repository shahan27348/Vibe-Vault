import mongoose from "mongoose";
import { seedProducts } from "./src/lib/seed-data";

const MONGODB_URI = "mongodb://localhost:27017/e-commerce";

const ProductSchema = new mongoose.Schema({
  name: String,
  slug: { type: String, unique: true },
  description: String,
  price: Number,
  compareAtPrice: Number,
  images: [String],
  category: String,
  subcategory: String,
  sizes: [String],
  colors: [{ name: String, hex: String }],
  stock: Number,
  featured: Boolean,
  tags: [String],
  rating: Number,
  reviewCount: Number,
  tryOnEnabled: Boolean,
}, { timestamps: true });

async function seed() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("Connected!");

  const Product = mongoose.models.Product || mongoose.model("Product", ProductSchema);

  const existing = await Product.countDocuments();
  if (existing > 0) {
    console.log(`Already has ${existing} products. Dropping and re-seeding...`);
    await Product.deleteMany({});
  }

  console.log(`Inserting ${seedProducts.length} products...`);
  await Product.insertMany(seedProducts);
  console.log(`✅ Done! ${seedProducts.length} products inserted into e-commerce db.`);

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err.message);
  process.exit(1);
});
