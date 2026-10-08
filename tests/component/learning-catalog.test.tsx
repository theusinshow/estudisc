import {expect,it} from "vitest";
import {render,screen,fireEvent} from "@testing-library/react";
import {LearningCatalog} from "@/features/tracks/learning-catalog";
it("searches source-backed titles without accents, filters actual areas and recovers empty results",()=>{
 render(<LearningCatalog tracks={[{stableId:"actual-track",title:"Preparação",description:null,modules:[{stableId:"mat",title:"Matemática",lessons:[{stableId:"fraction",title:"Frações e proporções",activityCount:3}]},{stableId:"science",title:"Ciências",lessons:[{stableId:"cells",title:"Células",activityCount:2}]}]}]}/>);
 expect(screen.getByRole("status")).toHaveTextContent("2 aulas");fireEvent.change(screen.getByRole("searchbox",{name:"Buscar aulas"}),{target:{value:"fracoes"}});expect(screen.getByRole("link",{name:/Frações/})).toHaveAttribute("href","/lessons/fraction");expect(screen.queryByRole("link",{name:/Células/})).toBeNull();
 fireEvent.change(screen.getByRole("combobox",{name:"Área"}),{target:{value:"Ciências"}});expect(screen.getByRole("heading",{name:"Nenhuma aula encontrada"})).toBeVisible();fireEvent.click(screen.getByRole("button",{name:"Limpar filtros"}));expect(screen.getByRole("status")).toHaveTextContent("2 aulas");fireEvent.change(screen.getByRole("combobox",{name:"Área"}),{target:{value:"Ciências"}});expect(screen.getByRole("status")).toHaveTextContent("1 aula encontrada");expect(screen.queryByRole("link",{name:/Frações/})).toBeNull();
});
