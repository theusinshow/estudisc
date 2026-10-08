import {expect,it} from "vitest";
import {render,screen,fireEvent} from "@testing-library/react";
import {AuthoringMetadataView} from "@/features/content-qa/authoring-metadata-view";
it("searches declared metadata and retains unknown/protected reuse exclusion",()=>{
 render(<AuthoringMetadataView metadata={{kind:"assets",images:[{id:"private-image",title:"Diagrama de células",type:"diagram",subjectCodes:["CIE"],conceptIds:["cell"],tags:[],altText:"Descrição textual",licenseStatus:"UNKNOWN",verifiedAt:null,exposure:"protected",reusable:false,interactiveReady:false,reasons:["Direitos não verificados"],attribution:"Autor"}],videos:0,books:0,caveats:["Não é aprovação independente"]}}/>);
 expect(screen.getByText(/Reutilização: indisponível/)).toBeVisible();fireEvent.change(screen.getByRole("searchbox",{name:"Buscar assets"}),{target:{value:"celulas"}});expect(screen.getByRole("heading",{name:"Diagrama de células"})).toBeVisible();fireEvent.click(screen.getByRole("checkbox",{name:"Somente reutilização elegível"}));expect(screen.getByText("Nenhum asset encontrado com estes filtros.")).toBeVisible();expect(screen.queryByRole("img")).toBeNull();
});
it("shows missing original goals and unconfirmed source hashes without claiming blueprint approval",()=>{
 render(<AuthoringMetadataView metadata={{kind:"blueprint",title:"Proposta",reviewState:"UNREVIEWED",confidence:0.5,sourceMatches:false,learningGoal:null,blocks:["text"],caveats:["Fonte incompleta"],reviewReasons:["Objetivo ausente"]}}/>);
 expect(screen.getByText(/Vínculo.*não confirmado/)).toBeVisible();expect(screen.getByText(/Objetivo original ausente/)).toBeVisible();expect(screen.getByText(/UNREVIEWED/)).toBeVisible();
});
