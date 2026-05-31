export type AdminHealthMessageInput = {
  firsthandReviews: number;
  openRequests: number;
  totalReviews: number;
};

export function adminHealthMessage(input: AdminHealthMessageInput) {
  if (input.openRequests > 0) {
    return `${input.openRequests} open request${input.openRequests === 1 ? "" : "s"} need admin attention.`;
  }

  if (input.totalReviews > 0 && input.firsthandReviews / input.totalReviews >= 0.5) {
    return "Most reviews are firsthand founder experience.";
  }

  return "No open requests. Next, encourage founders to add firsthand reviews.";
}
