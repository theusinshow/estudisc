import {expect,it,vi} from "vitest";
import {render,screen,fireEvent} from "@testing-library/react";
import {ErrorBoundaryHandler,type ErrorInfo} from "next/dist/client/components/error-boundary";
import {AppRouterContext} from "next/dist/shared/lib/app-router-context.shared-runtime";
import ApplicationError from "@/app/error";
it("offers recovery without leaking raw backend/SQL/private details or pretending data loaded",()=>{
 const retry=vi.fn();render(<ApplicationError error={new Error("private SQL params and provider quota diagnostics")} retry={retry}/>);
 expect(screen.getByRole("alert")).toHaveTextContent("indisponíveis no momento");expect(screen.queryByText(/private SQL/)).toBeNull();fireEvent.click(screen.getByRole("button",{name:"Tentar novamente"}));expect(retry).toHaveBeenCalledOnce();expect(screen.getByRole("link",{name:"Voltar para Hoje"})).toHaveAttribute("href","/");
});
it("uses the installed Next retry to refresh and recover the failed segment",async()=>{
 let unavailable=true;const refresh=vi.fn(()=>{unavailable=false;});const consoleError=vi.spyOn(console,"error").mockImplementation(()=>{});
 function Source(){if(unavailable)throw new Error("Private provider failure");return <p>Dados recuperados</p>;}
 function Fallback({retry}:ErrorInfo){return <ApplicationError error={new Error("Private provider failure")} retry={retry}/>;}
 try{render(<AppRouterContext.Provider value={{refresh} as never}><ErrorBoundaryHandler pathname="/lessons/test" errorComponent={Fallback}><Source/></ErrorBoundaryHandler></AppRouterContext.Provider>);fireEvent.click(screen.getByRole("button",{name:"Tentar novamente"}));expect(refresh).toHaveBeenCalledOnce();expect(await screen.findByText("Dados recuperados")).toBeVisible();}finally{consoleError.mockRestore();}
});
