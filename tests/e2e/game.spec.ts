import { test, expect } from "@playwright/test";
import { startGame } from "../../src/lib/game/engine";
import { SAVE_VERSION } from "../../src/lib/game/types";
test("seven semesters through dossier and ending, then resume and erase", async({page},info)=>{
 test.setTimeout(120000);
 const errors:string[]=[];page.on("pageerror",e=>errors.push(e.message));
 await page.goto("/");await expect(page.getByText(/不能用於真實升學決策/)).toBeVisible();
 await page.getByRole("button",{name:"建立角色",exact:true}).click();
 await page.getByPlaceholder("虛構暱稱").fill("測試旅人");
 await page.getByRole("button",{name:"進入大一上"}).click();
 for(let term=0;term<7;term++) {
   for(const action of [/衝 GPA/, /做專題/, /休息/]) {
     let button=page.getByRole("button",{name:action});
     if(await button.isDisabled())button=page.getByRole("button",{name:/休息/});
     await button.click();await expect(page.getByRole("dialog")).toBeVisible();
     await page.keyboard.press("Tab");await expect(page.getByRole("button",{name:"繼續",exact:true})).toBeFocused();
     await page.keyboard.press("Enter");await expect(page.getByRole("dialog")).toHaveCount(0);
   }
   await expect(page.getByRole("heading",{level:1})).toContainText("結束");
   await page.getByRole("button",{name:term===6 ? "組裝書審" : /大[一二三四][上下]/}).click();
 }
 await page.getByRole("button",{name:"送出書審"}).click();
 for(let i=0;i<3;i++) {
   if(await page.getByText("面試 · 估算",{exact:true}).isVisible()) await page.getByTestId('interview-option').last().click();
 }
 await expect(page.getByRole("heading",{name:"委員會只看證據"})).toBeVisible();
 await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:info.outputPath("ending.png"),fullPage:true});
 await page.reload();await expect(page.getByRole("heading",{name:"委員會只看證據"})).toBeVisible();
 await page.getByRole("button",{name:"回到標題"}).click();
 await page.getByRole("button",{name:"繼續上次"}).click();await expect(page.getByRole("heading",{name:"委員會只看證據"})).toBeVisible();
 await page.getByRole("button",{name:"回到標題"}).click();
 await page.getByRole("button",{name:"清除所有遊戲存檔"}).click();
 await expect.poll(()=>page.evaluate(()=>localStorage.getItem("tuijian-rpg-v1"))).toBeNull();
 expect(errors).toEqual([]);
});
test("migrated dossier, all interview questions and returning from title remain usable",async({page})=>{
 const data={...startGame({name:"虛構角色",major:"cs",archetype:"scholar"},[],{seed:42,startedAt:123}),version:3,screen:"dossier",phase:6,actionsLeft:0,dossier:["transcript"],stats:{gpa:4.3,english:100,coding:100,research:100,project:100,papers:8,certs:10,network:100,stress:0,stamina:100}};
 await page.addInitScript(({data,version})=>localStorage.setItem("tuijian-rpg-v1",JSON.stringify({state:{data},version})),{data,version:3});
 await page.goto("/");await page.getByRole("button",{name:"送出書審"}).click();
 await expect(page.getByText("面試 · 估算",{exact:true})).toBeVisible();
 await page.getByRole("button",{name:"推甄養成",exact:true}).click();
 await page.getByRole("button",{name:"繼續上次"}).click();await expect(page.getByText("面試 · 估算",{exact:true})).toBeVisible();
 for(let i=0;i<3;i++)await page.getByTestId('interview-option').last().click();
 await expect(page.getByRole("heading",{name:"委員會只看證據"})).toBeVisible();
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem("tuijian-rpg-v1")!).version)).toBe(SAVE_VERSION);
});
test("corrupt storage resets safely and blocked storage keeps play available",async({page})=>{
 const errors:string[]=[];page.on("pageerror",e=>errors.push(e.message));
 await page.addInitScript(()=>{localStorage.setItem("tuijian-rpg-v1","{broken");Object.defineProperty(Storage.prototype,"setItem",{value(){throw new DOMException("quota","QuotaExceededError");}});});
 await page.goto("/");await page.getByRole("button",{name:"建立角色",exact:true}).click();
 await page.getByPlaceholder("虛構暱稱").fill("短期旅人");await page.getByRole("button",{name:"進入大一上"}).click();
 await page.getByRole("button",{name:/休息/}).click();await expect(page.getByRole("dialog")).toBeVisible();
 await page.getByRole("button",{name:"繼續",exact:true}).click();
 await expect(page.getByRole("status").filter({hasText:"瀏覽器無法儲存"})).toBeVisible();expect(errors).toEqual([]);
});
