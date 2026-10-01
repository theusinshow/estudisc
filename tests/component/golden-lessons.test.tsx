import { render,screen,cleanup } from "@testing-library/react";
import { expect,it } from "vitest";
import source from "../../packs/seeds/ifsc-2027.golden.track.v2.json";
import { validateTrackPack } from "@/features/import/api";
import { LessonBlockList } from "@/features/lessons/blocks";
it("validates and renders all four Golden Lessons through the canonical registry",()=>{
  expect(validateTrackPack(source).ok).toBe(true);
  for(const id of ["MAT-07","POR-01","CIE-06","GH-06"]){
    const lesson=source.track.modules.flatMap(moduleDefinition=>moduleDefinition.lessons).find(lesson=>lesson.id===id)!;
    render(<LessonBlockList blocks={lesson.blocks.map(block=>({stableId:block.id,type:block.type,payload:{...block.payload,...block}}))}/>);
    expect(screen.queryByText(/conteúdo incompatível|bloco indisponível/i)).not.toBeInTheDocument();
    if(id==="CIE-06")expect(screen.getByRole("heading",{name:"Monte um átomo"})).toBeInTheDocument();
    cleanup();
  }
});
