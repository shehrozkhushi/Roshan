import type { Locale } from "@/lib/i18n";

type LocalizedText = Record<Locale, string>;

export type Post = {
  slug: string;
  category: LocalizedText;
  title: LocalizedText;
  excerpt: LocalizedText;
  publishedAt: string;
  readTime: number;
  accent: "blue" | "lime" | "coral";
  body: Record<Locale, string[]>;
  takeaway: LocalizedText;
};

export const posts: Post[] = [
  {
    slug: "design-systems-for-small-teams",
    category: { en: "Design", ur: "ڈیزائن" },
    title: {
      en: "Design systems small teams can actually maintain",
      ur: "چھوٹی ٹیموں کے لیے قابلِ عمل ڈیزائن سسٹم",
    },
    excerpt: {
      en: "A practical way to create consistency without turning your design system into a second full-time product.",
      ur: "ڈیزائن سسٹم کو ایک الگ کل وقتی پروڈکٹ بنائے بغیر کام میں ہم آہنگی پیدا کرنے کا عملی طریقہ۔",
    },
    publishedAt: "2026-06-18",
    readTime: 6,
    accent: "blue",
    body: {
      en: [
        "A design system should make the everyday work easier. Yet small teams often inherit a version built for an organisation ten times their size: dozens of component states, elaborate governance, and documentation nobody has time to maintain.",
        "Start with repeated decisions, not a component inventory. Look across three recent features and write down the choices your team keeps making again: spacing, hierarchy, form behaviour, empty states, and feedback. Those repetitions are the useful beginning of a system.",
        "Treat documentation as part of the component. A short note explaining when to use something—and when not to—prevents more inconsistency than another variation. Give each pattern a clear owner, review it during real product work, and let the system grow only when the product asks it to.",
        "The right system for a small team is deliberately incomplete. It covers the stable, high-frequency decisions and leaves room for thoughtful exceptions. Consistency is valuable, but only when it serves understanding.",
      ],
      ur: [
        "ڈیزائن سسٹم کو روزمرہ کا کام آسان بنانا چاہیے۔ مگر چھوٹی ٹیموں کو اکثر ایسا نظام ملتا ہے جو ان سے دس گنا بڑی کمپنی کے لیے بنا ہوتا ہے: بے شمار کمپوننٹ حالتیں، پیچیدہ قواعد اور ایسی دستاویزات جنہیں برقرار رکھنے کا وقت کسی کے پاس نہیں۔",
        "کمپوننٹس کی فہرست کے بجائے بار بار ہونے والے فیصلوں سے آغاز کریں۔ حالیہ تین فیچرز دیکھیں اور ان انتخاب کو نوٹ کریں جو ٹیم بار بار کرتی ہے: فاصلہ، بصری ترتیب، فارم کا رویہ، خالی حالتیں اور صارف کو ملنے والا ردِعمل۔ یہی تکرار ایک مفید نظام کی بنیاد ہے۔",
        "دستاویزات کو کمپوننٹ کا حصہ سمجھیں۔ ایک مختصر نوٹ کہ کسی پیٹرن کو کب استعمال کرنا ہے اور کب نہیں، ایک اور غیر ضروری شکل بنانے سے زیادہ فائدہ دیتا ہے۔ ہر پیٹرن کا واضح ذمہ دار مقرر کریں اور اسے حقیقی پروڈکٹ کے کام کے دوران بہتر بنائیں۔",
        "چھوٹی ٹیم کے لیے درست سسٹم جان بوجھ کر نامکمل ہوتا ہے۔ یہ مستحکم اور کثرت سے ہونے والے فیصلوں کو سنبھالتا ہے اور سوچے سمجھے استثنا کی گنجائش چھوڑتا ہے۔ ہم آہنگی تبھی قیمتی ہے جب وہ سمجھ میں اضافہ کرے۔",
      ],
    },
    takeaway: {
      en: "Build the smallest system that removes repeated decisions. Let real product work decide what belongs next.",
      ur: "اتنا ہی مختصر نظام بنائیں جو بار بار کے فیصلے کم کرے۔ اگلا قدم حقیقی پروڈکٹ کے کام کو طے کرنے دیں۔",
    },
  },
  {
    slug: "fast-bilingual-nextjs-experience",
    category: { en: "Engineering", ur: "انجینئرنگ" },
    title: {
      en: "Building a fast bilingual Next.js experience",
      ur: "تیز رفتار دو لسانی Next.js تجربہ کیسے بنائیں",
    },
    excerpt: {
      en: "How thoughtful routing, typography, RTL support, and content structure create a seamless multilingual website.",
      ur: "بہتر روٹنگ، موزوں خط، دائیں سے بائیں معاونت اور منظم مواد سے ہموار کثیر لسانی ویب سائٹ بنانے کا طریقہ۔",
    },
    publishedAt: "2026-05-29",
    readTime: 8,
    accent: "lime",
    body: {
      en: [
        "A bilingual experience is not an English interface with translated strings layered on top. Language changes rhythm, hierarchy, density, reading direction, and sometimes the order in which information makes sense.",
        "Give each locale a stable route. It makes navigation predictable, allows pages to be indexed correctly, and lets someone share the exact language they are viewing. Keep dictionary keys typed and content close to the page that uses it so missing translations fail during development.",
        "Right-to-left support begins with the document direction, but it does not end there. Use logical CSS properties, isolate email addresses and technical terms, and inspect every directional icon. Arrows may need to turn; familiar media and theme symbols should not.",
        "Performance comes from restraint. Render most translated content on the server, keep interactive client components small, and avoid loading two entire interfaces in the browser. The fastest language switch is the one designed into the architecture from the first commit.",
      ],
      ur: [
        "دو لسانی تجربہ صرف انگریزی انٹرفیس پر ترجمہ شدہ الفاظ رکھنے کا نام نہیں۔ زبان رفتار، بصری ترتیب، مواد کی کثافت، پڑھنے کی سمت اور بعض اوقات معلومات کے منطقی سلسلے کو بھی بدلتی ہے۔",
        "ہر زبان کو مستقل راستہ دیں۔ اس سے نیویگیشن واضح ہوتی ہے، صفحات درست طور پر سرچ میں آتے ہیں اور صارف اسی زبان کا لنک شیئر کر سکتا ہے جو وہ دیکھ رہا ہے۔ ڈکشنری کی keys کو TypeScript سے محفوظ کریں تاکہ نامکمل ترجمہ ڈیولپمنٹ میں ہی سامنے آ جائے۔",
        "دائیں سے بائیں معاونت دستاویز کی سمت سے شروع ہوتی ہے مگر وہیں ختم نہیں ہوتی۔ منطقی CSS خصوصیات استعمال کریں، ای میل اور تکنیکی اصطلاحات کو الگ سمت دیں اور ہر سمت والے آئیکن کا جائزہ لیں۔ تیر بدل سکتے ہیں، مانوس میڈیا اور تھیم آئیکنز نہیں۔",
        "تیز کارکردگی سادگی سے آتی ہے۔ زیادہ تر ترجمہ شدہ مواد سرور پر تیار کریں، انٹرایکٹو کلائنٹ کمپوننٹس مختصر رکھیں اور براؤزر میں بیک وقت دو مکمل انٹرفیس لوڈ نہ کریں۔ بہترین زبان تبدیلی وہ ہے جو پہلے دن سے ساخت میں شامل ہو۔",
      ],
    },
    takeaway: {
      en: "Treat language and direction as architecture, not decoration. The result is faster, clearer, and easier to maintain.",
      ur: "زبان اور سمت کو آرائش نہیں بلکہ بنیادی ساخت سمجھیں۔ نتیجہ زیادہ تیز، واضح اور قابلِ نگہداشت ہوگا۔",
    },
  },
  {
    slug: "useful-discovery-phase",
    category: { en: "Strategy", ur: "حکمتِ عملی" },
    title: {
      en: "What a useful discovery phase should uncover",
      ur: "ایک مؤثر ابتدائی تحقیق کیا واضح کرتی ہے؟",
    },
    excerpt: {
      en: "The questions and decisions that help teams reduce risk before design and development begin.",
      ur: "وہ سوالات اور فیصلے جو ڈیزائن اور ڈیولپمنٹ سے پہلے خطرات کم کرنے میں ٹیموں کی مدد کرتے ہیں۔",
    },
    publishedAt: "2026-04-11",
    readTime: 5,
    accent: "coral",
    body: {
      en: [
        "Discovery is useful when it changes what a team does next. A collection of interviews and attractive workshop boards is not an outcome; a smaller set of better decisions is.",
        "Begin by naming the uncertainty. Are we unsure who has the problem, whether it is important enough to solve, which behaviour must change, or whether the proposed solution is viable? Different uncertainty needs different evidence.",
        "Talk to the people closest to the problem, inspect existing data, and observe current workarounds. Look especially for the gap between what people say they do and what their tools or habits reveal. That gap often holds the most valuable product opportunity.",
        "Finish discovery with choices: the audience to prioritise, the job to improve, the assumptions still at risk, and the smallest release that can teach you something. A good discovery phase creates momentum because everyone can explain the same next step.",
      ],
      ur: [
        "ابتدائی تحقیق تب مفید ہے جب وہ ٹیم کے اگلے قدم کو بدل دے۔ انٹرویوز اور خوبصورت ورکشاپ بورڈز کا مجموعہ نتیجہ نہیں؛ کم مگر بہتر فیصلے اصل نتیجہ ہیں۔",
        "غیر یقینی بات کا نام لینے سے آغاز کریں۔ کیا ہمیں معلوم نہیں کہ مسئلہ کس کا ہے، کیا وہ حل کرنے کے قابل اہم ہے، کون سا رویہ بدلنا چاہیے، یا تجویز کردہ حل قابلِ عمل ہے؟ ہر قسم کی غیر یقینی کے لیے مختلف ثبوت درکار ہوتے ہیں۔",
        "مسئلے کے قریب لوگوں سے بات کریں، موجودہ ڈیٹا دیکھیں اور عارضی حل کا مشاہدہ کریں۔ خاص طور پر اس فرق کو دیکھیں جو لوگوں کی بات اور ان کے عملی رویے میں ہے۔ اکثر یہی فرق سب سے قیمتی پروڈکٹ موقع دکھاتا ہے۔",
        "تحقیق کو واضح انتخاب پر ختم کریں: کس صارف کو ترجیح دینی ہے، کون سا کام بہتر کرنا ہے، کون سے مفروضے اب بھی خطرے میں ہیں اور سب سے مختصر ریلیز کیا سکھا سکتی ہے۔ اچھی تحقیق رفتار پیدا کرتی ہے کیونکہ سب ایک ہی اگلا قدم بیان کر سکتے ہیں۔",
      ],
    },
    takeaway: {
      en: "A discovery phase earns its value by replacing important assumptions with evidence and ending in explicit choices.",
      ur: "ابتدائی تحقیق اہم مفروضوں کو ثبوت سے بدل کر اور واضح انتخاب پر ختم ہو کر اپنی قدر ثابت کرتی ہے۔",
    },
  },
];

export function getLocalizedPosts(locale: Locale) {
  return posts.map((post) => ({
    slug: post.slug,
    category: post.category[locale],
    title: post.title[locale],
    excerpt: post.excerpt[locale],
    publishedAt: post.publishedAt,
    readTime: post.readTime,
    accent: post.accent,
  }));
}

export function getPost(slug: string) {
  return posts.find((post) => post.slug === slug);
}
