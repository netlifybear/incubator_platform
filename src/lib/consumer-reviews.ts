import { prisma } from "./prisma.ts";

export async function createConsumerReview(input: {
  vendorId: string;
  cohortId: string;
  rating: number;
  comment: string | null;
  displayName: string | null;
  images?: string[];
}) {
  return prisma.consumerReview.create({ data: { ...input, images: input.images ?? [] } });
}
