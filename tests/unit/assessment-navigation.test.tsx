import { act,cleanup,fireEvent,render,screen,waitFor } from "@testing-library/react";
import { afterEach,expect,it,vi } from "vitest";
import { AssessmentPanel } from "@/features/assessments/assessment-panel";
import { studentQuestion } from "@/features/questions/student-view";
import { questionSchema } from "@/features/questions/contracts";
import source from "../../packs/seeds/ifsc-2027.golden.track.v2.json";
import type { AssessmentView } from "@/features/assessments/api";
vi.mock("next/navigation",()=>({useRouter:()=>({refresh:vi.fn()})}));
const serverNow=Date.parse("2026-10-08T12:00:00Z");
function fixture():AssessmentView{const question=studentQuestion(questionSchema.parse(source.questions.find(q=>q.type==="numeric")));return{serverNow,id:crypto.randomUUID(),status:"ACTIVE",mode:"EXAM",kind:"FULL_SIMULATION",startedAt:new Date(serverNow).toISOString(),deadlineAt:new Date(serverNow+60_000).toISOString(),questions:[{versionId:crypto.randomUUID(),question},{versionId:crypto.randomUUID(),question:{...question,id:"another"}}],responses:[],result:null};}
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.unstubAllGlobals();vi.useRealTimers();});
it("displays the server deadline using monotonic elapsed time despite a skewed client clock",async()=>{
  vi.useFakeTimers();let elapsed=5000;vi.spyOn(performance,"now").mockImplementation(()=>elapsed);vi.spyOn(Date,"now").mockReturnValue(serverNow+30*86400000);
  render(<AssessmentPanel view={fixture()} serverNow={serverNow} enhanced/>);elapsed+=1000;await act(async()=>{await vi.advanceTimersByTimeAsync(1000);});
  expect(screen.getByRole("timer")).toHaveTextContent("0:00:59");expect(screen.queryByText(/Tempo encerrado/)).not.toBeInTheDocument();
});
it("keeps unsent responses across navigation and blocks finalization after a failed save until retry",async()=>{
  const fetch=vi.fn().mockResolvedValueOnce(Response.json({code:"failure"},{status:503})).mockResolvedValueOnce(Response.json({saved:true}));vi.stubGlobal("fetch",fetch);
  render(<AssessmentPanel view={fixture()} serverNow={serverNow} enhanced/>);
  fireEvent.change(screen.getAllByRole("textbox")[0],{target:{value:"15"}});fireEvent.click(screen.getByRole("button",{name:"Próxima questão"}));fireEvent.click(screen.getByRole("button",{name:"Questão anterior"}));expect(screen.getAllByRole("textbox")[0]).toHaveValue("15");
  fireEvent.click(screen.getByRole("button",{name:"Salvar resposta"}));await screen.findByText(/Resposta ainda não salva/);fireEvent.click(screen.getByRole("button",{name:"Conferir simulado"}));expect(screen.getByRole("button",{name:"Finalizar simulado"})).toBeDisabled();
  fireEvent.click(screen.getByRole("button",{name:"Ver questão 1"}));fireEvent.click(screen.getByRole("button",{name:"Salvar resposta"}));await waitFor(()=>expect(screen.getAllByText("Resposta salva").length).toBeGreaterThan(0));fireEvent.click(screen.getByRole("button",{name:"Conferir simulado"}));expect(screen.getByRole("button",{name:"Finalizar simulado"})).toBeEnabled();
});
