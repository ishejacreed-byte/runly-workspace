import React from "react";
import { Star } from "lucide-react";

const ReviewCard = ({ review }) => {
  return (
    <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
      <div className="flex items-center gap-1 text-yellow-500 mb-1">
        <Star size={14} fill="currentColor" strokeWidth={0} />
        <span className="font-bold text-sm">{review.rating}</span>
      </div>

      <p className="text-sm text-foreground">{review.comment}</p>

      <p className="text-[10px] text-muted-foreground mt-2">
        {new Date(review.created_at).toLocaleDateString()}
      </p>
    </div>
  );
};

export default ReviewCard;