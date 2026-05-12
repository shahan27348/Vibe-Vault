import mongoose, { Schema, Document, Model } from "mongoose";

export interface IReview extends Document {
  userId: string;
  userName: string;
  userAvatar?: string;
  productId: mongoose.Types.ObjectId;
  rating: number;
  title: string;
  comment: string;
  images: string[];
  helpful: number;
  createdAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    userAvatar: String,
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, required: true },
    comment: { type: String, required: true },
    images: [String],
    helpful: { type: Number, default: 0 },
  },
  { timestamps: true }
);

ReviewSchema.index({ userId: 1, productId: 1 }, { unique: true });

export const Review: Model<IReview> =
  mongoose.models.Review || mongoose.model<IReview>("Review", ReviewSchema);
