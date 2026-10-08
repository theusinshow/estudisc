import { expect,test } from "@playwright/test";
import { reviewMistakeFixture } from "../fixtures/review-mistake-loop";

test("keeps new AI actions disabled before rollout",async({request})=>{
  test.skip(process.env.FEATURE_AI_LEARNING==="true","Checks flag off.");
  expect((await request.post("/api/ai/learning",{data:{}})).status()).toBe(404);
});
test("recovers from an absent provider while authored learning and independent answers remain available",async({page,request},testInfo)=>{
  test.skip(process.env.FEATURE_AI_LEARNING!=="true","Enable optional AI.");
  test.setTimeout(90000);
  const pack=reviewMistakeFixture();pack.packId+=".ai";pack.track.id+="-ai";
  const lesson=pack.track.modules.find(m=>m.subjectCode==="MAT")!.lessons.find(l=>l.id==="REVIEW-MISTAKE-PILOT")!;
  lesson.id="AI-FALLBACK-PILOT";
  for(const question of pack.questions)if(question.id.startsWith("review-loop-"))question.id+="-ai";
  lesson.exitTicketQuestionIds=lesson.exitTicketQuestionIds.map(id=>`${id}-ai`);
  for(const activity of lesson.activities){activity.id+="-ai";activity.questionId+="-ai";activity.config.questionId=activity.questionId;}
  const imported=await request.post("/api/import/track",{data:pack});expect(imported.ok(),await imported.text()).toBe(true);
  await page.goto("/lessons/AI-FALLBACK-PILOT");await page.getByRole("button",{name:"Ver tudo",exact:true}).click();
  await page.getByText("Explicação opcional deste trecho",{exact:true}).click();
  const intro=page.locator("details").filter({has:page.getByText("Explicação opcional deste trecho",{exact:true})});
  await intro.getByRole("button",{name:"Explicar de outro jeito",exact:true}).press("Enter");await expect(intro.getByRole("alert")).toContainText("IA opcional indisponível");
  const question=page.locator("section.learning-interaction").filter({has:page.getByRole("heading",{name:"Quanto é 2 + 3 nesta fixture?",exact:true})});
  await question.getByText("Tutor opcional",{exact:true}).click();await question.getByRole("button",{name:"Dar uma pista com IA",exact:true}).click();await expect(question.getByRole("alert")).toContainText("dicas e explicações da aula continuam");
  await expect(question.getByRole("textbox")).toBeEnabled();await question.getByRole("textbox").fill("5");await question.getByRole("button",{name:"Enviar resposta",exact:true}).press("Enter");await expect(question.getByRole("status",{name:"Resultado da resposta"})).toContainText("Resposta correta");
  for(const width of [320,360,390,430,1280]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);if(width===320||width===1280)await question.locator("details").filter({has:page.getByText("Tutor opcional",{exact:true})}).screenshot({path:testInfo.outputPath(`ai-fallback-${width}.png`)});}
});
