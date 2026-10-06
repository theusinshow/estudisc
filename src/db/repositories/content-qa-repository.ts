import {qaReviewSchema} from "@/features/content-qa/policy";
import {getDatabase} from "@/db/connection";
import type {ContentDatabase} from "./content-qa/types";
import type {OwnerProfile} from "@/features/auth/owner";
import {ContentReleaseRepository} from "./content-qa/release-repository";
import {ContentBundleResolver} from "./content-qa/bundle-resolver";
import {ContentPublicationService} from "./content-qa/publication-service";
/** Compatibility facade; domain ownership lives in focused release/bundle/publication modules. */
export class ContentQaRepository extends ContentReleaseRepository {
 constructor(db:ContentDatabase=getDatabase()){super(db);}
 publish(id:string,actorId?:string){return new ContentPublicationService(this.db).publish(id,actorId);}
 publishLessonsDirect(actor:OwnerProfile,input:unknown){return new ContentPublicationService(this.db).publishLessonsDirect(actor,input);}
 lessonBundle(id:string,version:number){return new ContentBundleResolver(this.db).lessonBundle(id,version);}
 lessonQueue(){return new ContentBundleResolver(this.db).lessonQueue();}
 lessonDetail(id:string,version:number){return new ContentBundleResolver(this.db).lessonDetail(id,version);}
async reviewLesson(reviewerId:string,stableId:string,version:number,reviews:unknown[],publish:boolean){
    const parsedReviews=reviews.map(review=>qaReviewSchema.parse(review));
    return this.db.transaction(async tx=>{
      const repo=new ContentQaRepository(tx);const {questions}=await repo.lessonBundle(stableId,version);const releases=await repo.list();
      const find=(type:string,id:string,v:number)=>{const row=releases.find(r=>r.targetType===type&&r.stableId===id&&r.version===v);if(!row)throw new Error(`Release not registered: ${type} ${id} v${v}`);return row;};
      const bundle=[...questions.map(q=>find("question",q.id,q.version)),find("lesson",stableId,version)];
      let recorded=0;
      for(const release of bundle){if(release.status!=="draft")continue;for(const review of parsedReviews){await repo.review(reviewerId,release.id,{...review,rationale:`[Revisão da aula ${stableId} v${version}] ${review.rationale}`});recorded+=1;}}
      if(publish)for(const release of bundle)await repo.publish(release.id,reviewerId);
      return {recorded,published:publish,releases:bundle.length};
    });
  }
async reviewLessons(reviewerId:string,targets:ReadonlyArray<{lessonId:string;version:number}>,reviews:unknown[],publish:boolean){
    const results=[];
    for(const target of targets){
      try{const outcome=await this.reviewLesson(reviewerId,target.lessonId,target.version,reviews,publish);results.push({...target,ok:true as const,...outcome});}
      catch(error){results.push({...target,ok:false as const,error:error instanceof Error?error.message:"Falha ao revisar"});}
    }
    return {results};
  }
}
