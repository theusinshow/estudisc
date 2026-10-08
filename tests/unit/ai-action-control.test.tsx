import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { AiActionControl } from "@/features/ai/action-control";
const spec={action:"give_hint" as const,target:{kind:"question" as const,activityId:"a",questionId:"q",questionVersion:1}};
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
it("renders escaped generated text and preserves a recoverable invalid-output error",async()=>{
  const fetch=vi.fn().mockResolvedValueOnce(Response.json({text:"<script>unsafe()</script>",example:"Exemplo fornecido.",source:"ai",cached:false,assisted:true})).mockResolvedValueOnce(Response.json({text:"Claims",source:"ai",cached:false,assisted:true,mastery:5}));
  vi.stubGlobal("fetch",fetch);render(<AiActionControl label="Dar uma pista" spec={spec}/>);
  fireEvent.click(screen.getByRole("button",{name:"Dar uma pista"}));
  expect(await screen.findByText("<script>unsafe()</script>")).toBeInTheDocument();expect(document.querySelector("script")).toBeNull();
  expect(screen.getByText("Exemplo fornecido.")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button",{name:"Dar uma pista"}));expect(await screen.findByRole("alert")).toBeInTheDocument();expect(screen.getByRole("button",{name:"Dar uma pista"})).toBeEnabled();
});
it("cancels pending work and prevents an old Question response from replacing a new target",async()=>{
  let firstResolve!: (response:Response)=>void;
  const fetch=vi.fn().mockImplementationOnce(()=>new Promise<Response>(resolve=>{firstResolve=resolve;})).mockResolvedValueOnce(Response.json({text:"Novo contexto.",source:"ai",cached:false,assisted:true}));
  vi.stubGlobal("fetch",fetch);
  const view=render(<AiActionControl label="Dar uma pista" spec={spec}/>);fireEvent.click(screen.getByRole("button",{name:"Dar uma pista"}));
  await waitFor(()=>expect(fetch).toHaveBeenCalledTimes(1));
  const firstSignal=fetch.mock.calls[0][1].signal as AbortSignal;
  view.rerender(<AiActionControl label="Dar uma pista" spec={{...spec,target:{...spec.target,questionVersion:2}}}/>);expect(firstSignal.aborted).toBe(true);
  fireEvent.click(screen.getByRole("button",{name:"Dar uma pista"}));expect(await screen.findByText("Novo contexto.")).toBeInTheDocument();
  await act(async()=>{firstResolve(Response.json({text:"Contexto antigo.",source:"ai",cached:false,assisted:true}));});
  await waitFor(()=>expect(screen.queryByText("Contexto antigo.")).not.toBeInTheDocument());
  expect(JSON.parse(fetch.mock.calls[0][1].body).requestId).not.toBe(JSON.parse(fetch.mock.calls[1][1].body).requestId);
});
