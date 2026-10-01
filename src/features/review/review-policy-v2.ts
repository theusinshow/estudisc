export const REVIEW_V2="review.v2";
export const REVIEW_V2_INTERVALS=[1,3,7,14,30] as const;
export function scheduleReviewV2({correct,independent,stage,reviewedAt}:{correct:boolean;independent:boolean;stage:number;reviewedAt:Date}){
  const nextStage=correct&&independent?Math.min(4,Math.max(0,stage)+1):correct?Math.max(0,stage):0;
  const interval=correct?independent?REVIEW_V2_INTERVALS[nextStage]:Math.min(3,REVIEW_V2_INTERVALS[nextStage]):1;
  return {stage:nextStage,stabilityDays:interval,nextReviewAt:new Date(reviewedAt.getTime()+interval*86400000),policyVersion:REVIEW_V2};
}
export function reviewsWithinBudget<T extends {minutes:number;nextReviewAt:Date}>(reviews:readonly T[],minutes:number){let remaining=minutes;return [...reviews].sort((a,b)=>a.nextReviewAt.getTime()-b.nextReviewAt.getTime()).filter(review=>{if(review.minutes>remaining)return false;remaining-=review.minutes;return true;});}
