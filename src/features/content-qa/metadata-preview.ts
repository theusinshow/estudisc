import { lessonBlueprintSchema } from "../../../tools/estudisc-content-studio/blueprint-contracts";
import { mediaPackSchema } from "../../../tools/estudisc-content-studio/contracts";
import { teachingAssetReadiness } from "@/features/assets/teaching-asset-policy";
import type { AuthoringContext } from "./authoring-contracts";
export function previewAuthoringMetadata(kind:"blueprint"|"assets",input:unknown,context?:AuthoringContext|null){
  if(kind==="blueprint"){
    const blueprint=lessonBlueprintSchema.parse(input);
    return{kind,title:blueprint.summary.title,reviewState:blueprint.reviewState,confidence:blueprint.confidence,sourceMatches:Boolean(context&&blueprint.identity.lessonId===context.lesson.id&&blueprint.identity.lessonVersion===context.lesson.version&&blueprint.sourceHash===context.target.baseHash),learningGoal:blueprint.learningGoal,blocks:blueprint.recommendedBlocks,caveats:blueprint.summary.caveats,reviewReasons:blueprint.reviewReasons};
  }
  const media=mediaPackSchema.parse(input);
  return{kind,images:media.images.map(candidate=>{const ready=teachingAssetReadiness(candidate);return{id:candidate.id,title:candidate.title,type:candidate.teachingAsset?.type??"image",subjectCodes:candidate.teachingAsset?.subjectCodes??[],conceptIds:candidate.teachingAsset?.conceptIds??[],tags:candidate.teachingAsset?.tags??[],altText:candidate.altTextDraft,licenseStatus:candidate.licenseStatus,verifiedAt:candidate.verifiedAt??null,exposure:candidate.teachingAsset?.exposure??"unknown",reusable:ready.reusable,interactiveReady:ready.interactiveReady,reasons:ready.reasons,attribution:candidate.attribution};}),videos:media.videos.length,books:media.books.length,caveats:["Os dados de licença/verificação são declarações do arquivo de origem; este painel não cria uma aprovação.","Assets protegidos não entram na reutilização pública."]};
}
