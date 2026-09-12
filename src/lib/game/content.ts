import type {
  ActionId,
  AdvisorTrack,
  ArchetypeId,
  EvidenceId,
  InternTrack,
  InterviewQuestion,
  MajorId,
  ProjectTrack,
  Stats,
} from "./types";

export const ACTIONS_PER_SEMESTER = 3;
export const LAST_PLAY_PHASE = 6;
export const RESULT_PHASE = 7;
export const MAX_HISTORY = 8;

export const PHASES = [
  { id: 0, year: 1, term: "上", label: "大一上", blurb: "還在搞懂系館怎麼走。" },
  { id: 1, year: 1, term: "下", label: "大一下", blurb: "第一次被問「以後要幹嘛」。" },
  { id: 2, year: 2, term: "上", label: "大二上", blurb: "核心課開始咬人。" },
  { id: 3, year: 2, term: "下", label: "大二下", blurb: "實習與專題的分岔口。" },
  { id: 4, year: 3, term: "上", label: "大三上", blurb: "實驗室的門看起來比較近。" },
  { id: 5, year: 3, term: "下", label: "大三下", blurb: "書審材料開始在腦中排版。" },
  { id: 6, year: 4, term: "上", label: "大四上", blurb: "推甄前最後一輪養成。" },
  { id: 7, year: 4, term: "推甄", label: "推甄季", blurb: "委員會只看你留下的證據。" },
] as const;

export const MAJORS: Record<
  MajorId,
  { name: string; blurb: string; mods: Partial<Stats> }
> = {
  cs: {
    name: "資訊工程",
    blurb: "程式與研究起點較高，英文要自己補。",
    mods: { coding: 8, research: 4, english: -4 },
  },
  im: {
    name: "資訊管理",
    blurb: "英文與人脈較有感，硬底子要練。",
    mods: { english: 6, network: 6, coding: -2, project: 2 },
  },
  ee: {
    name: "電機工程",
    blurb: "成績較穩，社交起步慢。",
    mods: { gpa: 0.08, coding: 4, network: -6, research: 2 },
  },
  math: {
    name: "應用數學",
    blurb: "成績與研究思維佳，專題實作需補。",
    mods: { gpa: 0.1, research: 6, coding: -4, project: -4 },
  },
};

export const ARCHETYPES: Record<
  ArchetypeId,
  { name: string; blurb: string; stats: Stats }
> = {
  scholar: {
    name: "高中學霸",
    blurb: "把書唸完的人。GPA 起點高，實作普通。",
    stats: {
      gpa: 3.68,
      english: 48,
      coding: 16,
      research: 12,
      project: 10,
      papers: 0,
      certs: 0,
      network: 14,
      stress: 28,
      stamina: 100,
    },
  },
  hacker: {
    name: "自學工程",
    blurb: "GitHub 比成績單先有內容。",
    stats: {
      gpa: 3.22,
      english: 34,
      coding: 44,
      research: 10,
      project: 24,
      papers: 0,
      certs: 1,
      network: 16,
      stress: 32,
      stamina: 100,
    },
  },
  social: {
    name: "社團人脈",
    blurb: "認識很多學長姐，成績要自己顧。",
    stats: {
      gpa: 3.18,
      english: 44,
      coding: 14,
      research: 8,
      project: 14,
      papers: 0,
      certs: 0,
      network: 46,
      stress: 20,
      stamina: 100,
    },
  },
  balanced: {
    name: "均衡發展",
    blurb: "沒有短板，也還沒有武器。",
    stats: {
      gpa: 3.4,
      english: 40,
      coding: 24,
      research: 12,
      project: 16,
      papers: 0,
      certs: 0,
      network: 24,
      stress: 22,
      stamina: 100,
    },
  },
};

export interface ActionMeta {
  id: ActionId;
  name: string;
  blurb: string;
  hint: string;
  staminaCost: number;
  stressHint: "low" | "mid" | "high";
  tags: string[];
}

export const ACTIONS: ActionMeta[] = [
  {
    id: "gpa",
    name: "衝 GPA",
    blurb: "把成績單修到能看。最笨，也最有效。",
    hint: "GPA↑ 壓力↑",
    staminaCost: 22,
    stressHint: "mid",
    tags: ["成績"],
  },
  {
    id: "project",
    name: "做專題",
    blurb: "把一個題目做到能 demo。方向會逐漸定型。",
    hint: "專題↑ 研究↑",
    staminaCost: 28,
    stressHint: "mid",
    tags: ["作品"],
  },
  {
    id: "submit",
    name: "投稿",
    blurb: "把結果寫成論文。可能被退。",
    hint: "研究↑ 論文？",
    staminaCost: 32,
    stressHint: "high",
    tags: ["論文"],
  },
  {
    id: "english",
    name: "準備英文",
    blurb: "單字、聽力、模擬考。慢，但會累積。",
    hint: "英文↑",
    staminaCost: 20,
    stressHint: "mid",
    tags: ["英文"],
  },
  {
    id: "cert",
    name: "考證照",
    blurb: "把能力寫成證書。不一定過。",
    hint: "證照？ 技能↑",
    staminaCost: 24,
    stressHint: "high",
    tags: ["證書"],
  },
  {
    id: "hackathon",
    name: "參加黑客松",
    blurb: "三十六小時，換作品與人脈。",
    hint: "程式↑ 人脈↑ GPA↓",
    staminaCost: 38,
    stressHint: "mid",
    tags: ["實作"],
  },
  {
    id: "advisor",
    name: "找教授",
    blurb: "去 office hour。門可能不開。收了你之後路線會定下來。",
    hint: "人脈↑ 研究↑",
    staminaCost: 16,
    stressHint: "low",
    tags: ["實驗室"],
  },
  {
    id: "intern",
    name: "實習",
    blurb: "用一個學期換業界證據。大二下後開放。",
    hint: "程式↑ 人脈↑ GPA↓",
    staminaCost: 36,
    stressHint: "high",
    tags: ["實務"],
  },
  {
    id: "rest",
    name: "休息",
    blurb: "睡覺、回家、把壓力放下來。",
    hint: "體力↑ 壓力↓",
    staminaCost: 0,
    stressHint: "low",
    tags: ["恢復"],
  },
];

export const ACTION_MAP: Record<ActionId, ActionMeta> = Object.fromEntries(
  ACTIONS.map((a) => [a.id, a]),
) as Record<ActionId, ActionMeta>;

export const STAT_LABEL: Record<keyof Stats, string> = {
  gpa: "GPA",
  english: "英文",
  coding: "程式",
  research: "研究",
  project: "專題",
  papers: "論文",
  certs: "證照",
  network: "人脈",
  stress: "壓力",
  stamina: "體力",
};

export interface SchoolDef {
  id: string;
  name: string;
  short: string;
  track: string;
  blurb: string;
  gpaFloor: number;
  weights: {
    gpa: number;
    english: number;
    coding: number;
    research: number;
    project: number;
    papers: number;
    certs: number;
    network: number;
    intern: number;
    advisor: number;
  };
}

export const SCHOOLS: SchoolDef[] = [
  {
    id: "ntu-cs",
    name: "國立臺灣大學 資訊工程",
    short: "臺大資工",
    track: "學術",
    blurb: "成績與論文權重極高。",
    gpaFloor: 3.78,
    weights: {
      gpa: 0.34,
      papers: 0.2,
      research: 0.16,
      project: 0.08,
      english: 0.08,
      coding: 0.06,
      network: 0.03,
      certs: 0.01,
      intern: 0.02,
      advisor: 0.08,
    },
  },
  {
    id: "ntu-im",
    name: "國立臺灣大學 資訊管理",
    short: "臺大資管",
    track: "管理",
    blurb: "GPA、英文與專題並重。",
    gpaFloor: 3.7,
    weights: {
      gpa: 0.3,
      english: 0.16,
      project: 0.14,
      papers: 0.1,
      research: 0.08,
      network: 0.08,
      coding: 0.06,
      intern: 0.05,
      certs: 0.02,
      advisor: 0.05,
    },
  },
  {
    id: "nthu-cs",
    name: "國立清華大學 資訊工程",
    short: "清大資工",
    track: "學術",
    blurb: "研究潛力與成績都要看。",
    gpaFloor: 3.68,
    weights: {
      gpa: 0.3,
      research: 0.18,
      papers: 0.16,
      project: 0.1,
      coding: 0.08,
      english: 0.07,
      network: 0.04,
      intern: 0.03,
      certs: 0.01,
      advisor: 0.07,
    },
  },
  {
    id: "nycu-cs",
    name: "國立陽明交通大學 資訊工程",
    short: "陽明交大資工",
    track: "學術",
    blurb: "硬底子與研究並排。",
    gpaFloor: 3.62,
    weights: {
      gpa: 0.28,
      coding: 0.14,
      research: 0.14,
      papers: 0.14,
      project: 0.1,
      english: 0.07,
      intern: 0.05,
      network: 0.03,
      certs: 0.02,
      advisor: 0.06,
    },
  },
  {
    id: "ncku-cs",
    name: "國立成功大學 資訊工程",
    short: "成大資工",
    track: "均衡",
    blurb: "成績、專題、實習都能加分。",
    gpaFloor: 3.45,
    weights: {
      gpa: 0.26,
      project: 0.14,
      research: 0.12,
      coding: 0.12,
      papers: 0.1,
      intern: 0.08,
      english: 0.07,
      network: 0.05,
      certs: 0.03,
      advisor: 0.05,
    },
  },
  {
    id: "nccu-im",
    name: "國立政治大學 資訊管理",
    short: "政大資管",
    track: "管理",
    blurb: "英文、書審敘事與人脈較有感。",
    gpaFloor: 3.42,
    weights: {
      gpa: 0.26,
      english: 0.18,
      network: 0.12,
      project: 0.12,
      intern: 0.08,
      research: 0.07,
      papers: 0.06,
      coding: 0.05,
      certs: 0.03,
      advisor: 0.04,
    },
  },
  {
    id: "ntust-cs",
    name: "國立臺灣科技大學 資訊工程",
    short: "臺科大資工",
    track: "實務",
    blurb: "作品、實習、證照很加分。",
    gpaFloor: 3.2,
    weights: {
      gpa: 0.18,
      coding: 0.18,
      project: 0.16,
      intern: 0.18,
      certs: 0.1,
      network: 0.07,
      english: 0.06,
      research: 0.05,
      papers: 0.04,
      advisor: 0.03,
    },
  },
  {
    id: "nsysu-cs",
    name: "國立中山大學 資訊工程",
    short: "中山資工",
    track: "均衡",
    blurb: "成績穩、有專題就能談。",
    gpaFloor: 3.28,
    weights: {
      gpa: 0.24,
      project: 0.14,
      coding: 0.14,
      research: 0.1,
      intern: 0.09,
      english: 0.08,
      papers: 0.07,
      network: 0.06,
      certs: 0.04,
      advisor: 0.04,
    },
  },
];

export const ACHIEVEMENTS = [
  { id: "first-term", name: "開學了", blurb: "完成第一個學期。" },
  { id: "advisor", name: "實驗室的人", blurb: "找到願意帶你的教授。" },
  { id: "paper", name: "白紙黑字", blurb: "第一篇論文被接受。" },
  { id: "intern", name: "出過社會", blurb: "完成一段實習。" },
  { id: "certs3", name: "證書夾", blurb: "累積三張證照。" },
  { id: "eng80", name: "英文不再是藉口", blurb: "英文能力達到 80。" },
  { id: "gpa39", name: "成績單能看", blurb: "GPA 來到 3.90。" },
  { id: "code70", name: "能寫也能交", blurb: "程式能力達到 70。" },
  { id: "burnout", name: "沒倒下", blurb: "過勞過，但把四年走完。" },
  { id: "top", name: "台清交的門縫", blurb: "任一頂尖校所估在強烈建議。" },
  { id: "rest8", name: "會睡覺的人", blurb: "休息滿八次。" },
  { id: "hack3", name: "會場常客", blurb: "黑客松三次以上。" },
  { id: "balanced", name: "沒有明顯破口", blurb: "主要能力都到 50。" },
  { id: "finish", name: "四年一戰", blurb: "走到推甄季。" },
  { id: "dossier", name: "書審有主見", blurb: "自己組過一份書審。" },
  { id: "interview", name: "口試沒崩", blurb: "面試加分是正的。" },
  { id: "roommate-win", name: "這輪贏過室友", blurb: "推甄適配高過室友。" },
] as const;

export const VERDICT_LABEL: Record<string, string> = {
  likely: "強烈建議",
  possible: "有機會",
  risk: "危險區",
  low: "機會偏低",
};

export const ADVISOR_TRACK: Record<
  Exclude<AdvisorTrack, "none">,
  { badge: string; blurb: string }
> = {
  academic: { badge: "學術實驗室", blurb: "論文與研究權重較高的所比較吃這條。" },
  builder: { badge: "工程實驗室", blurb: "作品、程式、實務取向的所比較吃這條。" },
  manager: { badge: "應用實驗室", blurb: "英文、敘事、管理取向的所比較吃這條。" },
};

export const PROJECT_TRACK: Record<
  Exclude<ProjectTrack, "none">,
  { badge: string; blurb: string }
> = {
  research: { badge: "研究型專題", blurb: "過程與問題定義比較能寫進學術書審。" },
  product: { badge: "作品型專題", blurb: "能 demo 的東西，實務所比較買帳。" },
  data: { badge: "資料型專題", blurb: "分析與敘事並重，均衡所比較好講。" },
};

export const INTERN_TRACK: Record<
  Exclude<InternTrack, "none">,
  { badge: string; blurb: string }
> = {
  swe: { badge: "軟體實習", blurb: "工程與作品取向的所比較吃這段。" },
  lab: { badge: "研究實習", blurb: "學術所會把這段當成實驗室經驗。" },
  pm: { badge: "產品實習", blurb: "管理所比較在乎你怎麼講問題。" },
};

export const ROOMMATE_NAMES = ["何予安", "陳可安", "林書廷", "王啟恩"] as const;

export const OPPOSITE_ARCHETYPE: Record<ArchetypeId, ArchetypeId> = {
  scholar: "hacker",
  hacker: "scholar",
  social: "scholar",
  balanced: "hacker",
};

export const ROOMMATE_PREFS: Record<ArchetypeId, ActionId[]> = {
  scholar: ["gpa", "english", "advisor", "submit", "rest"],
  hacker: ["project", "hackathon", "intern", "cert", "advisor"],
  social: ["advisor", "english", "intern", "hackathon", "rest"],
  balanced: ["gpa", "project", "english", "advisor", "rest"],
};

export interface EvidenceDef {
  id: EvidenceId;
  name: string;
  blurb: string;
  empty: string;
  taste: string;
}

export const EVIDENCE: EvidenceDef[] = [
  { id: "transcript", name: "成績單", blurb: "GPA 取向的所最看這個。", empty: "永遠可以放。", taste: "通用" },
  { id: "paper", name: "論文", blurb: "學術所的硬證據。", empty: "還沒被接收。", taste: "學術所" },
  { id: "letter", name: "教授推薦", blurb: "有指導教授才寫得出來。", empty: "實驗室還沒收你。", taste: "學術所" },
  { id: "project", name: "專題作品", blurb: "完成度夠才能當門面。", empty: "作品還不夠硬。", taste: "均衡／作品" },
  { id: "intern", name: "實習證明", blurb: "實務所很吃這張。", empty: "還沒出過社會。", taste: "實務所" },
  { id: "english", name: "英文證明", blurb: "管理與書審敘事加分。", empty: "英文還沒到能放的程度。", taste: "管理所" },
  { id: "cert", name: "證照", blurb: "臺科大這類所會點頭。", empty: "證書夾是空的。", taste: "實務所" },
  { id: "hackathon", name: "競賽紀錄", blurb: "證明你能把東西做完。", empty: "還沒進過會場。", taste: "實務所" },
  { id: "labwork", name: "研究紀錄", blurb: "過程、失敗與實驗設計。學術所吃這個。", empty: "還沒走出可寫的研究過程。", taste: "學術所" },
];

export const INTERVIEW_BANK: Record<string, InterviewQuestion[]> = {
  學術: [
    {
      prompt: "這段研究裡，你自己真正負責哪一塊？",
      options: [
        {
          label: "我把問題收成可以驗證的一小段，失敗也有記",
          delta: 6,
          weakDelta: 0,
          reply: "範圍聽得完，委員點頭。",
          weakReply: "方向對，但書審裡沒有論文或研究紀錄，這句話像構想。",
          need: { papers: 1 },
        },
        {
          label: "我把系統跑穩，論文是實驗室一起的",
          delta: 4,
          weakDelta: -1,
          reply: "工程貢獻清楚。他們接受這是一條路。",
          weakReply: "沒有工程實驗室或作品撐腰，聽起來像把責任推掉。",
          need: { project: 40, projectTrack: "product" },
        },
        {
          label: "我跟著實驗設計走，主要把文獻補齊",
          delta: 5,
          weakDelta: -2,
          reply: "誠實，而且有指導關係當背景。",
          weakReply: "沒有指導教授，這句話會變成你一個人在講故事。",
          need: { advisor: true },
        },
      ],
    },
    {
      prompt: "GPA 如果不是這個所的舒適線，你怎麼講？",
      options: [
        {
          label: "時間換成論文與實驗，這是取捨，不是放棄",
          delta: 6,
          weakDelta: -1,
          reply: "有證據的取捨，委員會吃這套。",
          weakReply: "取捨講得漂亮，但論文還是空的。",
          need: { papers: 1 },
        },
        {
          label: "大二之後有把核心課補回來，曲線比單一數字清楚",
          delta: 4,
          weakDelta: 1,
          reply: "成績單本身還站得住。",
          weakReply: "曲線故事需要成績單先過得去。現在 GPA 還偏低。",
          need: { gpa: 3.4 },
        },
        {
          label: "實習跟專題佔了學期，成績是保底不是主菜",
          delta: 3,
          weakDelta: -2,
          reply: "實務所或許買帳；這裡有人皺眉，但至少有經歷。",
          weakReply: "沒有實習或作品，這句話只是成績不好的另一種說法。",
          need: { intern: true },
        },
      ],
    },
  ],
  實務: [
    {
      prompt: "你拿得出手、現在還跑得起來的東西是哪一件？",
      options: [
        {
          label: "專題。我把一個流程做到能給外人用",
          delta: 6,
          weakDelta: 0,
          reply: "完成度這題你過了。",
          weakReply: "聽起來像計畫。作品完成度還不夠硬。",
          need: { project: 40 },
        },
        {
          label: "實習時修過線上的問題，我把重現步驟寫進文件",
          delta: 5,
          weakDelta: -1,
          reply: "這是他們要的實務證據。",
          weakReply: "沒有實習，這句話沒有地方可以核對。",
          need: { intern: true },
        },
        {
          label: "黑客松那晚趕出來的 demo，後來我有把它收成能講的版本",
          delta: 4,
          weakDelta: 0,
          reply: "有火花，也有後續。",
          weakReply: "沒進過會場，這句話會被當成氣氛。",
          need: { hackathon: 1 },
        },
      ],
    },
    {
      prompt: "為什麼念研究所，而不是先把工作做滿？",
      options: [
        {
          label: "實習讓我看到自己缺的那塊，想回來補方法",
          delta: 6,
          weakDelta: 1,
          reply: "這理由站得住。",
          weakReply: "沒有實習，缺哪塊講不清楚。",
          need: { intern: true },
        },
        {
          label: "我已經能交作品，但還不會把問題寫成可以驗證的題目",
          delta: 5,
          weakDelta: 0,
          reply: "作品夠，動機也像研究生。",
          weakReply: "作品還不夠硬，這句話像提前認輸。",
          need: { project: 40 },
        },
        {
          label: "證照跟實作我都碰過，學位是把深度補上",
          delta: 3,
          weakDelta: -1,
          reply: "有量化證據，他們沒反對。",
          weakReply: "證書夾是空的，深度聽起來還是口號。",
          need: { certs: 1 },
        },
      ],
    },
  ],
  管理: [
    {
      prompt: "你怎麼跟不懂技術的人講你做過的事？",
      options: [
        {
          label: "先講誰痛、我改了什麼、結果是什麼",
          delta: 6,
          weakDelta: 1,
          reply: "敘事清楚。這個所吃這套。",
          weakReply: "句型對，但沒有產品實習或應用實驗室當現場。",
          need: { internTrack: "pm" },
        },
        {
          label: "我用英文寫過專題摘要，面試也能用簡單句講完",
          delta: 5,
          weakDelta: -1,
          reply: "英文證明有接上。",
          weakReply: "英文還沒到能當證據的程度。",
          need: { english: 55 },
        },
        {
          label: "我比較想寫程式，但實驗室逼我先講給外面的人聽",
          delta: 4,
          weakDelta: 0,
          reply: "應用實驗室的訓練對上了。",
          weakReply: "沒有這條實驗室，聽起來像不願意溝通。",
          need: { advisorTrack: "manager" },
        },
      ],
    },
    {
      prompt: "為什麼是這個所，不是隔壁純工程？",
      options: [
        {
          label: "我想站在系統跟組織中間，兩邊我都做過一點",
          delta: 6,
          weakDelta: 1,
          reply: "這是他們的語言。",
          weakReply: "中間人的故事需要實習或人脈當現場。",
          need: { intern: true },
        },
        {
          label: "我的專題本來就在問誰會用，而不只是能不能跑",
          delta: 5,
          weakDelta: 0,
          reply: "資料型專題對上了。",
          weakReply: "專題還不像能拿來問使用情境。",
          need: { projectTrack: "data" },
        },
        {
          label: "英文跟書審敘事是我比較穩的一塊，工程我還在補",
          delta: 4,
          weakDelta: -2,
          reply: "有自知之明，而且英文站得住。",
          weakReply: "英文證明偏弱，這句話變成兩邊都不穩。",
          need: { english: 55 },
        },
      ],
    },
  ],
  均衡: [
    {
      prompt: "專題、成績、實習，你這四年的主菜是哪一道？",
      options: [
        {
          label: "專題。成績保底，實習是配菜",
          delta: 5,
          weakDelta: 0,
          reply: "主軸清楚。",
          weakReply: "專題完成度還撐不起主菜。",
          need: { project: 40 },
        },
        {
          label: "成績。其他都是加分，我知道這間所先看成績單",
          delta: 4,
          weakDelta: -1,
          reply: "傳統，但有效。",
          weakReply: "成績單還沒到能當主菜的位置。",
          need: { gpa: 3.45 },
        },
        {
          label: "實習。學校教的我用一個夏天對過一次現場",
          delta: 5,
          weakDelta: -1,
          reply: "現場經驗對均衡所加分。",
          weakReply: "還沒出過社會，現場是空的。",
          need: { intern: true },
        },
      ],
    },
    {
      prompt: "如果備取，你下一步是什麼？",
      options: [
        {
          label: "考試入學當備案，這學期先把缺口補上",
          delta: 4,
          weakDelta: 2,
          reply: "有計畫。成績單也還能打仗。",
          weakReply: "有計畫，但 GPA 跟英文都偏薄，備案看起來吃力。",
          need: { gpa: 3.2 },
        },
        {
          label: "先把這份資料迭代一輪，再決定要不要先工作",
          delta: 3,
          weakDelta: 1,
          reply: "至少不是原封不動再投一次。",
          weakReply: "聽得出來還沒真的迭代過作品或論文。",
          need: { project: 40 },
        },
        {
          label: "工作一年。實習讓我知道這條路走得動",
          delta: 4,
          weakDelta: 0,
          reply: "這也是一條路，而且有實習當樣本。",
          weakReply: "沒有實習，先工作聽起來像備取的情緒。",
          need: { intern: true },
        },
      ],
    },
  ],
};

export const ROUTE_QUESTIONS: InterviewQuestion[] = [
  {
    prompt: "實驗室這段時間，你跟教授最常卡在哪？",
    options: [
      {
        label: "範圍。他要我寫得能投稿，我想先做完",
        delta: 6,
        weakDelta: -1,
        reply: "學術實驗室的日常，他們聽得出來。",
        weakReply: "沒有學術實驗室，這衝突像編的。",
        need: { advisorTrack: "academic" },
      },
      {
        label: "測試。他不看簡報，先看指令能不能重跑",
        delta: 5,
        weakDelta: -1,
        reply: "工程實驗室的味道。",
        weakReply: "沒有工程實驗室，這句話沒有現場。",
        need: { advisorTrack: "builder" },
      },
      {
        label: "聽眾。他逼我先講給業界的人聽，再回頭改題目",
        delta: 5,
        weakDelta: -1,
        reply: "應用實驗室的訓練對上了。",
        weakReply: "沒有這條實驗室，聽起來像你自己想像指導方式。",
        need: { advisorTrack: "manager" },
      },
    ],
  },
  {
    prompt: "實習跟專題，哪一段比較能代表你？",
    options: [
      {
        label: "研究實習。我第一次知道實驗失敗也要寫進去",
        delta: 6,
        weakDelta: 0,
        reply: "研究實習對學術敘事有用。",
        weakReply: "沒有研究實習，失敗被寫進去這件事沒有現場。",
        need: { internTrack: "lab" },
      },
      {
        label: "軟體實習。線上壞掉的那天，我才懂文件是給誰看的",
        delta: 5,
        weakDelta: 0,
        reply: "工程現場清楚。",
        weakReply: "沒有軟體實習，線上壞掉只是形容詞。",
        need: { internTrack: "swe" },
      },
      {
        label: "產品實習。我被問過三次「誰會用」，第三次才答得完",
        delta: 5,
        weakDelta: 0,
        reply: "管理所要的就是這個。",
        weakReply: "沒有產品實習，這句話像讀書會心得。",
        need: { internTrack: "pm" },
      },
    ],
  },
];
